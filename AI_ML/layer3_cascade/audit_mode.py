from pydantic import BaseModel
import networkx as nx

class NodeVulnerability(BaseModel):
    node_id: str
    node_label: str
    cascade_multiplier: int   # total affected population if this node fails
    node_type: str

class VulnerabilityReport(BaseModel):
    ranked_nodes: list[NodeVulnerability]
    single_points_of_failure: list[NodeVulnerability]  # top 3
    permanently_undrained_wards: list[str]

def compute_vulnerability_map(G: nx.DiGraph) -> VulnerabilityReport:
    """
    Audit Mode — computes cascade multiplier for every node in the graph.

    Cascade multiplier for a node = sum of daily_users of all downstream
    nodes reachable from it (via nx.descendants).

    Ranks all nodes by cascade_multiplier descending.
    Top 3 = single points of failure.

    permanently_undrained_wards = nodes where 
    G.nodes[n].get("permanently_undrained") == True.
    """
    multipliers = {}

    for node in G.nodes:
        reachable = nx.descendants(G, node)
        total_pop = sum(G.nodes[n].get("daily_users", 0) for n in reachable)
        multipliers[node] = total_pop

    ranked = sorted(multipliers.items(), key=lambda x: x[1], reverse=True)

    ranked_nodes = [
        NodeVulnerability(
            node_id=node_id,
            node_label=G.nodes[node_id].get("label", node_id),
            cascade_multiplier=score,
            node_type=G.nodes[node_id].get("type", "unknown")
        )
        for node_id, score in ranked
    ]

    permanently_undrained = [
        n for n, data in G.nodes(data=True)
        if data.get("permanently_undrained", False)
    ]

    return VulnerabilityReport(
        ranked_nodes=ranked_nodes,
        single_points_of_failure=ranked_nodes[:3],
        permanently_undrained_wards=permanently_undrained
    )
