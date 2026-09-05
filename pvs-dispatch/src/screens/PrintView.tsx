import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { dateFromStr, minutesLabel, timeOf } from '@/lib/utils'
import type { CrewWithMembers, JobListItem } from '@shared/types'
import type { JobDetailExtras } from '../../electron/services/jobdetail'
import type { PublicSettings } from '../../electron/services/settings'

/**
 * Standalone print document rendered in a hidden window (#print/<kind>?date=…).
 * Black-and-white, no dark fills, one page per crew for run sheets.
 */
export function PrintView() {
  const { kind, date, crewId } = useMemo(() => {
    const hash = window.location.hash // #print/runsheet?date=...&crew=...
    const [pathPart, queryPart] = hash.slice(1).split('?')
    const params = new URLSearchParams(queryPart ?? '')
    return {
      kind: pathPart.split('/')[1] ?? 'runsheet',
      date: params.get('date') ?? format(new Date(), 'yyyy-MM-dd'),
      crewId: params.get('crew'),
    }
  }, [])

  const [data, setData] = useState<{
    crews: CrewWithMembers[]
    jobs: JobListItem[]
    settings: PublicSettings
    extras: Record<string, JobDetailExtras>
  } | null>(null)

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    void (async () => {
      const [crews, jobs, settings] = await Promise.all([
        api.crews.list(),
        api.jobs.list({ dateFrom: date, dateTo: date }),
        api.settings.get(),
      ])
      const assigned = jobs.filter((j) => j.assignedCrewId)
      const extrasList = await Promise.all(
        assigned.map(async (j) => [j.id, await api.jobExtras.get(j.id)] as const),
      )
      setData({ crews, jobs, settings, extras: Object.fromEntries(extrasList) })
      // Give the DOM one frame to paint before the main process exports
      requestAnimationFrame(() => {
        void window.pvs.invoke('pvs:print:ready')
      })
    })()
  }, [date])

  if (!data) return <div className="p-8 text-sm">Preparing…</div>

  const dayLabel = format(dateFromStr(date), 'EEEE, MMMM d, yyyy')
  const visibleCrews = data.crews.filter(
    (c) => c.active && (!crewId || c.id === crewId),
  )

  return (
    <div className="print-doc">
      <style>{`
        .print-doc { background: #fff; color: #000; font-size: 12px; line-height: 1.35; padding: 24px; }
        .print-doc table { border-collapse: collapse; width: 100%; }
        .print-doc th, .print-doc td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
        .print-doc th { font-weight: 700; background: #fff; }
        .print-doc .page-break { page-break-after: always; }
        .print-doc .tickbox { display: inline-block; width: 11px; height: 11px; border: 1.5px solid #000; margin-right: 6px; vertical-align: -1px; }
        .print-doc .alert { font-weight: 700; }
        .print-doc h1 { font-size: 18px; font-weight: 800; margin: 0; }
        .print-doc h2 { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
        .print-doc .muted { color: #333; }
        @media print { .print-doc { padding: 0; } }
      `}</style>

      {kind === 'masterday' ? (
        <MasterDay dayLabel={dayLabel} crews={visibleCrews} jobs={data.jobs} company={data.settings.companyName} />
      ) : (
        visibleCrews.map((crew, i) => (
          <RunSheet
            key={crew.id}
            crew={crew}
            dayLabel={dayLabel}
            company={data.settings.companyName}
            jobs={data.jobs
              .filter((j) => j.assignedCrewId === crew.id)
              .sort((a, b) => (a.scheduledStartAt ?? 0) - (b.scheduledStartAt ?? 0))}
            extras={data.extras}
            last={i === visibleCrews.length - 1}
          />
        ))
      )}
    </div>
  )
}

