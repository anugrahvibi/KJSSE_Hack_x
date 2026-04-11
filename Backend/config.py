from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

WS_HEARTBEAT_SECONDS = int(os.getenv("WS_HEARTBEAT_SECONDS", "20"))
OVERDUE_CHECK_SECONDS = int(os.getenv("OVERDUE_CHECK_SECONDS", "60"))

LOGS_DIR.mkdir(parents=True, exist_ok=True)
