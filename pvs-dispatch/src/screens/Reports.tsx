import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { cn, hours, money, todayStr } from '@/lib/utils'
import { Button, Card, EmptyState, Input, Skeleton } from '@/components/ui'

// Categorical palette in fixed display order, validated per mode with the
// dataviz six-checks script (adjacent-pair CVD + normal-vision separation).
const DIVISION_ORDER = ['LawnPros', 'ClearView', 'Junk Removal', 'SnowLand', 'Hardscape']
const DIVISION_CHART_COLORS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    LawnPros: '#16a34a',
    ClearView: '#0ea5e9',
    'Junk Removal': '#f59e0b',
    SnowLand: '#6366f1',
    Hardscape: '#a16207',
  },
  dark: {
    LawnPros: '#16a34a',
    ClearView: '#0284c7',
    'Junk Removal': '#d97706',
    SnowLand: '#6366f1',
    Hardscape: '#a16207',
  },
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const str = String(v)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export function Reports() {
  const theme = useUi((s) => s.theme)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const colors = DIVISION_CHART_COLORS[isDark ? 'dark' : 'light']
  const inkMuted = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'

  const [from, setFrom] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [to, setTo] = useState(todayStr())
  const { data, isLoading } = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api.reports.data({ from, to }),
  })

  async function exportCsv(name: string, headers: string[], rows: (string | number)[][]) {
    const file = await api.reports.exportCsv({
      defaultName: `${name}-${from}-to-${to}.csv`,
      content: toCsv(headers, rows),
    })
    if (file) toast.success(`Saved ${file}`)
  }

  async function exportPdf() {
    try {
      const file = await api.print.export({ kind: 'reports', date: from, dateTo: to, format: 'pdf' })
      if (file) toast.success(`Saved ${file}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed')
    }
  }

  if (isLoading || !data) return <Skeleton className="m-4 h-72" />

  const sortedDivisions = [...data.revenueByDivision].sort(
    (a, b) => DIVISION_ORDER.indexOf(a.division) - DIVISION_ORDER.indexOf(b.division),
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Reports</h1>
        <span className="text-xs text-muted-foreground">Completed work only — booked revenue, not pipeline</span>
        <div className="ml-auto flex items-center gap-2">
          <Input type="date" className="w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" className="w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outline" onClick={exportPdf}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Active recurring jobs" value={String(data.recurring.activeRecurringJobs)} sub={`${money(data.recurring.recurringJobValue)}/visit booked`} />
        <Tile label="Active snow contracts" value={String(data.recurring.activeSnowContracts)} sub={`${money(data.recurring.snowContractValue)} season value`} />
        <Tile
          label="Drive time share"
          value={data.driveTimeShare != null ? `${Math.round(data.driveTimeShare * 100)}%` : '—'}
          sub="of crew time spent driving (est.)"
          alert={data.driveTimeShare != null && data.driveTimeShare > 0.25}
        />
        <Tile label="Target rate" value={`${money(data.targetRevenuePerCrewHour)}/hr`} sub="revenue per crew hour" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <ChartHeader
            title="Revenue by division"
            onCsv={() =>
              exportCsv(
                'revenue-by-division',
                ['Division', 'Revenue', 'Jobs'],
                sortedDivisions.map((d) => [d.division, d.revenue, d.jobs]),
              )
            }
          />
          {sortedDivisions.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedDivisions} margin={{ top: 20, left: 4, right: 4 }} barCategoryGap="25%">
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="division" tick={{ fontSize: 11, fill: inkMuted }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: isDark ? '#ffffff10' : '#00000008' }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v) => money(Number(v))}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="revenue" position="top" formatter={(v: number) => money(v)} style={{ fontSize: 11, fill: isDark ? '#e4e4e7' : '#3f3f46', fontVariantNumeric: 'tabular-nums' }} />
                  {sortedDivisions.map((d) => (
                    <Cell key={d.division} fill={colors[d.division] ?? '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-3">
          <ChartHeader
            title="Revenue per crew hour by month"
            onCsv={() =>
              exportCsv(
                'revenue-per-crew-hour',
                ['Month', 'Revenue', 'Crew hours', '$/crew hour'],
                data.revenueByMonth.map((m) => [m.month, m.revenue, m.crewHours.toFixed(1), m.revenuePerHour.toFixed(0)]),
              )
            }
          />
          {data.revenueByMonth.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.revenueByMonth} margin={{ top: 12, left: 4, right: 12 }}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: inkMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: inkMuted }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => money(Number(v))} />
                <ReferenceLine
                  y={data.targetRevenuePerCrewHour}
                  stroke={inkMuted}
                  strokeDasharray="4 4"
                  label={{ value: `target ${money(data.targetRevenuePerCrewHour)}`, fontSize: 10, fill: inkMuted, position: 'insideTopRight' }}
                />
                <Line type="monotone" dataKey="revenuePerHour" stroke={colors.LawnPros} strokeWidth={2} dot={{ r: 4 }} name="$/crew hour" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-3">
        <ChartHeader
          title="Revenue & utilization by crew"
          onCsv={() =>
            exportCsv(
              'revenue-by-crew',
              ['Crew', 'Revenue', 'Jobs', 'Crew hours', '$/crew hour'],
              data.revenueByCrew.map((c) => [c.crewName, c.revenue, c.jobs, c.crewHours.toFixed(1), c.revenuePerHour.toFixed(0)]),
            )
          }
        />
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-1.5 pr-2 font-medium">Crew</th>
              <th className="tnum py-1.5 pr-2 text-right font-medium">Revenue</th>
              <th className="tnum py-1.5 pr-2 text-right font-medium">Jobs</th>
              <th className="tnum py-1.5 pr-2 text-right font-medium">Crew hours</th>
              <th className="tnum py-1.5 text-right font-medium">$/crew hour</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueByCrew.map((c) => (
              <tr key={c.crewId} className="border-b border-border/60 last:border-0">
                <td className="py-1.5 pr-2 font-medium">{c.crewName}</td>
                <td className="tnum py-1.5 pr-2 text-right">{money(c.revenue)}</td>
                <td className="tnum py-1.5 pr-2 text-right">{c.jobs}</td>
                <td className="tnum py-1.5 pr-2 text-right">{hours(c.crewHours)}</td>
                <td className={cn('tnum py-1.5 text-right font-medium', c.revenuePerHour < data.targetRevenuePerCrewHour && 'text-red-600 dark:text-red-400')}>
                  {money(c.revenuePerHour)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <ChartHeader
            title="Photo & checklist compliance"
            onCsv={() =>
              exportCsv(
                'compliance',
                ['Crew', 'Completed', 'With after photo', 'Checklist complete'],
                data.compliance.map((c) => [c.crewName, c.completed, c.withAfterPhoto, c.checklistComplete]),
              )
            }
          />
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Crew</th>
                <th className="tnum py-1.5 pr-2 text-right font-medium">Completed</th>
                <th className="tnum py-1.5 pr-2 text-right font-medium">After photo</th>
                <th className="tnum py-1.5 text-right font-medium">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {data.compliance.map((c) => {
                const photoPct = c.completed ? Math.round((c.withAfterPhoto / c.completed) * 100) : 0
                const checkPct = c.completed ? Math.round((c.checklistComplete / c.completed) * 100) : 0
                return (
                  <tr key={c.crewId} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-2 font-medium">{c.crewName}</td>
                    <td className="tnum py-1.5 pr-2 text-right">{c.completed}</td>
                    <td className={cn('tnum py-1.5 pr-2 text-right', photoPct < 80 && 'text-red-600 dark:text-red-400')}>{photoPct}%</td>
                    <td className={cn('tnum py-1.5 text-right', checkPct < 80 && 'text-red-600 dark:text-red-400')}>{checkPct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-3">
          <ChartHeader
            title="Top customers by lifetime value"
            onCsv={() =>
              exportCsv(
                'customer-ltv',
                ['Customer', 'Lifetime value', 'Revenue in range'],
                data.customerLtv.map((c) => [c.name, c.lifetimeValue, c.completedRevenue]),
              )
            }
          />
          <table className="w-full text-left text-xs">
            <tbody>
              {data.customerLtv.slice(0, 10).map((c, i) => (
                <tr key={c.customerId} className="border-b border-border/60 last:border-0">
                  <td className="tnum w-6 py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 pr-2 font-medium">{c.name}</td>
                  <td className="tnum py-1.5 pr-2 text-right">{money(c.lifetimeValue + c.completedRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function ChartHeader({ title, onCsv }: { title: string; onCsv: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-semibold">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onCsv} title="Export CSV">
        <Download className="h-3.5 w-3.5" /> CSV
      </Button>
    </div>
  )
}

function Tile({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <Card className={cn('p-3', alert && 'border-red-500/50')}>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className={cn('tnum mt-0.5 text-xl font-semibold', alert && 'text-red-600 dark:text-red-400')}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  )
}

function NoData() {
  return <EmptyState title="No completed jobs in range" hint="Widen the date range, or complete some work first." />
}
