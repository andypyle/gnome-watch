#!/usr/bin/env node
// Adds Gnome Watch hooks to your user-level Claude Code settings
// (~/.claude/settings.json), so every Claude Code session reports to the widget,
// including sessions in the VS Code extension. A backup is written first.
// Re-running is safe: old Gnome Watch entries are replaced, nothing else is touched.

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// The shape of ~/.claude/settings.json "hooks", only as far as we touch it.
interface HookEntry { matcher?: string; hooks?: { type?: string; command?: string; timeout?: number }[] }
export type Settings = { hooks?: Record<string, HookEntry[]>; [key: string]: unknown };

export const MARKER = 'gnome-hook.js';
const hookPath = path.resolve(__dirname, '..', 'hook', 'gnome-hook.js');
// Use the absolute path to this Node binary: apps launched from the Dock (like VS Code)
// often don't have Homebrew/nvm folders on their PATH, so a bare `node` can fail there.
const command = `"${process.execPath}" "${hookPath}"`;

const settingsDir = path.join(os.homedir(), '.claude');
const settingsFile = path.join(settingsDir, 'settings.json');

const EVENTS: Record<string, { matcher?: string; timeout: number }> = {
  SessionStart: { timeout: 10 },
  SessionEnd: { timeout: 10 },
  UserPromptSubmit: { timeout: 10 },
  PreToolUse: { matcher: '*', timeout: 600 }, // AskUserQuestion may wait for you
  PostToolUse: { matcher: '*', timeout: 10 },
  PermissionRequest: { matcher: '*', timeout: 600 }, // may wait for you
  Notification: { timeout: 10 },
  Stop: { timeout: 10 },
  SubagentStart: { timeout: 10 },
  SubagentStop: { timeout: 10 },
  TaskCreated: { timeout: 10 },
  TaskCompleted: { timeout: 10 },
  PostModelSwitch: { timeout: 10 }, // keeps the model label current after /model
};

export function stripOurs(entries: HookEntry[] | undefined): HookEntry[] {
  return (entries || [])
    .map((e) => ({ ...e, hooks: (e.hooks || []).filter((h) => !String(h.command || '').includes(MARKER)) }))
    .filter((e) => e.hooks.length > 0);
}

function main() {
  fs.mkdirSync(settingsDir, { recursive: true });
  let settings: Settings = {};
  if (fs.existsSync(settingsFile)) {
    const raw = fs.readFileSync(settingsFile, 'utf8');
    try {
      settings = raw.trim() ? JSON.parse(raw) : {};
    } catch (e) {
      console.error(`Couldn't parse ${settingsFile}: ${(e as Error).message}\nFix the JSON (or move the file aside) and run this again.`);
      process.exit(1);
    }
    const backup = `${settingsFile}.gnome-watch-backup`; // one file, replaced each run: the state before the last change
    fs.writeFileSync(backup, raw);
    console.log(`Backed up existing settings to ${backup}`);
  }

  settings.hooks = settings.hooks || {};
  for (const [event, opt] of Object.entries(EVENTS)) {
    const entries = stripOurs(settings.hooks[event]);
    const entry: HookEntry = { hooks: [{ type: 'command', command, timeout: opt.timeout }] };
    if (opt.matcher) entry.matcher = opt.matcher;
    entries.push(entry);
    settings.hooks[event] = entries;
  }

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
  console.log(`Installed Gnome Watch hooks for ${Object.keys(EVENTS).length} events in ${settingsFile}`);
  console.log('New Claude Code sessions will show up in the widget. Restart any sessions already running.');
}

if (require.main === module) main();
