# tools/tests/test_scaffold_config.py
import pytest, colorsys
from scaffold_config import hex_to_hls, derive_brand_colors, scaffold_config

# ── hex_to_hls ──────────────────────────────────────────────────

def test_hex_to_hls_black():
    h, l, s = hex_to_hls("#000000")
    assert l == pytest.approx(0.0)

def test_hex_to_hls_white():
    h, l, s = hex_to_hls("#ffffff")
    assert l == pytest.approx(1.0)

def test_hex_to_hls_rangers_navy():
    h, l, s = hex_to_hls("#003087")
    assert h == pytest.approx(0.607, abs=0.01)   # hue ≈ 218.7°/360
    assert l == pytest.approx(0.265, abs=0.01)   # L ≈ 26.5%
    assert s == pytest.approx(1.0,   abs=0.01)   # S = 100%

# ── derive_brand_colors ─────────────────────────────────────────

def test_navy_is_exact_primary():
    brand = derive_brand_colors("#003087", "#C4A141")
    assert brand['navy'] == "#003087"

def test_navy_mid_lightened():
    brand = derive_brand_colors("#003087", "#C4A141")
    _, l_orig, _ = hex_to_hls("#003087")
    _, l_mid, _  = hex_to_hls(brand['navyMid'])
    assert l_mid == pytest.approx(min(0.9, l_orig + 0.10), abs=0.02)

def test_navy_ghost_lightened():
    brand = derive_brand_colors("#003087", "#C4A141")
    _, l_orig, _  = hex_to_hls("#003087")
    _, l_ghost, _ = hex_to_hls(brand['navyGhost'])
    assert l_ghost == pytest.approx(min(0.9, l_orig + 0.55), abs=0.02)

def test_accent_is_exact_secondary():
    brand = derive_brand_colors("#003087", "#C4A141")
    assert brand['accent'] == "#C4A141"

def test_accent_red_hardcoded():
    brand = derive_brand_colors("#003087", "#C4A141")
    assert brand['accentRed'] == "#D85F52"

def test_accent_soft_is_rgba():
    brand = derive_brand_colors("#003087", "#C4A141")
    assert brand['accentSoft'].startswith('rgba(')
    assert '0.55' in brand['accentSoft']

def test_navy_rgb_format():
    brand = derive_brand_colors("#003087", "#C4A141")
    parts = brand['navyRgb'].split(',')
    assert len(parts) == 3
    assert all(p.strip().isdigit() for p in parts)

# ── scaffold_config ─────────────────────────────────────────────

SAMPLE_VENUE = {
    "schema_version": "1.0",
    "sport": "nfl",
    "team": {"name": "Kansas City Chiefs", "short_name": "Chiefs",
             "slug": "kc-chiefs", "stm_label": "Season Ticket Member"},
    "identity": {"primary_hex": "#E31837", "secondary_hex": "#FFB81C",
                 "ticketing_vendor": "SeatGeek", "scan_vendor": "SeatGeek", "fnb_vendor": "Legends"},
    "venue": {"name": "GEHA Field at Arrowhead Stadium", "capacity": 76416},
    "svg": {
        "viewbox": "0 0 900 800", "sport_geometry": "football",
        "anchors": {"center": [450, 400]},
        "zones": [
            {"name": "Upper Deck", "data_zone": "Upper Deck", "layer": 1,
             "fill": "#b8cce4", "suite_level": False, "path": []},
            {"name": "Club Level", "data_zone": "Club Level", "layer": 2,
             "fill": "#1a3f6f", "suite_level": True, "path": []},
        ],
        "gates": [
            {"name": "Gate 1", "data_gate": "Gate 1", "cx": 450, "cy": 75,
             "label_side": "top", "fill": "#E31837", "is_premium": False},
        ],
        "gate_by_zone_weights": {"Upper Deck": [100], "Club Level": [100]},
    }
}

def test_scaffold_contains_team_fields():
    out = scaffold_config(SAMPLE_VENUE)
    assert "Kansas City Chiefs" in out
    assert "'Chiefs'" in out or '"Chiefs"' in out
    assert "SeatGeek" in out

def test_scaffold_contains_brand_navy():
    out = scaffold_config(SAMPLE_VENUE)
    assert "#E31837" in out   # navy = exact primary

def test_scaffold_venue_sections():
    out = scaffold_config(SAMPLE_VENUE)
    assert "Upper Deck" in out
    assert "Club Level" in out

def test_scaffold_venue_gates():
    out = scaffold_config(SAMPLE_VENUE)
    assert "Gate 1" in out

def test_scaffold_gate_weights():
    out = scaffold_config(SAMPLE_VENUE)
    assert "gateBySectionWeights" in out

def test_scaffold_has_stubs():
    out = scaffold_config(SAMPLE_VENUE)
    assert "STUB" in out   # manual fields marked as STUB

def test_scaffold_has_module_exports():
    out = scaffold_config(SAMPLE_VENUE)
    assert "module.exports" in out
