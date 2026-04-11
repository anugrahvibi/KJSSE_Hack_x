import networkx as nx
import json

def build_graph(path: str = "AI_ML/data/dependency_graph.json") -> nx.DiGraph:
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
