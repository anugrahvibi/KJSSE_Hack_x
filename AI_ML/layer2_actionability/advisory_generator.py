import os
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
