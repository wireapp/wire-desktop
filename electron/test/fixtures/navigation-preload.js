const {ipcRenderer} = require('electron');

ipcRenderer.send('test:privileged-preload', window.location.origin);
