import json
import networkx as nx

def build_cascade_graph(path: str = "AI_ML/data/dependency_graph.json") -> nx.DiGraph:
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
        node_id = node.pop("id")
        G.add_node(node_id, **node)

    for edge in data["edges"]:
        G.add_edge(
            edge["source"],
            edge["target"],
            propagation_delay_min=edge["propagation_delay_min"],
            impact_multiplier=edge["impact_multiplier"],
            failure_condition=edge["failure_condition"]
        )

    return G
