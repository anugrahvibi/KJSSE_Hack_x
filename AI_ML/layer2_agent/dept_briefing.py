from __future__ import annotations

from .agent import client

DEPT_BRIEFING_PROMPT = """
You are CascadeNet Mumbai writing a direct operational briefing
to a department commander. You write in second person ("You are...").
Your briefing has exactly 4 sentences:
1. The situation the commander is responding to (what is happening, where, why)
2. Their specific mission (what exactly they must do)
3. The critical timing constraint (what happens in X minutes if they don't act)
4. The consequence of inaction (what fails downstream if they miss their window)
Be specific. Use real location names. Use real numbers.
No JSON. No headers. Four sentences only.
"""


def generate_dept_briefing(
    dept_id: str,
    action: str,
    rationale: str,
    deadline_minutes: int,
    ward_id: str,
    ward_name: str,
    tide_height: float,
    cascade_risk_flag: str,
) -> str:
    """Called after action-plan generation to produce a commander-ready 4-sentence department briefing."""
    if client is None:
        raise RuntimeError(
            "Shared LLM client is unavailable. Configure GROQ_API_KEY for real-time department briefing."
        )

    user_message = f"""
Department: {dept_id}
Their assigned action: {action}
Rationale from dispatch agent: {rationale}
Deadline: {deadline_minutes} minutes
Ward: {ward_id} ({ward_name})
Current tide: {tide_height}m
Next cascade risk: {cascade_risk_flag}

Write the 4-sentence operational briefing now.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": DEPT_BRIEFING_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content or ""
