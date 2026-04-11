# CascadeNet Mumbai

> *"When the next flood happens and someone asks why people died — Mumbai will finally have an answer. Not a press conference. A log."*

**Hack X · KJSSE GajShield · AI Track · Open Innovation**

---

## The Problem

Mumbai's floods are not a weather problem. They are a systems failure — and the mainstream narrative of "plastic in drains" and "unprecedented rain" is a smokescreen for three compounding failures that have not changed in 20 years.

### Why Mumbai Actually Floods

**Tidal Lock Zones.** Mumbai is a reclaimed island. Large parts of Dharavi, BKC, and the western suburbs sit 2–5 metres above mean sea level — but their stormwater outfalls discharge into tidal creeks. During high tide + heavy rainfall simultaneously, the sea is physically higher than the drain exit point. Water cannot flow out regardless of how clean the pipes are. The city has engineered zones where drainage is mathematically impossible for 4–8 hours per compound event.

**Jurisdictional Fragmentation.** The Mithi River's 17.8km length is governed by BMC, MMRDA, AAI, and the Maharashtra state government simultaneously. No single body owns the full channel. Each body can veto coordination by doing nothing — and doing nothing has zero accountability because the failure is always "shared."

**No Real-Time Nervous System.** IMD weather stations, BMC pump stations, and tide gauges run on separate telemetry with no integrated decision layer. During a flood event, a pump operator in Dharavi has no real-time view of upstream water levels. The city can only react — never pre-empt.

### The Cost of This Inaction

- 2005: 1,094 deaths, ₹550 crore damage in a single event
- 2017, 2019, 2020: repeat flooding of the same zones, same infrastructure failures
- Every post-flood inquiry produces the same findings. Nothing changes.

**The reason nothing changes: there is no accountability infrastructure. No system that timestamps who knew what, when — and who did nothing.**

---

## The Solution: CascadeNet Mumbai

CascadeNet is a three-layer crisis operating system that replaces Mumbai's reactive disaster management with predictive, coordinated, accountable flood response.

It does not fix the drains. It fixes the response.

### What It Does Differently

| Current System | CascadeNet |
|---|---|
| Departments learn about flooding from news or field calls | Physics-based flood status computed in real time |
| Coordination via phone calls, 4–6 hours of lag | Agent-dispatched alerts to 6 agencies in under 60 seconds |
| No record of who was told what and when | Append-only accountability log — every alert timestamped |
| Infrastructure failures discovered after the fact | Cascade graph predicts failure sequence before it occurs |
| Flood vulnerability unknown until water arrives | Standing audit map of which wards physically cannot drain |

### The Core Insight

Dharavi's outfall elevation is 4.2m. When tide height exceeds 4.2m, drainage capacity drops to 0%. This is not a prediction. This is physics. CascadeNet computes this in real time, triggers a dispatch agent, and routes specific instructions to BMC, NDRF, Western Railway, Central Railway, KEM Hospital, and public advisory — sequenced correctly, with deadlines, with accountability.

---

## Architecture

CascadeNet has three layers. Each layer feeds the next.

