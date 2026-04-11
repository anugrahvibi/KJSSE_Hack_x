from pydantic import BaseModel
import networkx as nx

class CascadeStep(BaseModel):
    step: int
    node_id: str
    node_label: str
    t_plus_minutes: int
    affected_population: int
    failure_condition: str

def compute_event_cascade(G: nx.DiGraph, trigger_ward: str) -> list[CascadeStep]:
    """
    Event Mode — forward cascade traversal from the trigger ward.

    Uses BFS from trigger_ward. For each downstream node reached,
    accumulates propagation_delay_min along the path to compute
    t_plus_minutes (cumulative time from trigger to failure).

    affected_population = node.daily_users * edge.impact_multiplier

    Returns an ordered list of CascadeStep objects (soonest failure first).

    IMPORTANT: Use nx.bfs_edges(G, trigger_ward, data=True) for traversal.
    Do NOT skip nodes with no daily_users — set affected_population to 0.
    """
    steps = []
    cumulative_time = 0

    for u, v in nx.bfs_edges(G, trigger_ward):
        data = G.edges[u, v]
        cumulative_time += data.get("propagation_delay_min", 30)
        node_data = G.nodes[v]
        affected = int(
            node_data.get("daily_users", 0) * data.get("impact_multiplier", 0.5)
        )
        steps.append(CascadeStep(
            step=len(steps) + 1,
            node_id=v,
            node_label=node_data.get("label", v),
            t_plus_minutes=cumulative_time,
            affected_population=affected,
            failure_condition=data.get("failure_condition", "cascade_effect")
        ))

    return steps
