import { useState, useEffect } from 'react';
import type { WorkoutLogs, Workouts, Uebungen } from '@/types/app';
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

interface WorkoutLogsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: WorkoutLogs['fields']) => Promise<void>;
  defaultValues?: WorkoutLogs['fields'];
  workoutsList: Workouts[];
  uebungenList: Uebungen[];
}

export function WorkoutLogsDialog({ open, onClose, onSubmit, defaultValues, workoutsList, uebungenList }: WorkoutLogsDialogProps) {
  const [fields, setFields] = useState<Partial<WorkoutLogs['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as WorkoutLogs['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Workout-Logs bearbeiten' : 'Workout-Logs hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout">Workout</Label>
            <Select
              value={extractRecordId(fields.workout) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, workout: v === 'none' ? undefined : createRecordUrl(APP_IDS.WORKOUTS, v) }))}
            >
              <SelectTrigger id="workout"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {workoutsList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.datum ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="uebung">Übung</Label>
            <Select
              value={extractRecordId(fields.uebung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, uebung: v === 'none' ? undefined : createRecordUrl(APP_IDS.UEBUNGEN, v) }))}
            >
              <SelectTrigger id="uebung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {uebungenList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="satz_nummer">Satznummer</Label>
            <Input
              id="satz_nummer"
              type="number"
              value={fields.satz_nummer ?? ''}
              onChange={e => setFields(f => ({ ...f, satz_nummer: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gewicht">Gewicht (kg)</Label>
            <Input
              id="gewicht"
              type="number"
              value={fields.gewicht ?? ''}
              onChange={e => setFields(f => ({ ...f, gewicht: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wiederholungen">Wiederholungen</Label>
            <Input
              id="wiederholungen"
              type="number"
              value={fields.wiederholungen ?? ''}
              onChange={e => setFields(f => ({ ...f, wiederholungen: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rpe">RPE / Gefühl</Label>
            <Select
              value={fields.rpe ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, rpe: v === 'none' ? undefined : v as 'rpe_1' | 'rpe_2' | 'rpe_3' | 'rpe_4' | 'rpe_5' | 'rpe_6' | 'rpe_7' | 'rpe_8' | 'rpe_9' | 'rpe_10' }))}
            >
              <SelectTrigger id="rpe"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="rpe_1">1 - Sehr leicht</SelectItem>
                <SelectItem value="rpe_2">2</SelectItem>
                <SelectItem value="rpe_3">3</SelectItem>
                <SelectItem value="rpe_4">4</SelectItem>
                <SelectItem value="rpe_5">5 - Mittel</SelectItem>
                <SelectItem value="rpe_6">6</SelectItem>
                <SelectItem value="rpe_7">7</SelectItem>
                <SelectItem value="rpe_8">8</SelectItem>
                <SelectItem value="rpe_9">9</SelectItem>
                <SelectItem value="rpe_10">10 - Maximal</SelectItem>
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