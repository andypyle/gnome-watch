const { app, BrowserWindow, Tray, Menu, ipcMain, screen, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { createCore } = require('./core');
const { startServer, clearConfig, DIR } = require('./server');
const { watchFocus } = require('./focus');

const TOP = 16; // gap under the menu bar
const PREFS = path.join(DIR, 'prefs.json');

let win = null;
let tray = null;
let focus = 'unknown'; // 'editor' | 'other' | 'unknown'
let manual = null; // null = follow VS Code automatically; true/false = you clicked to expand/minimize
let lastPendingCount = 0;
let prefs = { mode: 'auto', sound: true, pack: 'gnomes' }; // mode: 'auto' | 'expanded' | 'hidden'
const PACKS = [
  { id: 'gnomes', label: 'Gnomes' },
  { id: 'capybaras', label: 'Capybaras' },
  { id: 'bats', label: 'Bats' },
  { id: 'cats', label: 'Cats' },
  { id: 'bigfoot', label: 'Bigfoot' },
];

try {
  prefs = { ...prefs, ...JSON.parse(fs.readFileSync(PREFS, 'utf8')) };
} catch {}
// Older "Always show" meant "always visible", which the drawer now always is.
if (prefs.mode === 'always') {
  prefs.mode = 'auto';
  try {
    fs.writeFileSync(PREFS, JSON.stringify(prefs, null, 2));
  } catch {}
}
const savePrefs = () => {
  try {
    fs.writeFileSync(PREFS, JSON.stringify(prefs, null, 2));
  } catch {}
};

// Only hold a prompt for the widget when you're away from the editor.
// In VS Code, Claude Code's own dialog appears as usual.
const AGENTS_FILE = path.join(DIR, 'agents.json');
let saveTimer = null;
const saveAgents = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(AGENTS_FILE, JSON.stringify(core.serialize()));
    } catch {}
  }, 1000);
};

const core = createCore({
  onChange: () => {
    refresh();
    saveAgents();
  },
  shouldHold: () => prefs.mode !== 'hidden' && focus !== 'editor',
});

function isExpanded() {
  if (manual !== null) return manual;
  if (prefs.mode === 'expanded') return true;
  return focus !== 'editor'; // minimized while VS Code is in front, expanded otherwise
}

function refresh() {
  const snap = core.snapshot();
  // A new question always slides the drawer out (unless you're in VS Code, where its own dialog shows).
  if (snap.pendingCount > lastPendingCount && focus !== 'editor') manual = null;
  lastPendingCount = snap.pendingCount;

  if (win && !win.isDestroyed()) {
    const { workArea } = screen.getDisplayMatching(win.getBounds());
    const maxListHeight = workArea.height - 2 * TOP - 70; // room for the title bar
    win.webContents.send('state', { ...snap, sound: prefs.sound, focus, maxListHeight, expanded: isExpanded(), pack: prefs.pack });
    const show = prefs.mode !== 'hidden'; // the tab stays visible even with no agents
    if (show && !win.isVisible()) win.showInactive(); // never steal focus from what you're doing
    if (!show && win.isVisible()) win.hide();
  }
  updateTray(snap);
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const w = 80;
  win = new BrowserWindow({
    width: w,
    height: 120,
    // Docked to the right edge, just under the menu bar
    x: workArea.x + workArea.width - w,
    y: workArea.y + TOP,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  win.webContents.on('did-finish-load', refresh);
  // You can drag the drawer up or down; it always snaps back to the right edge.
  win.on('moved', () => setSize(win.getBounds().width, win.getBounds().height));
}

function setSize(width, height) {
  if (!win || win.isDestroyed()) return;
  const { workArea } = screen.getDisplayMatching(win.getBounds());
  const w = Math.ceil(width);
  const h = Math.max(40, Math.min(Math.ceil(height), workArea.height - 2 * TOP));
  const b = win.getBounds();
  const x = workArea.x + workArea.width - w; // flush with the right edge
  const y = Math.max(workArea.y, Math.min(b.y, workArea.y + workArea.height - h)); // keep the top edge
  if (b.x === x && b.y === y && b.width === w && b.height === h) return;
  win.setBounds({ x, y, width: w, height: h });
}

function makeTrayIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray.png'));
  return img.resize({ width: 18, height: 18 });
}

function updateTray(snap = core.snapshot()) {
  if (!tray) return;
  const waiting = snap.agents.filter((a) => a.status === 'waiting').length;
  const working = snap.agents.filter((a) => a.status === 'working').length;
  tray.setToolTip(`Gnome Watch: ${working} working, ${waiting} need you`);
  if (process.platform === 'darwin') tray.setTitle(waiting ? ` ${waiting}` : '');
  const setMode = (mode) => () => {
    prefs.mode = mode;
    manual = null;
    savePrefs();
    if (mode === 'hidden') core.releaseAll();
    refresh();
  };
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `${snap.agents.length} agent${snap.agents.length === 1 ? '' : 's'}`, enabled: false },
      { type: 'separator' },
      { label: 'Minimize in VS Code, expand when I leave', type: 'radio', checked: prefs.mode === 'auto', click: setMode('auto') },
      { label: 'Always expanded', type: 'radio', checked: prefs.mode === 'expanded', click: setMode('expanded') },
      { label: 'Hide (answer everything in VS Code)', type: 'radio', checked: prefs.mode === 'hidden', click: setMode('hidden') },
      { type: 'separator' },
      {
        label: 'Character pack',
        submenu: PACKS.map((p) => ({
          label: p.label,
          type: 'radio',
          checked: prefs.pack === p.id,
          click: () => {
            prefs.pack = p.id;
            savePrefs();
            refresh();
          },
        })),
      },
      {
        label: 'Chime when a gnome needs me',
        type: 'checkbox',
        checked: prefs.sound,
        click: (m) => {
          prefs.sound = m.checked;
          savePrefs();
          refresh();
        },
      },
      {
        // Only meaningful for the packaged app (npm run package:mac); in dev it would launch bare Electron.
        label: app.isPackaged ? 'Start at login' : 'Start at login (needs the packaged app)',
        type: 'checkbox',
        enabled: app.isPackaged,
        checked: app.isPackaged && app.getLoginItemSettings().openAtLogin,
        click: (m) => app.setLoginItemSettings({ openAtLogin: m.checked }),
      },
      { label: 'Open event log', click: () => shell.openPath(path.join(DIR, 'events.log')) },
      { type: 'separator' },
      { label: 'Quit Gnome Watch', click: () => app.quit() },
    ])
  );
}

