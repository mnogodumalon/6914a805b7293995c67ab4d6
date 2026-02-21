import { useState, useEffect } from 'react';
import type { Workouts } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface WorkoutsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Workouts['fields']) => Promise<void>;
  defaultValues?: Workouts['fields'];
}

export function WorkoutsDialog({ open, onClose, onSubmit, defaultValues }: WorkoutsDialogProps) {
  const [fields, setFields] = useState<Partial<Workouts['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Workouts['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Workouts bearbeiten' : 'Workouts hinzufügen'}</DialogTitle>
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
            <Label htmlFor="typ">Trainingstyp</Label>
            <Select
              value={fields.typ ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, typ: v === 'none' ? undefined : v as 'push' | 'pull' | 'beine' | 'ganzkoerper' | 'oberkoerper' | 'unterkoerper' | 'cardio' | 'sonstiges' }))}
            >
              <SelectTrigger id="typ"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="beine">Beine</SelectItem>
                <SelectItem value="ganzkoerper">Ganzkörper</SelectItem>
                <SelectItem value="oberkoerper">Oberkörper</SelectItem>
                <SelectItem value="unterkoerper">Unterkörper</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dauer_minuten">Dauer (Minuten)</Label>
            <Input
              id="dauer_minuten"
              type="number"
              value={fields.dauer_minuten ?? ''}
              onChange={e => setFields(f => ({ ...f, dauer_minuten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stimmung">Stimmung</Label>
            <Select
              value={fields.stimmung ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stimmung: v === 'none' ? undefined : v as 'schlecht' | 'okay' | 'gut' | 'brutal' }))}
            >
              <SelectTrigger id="stimmung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="schlecht">Schlecht</SelectItem>
                <SelectItem value="okay">Okay</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="brutal">Brutal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rest_day">Ruhetag</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="rest_day"
                checked={!!fields.rest_day}
                onCheckedChange={(v) => setFields(f => ({ ...f, rest_day: !!v }))}
              />
              <Label htmlFor="rest_day" className="font-normal">Ruhetag</Label>
            </div>
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