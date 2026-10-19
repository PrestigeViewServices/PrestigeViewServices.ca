import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, PawPrint } from 'lucide-react'
import type { JobListItem } from '@shared/types'
import { DEFAULT_DIVISION_COLORS } from '@shared/types'
import { cn, minutesLabel, shortAddress, timeOf } from '@/lib/utils'
import { Badge } from './ui'
import { useUi } from '@/lib/store'

export function jobColor(job: JobListItem): string {
  return job.crewColor ?? DEFAULT_DIVISION_COLORS[job.division] ?? '#64748b'
}

export function JobCardInner({ job, compact }: { job: JobListItem; compact?: boolean }) {
  return (
    <div
      className="h-full overflow-hidden rounded-md border border-border bg-card p-1.5 text-left shadow-sm"
      style={{ borderLeft: `3px solid ${jobColor(job)}` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-xs font-medium">{job.customerName}</span>
        {job.priority !== 'Normal' && (
          <Badge variant={job.priority === 'Emergency' ? 'red' : 'amber'}>{job.priority}</Badge>
        )}
      </div>
      <div className="truncate text-[11px] text-muted-foreground">{shortAddress(job.address)}</div>
      {!compact && (
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <span className="truncate">{job.title}</span>
          <span className="tnum shrink-0">· {minutesLabel(job.estimatedDurationMinutes)}</span>
          {job.scheduledStartAt != null && (
            <span className="tnum shrink-0">· {timeOf(job.scheduledStartAt)}</span>
          )}
          {job.petOnSite && <PawPrint className="h-3 w-3 shrink-0 text-amber-600" />}
          {job.hazards && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
        </div>
      )}
    </div>
  )
}

export function DraggableJobCard({
  job,
  style,
  compact,
  className,
}: {
  job: JobListItem
  style?: React.CSSProperties
  compact?: boolean
  className?: string
}) {
  const setOpenJobId = useUi((s) => s.setOpenJobId)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `job:${job.id}`,
    data: { job },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={() => setOpenJobId(job.id)}
      className={cn('cursor-grab select-none active:cursor-grabbing', isDragging && 'opacity-30', className)}
    >
      <JobCardInner job={job} compact={compact} />
    </div>
  )
}
