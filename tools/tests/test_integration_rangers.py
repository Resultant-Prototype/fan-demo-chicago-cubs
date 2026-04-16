# tools/tests/test_integration_rangers.py
import json, re
from pathlib import Path
from generate import generate_svg, validate_alignment

FIXTURE = Path(__file__).parent / 'fixtures' / 'texas-rangers-venue.json'

def load_venue():
    return json.loads(FIXTURE.read_text())

def test_fixture_loads():
    venue = load_venue()
    assert venue['team']['slug'] == 'texas-rangers'
    assert venue['sport'] == 'mlb'

def test_six_zones_rendered():
    venue = load_venue()
    svg = generate_svg(venue)
    assert svg.count('class="section-zone"') == 6

def test_seven_gates_rendered():
    venue = load_venue()
    svg = generate_svg(venue)
    assert svg.count('class="gate-marker"') == 7

def test_all_zone_names_present():
    venue = load_venue()
    svg = generate_svg(venue)
    for name in ["Upper Level","Outfield","Main Level","Balcones Speakeasy","Field Level","Lexus Club"]:
        assert f'data-zone="{name}"' in svg, f"Missing data-zone: {name}"

def test_all_gate_names_present():
    venue = load_venue()
    svg = generate_svg(venue)
    for name in ["Northwest Entry","TXU Energy North Entry","Comerica Northeast Entry",
                 "VIP Entry North","VIP Entry South","SeatGeek Southeast Entry","Toyota Southwest Entry"]:
        assert f'data-gate="{name}"' in svg, f"Missing data-gate: {name}"

def test_premium_gates_use_own_fill_color():
    venue = load_venue()
    svg = generate_svg(venue)
    # generate_svg uses gate['fill'] directly — is_premium is a data attribute only.
    # In the Rangers fixture, VIP gates have fill="#c41e3a" set by the researcher.
    vip_match = re.search(r'data-gate="VIP Entry North"[^/]*/>', svg, re.DOTALL)
    assert vip_match, "VIP Entry North gate not found"
    assert '#c41e3a' in vip_match.group(0).lower() or '#C41E3A' in vip_match.group(0)

def test_field_overlay_present():
    venue = load_venue()
    svg = generate_svg(venue)
    assert 'class="warning-track"' in svg
    assert 'class="playing-field"' in svg
    assert 'class="infield-dirt"' in svg

def test_validation_passes():
    venue = load_venue()
    # Should not raise or print warnings
    validate_alignment(venue['svg']['zones'], venue['svg']['gates'],
                       venue['svg']['gate_by_zone_weights'])

def test_scaffold_config_produces_valid_js_structure():
    from scaffold_config import scaffold_config
    venue = load_venue()
    js = scaffold_config(venue)
    assert 'const TEAM' in js
    assert 'const BRAND' in js
    assert 'const VENUE' in js
    assert 'module.exports' in js
    assert 'Texas Rangers' in js
    assert '#003087' in js