```
[ Mock Data Sources ]
  IMD AWS Schema (139 Mumbai rain gauge sites)
  WorldTides Format (Mumbai Harbour tidal heights)
  BMC Ward Outfall Elevations
         |
         v
+-----------------------------------------------------+
|  LAYER 1 — DETECTION (Physics Engine)               |
|                                                     |
|  drain_capacity = max(0, (outfall_elev - tide) /    |
|                         outfall_elev x 100)         |
|                                                     |
|  if capacity == 0 AND rainfall > 0  -->  CRITICAL   |
|  if capacity < 30 AND rainfall > 0  -->  WARNING    |
|  if capacity < 60 AND rainfall > 0  -->  WATCH      |
|                                                     |
|  Output: WardStatus objects for all Mumbai wards    |
+---------------------+--------------  ---------------+
                      | CRITICAL/WARNING trigger
                      v
+-----------------------------------------------------+
|  LAYER 2 — AI DISPATCH AGENT (Claude API)           |
|                                                     |
|  LLM agent with Mumbai-specific system prompt.      |
|  Context-aware routing to 6 agencies.               |
|  Knows: tide trajectory, commute hours, road        |
|  access constraints, hospital capacity, NDRF        |
|  battalion positions.                               |
|                                                     |
|  Output: Structured ActionPlan (JSON) per agency    |
|  + Accountability log entry (append-only .jsonl)    |
|  + WebSocket broadcast to all department dashboards |
|                                                     |
|  Agencies: BMC Ward Officer · Western Railway ·     |
|  Central Railway · NDRF · KEM Hospital ·            |
|  Public Advisory                                    |
+---------------------+-------------------------------+
                      | alert_dispatched event
                      v
+-----------------------------------------------------+
|  LAYER 3 — CASCADE INTELLIGENCE (NetworkX Graph)    |
|                                                     |
|  Directed dependency graph with weighted edges.     |
|                                                     |
|  EVENT MODE (triggered by Layer 1):                 |
|  Forward BFS traversal — which infrastructure       |
|  fails next, in what sequence, at what time.        |
|  "Kurla station submerges at T+60min.               |
|   KEM Hospital loses vehicle access at T+105min."   |
|                                                     |
|  AUDIT MODE (scheduled, on-demand):                 |
|  Cascade multiplier per node — vulnerability map.   |
|  "Which single failure breaks the most systems?"    |
|  Output: Policy document. NDMA-ready.               |
+-----------------------------------------------------+
                      |
                      v
+-----------------------------------------------------+
|  FRONTEND — React + TypeScript + Leaflet GIS        |
|                                                     |
|  Command Dashboard: Mumbai ward map, live status    |
|  cards, scrolling alert feed with ACK badges.       |
|                                                     |
|  Department Portals: Per-agency views with          |
|  countdown timers, ACK/ESCALATE buttons, and        |
|  accountability banner ("Your response is logged"). |
|                                                     |
|  Audit Map: Cascade multiplier heatmap of Mumbai.   |
|  Permanently undrained wards shown distinctly.      |
+-----------------------------------------------------+
```

### Accountability Layer (Built into Layer 2)

Every alert dispatched generates a timestamped log entry. Every department response — or non-response — is recorded. An automated background task flags OVERDUE status when a deadline passes with no acknowledgment.

```jsonl
{"event": "DISPATCH", "alert_id": "ALT-001", "dept": "BMC_WARD_H_EAST", "action": "Activate pump stations 3 and 7. Close Sion underpass.", "deadline": "2024-07-15T09:22:00Z", "dispatched_at": "2024-07-15T09:07:00Z"}
{"event": "RESPONSE", "alert_id": "ALT-001", "dept": "BMC_WARD_H_EAST", "status": "ACKNOWLEDGED", "response_time_seconds": 480}
{"event": "OVERDUE", "alert_id": "ALT-003", "dept": "WESTERN_RAILWAY", "deadline": "2024-07-15T09:27:00Z", "action_that_was_ignored": "Prepare Kurla and Sion stations for potential service halt."}
```

**For the first time in Indian disaster management — silence is timestamped.**

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | TypeScript · React · Tailwind CSS · Leaflet (GIS maps) |
| Backend | Python · FastAPI · WebSockets · Append-only JSONL log |
| AI / Agent | Claude API `claude-sonnet-4-20250514` · Mumbai-specific system prompt |
| Graph Engine | NetworkX · Directed weighted dependency graph |
| Geospatial | GeoTIFF elevation processing · Mumbai ward GeoJSON (data.gov.in) |
| Data | Mock data matching real IMD AWS + WorldTides + BMC schemas exactly |
| Version Control | GitHub · Public repo · Committed during hackathon |

### Data Sources (Production Implementation)
- **Rainfall:** IITM Mumbai Rain portal (`mumbairain.tropmet.res.in`) — 139 live gauge sites, freely accessible for academic use
- **Tidal data:** WorldTides API + INCOIS tidal gauge network (36 stations along Indian coastline)
- **Ward boundaries:** Mumbai GeoJSON from data.gov.in (open data, NDSAP licence)
- **Historical baseline:** IMD gridded dataset 1901–2018

---

## Deadlock Impact

CascadeNet directly addresses Mumbai's systemic flood failures:

| Deadlock | Impact | How |
|---|---|---|
| No real-time nervous system | Direct | Layer 1 + Layer 2 close the prediction-to-actuation gap entirely |
| Jurisdictional fragmentation | Direct | Timestamp log makes cross-department inaction legally visible |
| Tidal lock zones | Indirect | Layer 1 manages consequences; Audit Map exposes elevation math publicly |
| Capacity theater | Audit only | Vulnerability map surfaces drain infrastructure fiction in a citable document |

---

## Demo Steps

### Prerequisites

