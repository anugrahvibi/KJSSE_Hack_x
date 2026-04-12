from __future__ import annotations

from typing import Any

from ..layer2_agent.agent import client

CASCADE_NARRATOR_PROMPT = """
You are CascadeNet Mumbai's cascade analyst writing for the
Emergency Operations Centre commander.
You receive ordered infrastructure failure steps computed from
a real-time dependency graph.
Write a 2-hour incident projection — what will happen, in what
order, what the compounding effects are.
Rules:
- Write in present tense, as if the cascade is unfolding now
- Lead with the most critical failure and its time
- Include affected population numbers
- End with the window for intervention before cascade becomes irreversible
- Maximum 120 words
- No JSON, no bullet points — flowing operational prose only
"""


def _step_get(step: Any, key: str, default: Any = None) -> Any:
    if isinstance(step, dict):
        return step.get(key, default)
    return getattr(step, key, default)


def generate_cascade_narrative(
    ward_id: str,
    cascade_steps: list,
) -> str:
    """Entry point for routers to generate one-shot incident projections."""
    # Assuming ward name lookups or using ward_id directly
    return narrate_cascade(cascade_steps, ward_id, f"Ward {ward_id}")


def narrate_cascade(
    cascade_steps: list,
    trigger_ward: str,
    trigger_ward_name: str,
) -> str:
    """Called right after cascade computation to narrate a 2-hour projection for EOC command."""
    if client is None:
        raise RuntimeError(
            "Shared LLM client is unavailable. Configure GROQ_API_KEY for real-time cascade narration."
        )

    steps_text = "\n".join([
        f"T+{_step_get(s, 't_plus_minutes', 0)}min: {_step_get(s, 'node_label', 'UNKNOWN')} \u2014 "
        f"{int(_step_get(s, 'affected_population', _step_get(s, 'population_affected', 0))):,} people affected "
        f"({_step_get(s, 'failure_condition', 'Unknown condition')})"
        for s in cascade_steps
    ])

    user_message = f"""
Trigger: Ward {trigger_ward} ({trigger_ward_name}) in tidal lock.
Cascade sequence computed from dependency graph:
{steps_text}

Audit Mode Context:
This analysis simulates removing these nodes without an active flood to count downstream population impact.
Rankings established: Western Railway (5.2M multiplier), Sion arterial (2.1M).

Write the 2-hour incident projection now.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": CASCADE_NARRATOR_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content or ""
