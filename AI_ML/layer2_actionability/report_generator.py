import os
import json
from groq import Groq
from .log_service import get_all_entries

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

REPORT_PROMPT = """
You are RIVA's post-event reporting system for Mumbai
flood response. You receive raw accountability log data
and generate a formal governance report suitable for
the Municipal Commissioner and journalists.

The report must:
- Name specific departments and exact response times
- Explicitly call out failures (OVERDUE entries)
  and their consequences
- Be written in formal English
- End with a clear institutional assessment

Return ONLY valid JSON, no other text:
{
  "report_title": "string",
  "event_summary": "2-3 sentences",
  "department_performance": [
    {
      "dept": "name",
      "status": "RESPONDED or FAILED",
      "assessment": "one sentence"
    }
  ],
  "cascade_impact": "what failed downstream and why",
  "institutional_assessment": "who performed, who failed,
    what it cost",
  "recommended_actions": ["action 1", "action 2"]
}
"""

def generate_report(ward_id: str) -> dict:
    entries = get_all_entries(ward_id)

    if not entries:
        return {"error": "No log entries found"}

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": REPORT_PROMPT
            },
            {
                "role": "user",
                "content": f"""
Generate accountability report for ward: {ward_id}

LOG DATA:
{json.dumps(entries, indent=2)}
"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )

    return json.loads(
        response.choices[0].message.content
    )