import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { dateFromStr, minutesLabel, timeOf } from '@/lib/utils'
import type { CrewWithMembers, JobListItem } from '@shared/types'
import type { JobDetailExtras } from '../../electron/services/jobdetail'
import type { PublicSettings } from '../../electron/services/settings'
import type { ReportsData } from '../../electron/services/reports'

const PRINT_CSS = `
  .print-doc { background: #fff; color: #000; font-size: 12px; line-height: 1.35; padding: 24px; }
  .print-doc table { border-collapse: collapse; width: 100%; }
  .print-doc th, .print-doc td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
  .print-doc th { font-weight: 700; background: #fff; }
  .print-doc .page-break { page-break-after: always; }
  .print-doc .tickbox { display: inline-block; width: 11px; height: 11px; border: 1.5px solid #000; margin-right: 6px; vertical-align: -1px; }
  .print-doc .alert { font-weight: 700; }
  .print-doc h1 { font-size: 18px; font-weight: 800; margin: 0; }
  .print-doc h2 { font-size: 15px; font-weight: 700; margin: 16px 0 4px; }
  .print-doc .muted { color: #333; }
  @media print { .print-doc { padding: 0; } }
`

/**
 * Standalone print document rendered in a hidden window (#print/<kind>?date=…).
 * Black-and-white, no dark fills, one page per crew for run sheets.
 */
export function PrintView() {
  const { kind, date, crewId, dateTo } = useMemo(() => {
    const hash = window.location.hash // #print/runsheet?date=...&crew=...
    const [pathPart, queryPart] = hash.slice(1).split('?')
    const params = new URLSearchParams(queryPart ?? '')
    return {
      kind: pathPart.split('/')[1] ?? 'runsheet',
      date: params.get('date') ?? format(new Date(), 'yyyy-MM-dd'),
      crewId: params.get('crew'),
      dateTo: params.get('to'),
    }
  }, [])

  if (kind === 'reports') return <ReportsPrint from={date} to={dateTo ?? date} />
  return <SchedulePrint kind={kind} date={date} crewId={crewId} />
}

function SchedulePrint({ kind, date, crewId }: { kind: string; date: string; crewId: string | null }) {

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
      <style>{PRINT_CSS}</style>

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

function ReportsPrint({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<{ reports: ReportsData; company: string } | null>(null)

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    void (async () => {
      const [reports, settings] = await Promise.all([
        api.reports.data({ from, to }),
        api.settings.get(),
      ])
      setData({ reports, company: settings.companyName })
      requestAnimationFrame(() => {
        void window.pvs.invoke('pvs:print:ready')
      })
    })()
  }, [from, to])

  if (!data) return <div className="p-8 text-sm">Preparing…</div>
  const r = data.reports
  const moneyFmt = (n: number) =>
    n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

  return (
    <div className="print-doc">
      <style>{PRINT_CSS}</style>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
        <h1>{data.company} — Operations Report</h1>
        <div className="muted">
          {format(dateFromStr(from), 'MMM d, yyyy')} – {format(dateFromStr(to), 'MMM d, yyyy')} · completed work only
        </div>
      </div>

      <h2>Revenue by division</h2>
      <table>
        <thead><tr><th>Division</th><th>Jobs</th><th>Revenue</th></tr></thead>
        <tbody>
          {r.revenueByDivision.map((d) => (
            <tr key={d.division}><td>{d.division}</td><td>{d.jobs}</td><td>{moneyFmt(d.revenue)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Revenue per crew hour by month (target {moneyFmt(r.targetRevenuePerCrewHour)}/hr)</h2>
      <table>
        <thead><tr><th>Month</th><th>Revenue</th><th>Crew hours</th><th>$/crew hour</th></tr></thead>
        <tbody>
          {r.revenueByMonth.map((m) => (
            <tr key={m.month}>
              <td>{m.month}</td><td>{moneyFmt(m.revenue)}</td><td>{m.crewHours.toFixed(1)}</td>
              <td className={m.revenuePerHour < r.targetRevenuePerCrewHour ? 'alert' : ''}>{moneyFmt(m.revenuePerHour)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Revenue &amp; utilization by crew</h2>
      <table>
        <thead><tr><th>Crew</th><th>Jobs</th><th>Crew hours</th><th>Revenue</th><th>$/crew hour</th></tr></thead>
        <tbody>
          {r.revenueByCrew.map((c) => (
            <tr key={c.crewId}>
              <td>{c.crewName}</td><td>{c.jobs}</td><td>{c.crewHours.toFixed(1)}</td>
              <td>{moneyFmt(c.revenue)}</td><td>{moneyFmt(c.revenuePerHour)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Photo &amp; checklist compliance</h2>
      <table>
        <thead><tr><th>Crew</th><th>Completed</th><th>With after photo</th><th>Checklist complete</th></tr></thead>
        <tbody>
          {r.compliance.map((c) => (
            <tr key={c.crewId}>
              <td>{c.crewName}</td><td>{c.completed}</td><td>{c.withAfterPhoto}</td><td>{c.checklistComplete}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Recurring revenue</h2>
      <p>
        {r.recurring.activeRecurringJobs} active recurring jobs ({moneyFmt(r.recurring.recurringJobValue)}/visit booked) ·{' '}
        {r.recurring.activeSnowContracts} snow contracts ({moneyFmt(r.recurring.snowContractValue)} season value)
        {r.driveTimeShare != null ? ` · drive time ≈ ${Math.round(r.driveTimeShare * 100)}% of crew time` : ''}
      </p>

      <h2>Top customers by lifetime value</h2>
      <table>
        <thead><tr><th>#</th><th>Customer</th><th>Lifetime value</th></tr></thead>
        <tbody>
          {r.customerLtv.slice(0, 15).map((c, i) => (
            <tr key={c.customerId}><td>{i + 1}</td><td>{c.name}</td><td>{moneyFmt(c.lifetimeValue + c.completedRevenue)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