```bash
# Clone the repo
git clone https://github.com/anugrahvibi/KJSSE_Hack_x
cd KJSSE_Hack_x

# Backend setup
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend setup (new terminal)
cd ../Frontend_New_Final
npm install
npm run dev
# Runs on http://localhost:3000
```

Set your Claude API key before starting the backend:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

---

### Running the Demo

The demo replays the **July 15, 2024 Dharavi compound event** — 87mm/hr rainfall, 4.6m high tide, tidal lock in Ward H-East. All data is local mock data. No external network calls required.

**Step 1 — Open the Dashboard**

Go to `http://localhost:3000`. You will see the Mumbai ward map in LIVE MODE by default.

**Step 2 — Switch to Demo Mode**

Click the **DEMO MODE** toggle in the header bar. All data now comes from `mockScenario.ts`. The demo is fully self-contained — no network dependency.

**Step 3 — Trigger the Scenario**

Click **START SCENARIO** in the frontend, or run:

```bash
curl -X POST http://localhost:8000/api/demo/start
```

The July 15 Dharavi event begins. The following sequence plays out automatically:

| Time | Event | What You See |
|---|---|---|
| T+0s | Ward H-East enters CRITICAL | Map turns RED. Status cards: Tide 4.6m · Rain 87mm/hr · Drain **0%** |
| T+5s | Agent dispatches to 6 agencies | Alert feed populates with DISPATCHED badges and countdown timers |
| T+30s | Accountability log entry written | `GET /api/agent/log` returns the dispatch receipt |
| T+90s | BMC acknowledges | Badge changes DISPATCHED → ACKNOWLEDGED (green) |
| T+120s | Cascade animation begins | Kurla station node on map turns AMBER |
| T+180s | Sion–Matunga road nodes turn RED | Cascade sequence step 2 visible on map |
| T+240s | Western Railway has not responded | OVERDUE badge appears (red) in alert feed |

**Step 4 — Show the Department Portals**

Click **BMC WARD OFFICER** in the navigation:
- Alert received with countdown timer
- Accountability banner: *"This alert was dispatched at 09:07. Your response is logged. Deadline: 09:22."*
- ACK and ESCALATE buttons (click ACK to demonstrate acknowledgment flow)

Click **NDRF BATTALION** portal:
- Sector deployment map
- Route recommendation: *Deploy via 60 Feet Road. Avoid Sion route — underpass closing.*

**Step 5 — Show the Audit Map**

Click **AUDIT MAP** in the navigation. This view shows:
- Full Mumbai ward heatmap coloured by cascade multiplier score (dark red = highest impact)
- Top 5 single points of failure ranked by downstream population affected
- Permanently undrained wards (BKC / G-South) shown in hatched overlay — wards that cannot drain regardless of pump activation

---

### API Reference

```bash
# All ward statuses (Layer 1 output)
GET http://localhost:8000/api/detection/status

# Single ward detail
GET http://localhost:8000/api/detection/ward/H-East

# Manually trigger a flood scenario
POST http://localhost:8000/api/detection/trigger
Body: {"ward_id": "H-East", "severity": "CRITICAL"}

# Run AI dispatch agent for a ward
POST http://localhost:8000/api/agent/dispatch
Body: WardStatus object

# All dispatched alerts with current status
GET http://localhost:8000/api/agent/alerts

# Full accountability log
GET http://localhost:8000/api/agent/log

# Cascade sequence for a ward (Event Mode)
GET http://localhost:8000/api/cascade/event/H-East

# Vulnerability map (Audit Mode)
GET http://localhost:8000/api/cascade/audit

# Mumbai ward GeoJSON for map rendering
GET http://localhost:8000/api/wards/geojson

# Start demo playback
POST http://localhost:8000/api/demo/start
```

---

## Repository Structure

