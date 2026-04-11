import networkx as nx
<<<<<<< HEAD
from ..layer1_detection.drain_capacity_engine import CascadeStep
=======
from AI_ML.layer1_detection.drain_capacity_engine import CascadeStep
>>>>>>> 1a11e759471384f37e6a489be63382213cbf27ae

def run_event_mode(G: nx.DiGraph, trigger_node: str) -> list[CascadeStep]:
    steps = []
    cumulative_time = 0
    
    for u, v in nx.bfs_edges(G, trigger_node):
        edge = G.edges[u, v]
        node = G.nodes[v]
        
        cumulative_time += edge["delay_minutes"]
        population_affected = int(node["population_served"] * edge["cascade_weight"])
        
        steps.append(CascadeStep(
            step=len(steps) + 1,
            node_id=v,
            node_label=node["label"],
            lat=node["lat"],
            lng=node["lng"],
            t_plus_minutes=cumulative_time,
            population_affected=population_affected,
            failure_condition=edge["failure_condition"],
            cascade_weight=edge["cascade_weight"]
        ))
    
    return sorted(steps, key=lambda x: x.t_plus_minutes)
