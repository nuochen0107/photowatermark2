const { contextBridge, ipcRenderer } = require('electron');

// ✅ 向渲染进程（React）安全暴露接口
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    on: (channel, listener) => ipcRenderer.on(channel, listener)
  }
});