```
KJSSE_Hack_x/
|
+-- Frontend_New_Final/              # React + TypeScript frontend
|   +-- components/
|   |   +-- Map/
|   |   |   +-- WardMap.tsx          # Leaflet Mumbai ward map
|   |   |   +-- CascadeOverlay.tsx   # Cascade animation on map
|   |   +-- Dashboard/
|   |   |   +-- StatusCards.tsx      # Live tide, rain, drain cards
|   |   |   +-- AlertFeed.tsx        # Scrolling alert log
|   |   +-- Portals/
|   |   |   +-- DeptPortal.tsx       # Department-specific view
|   |   |   +-- AckButton.tsx        # Acknowledgment + escalation
|   |   +-- Audit/
|   |       +-- VulnerabilityMap.tsx # Cascade multiplier heatmap
|   +-- context/FloodContext.tsx      # Global WebSocket state
|   +-- hooks/useWebSocket.ts
|   +-- data/mockScenario.ts          # July 15 Dharavi demo sequence
|
+-- Backend/
|   +-- main.py                       # FastAPI entry point
|   +-- requirements.txt
|   +-- routers/
|   |   +-- detection.py              # Layer 1 endpoints
|   |   +-- agent.py                  # Layer 2 — AI dispatch
|   |   +-- cascade.py                # Layer 3 — graph queries
|   |   +-- accountability.py         # Log read endpoints
|   |   +-- websocket.py              # WebSocket connection manager
|   +-- services/
|   |   +-- drain_capacity.py         # Core physics computation
|   |   +-- agent_service.py          # Claude API wrapper
|   |   +-- cascade_service.py        # NetworkX graph operations
|   |   +-- log_service.py            # Accountability log read/write
|   +-- data/
|   |   +-- mock_tide.json            # WorldTides format mock
|   |   +-- mock_rainfall.json        # IMD AWS format mock
|   |   +-- ward_outfalls.json        # BMC outfall elevation data
|   |   +-- dependency_graph.json     # Graph edges + weights
|   |   +-- demo_scenario.json        # July 15 timed event sequence
|   +-- logs/
|       +-- accountability.jsonl       # Append-only accountability log
|
+-- AI_ML/
|   +-- layer1_detection/
|   |   +-- drain_capacity_engine.py  # Core physics (no ML)
|   |   +-- tide_parser.py
|   |   +-- rainfall_parser.py
|   |   +-- ward_data_loader.py
|   +-- layer2_agent/
|   |   +-- agent.py                  # Claude API dispatch agent
|   |   +-- system_prompt.py          # Mumbai-specific prompt (critical)
|   |   +-- output_schema.py          # Pydantic models
|   |   +-- escalation.py             # Overdue detection logic
|   +-- layer3_cascade/
|   |   +-- graph_builder.py          # NetworkX graph construction
|   |   +-- event_mode.py             # Forward BFS cascade traversal
|   |   +-- audit_mode.py             # Cascade multiplier computation
|   |   +-- vulnerability_mapper.py   # Vulnerability report output
|   +-- geospatial/
|   |   +-- ward_geojson_builder.py   # Merge boundaries + outfall data
|   |   +-- check_tif.py              # GeoTIFF elevation inspector
|   |   +-- tif_to_geojson.py         # Convert .tif to ward properties
|   +-- tests/
|       +-- test_drain_capacity.py
|       +-- test_agent.py
|       +-- test_cascade.py
|
+-- README.md
```

---

## The Pitch (For Judges)

| Demo Moment | What It Proves |
|---|---|
| Drain capacity = 0% | Physics-based trigger. Not ML. Not prediction. The drain is sealed by the tide. |
| Agent dispatches in 12 seconds | Contextual reasoning over hardcoded scripts. Different outputs at 9AM Monday vs 2AM Sunday. |
| Accountability log entry | The alert has a receipt. For the first time — dispatch is provable. |
| OVERDUE badge | The system caught the silence. Inaction is now visible. |
| Cascade animation | Dependency graph, not guesswork. Kurla fails at T+60min if pumps fail. |
| Audit Map | The standing vulnerability report. These wards cannot drain regardless of what BMC does. |

---

## Built At

**Hack X · KJSSE GajShield · April 11–12, 2026**
KJ Somaiya College of Engineering, Vidyavihar, Mumbai
Track: AI / Open Innovation · Prize Pool: ₹3 Lakhs+

---

## Attributions

- Mumbai ward boundaries: [data.gov.in](https://data.gov.in) — Open Government Data Platform (NDSAP licence)
- Rainfall data schema: India Meteorological Department AWS API
- Tidal data schema: WorldTides API / INCOIS
- Graph engine: [NetworkX](https://networkx.org) (BSD licence)
- AI model: Anthropic Claude API (`claude-sonnet-4-20250514`)
- Maps: [Leaflet.js](https://leafletjs.com) (BSD licence)
- Mumbai rainfall portal: IITM + MCGM ([mumbairain.tropmet.res.in](https://mumbairain.tropmet.res.in))

---

*CascadeNet Mumbai — because the city deserves a nervous system, not a press conference.*