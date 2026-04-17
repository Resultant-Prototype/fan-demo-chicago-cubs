# Fan Identity Demo Template — Backlog

## Stadium SVG Generator (high value)

**Summary:** A two-stage tool for generating custom venue diagrams without manual coordinate work.

**Stage 1 — Research (Claude):**
- Given a team name and venue name, research: sponsor gate names, seating zone tier names, approximate section layout (field/lower/club/upper/outfield), gate count and positions, capacity by zone.
- Output: structured JSON schema with zone names, arc bounds, gate positions, section-to-gate probability weights.

**Stage 2 — Generation (Python script):**
- Consume the JSON schema.
- Compute SVG path coordinates for each seating zone (arcs, polygons).
- Place gate marker circles at computed positions.
- Render zone labels and gate labels.
- Output: `[team-slug]-stadium.svg` ready to drop in the repo root.

**Reference:** `fan-identity-demo-rangers/src/globe-life-field.svg` is the target output quality.

**Integration:** `build.js` already detects `[team-slug]-stadium.svg` by name and inlines it. Gate weights and section weights live in `VENUE.gateBySectionWeights` in `client-config.js`.

---

## Open Items

### Sport Presets
- **NBA/NHL preset** (`presets/nba-nhl.js`) — stubbed. Populate at first NBA or NHL client.

### Data Layer
- **STM ticket spend not scaled by sport** — `data.js` hardcodes `2500 + (seed % 2500)` for STM ticket spend. This is plausible for MLB but low for NFL (typical 9-game STM package runs $8K–15K). Make this configurable via a preset field (e.g. `SCHEDULE_PRESET.STM_SPEND_RANGE`).
- **Single-game ticket spend floor** — `games_purchased * (55 + seed % 80)` produces $55–135/game face value. Reasonable for MLB; NFL single-game prices skew higher ($150–500). Same fix: drive off preset.
- **FNB subcategory configurability** — food/beverage subcategory menus are generic defaults in `data.js`. Move them to `client-config.js` so they can reflect actual venue concession offerings.

### SVG / Heatmap
- **Suite/premium sections absent from scraped SVGs** — ticketing platform seating charts don't include suite rows (e.g. Penthouse Suites). These zones exist in the venue JSON but never render in the heat map. Consider a fallback visual indicator (e.g. a labeled box overlay) so suite zones aren't silently invisible.
- **Gate label overflow for long sponsor names** — multi-word names like "CommunityAmerica Gate" or "Founders' Plaza Gate" can clip against the SVG edge. Add a `max-chars` truncation or two-line wrap in `from_seating_chart.py`.
- **Gate positions in scraped-SVG mode are approximate** — `from_seating_chart.py` uses venue JSON `cx/cy` (designed for the 900×800 approximate geometry) directly in the scraped SVG output. The scraped SVG scales to the same 900×800 viewBox but with different stadium proportions, so gate circles may be slightly misaligned. A proper fix would project gate positions from the venue JSON's anchor points through the same transform used for sections.

### Pipeline
- **`research.js` does not validate gate count vs venue JSON** — after research, the number of gates in the generated venue JSON should be confirmed against `VENUE.gates.length` expected for the sport (NFL typically 4–6). Add a warning if the count looks off.
- **`new-demo.js --resume` regenerates SVG every time** — `--resume` reruns `from_seating_chart.py` even when the SVG is already correct. Add a `--skip-svg` flag or check for existing `[slug]-stadium.svg` before regenerating.

### Rate Limiting
- **Synthetic data API call hits org TPM limit during active sessions** — `synth.js` calls `claude-sonnet-4-6` with `max_tokens: 8192`. When the org is near the 30K input TPM ceiling (e.g. active Claude Code session), this call fails. Options: add retry-with-backoff in `synth.js`, or switch to `claude-haiku-4-5` for this step.

---

## Future Enhancements
- Post-season toggle for NFL/NBA/NHL (playoff home games extend season)
- Preseason games support in NFL preset
- Multi-team comparison view (e.g. two stadiums side by side for a prospect pitch)

---

## Completed

| Item | Fixed in | Notes |
|------|----------|-------|
| NFL preset all-null stubs | Chiefs build | Implemented with Arrowhead-appropriate values |
| `from_seating_chart.py` ignores `--config` | Chiefs build | Now reads venue JSON for zone names, gate names, fill colors |
| Zone/gate name mismatch (SVG vs data layer) | Chiefs build | SVG `data-zone` and `data-gate` now match `VENUE.sections` and `VENUE.gates` |
| `filters.js` DATE_PRESETS hardcoded to 2025 MLB | Chiefs build | Now derived dynamically from `GAMES` array |
| `main.js` smoke test hardcoded to 81 games | Chiefs build | Uses `SCHEDULE_PRESET.homeGames` |
| `GATE_LABEL_ANCHORS` hardcoded to Rangers gate names | Chiefs build | Replaced with direction computed from gate position vs SVG center |
| `from_seating_chart.py` duplicate-href parse error | Chiefs build | Strips SVG default namespace + removes `xlink:href` instead of renaming |
| `new-demo.js` fan-demos dir at `$HOME/fan-demos` | Chiefs build | Defaults to `07_Experiments/fan-demos`; override via `FAN_DEMOS_DIR` |
| No smoke test before commit | Chiefs build | `tools/smoke-test.js` wired into step 9b of `new-demo.js` |
