import { contextBridge, ipcRenderer } from 'electron'

// Narrow bridge: the renderer can only invoke whitelisted pvs:* channels.
contextBridge.exposeInMainWorld('pvs', {
  invoke: (channel: string, payload?: unknown) => {
    if (!channel.startsWith('pvs:')) {
      return Promise.reject(new Error(`Blocked IPC channel: ${channel}`))
    }
    return ipcRenderer.invoke(channel, payload)
  },
})