ipcMain.on('resize', (_e, { width, height }) => setSize(width, height));

ipcMain.on('toggle', () => {
  manual = !isExpanded(); // stays this way until you next switch to or away from VS Code
  refresh();
});

ipcMain.on('resolve', (_e, { id, action, answers }) => core.resolve(id, action, answers));

ipcMain.on('open-editor', (_e, sessionId) => {
  const a = core.agents.get(sessionId);
  // Hand any held prompts back so they appear in VS Code.
  for (const p of [...core.pending.values()]) if (p.sessionId === sessionId) core.release(p.id);
  if (a && a.cwd) {
    const p = a.cwd.replace(/\\/g, '/');
    shell.openExternal(`vscode://file/${encodeURI(p.startsWith('/') ? p.slice(1) : p)}`);
  } else {
    shell.openExternal('vscode://');
  }
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();
  try {
    await startServer(core);
  } catch (e) {
    console.error('Could not start the Gnome Watch server:', e);
    app.quit();
    return;
  }
  try {
    core.restore(JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8')));
  } catch {}
  createWindow();
  tray = new Tray(makeTrayIcon());
  updateTray();

  // Log what the focus check sees (only when it changes) to ~/.gnome-watch/focus.log
  const FOCUS_LOG = path.join(DIR, 'focus.log');
  let lastDetail = '';
  const logFocus = (d) => {
    const line = JSON.stringify(d);
    if (line === lastDetail) return;
    lastDetail = line;
    try {
      if (fs.existsSync(FOCUS_LOG) && fs.statSync(FOCUS_LOG).size > 256 * 1024) fs.renameSync(FOCUS_LOG, FOCUS_LOG + '.old');
      fs.appendFileSync(FOCUS_LOG, `${new Date().toISOString()} ${line}\n`);
    } catch {}
  };

  watchFocus((state) => {
    const wasEditor = focus === 'editor';
    focus = state;
    if ((state === 'editor') !== wasEditor) manual = null; // switching apps hands control back to auto
    if (state === 'editor') core.releaseAll(); // you're back: let VS Code show any open prompts
    refresh();
  }, logFocus);

  // Every 20s: drop agents whose Claude Code process is gone, settle ones stuck on "working".
  const isAlive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return e.code === 'EPERM';
    }
  };
  core.sweep(isAlive);
  setInterval(() => core.sweep(isAlive), 20 * 1000);

  // Re-render periodically so "napping" gnomes stay fresh.
  setInterval(refresh, 30 * 1000);
});

if (!app.requestSingleInstanceLock()) app.quit();
app.on('window-all-closed', (e) => e.preventDefault());
app.on('before-quit', () => {
  try {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(core.serialize()));
  } catch {}
  core.releaseAll();
  clearConfig();
});
