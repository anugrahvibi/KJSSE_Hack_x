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

from AI.layer2_actionability.agent import client

def narrate_vulnerability(ranked_nodes: list, G: nx.DiGraph) -> str:
    top_node = ranked_nodes[0]
    node_data = G.nodes[top_node.node_id]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": """You are RIVA's vulnerability 
analyst for Mumbai. You receive infrastructure vulnerability data and write 
a 3-sentence plain-English explanation of what the top vulnerability means 
for the city. Write for a Municipal Commissioner, not an engineer. Be 
specific about consequences. Be urgent. Return only the text, no JSON."""},
            {"role": "user", "content": f"""
Top vulnerability: {node_data.get('label')}
Cascade multiplier: {top_node.cascade_multiplier} people affected
Downstream failures: {[G.nodes[n].get('label') for n in nx.descendants(G, top_node.node_id)]}
Write the vulnerability narrative now."""}
        ],
        temperature=0.4
    )
    return response.choices[0].message.content
