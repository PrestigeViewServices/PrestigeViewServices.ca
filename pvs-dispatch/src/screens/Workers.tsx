import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { DIVISIONS, WORKER_ROLES, type Worker, type WorkerSaveInput } from '@shared/types'
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Select, Skeleton } from '@/components/ui'

const emptyForm = (): WorkerSaveInput => ({
  name: '',
  phone: null,
  email: null,
  role: 'Technician',
  divisionAffinities: [],
  hourlyCost: 20,
  employmentType: 'Full-Time',
  hireDate: null,
  status: 'Active',
  emergencyContact: null,
  notes: null,
  certifications: [],
})

export function Workers() {
  const queryClient = useQueryClient()
  const { data: workers, isLoading } = useQuery({ queryKey: ['workers'], queryFn: api.workers.list })
  const [editing, setEditing] = useState<WorkerSaveInput | null>(null)

  async function openEdit(w: Worker) {
    const detail = await api.workers.get(w.id)
    setEditing({
      id: w.id,
      name: w.name,
      phone: w.phone,
      email: w.email,
      role: w.role,
      divisionAffinities: w.divisionAffinities,
      hourlyCost: w.hourlyCost,
      employmentType: w.employmentType,
      hireDate: w.hireDate,
      status: w.status,
      emergencyContact: w.emergencyContact,
      notes: w.notes,
      certifications: detail.certifications.map((c) => ({
        division: c.division,
        level: c.level,
        expiryDate: c.expiryDate,
      })),
    })
  }

  async function save() {
    if (!editing?.name.trim()) {
      toast.error('Worker needs a name')
      return
    }
    try {
      await api.workers.save(editing)
      await queryClient.invalidateQueries({ queryKey: ['workers'] })
      await queryClient.invalidateQueries({ queryKey: ['crews'] })
      toast.success(`${editing.name} saved`)
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the worker')
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Workers</h1>
        <Button onClick={() => setEditing(emptyForm())}>
          <Plus className="h-4 w-4" /> Add worker
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !workers || workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          hint="Add your first worker, then group workers into crews on the Crews screen."
          action={<Button onClick={() => setEditing(emptyForm())}>Add worker</Button>}
        />
      ) : (
        <Card>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Divisions</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="tnum px-3 py-2 font-medium">Cost/hr</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50" onClick={() => openEdit(w)}>
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="px-3 py-2">{w.role}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {w.divisionAffinities.map((d) => (
                        <Badge key={d} variant="outline">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{w.employmentType}</td>
                  <td className="tnum px-3 py-2">${w.hourlyCost}</td>
                  <td className="px-3 py-2">
                    <Badge variant={w.status === 'Active' ? 'green' : 'outline'}>{w.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)} title={editing.id ? 'Edit worker' : 'Add worker'} wide>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Role">
              <Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as WorkerSaveInput['role'] })}>
                {WORKER_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Phone">
              <Input value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value || null })} />
            </Field>
            <Field label="Email">
              <Input value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value || null })} />
            </Field>
            <Field label="Hourly cost ($)">
              <Input
                type="number"
                min={0}
                value={editing.hourlyCost}
                onChange={(e) => setEditing({ ...editing, hourlyCost: Number(e.target.value) })}
              />
            </Field>
            <Field label="Employment type">
              <Select
                value={editing.employmentType}
                onChange={(e) => setEditing({ ...editing, employmentType: e.target.value as WorkerSaveInput['employmentType'] })}
              >
                {['Full-Time', 'Part-Time', 'Seasonal', 'Contractor'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as WorkerSaveInput['status'] })}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </Field>
            <Field label="Division affinities">
              <div className="flex flex-wrap gap-2 pt-1">
                {DIVISIONS.map((d) => (
                  <label key={d} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={editing.divisionAffinities.includes(d)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          divisionAffinities: e.target.checked
                            ? [...editing.divisionAffinities, d]
                            : editing.divisionAffinities.filter((x) => x !== d),
                        })
                      }
                    />
                    {d}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Certifications</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditing({
                    ...editing,
                    certifications: [...editing.certifications, { division: 'LawnPros', level: 1, expiryDate: null }],
                  })
                }
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editing.certifications.map((c, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2">
                <Select
                  className="w-36"
                  value={c.division}
                  onChange={(e) => {
                    const certs = [...editing.certifications]
                    certs[i] = { ...c, division: e.target.value }
                    setEditing({ ...editing, certifications: certs })
                  }}
                >
                  {DIVISIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
                <Select
                  className="w-28"
                  value={c.level}
                  onChange={(e) => {
                    const certs = [...editing.certifications]
                    certs[i] = { ...c, level: Number(e.target.value) }
                    setEditing({ ...editing, certifications: certs })
                  }}
                >
                  {[1, 2, 3].map((l) => (
                    <option key={l} value={l}>
                      Level {l}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setEditing({ ...editing, certifications: editing.certifications.filter((_, x) => x !== i) })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            {editing.id ? (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Archive ${editing.name}? They will be removed from crews.`)) return
                  await api.workers.archive(editing.id!)
                  await queryClient.invalidateQueries({ queryKey: ['workers'] })
                  await queryClient.invalidateQueries({ queryKey: ['crews'] })
                  setEditing(null)
                  toast.success('Worker archived')
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
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
