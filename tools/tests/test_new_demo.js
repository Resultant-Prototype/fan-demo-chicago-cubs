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
