import { useState, useEffect, useCallback } from 'react'
import type { Ziele } from '@/types/app'
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
import { Plus, Pencil, Trash2, Target } from 'lucide-react'
import { formatDistance, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

type ZieleFields = Ziele['fields']

const STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv',
  erreicht: 'Erreicht',
  verworfen: 'Verworfen',
}

const EMPTY_FORM: ZieleFields = {
  taeglich_kalorien: undefined,
  taeglich_protein: undefined,
  trainingstage_pro_woche: undefined,
  schlaf_ziel_stunden: undefined,
  status: 'aktiv',
  notizen: undefined,
}

export function ZielePage() {
  const [ziele, setZiele] = useState<Ziele[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingZiel, setEditingZiel] = useState<Ziele | null>(null)
  const [formData, setFormData] = useState<ZieleFields>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Ziele | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await LivingAppsService.getZiele()
      setZiele(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Ziele'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const sortedZiele = [...ziele].sort((a, b) => {
    const statusOrder: Record<string, number> = { aktiv: 0, erreicht: 1, verworfen: 2 }
    const aOrder = statusOrder[a.fields.status ?? 'verworfen'] ?? 2
    const bOrder = statusOrder[b.fields.status ?? 'verworfen'] ?? 2
    if (aOrder !== bOrder) return aOrder - bOrder
    return (b.createdat ?? '').localeCompare(a.createdat ?? '')
  })

  function openCreate() {
    setEditingZiel(null)
    setFormData({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEdit(ziel: Ziele) {
    setEditingZiel(ziel)
    setFormData({
      taeglich_kalorien: ziel.fields.taeglich_kalorien,
      taeglich_protein: ziel.fields.taeglich_protein,
      trainingstage_pro_woche: ziel.fields.trainingstage_pro_woche,
      schlaf_ziel_stunden: ziel.fields.schlaf_ziel_stunden,
      status: ziel.fields.status ?? 'aktiv',
      notizen: ziel.fields.notizen,
    })
    setDialogOpen(true)
  }

  function openDelete(ziel: Ziele) {
    setDeleteTarget(ziel)
    setDeleteDialogOpen(true)
  }

  function handleNumberChange(field: keyof ZieleFields, value: string) {
    const parsed = value === '' ? undefined : Number(value)
    setFormData(prev => ({ ...prev, [field]: parsed }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fields: ZieleFields = { ...formData }
      // Clean up undefined number fields - don't send NaN
      if (fields.taeglich_kalorien !== undefined && isNaN(fields.taeglich_kalorien)) {
        fields.taeglich_kalorien = undefined
      }
      if (fields.taeglich_protein !== undefined && isNaN(fields.taeglich_protein)) {
        fields.taeglich_protein = undefined
      }
      if (fields.trainingstage_pro_woche !== undefined && isNaN(fields.trainingstage_pro_woche)) {
        fields.trainingstage_pro_woche = undefined
      }
      if (fields.schlaf_ziel_stunden !== undefined && isNaN(fields.schlaf_ziel_stunden)) {
        fields.schlaf_ziel_stunden = undefined
      }

      if (editingZiel) {
        await LivingAppsService.updateZieleEntry(editingZiel.record_id, fields)
        toast.success('Ziel erfolgreich aktualisiert')
      } else {
        await LivingAppsService.createZieleEntry(fields)
        toast.success('Ziel erfolgreich erstellt')
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(editingZiel ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await LivingAppsService.deleteZieleEntry(deleteTarget.record_id)
      toast.success('Ziel erfolgreich gelöscht')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      toast.error('Fehler beim Löschen', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
      throw err // re-throw so DeleteConfirmDialog knows it failed
    }
  }

  function getStatusBadgeVariant(status?: string): 'default' | 'secondary' | 'outline' {
    switch (status) {
      case 'aktiv':
        return 'default'
      case 'erreicht':
        return 'secondary'
      case 'verworfen':
        return 'outline'
      default:
        return 'outline'
    }
  }

  function getCardBorderStyle(status?: string): React.CSSProperties {
    switch (status) {
      case 'aktiv':
        return { borderLeft: '4px solid hsl(174 62% 38%)' }
      case 'erreicht':
        return { borderLeft: '4px solid hsl(152 55% 42%)' }
      case 'verworfen':
        return {}
      default:
        return {}
    }
  }

  function getDeleteRecordName(ziel: Ziele): string {
    const parts: string[] = []
    if (ziel.fields.taeglich_kalorien) parts.push(`${ziel.fields.taeglich_kalorien} kcal`)
    if (ziel.fields.taeglich_protein) parts.push(`${ziel.fields.taeglich_protein}g Protein`)
    if (parts.length > 0) return `Ziel (${parts.join(', ')})`
    return 'Ziel'
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Ziele</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium mb-2">Fehler beim Laden der Ziele</p>
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
        <h1 className="text-xl font-semibold">Ziele</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Ziel
        </Button>
      </div>

      {/* Empty state */}
      {sortedZiele.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">Noch keine Ziele</p>
            <p className="text-sm text-muted-foreground mb-4">
              Erstelle dein erstes Ziel, um deinen Fortschritt zu verfolgen.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Ziel erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card list */}
      <div className="space-y-4">
        {sortedZiele.map(ziel => {
          const status = ziel.fields.status
          const isVerworfen = status === 'verworfen'

          return (
            <Card
              key={ziel.record_id}
              style={getCardBorderStyle(status)}
              className={isVerworfen ? 'opacity-60' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadgeVariant(status)}>
                    {STATUS_LABELS[status ?? ''] ?? 'Unbekannt'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(ziel)}
                      aria-label="Bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(ziel)}
                      aria-label="Löschen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {ziel.fields.taeglich_kalorien !== undefined && ziel.fields.taeglich_kalorien !== null && (
                    <div>
                      <span className="text-muted-foreground">Tägliche Kalorien: </span>
                      <span className="font-medium">{ziel.fields.taeglich_kalorien} kcal</span>
                    </div>
                  )}
                  {ziel.fields.taeglich_protein !== undefined && ziel.fields.taeglich_protein !== null && (
                    <div>
                      <span className="text-muted-foreground">Tägliches Protein: </span>
                      <span className="font-medium">{ziel.fields.taeglich_protein} g</span>
                    </div>
                  )}
                  {ziel.fields.trainingstage_pro_woche !== undefined && ziel.fields.trainingstage_pro_woche !== null && (
                    <div>
                      <span className="text-muted-foreground">Trainingstage/Woche: </span>
                      <span className="font-medium">{ziel.fields.trainingstage_pro_woche}</span>
                    </div>
                  )}
                  {ziel.fields.schlaf_ziel_stunden !== undefined && ziel.fields.schlaf_ziel_stunden !== null && (
                    <div>
                      <span className="text-muted-foreground">Schlafziel: </span>
                      <span className="font-medium">{ziel.fields.schlaf_ziel_stunden} Stunden</span>
                    </div>
                  )}
                </div>

                {ziel.fields.notizen && (
                  <p className="text-sm italic text-muted-foreground mt-2">
                    {ziel.fields.notizen}
                  </p>
                )}

                <p className="text-xs text-muted-foreground pt-1">
                  Erstellt {formatDistance(parseISO(ziel.createdat), new Date(), {
                    addSuffix: true,
                    locale: de,
                  })}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingZiel ? 'Ziel bearbeiten' : 'Neues Ziel erstellen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taeglich_kalorien">Tägliche Kalorien (kcal)</Label>
              <Input
                id="taeglich_kalorien"
                type="number"
                placeholder="z.B. 2000"
                value={formData.taeglich_kalorien ?? ''}
                onChange={e => handleNumberChange('taeglich_kalorien', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taeglich_protein">Tägliches Protein (g)</Label>
              <Input
                id="taeglich_protein"
                type="number"
                placeholder="z.B. 150"
                value={formData.taeglich_protein ?? ''}
                onChange={e => handleNumberChange('taeglich_protein', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingstage_pro_woche">Trainingstage pro Woche</Label>
              <Input
                id="trainingstage_pro_woche"
                type="number"
                placeholder="z.B. 4"
                min={0}
                max={7}
                value={formData.trainingstage_pro_woche ?? ''}
                onChange={e => handleNumberChange('trainingstage_pro_woche', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schlaf_ziel_stunden">Schlafziel (Stunden)</Label>
              <Input
                id="schlaf_ziel_stunden"
                type="number"
                placeholder="z.B. 8"
                min={0}
                max={24}
                value={formData.schlaf_ziel_stunden ?? ''}
                onChange={e => handleNumberChange('schlaf_ziel_stunden', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ?? 'aktiv'}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    status: value as 'aktiv' | 'erreicht' | 'verworfen',
                  }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="erreicht">Erreicht</SelectItem>
                  <SelectItem value="verworfen">Verworfen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notizen">Notizen</Label>
              <Textarea
                id="notizen"
                placeholder="Optionale Notizen zum Ziel..."
                rows={3}
                value={formData.notizen ?? ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notizen: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? (editingZiel ? 'Speichert...' : 'Erstellt...')
                : (editingZiel ? 'Speichern' : 'Erstellen')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recordName={deleteTarget ? getDeleteRecordName(deleteTarget) : ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}
