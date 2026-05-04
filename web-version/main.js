const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(app.getPath('userData'), 'database.json');
const ARCHIVE_DIR = path.join(app.getPath('userData'), 'archives');

if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

function getDB() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {}
  return { ward: [], sadir: [], sales: [], buys: [], loans: [] };
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getArchives() {
  try {
    return fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ file: f, label: f.replace('.json','') }))
      .sort((a,b) => b.file.localeCompare(a.file));
  } catch(e) { return []; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: 'نظام إدارة المطحنة',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    autoHideMenuBar: true, backgroundColor: '#f0f4f0'
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('db-load', () => getDB());
ipcMain.handle('db-save', (_, data) => { saveDB(data); return true; });
ipcMain.handle('get-db-path', () => DB_PATH);

ipcMain.handle('backup-export', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'حفظ نسخة احتياطية',
    defaultPath: `مطحنة_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (filePath) { fs.copyFileSync(DB_PATH, filePath); return true; }
  return false;
});

ipcMain.handle('backup-import', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'استيراد نسخة احتياطية',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (filePaths && filePaths[0]) {
    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(raw);
    saveDB(data);
    return data;
  }
  return null;
});

ipcMain.handle('archive-month', (_, monthLabel) => {
  try {
    const archivePath = path.join(ARCHIVE_DIR, `${monthLabel}.json`);
    fs.copyFileSync(DB_PATH, archivePath);
    const empty = { ward: [], sadir: [], sales: [], buys: [], loans: [] };
    saveDB(empty);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-archives', () => getArchives());

ipcMain.handle('load-archive', (_, fileName) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, fileName), 'utf-8'));
  } catch(e) { return null; }
});

ipcMain.handle('delete-archive', (_, fileName) => {
  try { fs.unlinkSync(path.join(ARCHIVE_DIR, fileName)); return true; }
  catch(e) { return false; }
});
