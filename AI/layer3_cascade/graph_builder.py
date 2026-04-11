import networkx as nx
import json
import os

<<<<<<< HEAD
def build_graph(path: str = None) -> nx.DiGraph:
=======
def build_graph(path: str = "AI/data/dependency_graph.json") -> nx.DiGraph:
>>>>>>> 1a11e759471384f37e6a489be63382213cbf27ae
    """
    Loads dependency_graph.json and builds a directed weighted NetworkX graph.
    Each node stores all its attributes (label, type, daily_users, etc).
    Each edge stores: propagation_delay_min, impact_multiplier, failure_condition.
    Returns the fully constructed DiGraph.
    """
    if path is None:
        # Get the directory of this file and go up to Backend/data
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))  # Go up from AI/layer3_cascade to project root
        path = os.path.join(project_root, "Backend", "data", "dependency_graph.json")
    
    with open(path) as f:
        data = json.load(f)
    G = nx.DiGraph()
    for node in data["nodes"]:
        node_id = node["id"]
        # Normalize population field
        population = node.get("population_served") or node.get("daily_users") or node.get("daily_vehicles") or 0
        # Add default lat/lng if not present
        lat = node.get("lat", 19.0760)  # Default Mumbai coordinates
        lng = node.get("lng", 72.8777)
        
        # Create node attributes, ensuring no duplicates
        node_attrs = {k: v for k, v in node.items() if k != "id"}
        node_attrs["population_served"] = population
        node_attrs["lat"] = lat
        node_attrs["lng"] = lng
        
        G.add_node(node_id, **node_attrs)
    for edge in data["edges"]:
        # Handle both "from"/"to" and "source"/"target" formats
        source = edge.get("from") or edge.get("source")
        target = edge.get("to") or edge.get("target")
        G.add_edge(
            source, target,
            delay_minutes=edge.get("delay_minutes", edge.get("propagation_delay_min", 30)),
            cascade_weight=edge.get("cascade_weight", edge.get("impact_multiplier", 0.5)),
            failure_condition=edge.get("failure_condition", "cascade_effect")
        )
    return G

G = build_graph()
