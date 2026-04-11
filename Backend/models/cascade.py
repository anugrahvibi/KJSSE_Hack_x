from __future__ import annotations

from pydantic import BaseModel


class CascadeStep(BaseModel):
    step: int
    node: str
    description: str
    affected_population: int
    t_plus_minutes: int
    timestamp: str


class VulnerabilityNode(BaseModel):
    node_id: str
    score: int


class VulnerabilityReport(BaseModel):
    ranked_nodes: list[VulnerabilityNode]
    single_points_of_failure: list[VulnerabilityNode]
    permanently_undrained_wards: list[str]


class DemoStartRequest(BaseModel):
    speed_multiplier: float = 1.0
