import pytest
from AI.layer3_cascade.graph_builder import build_graph
from AI.layer3_cascade.event_mode import run_event_mode
from AI.layer3_cascade.audit_mode import run_audit_mode

@pytest.fixture
def graph():
    return build_graph("AI/data/dependency_graph.json")

def test_graph_builds_correctly(graph):
    # Test 1
    assert "WARD_H_EAST" in graph.nodes
    assert graph.number_of_edges() >= 7

def test_event_mode_trigger(graph):
    # Test 2
    sequence = run_event_mode(graph, "WARD_H_EAST")
    assert len(sequence) > 0
    assert sequence[0].node_id in ["WESTERN_RAILWAY", "SION_ROAD"]
    assert all(s.lat is not None for s in sequence)
    assert sequence == sorted(sequence, key=lambda x: x.t_plus_minutes)

def test_audit_mode_rankings(graph):
    # Test 3
    mock_ward_data = [{"ward_id": "H-East", "permanently_undrained": False}]
    report = run_audit_mode(graph, mock_ward_data)
    assert len(report.ranked_nodes) > 0
    assert report.ranked_nodes[0].cascade_multiplier >= report.ranked_nodes[-1].cascade_multiplier
    assert len(report.single_points_of_failure) == 3

def test_permanently_undrained_wards(graph):
    # Test 4
    mock_ward_data = [{"ward_id": "G-South", "permanently_undrained": True}]
    report = run_audit_mode(graph, mock_ward_data)
    assert "G-South" in report.permanently_undrained_wards
