import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

export interface PrintExportInput {
  kind: 'runsheet' | 'masterday'
  date: string // YYYY-MM-DD
  crewId?: string | null // runsheet: omit for all crews
  format: 'pdf' | 'png'
  openWhenDone?: boolean
}

// Print windows waiting for their renderer to signal that data is rendered
const readyResolvers = new Map<number, () => void>()

export function registerPrintReadyChannel() {
  ipcMain.handle('pvs:print:ready', (event) => {
    readyResolvers.get(event.sender.id)?.()
    readyResolvers.delete(event.sender.id)
  })
}

function waitForReady(win: BrowserWindow, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      readyResolvers.delete(win.webContents.id)
      resolve() // export whatever rendered rather than hanging forever
    }, timeoutMs)
    readyResolvers.set(win.webContents.id, () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Render a print view in a hidden window and export it as PDF or PNG.
 * Returns the saved file path, or null if the user cancelled the save dialog.
 */
export async function exportPrintView(input: PrintExportInput): Promise<string | null> {
  const hash = `#print/${input.kind}?date=${encodeURIComponent(input.date)}${
    input.crewId ? `&crew=${encodeURIComponent(input.crewId)}` : ''
  }`

  const win = new BrowserWindow({
    show: false,
    width: 820,
    height: 1060,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  try {
    const ready = waitForReady(win)
    if (process.env.VITE_DEV_SERVER_URL) {
      await win.loadURL(`${process.env.VITE_DEV_SERVER_URL}${hash}`)
    } else {
      await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), { hash })
    }
    await ready

    const defaultName = `${input.kind === 'runsheet' ? 'run-sheet' : 'day-schedule'}-${input.date}.${input.format}`
    let filePath: string
    if (process.env.PVS_EXPORT_DIR) {
      // Test hook: automated runs export without a save dialog
      filePath = path.join(process.env.PVS_EXPORT_DIR, defaultName)
    } else {
      const result = await dialog.showSaveDialog({
        title: 'Export schedule',
        defaultPath: path.join(app.getPath('documents'), defaultName),
        filters:
          input.format === 'pdf'
            ? [{ name: 'PDF', extensions: ['pdf'] }]
            : [{ name: 'PNG image', extensions: ['png'] }],
      })
      if (result.canceled || !result.filePath) return null
      filePath = result.filePath
    }

    if (input.format === 'pdf') {
      const pdf = await win.webContents.printToPDF({
        pageSize: 'Letter',
        printBackground: false,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      })
      fs.writeFileSync(filePath, pdf)
    } else {
      // Size the window to the full content height so nothing is cut off
      const height: number = await win.webContents.executeJavaScript('document.body.scrollHeight')
      win.setContentSize(820, Math.min(Math.max(height, 400), 12_000))
      await new Promise((r) => setTimeout(r, 300))
      const image = await win.webContents.capturePage()
      fs.writeFileSync(filePath, image.toPNG())
    }

    if (input.openWhenDone !== false) shell.showItemInFolder(filePath)
    return filePath
  } finally {
    win.destroy()
  }
}
