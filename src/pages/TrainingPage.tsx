import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, Pencil, Trash2, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

import type { Workouts } from '@/types/app'
import { LivingAppsService } from '@/services/livingAppsService'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

// --- Lookup Maps ---

const TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
}

const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal',
}

const TYP_OPTIONS = Object.entries(TYP_LABELS) as Array<[string, string]>
const STIMMUNG_OPTIONS = Object.entries(STIMMUNG_LABELS) as Array<[string, string]>

type TypKey = Workouts['fields']['typ']
type StimmungKey = Workouts['fields']['stimmung']

// --- Badge color helpers ---

function getTypVariant(typ: string | undefined): 'default' | 'secondary' | 'outline' {
  if (!typ) return 'outline'
  if (typ === 'cardio') return 'secondary'
  if (['push', 'pull', 'beine'].includes(typ)) return 'default'
  return 'outline'
}

function getStimmungVariant(stimmung: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (stimmung) {
    case 'brutal': return 'default'
    case 'gut': return 'secondary'
    case 'schlecht': return 'destructive'
    default: return 'outline'
  }
}

// --- Form State ---

interface WorkoutFormState {
  datum: string
  typ: string
  dauer_minuten: string
  stimmung: string
  rest_day: boolean
}

function getDefaultFormState(): WorkoutFormState {
  return {
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'none',
    dauer_minuten: '',
    stimmung: 'none',
    rest_day: false,
  }
}

function formStateFromRecord(record: Workouts): WorkoutFormState {
  return {
    datum: record.fields.datum ?? format(new Date(), 'yyyy-MM-dd'),
    typ: record.fields.typ ?? 'none',
    dauer_minuten: record.fields.dauer_minuten != null ? String(record.fields.dauer_minuten) : '',
    stimmung: record.fields.stimmung ?? 'none',
    rest_day: record.fields.rest_day ?? false,
  }
}

function formStateToFields(form: WorkoutFormState): Workouts['fields'] {
  const fields: Workouts['fields'] = {}

  if (form.datum) {
    fields.datum = form.datum
  }
  if (form.typ !== 'none') {
    fields.typ = form.typ as TypKey
  }
  if (form.dauer_minuten !== '') {
    const parsed = parseInt(form.dauer_minuten, 10)
    if (!isNaN(parsed) && parsed > 0) {
      fields.dauer_minuten = parsed
    }
  }
  if (form.stimmung !== 'none') {
    fields.stimmung = form.stimmung as StimmungKey
  }
  fields.rest_day = form.rest_day

  return fields
}

// --- Main Component ---

