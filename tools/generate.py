# tools/generate.py
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json, argparse
from pathlib import Path
from lib import geometry_baseball, geometry_football
from lib.svg_builder import (build_zone_polygon, build_gate_circle,
                              build_gate_label, build_north_indicator)


# ── Path resolution ────────────────────────────────────────────

def resolve_path_entry(entry, anchors: dict):
    """Resolve one path entry to [x, y].
    entry is either a string anchor name or {"anchor": "...", "offset_pct": N}.
    """
    if isinstance(entry, str):
        if entry not in anchors:
            raise ValueError(f"unknown anchor '{entry}' — available: {sorted(anchors)}")
        return list(anchors[entry])
    # offset_pct object
    name = entry["anchor"]
    pct  = entry["offset_pct"]
    if name not in anchors:
        raise ValueError(f"unknown anchor '{name}' — available: {sorted(anchors)}")
    cx, cy = anchors["center"]
    ax, ay = anchors[name]
    return [cx + (ax - cx) * pct, cy + (ay - cy) * pct]


def resolve_zone_path(path_list: list, anchors: dict) -> list:
    return [resolve_path_entry(entry, anchors) for entry in path_list]


# ── Validation ─────────────────────────────────────────────────

def validate_alignment(zones: list, gates: list, gate_weights: dict):
    """Warn (non-fatal) on weight key mismatches or wrong array lengths."""
    zone_names = {z["data_zone"] for z in zones}
    gate_count = len(gates)
    for name in zone_names:
        if name not in gate_weights:
            print(f"WARNING: gate_by_zone_weights missing key '{name}'", file=sys.stderr)
    for name, weights in gate_weights.items():
        if len(weights) != gate_count:
            print(
                f"WARNING: gate_by_zone_weights['{name}'] has {len(weights)} values "
                f"but there are {gate_count} gates",
                file=sys.stderr,
            )
