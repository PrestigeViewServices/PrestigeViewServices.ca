import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { CustomerSaveInput, PropertySaveInput } from '../../electron/services/customers'
import { money } from '@/lib/utils'
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { useUi } from '@/lib/store'

const emptyCustomer = (): CustomerSaveInput => ({
  name: '',
  phone: null,
  email: null,
  billingAddress: null,
  customerType: 'residential',
  tags: [],
  notes: null,
  doNotService: false,
})

const emptyProperty = (customerId: string): PropertySaveInput => ({
  customerId,
  address: '',
  lat: null,
  lng: null,
  lotSizeSqft: null,
  gateCode: null,
  petOnSite: false,
  parkingNotes: null,
  accessNotes: null,
  hazards: null,
  routeZone: null,
})

export function Customers() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (selectedId) {
    return <CustomerDetailView id={selectedId} onBack={() => setSelectedId(null)} />
  }
  return <CustomerList search={search} setSearch={setSearch} onOpen={setSelectedId} />
}

function CustomerList({
  search,
  setSearch,
  onOpen,
}: {
  search: string
  setSearch: (s: string) => void
  onOpen: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.customers.list(search || undefined),
  })
  const [editing, setEditing] = useState<CustomerSaveInput | null>(null)

  async function save() {
    if (!editing?.name.trim()) {
      toast.error('Customer needs a name')
      return
    }
    const saved = await api.customers.save(editing)
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    toast.success(`${editing.name} saved`)
    setEditing(null)
    if (!editing.id) onOpen(saved.id)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Customers</h1>
        <Input
          data-search-input
          className="ml-4 w-64"
          placeholder="Search name or phone…  ( / )"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button className="ml-auto" onClick={() => setEditing(emptyCustomer())}>
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          title={search ? 'No matches' : 'No customers yet'}
          hint={search ? 'Try a different search.' : 'Add a customer and their property to start scheduling work.'}
          action={!search ? <Button onClick={() => setEditing(emptyCustomer())}>Add customer</Button> : undefined}
        />
      ) : (
        <Card>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Properties</th>
                <th className="tnum px-3 py-2 text-right font-medium">Lifetime value</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50" onClick={() => onOpen(c.id)}>
                  <td className="px-3 py-2 font-medium">
                    {c.name}
                    {c.doNotService && (
                      <Badge variant="red" className="ml-2">
                        Do not service
                      </Badge>
                    )}
                  </td>
                  <td className="tnum px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2 capitalize">{c.customerType}</td>
                  <td className="px-3 py-2">{c.properties.map((p) => p.address.split(',')[0]).join(' · ')}</td>
                  <td className="tnum px-3 py-2 text-right">{money(c.lifetimeValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && <CustomerDialog editing={editing} setEditing={setEditing} onSave={save} />}
    </div>
  )
}

function CustomerDialog({
  editing,
  setEditing,
  onSave,
}: {
  editing: CustomerSaveInput
  setEditing: (c: CustomerSaveInput | null) => void
  onSave: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && setEditing(null)} title={editing.id ? 'Edit customer' : 'Add customer'} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Type">
          <Select
            value={editing.customerType}
            onChange={(e) => setEditing({ ...editing, customerType: e.target.value as 'residential' | 'commercial' })}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>
        </Field>
        <Field label="Phone">
          <Input value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value || null })} />
        </Field>
        <Field label="Email">
          <Input value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value || null })} />
        </Field>
        <Field label="Notes" className="col-span-2">
          <Textarea value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value || null })} />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={editing.doNotService}
            onChange={(e) => setEditing({ ...editing, doNotService: e.target.checked })}
          />
          Do not service
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEditing(null)}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </Dialog>
  )
}

function CustomerDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const queryClient = useQueryClient()
  const { data: customer, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => api.customers.get(id) })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.settings.get })
  const [editingCustomer, setEditingCustomer] = useState<CustomerSaveInput | null>(null)
  const [editingProperty, setEditingProperty] = useState<PropertySaveInput | null>(null)
  const setOpenJobId = useUi((s) => s.setOpenJobId)

  if (isLoading || !customer) return <Skeleton className="m-4 h-64" />

  async function saveProperty() {
    if (!editingProperty?.address.trim()) {
      toast.error('Property needs an address')
      return
    }
    await api.properties.save(editingProperty)
    await queryClient.invalidateQueries({ queryKey: ['customer', id] })
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    toast.success('Property saved')
    setEditingProperty(null)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{customer.name}</h1>
        <Badge variant="outline" className="capitalize">
          {customer.customerType}
        </Badge>
        <span className="tnum text-xs text-muted-foreground">{customer.phone}</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() =>
            setEditingCustomer({
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              billingAddress: customer.billingAddress,
              customerType: customer.customerType,
              tags: customer.tags,
              notes: customer.notes,
              doNotService: customer.doNotService,
            })
          }
        >
          Edit
        </Button>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Properties</h2>
          <Button variant="outline" size="sm" onClick={() => setEditingProperty(emptyProperty(customer.id))}>
            <Plus className="h-3.5 w-3.5" /> Add property
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {customer.properties.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer p-3 text-xs hover:bg-accent/40"
              onClick={() =>
                setEditingProperty({
                  id: p.id,
                  customerId: p.customerId,
                  address: p.address,
                  lat: p.lat,
                  lng: p.lng,
                  lotSizeSqft: p.lotSizeSqft,
                  gateCode: p.gateCode,
                  petOnSite: p.petOnSite,
                  parkingNotes: p.parkingNotes,
                  accessNotes: p.accessNotes,
                  hazards: p.hazards,
                  routeZone: p.routeZone,
                } as PropertySaveInput)
              }
            >
              <div className="font-medium">{p.address}</div>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                {p.routeZone && <div>Zone: {p.routeZone}</div>}
                {p.gateCode && <div>Gate code: {p.gateCode}</div>}
                {p.petOnSite && <div>🐕 Pet on site</div>}
                {p.hazards && <div className="text-red-500">⚠ {p.hazards}</div>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Job history</h2>
        {customer.jobs.length === 0 ? (
          <EmptyState title="No jobs yet" hint="Create a job for this customer with N or the Schedule screen." />
        ) : (
          <Card>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Job</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="tnum px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...customer.jobs]
                  .sort((a, b) => (b.scheduledDate ?? '').localeCompare(a.scheduledDate ?? ''))
                  .map((j) => (
                    <tr key={j.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50" onClick={() => setOpenJobId(j.id)}>
                      <td className="tnum px-3 py-2">{j.scheduledDate ?? '—'}</td>
                      <td className="px-3 py-2">{j.title}</td>
                      <td className="px-3 py-2">
                        <Badge variant={j.status === 'Complete' ? 'green' : j.status === 'Cancelled' ? 'outline' : 'default'}>
                          {j.status}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-2 text-right">{money(j.quotedAmount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {editingCustomer && (
        <CustomerDialog
          editing={editingCustomer}
          setEditing={setEditingCustomer}
          onSave={async () => {
            await api.customers.save(editingCustomer)
            await queryClient.invalidateQueries({ queryKey: ['customer', id] })
            await queryClient.invalidateQueries({ queryKey: ['customers'] })
            toast.success('Customer saved')
            setEditingCustomer(null)
          }}
        />
      )}

      {editingProperty && (
        <Dialog open onOpenChange={(o) => !o && setEditingProperty(null)} title={editingProperty.id ? 'Edit property' : 'Add property'} wide>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address" className="col-span-2">
              <Input value={editingProperty.address} onChange={(e) => setEditingProperty({ ...editingProperty, address: e.target.value })} autoFocus />
            </Field>
            <Field label="Route zone">
              <Select
                value={editingProperty.routeZone ?? ''}
                onChange={(e) => setEditingProperty({ ...editingProperty, routeZone: e.target.value || null })}
              >
                <option value="">None</option>
                {(settings?.routeZones ?? []).map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </Select>
            </Field>
            <Field label="Lot size (sqft)">
              <Input
                type="number"
                value={editingProperty.lotSizeSqft ?? ''}
                onChange={(e) => setEditingProperty({ ...editingProperty, lotSizeSqft: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
            <Field label="Gate code">
              <Input value={editingProperty.gateCode ?? ''} onChange={(e) => setEditingProperty({ ...editingProperty, gateCode: e.target.value || null })} />
            </Field>
            <label className="flex items-center gap-2 pt-5 text-xs">
              <input
                type="checkbox"
                checked={editingProperty.petOnSite}
                onChange={(e) => setEditingProperty({ ...editingProperty, petOnSite: e.target.checked })}
              />
              Pet on site
            </label>
            <Field label="Parking notes" className="col-span-2">
              <Input value={editingProperty.parkingNotes ?? ''} onChange={(e) => setEditingProperty({ ...editingProperty, parkingNotes: e.target.value || null })} />
            </Field>
            <Field label="Access notes" className="col-span-2">
              <Input value={editingProperty.accessNotes ?? ''} onChange={(e) => setEditingProperty({ ...editingProperty, accessNotes: e.target.value || null })} />
            </Field>
            <Field label="Hazards" className="col-span-2">
              <Input value={editingProperty.hazards ?? ''} onChange={(e) => setEditingProperty({ ...editingProperty, hazards: e.target.value || null })} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingProperty(null)}>
              Cancel
            </Button>
            <Button onClick={saveProperty}>Save property</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
