"""
TradeSmart AI backend - Flask API.

Serves the chatbot's valuation flow: the React frontend (tradesmart-aura)
calls these endpoints as the customer answers each question. See
README.md for how to run this locally alongside the frontend and your
SQL Server database.

Endpoints:
  GET  /api/health                 - connectivity/status check
  GET  /api/vehicles/search?q=...  - make/model autocomplete (exact-match
                                      picks are required so the valuation
                                      lookup in ml_service.py can find a
                                      real spec profile for that vehicle)
  POST /api/valuation/estimate     - runs the full flow: predicts a value
                                      range from make/model/year/mileage,
                                      writes the customer/session/
                                      conversation log to SQL Server (or
                                      the in-memory stand-in - see db.py),
                                      and returns the result.

NOTE: this deliberately does NOT ask about or use condition/damage
details (dents, accidents, respray, mods). The trained model only
ever saw make/model/year/mileage/spec features - it was never trained
on damage data - so asking about condition and not using it would be
misleading UX. If a condition-aware valuation is wanted later, that
needs new labelled training data, not just re-adding this question.
"""

import os
import webbrowser
from pathlib import Path
from threading import Timer

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from dotenv import load_dotenv
load_dotenv()

import ml_service
import db

# The built frontend (npm run build, run from tradesmart-aura) is a single
# self-contained dist/index.html - see tradesmart-aura/README.md. When it
# exists we serve it directly from this Flask process, so the whole app
# runs from one process/port instead of needing a separate `npm run dev`
# terminal. If it hasn't been built yet, the API still works on its own
# (useful during frontend development against `npm run dev`).
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "tradesmart-aura" / "dist"

app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
CORS(app)  # harmless in production (same-origin); needed if you still run `npm run dev` separately


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "dbEnabled": db.DB_ENABLED,
        "dbServer": db.DB_SERVER if db.DB_ENABLED else None,
    })


@app.get("/api/vehicles/search")
def search_vehicles():
    query = request.args.get("q", "")
    results = ml_service.service.search_vehicles(query, limit=10)
    return jsonify({"results": results})


@app.post("/api/valuation/estimate")
def valuation_estimate():
    body = request.get_json(silent=True) or {}

    customer = body.get("customer") or {}
    vehicle = body.get("vehicle") or {}
    deposit_amount = body.get("depositAmount")

    full_name = (customer.get("fullName") or "").strip()
    brand = (vehicle.get("brand") or "").strip()
    model = (vehicle.get("model") or "").strip()
    year = vehicle.get("year")
    mileage = vehicle.get("mileage")

    missing = [name for name, val in [
        ("customer.fullName", full_name), ("vehicle.brand", brand),
        ("vehicle.model", model), ("vehicle.year", year), ("vehicle.mileage", mileage),
    ] if not val]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    try:
        year = int(year)
        mileage = int(mileage)
    except (TypeError, ValueError):
        return jsonify({"error": "vehicle.year and vehicle.mileage must be numbers"}), 400

    # --- 1. ML valuation (spec lookup + XGBoost prediction) ---
    # This never touches the database, so a customer always gets a price
    # even if step 2 below fails.
    try:
        valuation = ml_service.service.estimate(brand, model, year, mileage)
    except Exception:
        app.logger.exception("ML valuation failed")
        return jsonify({"error": "Couldn't compute a valuation for that vehicle. Check the backend terminal for details."}), 500

    # --- 2. Persist: customer, session, conversation log ---
    # Wrapped on its own: if SQL Server isn't reachable yet (wrong .env,
    # ODBC driver missing, database script not run), that's a setup
    # problem, not a reason to lose the customer's estimate. We log the
    # real error to the terminal (so it can be diagnosed) and still return
    # the valuation, with a warning flag the frontend can show.
    customer_id = None
    session_id = None
    db_warning = None
    try:
        customer_id = db.create_customer(
            full_name=full_name,
            contact_number=(customer.get("contactNumber") or None) if customer.get("popiaConsent") else None,
            email=(customer.get("email") or None) if customer.get("popiaConsent") else None,
            popia_consent=bool(customer.get("popiaConsent")),
        )

        session_id = db.create_session(
            customer_id=customer_id,
            make=brand, model=model, year=year, mileage=mileage,
            estimated_low=valuation["estimated_low"], estimated_high=valuation["estimated_high"],
            model_used=valuation["model_used"],
            deposit_amount=deposit_amount,
        )

        turns = [
            ("Bot", "Hi! Let's get an estimate for your trade-in. What's the make, model, and year of your vehicle?"),
            ("Customer", f"{year} {brand} {model}"),
            ("Bot", "Thanks. Roughly how many kilometres has it done?"),
            ("Customer", f"{mileage} km"),
            ("Bot", f"Thanks - based on this, your estimated trade-in value is "
                    f"R{valuation['estimated_low']:,.0f}-R{valuation['estimated_high']:,.0f}. "
                    f"A consultant will confirm the final figure with you shortly."),
        ]
        for i, (sender, text) in enumerate(turns, start=1):
            db.log_turn(session_id, i, sender, text)
    except Exception as exc:
        app.logger.exception("Database write failed - see the error above for the real cause "
                              "(common ones: ODBC driver not installed, DB_SERVER wrong in .env, "
                              "or TradeSmartAI_Database.sql not run yet)")
        customer_id = None
        session_id = None
        db_warning = (
            "Your estimate is shown below, but it couldn't be saved to the database. "
            f"({exc.__class__.__name__}: check the backend terminal window for the full error, "
            "and see Troubleshooting in tradesmart-backend/README.md.)"
        )

    response = {
        "sessionId": session_id,
        "customerId": customer_id,
        "vehicle": {"brand": brand, "model": model, "year": year, "mileage": mileage},
        "valuation": valuation,
        "disclaimer": (
            "This is an AI-generated first-pass estimate for your reference. "
            "A dealership consultant will review it and confirm the final figure "
            "before anything is presented as a firm offer."
        ),
    }
    if db_warning:
        response["dbWarning"] = db_warning
    return jsonify(response)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve the built React app for any non-API route.

    This is what makes the whole thing a single click: the frontend isn't
    a separate dev server anymore, it's just files this Flask process
    hands back. `path` covers things like /assets/foo.js if the build ever
    stops being a single-file bundle; the catch-all falls back to
    index.html so client-side routing (if any is added later) still works.
    """
    if not FRONTEND_DIST.exists():
        return jsonify({
            "error": "Frontend not built yet. Run 'npm run build' inside tradesmart-aura, "
                     "then restart this backend.",
        }), 404
    target = FRONTEND_DIST / path
    if path and target.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


def _open_browser(port):
    webbrowser.open(f"http://localhost:{port}/")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Only auto-open a browser tab for the normal one-click launch, not for
    # the Flask debug reloader's internal second process (which would
    # otherwise pop a second tab every time a file is saved).
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true" and not os.environ.get("NO_BROWSER"):
        Timer(1.0, _open_browser, args=(port,)).start()
    app.run(host="0.0.0.0", port=port, debug=True)
