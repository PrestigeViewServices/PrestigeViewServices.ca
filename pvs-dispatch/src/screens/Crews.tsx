import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { DEFAULT_DIVISION_COLORS, DIVISIONS, type CrewSaveInput, type CrewWithMembers } from '@shared/types'
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Select, Skeleton } from '@/components/ui'

const emptyForm = (): CrewSaveInput => ({
  name: '',
  division: 'LawnPros',
  colorHex: DEFAULT_DIVISION_COLORS.LawnPros,
  defaultVehicleId: null,
  active: true,
  members: [],
})

/** A crew is warning-worthy when no member is a lead certified in its division. */
function hasCertifiedLead(crew: CrewWithMembers): boolean {
  return crew.members.some(
    (m) => m.isLead && m.certifications.some((c) => c.division === crew.division && c.level >= 2),
  )
}

export function Crews() {
  const queryClient = useQueryClient()
  const { data: crews, isLoading } = useQuery({ queryKey: ['crews'], queryFn: api.crews.list })
  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: api.workers.list })
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: api.vehicles.list })
  const [editing, setEditing] = useState<CrewSaveInput | null>(null)

  async function save() {
    if (!editing?.name.trim()) {
      toast.error('Crew needs a name')
      return
    }
    try {
      await api.crews.save(editing)
      await queryClient.invalidateQueries({ queryKey: ['crews'] })
      toast.success(`${editing.name} saved`)
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the crew')
    }
  }

  const availableWorkers = (workers ?? []).filter(
    (w) => w.status === 'Active' && !editing?.members.some((m) => m.workerId === w.id),
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Crews</h1>
        <Button onClick={() => setEditing(emptyForm())}>
          <Plus className="h-4 w-4" /> New crew
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !crews || crews.length === 0 ? (
        <EmptyState
          title="No crews yet"
          hint="A crew is a named group of workers with a lead and a vehicle. Jobs get assigned to crews on the schedule board."
          action={<Button onClick={() => setEditing(emptyForm())}>Create your first crew</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {crews.map((crew) => (
            <Card
              key={crew.id}
              className="cursor-pointer p-3 hover:bg-accent/40"
              onClick={() =>
                setEditing({
                  id: crew.id,
                  name: crew.name,
                  division: crew.division,
                  colorHex: crew.colorHex,
                  defaultVehicleId: crew.defaultVehicleId,
                  active: crew.active,
                  members: crew.members.map((m) => ({ workerId: m.workerId, isLead: m.isLead })),
                })
              }
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: crew.colorHex }} />
                <span className="text-sm font-semibold">{crew.name}</span>
                <Badge variant="outline">{crew.division}</Badge>
                {!crew.active && <Badge>Inactive</Badge>}
              </div>
              {!hasCertifiedLead(crew) && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> No certified lead for {crew.division}
                </div>
              )}
              <div className="mt-2 space-y-1">
                {crew.members.length === 0 && <div className="text-xs text-muted-foreground">No members</div>}
                {crew.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5 text-xs">
                    {m.isLead && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    <span className={m.isLead ? 'font-medium' : ''}>{m.worker.name}</span>
                    <span className="text-muted-foreground">
                      {m.certifications
                        .filter((c) => c.division === crew.division)
                        .map((c) => `L${c.level}`)
                        .join(' ')}
                    </span>
                  </div>
                ))}
              </div>
              {crew.vehicle && <div className="mt-2 text-[11px] text-muted-foreground">🚚 {crew.vehicle.name}</div>}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)} title={editing.id ? 'Edit crew' : 'New crew'} wide>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Division">
              <Select
                value={editing.division}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    division: e.target.value,
                    colorHex: DEFAULT_DIVISION_COLORS[e.target.value] ?? editing.colorHex,
                  })
                }
              >
                {DIVISIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Color">
              <Input type="color" className="h-8 w-16 p-0.5" value={editing.colorHex} onChange={(e) => setEditing({ ...editing, colorHex: e.target.value })} />
            </Field>
            <Field label="Default vehicle">
              <Select
                value={editing.defaultVehicleId ?? ''}
                onChange={(e) => setEditing({ ...editing, defaultVehicleId: e.target.value || null })}
              >
                <option value="">None</option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Members (star = crew lead)</div>
            <div className="space-y-1.5">
              {editing.members.map((m) => {
                const worker = workers?.find((w) => w.id === m.workerId)
                return (
                  <div key={m.workerId} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs">
                    <button
                      title={m.isLead ? 'Crew lead' : 'Make crew lead'}
                      onClick={() =>
                        setEditing({
                          ...editing,
                          members: editing.members.map((x) => ({ ...x, isLead: x.workerId === m.workerId })),
                        })
                      }
                    >
                      <Star className={m.isLead ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-muted-foreground'} />
                    </button>
                    <span className="font-medium">{worker?.name ?? 'Unknown'}</span>
                    <span className="text-muted-foreground">{worker?.role}</span>
                    <button
                      className="ml-auto text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setEditing({ ...editing, members: editing.members.filter((x) => x.workerId !== m.workerId) })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
            <Select
              className="mt-2"
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                setEditing({
                  ...editing,
                  members: [...editing.members, { workerId: e.target.value, isLead: editing.members.length === 0 }],
                })
              }}
            >
              <option value="">+ Add a worker…</option>
              {availableWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex justify-between">
            {editing.id ? (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Archive ${editing.name}? Its scheduled jobs go back to the unassigned rail.`)) return
                  await api.crews.archive(editing.id!)
                  await queryClient.invalidateQueries()
                  setEditing(null)
                  toast.success('Crew archived')
                }}
              >
                Archive
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save}>Save crew</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
