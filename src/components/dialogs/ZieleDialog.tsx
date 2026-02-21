import { useState, useEffect } from 'react';
import type { Ziele } from '@/types/app';
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

interface ZieleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Ziele['fields']) => Promise<void>;
  defaultValues?: Ziele['fields'];
}

export function ZieleDialog({ open, onClose, onSubmit, defaultValues }: ZieleDialogProps) {
  const [fields, setFields] = useState<Partial<Ziele['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Ziele['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Ziele bearbeiten' : 'Ziele hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taeglich_kalorien">Tägliche Kalorien (kcal)</Label>
            <Input
              id="taeglich_kalorien"
              type="number"
              value={fields.taeglich_kalorien ?? ''}
              onChange={e => setFields(f => ({ ...f, taeglich_kalorien: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taeglich_protein">Tägliches Protein (g)</Label>
            <Input
              id="taeglich_protein"
              type="number"
              value={fields.taeglich_protein ?? ''}
              onChange={e => setFields(f => ({ ...f, taeglich_protein: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trainingstage_pro_woche">Trainingstage pro Woche</Label>
            <Input
              id="trainingstage_pro_woche"
              type="number"
              value={fields.trainingstage_pro_woche ?? ''}
              onChange={e => setFields(f => ({ ...f, trainingstage_pro_woche: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schlaf_ziel_stunden">Schlafziel (Stunden)</Label>
            <Input
              id="schlaf_ziel_stunden"
              type="number"
              value={fields.schlaf_ziel_stunden ?? ''}
              onChange={e => setFields(f => ({ ...f, schlaf_ziel_stunden: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={fields.status ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, status: v === 'none' ? undefined : v as 'aktiv' | 'erreicht' | 'verworfen' }))}
            >
              <SelectTrigger id="status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
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
              value={fields.notizen ?? ''}
              onChange={e => setFields(f => ({ ...f, notizen: e.target.value }))}
              rows={3}
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