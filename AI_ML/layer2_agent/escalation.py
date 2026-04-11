from __future__ import annotations

import json
from typing import Any

from .agent import client

ESCALATION_SYSTEM_PROMPT = """
You are CascadeNet Mumbai's escalation agent.
A department failed to respond to a CRITICAL flood alert.
Time has passed. The situation has worsened.
You must produce an escalated action plan that:
1. Routes to the superior authority of the non-responding department
2. Uses more urgent language than the original
3. Accounts for the time lost to inaction
4. Specifies what the original department was supposed to do
   and why it is now too late for them to do it

Superior authority mappings:
- BMC_WARD_OFFICER escalates to → MCGM_COMMISSIONER
- WESTERN_RAILWAY escalates to → RAILWAY_BOARD_MUMBAI
- NDRF escalates to → NDRF_REGIONAL_COMMAND
- KEM_HOSPITAL escalates to → MUNICIPAL_HEALTH_OFFICER
- PUBLIC_ADVISORY escalates to → DISASTER_MANAGEMENT_CELL

Return ONLY valid JSON in this exact schema:
{
  "escalation_target": "superior authority dept_id",
  "original_dept": "dept_id that failed",
  "minutes_lost": integer,
  "situation_update": "1 sentence — what has changed since original alert",
  "escalated_action": "specific instruction for the superior authority",
  "original_action_status": "what the original action was and why it is now late",
  "urgency": "CRITICAL"
}
"""


_FALLBACK_ESCALATION = {
    "escalation_target": "MCGM_COMMISSIONER",
    "original_dept": "UNKNOWN",
    "minutes_lost": 0,
    "situation_update": "Conditions have degraded during the response gap.",
    "escalated_action": "Assume direct command and deploy immediate flood countermeasures.",
    "original_action_status": "Original department did not acknowledge in time; the intervention window has narrowed.",
    "urgency": "CRITICAL",
}


def run_escalation_agent(
    original_dept: str,
    original_action: str,
    original_deadline_minutes: int,
    minutes_elapsed_since_deadline: int,
    ward_id: str,
    current_tide_height: float,
    current_drain_pct: float,
) -> dict[str, Any]:
    """Generate an escalation plan for an overdue critical dispatch."""
    if client is None:
        raise RuntimeError(
            "Shared LLM client is unavailable. Configure GROQ_API_KEY for real-time escalation."
        )

    user_message = f"""
OVERDUE ALERT:
Department: {original_dept}
Their missed action: {original_action}
Their deadline was: {original_deadline_minutes} minutes after dispatch
Minutes since deadline passed: {minutes_elapsed_since_deadline}
Current conditions: Ward {ward_id}, tide {current_tide_height}m,
drain capacity {current_drain_pct}%

Generate the escalated action plan now.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": ESCALATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw = response.choices[0].message.content or ""
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("Escalation response is not a JSON object")
        return parsed
    except Exception:
        fallback = dict(_FALLBACK_ESCALATION)
        fallback["original_dept"] = original_dept
        fallback["minutes_lost"] = int(minutes_elapsed_since_deadline)
        return fallback
