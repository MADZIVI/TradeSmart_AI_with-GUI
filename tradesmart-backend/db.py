"""
TradeSmart AI backend - SQL Server data access layer.

All the actual T-SQL lives here, isolated from app.py and ml_service.py,
for two reasons:
  1. Every INSERT here has to match TradeSmartAI_Database.sql's schema
     exactly (column names, NOT NULL constraints, FK requirements) -
     keeping it in one file makes that easy to audit against the .sql
     script if the schema ever changes.
  2. Set DB_ENABLED=false (see .env.example) to run the rest of the
     backend - the ML/NLP logic, the chat flow, the frontend - without
     a SQL Server connection at all. That's how this backend was
     developed and tested: SQL Server only exists on your Windows PC,
     never reachable from wherever this code is being written/tested
     ahead of time, so this flag lets the two be verified separately.
     With DB_ENABLED=false, IDs are fake (in-memory counters) and
     nothing is written to disk or a database - useful for a dry run
     before wiring up the real connection string.

Setup on your PC: install the "ODBC Driver 17 for SQL Server" from
Microsoft (see README.md), then set DB_SERVER / DB_TRUSTED_CONNECTION
(or DB_USER/DB_PASSWORD) in a .env file copied from .env.example.
"""

import os
import threading


DB_ENABLED = os.environ.get("DB_ENABLED", "true").lower() not in ("false", "0", "no")

DB_SERVER = os.environ.get("DB_SERVER", r"localhost\SQLEXPRESS")
DB_NAME = os.environ.get("DB_NAME", "TradeSmartAI")
DB_DRIVER = os.environ.get("DB_DRIVER", "ODBC Driver 17 for SQL Server")
DB_TRUSTED_CONNECTION = os.environ.get("DB_TRUSTED_CONNECTION", "yes")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")


def _build_connection_string() -> str:
    parts = [f"DRIVER={{{DB_DRIVER}}}", f"SERVER={DB_SERVER}", f"DATABASE={DB_NAME}"]
    if DB_USER:
        parts.append(f"UID={DB_USER}")
        parts.append(f"PWD={DB_PASSWORD}")
    else:
        parts.append(f"Trusted_Connection={DB_TRUSTED_CONNECTION}")
    return ";".join(parts) + ";"


def get_connection():
    """Only imports pyodbc when actually needed, so DB_ENABLED=false
    environments (e.g. this backend running somewhere without the ODBC
    driver installed) never need pyodbc importable at all."""
    import pyodbc
    return pyodbc.connect(_build_connection_string())


# ---------------------------------------------------------------------
# In-memory stand-in used when DB_ENABLED=false, so the rest of the
# backend can be exercised without a real database.
# ---------------------------------------------------------------------
class _FakeDb:
    def __init__(self):
        self._lock = threading.Lock()
        self._next_customer_id = 1
        self._next_session_id = 1
        self.customers = {}
        self.sessions = {}
        self.conversation_log = []

    def create_customer(self, full_name, contact_number, email, popia_consent):
        with self._lock:
            cid = self._next_customer_id
            self._next_customer_id += 1
        self.customers[cid] = {
            "FullName": full_name, "ContactNumber": contact_number,
            "Email": email, "POPIAConsentGiven": popia_consent,
        }
        return cid

    def create_session(self, customer_id, make, model, year, mileage,
                        estimated_low, estimated_high, model_used, deposit_amount):
        with self._lock:
            sid = self._next_session_id
            self._next_session_id += 1
        self.sessions[sid] = {
            "CustomerID": customer_id, "Make": make, "Model": model,
            "VehicleYear": year, "Mileage": mileage,
            "EstimatedValueLow": estimated_low, "EstimatedValueHigh": estimated_high,
            "ValuationModelUsed": model_used, "DesiredCashDeposit": deposit_amount,
            "ReviewStatus": "Pending",
        }
        return sid

    def log_turn(self, session_id, message_order, sender, message_text):
        self.conversation_log.append({
            "SessionID": session_id, "MessageOrder": message_order,
            "Sender": sender, "MessageText": message_text,
        })


_fake_db = _FakeDb()


# ---------------------------------------------------------------------
# Public functions used by app.py - each dispatches to real SQL Server
# or the in-memory fake depending on DB_ENABLED.
# ---------------------------------------------------------------------
def create_customer(full_name: str, contact_number: str, email: str, popia_consent: bool) -> int:
    if not DB_ENABLED:
        return _fake_db.create_customer(full_name, contact_number, email, popia_consent)

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO dbo.Customers (FullName, ContactNumber, Email, POPIAConsentGiven)
            OUTPUT INSERTED.CustomerID
            VALUES (?, ?, ?, ?)
            """,
            full_name, contact_number, email, 1 if popia_consent else 0,
        )
        customer_id = cur.fetchone()[0]
        conn.commit()
        return customer_id
    finally:
        conn.close()


def create_session(customer_id: int, make: str, model: str, year: int, mileage: int,
                    estimated_low: float, estimated_high: float, model_used: str,
                    deposit_amount) -> int:
    if not DB_ENABLED:
        return _fake_db.create_session(
            customer_id, make, model, year, mileage,
            estimated_low, estimated_high, model_used, deposit_amount,
        )

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO dbo.ValuationSessions
                (CustomerID, Make, Model, VehicleYear, Mileage,
                 EstimatedValueLow, EstimatedValueHigh, ValuationModelUsed,
                 DesiredCashDeposit, SessionCompletedAt)
            OUTPUT INSERTED.SessionID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME())
            """,
            customer_id, make, model, int(year), int(mileage),
            estimated_low, estimated_high, model_used, deposit_amount,
        )
        session_id = cur.fetchone()[0]
        conn.commit()
        return session_id
    finally:
        conn.close()


def log_turn(session_id: int, message_order: int, sender: str, message_text: str) -> None:
    if not DB_ENABLED:
        _fake_db.log_turn(session_id, message_order, sender, message_text)
        return

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO dbo.ValuationConversationLog (SessionID, MessageOrder, Sender, MessageText)
            VALUES (?, ?, ?, ?)
            """,
            session_id, message_order, sender, message_text[:1000],  # column is NVARCHAR(1000)
        )
        conn.commit()
    finally:
        conn.close()
