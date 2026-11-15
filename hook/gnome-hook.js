#!/usr/bin/env node
// Claude Code hook -> Gnome Watch bridge.
//
// Claude Code runs this script for each hook event and passes the event JSON on
// stdin. We forward it to the Gnome Watch app over localhost. For most events we
// return right away. For permission prompts and AskUserQuestion, the app may hold
// the request until you answer in the widget, and whatever it sends back is
// printed to stdout as the hook's decision.
//
// If Gnome Watch isn't running, this exits silently, so Claude Code behaves
// exactly as if the hook weren't installed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

// Find the Claude Code process that ran this hook (skipping any shell in between), so the app
// can tell when a session's process has exited even if no SessionEnd event arrives.
function claudePid() {
  let pid = process.ppid;
  if (process.platform === 'win32') return pid;
  try {
    for (let i = 0; i < 4; i++) {
      const out = execFileSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], { encoding: 'utf8', timeout: 800 }).trim();
      const m = /^(\d+)\s+(.*)$/.exec(out);
      if (!m) break;
      if (/(^|\/)-?(sh|bash|zsh|dash|fish)$/.test(m[2].trim())) {
        pid = Number(m[1]);
        continue;
      }
      return pid;
    }
  } catch {}
  return pid;
}

const CONFIG = path.join(os.homedir(), '.gnome-watch', 'server.json');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', run);

function run() {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  } catch {
    return process.exit(0); // app not running / never started
  }

  let ev;
  try {
    ev = JSON.parse(input);
  } catch {
    return process.exit(0);
  }

  if (['SessionStart', 'UserPromptSubmit', 'Stop'].includes(ev.hook_event_name)) {
    ev._claude_pid = claudePid();
    input = JSON.stringify(ev);
  }

  const mayBlock =
    ev.hook_event_name === 'PermissionRequest' ||
    (ev.hook_event_name === 'PreToolUse' && ev.tool_name === 'AskUserQuestion');

  const req = http.request(
    {
      host: '127.0.0.1',
      port: cfg.port,
      path: '/event',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gnome-token': cfg.token,
      },
      // Blocking events wait for you; everything else must never slow Claude down.
      timeout: mayBlock ? 595000 : 1500,
    },
    (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode === 200 && body.trim()) process.stdout.write(body);
        process.exit(0);
      });
    }
  );
  req.on('timeout', () => {
    req.destroy();
    process.exit(0);
  });
  req.on('error', () => process.exit(0));
  req.end(input);
}
