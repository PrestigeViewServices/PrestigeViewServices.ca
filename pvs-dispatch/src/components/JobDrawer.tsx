import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Camera, Copy, ExternalLink, KeyRound, PawPrint, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useUi } from '@/lib/store'
import { cn, minutesLabel, money, timeOf } from '@/lib/utils'
import { JOB_STATUSES } from '@shared/types'
import { Badge, Button, Input, Select } from './ui'
import { jobColor } from './JobCard'

/**
 * Job drawer: full operational detail — property intelligence front and
 * center, plus checklist, photos, crew notes, and the activity log.
 */
export function JobDrawer() {
  const { openJobId, setOpenJobId } = useUi()
  const queryClient = useQueryClient()
  const { data: jobs } = useQuery({ queryKey: ['jobs', 'all'], queryFn: () => api.jobs.list({}) })
  const { data: extras } = useQuery({
    queryKey: ['job-extras', openJobId],
    queryFn: () => api.jobExtras.get(openJobId!),
    enabled: !!openJobId,
  })
  const job = jobs?.find((j) => j.id === openJobId)

  if (!openJobId || !job) return null

  const refreshExtras = () => queryClient.invalidateQueries({ queryKey: ['job-extras', openJobId] })

  const copyAddress = async () => {
    await navigator.clipboard.writeText(job.address)
    toast.success('Address copied')
  }
  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank')
  }
  const setStatus = async (status: string) => {
    await api.jobs.update({ id: job.id, status })
    await queryClient.invalidateQueries({ queryKey: ['jobs'] })
    toast.success(`Status: ${status}`)
  }

  const intel: { icon?: React.ReactNode; label: string; value: string }[] = []
  if (job.gateCode) intel.push({ icon: <KeyRound className="h-3.5 w-3.5" />, label: 'Gate code', value: job.gateCode })
  if (job.petOnSite) intel.push({ icon: <PawPrint className="h-3.5 w-3.5" />, label: 'Pet on site', value: 'Yes — check before opening gates' })
  if (job.parkingNotes) intel.push({ label: 'Parking', value: job.parkingNotes })
  if (job.accessNotes) intel.push({ label: 'Access', value: job.accessNotes })
  if (job.hazards) intel.push({ icon: <TriangleAlert className="h-3.5 w-3.5 text-red-500" />, label: 'Hazards', value: job.hazards })

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[380px] flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: jobColor(job) }} />
            <span className="truncate text-sm font-semibold">{job.customerName}</span>
            {job.priority !== 'Normal' && (
              <Badge variant={job.priority === 'Emergency' ? 'red' : 'amber'}>{job.priority}</Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{job.address}</span>
            <button className="shrink-0 hover:text-foreground" title="Copy address" onClick={copyAddress}>
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button className="shrink-0 hover:text-foreground" title="Open in maps" onClick={openInMaps}>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
          {job.customerPhone && <div className="tnum text-xs text-muted-foreground">{job.customerPhone}</div>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpenJobId(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{job.division}</Badge>
          <Select className="h-7 w-40 text-xs" value={job.status} onChange={(e) => setStatus(e.target.value)}>
            {JOB_STATUSES.map((st) => (
              <option key={st}>{st}</option>
            ))}
          </Select>
        </div>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service scope</h3>
          <div className="space-y-1 rounded-md border border-border p-2.5">
            <div className="text-sm font-medium">{job.title}</div>
            {job.lineItems.map((li) => (
              <div key={li.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {li.description} × {li.quantity}
                </span>
                <span className="tnum">{money(li.price * li.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-1 text-xs font-semibold">
              <span>Quoted</span>
              <span className="tnum">{money(job.quotedAmount)}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timing</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border p-2">
              <div className="text-muted-foreground">Date</div>
              <div className="tnum font-medium">{job.scheduledDate ?? 'Unscheduled'}</div>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="text-muted-foreground">Start</div>
              <div className="tnum font-medium">{job.scheduledStartAt != null ? timeOf(job.scheduledStartAt) : '—'}</div>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="text-muted-foreground">Duration</div>
              <div className="tnum font-medium">{minutesLabel(job.estimatedDurationMinutes)}</div>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="text-muted-foreground">Crew</div>
              <div className="truncate font-medium">{job.crewName ?? 'Unassigned'}</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Property intelligence
          </h3>
          {intel.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
              No gate codes, pets, or hazards recorded for this property.
            </div>
          ) : (
            <div className="space-y-2 rounded-md border-2 border-amber-500/40 bg-amber-500/5 p-2.5">
              {intel.map((row) => (
                <div key={row.label} className="flex gap-2 text-xs">
                  <span className="flex w-24 shrink-0 items-center gap-1 font-medium">
                    {row.icon}
                    {row.label}
                  </span>
                  <span className="text-muted-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <ChecklistSection jobId={job.id} extras={extras} onChange={refreshExtras} />
        <PhotosSection jobId={job.id} extras={extras} onChange={refreshExtras} />

        {(job.description || job.internalNotes || job.customerFacingNotes) && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job notes</h3>
            {job.description && <p className="text-xs">{job.description}</p>}
            {job.internalNotes && (
              <div className="rounded-md bg-muted p-2 text-xs">
                <span className="font-medium">Internal (never printed): </span>
                {job.internalNotes}
              </div>
            )}
            {job.customerFacingNotes && (
              <div className="rounded-md border border-border p-2 text-xs">
                <span className="font-medium">Customer-facing: </span>
                {job.customerFacingNotes}
              </div>
            )}
          </section>
        )}

        <NotesSection jobId={job.id} extras={extras} onChange={refreshExtras} />
        <ActivitySection extras={extras} />
      </div>
    </div>
  )
}

type Extras = Awaited<ReturnType<typeof api.jobExtras.get>> | undefined

function ChecklistSection({ jobId, extras, onChange }: { jobId: string; extras: Extras; onChange: () => void }) {
  const [newLabel, setNewLabel] = useState('')
  const items = extras?.checklist ?? []
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</h3>
      <div className="space-y-1">
        {items.map((c) => (
          <div key={c.id} className="group flex items-center gap-2 text-xs">
            <button
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                c.completedAt ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border',
              )}
              onClick={async () => {
                await api.jobExtras.toggleChecklist(c.id)
                onChange()
              }}
            >
              {c.completedAt ? '✓' : ''}
            </button>
            <span className={cn(c.completedAt && 'text-muted-foreground line-through')}>
              {c.label}
              {c.required && <span className="ml-1 text-red-500">*</span>}
            </span>
            <button
              className="ml-auto hidden text-muted-foreground hover:text-foreground group-hover:block"
              onClick={async () => {
                await api.jobExtras.removeChecklist(c.id)
                onChange()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-1.5 flex gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!newLabel.trim()) return
          await api.jobExtras.addChecklist({ jobId, label: newLabel.trim(), required: false })
          setNewLabel('')
          onChange()
        }}
      >
        <Input className="h-7 text-xs" placeholder="Add checklist item…" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        <Button type="submit" variant="outline" size="sm">
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </section>
  )
}

function PhotosSection({ jobId, extras, onChange }: { jobId: string; extras: Extras; onChange: () => void }) {
  const [tab, setTab] = useState<'before' | 'after' | 'issue'>('before')
  const photos = (extras?.photos ?? []).filter((p) => p.type === tab)
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Photos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const n = await api.jobExtras.addPhotos({ jobId, type: tab })
            if (n > 0) {
              toast.success(`${n} photo${n > 1 ? 's' : ''} added`)
              onChange()
            }
          }}
        >
          <Camera className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="mb-1.5 flex gap-1">
        {(['before', 'after', 'issue'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded px-2 py-0.5 text-[11px] capitalize',
              tab === t ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t} ({(extras?.photos ?? []).filter((p) => p.type === t).length})
          </button>
        ))}
      </div>
      {photos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
          No {tab} photos yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              <img src={p.filePath} alt={p.caption ?? tab} className="h-20 w-full rounded-md border border-border object-cover" />
              <button
                className="absolute right-1 top-1 hidden rounded bg-black/60 p-0.5 text-white group-hover:block"
                onClick={async () => {
                  await api.jobExtras.removePhoto(p.id)
                  onChange()
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function NotesSection({ jobId, extras, onChange }: { jobId: string; extras: Extras; onChange: () => void }) {
  const [body, setBody] = useState('')
  const notes = extras?.notes ?? []
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Crew notes</h3>
      <div className="space-y-1.5">
        {notes.map((n) => (
          <div key={n.id} className="rounded-md border border-border p-2 text-xs">
            <div className="mb-0.5 text-[10px] text-muted-foreground">
              {n.workerName ?? 'Office'} · {format(new Date(n.createdAt), 'MMM d, h:mm a')}
            </div>
            {n.body}
          </div>
        ))}
      </div>
      <form
        className="mt-1.5 flex gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!body.trim()) return
          await api.jobExtras.addNote({ jobId, body: body.trim() })
          setBody('')
          onChange()
        }}
      >
        <Input className="h-7 text-xs" placeholder="Add a note…" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" variant="outline" size="sm">
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </section>
  )
}

function ActivitySection({ extras }: { extras: Extras }) {
  const activity = (extras?.activity ?? []).slice(0, 12)
  if (activity.length === 0) return null
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
      <div className="space-y-1">
        {activity.map((a) => (
          <div key={a.id} className="flex gap-2 text-[11px] text-muted-foreground">
            <span className="tnum shrink-0">{format(new Date(a.createdAt), 'MMM d, h:mm a')}</span>
            <span>
              {a.action.replace(/_/g, ' ')}
              {a.detail ? ` — ${a.detail}` : ''}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
