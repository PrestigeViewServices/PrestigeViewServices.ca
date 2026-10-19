import { and, asc, desc, eq } from 'drizzle-orm'
import path from 'node:path'
import fs from 'node:fs'
import type { Db } from '../db'
import * as s from '../db/schema'
import type { ActivityLogEntry, JobChecklistItem, JobNote } from '../../shared/types'

export interface JobPhotoRow {
  id: string
  jobId: string
  type: 'before' | 'after' | 'issue'
  filePath: string // pvsphoto:// URL for the renderer
  caption: string | null
  takenAt: number | null
}

export interface JobDetailExtras {
  checklist: JobChecklistItem[]
  photos: JobPhotoRow[]
  notes: (JobNote & { workerName: string | null })[]
  activity: ActivityLogEntry[]
}

let photosRoot = ''

export function initPhotoStorage(root: string) {
  photosRoot = root
  fs.mkdirSync(photosRoot, { recursive: true })
}

export function getPhotosRoot() {
  return photosRoot
}

function toPhotoUrl(jobId: string, fileName: string) {
  return `pvsphoto://${jobId}/${fileName}`
}

export function getJobDetailExtras(db: Db, jobId: string): JobDetailExtras {
  const checklist = db
    .select()
    .from(s.jobChecklistItems)
    .where(and(eq(s.jobChecklistItems.jobId, jobId)))
    .orderBy(asc(s.jobChecklistItems.createdAt))
    .all()
    .filter((c) => !c.archivedAt)
  const photos = db
    .select()
    .from(s.jobPhotos)
    .where(eq(s.jobPhotos.jobId, jobId))
    .all()
    .filter((p) => !p.archivedAt)
    .map((p) => ({
      id: p.id,
      jobId: p.jobId,
      type: p.type,
      filePath: toPhotoUrl(jobId, path.basename(p.filePath)),
      caption: p.caption,
      takenAt: p.takenAt,
    }))
  const notes = db
    .select({ note: s.jobNotes, workerName: s.workers.name })
    .from(s.jobNotes)
    .leftJoin(s.workers, eq(s.jobNotes.workerId, s.workers.id))
    .where(eq(s.jobNotes.jobId, jobId))
    .orderBy(desc(s.jobNotes.createdAt))
    .all()
    .map((r) => ({ ...r.note, workerName: r.workerName }))
  const activity = db
    .select()
    .from(s.activityLog)
    .where(and(eq(s.activityLog.entityType, 'job'), eq(s.activityLog.entityId, jobId)))
    .orderBy(desc(s.activityLog.createdAt))
    .all()
  return { checklist, photos, notes, activity }
}

export function toggleChecklistItem(db: Db, itemId: string) {
  const item = db.select().from(s.jobChecklistItems).where(eq(s.jobChecklistItems.id, itemId)).get()
  if (!item) throw new Error('Checklist item not found')
  db.update(s.jobChecklistItems)
    .set({
      completedAt: item.completedAt ? null : Date.now(),
      completedByWorkerId: item.completedAt ? null : item.completedByWorkerId,
      updatedAt: Date.now(),
    })
    .where(eq(s.jobChecklistItems.id, itemId))
    .run()
}

export function addChecklistItem(db: Db, input: { jobId: string; label: string; required: boolean }) {
  db.insert(s.jobChecklistItems)
    .values({ jobId: input.jobId, label: input.label, required: input.required })
    .run()
}

export function removeChecklistItem(db: Db, itemId: string) {
  db.update(s.jobChecklistItems)
    .set({ archivedAt: Date.now() })
    .where(eq(s.jobChecklistItems.id, itemId))
    .run()
}

export function addJobNote(db: Db, input: { jobId: string; body: string }) {
  db.insert(s.jobNotes).values({ jobId: input.jobId, body: input.body }).run()
}

/** Copy picked image files into the photo store and record them. */
export function addJobPhotos(
  db: Db,
  input: { jobId: string; type: 'before' | 'after' | 'issue'; sourcePaths: string[] },
): number {
  const dir = path.join(photosRoot, input.jobId)
  fs.mkdirSync(dir, { recursive: true })
  let added = 0
  db.transaction((tx) => {
    for (const src of input.sourcePaths) {
      const ext = path.extname(src).toLowerCase() || '.jpg'
      const fileName = `${crypto.randomUUID()}${ext}`
      fs.copyFileSync(src, path.join(dir, fileName))
      tx.insert(s.jobPhotos)
        .values({
          jobId: input.jobId,
          type: input.type,
          filePath: path.join(dir, fileName),
          takenAt: Date.now(),
        })
        .run()
      added++
    }
    tx.insert(s.activityLog)
      .values({
        entityType: 'job',
        entityId: input.jobId,
        action: 'photos_added',
        detail: `${added} ${input.type} photo(s)`,
      })
      .run()
  })
  return added
}

export function removeJobPhoto(db: Db, photoId: string) {
  const photo = db.select().from(s.jobPhotos).where(eq(s.jobPhotos.id, photoId)).get()
  if (!photo) return
  db.update(s.jobPhotos).set({ archivedAt: Date.now() }).where(eq(s.jobPhotos.id, photoId)).run()
  try {
    fs.unlinkSync(photo.filePath)
  } catch {
    // already gone on disk is fine
  }
}
