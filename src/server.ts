// Localhost HTTP server that receives events from hook/gnome-hook.ts.
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import type { createCore, HookEvent } from './core';

export const DIR = path.join(os.homedir(), '.gnome-watch');
const CONFIG = path.join(DIR, 'server.json');
const LOG = path.join(DIR, 'events.log');
const DEFAULT_PORT = 47823;

function logEvent(raw: string) {
  try {
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 2 * 1024 * 1024) fs.renameSync(LOG, LOG + '.old');
    fs.appendFileSync(LOG, `${new Date().toISOString()} ${raw.replace(/\n/g, ' ')}\n`);
  } catch {}
}

export function startServer(core: ReturnType<typeof createCore>): Promise<{ server: http.Server; port: number }> {
  fs.mkdirSync(DIR, { recursive: true });
  const token = crypto.randomBytes(24).toString('hex');

  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/event' || req.headers['x-gnome-token'] !== token) {
      res.writeHead(404);
      return res.end();
    }
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (d) => {
      raw += d;
      if (raw.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      logEvent(raw);
      let ev: HookEvent;
      try {
        ev = JSON.parse(raw);
      } catch {
        res.writeHead(400);
        return res.end();
      }
      let reply: string | null = '';
      try {
        reply = core.handleEvent(ev, res);
      } catch (e) {
        console.error('event error', e);
      }
      if (reply !== null) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(reply || '');
      }
      // null => held; core answers later
    });
  });
  server.requestTimeout = 0; // held requests can last minutes
  server.headersTimeout = 10000;

  return new Promise((resolve, reject) => {
    const tryPort = (port: number, attempts: number) => {
      server.once('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'EADDRINUSE' && attempts > 0) tryPort(port + 1, attempts - 1);
        else reject(e);
      });
      server.listen(port, '127.0.0.1', () => {
        fs.writeFileSync(CONFIG, JSON.stringify({ port, token, pid: process.pid }), { mode: 0o600 });
        resolve({ server, port });
      });
    };
    tryPort(DEFAULT_PORT, 10);
  });
}

export function clearConfig() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
    if (cfg.pid === process.pid) fs.unlinkSync(CONFIG);
  } catch {}
}

