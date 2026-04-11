# CascadeNet Mumbai Backend

FastAPI backend for detection, dispatch agent orchestration, cascade simulation, WebSockets, accountability logging, and demo playback.

## Scope

This backend is fully local-first and demo-safe:
- Uses mock Mumbai tide/rainfall/outfall/graph data from `Backend/data/`
- Writes accountability records to append-only `Backend/logs/accountability.jsonl`
- Supports dashboard and department WebSocket channels

## Run

1. Install dependencies from `requirements.txt`
2. Start app via `uvicorn main:app --reload --port 8000` from `Backend/`

## Step-by-step commit plan (recommended)

1. **Scaffold:** config, models, service + router skeleton, main app
2. **Layer 1:** `drain_capacity.py` + `/api/detection/*`
3. **Layer 2 + logging:** `agent_service.py`, `log_service.py`, `/api/agent/*`
4. **WebSockets + overdue loop:** `ws_manager.py`, `routers/websocket.py`, startup task
5. **Layer 3:** `cascade_service.py`, `/api/cascade/*`, `/api/wards/geojson`
6. **Demo mode:** `routers/demo.py` + `data/demo_scenario.json`
7. **Polish:** structured errors, health endpoint, data file refinements

## Key endpoints

- `GET /health`
- `GET /api/detection/status`
- `GET /api/detection/ward/{ward_id}`
- `POST /api/detection/trigger`
- `POST /api/agent/dispatch`
- `POST /api/agent/acknowledge/{alert_id}`
- `GET /api/agent/alerts`
- `GET /api/agent/log`
- `GET /api/cascade/event/{ward_id}`
- `GET /api/cascade/audit`
- `GET /api/wards/geojson`
- `POST /api/demo/start`
- `WS /ws/dashboard`
- `WS /ws/dept/{dept_id}`
