'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const fs   = require('fs');
const path = require('path');

const SPORT_HOME_GAMES = { mlb: 81, nfl: 9, nba: 41, nhl: 41 };

function buildSynthPrompt(venue, today) {
  const sport     = venue.sport;
  const homeGames = SPORT_HOME_GAMES[sport] || 41;
  const teamName  = venue.team.name;

  return `You are a sports data researcher. Output ONLY valid JSON with no prose, no markdown fences.

Generate realistic synthetic season data for ${teamName} (${sport.toUpperCase()}).
Today's date: ${today}. Use the current or upcoming season based on this date.
Total home games this season: ${homeGames} (sum of all series n values must equal ${homeGames}).

Return a single JSON object with exactly these four top-level keys:

{
  "UPCOMING_PACING": [
    { "opponent": "Full Team Name", "date": "YYYY-MM-DD", "daysUntil": 4, "pctSold": 71 }
  ],
  "SERIES_SCHEDULE": [
    {
      "start": "YYYY-MM-DD",
      "opp": "Full Opponent Name",
      "lg": "AL|NL|AFC|NFC|East|West|etc",
      "rival": false,
      "n": 3,
      "tier": "featured|select|standard",
      "promo": "giveaway|theme_night|null",
      "promoLabel": "Name or null"
    }
  ],
  "HOME_STATES": ["NY","NJ","CT","PA","MA","FL","CA","TX","OH","IL"],
  "STATE_WEIGHTS": [200, 80, 40, 30, 25, 20, 15, 10, 8, 5]
}

Rules:
- UPCOMING_PACING: 10-14 games from today forward; daysUntil >= 1; pctSold 65-90%.
- SERIES_SCHEDULE: sum of all n must equal exactly ${homeGames}. Use real opponents and real schedule structure.
- tier: featured=marquee/rivalry/special event, select=mid-tier draw, standard=routine.
- HOME_STATES: exactly 10 state abbreviations. Home market state first with highest weight.
- STATE_WEIGHTS: exactly 10 integers, parallel to HOME_STATES.
- Output ONLY the JSON object. No explanation, no markdown fences.`;
}

function parseResponse(text) {
  try { return JSON.parse(text); } catch (_) {}
  const stripped = text.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(stripped); // throws SyntaxError if still invalid
}

function validate(data, sport) {
  const errors = [];
  const homeGames = SPORT_HOME_GAMES[sport] || 41;
  const validTiers = new Set(['featured', 'select', 'standard']);

  // SERIES_SCHEDULE
  if (!Array.isArray(data.SERIES_SCHEDULE)) {
    errors.push('[SERIES_SCHEDULE] must be an array');
  } else {
    const total = data.SERIES_SCHEDULE.reduce((sum, s) => sum + (s.n || 0), 0);
    if (total !== homeGames) {
      errors.push(`[SERIES_SCHEDULE] Expected ${homeGames} games, got ${total}. Check series n values — a series may be missing or have the wrong n.`);
    }
    data.SERIES_SCHEDULE.forEach((s, i) => {
      if (!s.start || !/^\d{4}-\d{2}-\d{2}$/.test(s.start)) {
        errors.push(`[SERIES_SCHEDULE] Entry ${i} (${s.opp || '?'}): invalid date "${s.start}" — must be YYYY-MM-DD`);
      }
      if (!validTiers.has(s.tier)) {
        errors.push(`[SERIES_SCHEDULE] Entry ${i} (${s.opp || '?'}): invalid tier "${s.tier}" — must be featured|select|standard`);
      }
    });
  }

  // UPCOMING_PACING
  if (!Array.isArray(data.UPCOMING_PACING)) {
    errors.push('[UPCOMING_PACING] must be an array');
  } else {
    if (data.UPCOMING_PACING.length < 5) {
      errors.push(`[UPCOMING_PACING] Must have at least 5 entries, got ${data.UPCOMING_PACING.length}`);
    }
    data.UPCOMING_PACING.forEach((g, i) => {
      if (!g.daysUntil || g.daysUntil < 1) {
        errors.push(`[UPCOMING_PACING] Entry ${i}: daysUntil is ${g.daysUntil}, must be >= 1`);
      }
    });
  }

  // HOME_STATES / STATE_WEIGHTS
  if (!Array.isArray(data.HOME_STATES) || data.HOME_STATES.length !== 10) {
    errors.push(`[HOME_STATES] Must be an array of exactly 10 elements, got ${Array.isArray(data.HOME_STATES) ? data.HOME_STATES.length : typeof data.HOME_STATES}`);
  }
  if (!Array.isArray(data.STATE_WEIGHTS) || data.STATE_WEIGHTS.length !== 10) {
    errors.push(`[STATE_WEIGHTS] Must be an array of exactly 10 elements, got ${Array.isArray(data.STATE_WEIGHTS) ? data.STATE_WEIGHTS.length : typeof data.STATE_WEIGHTS}`);
  }

  return errors;
}

