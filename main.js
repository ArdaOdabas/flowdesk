'use strict';
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let rendererReady = false;
const pending = [];
const isFCS = p => /\.(fcs|lmd)$/i.test(p);

function sendFile(p) {
  if (!rendererReady || !win) { pending.push(p); return; }
  try {
    const buf = fs.readFileSync(p);
    const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    win.webContents.send('open-file', { name: path.basename(p), data });
    app.addRecentDocument(p);
  } catch (e) {
    dialog.showErrorBox('FlowDesk', `${p}\n${e.message}`);
  }
}

async function openDialog() {
  const r = await dialog.showOpenDialog(win, {
    title: 'Open FCS files',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Flow cytometry', extensions: ['fcs', 'lmd'] }, { name: 'All files', extensions: ['*'] }],
  });
  if (!r.canceled) r.filePaths.forEach(sendFile);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 950, minWidth: 900, minHeight: 600,
    title: 'FlowDesk', backgroundColor: '#e8ebef', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'FlowDesk.html'));
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; rendererReady = false; });
  // anything linking out opens in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // exports (CSV, PNG, FCS, templates) go through a native save dialog
  win.webContents.session.on('will-download', (_e, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
  });
}

function buildMenu() {
  const mac = process.platform === 'darwin';
  const template = [
    ...(mac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open FCS Files…', accelerator: 'CmdOrCtrl+O', click: openDialog },
        { role: 'recentDocuments', submenu: [{ role: 'clearRecentDocuments' }] },
        { type: 'separator' },
        mac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // no undo/redo roles here, so Cmd/Ctrl+Z reach the app's own gate undo
    { label: 'Edit', submenu: [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// macOS: double-click / "Open With" on .fcs files (can fire before ready)
app.on('open-file', (e, p) => { e.preventDefault(); if (win) sendFile(p); else pending.push(p); });

// Windows/Linux: files passed on the command line
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', (_e, argv) => {
  argv.filter(isFCS).forEach(sendFile);
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
process.argv.slice(1).filter(isFCS).forEach(p => pending.push(p));

ipcMain.on('renderer-ready', () => {
  rendererReady = true;
  pending.splice(0).forEach(sendFile);
});
ipcMain.handle('open-dialog', openDialog);

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
