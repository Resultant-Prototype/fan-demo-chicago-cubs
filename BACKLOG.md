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

## Sport Preset Completion

- **NFL preset** (`presets/nfl.js`) — stubbed. Fully populate during Kansas City Chiefs build.
- **NBA/NHL preset** (`presets/nba-nhl.js`) — stubbed. Populate at first NBA or NHL client.

## Future Enhancements

- Post-season toggle for NFL/NBA/NHL (playoff home games extend season)
- Preseason games support in NFL preset
- FNB subcategory configurability in `client-config.js` (currently generic defaults in `data.js`)
