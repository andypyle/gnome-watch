const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gnome', {
  onState: (fn) => ipcRenderer.on('state', (_e, s) => fn(s)),
  resize: (width, height) => ipcRenderer.send('resize', { width, height }),
  toggle: () => ipcRenderer.send('toggle'),
  resolve: (id, action, answers) => ipcRenderer.send('resolve', { id, action, answers }),
  openEditor: (sessionId) => ipcRenderer.send('open-editor', sessionId),
});
