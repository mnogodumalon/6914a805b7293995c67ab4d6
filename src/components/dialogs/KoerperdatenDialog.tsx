import { useState, useEffect } from 'react';
import type { Koerperdaten } from '@/types/app';
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

interface KoerperdatenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Koerperdaten['fields']) => Promise<void>;
  defaultValues?: Koerperdaten['fields'];
}

export function KoerperdatenDialog({ open, onClose, onSubmit, defaultValues }: KoerperdatenDialogProps) {
  const [fields, setFields] = useState<Partial<Koerperdaten['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Koerperdaten['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Körperdaten bearbeiten' : 'Körperdaten hinzufügen'}</DialogTitle>
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
            <Label htmlFor="gewicht_kg">Gewicht (kg)</Label>
            <Input
              id="gewicht_kg"
              type="number"
              value={fields.gewicht_kg ?? ''}
              onChange={e => setFields(f => ({ ...f, gewicht_kg: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kfa_geschaetzt">Körperfettanteil geschätzt (%)</Label>
            <Input
              id="kfa_geschaetzt"
              type="number"
              value={fields.kfa_geschaetzt ?? ''}
              onChange={e => setFields(f => ({ ...f, kfa_geschaetzt: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brustumfang">Brustumfang (cm)</Label>
            <Input
              id="brustumfang"
              type="number"
              value={fields.brustumfang ?? ''}
              onChange={e => setFields(f => ({ ...f, brustumfang: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taillenumfang">Taillenumfang (cm)</Label>
            <Input
              id="taillenumfang"
              type="number"
              value={fields.taillenumfang ?? ''}
              onChange={e => setFields(f => ({ ...f, taillenumfang: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hueftumfang">Hüftumfang (cm)</Label>
            <Input
              id="hueftumfang"
              type="number"
              value={fields.hueftumfang ?? ''}
              onChange={e => setFields(f => ({ ...f, hueftumfang: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="armumfang">Armumfang (cm)</Label>
            <Input
              id="armumfang"
              type="number"
              value={fields.armumfang ?? ''}
              onChange={e => setFields(f => ({ ...f, armumfang: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beinumfang">Beinumfang (cm)</Label>
            <Input
              id="beinumfang"
              type="number"
              value={fields.beinumfang ?? ''}
              onChange={e => setFields(f => ({ ...f, beinumfang: e.target.value ? Number(e.target.value) : undefined }))}
            />
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