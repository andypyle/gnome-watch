#!/usr/bin/env node
// Removes only the Gnome Watch entries from ~/.claude/settings.json.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { stripOurs } = require('./install-hooks');

const settingsFile = path.join(os.homedir(), '.claude', 'settings.json');
if (!fs.existsSync(settingsFile)) {
  console.log('No Claude Code settings file found; nothing to remove.');
  process.exit(0);
}
const raw = fs.readFileSync(settingsFile, 'utf8');
const settings = JSON.parse(raw);
fs.writeFileSync(`${settingsFile}.gnome-watch-backup-${Date.now()}`, raw);

for (const event of Object.keys(settings.hooks || {})) {
  const kept = stripOurs(settings.hooks[event]);
  if (kept.length) settings.hooks[event] = kept;
  else delete settings.hooks[event];
}
if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
console.log('Removed Gnome Watch hooks from', settingsFile);
