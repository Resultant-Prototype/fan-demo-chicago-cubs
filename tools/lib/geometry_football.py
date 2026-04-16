# tools/lib/geometry_football.py
import math

REQUIRED_ANCHORS = {'center', 'north_endzone', 'south_endzone', 'west_sideline', 'east_sideline'}
PUSH_PX = 30  # pixels to push outer anchors beyond the base anchor


def _push_from_center(center, point, extra_px):
    """Extend the vector center→point by extra_px pixels."""
    cx, cy = center
    dx, dy = point[0] - cx, point[1] - cy
    d = math.hypot(dx, dy)
    if d == 0:
        return list(point)
    return [cx + dx / d * (d + extra_px), cy + dy / d * (d + extra_px)]


def _midpoint(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]


def build_anchor_table(base_anchors: dict) -> dict:
    missing = REQUIRED_ANCHORS - set(base_anchors.keys())
    if missing:
        raise ValueError(f"Missing required football anchors: {sorted(missing)}")
    t = dict(base_anchors)
    c = base_anchors['center']

    t['north_outer'] = _push_from_center(c, t['north_endzone'], PUSH_PX)
    t['south_outer'] = _push_from_center(c, t['south_endzone'], PUSH_PX)

    for name, a, b in [
        ('nw_outer', t['north_outer'], t['west_sideline']),
        ('ne_outer', t['north_outer'], t['east_sideline']),
        ('sw_outer', t['south_outer'], t['west_sideline']),
        ('se_outer', t['south_outer'], t['east_sideline']),
    ]:
        mid = _midpoint(a, b)
        t[name] = _push_from_center(c, mid, PUSH_PX)

    # Additional convenience anchors
    t['west_outer'] = _push_from_center(c, t['west_sideline'], PUSH_PX)
    t['east_outer'] = _push_from_center(c, t['east_sideline'], PUSH_PX)
    return t


def build_field_overlay(anchors: dict) -> str:
    """Return SVG for a football field overlay (field + end zones + hash marks)."""
    c  = anchors['center']
    ne = anchors['north_endzone']
    se = anchors['south_endzone']
    ws = anchors['west_sideline']
    es = anchors['east_sideline']

    field_h = se[1] - ne[1]   # north to south
    field_w = es[0] - ws[0]   # west to east
    end_zone_h = round(field_h * 0.1, 1)  # ~10% of field = end zone depth

    parts = []

    # Main grass
    parts.append(
        f'  <rect class="football-field" fill="#2d6e3e" stroke="none"\n'
        f'        x="{ws[0]}" y="{ne[1]}" width="{field_w}" height="{field_h}"/>'
    )

    # North end zone
    parts.append(
        f'  <rect class="end-zone" fill="#1a5c30" stroke="none"\n'
        f'        x="{ws[0]}" y="{ne[1]}" width="{field_w}" height="{end_zone_h}"/>'
    )

    # South end zone
    parts.append(
        f'  <rect class="end-zone" fill="#1a5c30" stroke="none"\n'
        f'        x="{ws[0]}" y="{se[1] - end_zone_h}" width="{field_w}" height="{end_zone_h}"/>'
    )

    # Midfield line (50-yard line)
    mx, my = c[0], c[1]
    parts.append(
        f'  <line stroke="white" stroke-width="1.5" stroke-opacity="0.5"\n'
        f'        x1="{ws[0]}" y1="{my}" x2="{es[0]}" y2="{my}"/>'
    )

    # Yard lines (4 additional lines — 0.5 omitted; midfield already drawn above)
    for frac in [0.25, 0.375, 0.625, 0.75]:
        y = round(ne[1] + field_h * frac, 1)
        parts.append(
            f'  <line stroke="white" stroke-width="0.75" stroke-opacity="0.3"\n'
            f'        x1="{ws[0]}" y1="{y}" x2="{es[0]}" y2="{y}"/>'
        )

    return '\n'.join(parts)
