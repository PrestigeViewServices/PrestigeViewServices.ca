import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Pencil, Send, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { cn, hours, money, todayStr } from '@/lib/utils'
import { DIVISIONS } from '@shared/types'
import type { Plan, PlannerChatMessage, PlannerContext } from '../../electron/services/planner'
import { Badge, Button, Card, EmptyState, Input, Textarea } from '@/components/ui'

type CrewDecision = 'pending' | 'accepted' | 'rejected'

export function Planner() {
  const queryClient = useQueryClient()
  const { navigate, setScheduleDate } = useUi()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.settings.get })
  const { data: crews } = useQuery({ queryKey: ['crews'], queryFn: api.crews.list })

  const [date, setDate] = useState(todayStr())
  const [divisions, setDivisions] = useState<string[]>([])
  const [lockExisting, setLockExisting] = useState(false)
  const [building, setBuilding] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [context, setContext] = useState<PlannerContext | null>(null)
  const [decisions, setDecisions] = useState<Record<string, CrewDecision>>({})

  const [chatMessages, setChatMessages] = useState<PlannerChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatting, setChatting] = useState(false)

  const options = { date, divisions, lockExisting }
  const jobById = useMemo(
    () => new Map((context?.jobs ?? []).map((j) => [j.jobId, j])),
    [context],
  )
  const crewById = useMemo(() => new Map((crews ?? []).map((c) => [c.id, c])), [crews])
  const target = settings?.targetRevenuePerCrewHour ?? 145

  async function build() {
    setBuilding(true)
    setPlan(null)
    setChatMessages([])
    try {
      const started = Date.now()
      const res = await api.planner.build(options)
      setPlan(res.plan)
      setContext(res.context)
      setDecisions(Object.fromEntries(res.plan.crews.map((c) => [c.crewId, 'pending' as CrewDecision])))
      toast.success(`Plan ready in ${((Date.now() - started) / 1000).toFixed(1)}s — nothing is applied until you accept`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The planner failed')
    } finally {
      setBuilding(false)
    }
  }

  async function acceptCrew(crewId: string, thenEdit: boolean) {
    const crewPlan = plan?.crews.find((c) => c.crewId === crewId)
    if (!crewPlan) return
    try {
      await api.planner.apply({
        date,
        approved: [
          {
            crewId,
            rationale: crewPlan.rationale,
            totalRevenue: crewPlan.totalRevenue,
            totalCrewHours: crewPlan.totalCrewHours,
            stops: crewPlan.stops.map((st) => ({ jobId: st.jobId, arrival: st.arrival })),
          },
        ],
      })
      setDecisions((d) => ({ ...d, [crewId]: 'accepted' }))
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`${crewById.get(crewId)?.name ?? 'Crew'} plan applied`)
      if (thenEdit) {
        setScheduleDate(date)
        navigate('schedule')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not apply the plan')
    }
  }

  async function sendChat() {
    const text = chatInput.trim()
    if (!text || chatting) return
    const nextMessages: PlannerChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatting(true)
    try {
      const res = await api.planner.chat({ options, plan, messages: nextMessages })
      setChatMessages([...nextMessages, { role: 'assistant', content: res.reply }])
      if (res.plan) {
        setPlan(res.plan)
        setDecisions(Object.fromEntries(res.plan.crews.map((c) => [c.crewId, 'pending' as CrewDecision])))
        toast.info('The planner proposed a revised plan — review and accept per crew')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chat failed')
      setChatMessages(chatMessages)
    } finally {
      setChatting(false)
    }
  }

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-lg font-semibold">AI Daily Planner</h1>
          {!settings?.hasAnthropicKey && (
            <Badge variant="amber">No Anthropic API key — add one in Settings to enable planning</Badge>
          )}
        </div>

        <Card className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Target date</div>
            <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Divisions (none = all)</div>
            <div className="flex gap-2 pb-1">
              {DIVISIONS.map((d) => (
                <label key={d} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={divisions.includes(d)}
                    onChange={(e) =>
                      setDivisions(e.target.checked ? [...divisions, d] : divisions.filter((x) => x !== d))
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-xs">
            <input type="checkbox" checked={lockExisting} onChange={(e) => setLockExisting(e.target.checked)} />
            Keep existing assignments fixed
          </label>
          <Button onClick={build} disabled={building || !settings?.hasAnthropicKey}>
            <Sparkles className="h-4 w-4" />
            {building ? 'Planning…' : 'Build plan'}
          </Button>
        </Card>

        {!plan && !building && (
          <EmptyState
            title="No plan yet"
            hint="Build Plan sends the day's jobs, crews, drive-time matrix, and your economics to the planner. It proposes assignments and routes — nothing is written to the schedule until you accept, crew by crew."
          />
        )}
        {building && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Assembling context and asking the planner… this usually takes 10–30 seconds.
          </Card>
        )}

        {plan && plan.warnings.length > 0 && (
          <Card className="space-y-1 border-amber-500/50 p-3">
            {plan.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                {w}
              </div>
            ))}
          </Card>
        )}

        {plan &&
          plan.crews.map((crewPlan) => {
            const crew = crewById.get(crewPlan.crewId)
            const decision = decisions[crewPlan.crewId] ?? 'pending'
            const belowTarget = crewPlan.revenuePerCrewHour < target
            const current = (context?.jobs ?? []).filter((j) => j.currentCrewId === crewPlan.crewId)
            return (
              <Card key={crewPlan.crewId} className={cn('p-3', decision === 'rejected' && 'opacity-50')}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: crew?.colorHex ?? '#64748b' }} />
                  <span className="text-sm font-semibold">{crew?.name ?? crewPlan.crewId}</span>
                  <span className="tnum text-xs text-muted-foreground">
                    {hours(crewPlan.totalCrewHours)} · {money(crewPlan.totalRevenue)}
                  </span>
                  <Badge variant={belowTarget ? 'red' : 'green'}>
                    {money(crewPlan.revenuePerCrewHour)}/hr {belowTarget ? `< ${money(target)} target` : ''}
                  </Badge>
                  <div className="ml-auto flex gap-1.5">
                    {decision === 'accepted' ? (
                      <Badge variant="green">Applied</Badge>
                    ) : decision === 'rejected' ? (
                      <Badge>Rejected</Badge>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => acceptCrew(crewPlan.crewId, false)}>
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => acceptCrew(crewPlan.crewId, true)}>
                          <Pencil className="h-3.5 w-3.5" /> Accept & edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDecisions((d) => ({ ...d, [crewPlan.crewId]: 'rejected' }))}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_240px] gap-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-1 pr-2 font-medium">#</th>
                        <th className="py-1 pr-2 font-medium">Arrive</th>
                        <th className="py-1 pr-2 font-medium">Customer</th>
                        <th className="py-1 pr-2 font-medium">Job</th>
                        <th className="tnum py-1 pr-2 font-medium">Drive</th>
                        <th className="tnum py-1 text-right font-medium">$</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crewPlan.stops.map((stop, i) => {
                        const job = jobById.get(stop.jobId)
                        const isNew = job?.currentCrewId !== crewPlan.crewId
                        const retimed = !isNew && job?.currentStartTime !== stop.arrival
                        return (
                          <tr key={stop.jobId} className="border-b border-border/50 last:border-0">
                            <td className="tnum py-1 pr-2">{i + 1}</td>
                            <td className="tnum py-1 pr-2">{stop.arrival}</td>
                            <td className="py-1 pr-2">
                              <span
                                className={cn(
                                  'mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle',
                                  isNew ? 'bg-emerald-500' : retimed ? 'bg-amber-500' : 'bg-transparent',
                                )}
                                title={isNew ? 'Newly assigned to this crew' : retimed ? 'Time changed' : 'Unchanged'}
                              />
                              {job?.customerName ?? stop.jobId}
                            </td>
                            <td className="py-1 pr-2 text-muted-foreground">{job?.title}</td>
                            <td className="tnum py-1 pr-2">{stop.driveMinutesFromPrevious}m</td>
                            <td className="tnum py-1 text-right">{job ? money(job.quotedAmount) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="rounded-md border border-dashed border-border p-2">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Currently scheduled
                    </div>
                    {current.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground">Nothing on this crew today</div>
                    ) : (
                      current.map((j) => (
                        <div key={j.jobId} className="flex justify-between text-[11px]">
                          <span className="truncate">{j.customerName}</span>
                          <span className="tnum text-muted-foreground">{j.currentStartTime ?? '—'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs italic text-muted-foreground">{crewPlan.rationale}</p>
              </Card>
            )
          })}

        {plan && plan.unassigned.length > 0 && (
          <Card className="p-3">
            <div className="mb-1.5 text-xs font-semibold">Left unassigned ({plan.unassigned.length})</div>
            {plan.unassigned.map((u) => {
              const job = jobById.get(u.jobId)
              return (
                <div key={u.jobId} className="flex gap-2 border-b border-border/50 py-1 text-xs last:border-0">
                  <span className="w-48 shrink-0 truncate font-medium">
                    {job ? `${job.customerName} — ${job.title}` : u.jobId}
                  </span>
                  <span className="text-muted-foreground">{u.reason}</span>
                </div>
              )
            })}
          </Card>
        )}
      </div>

      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card/50">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold">Ask the planner</div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {chatMessages.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Follow-ups against the same day: “move the Wilson gutter job to Thursday and rebalance”,
              “what happens if {(crews ?? [])[0]?.name ?? 'Crew 1'} is down a man tomorrow?”. Revisions come
              back through the same accept/reject flow.
            </p>
          )}
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs',
                m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {m.content}
            </div>
          ))}
          {chatting && <div className="text-[11px] text-muted-foreground">Thinking…</div>}
        </div>
        <form
          className="flex gap-1.5 border-t border-border p-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sendChat()
          }}
        >
          <Textarea
            className="min-h-[36px] flex-1 text-xs"
            rows={1}
            placeholder={settings?.hasAnthropicKey ? 'Ask or adjust…' : 'Add an API key in Settings first'}
            value={chatInput}
            disabled={!settings?.hasAnthropicKey || chatting}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendChat()
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!settings?.hasAnthropicKey || chatting || !chatInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </aside>
    </div>
  )
}
