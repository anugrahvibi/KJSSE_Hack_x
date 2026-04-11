import os
import json
from groq import Groq
from .system_prompt import (
    MUMBAI_DISPATCH_SYSTEM_PROMPT,
    build_user_message
)

# Check if API key is available, otherwise use mock mode
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def run_dispatch_agent(ward_status: dict,
                        context: dict) -> dict:
    """
    Core Layer 2 function.
    Takes ward status from Layer 1 + context.
    Returns structured action plan.
    """
    # Mock mode if no API key
    if not client:
        return _mock_dispatch_plan(ward_status, context)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": MUMBAI_DISPATCH_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": build_user_message(
                    ward_status, context
                )
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3   # lower = more consistent outputs
    )

    raw = response.choices[0].message.content
    return json.loads(raw)

def _mock_dispatch_plan(ward_status: dict, context: dict) -> dict:
    """
    Mock dispatch plan when API key is not available.
    """
    ward_name = ward_status.get("ward_name", "Unknown Ward")
    flood_status = ward_status.get("flood_status", "UNKNOWN")

    return {
        "scenario_summary": f"{ward_name} in {flood_status} flood status due to tidal lock and heavy rainfall.",
        "actions": [
            {
                "dept_id": "BMC_WARD_OFFICER",
                "action": f"Activate all pump stations in {ward_name}. Close affected roads and underpasses.",
                "priority": "CRITICAL",
                "deadline_minutes": 15,
                "rationale": "Immediate drainage required to prevent further flooding."
            },
            {
                "dept_id": "WESTERN_RAILWAY",
                "action": f"Halt services at {ward_name} stations. Prepare crowd management teams.",
                "priority": "HIGH",
                "deadline_minutes": 30,
                "rationale": "Prevent commuter exposure to flood waters."
            },
            {
                "dept_id": "NDRF",
                "action": f"Deploy Battalion 4 to {ward_name} sector with rescue boats and medical teams.",
                "priority": "HIGH",
                "deadline_minutes": 45,
                "rationale": "Emergency rescue operations required."
            }
        ]
    }


# Quick test — run this file directly to verify
if __name__ == "__main__":
    test_ward = {
        "ward_id": "H-East",
        "ward_name": "Dharavi",
        "flood_status": "CRITICAL",
        "drainage_capacity_pct": 0,
        "tide_height": 4.6,
        "outfall_elevation_m": 4.2,
        "rainfall_rate": 87
    }
    test_context = {
        "timestamp": "2024-07-15T09:07:00",
        "day_of_week": "Monday",
        "tide_direction": "rising",
        "hospital_capacity_pct": 65,
        "nearest_ndrf": "Battalion 4",
        "sion_status": "open"
    }

    result = run_dispatch_agent(test_ward, test_context)
    print(json.dumps(result, indent=2))