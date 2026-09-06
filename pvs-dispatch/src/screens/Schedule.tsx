import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Printer, Redo2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { cn, dateFromStr, minutesLabel, todayStr } from '@/lib/utils'
import type { CrewWithMembers, JobListItem, ScheduleJobInput } from '@shared/types'
import { DIVISIONS } from '@shared/types'
import { Button, Dialog, EmptyState, Field, Input, Select, Skeleton } from '@/components/ui'
import { DraggableJobCard, JobCardInner } from '@/components/JobCard'
import { JobDrawer } from '@/components/JobDrawer'

// Board geometry: 6:00 → 20:00, 1 minute = 1px
const DAY_START_MIN = 6 * 60
const DAY_END_MIN = 20 * 60
const BOARD_HEIGHT = DAY_END_MIN - DAY_START_MIN

function minutesFromStart(epochMs: number): number {
  const d = new Date(epochMs)
  return d.getHours() * 60 + d.getMinutes() - DAY_START_MIN
}

function snapTo15(min: number): number {
  return Math.round(min / 15) * 15
}

export function Schedule() {
  const {
    scheduleDate,
    setScheduleDate,
    scheduleView,
    setScheduleView,
    divisionFilter,
    setDivisionFilter,
    setNewJobOpen,
    pushUndo,
    popUndo,
    popRedo,
    undoStack,
    redoStack,
  } = useUi()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeJob, setActiveJob] = useState<JobListItem | null>(null)
  const [printOpen, setPrintOpen] = useState(false)

  const rangeDays = scheduleView === 'day' ? 1 : scheduleView === '3day' ? 3 : scheduleView === 'week' ? 7 : 31
  const rangeStart =
    scheduleView === 'week'
      ? startOfWeek(dateFromStr(scheduleDate), { weekStartsOn: 1 })
      : scheduleView === 'month'
        ? startOfMonth(dateFromStr(scheduleDate))
        : dateFromStr(scheduleDate)
  const rangeEnd = scheduleView === 'month' ? endOfMonth(rangeStart) : addDays(rangeStart, rangeDays - 1)
  const fromStr = format(rangeStart, 'yyyy-MM-dd')
  const toStr = format(rangeEnd, 'yyyy-MM-dd')

  const { data: crews, isLoading: crewsLoading } = useQuery({ queryKey: ['crews'], queryFn: api.crews.list })
  const { data: scheduledJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'range', fromStr, toStr],
    queryFn: () => api.jobs.list({ dateFrom: fromStr, dateTo: toStr }),
  })
  const { data: unassigned } = useQuery({
    queryKey: ['jobs', 'unassigned'],
    queryFn: () => api.jobs.list({ unscheduledOnly: true }),
  })

  const filterJob = (j: JobListItem) => {
    if (divisionFilter && j.division !== divisionFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !j.customerName.toLowerCase().includes(q) &&
        !j.address.toLowerCase().includes(q) &&
        !j.title.toLowerCase().includes(q)
      )
        return false
    }
    return true
  }

  const visibleCrews = (crews ?? []).filter(
    (c) => c.active && (!divisionFilter || c.division === divisionFilter),
  )
  const railJobs = (unassigned ?? []).filter(filterJob)
  const boardJobs = (scheduledJobs ?? []).filter((j) => j.assignedCrewId && filterJob(j))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function applySchedule(input: ScheduleJobInput, label: string) {
    try {
      const res = await api.jobs.schedule(input)
      pushUndo({ undo: res.previous, redo: input, label })
      for (const w of res.warnings) toast.warning(w.message)
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reschedule the job')
    }
  }

  function onDragStart(event: DragStartEvent) {
    const job = event.active.data.current?.job as JobListItem | undefined
    setActiveJob(job ?? null)
  }

  async function onDragEnd(event: DragEndEvent) {
    const job = activeJob
    setActiveJob(null)
    if (!job || !event.over) return
    const overId = String(event.over.id)

    if (overId === 'unassigned') {
      if (!job.assignedCrewId) return
      await applySchedule(
        { jobId: job.id, crewId: null, scheduledDate: null, scheduledStartAt: null },
        `${job.customerName} → unassigned`,
      )
      return
    }

    if (overId.startsWith('crewcol:')) {
      // Day view: crewcol:<crewId>:<date> — drop Y position picks the time
      const [, crewId, date] = overId.split(':')
      const activeRect = event.active.rect.current.translated
      const overRect = event.over.rect
      let startMin = DAY_START_MIN + 8 * 0 + 60 // fallback 7:00
      if (activeRect && overRect) {
        const offsetY = activeRect.top - overRect.top
        startMin = snapTo15(Math.max(0, Math.min(BOARD_HEIGHT - 15, offsetY))) + DAY_START_MIN
      }
      const startAt = dateFromStr(date)
      startAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
      await applySchedule(
        { jobId: job.id, crewId, scheduledDate: date, scheduledStartAt: startAt.getTime() },
        `${job.customerName} → ${format(startAt, 'h:mm a')}`,
      )
      return
    }

    if (overId.startsWith('daycol:')) {
      // Week/3-day view: move to a day, keep crew and time of day when known
      const date = overId.slice('daycol:'.length)
      let startAtMs: number | null = null
      if (job.scheduledStartAt != null) {
        const prev = new Date(job.scheduledStartAt)
        const next = dateFromStr(date)
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
        startAtMs = next.getTime()
      }
      await applySchedule(
        { jobId: job.id, crewId: job.assignedCrewId, scheduledDate: date, scheduledStartAt: startAtMs },
        `${job.customerName} → ${date}`,
      )
    }
  }

  async function handleUndoRedo(redo: boolean) {
    const entry = redo ? popRedo() : popUndo()
    if (!entry) return
    await api.jobs.schedule(redo ? entry.redo : entry.undo)
    await queryClient.invalidateQueries({ queryKey: ['jobs'] })
    toast.info(`${redo ? 'Redo' : 'Undo'}: ${entry.label}`)
  }

  const title =
    scheduleView === 'month'
      ? format(rangeStart, 'MMMM yyyy')
      : scheduleView === 'day'
        ? format(rangeStart, 'EEEE, MMM d')
        : `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d')}`

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setScheduleDate(format(addDays(dateFromStr(scheduleDate), -rangeDays), 'yyyy-MM-dd'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setScheduleDate(todayStr())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setScheduleDate(format(addDays(dateFromStr(scheduleDate), rangeDays), 'yyyy-MM-dd'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-w-[170px] text-sm font-semibold">{title}</div>
        <div className="flex rounded-md border border-border p-0.5">
          {(['day', '3day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setScheduleView(v)}
              className={cn(
                'rounded px-2 py-0.5 text-xs capitalize',
                scheduleView === v ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === '3day' ? '3-Day' : v}
            </button>
          ))}
        </div>
        <Select
          className="w-36"
          value={divisionFilter ?? ''}
          onChange={(e) => setDivisionFilter(e.target.value || null)}
        >
          <option value="">All divisions</option>
          {DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Input
          data-search-input
          className="w-52"
          placeholder="Search customer, address, job…  ( / )"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={undoStack.length === 0} onClick={() => handleUndoRedo(false)} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={redoStack.length === 0} onClick={() => handleUndoRedo(true)} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setPrintOpen(true)} title="Print / export run sheets">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={() => setNewJobOpen(true)}>
            <Plus className="h-4 w-4" /> New job
          </Button>
        </div>
      </div>
      {printOpen && (
        <PrintDialog date={scheduleDate} crews={visibleCrews} onClose={() => setPrintOpen(false)} />
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex min-h-0 flex-1">
          {scheduleView !== 'month' && <UnassignedRail jobs={railJobs} />}
          <div className="min-w-0 flex-1 overflow-auto">
            {crewsLoading || jobsLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : scheduleView === 'day' ? (
              <DayBoard date={scheduleDate} crews={visibleCrews} jobs={boardJobs} />
            ) : scheduleView === 'month' ? (
              <MonthView monthStart={rangeStart} jobs={scheduledJobs ?? []} />
            ) : (
              <MultiDayView start={rangeStart} days={scheduleView === '3day' ? 3 : 7} jobs={boardJobs} crews={visibleCrews} />
            )}
          </div>
        </div>
        <DragOverlay>{activeJob && <div className="w-56"><JobCardInner job={activeJob} /></div>}</DragOverlay>
      </DndContext>
      <JobDrawer />
    </div>
  )
}

function PrintDialog({
  date,
  crews,
  onClose,
}: {
  date: string
  crews: CrewWithMembers[]
  onClose: () => void
}) {
  const [kind, setKind] = useState<'runsheet' | 'masterday'>('runsheet')
  const [crewId, setCrewId] = useState<string>('')
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf')
  const [busy, setBusy] = useState(false)

  async function doExport() {
    setBusy(true)
    try {
      const file = await api.print.export({
        kind,
        date,
        crewId: kind === 'runsheet' && crewId ? crewId : null,
        format,
      })
      if (file) {
        toast.success(`Saved ${file}`)
        onClose()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Print / export — ${date}`}>
      <div className="space-y-3">
        <Field label="Document">
          <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="runsheet">Crew run sheets (one page per crew)</option>
            <option value="masterday">Master day schedule (office wall)</option>
          </Select>
        </Field>
        {kind === 'runsheet' && (
          <Field label="Crew">
            <Select value={crewId} onChange={(e) => setCrewId(e.target.value)}>
              <option value="">All crews</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Format">
          <Select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="pdf">PDF (print or email)</option>
            <option value="png">PNG image (text to a crew lead)</option>
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Publishes a read-only day view to the web at a private link. Requires internet and cloud storage credentials, which are not configured — and note it puts customer addresses on the web."
        >
          Publish share link (needs cloud setup)
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doExport} disabled={busy}>
            {busy ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function UnassignedRail({ jobs }: { jobs: JobListItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-60 shrink-0 flex-col border-r border-border bg-card/50',
        isOver && 'bg-accent/60',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold">
        <span>Unassigned</span>
        <span className={cn('tnum rounded-full px-1.5 py-0.5', jobs.length > 0 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-muted text-muted-foreground')}>
          {jobs.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 pb-3">
        {jobs.length === 0 ? (
          <div className="px-1 pt-2 text-[11px] text-muted-foreground">
            Nothing waiting. New jobs land here until you drag them onto a crew.
          </div>
        ) : (
          jobs.map((j) => <DraggableJobCard key={j.id} job={j} />)
        )}
      </div>
    </div>
  )
}

function CrewColumn({ crew, date, jobs }: { crew: CrewWithMembers; date: string; jobs: JobListItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `crewcol:${crew.id}:${date}` })
  const totalMin = jobs.reduce((s, j) => s + j.estimatedDurationMinutes, 0)
  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-border">
      <div className="sticky top-0 z-10 border-b border-border bg-background px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: crew.colorHex }} />
          <span className="truncate text-xs font-semibold">{crew.name}</span>
          <span className="tnum ml-auto text-[11px] text-muted-foreground">{minutesLabel(totalMin)}</span>
        </div>
        <div className="truncate text-[10px] text-muted-foreground">
          {crew.members.map((m) => m.worker.name.split(' ')[0]).join(', ') || 'No members'}
        </div>
      </div>
      <div ref={setNodeRef} className={cn('relative', isOver && 'bg-accent/40')} style={{ height: BOARD_HEIGHT }}>
        {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 }).map((_, i) => (
          <div key={i} className="absolute inset-x-0 border-t border-border/60" style={{ top: i * 60 }} />
        ))}
        {jobs.map((j) => {
          const top = j.scheduledStartAt != null ? minutesFromStart(j.scheduledStartAt) : 0
          const height = Math.max(34, j.estimatedDurationMinutes)
          return (
            <DraggableJobCard
              key={j.id}
              job={j}
              compact={height < 52}
              className="absolute inset-x-1"
              style={{ top: Math.max(0, top), height }}
            />
          )
        })}
      </div>
    </div>
  )
}

function DayBoard({ date, crews, jobs }: { date: string; crews: CrewWithMembers[]; jobs: JobListItem[] }) {
  if (crews.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No crews yet"
          hint="Create a crew under Crews, then drag jobs from the unassigned rail onto its column."
        />
      </div>
    )
  }
  return (
    <div className="flex min-w-max">
      <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-border bg-background">
        <div className="h-[46px] border-b border-border" />
        <div className="relative" style={{ height: BOARD_HEIGHT }}>
          {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 }).map((_, i) => (
            <div key={i} className="tnum absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ top: i * 60 }}>
              {format(new Date(2000, 0, 1, (DAY_START_MIN + i * 60) / 60), 'h a')}
            </div>
          ))}
        </div>
      </div>
      {crews.map((crew) => (
        <CrewColumn
          key={crew.id}
          crew={crew}
          date={date}
          jobs={jobs.filter((j) => j.assignedCrewId === crew.id && j.scheduledDate === date)}
        />
      ))}
    </div>
  )
}

function MultiDayView({
  start,
  days,
  jobs,
  crews,
}: {
  start: Date
  days: number
  jobs: JobListItem[]
  crews: CrewWithMembers[]
}) {
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days])
  return (
    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${days}, minmax(180px, 1fr))` }}>
      {dayList.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd')
        return <DayColumn key={dateStr} date={dateStr} label={format(d, 'EEE MMM d')} jobs={jobs.filter((j) => j.scheduledDate === dateStr)} crews={crews} />
      })}
    </div>
  )
}

function DayColumn({ date, label, jobs, crews }: { date: string; label: string; jobs: JobListItem[]; crews: CrewWithMembers[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `daycol:${date}` })
  const isToday = date === todayStr()
  return (
    <div ref={setNodeRef} className={cn('flex min-h-0 flex-col border-r border-border', isOver && 'bg-accent/40')}>
      <div className={cn('border-b border-border px-2 py-1.5 text-xs font-semibold', isToday && 'text-emerald-600 dark:text-emerald-400')}>
        {label}
        <span className="tnum ml-1.5 text-[10px] font-normal text-muted-foreground">{jobs.length} jobs</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5">
        {crews.map((crew) => {
          const crewJobs = jobs
            .filter((j) => j.assignedCrewId === crew.id)
            .sort((a, b) => (a.scheduledStartAt ?? 0) - (b.scheduledStartAt ?? 0))
          if (crewJobs.length === 0) return null
          return (
            <div key={crew.id}>
              <div className="flex items-center gap-1 px-0.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: crew.colorHex }} />
                {crew.name}
              </div>
              <div className="space-y-1">
                {crewJobs.map((j) => (
                  <DraggableJobCard key={j.id} job={j} compact />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthView({ monthStart, jobs }: { monthStart: Date; jobs: JobListItem[] }) {
  const { setScheduleDate, setScheduleView } = useUi()
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
  const cells: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) cells.push(d)
  return (
    <div className="grid grid-cols-7 gap-px bg-border p-px">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
          {d}
        </div>
      ))}
      {cells.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd')
        const dayJobs = jobs.filter((j) => j.scheduledDate === dateStr)
        const assigned = dayJobs.filter((j) => j.assignedCrewId).length
        return (
          <button
            key={dateStr}
            onClick={() => {
              setScheduleDate(dateStr)
              setScheduleView('day')
            }}
            className={cn(
              'flex h-24 flex-col items-start bg-background p-1.5 text-left hover:bg-accent/50',
              !isSameMonth(d, monthStart) && 'opacity-40',
            )}
          >
            <span className={cn('tnum text-xs', dateStr === todayStr() && 'rounded bg-emerald-500/15 px-1 font-semibold text-emerald-600 dark:text-emerald-400')}>
              {format(d, 'd')}
            </span>
            {dayJobs.length > 0 && (
              <span className="tnum mt-auto text-[11px] text-muted-foreground">
                {dayJobs.length} jobs{assigned < dayJobs.length ? ` · ${dayJobs.length - assigned} open` : ''}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
