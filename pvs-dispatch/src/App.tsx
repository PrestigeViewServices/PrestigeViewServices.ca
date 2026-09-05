import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { toast } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './screens/Dashboard'
import { Schedule } from './screens/Schedule'
import { Workers } from './screens/Workers'
import { Crews } from './screens/Crews'
import { Customers } from './screens/Customers'
import { Catalog } from './screens/Catalog'
import { SettingsScreen } from './screens/Settings'
import { JobDialog } from './components/JobDialog'
import { api } from './lib/api'
import { useUi } from './lib/store'
import { dateFromStr, todayStr } from './lib/utils'
import { Button } from './components/ui'

function DemoDataPrompt() {
  const queryClient = useQueryClient()
  const { data: isEmpty } = useQuery({ queryKey: ['seed-empty'], queryFn: api.seed.isEmpty })
  if (!isEmpty) return null
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-amber-500/10 px-4 py-2 text-xs">
      <span>
        This database is empty. Load the PVS demo dataset (12 workers, 4 crews, 60 customers, 200 jobs)
        to explore the app, or start adding your own workers and customers.
      </span>
      <Button
        size="sm"
        onClick={async () => {
          try {
            await api.seed.demo()
            await queryClient.invalidateQueries()
            toast.success('Demo data loaded')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not load demo data')
          }
        }}
      >
        Load demo data
      </Button>
    </div>
  )
}

export default function App() {
  const { screen, navigate, setNewJobOpen, scheduleDate, setScheduleDate, popUndo, popRedo } = useUi()
  const queryClient = useQueryClient()

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        const entry = e.shiftKey ? popRedo() : popUndo()
        if (!entry) return
        const input = e.shiftKey ? entry.redo : entry.undo
        await api.jobs.schedule(input)
        await queryClient.invalidateQueries({ queryKey: ['jobs'] })
        toast.info(e.shiftKey ? `Redo: ${entry.label}` : `Undo: ${entry.label}`)
        return
      }
      if (typing) return

      if (e.key === '/') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
      } else if (e.key.toLowerCase() === 'n') {
        setNewJobOpen(true)
      } else if (e.key.toLowerCase() === 't') {
        setScheduleDate(todayStr())
        navigate('schedule')
      } else if (e.key === 'ArrowLeft' && screen === 'schedule') {
        setScheduleDate(format(addDays(dateFromStr(scheduleDate), -1), 'yyyy-MM-dd'))
      } else if (e.key === 'ArrowRight' && screen === 'schedule') {
        setScheduleDate(format(addDays(dateFromStr(scheduleDate), 1), 'yyyy-MM-dd'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, scheduleDate, navigate, setNewJobOpen, setScheduleDate, popUndo, popRedo, queryClient])

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoDataPrompt />
        <main className="min-h-0 flex-1 overflow-auto">
          {screen === 'dashboard' && <Dashboard />}
          {screen === 'schedule' && <Schedule />}
          {screen === 'workers' && <Workers />}
          {screen === 'crews' && <Crews />}
          {screen === 'customers' && <Customers />}
          {screen === 'catalog' && <Catalog />}
          {screen === 'settings' && <SettingsScreen />}
        </main>
      </div>
      <JobDialog />
    </div>
  )
}
