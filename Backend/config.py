from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

WS_HEARTBEAT_SECONDS = int(os.getenv("WS_HEARTBEAT_SECONDS", "20"))
OVERDUE_CHECK_SECONDS = int(os.getenv("OVERDUE_CHECK_SECONDS", "60"))

LOGS_DIR.mkdir(parents=True, exist_ok=True)
