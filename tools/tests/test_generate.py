# tools/tests/test_generate.py
# Note: sys.path is set by conftest.py — no per-file insert needed
import pytest
from generate import resolve_path_entry, resolve_zone_path, validate_alignment

ANCHORS = {
    "center":    [450, 490],
    "cf_wall":   [450,  56],
    "lf_corner": [140, 182],
}

# ── resolve_path_entry ──────────────────────────────────────────

def test_resolve_string_anchor():
    result = resolve_path_entry("cf_wall", ANCHORS)
    assert result == [450, 56]

def test_resolve_string_anchor_unknown_raises():
    with pytest.raises(ValueError, match="unknown anchor 'bad_anchor'"):
        resolve_path_entry("bad_anchor", ANCHORS)

def test_resolve_offset_pct_half():
    # 50% from center [450,490] toward cf_wall [450,56]
    # x: 450 + (450-450)*0.5 = 450
    # y: 490 + (56-490)*0.5 = 490 - 217 = 273
    result = resolve_path_entry({"anchor": "cf_wall", "offset_pct": 0.5}, ANCHORS)
    assert result == pytest.approx([450, 273])

def test_resolve_offset_pct_full():
    result = resolve_path_entry({"anchor": "cf_wall", "offset_pct": 1.0}, ANCHORS)
    assert result == pytest.approx([450, 56])

def test_resolve_offset_pct_zero():
    result = resolve_path_entry({"anchor": "cf_wall", "offset_pct": 0.0}, ANCHORS)
    assert result == pytest.approx([450, 490])  # = center

def test_resolve_offset_pct_unknown_anchor_raises():
    with pytest.raises(ValueError, match="unknown anchor 'bad'"):
        resolve_path_entry({"anchor": "bad", "offset_pct": 0.5}, ANCHORS)

# ── resolve_zone_path ──────────────────────────────────────────

def test_resolve_zone_path_strings():
    path = ["cf_wall", "lf_corner"]
    result = resolve_zone_path(path, ANCHORS)
    assert result == [[450, 56], [140, 182]]

def test_resolve_zone_path_mixed():
    path = ["cf_wall", {"anchor": "cf_wall", "offset_pct": 0.5}]
    result = resolve_zone_path(path, ANCHORS)
    assert result[0] == [450, 56]
    assert result[1] == pytest.approx([450, 273])

# ── validate_alignment ─────────────────────────────────────────

def test_validate_alignment_passes():
    zones  = [{"data_zone": "A"}, {"data_zone": "B"}]
    gates  = [{"data_gate": "G1"}, {"data_gate": "G2"}]
    weights = {"A": [10, 90], "B": [80, 20]}
    # Should not raise
    validate_alignment(zones, gates, weights)

def test_validate_alignment_missing_weight_key_warns(capsys):
    zones  = [{"data_zone": "A"}, {"data_zone": "B"}]
    gates  = [{"data_gate": "G1"}]
    weights = {"A": [100]}   # B missing from weights
    validate_alignment(zones, gates, weights)
    captured = capsys.readouterr()
    assert "WARNING" in captured.out or "WARNING" in captured.err

def test_validate_alignment_wrong_weight_length_warns(capsys):
    zones  = [{"data_zone": "A"}]
    gates  = [{"data_gate": "G1"}, {"data_gate": "G2"}]
    weights = {"A": [100]}  # length 1, but 2 gates
    validate_alignment(zones, gates, weights)
    captured = capsys.readouterr()
    assert "WARNING" in captured.out or "WARNING" in captured.err
