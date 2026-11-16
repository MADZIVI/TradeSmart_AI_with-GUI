# TradeSmart AI - Backend (Flask API)

This is the API that connects the chatbot frontend to your SQL Server
database and to the trained ML model from `tradesmart-ml`. It runs
locally on your PC, next to the frontend and your SQL Server instance
(it can't run in the cloud the way the ML training scripts were tested,
because it needs a live connection to your local SQL Server).

## What it does

When a customer finishes the chat flow, this backend:

1. Looks up typical specs (engine, torque, fuel consumption, etc.) for
   their exact make/model from the real Autotrader listings data, since
   a customer can only tell the chatbot what they actually know (make,
   model, year, mileage) - not a full spec sheet. See the docstring at
   the top of `ml_service.py` for the full reasoning.
2. Runs the trained XGBoost pipeline (from `tradesmart-ml`) to get a
   price estimate, with a range built from the model's own measured
   test-set MAE (not a made-up percentage).
3. Writes a Customer, a ValuationSession, and the conversation log to
   your SQL Server database (`TradeSmartAI` - the one built in
   `TradeSmartAI_Database.sql`).

**Deliberately does NOT ask about condition/damage** (dents, accidents,
respray, mods). The Autotrader dataset the model was trained on is
market listings, not trade-ins with damage history, so the model has
no real basis to adjust a price for a "small dent" - asking about it
and not using it would be misleading. The chatbot only asks for, and
only uses, what actually drives the number: make, model, year, and
mileage. (An earlier version of this backend did include a separate
NLP condition parser purely for display/logging - it's been removed
from this flow to keep the chatbot honest about what the model does.
The NLP work itself still exists and is evaluated on its own terms in
`tradesmart-ml/src/nlp_parser.py`, it's just not wired into this live
estimate.)

## 1. Install the ODBC Driver (Windows-only, one-time)

pyodbc (the Python library that talks to SQL Server) needs Microsoft's
ODBC driver installed separately - it's not a Python package.

1. Download "ODBC Driver 17 for SQL Server" from Microsoft:
   https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   (choose the Windows x64 installer, run it, accept the defaults).
2. Confirm it installed, in PowerShell:
   ```
   Get-OdbcDriver | Where-Object Name -like "*SQL Server*"
   ```
   You should see "ODBC Driver 17 for SQL Server" in the list.

## 2. Set up the backend

You already have a Python virtual environment set up from
`tradesmart-ml` - you can reuse it, or make a fresh one here. From
inside this `tradesmart-backend` folder:

```
py -3.12 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Now configure your database connection:

```
copy .env.example .env
```

Open `.env` in a text editor and check `DB_SERVER` matches what you
connect to in SSMS (look at the server name in SSMS's "Connect to
Server" dialog - it's often `localhost\SQLEXPRESS` or just your PC
name). Leave `DB_TRUSTED_CONNECTION=yes` and `DB_USER`/`DB_PASSWORD`
blank if you connect via Windows Authentication in SSMS (most likely,
for a local dev setup).

## 3. Build the frontend once

This backend serves the chat UI itself (see "Everyday use" below), so
the React app needs to be built to static files once. From the
`tradesmart-aura` folder:

```
npm install
npm run build
```

That creates `tradesmart-aura/dist/index.html` - a single self-contained
file. You only need to redo this if you (or your teammates) change the
frontend code later; day-to-day, you don't touch this step.

## 4. Run it

```
python app.py
```

You should see `Running on http://127.0.0.1:5000`, and your browser
should open to the app automatically. Leave this terminal open - it
needs to keep running while you use the chatbot. Check it's alive by
opening http://localhost:5000/api/health - it should show
`"dbEnabled": true`.

**If you want to test the backend before your database is set up or
the ODBC driver is installed:** set `DB_ENABLED=false` in `.env`
first. The backend will run and the chatbot will fully work, but
nothing gets saved anywhere - customer/session IDs returned will be
fake placeholder numbers. Switch it back to `true` once your database
connection is confirmed working.

## Everyday use: one click

Once steps 1-3 above are done (one-time setup), you don't need to run
`python app.py` by hand or start the frontend separately. Double-click
**`Start TradeSmart AI.bat`** in the project's root folder (next to
this `tradesmart-backend` folder). It activates the virtual
environment, starts this backend, and opens your browser to the app -
one click, one window. The backend now serves the built frontend
itself (from `tradesmart-aura/dist/index.html`) alongside the `/api/*`
routes, so there's no separate Vite terminal to run. SQL Server
doesn't need a manual click either - it starts automatically as a
Windows background service.

If you change any frontend code, re-run `npm run build` inside
`tradesmart-aura` before your next click - the batch file always
serves whatever was last built, not your unsaved source changes.

Still want the old dev workflow (hot-reloading frontend while you edit
it)? Run `python app.py` in one terminal and `npm run dev` in a second,
from `tradesmart-aura` - same as before, useful while actively coding
the UI.

## Troubleshooting

- **"Couldn't reach the TradeSmart AI backend"** in the chat UI - this
  Flask terminal isn't running, or crashed. Check this terminal for an
  error and re-run `python app.py`.
- **pyodbc.InterfaceError / "Data source name not found"** - the ODBC
  driver isn't installed, or `DB_DRIVER` in `.env` doesn't match the
  exact name `Get-OdbcDriver` showed you.
- **Login failed / connection refused** - check `DB_SERVER` in `.env`
  against what SSMS uses to connect, and make sure SQL Server's
  service is actually running (open SQL Server Configuration Manager,
  or just check you can still connect via SSMS).
- **"Invalid object name 'dbo.Customers'"** - `TradeSmartAI_Database.sql`
  hasn't been run against this SQL Server instance yet (or was run
  against a differently-named database - check `DB_NAME` in `.env`
  matches, default is `TradeSmartAI`).
- **CORS error in the browser console** - shouldn't happen (flask-cors
  is enabled for all origins in `app.py`), but if you changed the
  frontend's port, it doesn't matter - CORS here isn't restricted by
  origin.
