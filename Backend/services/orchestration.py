from __future__ import annotations

from services.runtime import agent_service, log_service, ws_manager


async def dispatch_from_ward_status(ward_status, context: dict | None = None, dispatched_at: str | None = None):
    plan = agent_service.run_dispatch_agent(ward_status, context=context)
    alerts = log_service.create_dispatches(ward_id=ward_status.ward_id, plan=plan, dispatched_at=dispatched_at)

    for alert in alerts:
        event = {
            "type": "alert_dispatched",
            "alert_id": alert.alert_id,
            "dept": alert.dept,
            "action": alert.action,
            "priority": alert.priority,
            "deadline": alert.deadline,
            "timestamp": alert.timestamp,
        }
        await ws_manager.broadcast_alert(event, dept_id=alert.dept)
    return plan, alerts


async def broadcast_ack(alert):
    event = {
        "type": "alert_acknowledged",
        "alert_id": alert.alert_id,
        "dept": alert.dept,
        "status": alert.status.value,
        "response_time_seconds": alert.response_time_seconds,
        "timestamp": alert.responded_at,
    }
    await ws_manager.broadcast_alert(event, dept_id=alert.dept)
