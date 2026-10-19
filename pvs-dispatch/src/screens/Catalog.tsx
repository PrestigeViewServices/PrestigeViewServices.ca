import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { CatalogSaveInput } from '../../electron/services/customers'
import { DIVISIONS } from '@shared/types'
import { minutesLabel, money } from '@/lib/utils'
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Select, Skeleton } from '@/components/ui'

const emptyForm = (): CatalogSaveInput => ({
  name: '',
  division: 'LawnPros',
  description: null,
  defaultDurationMinutes: 60,
  unit: 'per visit',
  defaultPrice: 0,
  crewSizeRequired: 2,
  requiredCertificationLevel: 1,
  requiredEquipment: [],
})

export function Catalog() {
  const queryClient = useQueryClient()
  const { data: items, isLoading } = useQuery({ queryKey: ['catalog'], queryFn: api.catalog.list })
  const [editing, setEditing] = useState<CatalogSaveInput | null>(null)

  async function save() {
    if (!editing?.name.trim()) {
      toast.error('Service needs a name')
      return
    }
    await api.catalog.save(editing)
    await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    toast.success(`${editing.name} saved`)
    setEditing(null)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Service catalog</h1>
        <Button onClick={() => setEditing(emptyForm())}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !items || items.length === 0 ? (
        <EmptyState
          title="No services yet"
          hint="Define the services you sell — name, division, default duration and price. New jobs pull from this list."
          action={<Button onClick={() => setEditing(emptyForm())}>Add service</Button>}
        />
      ) : (
        <Card>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-2 font-medium">Service</th>
                <th className="px-3 py-2 font-medium">Division</th>
                <th className="tnum px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">Unit</th>
                <th className="tnum px-3 py-2 text-right font-medium">Price</th>
                <th className="tnum px-3 py-2 text-center font-medium">Cert level</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50"
                  onClick={() =>
                    setEditing({
                      id: it.id,
                      name: it.name,
                      division: it.division,
                      description: it.description,
                      defaultDurationMinutes: it.defaultDurationMinutes,
                      unit: it.unit,
                      defaultPrice: it.defaultPrice,
                      crewSizeRequired: it.crewSizeRequired,
                      requiredCertificationLevel: it.requiredCertificationLevel,
                      requiredEquipment: it.requiredEquipment,
                    } as CatalogSaveInput)
                  }
                >
                  <td className="px-3 py-2 font-medium">{it.name}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{it.division}</Badge>
                  </td>
                  <td className="tnum px-3 py-2">{minutesLabel(it.defaultDurationMinutes)}</td>
                  <td className="px-3 py-2">{it.unit}</td>
                  <td className="tnum px-3 py-2 text-right">{money(it.defaultPrice)}</td>
                  <td className="tnum px-3 py-2 text-center">{it.requiredCertificationLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)} title={editing.id ? 'Edit service' : 'Add service'} wide>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Division">
              <Select value={editing.division} onChange={(e) => setEditing({ ...editing, division: e.target.value })}>
                {DIVISIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Default duration (minutes)">
              <Input
                type="number"
                min={15}
                step={15}
                value={editing.defaultDurationMinutes}
                onChange={(e) => setEditing({ ...editing, defaultDurationMinutes: Number(e.target.value) })}
              />
            </Field>
            <Field label="Unit">
              <Select value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value as CatalogSaveInput['unit'] })}>
                {['per visit', 'per hour', 'per sqft', 'per pane'].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </Field>
            <Field label="Default price ($)">
              <Input
                type="number"
                min={0}
                value={editing.defaultPrice}
                onChange={(e) => setEditing({ ...editing, defaultPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="Required certification level">
              <Select
                value={editing.requiredCertificationLevel}
                onChange={(e) => setEditing({ ...editing, requiredCertificationLevel: Number(e.target.value) })}
              >
                {[1, 2, 3].map((l) => (
                  <option key={l} value={l}>
                    Level {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Crew size required">
              <Input
                type="number"
                min={1}
                value={editing.crewSizeRequired}
                onChange={(e) => setEditing({ ...editing, crewSizeRequired: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-between">
            {editing.id ? (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Archive ${editing.name}?`)) return
                  await api.catalog.archive(editing.id!)
                  await queryClient.invalidateQueries({ queryKey: ['catalog'] })
                  setEditing(null)
                  toast.success('Service archived')
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
