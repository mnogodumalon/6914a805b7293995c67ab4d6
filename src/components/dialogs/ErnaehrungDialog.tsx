import { useState, useEffect } from 'react';
import type { Ernaehrung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ErnaehrungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Ernaehrung['fields']) => Promise<void>;
  defaultValues?: Ernaehrung['fields'];
}

export function ErnaehrungDialog({ open, onClose, onSubmit, defaultValues }: ErnaehrungDialogProps) {
  const [fields, setFields] = useState<Partial<Ernaehrung['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Ernaehrung['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Ernährung bearbeiten' : 'Ernährung hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              type="date"
              value={fields.datum ?? ''}
              onChange={e => setFields(f => ({ ...f, datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mahlzeit_typ">Mahlzeitentyp</Label>
            <Select
              value={fields.mahlzeit_typ ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, mahlzeit_typ: v === 'none' ? undefined : v as 'fruehstueck' | 'snack' | 'mittagessen' | 'abendessen' | 'pre_workout' | 'post_workout' | 'sonstiges' }))}
            >
              <SelectTrigger id="mahlzeit_typ"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="fruehstueck">Frühstück</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
                <SelectItem value="mittagessen">Mittagessen</SelectItem>
                <SelectItem value="abendessen">Abendessen</SelectItem>
                <SelectItem value="pre_workout">Pre-Workout</SelectItem>
                <SelectItem value="post_workout">Post-Workout</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={fields.beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kalorien">Kalorien (kcal)</Label>
            <Input
              id="kalorien"
              type="number"
              value={fields.kalorien ?? ''}
              onChange={e => setFields(f => ({ ...f, kalorien: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              value={fields.protein ?? ''}
              onChange={e => setFields(f => ({ ...f, protein: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Kohlenhydrate (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={fields.carbs ?? ''}
              onChange={e => setFields(f => ({ ...f, carbs: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fett">Fett (g)</Label>
            <Input
              id="fett"
              type="number"
              value={fields.fett ?? ''}
              onChange={e => setFields(f => ({ ...f, fett: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}