import os
import json
from groq import Groq
from .system_prompt import (
    MUMBAI_DISPATCH_SYSTEM_PROMPT,
    build_user_message
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def run_dispatch_agent(ward_status: dict,
                        context: dict) -> dict:
    """
    Core Layer 2 function.
    Takes ward status from Layer 1 + context.
    Returns structured action plan.
    """
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