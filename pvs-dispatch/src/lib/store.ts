import { create } from 'zustand'
import type { ScheduleJobInput } from '@shared/types'
import { todayStr } from './utils'

export type ScreenName =
  | 'dashboard'
  | 'schedule'
  | 'planner'
  | 'snow'
  | 'reports'
  | 'workers'
  | 'crews'
  | 'customers'
  | 'catalog'
  | 'settings'

interface UndoEntry {
  undo: ScheduleJobInput
  redo: ScheduleJobInput
  label: string
}

interface UiState {
  screen: ScreenName
  screenParam: string | null
  navigate: (screen: ScreenName, param?: string | null) => void

  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void

  scheduleDate: string // YYYY-MM-DD
  setScheduleDate: (d: string) => void
  scheduleView: 'day' | '3day' | 'week' | 'month'
  setScheduleView: (v: 'day' | '3day' | 'week' | 'month') => void
  divisionFilter: string | null
  setDivisionFilter: (d: string | null) => void

  openJobId: string | null
  setOpenJobId: (id: string | null) => void
  newJobOpen: boolean
  setNewJobOpen: (open: boolean) => void

  // Undo/redo for scheduling actions (capped at 20)
  undoStack: UndoEntry[]
  redoStack: UndoEntry[]
  pushUndo: (entry: UndoEntry) => void
  popUndo: () => UndoEntry | undefined
  popRedo: () => UndoEntry | undefined
}

export const useUi = create<UiState>((set, get) => ({
  screen: 'dashboard',
  screenParam: null,
  navigate: (screen, param = null) => set({ screen, screenParam: param }),

  theme: (localStorage.getItem('pvs-theme') as 'light' | 'dark' | 'system') || 'system',
  setTheme: (theme) => {
    localStorage.setItem('pvs-theme', theme)
    set({ theme })
    applyTheme(theme)
  },

  scheduleDate: todayStr(),
  setScheduleDate: (scheduleDate) => set({ scheduleDate }),
  scheduleView: 'day',
  setScheduleView: (scheduleView) => set({ scheduleView }),
  divisionFilter: null,
  setDivisionFilter: (divisionFilter) => set({ divisionFilter }),

  openJobId: null,
  setOpenJobId: (openJobId) => set({ openJobId }),
  newJobOpen: false,
  setNewJobOpen: (newJobOpen) => set({ newJobOpen }),

  undoStack: [],
  redoStack: [],
  pushUndo: (entry) =>
    set((st) => ({ undoStack: [...st.undoStack.slice(-19), entry], redoStack: [] })),
  popUndo: () => {
    const st = get()
    const entry = st.undoStack[st.undoStack.length - 1]
    if (entry) set({ undoStack: st.undoStack.slice(0, -1), redoStack: [...st.redoStack, entry] })
    return entry
  },
  popRedo: () => {
    const st = get()
    const entry = st.redoStack[st.redoStack.length - 1]
    if (entry) set({ redoStack: st.redoStack.slice(0, -1), undoStack: [...st.undoStack, entry] })
    return entry
  },
}))

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}
