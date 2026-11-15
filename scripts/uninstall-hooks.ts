#!/usr/bin/env node
// Removes only the Gnome Watch entries from ~/.claude/settings.json.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { stripOurs, type Settings } from './install-hooks';

const settingsFile = path.join(os.homedir(), '.claude', 'settings.json');
if (!fs.existsSync(settingsFile)) {
  console.log('No Claude Code settings file found; nothing to remove.');
  process.exit(0);
}
const raw = fs.readFileSync(settingsFile, 'utf8');
const settings: Settings = JSON.parse(raw);
fs.writeFileSync(`${settingsFile}.gnome-watch-backup`, raw);

const hooks = settings.hooks || {};
for (const event of Object.keys(hooks)) {
  const kept = stripOurs(hooks[event]);
  if (kept.length) hooks[event] = kept;
  else delete hooks[event];
}
if (settings.hooks && Object.keys(hooks).length === 0) delete settings.hooks;

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
console.log('Removed Gnome Watch hooks from', settingsFile);
