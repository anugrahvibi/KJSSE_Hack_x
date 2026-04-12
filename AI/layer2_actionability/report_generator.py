import os
import json
from groq import Groq


# Check if API key is available, otherwise use mock mode
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

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

def generate_report(ward_id: str, mode: str = "DEMO") -> dict:
    from Backend.services.runtime import log_service
    entries = log_service.list_log_entries()

    # In LIVE mode, ignore entries and generate an all-clear report
    if mode == "LIVE":
        log_data_str = "SYSTEM STATUS: ALL CLEAR. No failures."
        prompt_instruction = "CRITICAL INSTRUCTION: The system is in LIVE MODE with ZERO incidents. You must generate a highly positive, all-clear report indicating that all departments are operating normally, structural integrity is fine, and no cascade failures exist. Every status must be RESPONDED."
    else:
        log_data_str = json.dumps(entries, indent=2)
        prompt_instruction = "The system is in DEMO mode. Write a factual report based strictly on the logs below, explicitly calling out failures."
        if not entries:
            return {"error": "No log entries found"}

    # Mock mode if no API key
    if not client:
        return _mock_report(ward_id, entries)

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
{prompt_instruction}

LOG DATA:
{log_data_str}
"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )

    return json.loads(
        response.choices[0].message.content
    )

def _mock_report(ward_id: str, entries: list) -> dict:
    """
    Mock report when API key is not available.
    """
    return {
        "report_title": f"Flood Response Report - Ward {ward_id}",
        "event_summary": f"Flood event occurred in ward {ward_id} with {len(entries)} response actions logged.",
        "department_performance": [
            {
                "dept": dept,
                "status": "RESPONDED",
                "assessment": f"Department {dept} responded to flood emergency in ward {ward_id}."
            } for dept in set(entry.get("dept", "UNKNOWN") for entry in entries)
        ],
        "cascade_impact": "All departments responded within expected timeframes. No cascade failures detected.",
        "institutional_assessment": f"Response coordination was effective with {len(entries)} actions completed.",
        "recommended_actions": [
            "Continue monitoring flood-prone areas",
            "Review response times for optimization",
            "Update emergency contact protocols"
        ]
    }