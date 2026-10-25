const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  if (process.env.ELECTRON_DEV) {
    win.loadURL('http://localhost:5173');                       // vite dev server
  } else if (app.isPackaged) {
    win.loadFile(path.join(process.resourcesPath, 'dist', 'index.html')); // packaged build
  } else {
    win.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')); // local test of the build
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
