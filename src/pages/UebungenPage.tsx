import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from 'sonner'
import { LivingAppsService } from '@/services/livingAppsService'
import type { Uebungen } from '@/types/app'

// --- Label Lookup Maps ---

const muskelgruppeLabels: Record<NonNullable<Uebungen['fields']['muskelgruppe']>, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  beine: 'Beine',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  bauch: 'Bauch',
  ganzkoerper: 'Ganzkörper',
}

const equipmentLabels: Record<NonNullable<Uebungen['fields']['equipment']>, string> = {
  langhantel: 'Langhantel',
  kurzhantel: 'Kurzhantel',
  maschine: 'Maschine',
  kabelzug: 'Kabelzug',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band',
  sonstiges: 'Sonstiges',
}

const schwierigkeitsgradLabels: Record<NonNullable<Uebungen['fields']['schwierigkeitsgrad']>, string> = {
  anfaenger: 'Anfänger',
  fortgeschritten: 'Fortgeschritten',
  experte: 'Experte',
}

// --- Types for form state ---

type MuskelgruppeKey = NonNullable<Uebungen['fields']['muskelgruppe']>
type EquipmentKey = NonNullable<Uebungen['fields']['equipment']>
type SchwierigkeitsgradKey = NonNullable<Uebungen['fields']['schwierigkeitsgrad']>

interface FormState {
  name: string
  muskelgruppe: MuskelgruppeKey | undefined
  equipment: EquipmentKey | undefined
  schwierigkeitsgrad: SchwierigkeitsgradKey | undefined
}

const emptyForm: FormState = {
  name: '',
  muskelgruppe: undefined,
  equipment: undefined,
  schwierigkeitsgrad: undefined,
}

// --- Component ---