export function TrainingPage() {
  const navigate = useNavigate()

  // Data state
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Filter state
  const [filterTyp, setFilterTyp] = useState<string>('alle')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Workouts | null>(null)
  const [form, setForm] = useState<WorkoutFormState>(getDefaultFormState)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<Workouts | null>(null)

  // --- Data Loading ---

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await LivingAppsService.getWorkouts()
      setWorkouts(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Workouts'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Sorted & Filtered Data ---

  const sortedWorkouts = useMemo(() => {
    let filtered = [...workouts]

    if (filterTyp !== 'alle') {
      filtered = filtered.filter(w => w.fields.typ === filterTyp)
    }

    filtered.sort((a, b) => {
      const dateA = a.fields.datum ?? ''
      const dateB = b.fields.datum ?? ''
      return dateB.localeCompare(dateA)
    })

    return filtered
  }, [workouts, filterTyp])

  // --- Dialog Handlers ---

  function openCreateDialog() {
    setEditingRecord(null)
    setForm(getDefaultFormState())
    setDialogOpen(true)
  }

  function openEditDialog(record: Workouts) {
    setEditingRecord(record)
    setForm(formStateFromRecord(record))
    setDialogOpen(true)
  }

  function openDeleteDialog(record: Workouts) {
    setDeletingRecord(record)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const fields = formStateToFields(form)

      if (editingRecord) {
        await LivingAppsService.updateWorkout(editingRecord.record_id, fields)
        toast.success('Workout erfolgreich aktualisiert')
      } else {
        await LivingAppsService.createWorkout(fields)
        toast.success('Workout erfolgreich erstellt')
      }

      setDialogOpen(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      toast.error(editingRecord ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen', {
        description: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingRecord) return
    try {
      await LivingAppsService.deleteWorkout(deletingRecord.record_id)
      toast.success('Workout erfolgreich gelöscht')
      setDeleteDialogOpen(false)
      setDeletingRecord(null)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      toast.error('Fehler beim Löschen', { description: message })
      throw err // re-throw so DeleteConfirmDialog stays open
    }
  }

  // --- Format Helpers ---

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Kein Datum'
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de })
    } catch {
      return dateStr
    }
  }

  function getRecordName(record: Workouts): string {
    const typ = record.fields.typ ? TYP_LABELS[record.fields.typ] ?? record.fields.typ : 'Workout'
    const datum = formatDate(record.fields.datum)
    return `${typ} (${datum})`
  }

  // --- Loading State ---

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-9 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Workouts</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium mb-2">Fehler beim Laden der Workouts</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" onClick={loadData}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Main Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Workouts</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Workout
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="filter-typ" className="text-sm text-muted-foreground whitespace-nowrap">
          Filtern nach Typ:
        </Label>
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger id="filter-typ" className="w-48">
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Typen</SelectItem>
            {TYP_OPTIONS.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Workout Cards */}
      {sortedWorkouts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium mb-1">Keine Workouts gefunden</p>
            <p className="text-sm text-muted-foreground">
              {filterTyp !== 'alle'
                ? 'Versuche einen anderen Filter oder erstelle ein neues Workout.'
                : 'Erstelle dein erstes Workout, um loszulegen!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedWorkouts.map(workout => (
            <Card key={workout.record_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {formatDate(workout.fields.datum)}
                      </span>
                      {workout.fields.typ && (
                        <Badge variant={getTypVariant(workout.fields.typ)}>
                          {TYP_LABELS[workout.fields.typ] ?? workout.fields.typ}
                        </Badge>
                      )}
                      {workout.fields.rest_day && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Ruhetag
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {workout.fields.dauer_minuten != null && (
                        <span>{workout.fields.dauer_minuten} Min</span>
                      )}
                      {workout.fields.stimmung && (
                        <Badge variant={getStimmungVariant(workout.fields.stimmung)}>
                          {STIMMUNG_LABELS[workout.fields.stimmung] ?? workout.fields.stimmung}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(workout)}
                      aria-label="Workout bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(workout)}
                      aria-label="Workout löschen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <Button variant="link" className="px-0" onClick={() => navigate('/workout-logs')}>
          Workout-Logs
        </Button>
        <Button variant="link" className="px-0" onClick={() => navigate('/uebungen')}>
          Übungen
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Workout bearbeiten' : 'Neues Workout'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'Ändere die Details deines Workouts.'
                : 'Erstelle ein neues Workout mit den folgenden Angaben.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Datum */}
            <div className="space-y-2">
              <Label htmlFor="form-datum">Datum</Label>
              <Input
                id="form-datum"
                type="date"
                value={form.datum}
                onChange={e => setForm(prev => ({ ...prev, datum: e.target.value }))}
              />
            </div>

            {/* Typ */}
            <div className="space-y-2">
              <Label htmlFor="form-typ">Typ</Label>
              <Select
                value={form.typ}
                onValueChange={value => setForm(prev => ({ ...prev, typ: value }))}
              >
                <SelectTrigger id="form-typ" className="w-full">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Typ</SelectItem>
                  {TYP_OPTIONS.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dauer */}
            <div className="space-y-2">
              <Label htmlFor="form-dauer">Dauer (Minuten)</Label>
              <Input
                id="form-dauer"
                type="number"
                min={0}
                placeholder="z.B. 60"
                value={form.dauer_minuten}
                onChange={e => setForm(prev => ({ ...prev, dauer_minuten: e.target.value }))}
              />
            </div>

            {/* Stimmung */}
            <div className="space-y-2">
              <Label htmlFor="form-stimmung">Stimmung</Label>
              <Select
                value={form.stimmung}
                onValueChange={value => setForm(prev => ({ ...prev, stimmung: value }))}
              >
                <SelectTrigger id="form-stimmung" className="w-full">
                  <SelectValue placeholder="Stimmung wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  {STIMMUNG_OPTIONS.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rest Day */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="form-rest-day"
                checked={form.rest_day}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, rest_day: checked === true }))
                }
              />
              <Label htmlFor="form-rest-day" className="cursor-pointer">
                Ruhetag
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? (editingRecord ? 'Speichert...' : 'Erstellt...')
                : (editingRecord ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recordName={deletingRecord ? getRecordName(deletingRecord) : ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}
