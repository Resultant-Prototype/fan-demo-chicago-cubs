'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// slugify is internal to new-demo.js — inline a copy for testing
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

test('slugify: multi-word team name', () => {
  assert.equal(slugify('New York Yankees'), 'new-york-yankees');
});

test('slugify: already lowercase single word', () => {
  assert.equal(slugify('chiefs'), 'chiefs');
});

test('slugify: special characters stripped', () => {
  assert.equal(slugify('FC Dallas (MLS)'), 'fc-dallas-mls');
});

test('slugify: leading/trailing hyphens removed', () => {
  assert.equal(slugify('  Team Name  '), 'team-name');
});

// ── preflight ────────────────────────────────────────────────
const { checkEnv, checkBinary, checkDirAbsent } = require('../lib/preflight');
const os   = require('os');
const path = require('path');

test('checkEnv: returns null when key is set', () => {
  const orig = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  assert.equal(checkEnv(), null);
  if (orig === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = orig;
});

test('checkEnv: returns error message when key is missing', () => {
  const orig = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const result = checkEnv();
  assert.ok(result.includes('ANTHROPIC_API_KEY'));
  if (orig !== undefined) process.env.ANTHROPIC_API_KEY = orig;
});

test('checkBinary: returns null for git (must be installed)', () => {
  assert.equal(checkBinary('git'), null);
});

test('checkBinary: returns error for nonexistent binary', () => {
  const result = checkBinary('__nonexistent_binary_xyz__');
  assert.ok(result !== null);
  assert.ok(result.includes('not found'));
});

test('checkDirAbsent: returns null when dir does not exist', () => {
  assert.equal(checkDirAbsent('/tmp/__no_such_dir_xyz_12345__'), null);
});

test('checkDirAbsent: returns error when dir exists', () => {
  const result = checkDirAbsent(os.tmpdir());
  assert.ok(result !== null);
  assert.ok(result.includes('already exists'));
});
