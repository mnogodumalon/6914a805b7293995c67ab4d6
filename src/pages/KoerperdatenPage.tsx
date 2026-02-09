import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Koerperdaten } from '@/types/app'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, Pencil, Trash2, Scale } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type KoerperdatenFields = Koerperdaten['fields']

const emptyFields: KoerperdatenFields = {
  datum: format(new Date(), 'yyyy-MM-dd'),
  gewicht_kg: undefined,
  kfa_geschaetzt: undefined,
  brustumfang: undefined,
  taillenumfang: undefined,
  hueftumfang: undefined,
  armumfang: undefined,
  beinumfang: undefined,
  notizen: '',
}

export function KoerperdatenPage() {
  const [data, setData] = useState<Koerperdaten[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Koerperdaten | null>(null)
  const [formFields, setFormFields] = useState<KoerperdatenFields>({ ...emptyFields })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<Koerperdaten | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const result = await LivingAppsService.getKoerperdaten()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sorted ascending by datum for chart
  const sortedAsc = useMemo(
    () =>
      [...data]
        .filter((d) => d.fields.datum && d.fields.gewicht_kg != null)
        .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? '')),
    [data]
  )

  // Sorted descending by datum for card list
  const sortedDesc = useMemo(
    () =>
      [...data]
        .filter((d) => d.fields.datum)
        .sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')),
    [data]
  )

  // Build a map of datum -> previous measurement's weight (sorted asc)
  const weightChangeMap = useMemo(() => {
    const map = new Map<string, number | null>()
    const allSortedAsc = [...data]
      .filter((d) => d.fields.datum && d.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''))

    for (let i = 0; i < allSortedAsc.length; i++) {
      const current = allSortedAsc[i]
      const prev = i > 0 ? allSortedAsc[i - 1] : null
      if (current.fields.gewicht_kg != null && prev?.fields.gewicht_kg != null) {
        const diff = current.fields.gewicht_kg - prev.fields.gewicht_kg
        map.set(current.record_id, Math.round(diff * 10) / 10)
      } else {
        map.set(current.record_id, null)
      }
    }
    return map
  }, [data])

  // Chart data
  const chartData = useMemo(
    () =>
      sortedAsc.map((entry) => ({
        datum: format(parseISO(entry.fields.datum!), 'dd.MM'),
        gewicht: entry.fields.gewicht_kg,
      })),
    [sortedAsc]
  )

  // Open create dialog
  function handleCreate() {
    setEditingEntry(null)
    setFormFields({
      ...emptyFields,
      datum: format(new Date(), 'yyyy-MM-dd'),
    })
    setDialogOpen(true)
  }

  // Open edit dialog
  function handleEdit(entry: Koerperdaten) {
    setEditingEntry(entry)
    setFormFields({
      datum: entry.fields.datum ?? format(new Date(), 'yyyy-MM-dd'),
      gewicht_kg: entry.fields.gewicht_kg,
      kfa_geschaetzt: entry.fields.kfa_geschaetzt,
      brustumfang: entry.fields.brustumfang,
      taillenumfang: entry.fields.taillenumfang,
      hueftumfang: entry.fields.hueftumfang,
      armumfang: entry.fields.armumfang,
      beinumfang: entry.fields.beinumfang,
      notizen: entry.fields.notizen ?? '',
    })
    setDialogOpen(true)
  }

  // Save (create or update)
  async function handleSave() {
    setSaving(true)
    try {
      // Build cleaned fields - only send defined values
      const fields: KoerperdatenFields = {
        datum: formFields.datum,
      }
      if (formFields.gewicht_kg != null && formFields.gewicht_kg !== undefined) {
        fields.gewicht_kg = Number(formFields.gewicht_kg)
      }
      if (formFields.kfa_geschaetzt != null && formFields.kfa_geschaetzt !== undefined) {
        fields.kfa_geschaetzt = Number(formFields.kfa_geschaetzt)
      }
      if (formFields.brustumfang != null && formFields.brustumfang !== undefined) {
        fields.brustumfang = Number(formFields.brustumfang)
      }
      if (formFields.taillenumfang != null && formFields.taillenumfang !== undefined) {
        fields.taillenumfang = Number(formFields.taillenumfang)
      }
      if (formFields.hueftumfang != null && formFields.hueftumfang !== undefined) {
        fields.hueftumfang = Number(formFields.hueftumfang)
      }
      if (formFields.armumfang != null && formFields.armumfang !== undefined) {
        fields.armumfang = Number(formFields.armumfang)
      }
      if (formFields.beinumfang != null && formFields.beinumfang !== undefined) {
        fields.beinumfang = Number(formFields.beinumfang)
      }
      if (formFields.notizen) {
        fields.notizen = formFields.notizen
      }

      if (editingEntry) {
        await LivingAppsService.updateKoerperdatenEntry(editingEntry.record_id, fields)
        toast.success('Messung aktualisiert')
      } else {
        await LivingAppsService.createKoerperdatenEntry(fields)
        toast.success('Messung gespeichert')
      }

      setDialogOpen(false)
      setEditingEntry(null)
      await loadData()
    } catch (err) {
      toast.error(
        editingEntry
          ? 'Fehler beim Aktualisieren der Messung'
          : 'Fehler beim Speichern der Messung'
      )
    } finally {
      setSaving(false)
    }
  }

  // Delete handler
  async function handleDelete() {
    if (!deleteEntry) return
    try {
      await LivingAppsService.deleteKoerperdatenEntry(deleteEntry.record_id)
      toast.success('Messung gelöscht')
      setDeleteEntry(null)
      await loadData()
    } catch {
      toast.error('Fehler beim Löschen der Messung')
    }
  }

  // Number input handler
  function handleNumberChange(field: keyof KoerperdatenFields, value: string) {
    if (value === '') {
      setFormFields((prev) => ({ ...prev, [field]: undefined }))
    } else {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        setFormFields((prev) => ({ ...prev, [field]: num }))
      }
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-2">Fehler beim Laden der Daten</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => { setLoading(true); loadData() }}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Körperdaten</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Messung eintragen
        </Button>
      </div>

      {/* Weight Chart */}
      {chartData.length > 1 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Gewichtsverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="datum"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(220 10% 50%)"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(220 10% 50%)"
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    domain={['auto', 'auto']}
                    unit=" kg"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 100%)',
                      border: '1px solid hsl(35 15% 90%)',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                    formatter={(value: number) => [`${value} kg`, 'Gewicht']}
                  />
                  <Line
                    type="monotone"
                    dataKey="gewicht"
                    stroke="hsl(174 62% 38%)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'hsl(174 62% 38%)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Scale className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {chartData.length === 1
                ? 'Trage mindestens zwei Messungen ein, um den Gewichtsverlauf zu sehen.'
                : 'Noch keine Gewichtsdaten vorhanden. Trage deine erste Messung ein!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Measurement Cards */}
      {sortedDesc.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Keine Messungen vorhanden. Trage deine erste Messung ein!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedDesc.map((entry) => {
            const change = weightChangeMap.get(entry.record_id)
            const umfaenge: Array<{ label: string; value: number | undefined }> = [
              { label: 'Brust', value: entry.fields.brustumfang },
              { label: 'Taille', value: entry.fields.taillenumfang },
              { label: 'Hüfte', value: entry.fields.hueftumfang },
              { label: 'Arm', value: entry.fields.armumfang },
              { label: 'Bein', value: entry.fields.beinumfang },
            ].filter((u) => u.value != null)

            return (
              <Card key={entry.record_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: date + weight */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(entry.fields.datum!), 'dd.MM.yyyy', { locale: de })}
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {entry.fields.gewicht_kg != null && (
                          <span className="text-2xl font-bold">
                            {entry.fields.gewicht_kg} kg
                          </span>
                        )}
                        {change != null && change !== 0 && (
                          <span
                            className={`text-sm font-medium ${
                              change < 0
                                ? 'text-green-600'
                                : 'text-red-500'
                            }`}
                          >
                            {change > 0 ? '+' : ''}
                            {change} kg
                          </span>
                        )}
                      </div>
                      {entry.fields.kfa_geschaetzt != null && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          KFA: {entry.fields.kfa_geschaetzt}%
                        </p>
                      )}
                      {umfaenge.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          {umfaenge.map((u) => (
                            <span
                              key={u.label}
                              className="text-xs text-muted-foreground"
                            >
                              {u.label}: {u.value} cm
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.fields.notizen && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {entry.fields.notizen}
                        </p>
                      )}
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
                        aria-label="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteEntry(entry)}
                        aria-label="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Messung bearbeiten' : 'Neue Messung eintragen'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Datum */}
            <div className="grid gap-2">
              <Label htmlFor="datum">Datum</Label>
              <Input
                id="datum"
                type="date"
                value={formFields.datum ?? ''}
                onChange={(e) =>
                  setFormFields((prev) => ({ ...prev, datum: e.target.value }))
                }
              />
            </div>

            {/* Gewicht */}
            <div className="grid gap-2">
              <Label htmlFor="gewicht_kg">Gewicht (kg)</Label>
              <Input
                id="gewicht_kg"
                type="number"
                step="0.1"
                placeholder="z.B. 80.5"
                value={formFields.gewicht_kg ?? ''}
                onChange={(e) => handleNumberChange('gewicht_kg', e.target.value)}
              />
            </div>

            {/* KFA */}
            <div className="grid gap-2">
              <Label htmlFor="kfa_geschaetzt">Körperfettanteil (%)</Label>
              <Input
                id="kfa_geschaetzt"
                type="number"
                step="0.1"
                placeholder="z.B. 15.0"
                value={formFields.kfa_geschaetzt ?? ''}
                onChange={(e) => handleNumberChange('kfa_geschaetzt', e.target.value)}
              />
            </div>

            {/* Umfänge */}
            <p className="text-sm font-medium text-muted-foreground pt-2">
              Umfänge (cm)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="brustumfang">Brust</Label>
                <Input
                  id="brustumfang"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={formFields.brustumfang ?? ''}
                  onChange={(e) => handleNumberChange('brustumfang', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taillenumfang">Taille</Label>
                <Input
                  id="taillenumfang"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={formFields.taillenumfang ?? ''}
                  onChange={(e) => handleNumberChange('taillenumfang', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hueftumfang">Hüfte</Label>
                <Input
                  id="hueftumfang"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={formFields.hueftumfang ?? ''}
                  onChange={(e) => handleNumberChange('hueftumfang', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="armumfang">Arm</Label>
                <Input
                  id="armumfang"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={formFields.armumfang ?? ''}
                  onChange={(e) => handleNumberChange('armumfang', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beinumfang">Bein</Label>
                <Input
                  id="beinumfang"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={formFields.beinumfang ?? ''}
                  onChange={(e) => handleNumberChange('beinumfang', e.target.value)}
                />
              </div>
            </div>

            {/* Notizen */}
            <div className="grid gap-2">
              <Label htmlFor="notizen">Notizen</Label>
              <Textarea
                id="notizen"
                placeholder="Optionale Notizen..."
                value={formFields.notizen ?? ''}
                onChange={(e) =>
                  setFormFields((prev) => ({ ...prev, notizen: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Speichert...'
                : editingEntry
                  ? 'Aktualisieren'
                  : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteEntry != null}
        onOpenChange={(open) => {
          if (!open) setDeleteEntry(null)
        }}
        recordName={
          deleteEntry?.fields.datum
            ? format(parseISO(deleteEntry.fields.datum), 'dd.MM.yyyy', { locale: de })
            : 'Messung'
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
