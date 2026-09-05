import { app, BrowserWindow, protocol, shell } from 'electron'
import path from 'node:path'
import { initDb, scheduleNightlyBackup, closeDb } from './db'
import { registerIpcHandlers } from './ipc'
import { initPhotoStorage, getPhotosRoot } from './services/jobdetail'
import { registerPrintReadyChannel } from './print'

const isDev = !!process.env.VITE_DEV_SERVER_URL

// Test hooks: point the app at an alternate data dir / capture screenshots,
// used by automated smoke tests. No effect unless the env vars are set.
if (process.env.PVS_USER_DATA) {
  app.setPath('userData', process.env.PVS_USER_DATA)
}

function migrationsFolder(): string {
  // In a packaged app the drizzle folder ships in resources; in dev it sits
  // at the project root.
  return app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(app.getAppPath(), 'drizzle')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'PVS Dispatch',
    icon: path.join(app.getAppPath(), 'build', 'icon.png'),
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // External links open in the user's browser, never inside the app shell
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL as string)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }

  const screenshotDir = process.env.PVS_SCREENSHOT_DIR
  if (screenshotDir) {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const capture = async (name: string) => {
      const image = await win.webContents.capturePage()
      const fs = await import('node:fs')
      fs.writeFileSync(path.join(screenshotDir, `${name}.png`), image.toPNG())
    }
    win.webContents.once('did-finish-load', async () => {
      await sleep(2500)
      await capture('dashboard')
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'T' })
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'T' })
      await sleep(1500)
      await capture('schedule')
      if (process.env.PVS_EXPORT_DIR && process.env.PVS_EXPORT_DATE) {
        const { exportPrintView } = await import('./print')
        const date = process.env.PVS_EXPORT_DATE
        await exportPrintView({ kind: 'runsheet', date, format: 'pdf', openWhenDone: false })
        await exportPrintView({ kind: 'runsheet', date, format: 'png', openWhenDone: false })
        await exportPrintView({ kind: 'masterday', date, format: 'pdf', openWhenDone: false })
      }
      app.quit()
    })
  }
}

app.whenReady().then(() => {
  initDb(app.getPath('userData'), migrationsFolder())
  initPhotoStorage(path.join(app.getPath('userData'), 'photos'))

  // pvsphoto://<jobId>/<file> serves job photos to the renderer in both dev
  // (http origin) and production (file origin) without exposing the full fs.
  protocol.registerFileProtocol('pvsphoto', (request, callback) => {
    try {
      const url = new URL(request.url)
      const jobId = url.hostname
      const fileName = path.basename(decodeURIComponent(url.pathname))
      const resolved = path.join(getPhotosRoot(), jobId, fileName)
      if (!resolved.startsWith(getPhotosRoot())) throw new Error('outside photo root')
      callback({ path: resolved })
    } catch {
      callback({ error: -6 }) // net::ERR_FILE_NOT_FOUND
    }
  })

  registerIpcHandlers()
  registerPrintReadyChannel()
  scheduleNightlyBackup()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  closeDb()
})