function RunSheet({
  crew,
  jobs,
  dayLabel,
  company,
  extras,
  last,
}: {
  crew: CrewWithMembers
  jobs: JobListItem[]
  dayLabel: string
  company: string
  extras: Record<string, JobDetailExtras>
  last: boolean
}) {
  return (
    <div className={last ? '' : 'page-break'} style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
        <div>
          <h1>{company} — Crew Run Sheet</h1>
          <div className="muted">{dayLabel}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2>{crew.name}</h2>
          <div className="muted">
            {crew.members.map((m) => `${m.isLead ? '★ ' : ''}${m.worker.name}`).join(' · ') || 'No members'}
          </div>
          {crew.vehicle && <div className="muted">Vehicle: {crew.vehicle.name}</div>}
        </div>
      </div>

      {jobs.length === 0 ? (
        <p>No stops scheduled for this crew.</p>
      ) : (
        jobs.map((job, idx) => {
          const checklist = extras[job.id]?.checklist ?? []
          return (
            <div key={job.id} style={{ border: '1px solid #000', marginBottom: 8, breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', padding: '4px 6px' }}>
                <div>
                  <strong>
                    Stop {idx + 1} — {job.customerName}
                  </strong>
                  {job.priority !== 'Normal' && <span className="alert"> [{job.priority.toUpperCase()}]</span>}
                </div>
                <div>
                  {job.scheduledStartAt != null ? `Arrive ~${timeOf(job.scheduledStartAt)}` : 'Anytime'} ·{' '}
                  {minutesLabel(job.estimatedDurationMinutes)}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1.4, padding: '4px 6px', borderRight: '1px solid #000' }}>
                  <div>{job.address}</div>
                  {job.customerPhone && <div>Phone: {job.customerPhone}</div>}
                  <div style={{ marginTop: 4 }}>
                    <strong>Scope:</strong> {job.title}
                    {job.lineItems.length > 1 &&
                      ` (${job.lineItems.map((li) => li.description).join(', ')})`}
                  </div>
                  {job.customerFacingNotes && <div style={{ marginTop: 4 }}>{job.customerFacingNotes}</div>}
                  <div style={{ marginTop: 4 }}>
                    {job.gateCode && <div className="alert">Gate code: {job.gateCode}</div>}
                    {job.petOnSite && <div className="alert">⚠ PET ON SITE — check before opening gates</div>}
                    {job.hazards && <div className="alert">⚠ HAZARD: {job.hazards}</div>}
                    {job.parkingNotes && <div>Parking: {job.parkingNotes}</div>}
                    {job.accessNotes && <div>Access: {job.accessNotes}</div>}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '4px 6px' }}>
                  {checklist.length > 0 ? (
                    checklist.map((c) => (
                      <div key={c.id}>
                        <span className="tickbox" />
                        {c.label}
                        {c.required ? ' *' : ''}
                      </div>
                    ))
                  ) : (
                    <div className="muted">No checklist</div>
                  )}
                  <div style={{ marginTop: 8, borderTop: '1px solid #000', paddingTop: 4 }}>
                    Notes: ______________________________
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 32 }}>
        <div>Crew lead sign-off: ______________________</div>
        <div>Time out: ________</div>
        <div>Time in: ________</div>
      </div>
    </div>
  )
}

function MasterDay({
  dayLabel,
  crews,
  jobs,
  company,
}: {
  dayLabel: string
  crews: CrewWithMembers[]
  jobs: JobListItem[]
  company: string
}) {
  const unassigned = jobs.filter((j) => !j.assignedCrewId)
  return (
    <div>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
        <h1>{company} — Master Day Schedule</h1>
        <div className="muted">{dayLabel}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '14%' }}>Crew</th>
            <th style={{ width: '8%' }}>Start</th>
            <th style={{ width: '20%' }}>Customer</th>
            <th style={{ width: '26%' }}>Address</th>
            <th style={{ width: '22%' }}>Service</th>
            <th style={{ width: '10%' }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {crews.flatMap((crew) => {
            const crewJobs = jobs
              .filter((j) => j.assignedCrewId === crew.id)
              .sort((a, b) => (a.scheduledStartAt ?? 0) - (b.scheduledStartAt ?? 0))
            if (crewJobs.length === 0) {
              return (
                <tr key={crew.id}>
                  <td>{crew.name}</td>
                  <td colSpan={5} className="muted">
                    No jobs scheduled
                  </td>
                </tr>
              )
            }
            return crewJobs.map((j, i) => (
              <tr key={j.id}>
                {i === 0 && <td rowSpan={crewJobs.length}>{crew.name}</td>}
                <td>{j.scheduledStartAt != null ? timeOf(j.scheduledStartAt) : '—'}</td>
                <td>{j.customerName}</td>
                <td>{j.address}</td>
                <td>
                  {j.title}
                  {j.priority !== 'Normal' ? ` [${j.priority}]` : ''}
                </td>
                <td>{minutesLabel(j.estimatedDurationMinutes)}</td>
              </tr>
            ))
          })}
        </tbody>
      </table>
      {unassigned.length > 0 && (
        <p style={{ marginTop: 8 }}>
          <strong>Unassigned today ({unassigned.length}):</strong>{' '}
          {unassigned.map((j) => `${j.customerName} (${j.title})`).join('; ')}
        </p>
      )}
    </div>
  )
}
