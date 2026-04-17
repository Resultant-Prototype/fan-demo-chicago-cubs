#!/usr/bin/env node
// tools/smoke-test.js
// Headless verification that the data layer generates non-zero values.
// Run after `node build.js`, before `git commit`.
// Exit 0 = pass, exit 2 = fail (new-demo.js treats non-zero as fatal).
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const SRC = path.join(__dirname, '..', 'src');
const cfg = require('../src/client-config');

const presetFile = path.join(SRC, 'presets', `${cfg.TEAM.sport}.js`);
if (!fs.existsSync(presetFile)) {
  console.error(`✗ No preset file for sport "${cfg.TEAM.sport}": ${presetFile}`);
  process.exit(2);
}

// Concatenate only the data layer — no DOM needed
const layers = ['client-config.js', `presets/${cfg.TEAM.sport}.js`, 'data.js', 'filters.js']
  .map(f => fs.readFileSync(path.join(SRC, f), 'utf8'));

// Inline checks run in the same scope as the data layer so they can access const globals
const checks = `
(function smokeCheck() {
  const errors = [];
  const hg = SCHEDULE_PRESET.homeGames;

  // Game record counts
  if (!GAMES          || GAMES.length !== hg)         errors.push('GAMES: expected ' + hg + ', got ' + (GAMES ? GAMES.length : 'undefined'));
  if (!GAME_TICKETS   || GAME_TICKETS.length !== hg)  errors.push('GAME_TICKETS: expected ' + hg + ', got ' + (GAME_TICKETS ? GAME_TICKETS.length : 'undefined'));
  if (!GAME_SCANS     || GAME_SCANS.length !== hg)    errors.push('GAME_SCANS: expected ' + hg + ', got ' + (GAME_SCANS ? GAME_SCANS.length : 'undefined'));
  if (!GAME_FNB       || GAME_FNB.length !== hg)      errors.push('GAME_FNB: expected ' + hg + ', got ' + (GAME_FNB ? GAME_FNB.length : 'undefined'));
  if (!FANS           || FANS.length === 0)            errors.push('FANS: empty');

  // Non-zero data values (catches null preset stubs)
  if (GAME_TICKETS && GAME_TICKETS.length) {
    const avg = GAME_TICKETS.reduce(function(s, r) { return s + r.tickets_sold_total; }, 0) / hg;
    if (avg < 100) errors.push('GAME_TICKETS: avg tickets_sold_total=' + avg.toFixed(0) + ' (near-zero — check preset TIER_ATTENDANCE / SEASONALITY)');
  }
  if (GAME_SCANS && GAME_SCANS.length) {
    const avg = GAME_SCANS.reduce(function(s, r) { return s + r.tickets_scanned; }, 0) / hg;
    if (avg < 100) errors.push('GAME_SCANS: avg tickets_scanned=' + avg.toFixed(0) + ' (near-zero)');
  }
  if (GAME_FNB && GAME_FNB.length) {
    const avg = GAME_FNB.reduce(function(s, r) { return s + r.fnb_revenue; }, 0) / hg;
    if (avg < 100) errors.push('GAME_FNB: avg fnb_revenue=' + avg.toFixed(0) + ' (near-zero — check preset FNB_TIER_BASE_PERCAP)');
  }

  // Filter coverage (catches date preset / season year mismatch — the silent killer)
  var full = filterGames(STATE.tab1);
  if (full.focused.length === 0)
    errors.push('filterGames(full_season) returned 0 games — SERIES_SCHEDULE dates do not overlap DATE_PRESETS');
  else if (full.focused.length !== hg)
    errors.push('filterGames(full_season) returned ' + full.focused.length + ' of ' + hg + ' games');

  if (errors.length) {
    console.error('\\n\\u2717 Smoke test FAILED (' + errors.length + ' error' + (errors.length > 1 ? 's' : '') + '):');
    errors.forEach(function(e) { console.error('  \\u2022 ' + e); });
    process.exit(2);
  }
  console.log('\\u2713 Smoke test passed \\u2014 ' + hg + ' games, ' + FANS.length + ' fans, filterGames OK');
})();
`;

const script = [...layers, checks].join('\n\n');

try {
  // Provide console + process so the data layer can log and the checks can exit.
  // Omit `module` so client-config's export guard evaluates to false (avoids conflicts).
  vm.runInNewContext(script, { console, process });
} catch (e) {
  console.error('✗ Data layer crashed during smoke test:', e.message);
  process.exit(2);
}
