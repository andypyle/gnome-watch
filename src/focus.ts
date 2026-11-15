// Watches which app is in front, so the widget can appear when you leave VS Code.
// Calls onChange(state) where state is 'editor' (VS Code or a fork is in front),
// 'other', or 'unknown' (we couldn't tell on this system).

import { execFile, spawn } from 'child_process';
import * as fs from 'fs';

export type Focus = 'editor' | 'other' | 'unknown';
interface FrontApp { bundle?: string; name?: string; method: string }
type Done = (app: FrontApp | null, err?: string) => void;

const MAC_EDITOR_BUNDLES = /^(com\.microsoft\.VSCode(Insiders)?|com\.todesktop\..+|com\.exafunction\.windsurf|com\.vscodium.*)$/i;
const MAC_EDITOR_NAMES = /^(Code|Visual Studio Code|Code - Insiders|Cursor|Windsurf|VSCodium)$/i;
const WIN_EDITOR_RE = /^(Code|Code - Insiders|Cursor|Windsurf|VSCodium)$/i;
const LINUX_EDITOR_RE = /^(code|code-insiders|cursor|windsurf|codium)$/i;

export function watchFocus(onChange: (s: Focus) => void, onDetail: (d: object) => void = () => {}, intervalMs = 1000): () => void {
  let last: Focus | null = null;
  const emit = (s: Focus) => {
    if (s !== last) {
      last = s;
      onChange(s);
    }
  };

  if (process.platform === 'darwin') {
    // Two ways to ask macOS for the front app, neither needs special permissions:
    // 1) lsappinfo (fast); 2) a one-line JavaScript-for-Automation call to NSWorkspace (fallback).
    const JXA =
      'ObjC.import("AppKit"); var a = $.NSWorkspace.sharedWorkspace.frontmostApplication; ' +
      '(a.bundleIdentifier.js || "") + "|" + (a.localizedName.js || "")';
    const viaJxa = (done: Done) =>
      execFile('/usr/bin/osascript', ['-l', 'JavaScript', '-e', JXA], { timeout: 3000 }, (e, out) => {
        if (e) return done(null, `jxa error: ${e.message}`);
        const [bundle, name] = out.trim().split('|');
        done({ bundle, name, method: 'jxa' });
      });
    const viaLsappinfo = (done: Done) =>
      execFile('/usr/bin/lsappinfo', ['front'], { timeout: 2000 }, (e, asn) => {
        asn = (asn || '').trim();
        if (e || !/^ASN:/.test(asn)) return done(null, `lsappinfo front gave: ${e ? e.message : JSON.stringify(asn)}`);
        execFile('/usr/bin/lsappinfo', ['info', asn], { timeout: 2000 }, (e2, info) => {
          if (e2) return done(null, `lsappinfo info error: ${e2.message}`);
          const bundle = (/(?:bundleID|CFBundleIdentifier)"?\s*=\s*"([^"]+)"/i.exec(info) || [])[1];
          const name = (/^"([^"]+)"\s+ASN:/m.exec(info) || /LSDisplayName"?\s*=\s*"([^"]+)"/i.exec(info) || [])[1];
          if (!bundle && !name) return done(null, `lsappinfo info unparsed: ${JSON.stringify(info.slice(0, 200))}`);
          done({ bundle, name, method: 'lsappinfo' });
        });
      });
    let useJxa = false;
    const tick = () => {
      const handle: Done = (app, err) => {
        if (!app) {
          onDetail({ error: err });
          if (!useJxa) {
            useJxa = true; // switch to the fallback for good
            return viaJxa(handle);
          }
          return emit('unknown');
        }
        const isEditor = MAC_EDITOR_BUNDLES.test(app.bundle || '') || MAC_EDITOR_NAMES.test(app.name || '');
        onDetail({ ...app, state: isEditor ? 'editor' : 'other' });
        emit(isEditor ? 'editor' : 'other');
      };
      (useJxa ? viaJxa : viaLsappinfo)(handle);
    };
    tick();
    const t = setInterval(tick, intervalMs);
    return () => clearInterval(t);
  }

  if (process.platform === 'win32') {
    const script = `
Add-Type @"
using System; using System.Runtime.InteropServices;
public class GnomeFG {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
}
"@
while ($true) {
  $p = 0
  [void][GnomeFG]::GetWindowThreadProcessId([GnomeFG]::GetForegroundWindow(), [ref]$p)
  try { [Console]::Out.WriteLine((Get-Process -Id $p).ProcessName) } catch { [Console]::Out.WriteLine("") }
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds ${intervalMs}
}`;
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], {
      windowsHide: true,
    });
    let buf = '';
    ps.stdout.on('data', (d: Buffer) => {
      buf += d.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      const name = lines.filter(Boolean).pop();
      if (name !== undefined) emit(WIN_EDITOR_RE.test(name.trim()) ? 'editor' : 'other');
    });
    ps.on('error', () => emit('unknown'));
    ps.on('exit', () => emit('unknown'));
    return () => ps.kill();
  }

  // Linux (X11) via xdotool; Wayland generally can't report this.
  const tick = () =>
    execFile('xdotool', ['getactivewindow', 'getwindowpid'], (e, pid) => {
      if (e) return emit('unknown');
      let comm = '';
      try {
        comm = fs.readFileSync(`/proc/${pid.trim()}/comm`, 'utf8').trim();
      } catch {}
      emit(LINUX_EDITOR_RE.test(comm) ? 'editor' : 'other');
    });
  tick();
  const t = setInterval(tick, intervalMs);
  return () => clearInterval(t);
}

