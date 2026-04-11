import pytest
import networkx as nx
from AI_ML.layer3_cascade.graph_builder import build_cascade_graph
from AI_ML.layer3_cascade.event_mode import compute_event_cascade, CascadeStep
from AI_ML.layer3_cascade.audit_mode import compute_vulnerability_map, VulnerabilityReport
from AI_ML.layer3_cascade.vulnerability_mapper import get_event_cascade, get_vulnerability_report

@pytest.fixture
def graph():
    return build_cascade_graph("AI_ML/data/dependency_graph.json")

# --- Graph Builder Tests ---
def test_build_cascade_graph_returns_digraph(graph):
    # Test 1
    assert isinstance(graph, nx.DiGraph)

def test_graph_has_exactly_8_nodes(graph):
    # Test 2
    assert graph.number_of_nodes() == 8

def test_graph_has_exactly_7_edges(graph):
    # Test 3
    assert graph.number_of_edges() == 7

def test_node_ward_h_east_exists(graph):
    # Test 4
    assert "ward_h_east" in graph.nodes
    assert graph.nodes["ward_h_east"]["label"] == "Dharavi (Ward H-East)"

def test_edge_ward_h_east_train_wr(graph):
    # Test 5
    assert graph.has_edge("ward_h_east", "train_network_wr")
    edge_data = graph.get_edge_data("ward_h_east", "train_network_wr")
    assert edge_data["propagation_delay_min"] == 60

# --- Event Mode Tests ---
def test_compute_event_cascade_returns_non_empty_list(graph):
    # Test 6
    result = compute_event_cascade(graph, "ward_h_east")
    assert isinstance(result, list)
    assert len(result) > 0
    assert isinstance(result[0], CascadeStep)

def test_event_cascade_first_step(graph):
    # Test 7
    result = compute_event_cascade(graph, "ward_h_east")
    assert result[0].node_id in ("train_network_wr", "road_arterial_sion", "best_electricity")

def test_event_cascade_all_steps_t_plus_minutes_gt_0(graph):
    # Test 8
    result = compute_event_cascade(graph, "ward_h_east")
    for step in result:
        assert step.t_plus_minutes > 0

def test_event_cascade_at_least_one_step_affected_pop_gt_100000(graph):
    # Test 9
    result = compute_event_cascade(graph, "ward_h_east")
    assert any(step.affected_population > 100000 for step in result)

# --- Audit Mode Tests ---
def test_compute_vulnerability_map_returns_report(graph):
    # Test 10
    result = compute_vulnerability_map(graph)
    assert isinstance(result, VulnerabilityReport)

def test_ranked_nodes_sorted_descending(graph):
    # Test 11
    result = compute_vulnerability_map(graph)
    multipliers = [node.cascade_multiplier for node in result.ranked_nodes]
    assert multipliers == sorted(multipliers, reverse=True)

def test_single_points_of_failure_has_exactly_3_entries(graph):
    # Test 12
    result = compute_vulnerability_map(graph)
    assert len(result.single_points_of_failure) == 3

def test_ward_g_south_permanently_undrained(graph):
    # Test 13
    result = compute_vulnerability_map(graph)
    assert "ward_g_south" in result.permanently_undrained_wards

def test_ward_h_east_in_top_5_ranked(graph):
    # Test 14
    result = compute_vulnerability_map(graph)
    top_5_ids = [node.node_id for node in result.ranked_nodes[:5]]
    assert "ward_h_east" in top_5_ids

# --- Vulnerability Mapper Integration Tests ---
def test_get_event_cascade_end_to_end():
    # Test 15
    result = get_event_cascade("ward_h_east", "AI_ML/data/dependency_graph.json")
    assert isinstance(result, list)
    assert len(result) > 0

def test_get_vulnerability_report_end_to_end():
    # Test 16
    result = get_vulnerability_report("AI_ML/data/dependency_graph.json")
    assert isinstance(result, VulnerabilityReport)
    assert len(result.ranked_nodes) > 0
