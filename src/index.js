import { BrowserWindow, app, dialog, ipcMain } from 'electron';

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

let mainWindow;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let jsonFileName = '';
let jsonImagesPath = '';
let jsonData = {};

let spineFilePath = '';
let spineFileName = '';

let imagesSourcePath = '';
let imagesDestionationPath = '';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html')).catch((err) => {
        console.error('Failed to load window:', err);
    });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('open-file-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (result.canceled) {
            return { fileContent: '', fileName: 'Open JSON File' };
        } else {
            const filePath = result.filePaths[0];

            jsonData = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
            jsonImagesPath = jsonData?.skeleton?.images ?? '';
            jsonFileName = path.basename(filePath);

            console.log('Images relative path:', jsonImagesPath);

            return { jsonData, jsonFileName };
        }
    });

    ipcMain.handle('open-spine-file-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Spine Files', extensions: ['spine'] }],
        });

        if (result.canceled) {
            return { fileContent: '', fileName: 'Open Spine File' };
        } else {
            spineFilePath = result.filePaths[0];
            spineFileName = path.basename(spineFilePath);
            imagesSourcePath = path.resolve(path.dirname(spineFilePath), jsonImagesPath);

            console.log('Spine file path:', spineFilePath);
            console.log('Images source path:', imagesSourcePath);

            return { spineFileName };
        }
    });

    ipcMain.handle('open-folder-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        if (result.canceled) {
            return { imagesDestionationPath: 'Select destination folder' };
        } else {
            imagesDestionationPath = result.filePaths[0];

            console.log('Selected folder path:', imagesDestionationPath);

            return { imagesDestionationPath };
        }
    });

    ipcMain.handle('start-processing', async () => {
        await processFiles();

        return { success: true };
    });
});

async function processFiles() {
    const skins = jsonData.skins ?? {};
    const imagesToCopy = [];

    console.log('copying...');

    skins.forEach((skin) => {
        const attachments = skin.attachments;

        for (const attachmentKey in attachments) {
            Object.keys(attachments[attachmentKey]).forEach((key) => {
                imagesToCopy.push(key + '.png');
                imagesToCopy.push(key + '.jpg');
            });
        }
    });

    for (const image of imagesToCopy) {
        const imageSource = path.resolve(imagesSourcePath, image);

        if (!fs.existsSync(imageSource)) continue;

        const imageDestination = path.resolve(imagesDestionationPath, image);
        const directory = path.dirname(imageDestination);

        await fs.promises.mkdir(directory, { recursive: true });
        await fs.promises.copyFile(imageSource, imageDestination);

        console.log(imageSource + ' -> ' + imageDestination);
    }

    console.log('done');
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
