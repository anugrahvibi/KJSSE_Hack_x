import networkx as nx
from layer1_detection.drain_capacity_engine import NodeRanking, VulnerabilityReport

def run_audit_mode(G: nx.DiGraph, ward_data: list[dict]) -> VulnerabilityReport:
    ranked_nodes = []
    
    for node in G.nodes:
        descendants = nx.descendants(G, node)
        cascade_multiplier = sum(G.nodes[d].get("population_served", 0) for d in descendants)
        node_data = G.nodes[node]
        
        ranked_nodes.append(NodeRanking(
            node_id=node,
            node_label=node_data["label"],
            lat=node_data["lat"],
            lng=node_data["lng"],
            cascade_multiplier=cascade_multiplier,
            downstream_node_count=len(descendants)
        ))
        
    ranked_nodes.sort(key=lambda x: x.cascade_multiplier, reverse=True)
    single_points_of_failure = ranked_nodes[:3]
    
    permanently_undrained_wards = [
        w["ward_id"] for w in ward_data if w.get("permanently_undrained", False)
    ]
    
    return VulnerabilityReport(
        ranked_nodes=ranked_nodes,
        single_points_of_failure=single_points_of_failure,
        permanently_undrained_wards=permanently_undrained_wards
    )
