import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { todayStr } from '@/lib/utils'
import { DIVISIONS, JOB_PRIORITIES } from '@shared/types'
import { Button, Dialog, Field, Input, Select, Textarea } from './ui'

export function JobDialog() {
  const { newJobOpen, setNewJobOpen } = useUi()
  const queryClient = useQueryClient()
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => api.customers.list(), enabled: newJobOpen })
  const { data: catalog } = useQuery({ queryKey: ['catalog'], queryFn: api.catalog.list, enabled: newJobOpen })

  const [customerId, setCustomerId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [division, setDivision] = useState<string>('LawnPros')
  const [priority, setPriority] = useState<(typeof JOB_PRIORITIES)[number]>('Normal')
  const [date, setDate] = useState<string>(todayStr())
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [amount, setAmount] = useState(0)
  const [weatherDependent, setWeatherDependent] = useState(false)
  const [recurrence, setRecurrence] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const customer = customers?.find((c) => c.id === customerId)
  const service = catalog?.find((c) => c.id === serviceId)

  const properties = useMemo(() => customer?.properties ?? [], [customer])

  function pickService(id: string) {
    setServiceId(id)
    const svc = catalog?.find((c) => c.id === id)
    if (svc) {
      setTitle(svc.name)
      setDivision(svc.division)
      setDuration(svc.defaultDurationMinutes)
      setAmount(svc.defaultPrice)
      setWeatherDependent(svc.division === 'ClearView')
    }
  }

  async function submit() {
    if (!customerId || !propertyId || !title) {
      toast.error('Pick a customer, property, and service')
      return
    }
    setSaving(true)
    try {
      let scheduledStartAt: number | null = null
      if (date && time) {
        const [h, m] = time.split(':').map(Number)
        const d = new Date(`${date}T12:00:00`)
        d.setHours(h, m, 0, 0)
        scheduledStartAt = d.getTime()
      }
      const jobId = await api.jobs.create({
        customerId,
        propertyId,
        division,
        title,
        priority,
        scheduledDate: date || null,
        scheduledStartAt,
        estimatedDurationMinutes: duration,
        quotedAmount: amount,
        weatherDependent,
        description: description || undefined,
        lineItems: [
          {
            serviceCatalogId: service?.id ?? null,
            description: title,
            quantity: 1,
            unit: service?.unit ?? 'per visit',
            price: amount,
          },
        ],
      })
      if (recurrence) {
        await api.jobs.update({ id: jobId, recurrenceRule: recurrence })
        const created = await api.recurring.generate()
        if (created > 0) toast.info(`${created} upcoming visits generated from the recurrence`)
      }
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Job created — it is in the unassigned rail until you drag it onto a crew')
      setNewJobOpen(false)
      setCustomerId('')
      setPropertyId('')
      setServiceId('')
      setTitle('')
      setDescription('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={newJobOpen} onOpenChange={setNewJobOpen} title="New job" wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer">
          <Select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value)
              const props = customers?.find((c) => c.id === e.target.value)?.properties ?? []
              setPropertyId(props[0]?.id ?? '')
            }}
          >
            <option value="">Select…</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Property">
          <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={!customerId}>
            <option value="">Select…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Service" className="col-span-2">
          <Select value={serviceId} onChange={(e) => pickService(e.target.value)}>
            <option value="">Custom / pick a service…</option>
            {catalog?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.division} — {c.name} (${c.defaultPrice})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lawn Mowing" />
        </Field>
        <Field label="Division">
          <Select value={division} onChange={(e) => setDivision(e.target.value)}>
            {DIVISIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Date (blank = backlog)">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start time">
          <Input type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Duration (minutes)">
          <Input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
        <Field label="Quoted amount ($)">
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {JOB_PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 pt-5 text-xs">
          <input type="checkbox" checked={weatherDependent} onChange={(e) => setWeatherDependent(e.target.checked)} />
          Weather-dependent
        </label>
        <Field label="Repeats">
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            <option value="">Does not repeat</option>
            <option value="FREQ=WEEKLY">Weekly</option>
            <option value="FREQ=WEEKLY;INTERVAL=2">Every 2 weeks</option>
            <option value="FREQ=WEEKLY;INTERVAL=4">Every 4 weeks</option>
            <option value="FREQ=DAILY">Daily</option>
          </Select>
        </Field>
        <Field label="Description" className="col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setNewJobOpen(false)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? 'Creating…' : 'Create job'}
        </Button>
      </div>
    </Dialog>
  )
}
