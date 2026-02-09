import { useState, useEffect, useMemo, useCallback } from 'react'
import type { WorkoutLogs, Workouts, Uebungen } from '@/types/app'
import { APP_IDS } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const RPE_LABELS: Record<string, string> = {
  rpe_1: '1 - Sehr leicht',
  rpe_2: '2',
  rpe_3: '3',
  rpe_4: '4',
  rpe_5: '5 - Mittel',
  rpe_6: '6',
  rpe_7: '7',
  rpe_8: '8',
  rpe_9: '9',
  rpe_10: '10 - Maximal',
}

const RPE_VALUES = [
  'rpe_1', 'rpe_2', 'rpe_3', 'rpe_4', 'rpe_5',
  'rpe_6', 'rpe_7', 'rpe_8', 'rpe_9', 'rpe_10',
] as const

const WORKOUT_TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
}

interface FormData {
  workout: string
  uebung: string
  satz_nummer: string
  gewicht: string
  wiederholungen: string
  rpe: string
}

const EMPTY_FORM: FormData = {
  workout: '',
  uebung: '',
  satz_nummer: '',
  gewicht: '',
  wiederholungen: '',
  rpe: '',
}

export function WorkoutLogsPage() {
  const [logs, setLogs] = useState<WorkoutLogs[]>([])
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [uebungen, setUebungen] = useState<Uebungen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<WorkoutLogs | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingLog, setDeletingLog] = useState<WorkoutLogs | null>(null)

  // Filter state
  const [filterWorkoutId, setFilterWorkoutId] = useState<string>('alle')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [l, w, u] = await Promise.all([
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getWorkouts(),
        LivingAppsService.getUebungen(),
      ])
      setLogs(l)
      setWorkouts(w)
      setUebungen(u)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Lookup maps
  const workoutMap = useMemo(() => {
    const map = new Map<string, Workouts>()
    for (const w of workouts) {
      map.set(w.record_id, w)
    }
    return map
  }, [workouts])

  const uebungMap = useMemo(() => {
    const map = new Map<string, Uebungen>()
    for (const u of uebungen) {
      map.set(u.record_id, u)
    }
    return map
  }, [uebungen])

  // Helper to get workout display label
  function getWorkoutLabel(workout: Workouts): string {
    const datum = workout.fields.datum
      ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })
      : 'Ohne Datum'
    const typ = WORKOUT_TYP_LABELS[workout.fields.typ ?? ''] ?? 'Unbekannt'
    return `${datum} - ${typ}`
  }

  // Helper to get uebung display name
  function getUebungName(uebungId: string | null): string {
    if (!uebungId) return 'Unbekannte Übung'
    const u = uebungMap.get(uebungId)
    return u?.fields.name ?? 'Unbekannte Übung'
  }

  // Helper to resolve workout record_id from applookup URL
  function resolveWorkoutId(url: string | undefined): string | null {
    if (!url) return null
    return extractRecordId(url)
  }

  // Helper to resolve uebung record_id from applookup URL
  function resolveUebungId(url: string | undefined): string | null {
    if (!url) return null
    return extractRecordId(url)
  }

  // Sorted workouts for select (newest first)
  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) =>
      (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')
    )
  }, [workouts])

  // Sorted uebungen for select (alphabetical)
  const sortedUebungen = useMemo(() => {
    return [...uebungen].sort((a, b) =>
      (a.fields.name ?? '').localeCompare(b.fields.name ?? '', 'de')
    )
  }, [uebungen])

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (filterWorkoutId === 'alle') return logs
    return logs.filter((log) => {
      const workoutRecordId = resolveWorkoutId(log.fields.workout)
      return workoutRecordId === filterWorkoutId
    })
  }, [logs, filterWorkoutId])

  // Group and sort logs
  const groupedLogs = useMemo(() => {
    // Build groups by workout record_id
    const groups = new Map<string, { workout: Workouts | null; workoutId: string; logs: WorkoutLogs[] }>()

    for (const log of filteredLogs) {
      const workoutRecordId = resolveWorkoutId(log.fields.workout)
      const key = workoutRecordId ?? '__no_workout__'
      if (!groups.has(key)) {
        groups.set(key, {
          workout: workoutRecordId ? workoutMap.get(workoutRecordId) ?? null : null,
          workoutId: key,
          logs: [],
        })
      }
      groups.get(key)!.logs.push(log)
    }

    // Sort groups by workout date descending
    const sorted = Array.from(groups.values()).sort((a, b) => {
      const dateA = a.workout?.fields.datum ?? ''
      const dateB = b.workout?.fields.datum ?? ''
      return dateB.localeCompare(dateA)
    })

    // Sort logs within each group: by exercise name, then satz_nummer asc
    for (const group of sorted) {
      group.logs.sort((a, b) => {
        const uebungIdA = resolveUebungId(a.fields.uebung)
        const uebungIdB = resolveUebungId(b.fields.uebung)
        const nameA = getUebungName(uebungIdA)
        const nameB = getUebungName(uebungIdB)
        const nameCompare = nameA.localeCompare(nameB, 'de')
        if (nameCompare !== 0) return nameCompare
        return (a.fields.satz_nummer ?? 0) - (b.fields.satz_nummer ?? 0)
      })
    }

    return sorted
  }, [filteredLogs, workoutMap, uebungMap])

  // Open create dialog
  function handleCreate() {
    setEditingLog(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  // Open edit dialog
  function handleEdit(log: WorkoutLogs) {
    setEditingLog(log)
    const workoutRecordId = resolveWorkoutId(log.fields.workout)
    const uebungRecordId = resolveUebungId(log.fields.uebung)
    setForm({
      workout: workoutRecordId ?? '',
      uebung: uebungRecordId ?? '',
      satz_nummer: log.fields.satz_nummer?.toString() ?? '',
      gewicht: log.fields.gewicht?.toString() ?? '',
      wiederholungen: log.fields.wiederholungen?.toString() ?? '',
      rpe: log.fields.rpe ?? '',
    })
    setDialogOpen(true)
  }

  // Open delete dialog
  function handleDeleteClick(log: WorkoutLogs) {
    setDeletingLog(log)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  async function handleDeleteConfirm() {
    if (!deletingLog) return
    try {
      await LivingAppsService.deleteWorkoutLog(deletingLog.record_id)
      toast.success('Eintrag erfolgreich gelöscht')
      setLogs((prev) => prev.filter((l) => l.record_id !== deletingLog.record_id))
    } catch {
      toast.error('Fehler beim Löschen des Eintrags')
      throw new Error('Löschen fehlgeschlagen')
    }
  }

  // Save (create or update)
  async function handleSave() {
    if (!form.workout) {
      toast.error('Bitte ein Workout auswählen')
      return
    }
    if (!form.uebung) {
      toast.error('Bitte eine Übung auswählen')
      return
    }

    setSaving(true)
    try {
      const fields: WorkoutLogs['fields'] = {
        workout: createRecordUrl(APP_IDS.WORKOUTS, form.workout),
        uebung: createRecordUrl(APP_IDS.UEBUNGEN, form.uebung),
        satz_nummer: form.satz_nummer ? parseInt(form.satz_nummer, 10) : undefined,
        gewicht: form.gewicht ? parseFloat(form.gewicht) : undefined,
        wiederholungen: form.wiederholungen ? parseInt(form.wiederholungen, 10) : undefined,
        rpe: form.rpe ? (form.rpe as WorkoutLogs['fields']['rpe']) : undefined,
      }

      if (editingLog) {
        await LivingAppsService.updateWorkoutLog(editingLog.record_id, fields)
        toast.success('Eintrag erfolgreich aktualisiert')
      } else {
        await LivingAppsService.createWorkoutLog(fields)
        toast.success('Eintrag erfolgreich erstellt')
      }

      setDialogOpen(false)
      setEditingLog(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch {
      toast.error(editingLog ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen')
    } finally {
      setSaving(false)
    }
  }

  // Get delete record name for confirmation dialog
  function getDeleteRecordName(log: WorkoutLogs): string {
    const uebungId = resolveUebungId(log.fields.uebung)
    const name = getUebungName(uebungId)
    const satz = log.fields.satz_nummer ? ` Satz ${log.fields.satz_nummer}` : ''
    return `${name}${satz}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-2">Fehler beim Laden der Daten</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={loadData}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold">Workout-Logs</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Eintrag
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="filter-workout" className="text-sm font-medium whitespace-nowrap">
          Workout filtern:
        </Label>
        <Select value={filterWorkoutId} onValueChange={setFilterWorkoutId}>
          <SelectTrigger className="w-[300px]" id="filter-workout">
            <SelectValue placeholder="Alle Workouts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Workouts</SelectItem>
            {sortedWorkouts.map((w) => (
              <SelectItem key={w.record_id} value={w.record_id}>
                {getWorkoutLabel(w)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {groupedLogs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {filterWorkoutId !== 'alle'
                ? 'Keine Einträge für dieses Workout gefunden.'
                : 'Noch keine Workout-Logs vorhanden.'}
            </p>
            <Button variant="outline" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Eintrag erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grouped Table */}
      {groupedLogs.map((group) => (
        <Card key={group.workoutId}>
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">
                {group.workout
                  ? group.workout.fields.datum
                    ? format(parseISO(group.workout.fields.datum), 'EEEE, dd. MMMM yyyy', { locale: de })
                    : 'Ohne Datum'
                  : 'Kein Workout zugeordnet'}
              </h2>
              {group.workout?.fields.typ && (
                <Badge variant="secondary">
                  {WORKOUT_TYP_LABELS[group.workout.fields.typ] ?? group.workout.fields.typ}
                </Badge>
              )}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Übung</TableHead>
                <TableHead className="text-center">Satz</TableHead>
                <TableHead className="text-center">Gewicht (kg)</TableHead>
                <TableHead className="text-center">Wdh</TableHead>
                <TableHead className="text-center">RPE</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.logs.map((log) => {
                const uebungId = resolveUebungId(log.fields.uebung)
                const uebungName = getUebungName(uebungId)
                return (
                  <TableRow key={log.record_id}>
                    <TableCell className="font-medium">{uebungName}</TableCell>
                    <TableCell className="text-center">
                      {log.fields.satz_nummer ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.fields.gewicht != null ? log.fields.gewicht : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.fields.wiederholungen ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.fields.rpe ? (
                        <Badge variant="outline">
                          {RPE_LABELS[log.fields.rpe] ?? log.fields.rpe}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(log)}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(log)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ))}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingLog ? 'Eintrag bearbeiten' : 'Neuer Workout-Log'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Workout Select */}
            <div className="space-y-2">
              <Label htmlFor="form-workout">Workout</Label>
              <Select
                value={form.workout || undefined}
                onValueChange={(val) => setForm((prev) => ({ ...prev, workout: val }))}
              >
                <SelectTrigger id="form-workout">
                  <SelectValue placeholder="Workout auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {sortedWorkouts.map((w) => (
                    <SelectItem key={w.record_id} value={w.record_id}>
                      {getWorkoutLabel(w)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Uebung Select */}
            <div className="space-y-2">
              <Label htmlFor="form-uebung">Übung</Label>
              <Select
                value={form.uebung || undefined}
                onValueChange={(val) => setForm((prev) => ({ ...prev, uebung: val }))}
              >
                <SelectTrigger id="form-uebung">
                  <SelectValue placeholder="Übung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {sortedUebungen.map((u) => (
                    <SelectItem key={u.record_id} value={u.record_id}>
                      {u.fields.name ?? 'Unbenannte Übung'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Satz Nummer */}
            <div className="space-y-2">
              <Label htmlFor="form-satz">Satz-Nummer</Label>
              <Input
                id="form-satz"
                type="number"
                min={1}
                placeholder="z.B. 1"
                value={form.satz_nummer}
                onChange={(e) => setForm((prev) => ({ ...prev, satz_nummer: e.target.value }))}
              />
            </div>

            {/* Gewicht */}
            <div className="space-y-2">
              <Label htmlFor="form-gewicht">Gewicht (kg)</Label>
              <Input
                id="form-gewicht"
                type="number"
                min={0}
                step={0.5}
                placeholder="z.B. 80"
                value={form.gewicht}
                onChange={(e) => setForm((prev) => ({ ...prev, gewicht: e.target.value }))}
              />
            </div>

            {/* Wiederholungen */}
            <div className="space-y-2">
              <Label htmlFor="form-wdh">Wiederholungen</Label>
              <Input
                id="form-wdh"
                type="number"
                min={0}
                placeholder="z.B. 10"
                value={form.wiederholungen}
                onChange={(e) => setForm((prev) => ({ ...prev, wiederholungen: e.target.value }))}
              />
            </div>

            {/* RPE */}
            <div className="space-y-2">
              <Label htmlFor="form-rpe">RPE</Label>
              <Select
                value={form.rpe || undefined}
                onValueChange={(val) => setForm((prev) => ({ ...prev, rpe: val }))}
              >
                <SelectTrigger id="form-rpe">
                  <SelectValue placeholder="RPE auswählen (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {RPE_VALUES.map((rpe) => (
                    <SelectItem key={rpe} value={rpe}>
                      {RPE_LABELS[rpe]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Speichert...' : editingLog ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recordName={deletingLog ? getDeleteRecordName(deletingLog) : ''}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