export function UebungenPage() {
  const [uebungen, setUebungen] = useState<Uebungen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Filter
  const [filterMuskelgruppe, setFilterMuskelgruppe] = useState<string>('alle')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Uebungen | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Uebungen | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // --- Data Loading ---

  const loadData = useCallback(async () => {
    try {
      const data = await LivingAppsService.getUebungen()
      setUebungen(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Übungen'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Filtered & Sorted Data ---

  const filteredUebungen = useMemo(() => {
    let result = [...uebungen]

    if (filterMuskelgruppe !== 'alle') {
      result = result.filter(u => u.fields.muskelgruppe === filterMuskelgruppe)
    }

    result.sort((a, b) => {
      const nameA = (a.fields.name ?? '').toLowerCase()
      const nameB = (b.fields.name ?? '').toLowerCase()
      return nameA.localeCompare(nameB, 'de')
    })

    return result
  }, [uebungen, filterMuskelgruppe])

  // --- Dialog Handlers ---

  function openCreateDialog() {
    setEditingRecord(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(record: Uebungen) {
    setEditingRecord(record)
    setForm({
      name: record.fields.name ?? '',
      muskelgruppe: record.fields.muskelgruppe,
      equipment: record.fields.equipment,
      schwierigkeitsgrad: record.fields.schwierigkeitsgrad,
    })
    setDialogOpen(true)
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setDialogOpen(false)
      setEditingRecord(null)
      setForm(emptyForm)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Bitte gib einen Namen ein.')
      return
    }

    setSaving(true)
    try {
      const fields: Uebungen['fields'] = {
        name: form.name.trim(),
        muskelgruppe: form.muskelgruppe,
        equipment: form.equipment,
        schwierigkeitsgrad: form.schwierigkeitsgrad,
      }

      if (editingRecord) {
        await LivingAppsService.updateUebungenEntry(editingRecord.record_id, fields)
        toast.success('Übung erfolgreich aktualisiert.')
      } else {
        await LivingAppsService.createUebungenEntry(fields)
        toast.success('Übung erfolgreich erstellt.')
      }

      setDialogOpen(false)
      setEditingRecord(null)
      setForm(emptyForm)
      await loadData()
    } catch {
      toast.error('Fehler beim Speichern der Übung.')
    } finally {
      setSaving(false)
    }
  }

  // --- Delete Handlers ---

  function openDeleteDialog(record: Uebungen) {
    setDeleteTarget(record)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await LivingAppsService.deleteUebungenEntry(deleteTarget.record_id)
      toast.success('Übung erfolgreich gelöscht.')
      setDeleteTarget(null)
      await loadData()
    } catch {
      toast.error('Fehler beim Löschen der Übung.')
      throw new Error('Delete failed')
    }
  }

  // --- Loading State ---

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // --- Error State ---

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-2">Fehler beim Laden der Übungen</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => { setLoading(true); loadData() }}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  // --- Main Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Übungen</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Übung
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="filter-muskelgruppe" className="text-sm text-muted-foreground whitespace-nowrap">
          Muskelgruppe:
        </Label>
        <Select value={filterMuskelgruppe} onValueChange={setFilterMuskelgruppe}>
          <SelectTrigger id="filter-muskelgruppe" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Muskelgruppen</SelectItem>
            {(Object.entries(muskelgruppeLabels) as [MuskelgruppeKey, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredUebungen.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {filterMuskelgruppe !== 'alle'
                ? 'Keine Übungen für diese Muskelgruppe gefunden.'
                : 'Noch keine Übungen vorhanden. Erstelle deine erste Übung!'}
            </p>
            {filterMuskelgruppe !== 'alle' && (
              <Button variant="outline" onClick={() => setFilterMuskelgruppe('alle')}>
                Filter zurücksetzen
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card Grid */}
      {filteredUebungen.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUebungen.map(uebung => (
            <Card key={uebung.record_id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Name */}
                    <p className="font-semibold text-base truncate">
                      {uebung.fields.name ?? 'Ohne Name'}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {uebung.fields.muskelgruppe && (
                        <Badge variant="default">
                          {muskelgruppeLabels[uebung.fields.muskelgruppe]}
                        </Badge>
                      )}
                      {uebung.fields.equipment && (
                        <Badge variant="secondary">
                          {equipmentLabels[uebung.fields.equipment]}
                        </Badge>
                      )}
                      {uebung.fields.schwierigkeitsgrad && (
                        <Badge variant="outline">
                          {schwierigkeitsgradLabels[uebung.fields.schwierigkeitsgrad]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(uebung)}
                      aria-label="Übung bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(uebung)}
                      aria-label="Übung löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Übung bearbeiten' : 'Neue Übung erstellen'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'Passe die Details der Übung an.'
                : 'Erstelle eine neue Übung für dein Training.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="uebung-name">Name *</Label>
              <Input
                id="uebung-name"
                placeholder="z.B. Bankdrücken"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Muskelgruppe */}
            <div className="space-y-2">
              <Label htmlFor="uebung-muskelgruppe">Muskelgruppe</Label>
              <Select
                value={form.muskelgruppe ?? 'keine_auswahl'}
                onValueChange={v => setForm(prev => ({
                  ...prev,
                  muskelgruppe: v === 'keine_auswahl' ? undefined : v as MuskelgruppeKey,
                }))}
              >
                <SelectTrigger id="uebung-muskelgruppe" className="w-full">
                  <SelectValue placeholder="Muskelgruppe wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keine_auswahl">Keine Auswahl</SelectItem>
                  {(Object.entries(muskelgruppeLabels) as [MuskelgruppeKey, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label htmlFor="uebung-equipment">Equipment</Label>
              <Select
                value={form.equipment ?? 'keine_auswahl'}
                onValueChange={v => setForm(prev => ({
                  ...prev,
                  equipment: v === 'keine_auswahl' ? undefined : v as EquipmentKey,
                }))}
              >
                <SelectTrigger id="uebung-equipment" className="w-full">
                  <SelectValue placeholder="Equipment wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keine_auswahl">Keine Auswahl</SelectItem>
                  {(Object.entries(equipmentLabels) as [EquipmentKey, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schwierigkeitsgrad */}
            <div className="space-y-2">
              <Label htmlFor="uebung-schwierigkeitsgrad">Schwierigkeitsgrad</Label>
              <Select
                value={form.schwierigkeitsgrad ?? 'keine_auswahl'}
                onValueChange={v => setForm(prev => ({
                  ...prev,
                  schwierigkeitsgrad: v === 'keine_auswahl' ? undefined : v as SchwierigkeitsgradKey,
                }))}
              >
                <SelectTrigger id="uebung-schwierigkeitsgrad" className="w-full">
                  <SelectValue placeholder="Schwierigkeitsgrad wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keine_auswahl">Keine Auswahl</SelectItem>
                  {(Object.entries(schwierigkeitsgradLabels) as [SchwierigkeitsgradKey, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Speichert...' : (editingRecord ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recordName={deleteTarget?.fields.name ?? 'Unbenannte Übung'}
        onConfirm={handleDelete}
      />
    </div>
  )
}
