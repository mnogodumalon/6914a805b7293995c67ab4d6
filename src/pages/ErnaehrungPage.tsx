import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, Pencil, Trash2, Utensils } from 'lucide-react'
import type { Ernaehrung } from '@/types/app'
import { LivingAppsService } from '@/services/livingAppsService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from 'sonner'

const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
}

const MAHLZEIT_OPTIONS = Object.entries(MAHLZEIT_LABELS) as [string, string][]

type MahlzeitTyp = Ernaehrung['fields']['mahlzeit_typ']

interface FormState {
  datum: string
  mahlzeit_typ: MahlzeitTyp | undefined
  beschreibung: string
  kalorien: string
  protein: string
  carbs: string
  fett: string
}

const EMPTY_FORM: FormState = {
  datum: format(new Date(), 'yyyy-MM-dd'),
  mahlzeit_typ: undefined,
  beschreibung: '',
  kalorien: '',
  protein: '',
  carbs: '',
  fett: '',
}

export function ErnaehrungPage() {
  const [entries, setEntries] = useState<Ernaehrung[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Ernaehrung | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<Ernaehrung | null>(null)

  // Filter state
  const [filterTyp, setFilterTyp] = useState<string>('alle')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const data = await LivingAppsService.getErnaehrung()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (filterTyp === 'alle') return entries
    return entries.filter((e) => e.fields.mahlzeit_typ === filterTyp)
  }, [entries, filterTyp])

  // Group by date, sorted newest first
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Ernaehrung[]> = {}
    for (const entry of filteredEntries) {
      const dateKey = entry.fields.datum ?? 'unbekannt'
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    }

    // Sort dates descending (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

    return sortedKeys.map((dateKey) => ({
      dateKey,
      meals: groups[dateKey],
      totals: {
        kalorien: groups[dateKey].reduce((sum, e) => sum + (e.fields.kalorien ?? 0), 0),
        protein: groups[dateKey].reduce((sum, e) => sum + (e.fields.protein ?? 0), 0),
        carbs: groups[dateKey].reduce((sum, e) => sum + (e.fields.carbs ?? 0), 0),
        fett: groups[dateKey].reduce((sum, e) => sum + (e.fields.fett ?? 0), 0),
      },
    }))
  }, [filteredEntries])

  function openCreateDialog() {
    setEditingEntry(null)
    setForm({ ...EMPTY_FORM, datum: format(new Date(), 'yyyy-MM-dd') })
    setDialogOpen(true)
  }

  function openEditDialog(entry: Ernaehrung) {
    setEditingEntry(entry)
    setForm({
      datum: entry.fields.datum ?? format(new Date(), 'yyyy-MM-dd'),
      mahlzeit_typ: entry.fields.mahlzeit_typ,
      beschreibung: entry.fields.beschreibung ?? '',
      kalorien: entry.fields.kalorien != null ? String(entry.fields.kalorien) : '',
      protein: entry.fields.protein != null ? String(entry.fields.protein) : '',
      carbs: entry.fields.carbs != null ? String(entry.fields.carbs) : '',
      fett: entry.fields.fett != null ? String(entry.fields.fett) : '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fields: Ernaehrung['fields'] = {
        datum: form.datum || undefined,
        mahlzeit_typ: form.mahlzeit_typ,
        beschreibung: form.beschreibung || undefined,
        kalorien: form.kalorien ? Number(form.kalorien) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fett: form.fett ? Number(form.fett) : undefined,
      }

      if (editingEntry) {
        await LivingAppsService.updateErnaehrungEntry(editingEntry.record_id, fields)
        toast.success('Mahlzeit aktualisiert')
      } else {
        await LivingAppsService.createErnaehrungEntry(fields)
        toast.success('Mahlzeit erfasst')
      }

      setDialogOpen(false)
      setEditingEntry(null)
      await loadData()
    } catch (err) {
      toast.error(
        editingEntry
          ? 'Fehler beim Aktualisieren der Mahlzeit'
          : 'Fehler beim Erfassen der Mahlzeit'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteEntry) return
    try {
      await LivingAppsService.deleteErnaehrungEntry(deleteEntry.record_id)
      toast.success('Mahlzeit gelöscht')
      setDeleteEntry(null)
      await loadData()
    } catch {
      toast.error('Fehler beim Löschen der Mahlzeit')
      throw new Error('Delete failed')
    }
  }

  function formatDateHeader(dateKey: string): string {
    if (dateKey === 'unbekannt') return 'Ohne Datum'
    try {
      return format(parseISO(dateKey), 'dd.MM.yyyy', { locale: de })
    } catch {
      return dateKey
    }
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Ernährung</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium mb-2">Fehler beim Laden der Daten</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" onClick={() => { setLoading(true); loadData() }}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ernährung</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Mahlzeit erfassen
        </Button>
      </div>

      {/* Filter by Mahlzeit-Typ */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtern nach:</Label>
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alle Mahlzeiten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Mahlzeiten</SelectItem>
            {MAHLZEIT_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {groupedByDate.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Utensils className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium mb-1">
              {filterTyp === 'alle'
                ? 'Noch keine Mahlzeiten erfasst'
                : `Keine Einträge für "${MAHLZEIT_LABELS[filterTyp]}" gefunden`}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Erfasse deine erste Mahlzeit, um deine Ernährung zu tracken.
            </p>
            {filterTyp === 'alle' && (
              <Button variant="outline" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Mahlzeit erfassen
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped meals by date */}
      {groupedByDate.map((group) => (
        <div key={group.dateKey} className="space-y-3">
          {/* Date group header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {formatDateHeader(group.dateKey)}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{group.totals.kalorien} kcal</span>
              <span className="text-border">|</span>
              <span>{Math.round(group.totals.protein)}g Protein</span>
            </div>
          </div>

          {/* Meal cards */}
          {group.meals.map((entry) => (
            <Card key={entry.record_id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {entry.fields.mahlzeit_typ && (
                        <Badge variant="secondary">
                          {MAHLZEIT_LABELS[entry.fields.mahlzeit_typ] ?? entry.fields.mahlzeit_typ}
                        </Badge>
                      )}
                    </div>
                    {entry.fields.beschreibung && (
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        {entry.fields.beschreibung}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {entry.fields.kalorien != null && (
                        <span>{entry.fields.kalorien} kcal</span>
                      )}
                      {entry.fields.protein != null && (
                        <span>{entry.fields.protein}g P</span>
                      )}
                      {entry.fields.carbs != null && (
                        <span>{entry.fields.carbs}g K</span>
                      )}
                      {entry.fields.fett != null && (
                        <span>{entry.fields.fett}g F</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(entry)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Mahlzeit bearbeiten' : 'Neue Mahlzeit erfassen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Datum */}
            <div className="space-y-2">
              <Label htmlFor="ernaehrung-datum">Datum</Label>
              <Input
                id="ernaehrung-datum"
                type="date"
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </div>

            {/* Mahlzeit Typ */}
            <div className="space-y-2">
              <Label>Mahlzeit-Typ</Label>
              <Select
                value={form.mahlzeit_typ ?? 'nicht_gewaehlt'}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    mahlzeit_typ: val === 'nicht_gewaehlt' ? undefined : (val as MahlzeitTyp),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nicht_gewaehlt">-- Typ auswählen --</SelectItem>
                  {MAHLZEIT_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beschreibung */}
            <div className="space-y-2">
              <Label htmlFor="ernaehrung-beschreibung">Beschreibung</Label>
              <Textarea
                id="ernaehrung-beschreibung"
                placeholder="z.B. Haferflocken mit Banane und Proteinpulver"
                value={form.beschreibung}
                onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ernaehrung-kalorien">Kalorien (kcal)</Label>
                <Input
                  id="ernaehrung-kalorien"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.kalorien}
                  onChange={(e) => setForm((f) => ({ ...f, kalorien: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ernaehrung-protein">Protein (g)</Label>
                <Input
                  id="ernaehrung-protein"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.protein}
                  onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ernaehrung-carbs">Kohlenhydrate (g)</Label>
                <Input
                  id="ernaehrung-carbs"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.carbs}
                  onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ernaehrung-fett">Fett (g)</Label>
                <Input
                  id="ernaehrung-fett"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.fett}
                  onChange={(e) => setForm((f) => ({ ...f, fett: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? editingEntry
                  ? 'Speichert...'
                  : 'Erfasst...'
                : editingEntry
                  ? 'Speichern'
                  : 'Erfassen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteEntry !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteEntry(null)
        }}
        recordName={deleteEntry?.fields.beschreibung ?? 'Mahlzeit'}
        onConfirm={handleDelete}
      />
    </div>
  )
}
