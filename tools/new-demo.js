'use strict';
const path     = require('path');
const fs       = require('fs');
const { spawnSync } = require('child_process');
const readline = require('readline');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function run(cmd, opts = {}) {
  const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    console.error(`\nFailed: ${cmd}`);
    process.exit(2);
  }
}

function pause() {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => { rl.close(); resolve(); });
  });
}

async function main() {
  // stub — implementation added in later tasks
}

main().catch(err => { console.error(err.message); process.exit(2); });
