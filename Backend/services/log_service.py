from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from ..models.alert import ActionPlan, AlertRecord, AlertStatus


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class AccountabilityLogService:
    def __init__(self, log_path: Path):
        self.log_path = log_path
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.log_path.touch(exist_ok=True)
        self.alerts: dict[str, AlertRecord] = {}
        self._next_id = 1

    def _append(self, payload: dict) -> None:
        with self.log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")

    def _new_alert_id(self) -> str:
        alert_id = f"ALT-{self._next_id:03d}"
        self._next_id += 1
        return alert_id

    def create_dispatches(self, ward_id: str, plan: ActionPlan, dispatched_at: str | None = None) -> list[AlertRecord]:
        ts = dispatched_at or now_iso()
        created: list[AlertRecord] = []

        for action in plan.actions:
            alert_id = self._new_alert_id()
            deadline_dt = parse_iso(ts) + timedelta(minutes=action.deadline_minutes)
            deadline = deadline_dt.isoformat().replace("+00:00", "Z")
            record = AlertRecord(
                alert_id=alert_id,
                ward_id=ward_id,
                dept=action.dept_id,
                action=action.action,
                priority=action.priority,
                deadline=deadline,
                timestamp=ts,
                status=AlertStatus.DISPATCHED,
            )
            self.alerts[alert_id] = record
            created.append(record)

            self._append(
                {
                    "event": "DISPATCH",
                    "alert_id": alert_id,
                    "ward_id": ward_id,
                    "dept": action.dept_id,
                    "action": action.action,
                    "priority": action.priority,
                    "deadline": deadline,
                    "dispatched_at": ts,
                }
            )
        return created

    def acknowledge(self, alert_id: str, dept_id: str, status: AlertStatus = AlertStatus.ACKNOWLEDGED) -> AlertRecord:
        if alert_id not in self.alerts:
            raise KeyError(f"Unknown alert_id: {alert_id}")

        alert = self.alerts[alert_id]
        if alert.dept != dept_id:
            raise ValueError("Department does not match alert owner")

        responded_at = now_iso()
        response_seconds = int((parse_iso(responded_at) - parse_iso(alert.timestamp)).total_seconds())

        alert.status = status
        alert.responded_at = responded_at
        alert.response_time_seconds = response_seconds

        self._append(
            {
                "event": "RESPONSE",
                "alert_id": alert_id,
                "dept": dept_id,
                "status": status.value,
                "responded_at": responded_at,
                "response_time_seconds": response_seconds,
            }
        )
        return alert

    def mark_overdue(self) -> list[AlertRecord]:
        overdue: list[AlertRecord] = []
        now = datetime.now(UTC)
        for alert in self.alerts.values():
            if alert.status != AlertStatus.DISPATCHED:
                continue
            if now > parse_iso(alert.deadline):
                alert.status = AlertStatus.OVERDUE
                overdue.append(alert)
                self._append(
                    {
                        "event": "OVERDUE",
                        "alert_id": alert.alert_id,
                        "dept": alert.dept,
                        "deadline": alert.deadline,
                        "flagged_at": now_iso(),
                        "action_that_was_ignored": alert.action,
                    }
                )
        return overdue

    def list_alerts(self) -> list[AlertRecord]:
        return list(self.alerts.values())

    def list_log_entries(self) -> list[dict]:
        entries: list[dict] = []
        with self.log_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
        entries.sort(key=lambda row: row.get("dispatched_at", row.get("responded_at", row.get("flagged_at", ""))))
        return entries
