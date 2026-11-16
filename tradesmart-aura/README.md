# TradeSmart AI - Frontend

The marketing site + live chatbot demo, built with React, Vite, and
Tailwind. The chatbot (`src/components/ChatDemo.tsx`, embedded via
`LiveDemoWindow.tsx`) is a real, working chat - it calls a local Flask
backend for actual ML predictions and writes real records to SQL
Server. It is not a scripted animation.

The chat only asks for make, model, year, and mileage - exactly what
the trained model actually uses. It does not ask about condition or
damage, since the model was never trained on that and pretending
otherwise would be misleading (see `../tradesmart-backend/README.md`
for the full reasoning).

## Running it

**Everyday use:** you don't run this folder directly at all. The
backend (`../tradesmart-backend`) builds this app once and serves it
itself - see "One click" in `../tradesmart-backend/README.md`. Just
double-click `Start TradeSmart AI.bat` in the project root.

**While actively editing the UI**, hot-reloading is faster:

```
npm install
npm run dev
```

Open http://localhost:5173, with the backend also running (`python
app.py` in `tradesmart-backend`, in a separate terminal) - see
`../tradesmart-backend/README.md`. Without the backend running, the
chat will still walk you through every question, but the final "Get my
estimate" step will show a friendly error instead of a result.

Whenever you're done editing, run `npm run build` here so the one-click
launcher picks up your changes (it serves the built file, not your
live source).

If you run the backend on a different port or machine, point the
frontend at it with a `.env` file in this folder:

```
VITE_API_BASE_URL=http://localhost:5000
```

## What's real vs. illustrative

Everything in the chat flow is live: the make/model search queries the
real 16,456-listing Autotrader dataset, the price estimate comes from
the actual trained XGBoost model (see `../tradesmart-ml`), and every
completed chat writes a real row to your SQL Server database. The rest
of the page (testimonials, pricing tiers,
logo cloud) is marketing content for the landing page and was not
built from real data - it's fine to keep as-is for a presentation, but
don't present those specific numbers/quotes as real.
