import { useState, useEffect } from 'react';
import type { Uebungen } from '@/types/app';
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

interface UebungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Uebungen['fields']) => Promise<void>;
  defaultValues?: Uebungen['fields'];
}

export function UebungenDialog({ open, onClose, onSubmit, defaultValues }: UebungenDialogProps) {
  const [fields, setFields] = useState<Partial<Uebungen['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Uebungen['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Übungen bearbeiten' : 'Übungen hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Übungsname</Label>
            <Input
              id="name"
              value={fields.name ?? ''}
              onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="muskelgruppe">Muskelgruppe</Label>
            <Select
              value={fields.muskelgruppe ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, muskelgruppe: v === 'none' ? undefined : v as 'brust' | 'ruecken' | 'beine' | 'schultern' | 'bizeps' | 'trizeps' | 'bauch' | 'ganzkoerper' }))}
            >
              <SelectTrigger id="muskelgruppe"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="brust">Brust</SelectItem>
                <SelectItem value="ruecken">Rücken</SelectItem>
                <SelectItem value="beine">Beine</SelectItem>
                <SelectItem value="schultern">Schultern</SelectItem>
                <SelectItem value="bizeps">Bizeps</SelectItem>
                <SelectItem value="trizeps">Trizeps</SelectItem>
                <SelectItem value="bauch">Bauch</SelectItem>
                <SelectItem value="ganzkoerper">Ganzkörper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment</Label>
            <Select
              value={fields.equipment ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, equipment: v === 'none' ? undefined : v as 'langhantel' | 'kurzhantel' | 'maschine' | 'kabelzug' | 'bodyweight' | 'kettlebell' | 'resistance_band' | 'sonstiges' }))}
            >
              <SelectTrigger id="equipment"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="langhantel">Langhantel</SelectItem>
                <SelectItem value="kurzhantel">Kurzhantel</SelectItem>
                <SelectItem value="maschine">Maschine</SelectItem>
                <SelectItem value="kabelzug">Kabelzug</SelectItem>
                <SelectItem value="bodyweight">Bodyweight</SelectItem>
                <SelectItem value="kettlebell">Kettlebell</SelectItem>
                <SelectItem value="resistance_band">Resistance Band</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schwierigkeitsgrad">Schwierigkeitsgrad</Label>
            <Select
              value={fields.schwierigkeitsgrad ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, schwierigkeitsgrad: v === 'none' ? undefined : v as 'anfaenger' | 'fortgeschritten' | 'experte' }))}
            >
              <SelectTrigger id="schwierigkeitsgrad"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="anfaenger">Anfänger</SelectItem>
                <SelectItem value="fortgeschritten">Fortgeschritten</SelectItem>
                <SelectItem value="experte">Experte</SelectItem>
              </SelectContent>
            </Select>
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