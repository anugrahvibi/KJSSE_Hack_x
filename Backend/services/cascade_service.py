from __future__ import annotations

import json
from datetime import timezone, datetime
from pathlib import Path

import networkx as nx

from ..models.cascade import CascadeStep, VulnerabilityNode, VulnerabilityReport


class CascadeService:
    def __init__(self, graph_path: Path, outfalls_path: Path, wards_geojson_path: Path):
        self.graph_path = graph_path
        self.outfalls_path = outfalls_path
        self.wards_geojson_path = wards_geojson_path
        self.graph = self._load_graph()

    def _load_graph(self) -> nx.DiGraph:
        with self.graph_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        graph = nx.DiGraph()
        for node in data.get("nodes", []):
            node_id = node["id"]
            graph.add_node(node_id, **node)
        for edge in data.get("edges", []):
            graph.add_edge(edge["source"], edge["target"], **edge)
        return graph

    def _ward_node_id(self, ward_id: str) -> str:
        slug = ward_id.lower().replace("-", "_").replace(" ", "_")
        return f"ward_{slug}"

    def compute_event_cascade(self, ward_id: str) -> list[CascadeStep]:
        source = self._ward_node_id(ward_id)
        if source not in self.graph:
            return []

        steps: list[CascadeStep] = []
        cumulative_time = 0
        now = datetime.now(timezone.utc)

        for u, v in nx.bfs_edges(self.graph, source):
            edge_data = self.graph.get_edge_data(u, v) or {}
            cumulative_time += int(edge_data.get("propagation_delay_min", 30))
            node_data = self.graph.nodes[v]
            population_base = (
                node_data.get("daily_users")
                or node_data.get("daily_vehicles")
                or node_data.get("consumers")
                or node_data.get("bed_count")
                or 0
            )
            multiplier = float(edge_data.get("impact_multiplier", 0.5))
            affected = int(float(population_base) * multiplier)

            steps.append(
                CascadeStep(
                    step=len(steps) + 1,
                    node=v,
                    description=edge_data.get("failure_condition", "cascade_effect"),
                    affected_population=affected,
                    t_plus_minutes=cumulative_time,
                    timestamp=(now).isoformat().replace("+00:00", "Z"),
                )
            )
        return steps

    def compute_audit(self) -> VulnerabilityReport:
        multipliers: dict[str, int] = {}
        for node in self.graph.nodes:
            descendants = nx.descendants(self.graph, node)
            total = 0
            for n in descendants:
                attrs = self.graph.nodes[n]
                total += int(
                    attrs.get("daily_users")
                    or attrs.get("daily_vehicles")
                    or attrs.get("consumers")
                    or attrs.get("bed_count")
                    or 0
                )
            multipliers[node] = total

        ranked_pairs = sorted(multipliers.items(), key=lambda x: x[1], reverse=True)
        ranked = [VulnerabilityNode(node_id=node, score=score) for node, score in ranked_pairs]

        with self.outfalls_path.open("r", encoding="utf-8") as f:
            wards = json.load(f).get("wards", [])
        permanently_undrained = [w["ward_id"] for w in wards if w.get("permanently_undrained", False)]

        return VulnerabilityReport(
            ranked_nodes=ranked,
            single_points_of_failure=ranked[:5],
            permanently_undrained_wards=permanently_undrained,
        )

    def wards_geojson(self) -> dict:
        with self.wards_geojson_path.open("r", encoding="utf-8") as f:
            geojson = json.load(f)
        with self.outfalls_path.open("r", encoding="utf-8") as f:
            wards = json.load(f).get("wards", [])

        ward_lookup = {w["ward_id"]: w for w in wards}
        for feature in geojson.get("features", []):
            props = feature.setdefault("properties", {})
            ward_id = props.get("ward_id")
            ward_info = ward_lookup.get(ward_id, {})
            props["outfall_elevation_m"] = ward_info.get("outfall_elevation_m")
            props["mean_sea_level_diff"] = ward_info.get("mean_sea_level_m")
            props["ward_name"] = ward_info.get("ward_name", props.get("ward_name"))
        return geojson
