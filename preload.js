const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setGlobalData: (key, value) => ipcRenderer.send('set-global-data', { key, value }),
  getGlobalData: (callback) => {
    ipcRenderer.once('global-data', (event, data) => callback(event, data));
    ipcRenderer.send('get-global-data');
  }
});
