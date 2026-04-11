import networkx as nx
import json

def build_graph(path: str = "data/dependency_graph.json") -> nx.DiGraph:
    """
    Loads dependency_graph.json and builds a directed weighted NetworkX graph.
    Each node stores all its attributes (label, type, daily_users, etc).
    Each edge stores: propagation_delay_min, impact_multiplier, failure_condition.
    Returns the fully constructed DiGraph.
    """
    with open(path) as f:
        data = json.load(f)
    G = nx.DiGraph()
    for node in data["nodes"]:
        G.add_node(node["id"], **node)
    for edge in data["edges"]:
        G.add_edge(
            edge["from"], edge["to"],
            delay_minutes=edge["delay_minutes"],
            cascade_weight=edge["cascade_weight"],
            failure_condition=edge["failure_condition"]
        )
    return G

G = build_graph()
