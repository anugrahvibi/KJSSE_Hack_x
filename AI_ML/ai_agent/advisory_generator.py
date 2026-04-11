import os
import json
from groq import Groq

# Check if API key is available, otherwise use mock mode
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

ADVISORY_PROMPT = """
You are RIVA's Public Advisory System for Mumbai.
Your job is to take technical flood dispatch data and turn it into
clear, calm, and actionable advice for the general public.

Guidelines:
- Convert technical terms (e.g., "outfall elevation") into simple descriptions.
- Highlight specific areas to avoid (e.g., Sion Underpass).
- Provide clear instructions for commutes.
- Use a helpful, urgent but non-panic tone.

Return ONLY valid JSON:
{
  "headline": "Short punchy title",
  "summary": "1-2 sentence overview",
  "affected_areas": ["area 1", "area 2"],
  "travel_advice": "Specific info on trains/roads",
  "safety_steps": ["step 1", "step 2"],
  "next_update": "estimated time"
}
"""

def generate_public_advisory(dispatch_plan: dict) -> dict:
    """
    Takes the output of the dispatch agent and generates a public-facing advisory.
    """
    # Mock mode if no API key
    if not client:
        return _mock_public_advisory(dispatch_plan)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": ADVISORY_PROMPT
            },
            {
                "role": "user",
                "content": f"Generate public advisory based on this dispatch plan: {json.dumps(dispatch_plan)}"
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.5
    )

    return json.loads(response.choices[0].message.content)

def _mock_public_advisory(dispatch_plan: dict) -> dict:
    """
    Mock public advisory when API key is not available.
    """
    scenario = dispatch_plan.get("scenario_summary", "Flood emergency in progress")
    actions = dispatch_plan.get("actions", [])

    # Extract affected areas from actions
    affected_areas = []
    for action in actions:
        if "BMC_WARD_OFFICER" in action.get("dept_id", ""):
            affected_areas.append("Dharavi area")
        elif "WESTERN_RAILWAY" in action.get("dept_id", ""):
            affected_areas.append("Railway stations")

    return {
        "headline": "Flood Emergency Alert",
        "summary": scenario,
        "affected_areas": affected_areas if affected_areas else ["Low-lying areas"],
        "travel_advice": "Avoid affected roads and railway stations. Use alternate routes and public transport.",
        "safety_steps": [
            "Stay indoors if possible",
            "Avoid walking through flood waters",
            "Follow local authority instructions",
            "Keep emergency contacts ready"
        ],
        "next_update": "Within 30 minutes"
    }
