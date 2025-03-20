const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');

let globalData = {
  csvData: null,
  excelData: null,
  csvThreshold: null,
  excelThreshold1: null,
  excelThreshold2: null
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 950,
    resizable: false,
    ELECTRON_ENABLE_LOGGING: 1,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('set-global-data', (event, data) => {
  globalData[data.key] = data.value;
  console.log('Global Data Updated:', globalData);
});

ipcMain.on('get-global-data', (event) => {
  console.log('get-global-data event received');
  event.sender.send('global-data', globalData);
});
