const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mill', {
  load: () => ipcRenderer.invoke('db-load'),
  save: (data) => ipcRenderer.invoke('db-save', data),
  getPath: () => ipcRenderer.invoke('get-db-path'),
  exportBackup: () => ipcRenderer.invoke('backup-export'),
  importBackup: () => ipcRenderer.invoke('backup-import'),
  archiveMonth: (label) => ipcRenderer.invoke('archive-month', label),
  getArchives: () => ipcRenderer.invoke('get-archives'),
  loadArchive: (file) => ipcRenderer.invoke('load-archive', file),
  deleteArchive: (file) => ipcRenderer.invoke('delete-archive', file),
});
