'use strict';
const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

function checkEnv() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return 'ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=sk-ant-...';
  }
  return null;
}

function checkGhAuth() {
  const result = spawnSync('gh', ['api', '/user', '--jq', '.login'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return 'gh CLI not authenticated. Run: gh auth login';
  }
  const login = (result.stdout || '').trim();
  if (login !== 'brianvinson-serve') {
    return `gh CLI authenticated as "${login}", expected "brianvinson-serve". Run: gh auth switch`;
  }
  return null;
}

function checkBinary(name) {
  const result = spawnSync(name, ['--version'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return `${name} not found in PATH`;
  return null;
}

function checkDirAbsent(localDir) {
  if (fs.existsSync(localDir)) {
    const slug = path.basename(localDir);
    return `Directory already exists: ${localDir}\nUse --resume ${slug} to continue`;
  }
  return null;
}

function checkRepoAbsent(repoName) {
  const result = spawnSync(
    'gh', ['api', `/repos/brianvinson-serve/${repoName}`],
    { encoding: 'utf8' }
  );
  if (result.status === 0) {
    const slug = repoName.replace(/^fan-demo-/, '');
    return `GitHub repo already exists: brianvinson-serve/${repoName}\nUse --resume ${slug} to continue`;
  }
  return null;
}

async function runPreflight({ repoName, localDir, dryRun, isResume }) {
  const errors = [];

  const envErr = checkEnv();
  if (envErr) errors.push(envErr);

  const ghErr = checkGhAuth();
  if (ghErr) errors.push(ghErr);

  for (const bin of ['git', 'python3', 'npm']) {
    const err = checkBinary(bin);
    if (err) errors.push(err);
  }

  if (!dryRun && !isResume) {
    const dirErr = checkDirAbsent(localDir);
    if (dirErr) errors.push(dirErr);

    const repoErr = checkRepoAbsent(repoName);
    if (repoErr) errors.push(repoErr);
  }

  if (errors.length > 0) {
    errors.forEach(e => console.error(`✗ ${e}\n`));
    process.exit(1);
  }
}

module.exports = { runPreflight, checkEnv, checkGhAuth, checkBinary, checkDirAbsent, checkRepoAbsent };
