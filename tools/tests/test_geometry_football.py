# tools/tests/test_geometry_football.py
import pytest, math
from lib.geometry_football import build_anchor_table, build_field_overlay

CHIEFS_BASE = {
    "center":        [450, 400],
    "north_endzone": [450,  95],
    "south_endzone": [450, 705],
    "west_sideline": [ 95, 400],
    "east_sideline": [805, 400],
}

def test_base_anchors_passthrough():
    table = build_anchor_table(CHIEFS_BASE)
    assert table["center"] == [450, 400]
    assert table["north_endzone"] == [450, 95]

def test_north_outer_pushed_from_center():
    table = build_anchor_table(CHIEFS_BASE)
    # north_outer = north_endzone pushed 30px further from center
    # center=[450,400], north_endzone=[450,95]: direction is [0,-1]
    # north_outer = [450, 95 - 30] = [450, 65]
    assert table["north_outer"] == pytest.approx([450, 65])

def test_south_outer_pushed_from_center():
    table = build_anchor_table(CHIEFS_BASE)
    # south_endzone=[450,705]: direction from center is [0,+1]
    # south_outer = [450, 705 + 30] = [450, 735]
    assert table["south_outer"] == pytest.approx([450, 735])

def test_nw_outer_derived():
    table = build_anchor_table(CHIEFS_BASE)
    # nw_outer = midpoint(north_outer, west_sideline) pushed 30px from center
    no = table["north_outer"]  # [450, 65]
    ws = CHIEFS_BASE["west_sideline"]  # [95, 400]
    mid = [(no[0] + ws[0]) / 2, (no[1] + ws[1]) / 2]  # [272.5, 232.5]
    cx, cy = CHIEFS_BASE["center"]
    dx, dy = mid[0] - cx, mid[1] - cy
    d = math.hypot(dx, dy)
    expected = [cx + dx/d * (d + 30), cy + dy/d * (d + 30)]
    assert table["nw_outer"] == pytest.approx(expected, abs=0.1)

def test_missing_required_anchor_raises():
    bad = dict(CHIEFS_BASE)
    del bad["center"]
    with pytest.raises(ValueError, match="center"):
        build_anchor_table(bad)

def test_field_overlay_contains_playing_surface():
    table = build_anchor_table(CHIEFS_BASE)
    svg = build_field_overlay(table)
    assert 'class="football-field"' in svg

def test_field_overlay_contains_end_zones():
    table = build_anchor_table(CHIEFS_BASE)
    svg = build_field_overlay(table)
    assert 'class="end-zone"' in svg
