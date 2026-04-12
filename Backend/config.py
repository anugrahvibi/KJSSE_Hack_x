from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

WS_HEARTBEAT_SECONDS = int(os.getenv("WS_HEARTBEAT_SECONDS", "20"))
OVERDUE_CHECK_SECONDS = int(os.getenv("OVERDUE_CHECK_SECONDS", "60"))

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_NUMBER = os.getenv("TWILIO_NUMBER", "")
TWILIO_DESTINATION_NUMBER = os.getenv("TWILIO_DESTINATION_NUMBER", "+919074121510")

LOGS_DIR.mkdir(parents=True, exist_ok=True)
