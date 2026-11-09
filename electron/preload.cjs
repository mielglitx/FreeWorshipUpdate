const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('freeworshipDesktop', {
  isElectron: true,
  openWindow: (mode, options) => ipcRenderer.invoke('freeworship:open-window', mode, options),
  closeWindow: (mode) => ipcRenderer.invoke('freeworship:close-window', mode),
  getStatus: () => ipcRenderer.invoke('freeworship:get-status'),
  updateRouting: (config) => ipcRenderer.invoke('freeworship:update-routing', config),
  broadcastState: (payload) => ipcRenderer.send('freeworship:broadcast-state', payload),
  onStateSync: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('freeworship:state-sync', listener);
    return () => ipcRenderer.removeListener('freeworship:state-sync', listener);
  },
  onRemoteCommand: (callback) => {
    const listener = (_event, cmd) => callback(cmd);
    ipcRenderer.on('freeworship:remote-command', listener);
    return () => ipcRenderer.removeListener('freeworship:remote-command', listener);
  },
  onWindowStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('freeworship:window-status', listener);
    return () => ipcRenderer.removeListener('freeworship:window-status', listener);
  },
  downloadAndInstallUpdate: (url) => ipcRenderer.invoke('freeworship:download-and-install-update', url),
  saveUserSongs: (songsJson) => ipcRenderer.invoke('freeworship:save-user-songs', songsJson),
  loadUserSongs: () => ipcRenderer.invoke('freeworship:load-user-songs'),
  onUpdateDownloadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('freeworship:update-download-progress', listener);
    return () => ipcRenderer.removeListener('freeworship:update-download-progress', listener);
  },
});
