import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeft, Camera, Check, KeyRound, Plus, Snowflake, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn, money } from '@/lib/utils'
import type { StormDispatchRow } from '../../electron/services/snow'
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/components/ui'

const CLASSIFICATIONS = ['Light', 'Standard', 'Heavy', 'Extreme'] as const

export function SnowDispatch() {
  const [stormId, setStormId] = useState<string | null>(null)
  if (stormId) return <StormView stormId={stormId} onBack={() => setStormId(null)} />
  return <StormList onOpen={setStormId} />
}

function StormList({ onOpen }: { onOpen: (id: string) => void }) {
  const queryClient = useQueryClient()
  const { data: storms, isLoading } = useQuery({ queryKey: ['storms'], queryFn: api.snow.storms })
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [startAt, setStartAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [snowfall, setSnowfall] = useState(5)
  const [classification, setClassification] = useState<(typeof CLASSIFICATIONS)[number]>('Standard')

  async function create() {
    if (!name.trim()) {
      toast.error('Give the storm a name (e.g. "Dec 12 system")')
      return
    }
    try {
      const id = await api.snow.create({
        name: name.trim(),
        startAt: new Date(startAt).getTime(),
        classification,
        snowfallCm: snowfall,
      })
      await queryClient.invalidateQueries({ queryKey: ['storms'] })
      setCreating(false)
      toast.success('Storm created — dispatch list built from triggered contracts')
      onOpen(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the storm')
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Snow Dispatch</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New storm event
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !storms || storms.length === 0 ? (
        <EmptyState
          title="No storm events"
          hint="When snow is coming, create a storm event with the forecast amount. Every active contract whose trigger threshold is met lands on the dispatch list with a live SLA clock."
          action={<Button onClick={() => setCreating(true)}>Create storm event</Button>}
        />
      ) : (
        <Card>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-2 font-medium">Storm</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Class</th>
                <th className="tnum px-3 py-2 font-medium">Snowfall</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {storms.map((st) => (
                <tr key={st.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50" onClick={() => onOpen(st.id)}>
                  <td className="px-3 py-2 font-medium">{st.name}</td>
                  <td className="tnum px-3 py-2">{format(new Date(st.startAt), 'MMM d, h:mm a')}</td>
                  <td className="px-3 py-2">
                    <Badge variant={st.classification === 'Heavy' || st.classification === 'Extreme' ? 'red' : 'outline'}>
                      {st.classification}
                    </Badge>
                  </td>
                  <td className="tnum px-3 py-2">{st.snowfallCm} cm</td>
                  <td className="px-3 py-2">
                    <Badge variant={st.status === 'Active' ? 'green' : st.status === 'Closed' ? 'outline' : 'amber'}>
                      {st.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {creating && (
        <Dialog open onOpenChange={(o) => !o && setCreating(false)} title="New storm event">
          <div className="space-y-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. "Dec 12 overnight system"' autoFocus />
            </Field>
            <Field label="Start time">
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </Field>
            <Field label="Forecast snowfall (cm)">
              <Input type="number" min={0} step={0.5} value={snowfall} onChange={(e) => setSnowfall(Number(e.target.value))} />
            </Field>
            <Field label="Classification">
              <Select value={classification} onChange={(e) => setClassification(e.target.value as typeof classification)}>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create}>Create & build dispatch list</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function slaState(row: StormDispatchRow, nowTs: number): 'done' | 'green' | 'amber' | 'red' {
  if (row.completedAt) return 'done'
  const remaining = row.slaDeadline - nowTs
  if (remaining < 0) return 'red'
  if (remaining < 2 * 60 * 60 * 1000) return 'amber'
  return 'green'
}

function slaLabel(row: StormDispatchRow, nowTs: number): string {
  if (row.completedAt) return `Done ${format(new Date(row.completedAt), 'h:mm a')}`
  const remaining = row.slaDeadline - nowTs
  const abs = Math.abs(remaining)
  const h = Math.floor(abs / 3_600_000)
  const m = Math.floor((abs % 3_600_000) / 60_000)
  return remaining < 0 ? `BREACHED ${h}h ${m}m ago` : `${h}h ${m}m left`
}

function StormView({ stormId, onBack }: { stormId: string; onBack: () => void }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['storm', stormId], queryFn: () => api.snow.dispatch(stormId) })
  const { data: summary } = useQuery({ queryKey: ['storm-summary', stormId], queryFn: () => api.snow.summary(stormId) })
  const [nowTs, setNowTs] = useState(Date.now())
  const [completing, setCompleting] = useState<StormDispatchRow | null>(null)
  const [completeNotes, setCompleteNotes] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['storm', stormId] })
    await queryClient.invalidateQueries({ queryKey: ['storm-summary', stormId] })
  }

  const zones = useMemo(() => {
    const map = new Map<string, StormDispatchRow[]>()
    for (const r of data?.rows ?? []) {
      const zone = r.routeZone ?? 'Unzoned'
      map.set(zone, [...(map.get(zone) ?? []), r])
    }
    return [...map.entries()]
  }, [data])

  const tiers = useMemo(() => {
    const map = new Map<string, StormDispatchRow[]>()
    for (const r of data?.rows ?? []) {
      map.set(r.tier, [...(map.get(r.tier) ?? []), r])
    }
    return [...map.entries()].sort((a, b) => (a[1][0]?.slaHours ?? 99) - (b[1][0]?.slaHours ?? 99))
  }, [data])

  if (isLoading || !data) return <Skeleton className="m-4 h-64" />
  const { storm, rows, crews } = data
  const crewName = (id: string | null) => crews.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{storm.name}</h1>
        <Badge variant={storm.status === 'Active' ? 'green' : storm.status === 'Closed' ? 'outline' : 'amber'}>{storm.status}</Badge>
        <Badge variant="outline">{storm.classification}</Badge>
        <span className="tnum text-xs text-muted-foreground">
          {storm.snowfallCm} cm · started {format(new Date(storm.startAt), 'MMM d, h:mm a')}
        </span>
        <div className="ml-auto flex gap-2">
          {storm.status === 'Forecast' && (
            <Button
              size="sm"
              onClick={async () => {
                await api.snow.setStatus({ stormId, status: 'Active' })
                await refresh()
              }}
            >
              Activate storm
            </Button>
          )}
          {storm.status !== 'Closed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!confirm('Close this storm? Unserviced properties will count as SLA breaches in the summary.')) return
                await api.snow.setStatus({ stormId, status: 'Closed' })
                await refresh()
                toast.success('Storm closed — summary below')
              }}
            >
              Close storm
            </Button>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          <Kpi label="Triggered" value={String(summary.totalTriggered)} />
          <Kpi label="Serviced" value={String(summary.serviced)} />
          <Kpi label="Still open" value={String(summary.open)} alert={summary.open > 0 && storm.status === 'Closed'} />
          <Kpi label="SLA breaches" value={String(summary.slaBreaches)} alert={summary.slaBreaches > 0} />
          <Kpi label="Avg response" value={summary.avgResponseMinutes != null ? `${Math.floor(summary.avgResponseMinutes / 60)}h ${summary.avgResponseMinutes % 60}m` : '—'} />
          <Kpi label="Season revenue covered" value={money(summary.seasonRevenueCovered)} />
        </div>
      )}

      {storm.status !== 'Closed' && (
        <Card className="p-3">
          <div className="mb-2 text-xs font-semibold">Assign crews by route zone</div>
          <div className="flex flex-wrap gap-3">
            {zones.map(([zone, zoneRows]) => (
              <div key={zone} className="flex items-center gap-2 text-xs">
                <span className="font-medium">
                  {zone} <span className="tnum text-muted-foreground">({zoneRows.filter((r) => !r.completedAt).length} open)</span>
                </span>
                <Select
                  className="h-7 w-40 text-xs"
                  value={zoneRows.find((r) => !r.completedAt)?.crewId ?? ''}
                  onChange={async (e) => {
                    const n = await api.snow.assignZone({ stormId, routeZone: zone, crewId: e.target.value || null })
                    await refresh()
                    toast.success(`${n} properties in ${zone} → ${e.target.value ? crewName(e.target.value) : 'unassigned'}`)
                  }}
                >
                  <option value="">Unassigned</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No contracts triggered"
          hint={`No active snow contract has a trigger threshold at or below ${storm.snowfallCm} cm.`}
        />
      ) : (
        tiers.map(([tier, tierRows]) => (
          <Card key={tier}>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <span className="text-xs font-semibold">{tier}</span>
              <span className="tnum text-[11px] text-muted-foreground">
                {tierRows.filter((r) => r.completedAt).length}/{tierRows.length} done · SLA {tierRows[0]?.slaHours}h
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <tbody>
                {tierRows.map((row) => {
                  const state = slaState(row, nowTs)
                  return (
                    <tr key={row.contractId} className={cn('border-b border-border/60 last:border-0', row.completedAt && 'opacity-60')}>
                      <td className="px-3 py-1.5">
                        <div className="font-medium">{row.address}</div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {row.customerName}
                          {row.gateCode && (
                            <span className="flex items-center gap-0.5">
                              <KeyRound className="h-3 w-3" /> {row.gateCode}
                            </span>
                          )}
                          {row.hazards && (
                            <span className="flex items-center gap-0.5 text-red-500">
                              <TriangleAlert className="h-3 w-3" /> {row.hazards}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">{row.routeZone ?? 'Unzoned'}</td>
                      <td className="px-3 py-1.5">{crewName(row.crewId)}</td>
                      <td className="tnum px-3 py-1.5">
                        <Badge variant={state === 'done' ? 'green' : state === 'red' ? 'red' : state === 'amber' ? 'amber' : 'green'}>
                          {slaLabel(row, nowTs)}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {row.completedAt ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" /> {row.photoPath ? 'Photo on file' : ''}
                          </span>
                        ) : (
                          storm.status !== 'Closed' && (
                            <Button size="sm" variant="outline" onClick={() => setCompleting(row)}>
                              <Camera className="h-3 w-3" /> Complete
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        ))
      )}

      {completing && (
        <Dialog open onOpenChange={(o) => !o && setCompleting(null)} title={`Complete — ${completing.address}`}>
          <p className="mb-3 text-xs text-muted-foreground">
            A completion photo is required. It is the timestamped service record if the customer ever disputes.
          </p>
          <Field label="Notes (optional)">
            <Textarea value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompleting(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await api.snow.complete({ stormId, contractId: completing.contractId, notes: completeNotes || undefined })
                  setCompleting(null)
                  setCompleteNotes('')
                  await refresh()
                  toast.success('Property checked off with photo')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Could not complete')
                }
              }}
            >
              <Camera className="h-3.5 w-3.5" /> Pick photo & complete
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <Card className={cn('p-2.5', alert && 'border-red-500/50')}>
      <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
      <div className={cn('tnum text-lg font-semibold', alert && 'text-red-600 dark:text-red-400')}>{value}</div>
    </Card>
  )
}
