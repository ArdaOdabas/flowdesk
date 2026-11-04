'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowdesk', {
  onOpenFile: cb => ipcRenderer.on('open-file', (_e, f) => cb(f)),
  ready: () => ipcRenderer.send('renderer-ready'),
  openDialog: () => ipcRenderer.invoke('open-dialog'),
});
