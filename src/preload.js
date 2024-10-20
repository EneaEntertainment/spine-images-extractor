const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    openSpineFileDialog: () => ipcRenderer.invoke('open-spine-file-dialog'),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    startProcessing: () => ipcRenderer.invoke('start-processing'),
});
