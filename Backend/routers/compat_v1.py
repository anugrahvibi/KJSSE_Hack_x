from __future__ import annotations

from datetime import timezone, datetime

from fastapi import APIRouter, Query

from ..services.runtime import log_service

router = APIRouter(prefix="/api/v1", tags=["compat-v1"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


ZONE_ROWS = [
    {"zone_id": "ZONE_H_EAST", "zone_name": "Ward H-East (Dharavi)"},
    {"zone_id": "ZONE_G_SOUTH", "zone_name": "Ward G-South (Worli)"},
    {"zone_id": "ZONE_F_NORTH", "zone_name": "Ward F-North (Matunga)"},
    {"zone_id": "ZONE_L", "zone_name": "Ward L (Kurla)"},
    {"zone_id": "ZONE_M_WEST", "zone_name": "Ward M-West (Chembur)"},
    {"zone_id": "ZONE_K_EAST", "zone_name": "Ward K-East (Andheri)"},
]

INFRA_NODES = [
    {"id": "substation_dharavi", "name": "Dharavi Substation", "type": "substation", "lat": 19.0380, "lon": 72.8530},
    {"id": "pump_sion", "name": "Sion Pump", "type": "water_pump", "lat": 19.0433, "lon": 72.8697},
    {"id": "hospital_kem", "name": "KEM Hospital", "type": "hospital", "lat": 19.0022, "lon": 72.8419},
    {"id": "road_weyh", "name": "Western Express Hwy", "type": "road", "lat": 19.0500, "lon": 72.8400},
    {"id": "station_kurla", "name": "Kurla Station", "type": "comm_tower", "lat": 19.0600, "lon": 72.8600},
]

INFRA_EDGES = [
    {"source": "substation_dharavi", "target": "pump_sion", "weight": 0.7},
    {"source": "pump_sion", "target": "hospital_kem", "weight": 0.8},
    {"source": "road_weyh", "target": "hospital_kem", "weight": 0.6},
]

PREDICTIONS = [
    {"zone_id": "ZONE_H_EAST", "zone_name": "Ward H-East", "flood_probability": 0.42, "lead_time_hours": 7.0},
    {"zone_id": "ZONE_G_SOUTH", "zone_name": "Ward G-South", "flood_probability": 0.58, "lead_time_hours": 5.5},
    {"zone_id": "ZONE_F_NORTH", "zone_name": "Ward F-North", "flood_probability": 0.33, "lead_time_hours": 9.0},
    {"zone_id": "ZONE_L", "zone_name": "Ward L", "flood_probability": 0.73, "lead_time_hours": 3.5},
    {"zone_id": "ZONE_M_WEST", "zone_name": "Ward M-West", "flood_probability": 0.81, "lead_time_hours": 2.0},
    {"zone_id": "ZONE_K_EAST", "zone_name": "Ward K-East", "flood_probability": 0.39, "lead_time_hours": 8.0},
]

DISTRESS_ALERT: dict | None = None


def _default_actions() -> list[dict]:
    return [
        {
            "department": "bmc_stormwater",
            "action": "Activate Love Grove and Cleveland Bunder pumping stations to max outreach.",
            "alert_level": "ORANGE",
            "priority": "HIGH",
            "source": "RIVA Layer 2",
            "time_window_hours": 6,
            "timestamp": _now_iso(),
        },
        {
            "department": "ndrf_rescue",
            "action": "Deploy Rescue Unit 4 to Dharavi transit corridor near 60 Feet Road.",
            "alert_level": "RED",
            "priority": "CRITICAL",
            "source": "RIVA Layer 2",
            "time_window_hours": 2,
            "timestamp": _now_iso(),
        },
        {
            "department": "ward_officer",
            "action": "Execute immediate road closure markers for Sion underpass and Milan subway.",
            "alert_level": "ORANGE",
            "priority": "HIGH",
            "source": "RIVA Layer 2",
            "time_window_hours": 4,
            "timestamp": _now_iso(),
        },
        {
            "department": "western_railway",
            "action": "Trigger phased service slowdown at Kurla-Sion bottleneck; monitor track sub-levels.",
            "alert_level": "RED",
            "priority": "CRITICAL",
            "source": "RIVA Layer 2",
            "time_window_hours": 3,
            "timestamp": _now_iso(),
        },
        {
            "department": "dev_sys",
            "action": "Switch Command Center to High-Tide Synchronization Mode (HTSM).",
            "alert_level": "YELLOW",
            "priority": "MEDIUM",
            "source": "RIVA Layer 2",
            "time_window_hours": 12,
            "timestamp": _now_iso(),
        },
        {
            "department": "Public",
            "action": "Avoid low-lying subways; use 90 Feet Road northbound for trans-ward movement.",
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
            {"zone_id": "ZONE_H_EAST", "score": 94},
            {"zone_id": "ZONE_L", "score": 88},
            {"zone_id": "ZONE_G_SOUTH", "score": 79},
        ],
        "permanently_undrained_wards": ["G-South"],
    }


@router.get("/ml/lead-times")
def lead_times(scenario: str = Query(default="2024_peak")):
    _ = scenario
    return {
        "lead_time_tickers": [
            {"zone_id": "ZONE_H_EAST", "hours_until_peak": 2, "severity": "CRITICAL"},
            {"zone_id": "ZONE_L", "hours_until_peak": 4, "severity": "HIGH"},
            {"zone_id": "ZONE_G_SOUTH", "hours_until_peak": 6, "severity": "ELEVATED"},
        ]
    }


@router.get("/ml/roi/rankings")
def roi_rankings():
    return [
        {"zone_id": "ZONE_H_EAST", "roi_score": 93, "recommendation": "Pump hardening + diversion channels"},
        {"zone_id": "ZONE_L", "roi_score": 85, "recommendation": "Road-grade flood barriers"},
        {"zone_id": "ZONE_F_NORTH", "roi_score": 72, "recommendation": "Drain augmentation"},
    ]


@router.post("/auth/request-otp")
def request_otp(payload: dict):
    phone = payload.get("phone_number")
    if not phone:
        return {"success": False, "detail": "phone_number_required"}
    otp = "1111" if str(phone) == "9074121510" else "1234"
    return {"success": True, "message": "otp_sent", "otp": otp}


@router.post("/auth/verify-otp")
def verify_otp(payload: dict):
    phone = payload.get("phone_number")
    otp = payload.get("otp")
    role = payload.get("role", "Public")
    if not phone or not otp:
        return {"success": False, "detail": "phone_and_otp_required"}
    
    expected_otp = "1111" if str(phone) == "9074121510" else "1234"
    if str(otp) != expected_otp:
        return {"success": False, "detail": "invalid_otp"}
    return {"success": True, "user": {"phone_number": phone, "role": role}}
