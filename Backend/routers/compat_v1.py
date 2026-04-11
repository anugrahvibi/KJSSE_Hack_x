from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Query

from services.runtime import log_service

router = APIRouter(prefix="/api/v1", tags=["compat-v1"])


def _now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


ZONE_ROWS = [
    {"zone_id": "ZONE_KALPETTA", "zone_name": "Kalpetta Town"},
    {"zone_id": "ZONE_SULTHAN_BATHERY", "zone_name": "Sulthan Bathery"},
    {"zone_id": "ZONE_MANANTHAVADY", "zone_name": "Mananthavady"},
    {"zone_id": "ZONE_VYTHIRI", "zone_name": "Vythiri"},
    {"zone_id": "ZONE_PANAMARAM", "zone_name": "Panamaram"},
    {"zone_id": "ZONE_AMBALAVAYAL", "zone_name": "Ambalavayal"},
]

INFRA_NODES = [
    {"id": "substation_kalpetta", "name": "Kalpetta Substation", "type": "substation", "lat": 11.61, "lon": 76.08},
    {"id": "water_pump_panamaram", "name": "Panamaram Pump", "type": "water_pump", "lat": 11.79, "lon": 76.03},
    {"id": "hospital_bathery", "name": "Bathery Hospital", "type": "hospital", "lat": 11.66, "lon": 76.25},
    {"id": "road_vythiri", "name": "Vythiri Arterial", "type": "road", "lat": 11.55, "lon": 76.02},
    {"id": "tower_mananthavady", "name": "Mananthavady Tower", "type": "comm_tower", "lat": 11.8, "lon": 75.97},
]

INFRA_EDGES = [
    {"source": "substation_kalpetta", "target": "water_pump_panamaram", "weight": 0.7},
    {"source": "water_pump_panamaram", "target": "hospital_bathery", "weight": 0.8},
    {"source": "road_vythiri", "target": "hospital_bathery", "weight": 0.6},
]

PREDICTIONS = [
    {"zone_id": "ZONE_KALPETTA", "zone_name": "Kalpetta Town", "flood_probability": 0.42, "lead_time_hours": 7.0},
    {"zone_id": "ZONE_SULTHAN_BATHERY", "zone_name": "Sulthan Bathery", "flood_probability": 0.58, "lead_time_hours": 5.5},
    {"zone_id": "ZONE_MANANTHAVADY", "zone_name": "Mananthavady", "flood_probability": 0.33, "lead_time_hours": 9.0},
    {"zone_id": "ZONE_VYTHIRI", "zone_name": "Vythiri", "flood_probability": 0.73, "lead_time_hours": 3.5},
    {"zone_id": "ZONE_PANAMARAM", "zone_name": "Panamaram", "flood_probability": 0.81, "lead_time_hours": 2.0},
    {"zone_id": "ZONE_AMBALAVAYAL", "zone_name": "Ambalavayal", "flood_probability": 0.39, "lead_time_hours": 8.0},
]

DISTRESS_ALERT: dict | None = None


def _default_actions() -> list[dict]:
    return [
        {
            "department": "dam_controller",
            "action": "Pre-release 12% reservoir capacity and lock non-essential gates.",
            "alert_level": "ORANGE",
            "priority": "HIGH",
            "source": "RIVA Layer 2",
            "time_window_hours": 6,
            "timestamp": _now_iso(),
        },
        {
            "department": "ndrf_rescue",
            "action": "Deploy Rescue Unit Bravo to Panamaram low-lying corridor.",
            "alert_level": "RED",
            "priority": "CRITICAL",
            "source": "RIVA Layer 2",
            "time_window_hours": 2,
            "timestamp": _now_iso(),
        },
        {
            "department": "district_admin",
            "action": "Open district shelters and trigger ward-level evacuation advisories.",
            "alert_level": "ORANGE",
            "priority": "HIGH",
            "source": "RIVA Layer 2",
            "time_window_hours": 4,
            "timestamp": _now_iso(),
        },
        {
            "department": "highway_department",
            "action": "Close Vythiri underpass and publish diversion route map.",
            "alert_level": "RED",
            "priority": "CRITICAL",
            "source": "RIVA Layer 2",
            "time_window_hours": 3,
            "timestamp": _now_iso(),
        },
        {
            "department": "dev_sys",
            "action": "Switch dashboards to flood simulation telemetry mode.",
            "alert_level": "YELLOW",
            "priority": "MEDIUM",
            "source": "RIVA Layer 2",
            "time_window_hours": 12,
            "timestamp": _now_iso(),
        },
        {
            "department": "Public",
            "action": "Avoid underpasses; use designated high-ground corridors only.",
            "alert_level": "ORANGE",
            "priority": "HIGH",
            "source": "RIVA Public Advisory",
            "time_window_hours": 4,
            "timestamp": _now_iso(),
        },
    ]


