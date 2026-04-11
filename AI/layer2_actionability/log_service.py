# Log Service
# Responsible for accountability and logging
import json
import os
from datetime import datetime, timezone

LOG_FILE = "AI/data/accountability.jsonl"

def ensure_log_exists():
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    if not os.path.exists(LOG_FILE):
        open(LOG_FILE, 'w').close()

def log_dispatch(alert_id: str, ward_id: str,
                  dept: str, action: str,
                  priority: str,
                  deadline_minutes: int) -> dict:
    ensure_log_exists()
    entry = {
        "event": "DISPATCH",
        "alert_id": alert_id,
        "ward_id": ward_id,
        "dept": dept,
        "action": action,
        "priority": priority,
        "deadline": deadline_minutes,
        "dispatched_at": datetime.now(
            timezone.utc
        ).isoformat()
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry

def log_acknowledgment(alert_id: str,
                        dept: str,
                        status: str) -> dict:
    ensure_log_exists()
    entry = {
        "event": "RESPONSE",
        "alert_id": alert_id,
        "dept": dept,
        "status": status,
        "responded_at": datetime.now(
            timezone.utc
        ).isoformat()
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry

def log_overdue(alert_id: str, dept: str,
                 action: str) -> dict:
    ensure_log_exists()
    entry = {
        "event": "OVERDUE",
        "alert_id": alert_id,
        "dept": dept,
        "action_ignored": action,
        "flagged_at": datetime.now(
            timezone.utc
        ).isoformat()
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry

def get_all_entries(ward_id: str = None) -> list:
    ensure_log_exists()
    entries = []
    with open(LOG_FILE, "r") as f:
        for line in f:
            if line.strip():
                entry = json.loads(line)
                if ward_id is None or \
                   entry.get("ward_id") == ward_id:
                    entries.append(entry)
    return entries