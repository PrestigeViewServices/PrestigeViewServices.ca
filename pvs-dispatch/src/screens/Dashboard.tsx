import { useQuery } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { cn, dateFromStr, hours, money, todayStr } from '@/lib/utils'
import { Card, EmptyState, Skeleton } from '@/components/ui'

function Kpi({
  label,
  value,
  sub,
  alert,
}: {
  label: string
  value: string
  sub?: string
  alert?: boolean
}) {
  return (
    <Card className={cn('p-3', alert && 'border-red-500/50')}>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className={cn('tnum mt-1 text-xl font-semibold', alert && 'text-red-600 dark:text-red-400')}>{value}</div>
      {sub && <div className="tnum mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  )
}

export function Dashboard() {
  const today = todayStr()
  const tomorrow = format(addDays(dateFromStr(today), 1), 'yyyy-MM-dd')
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', today],
    queryFn: () => api.dashboard.stats(today),
  })
  const { data: tomorrowStats } = useQuery({
    queryKey: ['dashboard', tomorrow],
    queryFn: () => api.dashboard.stats(tomorrow),
  })
  const { navigate, setScheduleDate, setOpenJobId } = useUi()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-4 gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  const utilization =
    stats.availableCrewHoursToday > 0
      ? (stats.plannedCrewHoursToday / stats.availableCrewHoursToday) * 100
      : 0
  const belowTargetToday =
    stats.plannedCrewHoursToday > 0 && stats.revenuePerCrewHour < stats.targetRevenuePerCrewHour
  const belowTargetTomorrow =
    !!tomorrowStats &&
    tomorrowStats.plannedCrewHoursToday > 0 &&
    tomorrowStats.revenuePerCrewHour < tomorrowStats.targetRevenuePerCrewHour

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">{format(dateFromStr(today), 'EEEE, MMMM d, yyyy')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Jobs today" value={String(stats.jobsToday)} sub={`${stats.jobsThisWeek} this week`} />
        <Kpi
          label="Unassigned jobs"
          value={String(stats.unassignedJobs)}
          alert={stats.unassignedJobs > 0}
          sub={stats.unassignedJobs > 0 ? 'Drag them onto crews on the Schedule board' : 'All work is assigned'}
        />
        <Kpi
          label="Planned revenue today"
          value={money(stats.plannedRevenueToday)}
          sub={`Break-even: ${money(stats.dailyOverheadBreakEven)}/day`}
          alert={stats.plannedRevenueToday < stats.dailyOverheadBreakEven}
        />
        <Kpi
          label="Crew hours planned"
          value={hours(stats.plannedCrewHoursToday)}
          sub={`of ${hours(stats.availableCrewHoursToday)} available · ${utilization.toFixed(0)}% utilization`}
        />
        <Kpi
          label="Revenue / crew hour (today)"
          value={stats.plannedCrewHoursToday > 0 ? money(stats.revenuePerCrewHour) : '—'}
          sub={`Target: ${money(stats.targetRevenuePerCrewHour)}/hr`}
          alert={belowTargetToday}
        />
        <Kpi
          label="Revenue / crew hour (tomorrow)"
          value={
            tomorrowStats && tomorrowStats.plannedCrewHoursToday > 0
              ? money(tomorrowStats.revenuePerCrewHour)
              : '—'
          }
          sub={
            tomorrowStats
              ? `${money(tomorrowStats.plannedRevenueToday)} over ${hours(tomorrowStats.plannedCrewHoursToday)}`
              : ''
          }
          alert={belowTargetTomorrow}
        />
        <Kpi label="Jobs tomorrow" value={String(tomorrowStats?.jobsToday ?? 0)} />
        <Kpi
          label="Needs attention"
          value={String(stats.needsAttention.length)}
          alert={stats.needsAttention.length > 0}
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Needs attention</h2>
        {stats.needsAttention.length === 0 ? (
          <EmptyState
            title="Nothing needs attention"
            hint="Unassigned jobs, crews without leads, and time-off conflicts will show up here."
          />
        ) : (
          <Card className="divide-y divide-border">
            {stats.needsAttention.map((item, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent/50"
                onClick={() => {
                  if (item.jobId) {
                    setScheduleDate(today)
                    navigate('schedule')
                    setOpenJobId(item.jobId)
                  }
                }}
              >
                <AlertCircle
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    item.kind === 'unassigned' ? 'text-red-500' : 'text-amber-500',
                  )}
                />
                <span>{item.message}</span>
              </button>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