@router.get("/zones")
def zones():
    return ZONE_ROWS


@router.get("/infrastructure/graph")
def infrastructure_graph():
    return {"nodes": INFRA_NODES, "edges": INFRA_EDGES}


@router.get("/ml/predictions")
def ml_predictions(scenario: str = Query(default="2024_peak")):
    _ = scenario
    return {"predictions": PREDICTIONS}


@router.get("/ml/alerts/summary")
def ml_alerts_summary(scenario: str = Query(default="2024_peak")):
    _ = scenario
    actions = _default_actions()

    # Include backend-dispatched alerts if available (mapped to legacy shape)
    for alert in log_service.list_alerts():
        actions.append(
            {
                "department": str(alert.dept).lower(),
                "action": alert.action,
                "alert_level": "RED" if alert.priority == "CRITICAL" else "ORANGE",
                "priority": alert.priority,
                "source": "RIVA Backend",
                "time_window_hours": 2,
                "timestamp": alert.timestamp,
            }
        )

    if DISTRESS_ALERT:
        actions.append(DISTRESS_ALERT)

    return {"action_plan": {"action_plans": actions}}


@router.post("/ml/alerts/distress")
def trigger_distress(zone_id: str = Query(default="ZONE_KALPETTA"), phone_number: str | None = Query(default=None)):
    global DISTRESS_ALERT
    DISTRESS_ALERT = {
        "department": "ndrf_rescue",
        "action": f"Emergency distress signal from {zone_id}" + (f" (contact {phone_number})" if phone_number else ""),
        "alert_level": "RED",
        "priority": "CRITICAL",
        "source": "RIVA Distress",
        "time_window_hours": 0,
        "is_distress": True,
        "timestamp": _now_iso(),
    }
    return {"success": True, "message": "distress_triggered", "alert": DISTRESS_ALERT}


@router.delete("/ml/alerts/distress")
def clear_distress(phone_number: str | None = Query(default=None)):
    _ = phone_number
    global DISTRESS_ALERT
    DISTRESS_ALERT = None
    return {"success": True, "message": "distress_cleared"}


@router.get("/sensors/{zone_id}/latest")
def sensor_latest(zone_id: str):
    return {
        "zone_id": zone_id,
        "reservoir_pct": 78,
        "flow_rate": 245.6,
        "rainfall_mm": 64.0,
        "timestamp": _now_iso(),
    }


@router.get("/cascade/{zone_id}")
def cascade(zone_id: str):
    return {
        "zone_id": zone_id,
        "steps": [
            {"t_plus_minutes": 30, "event": "road_access_degrade"},
            {"t_plus_minutes": 60, "event": "substation_risk_escalation"},
        ],
    }


@router.get("/ml/analytics/vulnerability-map")
def vulnerability_map():
    return {
        "ranked_zones": [
            {"zone_id": "ZONE_PANAMARAM", "score": 94},
            {"zone_id": "ZONE_VYTHIRI", "score": 88},
            {"zone_id": "ZONE_SULTHAN_BATHERY", "score": 79},
        ],
        "permanently_undrained_wards": ["G-South"],
    }


@router.get("/ml/lead-times")
def lead_times(scenario: str = Query(default="2024_peak")):
    _ = scenario
    return {
        "lead_time_tickers": [
            {"zone_id": "ZONE_PANAMARAM", "hours_until_peak": 2, "severity": "CRITICAL"},
            {"zone_id": "ZONE_VYTHIRI", "hours_until_peak": 4, "severity": "HIGH"},
            {"zone_id": "ZONE_SULTHAN_BATHERY", "hours_until_peak": 6, "severity": "ELEVATED"},
        ]
    }


@router.get("/ml/roi/rankings")
def roi_rankings():
    return [
        {"zone_id": "ZONE_PANAMARAM", "roi_score": 93, "recommendation": "Pump hardening + diversion channels"},
        {"zone_id": "ZONE_VYTHIRI", "roi_score": 85, "recommendation": "Road-grade flood barriers"},
        {"zone_id": "ZONE_KALPETTA", "roi_score": 72, "recommendation": "Drain augmentation"},
    ]


@router.post("/auth/request-otp")
def request_otp(payload: dict):
    phone = payload.get("phone_number")
    if not phone:
        return {"success": False, "detail": "phone_number_required"}
    return {"success": True, "message": "otp_sent", "otp": "1234"}


@router.post("/auth/verify-otp")
def verify_otp(payload: dict):
    phone = payload.get("phone_number")
    otp = payload.get("otp")
    role = payload.get("role", "Public")
    if not phone or not otp:
        return {"success": False, "detail": "phone_and_otp_required"}
    if str(otp) != "1234":
        return {"success": False, "detail": "invalid_otp"}
    return {"success": True, "user": {"phone_number": phone, "role": role}}