function patchClientConfig(configPath, data) {
  let src = fs.readFileSync(configPath, 'utf8');

  src = src.replace(
    /const UPCOMING_PACING\s*=\s*\[\];/,
    `const UPCOMING_PACING = ${JSON.stringify(data.UPCOMING_PACING, null, 2)};`
  );
  src = src.replace(
    /const SERIES_SCHEDULE\s*=\s*\[\];/,
    `const SERIES_SCHEDULE = ${JSON.stringify(data.SERIES_SCHEDULE, null, 2)};`
  );
  src = src.replace(
    /const HOME_STATES\s*=\s*\['STUB_STATE'\];/,
    `const HOME_STATES = ${JSON.stringify(data.HOME_STATES)};`
  );
  src = src.replace(
    /const STATE_WEIGHTS\s*=\s*\[100\];/,
    `const STATE_WEIGHTS = ${JSON.stringify(data.STATE_WEIGHTS)};`
  );

  fs.writeFileSync(configPath, src, 'utf8');
}

async function generateSynthData(venue, configPath, repoDir, quiet) {
  // Validate venue object before calling Claude
  if (!venue.sport || !SPORT_HOME_GAMES[venue.sport]) {
    throw new Error(`Invalid sport "${venue.sport}" — must be one of: ${Object.keys(SPORT_HOME_GAMES).join(', ')}`);
  }
  if (!venue.team?.name || !venue.team?.slug) {
    throw new Error('venue.team.name and venue.team.slug are required');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today  = new Date().toISOString().slice(0, 10);
  const prompt = buildSynthPrompt(venue, today);

  if (!quiet) console.log('Calling Claude API for synthetic season data...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.filter(b => b.type === 'text').pop();
  if (!textBlock) throw new Error('No text block in Claude response');

  let data;
  try {
    data = parseResponse(textBlock.text);
  } catch (err) {
    const debugPath = path.join(repoDir, `${venue.team.slug}-data-debug.json`);
    fs.writeFileSync(debugPath, textBlock.text, 'utf8');
    console.error(`✗ Failed to parse Claude response as JSON: ${err.message}`);
    console.error(`Raw response saved to: ${debugPath}`);
    process.exit(2);
  }

  const errors = validate(data, venue.sport);
  if (errors.length > 0) {
    const debugPath = path.join(repoDir, `${venue.team.slug}-data-debug.json`);
    fs.writeFileSync(debugPath, JSON.stringify(data, null, 2), 'utf8');
    console.error(`✗ Validation failed (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
    errors.forEach(e => console.error(`  ${e}`));
    console.error(`Raw Claude response saved to: ${debugPath}`);
    process.exit(2);
  }

  patchClientConfig(configPath, data);
  if (!quiet) console.log('✓ Synthetic season data patched into src/client-config.js');
}

module.exports = { buildSynthPrompt, parseResponse, validate, patchClientConfig, generateSynthData, SPORT_HOME_GAMES };
