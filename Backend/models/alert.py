from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AlertStatus(str, Enum):
    DISPATCHED = "DISPATCHED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    OVERDUE = "OVERDUE"


class ActionItem(BaseModel):
    dept_id: str
    action: str
    priority: str
    deadline_minutes: int = Field(default=15, ge=1)
    rationale: str


class ActionPlan(BaseModel):
    scenario_summary: str
    actions: list[ActionItem]
    tide_trajectory_note: str
    cascade_risk_flag: str


class AlertRecord(BaseModel):
    alert_id: str
    ward_id: str
    dept: str
    action: str
    priority: str
    deadline: str
    timestamp: str
    status: AlertStatus
    responded_at: str | None = None
    response_time_seconds: int | None = None


class AcknowledgeRequest(BaseModel):
    dept_id: str
    status: AlertStatus = AlertStatus.ACKNOWLEDGED


class DispatchRequest(BaseModel):
    ward_status: dict[str, Any]
    context: dict[str, Any] = {}
