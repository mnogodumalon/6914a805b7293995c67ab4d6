import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Uebungen, Workouts, WorkoutLogs, Ziele, Ernaehrung, Koerperdaten } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast, Toaster } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

import {
  Plus, Pencil, Trash2, Dumbbell, Utensils, Scale, Target,
  Activity, Clock, TrendingUp, Flame, Beef, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Lookup Maps ───
const MUSKELGRUPPE_LABELS: Record<string, string> = {
  brust: 'Brust', ruecken: 'Rucken', beine: 'Beine', schultern: 'Schultern',
  bizeps: 'Bizeps', trizeps: 'Trizeps', bauch: 'Bauch', ganzkoerper: 'Ganzkorper',
};
const EQUIPMENT_LABELS: Record<string, string> = {
  langhantel: 'Langhantel', kurzhantel: 'Kurzhantel', maschine: 'Maschine',
  kabelzug: 'Kabelzug', bodyweight: 'Bodyweight', kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band', sonstiges: 'Sonstiges',
};
const SCHWIERIGKEIT_LABELS: Record<string, string> = {
  anfaenger: 'Anfanger', fortgeschritten: 'Fortgeschritten', experte: 'Experte',
};
const TYP_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkorper',
  oberkoerper: 'Oberkorper', unterkoerper: 'Unterkorper', cardio: 'Cardio', sonstiges: 'Sonstiges',
};
const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht', okay: 'Okay', gut: 'Gut', brutal: 'Brutal',
};
const STIMMUNG_EMOJI: Record<string, string> = {
  schlecht: '😩', okay: '😐', gut: '😊', brutal: '🔥',
};
const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Fruhstuck', snack: 'Snack', mittagessen: 'Mittagessen',
  abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges',
};
const RPE_LABELS: Record<string, string> = {
  rpe_1: '1 - Sehr leicht', rpe_2: '2', rpe_3: '3', rpe_4: '4', rpe_5: '5 - Mittel',
  rpe_6: '6', rpe_7: '7', rpe_8: '8', rpe_9: '9', rpe_10: '10 - Maximal',
};
const ZIEL_STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv', erreicht: 'Erreicht', verworfen: 'Verworfen',
};

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekInterval() {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
}

function isInCurrentWeek(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr.split('T')[0]);
    const { start, end } = getWeekInterval();
    return isWithinInterval(d, { start, end });
  } catch { return false; }
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return dateStr.split('T')[0] === todayStr();
}

function formatNum(v: number | null | undefined): string {
  if (v == null) return '-';
  return new Intl.NumberFormat('de-DE').format(v);
}

// ─── SVG Progress Ring ───
function ProgressRing({ progress, size, strokeWidth, children }: {
  progress: number; size: number; strokeWidth: number; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 1) * circumference);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(40 15% 90%)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(158 35% 30%)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ───
function DeleteConfirmDialog({ open, onOpenChange, label, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; label: string; onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      toast.success('Geloscht', { description: `"${label}" wurde geloscht.` });
      onOpenChange(false);
    } catch {
      toast.error('Fehler', { description: 'Eintrag konnte nicht geloscht werden.' });
    } finally { setDeleting(false); }
  }
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag loschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Mochtest du &quot;{label}&quot; wirklich loschen? Diese Aktion kann nicht ruckgangig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90">
            {deleting ? 'Loscht...' : 'Loschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ═══════════════════════════════════════
// CRUD DIALOGS
// ═══════════════════════════════════════

// ─── Ubungen Dialog ───
function UebungenDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: Uebungen | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', muskelgruppe: '', equipment: '', schwierigkeitsgrad: '' });

  useEffect(() => {
    if (open) {
      setForm({
        name: record?.fields.name ?? '',
        muskelgruppe: record?.fields.muskelgruppe ?? '',
        equipment: record?.fields.equipment ?? '',
        schwierigkeitsgrad: record?.fields.schwierigkeitsgrad ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Uebungen['fields'] = {
        name: form.name || undefined,
        muskelgruppe: (form.muskelgruppe || undefined) as Uebungen['fields']['muskelgruppe'],
        equipment: (form.equipment || undefined) as Uebungen['fields']['equipment'],
        schwierigkeitsgrad: (form.schwierigkeitsgrad || undefined) as Uebungen['fields']['schwierigkeitsgrad'],
      };
      if (isEdit) {
        await LivingAppsService.updateUebungenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Ubung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createUebungenEntry(fields);
        toast.success('Erstellt', { description: 'Neue Ubung wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubung bearbeiten' : 'Neue Ubung'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Anderungen an der Ubung vornehmen.' : 'Eine neue Ubung zur Bibliothek hinzufugen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ue-name">Ubungsname *</Label>
            <Input id="ue-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Muskelgruppe</Label>
            <Select value={form.muskelgruppe || 'none'} onValueChange={v => setForm(p => ({ ...p, muskelgruppe: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(MUSKELGRUPPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Select value={form.equipment || 'none'} onValueChange={v => setForm(p => ({ ...p, equipment: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Schwierigkeitsgrad</Label>
            <Select value={form.schwierigkeitsgrad || 'none'} onValueChange={v => setForm(p => ({ ...p, schwierigkeitsgrad: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(SCHWIERIGKEIT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Workouts Dialog ───
function WorkoutsDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: Workouts | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ datum: todayStr(), typ: '', dauer_minuten: '', stimmung: '', rest_day: false });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] ?? todayStr(),
        typ: record?.fields.typ ?? '',
        dauer_minuten: record?.fields.dauer_minuten?.toString() ?? '',
        stimmung: record?.fields.stimmung ?? '',
        rest_day: record?.fields.rest_day ?? false,
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Workouts['fields'] = {
        datum: form.datum,
        typ: (form.typ || undefined) as Workouts['fields']['typ'],
        dauer_minuten: form.dauer_minuten ? Number(form.dauer_minuten) : undefined,
        stimmung: (form.stimmung || undefined) as Workouts['fields']['stimmung'],
        rest_day: form.rest_day,
      };
      if (isEdit) {
        await LivingAppsService.updateWorkout(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Workout wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWorkout(fields);
        toast.success('Erstellt', { description: 'Neues Workout wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Workout bearbeiten' : 'Workout loggen'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Workout-Details anpassen.' : 'Ein neues Workout eintragen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wo-datum">Datum *</Label>
            <Input id="wo-datum" type="date" value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Trainingstyp</Label>
            <Select value={form.typ || 'none'} onValueChange={v => setForm(p => ({ ...p, typ: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(TYP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wo-dauer">Dauer (Minuten)</Label>
            <Input id="wo-dauer" type="number" min="0" value={form.dauer_minuten} onChange={e => setForm(p => ({ ...p, dauer_minuten: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Stimmung</Label>
            <Select value={form.stimmung || 'none'} onValueChange={v => setForm(p => ({ ...p, stimmung: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(STIMMUNG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{STIMMUNG_EMOJI[k]} {v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="wo-rest" checked={form.rest_day} onCheckedChange={v => setForm(p => ({ ...p, rest_day: !!v }))} />
            <Label htmlFor="wo-rest">Ruhetag</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WorkoutLogs Dialog ───
function WorkoutLogsDialog({ open, onOpenChange, record, onSuccess, workouts, uebungen }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: WorkoutLogs | null; onSuccess: () => void;
  workouts: Workouts[]; uebungen: Uebungen[];
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ workout: '', uebung: '', satz_nummer: '1', gewicht: '', wiederholungen: '', rpe: '' });

  useEffect(() => {
    if (open) {
      setForm({
        workout: record?.fields.workout ? extractRecordId(record.fields.workout) ?? '' : '',
        uebung: record?.fields.uebung ? extractRecordId(record.fields.uebung) ?? '' : '',
        satz_nummer: record?.fields.satz_nummer?.toString() ?? '1',
        gewicht: record?.fields.gewicht?.toString() ?? '',
        wiederholungen: record?.fields.wiederholungen?.toString() ?? '',
        rpe: record?.fields.rpe ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: WorkoutLogs['fields'] = {
        workout: form.workout ? createRecordUrl(APP_IDS.WORKOUTS, form.workout) : undefined,
        uebung: form.uebung ? createRecordUrl(APP_IDS.UEBUNGEN, form.uebung) : undefined,
        satz_nummer: form.satz_nummer ? Number(form.satz_nummer) : undefined,
        gewicht: form.gewicht ? Number(form.gewicht) : undefined,
        wiederholungen: form.wiederholungen ? Number(form.wiederholungen) : undefined,
        rpe: (form.rpe || undefined) as WorkoutLogs['fields']['rpe'],
      };
      if (isEdit) {
        await LivingAppsService.updateWorkoutLog(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Workout-Log wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWorkoutLog(fields);
        toast.success('Erstellt', { description: 'Neuer Satz wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Satz bearbeiten' : 'Neuer Satz'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Satz-Details anpassen.' : 'Einen neuen Satz zum Workout hinzufugen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Workout *</Label>
            <Select value={form.workout || 'none'} onValueChange={v => setForm(p => ({ ...p, workout: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auswahlen...</SelectItem>
                {workouts.map(w => (
                  <SelectItem key={w.record_id} value={w.record_id}>
                    {w.fields.datum?.split('T')[0] ?? '?'} - {TYP_LABELS[w.fields.typ ?? ''] ?? 'Workout'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ubung *</Label>
            <Select value={form.uebung || 'none'} onValueChange={v => setForm(p => ({ ...p, uebung: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auswahlen...</SelectItem>
                {uebungen.map(u => <SelectItem key={u.record_id} value={u.record_id}>{u.fields.name ?? '?'}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wl-satz">Satznummer</Label>
              <Input id="wl-satz" type="number" min="1" value={form.satz_nummer} onChange={e => setForm(p => ({ ...p, satz_nummer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-gewicht">Gewicht (kg)</Label>
              <Input id="wl-gewicht" type="number" min="0" step="0.5" value={form.gewicht} onChange={e => setForm(p => ({ ...p, gewicht: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wl-wdh">Wiederholungen</Label>
              <Input id="wl-wdh" type="number" min="0" value={form.wiederholungen} onChange={e => setForm(p => ({ ...p, wiederholungen: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>RPE</Label>
              <Select value={form.rpe || 'none'} onValueChange={v => setForm(p => ({ ...p, rpe: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {Object.entries(RPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ziele Dialog ───
function ZieleDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: Ziele | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    taeglich_kalorien: '', taeglich_protein: '', trainingstage_pro_woche: '',
    schlaf_ziel_stunden: '', status: 'aktiv', notizen: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        taeglich_kalorien: record?.fields.taeglich_kalorien?.toString() ?? '',
        taeglich_protein: record?.fields.taeglich_protein?.toString() ?? '',
        trainingstage_pro_woche: record?.fields.trainingstage_pro_woche?.toString() ?? '',
        schlaf_ziel_stunden: record?.fields.schlaf_ziel_stunden?.toString() ?? '',
        status: record?.fields.status ?? 'aktiv',
        notizen: record?.fields.notizen ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Ziele['fields'] = {
        taeglich_kalorien: form.taeglich_kalorien ? Number(form.taeglich_kalorien) : undefined,
        taeglich_protein: form.taeglich_protein ? Number(form.taeglich_protein) : undefined,
        trainingstage_pro_woche: form.trainingstage_pro_woche ? Number(form.trainingstage_pro_woche) : undefined,
        schlaf_ziel_stunden: form.schlaf_ziel_stunden ? Number(form.schlaf_ziel_stunden) : undefined,
        status: (form.status || undefined) as Ziele['fields']['status'],
        notizen: form.notizen || undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateZieleEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Ziel wurde aktualisiert.' });
      } else {
        await LivingAppsService.createZieleEntry(fields);
        toast.success('Erstellt', { description: 'Neues Ziel wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ziel bearbeiten' : 'Neues Ziel'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Ziel-Werte anpassen.' : 'Ein neues Fitnessziel setzen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="z-kal">Kalorien/Tag (kcal)</Label>
              <Input id="z-kal" type="number" min="0" value={form.taeglich_kalorien} onChange={e => setForm(p => ({ ...p, taeglich_kalorien: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-prot">Protein/Tag (g)</Label>
              <Input id="z-prot" type="number" min="0" value={form.taeglich_protein} onChange={e => setForm(p => ({ ...p, taeglich_protein: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="z-train">Trainingstage/Woche</Label>
              <Input id="z-train" type="number" min="0" max="7" value={form.trainingstage_pro_woche} onChange={e => setForm(p => ({ ...p, trainingstage_pro_woche: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-schlaf">Schlafziel (h)</Label>
              <Input id="z-schlaf" type="number" min="0" max="24" step="0.5" value={form.schlaf_ziel_stunden} onChange={e => setForm(p => ({ ...p, schlaf_ziel_stunden: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ZIEL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="z-notizen">Notizen</Label>
            <Textarea id="z-notizen" value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ernahrung Dialog ───
function ErnaehrungDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: Ernaehrung | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    datum: todayStr(), mahlzeit_typ: '', beschreibung: '', kalorien: '', protein: '', carbs: '', fett: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] ?? todayStr(),
        mahlzeit_typ: record?.fields.mahlzeit_typ ?? '',
        beschreibung: record?.fields.beschreibung ?? '',
        kalorien: record?.fields.kalorien?.toString() ?? '',
        protein: record?.fields.protein?.toString() ?? '',
        carbs: record?.fields.carbs?.toString() ?? '',
        fett: record?.fields.fett?.toString() ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Ernaehrung['fields'] = {
        datum: form.datum,
        mahlzeit_typ: (form.mahlzeit_typ || undefined) as Ernaehrung['fields']['mahlzeit_typ'],
        beschreibung: form.beschreibung || undefined,
        kalorien: form.kalorien ? Number(form.kalorien) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fett: form.fett ? Number(form.fett) : undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateErnaehrungEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Mahlzeit wurde aktualisiert.' });
      } else {
        await LivingAppsService.createErnaehrungEntry(fields);
        toast.success('Erstellt', { description: 'Neue Mahlzeit wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Mahlzeit bearbeiten' : 'Mahlzeit hinzufugen'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Mahlzeit-Details anpassen.' : 'Eine neue Mahlzeit eintragen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="er-datum">Datum *</Label>
              <Input id="er-datum" type="date" value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Mahlzeitentyp *</Label>
              <Select value={form.mahlzeit_typ || 'none'} onValueChange={v => setForm(p => ({ ...p, mahlzeit_typ: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auswahlen...</SelectItem>
                  {Object.entries(MAHLZEIT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="er-beschr">Beschreibung</Label>
            <Textarea id="er-beschr" value={form.beschreibung} onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="er-kal">Kalorien (kcal)</Label>
              <Input id="er-kal" type="number" min="0" value={form.kalorien} onChange={e => setForm(p => ({ ...p, kalorien: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-prot">Protein (g)</Label>
              <Input id="er-prot" type="number" min="0" value={form.protein} onChange={e => setForm(p => ({ ...p, protein: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="er-carbs">Kohlenhydrate (g)</Label>
              <Input id="er-carbs" type="number" min="0" value={form.carbs} onChange={e => setForm(p => ({ ...p, carbs: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-fett">Fett (g)</Label>
              <Input id="er-fett" type="number" min="0" value={form.fett} onChange={e => setForm(p => ({ ...p, fett: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Korperdaten Dialog ───
function KoerperdatenDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; record: Koerperdaten | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    datum: todayStr(), gewicht_kg: '', kfa_geschaetzt: '', brustumfang: '', taillenumfang: '',
    hueftumfang: '', armumfang: '', beinumfang: '', notizen: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] ?? todayStr(),
        gewicht_kg: record?.fields.gewicht_kg?.toString() ?? '',
        kfa_geschaetzt: record?.fields.kfa_geschaetzt?.toString() ?? '',
        brustumfang: record?.fields.brustumfang?.toString() ?? '',
        taillenumfang: record?.fields.taillenumfang?.toString() ?? '',
        hueftumfang: record?.fields.hueftumfang?.toString() ?? '',
        armumfang: record?.fields.armumfang?.toString() ?? '',
        beinumfang: record?.fields.beinumfang?.toString() ?? '',
        notizen: record?.fields.notizen ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Koerperdaten['fields'] = {
        datum: form.datum,
        gewicht_kg: form.gewicht_kg ? Number(form.gewicht_kg) : undefined,
        kfa_geschaetzt: form.kfa_geschaetzt ? Number(form.kfa_geschaetzt) : undefined,
        brustumfang: form.brustumfang ? Number(form.brustumfang) : undefined,
        taillenumfang: form.taillenumfang ? Number(form.taillenumfang) : undefined,
        hueftumfang: form.hueftumfang ? Number(form.hueftumfang) : undefined,
        armumfang: form.armumfang ? Number(form.armumfang) : undefined,
        beinumfang: form.beinumfang ? Number(form.beinumfang) : undefined,
        notizen: form.notizen || undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateKoerperdatenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Korperdaten wurden aktualisiert.' });
      } else {
        await LivingAppsService.createKoerperdatenEntry(fields);
        toast.success('Erstellt', { description: 'Neue Korperdaten wurden erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Korperdaten bearbeiten' : 'Korperdaten erfassen'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Messwerte anpassen.' : 'Neue Korperma\u00dfe eintragen.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kd-datum">Datum *</Label>
            <Input id="kd-datum" type="date" value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kd-gew">Gewicht (kg)</Label>
              <Input id="kd-gew" type="number" min="0" step="0.1" value={form.gewicht_kg} onChange={e => setForm(p => ({ ...p, gewicht_kg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kd-kfa">KFA (%)</Label>
              <Input id="kd-kfa" type="number" min="0" max="100" step="0.1" value={form.kfa_geschaetzt} onChange={e => setForm(p => ({ ...p, kfa_geschaetzt: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kd-brust">Brust (cm)</Label>
              <Input id="kd-brust" type="number" min="0" step="0.1" value={form.brustumfang} onChange={e => setForm(p => ({ ...p, brustumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kd-taille">Taille (cm)</Label>
              <Input id="kd-taille" type="number" min="0" step="0.1" value={form.taillenumfang} onChange={e => setForm(p => ({ ...p, taillenumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kd-hueft">Hufte (cm)</Label>
              <Input id="kd-hueft" type="number" min="0" step="0.1" value={form.hueftumfang} onChange={e => setForm(p => ({ ...p, hueftumfang: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kd-arm">Arm (cm)</Label>
              <Input id="kd-arm" type="number" min="0" step="0.1" value={form.armumfang} onChange={e => setForm(p => ({ ...p, armumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kd-bein">Bein (cm)</Label>
              <Input id="kd-bein" type="number" min="0" step="0.1" value={form.beinumfang} onChange={e => setForm(p => ({ ...p, beinumfang: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kd-notizen">Notizen</Label>
            <Textarea id="kd-notizen" value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick Action Sheet ───
function QuickActionSheet({ open, onOpenChange, onAction }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onAction: (action: string) => void;
}) {
  const actions = [
    { key: 'workout', label: 'Workout loggen', icon: Dumbbell },
    { key: 'ernaehrung', label: 'Mahlzeit hinzufugen', icon: Utensils },
    { key: 'koerperdaten', label: 'Korper messen', icon: Scale },
    { key: 'uebung', label: 'Ubung erstellen', icon: Activity },
    { key: 'ziel', label: 'Ziel setzen', icon: Target },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Neue Aktion</DialogTitle>
          <DialogDescription>Was mochtest du eintragen?</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {actions.map(a => (
            <Button key={a.key} variant="outline" className="w-full justify-start gap-3 h-12"
              onClick={() => { onOpenChange(false); onAction(a.key); }}>
              <a.icon className="h-5 w-5 text-primary" />
              {a.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════

export default function Dashboard() {
  const isMobile = useIsMobile();

  // ─── Data State ───
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ─── Dialog State ───
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [editWorkout, setEditWorkout] = useState<Workouts | null>(null);
  const [deleteWorkout, setDeleteWorkout] = useState<Workouts | null>(null);
  const [showErnaehrungDialog, setShowErnaehrungDialog] = useState(false);
  const [editErnaehrung, setEditErnaehrung] = useState<Ernaehrung | null>(null);
  const [deleteErnaehrung, setDeleteErnaehrung] = useState<Ernaehrung | null>(null);
  const [showKoerperdatenDialog, setShowKoerperdatenDialog] = useState(false);
  const [editKoerperdaten, setEditKoerperdaten] = useState<Koerperdaten | null>(null);
  const [deleteKoerperdaten, setDeleteKoerperdaten] = useState<Koerperdaten | null>(null);
  const [showUebungenDialog, setShowUebungenDialog] = useState(false);
  const [editUebung, setEditUebung] = useState<Uebungen | null>(null);
  const [deleteUebung, setDeleteUebung] = useState<Uebungen | null>(null);
  const [showZieleDialog, setShowZieleDialog] = useState(false);
  const [editZiel, setEditZiel] = useState<Ziele | null>(null);
  const [deleteZiel, setDeleteZiel] = useState<Ziele | null>(null);
  const [showWLDialog, setShowWLDialog] = useState(false);
  const [editWL, setEditWL] = useState<WorkoutLogs | null>(null);
  const [deleteWL, setDeleteWL] = useState<WorkoutLogs | null>(null);

  // ─── Data Fetching ───
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ue, wo, wl, zi, er, kd] = await Promise.all([
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkouts(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getZiele(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
      ]);
      setUebungen(ue); setWorkouts(wo); setWorkoutLogs(wl);
      setZiele(zi); setErnaehrung(er); setKoerperdaten(kd);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Daten konnten nicht geladen werden'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Computed Values ───
  const activeGoal = useMemo(() => ziele.find(z => z.fields.status === 'aktiv'), [ziele]);

  const weekWorkouts = useMemo(() =>
    workouts.filter(w => isInCurrentWeek(w.fields.datum) && !w.fields.rest_day),
    [workouts]
  );
  const weekGoalDays = activeGoal?.fields.trainingstage_pro_woche ?? 5;

  const todayMeals = useMemo(() => ernaehrung.filter(e => isToday(e.fields.datum)), [ernaehrung]);
  const todayCalories = useMemo(() => todayMeals.reduce((s, m) => s + (m.fields.kalorien ?? 0), 0), [todayMeals]);
  const todayProtein = useMemo(() => todayMeals.reduce((s, m) => s + (m.fields.protein ?? 0), 0), [todayMeals]);
  const goalCalories = activeGoal?.fields.taeglich_kalorien ?? 2500;
  const goalProtein = activeGoal?.fields.taeglich_protein ?? 150;

  const avgDuration = useMemo(() => {
    const durations = weekWorkouts.map(w => w.fields.dauer_minuten).filter((d): d is number => d != null);
    return durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }, [weekWorkouts]);

  const dominantMood = useMemo(() => {
    const moods = weekWorkouts.map(w => w.fields.stimmung).filter(Boolean) as string[];
    if (moods.length === 0) return null;
    const counts: Record<string, number> = {};
    moods.forEach(m => { counts[m] = (counts[m] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [weekWorkouts]);

  // Chart data: last 4 weeks of training volume
  const chartData = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; minuten: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 86400000), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNum = format(weekStart, 'w');
      const total = workouts
        .filter(w => {
          if (!w.fields.datum || w.fields.rest_day) return false;
          try {
            const d = parseISO(w.fields.datum.split('T')[0]);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
          } catch { return false; }
        })
        .reduce((s, w) => s + (w.fields.dauer_minuten ?? 0), 0);
      weeks.push({ label: `KW ${weekNum}`, minuten: total });
    }
    return weeks;
  }, [workouts]);

  // Weight trend for sparkline
  const weightTrend = useMemo(() =>
    [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''))
      .slice(-15)
      .map(k => ({ date: k.fields.datum!, gewicht: k.fields.gewicht_kg! })),
    [koerperdaten]
  );

  // Ubung lookup
  const uebungMap = useMemo(() => {
    const m = new Map<string, Uebungen>();
    uebungen.forEach(u => m.set(u.record_id, u));
    return m;
  }, [uebungen]);

  // Workout lookup
  const workoutMap = useMemo(() => {
    const m = new Map<string, Workouts>();
    workouts.forEach(w => m.set(w.record_id, w));
    return m;
  }, [workouts]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    type ActivityItem = { date: string; type: string; label: string; };
    const items: ActivityItem[] = [];
    workouts.slice(0, 5).forEach(w => items.push({
      date: w.createdat, type: 'workout',
      label: `Workout: ${TYP_LABELS[w.fields.typ ?? ''] ?? 'Training'} ${w.fields.dauer_minuten ? `(${w.fields.dauer_minuten} min)` : ''}`,
    }));
    ernaehrung.slice(0, 5).forEach(e => items.push({
      date: e.createdat, type: 'ernaehrung',
      label: `${MAHLZEIT_LABELS[e.fields.mahlzeit_typ ?? ''] ?? 'Mahlzeit'}: ${e.fields.kalorien ?? 0} kcal`,
    }));
    koerperdaten.slice(0, 3).forEach(k => items.push({
      date: k.createdat, type: 'koerperdaten',
      label: `Gewicht: ${k.fields.gewicht_kg ?? '-'} kg`,
    }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [workouts, ernaehrung, koerperdaten]);

  // Quick action handler
  function handleQuickAction(action: string) {
    switch (action) {
      case 'workout': setEditWorkout(null); setShowWorkoutDialog(true); break;
      case 'ernaehrung': setEditErnaehrung(null); setShowErnaehrungDialog(true); break;
      case 'koerperdaten': setEditKoerperdaten(null); setShowKoerperdatenDialog(true); break;
      case 'uebung': setEditUebung(null); setShowUebungenDialog(true); break;
      case 'ziel': setEditZiel(null); setShowZieleDialog(true); break;
    }
  }

  // Sorted data for lists
  const sortedWorkouts = useMemo(() =>
    [...workouts].sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')).slice(0, 20),
    [workouts]
  );
  const sortedErnaehrung = useMemo(() =>
    [...ernaehrung].sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')).slice(0, 20),
    [ernaehrung]
  );
  const sortedKoerperdaten = useMemo(() =>
    [...koerperdaten].sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')).slice(0, 15),
    [koerperdaten]
  );
  const sortedUebungen = useMemo(() =>
    [...uebungen].sort((a, b) => (a.fields.name ?? '').localeCompare(b.fields.name ?? '')),
    [uebungen]
  );
  const sortedZiele = useMemo(() =>
    [...ziele].sort((a, b) => {
      if (a.fields.status === 'aktiv' && b.fields.status !== 'aktiv') return -1;
      if (b.fields.status === 'aktiv' && a.fields.status !== 'aktiv') return 1;
      return b.createdat.localeCompare(a.createdat);
    }),
    [ziele]
  );
  const sortedWL = useMemo(() =>
    [...workoutLogs].sort((a, b) => b.createdat.localeCompare(a.createdat)).slice(0, 30),
    [workoutLogs]
  );

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1200px] space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div className="w-full md:w-80 space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={fetchAll} variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render Tabs Content ───
  function renderWorkoutsTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Workouts</h3>
          <Button size="sm" onClick={() => { setEditWorkout(null); setShowWorkoutDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {sortedWorkouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Workouts vorhanden.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditWorkout(null); setShowWorkoutDialog(true); }}>
              Erstes Workout loggen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedWorkouts.map(w => (
              <div key={w.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {w.fields.datum ? format(parseISO(w.fields.datum.split('T')[0]), 'dd.MM.yy') : '-'}
                  </div>
                  {w.fields.typ && <Badge variant="secondary">{TYP_LABELS[w.fields.typ] ?? w.fields.typ}</Badge>}
                  {w.fields.rest_day && <Badge variant="outline">Ruhetag</Badge>}
                  {w.fields.dauer_minuten != null && (
                    <span className="text-xs text-muted-foreground">{w.fields.dauer_minuten} min</span>
                  )}
                  {w.fields.stimmung && (
                    <span className="text-sm" title={STIMMUNG_LABELS[w.fields.stimmung]}>{STIMMUNG_EMOJI[w.fields.stimmung]}</span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditWorkout(w); setShowWorkoutDialog(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteWorkout(w)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderErnaehrungTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Ernahrung</h3>
          <Button size="sm" onClick={() => { setEditErnaehrung(null); setShowErnaehrungDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {sortedErnaehrung.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Mahlzeiten eingetragen.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditErnaehrung(null); setShowErnaehrungDialog(true); }}>
              Erste Mahlzeit hinzufugen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedErnaehrung.map(e => (
              <div key={e.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {e.fields.datum ? format(parseISO(e.fields.datum.split('T')[0]), 'dd.MM.yy') : '-'}
                  </div>
                  {e.fields.mahlzeit_typ && <Badge variant="secondary">{MAHLZEIT_LABELS[e.fields.mahlzeit_typ] ?? e.fields.mahlzeit_typ}</Badge>}
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{e.fields.beschreibung ?? ''}</span>
                  {e.fields.kalorien != null && <span className="text-xs font-medium">{e.fields.kalorien} kcal</span>}
                  {e.fields.protein != null && <span className="text-xs text-muted-foreground">{e.fields.protein}g P</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditErnaehrung(e); setShowErnaehrungDialog(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteErnaehrung(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderKoerperdatenTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Korperdaten</h3>
          <Button size="sm" onClick={() => { setEditKoerperdaten(null); setShowKoerperdatenDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {weightTrend.length > 2 && (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(160 5% 50%)" tickFormatter={d => format(parseISO(d), 'dd.MM')} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} stroke="hsl(160 5% 50%)" width={35} />
                <Tooltip formatter={(v: number) => [`${v} kg`, 'Gewicht']} labelFormatter={l => format(parseISO(l as string), 'dd.MM.yyyy')} />
                <Line type="monotone" dataKey="gewicht" stroke="hsl(158 35% 30%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {sortedKoerperdaten.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Korperdaten vorhanden.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditKoerperdaten(null); setShowKoerperdatenDialog(true); }}>
              Erste Messung eintragen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedKoerperdaten.map(k => (
              <div key={k.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {k.fields.datum ? format(parseISO(k.fields.datum.split('T')[0]), 'dd.MM.yy') : '-'}
                  </div>
                  {k.fields.gewicht_kg != null && <span className="text-sm font-medium">{k.fields.gewicht_kg} kg</span>}
                  {k.fields.kfa_geschaetzt != null && <span className="text-xs text-muted-foreground">{k.fields.kfa_geschaetzt}% KFA</span>}
                  {k.fields.brustumfang != null && <span className="text-xs text-muted-foreground hidden sm:inline">Brust: {k.fields.brustumfang}cm</span>}
                  {k.fields.taillenumfang != null && <span className="text-xs text-muted-foreground hidden sm:inline">Taille: {k.fields.taillenumfang}cm</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditKoerperdaten(k); setShowKoerperdatenDialog(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteKoerperdaten(k)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderUebungenTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Ubungen</h3>
          <Button size="sm" onClick={() => { setEditUebung(null); setShowUebungenDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {sortedUebungen.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Ubungen vorhanden.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditUebung(null); setShowUebungenDialog(true); }}>
              Erste Ubung erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUebungen.map(u => (
              <div key={u.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-sm font-medium">{u.fields.name ?? '-'}</span>
                  {u.fields.muskelgruppe && <Badge variant="secondary" className="text-[10px]">{MUSKELGRUPPE_LABELS[u.fields.muskelgruppe]}</Badge>}
                  {u.fields.equipment && <Badge variant="outline" className="text-[10px]">{EQUIPMENT_LABELS[u.fields.equipment]}</Badge>}
                  {u.fields.schwierigkeitsgrad && <Badge variant="outline" className="text-[10px]">{SCHWIERIGKEIT_LABELS[u.fields.schwierigkeitsgrad]}</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditUebung(u); setShowUebungenDialog(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUebung(u)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderZieleTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Ziele</h3>
          <Button size="sm" onClick={() => { setEditZiel(null); setShowZieleDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {sortedZiele.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Ziele gesetzt.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditZiel(null); setShowZieleDialog(true); }}>
              Erstes Ziel setzen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedZiele.map(z => (
              <Card key={z.record_id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={z.fields.status === 'aktiv' ? 'default' : z.fields.status === 'erreicht' ? 'secondary' : 'outline'}>
                          {ZIEL_STATUS_LABELS[z.fields.status ?? ''] ?? z.fields.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
                        {z.fields.taeglich_kalorien != null && <span><Flame className="inline h-3.5 w-3.5 mr-1" />{z.fields.taeglich_kalorien} kcal/Tag</span>}
                        {z.fields.taeglich_protein != null && <span><Beef className="inline h-3.5 w-3.5 mr-1" />{z.fields.taeglich_protein}g Protein/Tag</span>}
                        {z.fields.trainingstage_pro_woche != null && <span><Dumbbell className="inline h-3.5 w-3.5 mr-1" />{z.fields.trainingstage_pro_woche}x/Woche</span>}
                        {z.fields.schlaf_ziel_stunden != null && <span><Clock className="inline h-3.5 w-3.5 mr-1" />{z.fields.schlaf_ziel_stunden}h Schlaf</span>}
                      </div>
                      {z.fields.notizen && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{z.fields.notizen}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditZiel(z); setShowZieleDialog(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteZiel(z)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderWorkoutLogsTab() {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Workout-Logs</h3>
          <Button size="sm" onClick={() => { setEditWL(null); setShowWLDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </Button>
        </div>
        {sortedWL.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Workout-Logs vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedWL.map(wl => {
              const woId = extractRecordId(wl.fields.workout);
              const ueId = extractRecordId(wl.fields.uebung);
              const wo = woId ? workoutMap.get(woId) : null;
              const ue = ueId ? uebungMap.get(ueId) : null;
              return (
                <div key={wl.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    {wo && <span className="text-xs text-muted-foreground">{wo.fields.datum?.split('T')[0] ?? '?'}</span>}
                    {ue && <span className="text-sm font-medium">{ue.fields.name}</span>}
                    <span className="text-xs text-muted-foreground">Satz {wl.fields.satz_nummer ?? '?'}</span>
                    {wl.fields.gewicht != null && <span className="text-xs">{wl.fields.gewicht}kg</span>}
                    {wl.fields.wiederholungen != null && <span className="text-xs">{wl.fields.wiederholungen} Wdh</span>}
                    {wl.fields.rpe && <Badge variant="outline" className="text-[10px]">{RPE_LABELS[wl.fields.rpe] ?? wl.fields.rpe}</Badge>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditWL(wl); setShowWLDialog(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteWL(wl)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* All CRUD Dialogs */}
      <UebungenDialog open={showUebungenDialog} onOpenChange={setShowUebungenDialog} record={editUebung} onSuccess={fetchAll} />
      <WorkoutsDialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog} record={editWorkout} onSuccess={fetchAll} />
      <WorkoutLogsDialog open={showWLDialog} onOpenChange={setShowWLDialog} record={editWL} onSuccess={fetchAll} workouts={sortedWorkouts} uebungen={sortedUebungen} />
      <ZieleDialog open={showZieleDialog} onOpenChange={setShowZieleDialog} record={editZiel} onSuccess={fetchAll} />
      <ErnaehrungDialog open={showErnaehrungDialog} onOpenChange={setShowErnaehrungDialog} record={editErnaehrung} onSuccess={fetchAll} />
      <KoerperdatenDialog open={showKoerperdatenDialog} onOpenChange={setShowKoerperdatenDialog} record={editKoerperdaten} onSuccess={fetchAll} />
      <QuickActionSheet open={showQuickAction} onOpenChange={setShowQuickAction} onAction={handleQuickAction} />

      {/* Delete Confirmations */}
      <DeleteConfirmDialog open={!!deleteWorkout} onOpenChange={v => !v && setDeleteWorkout(null)}
        label={`Workout vom ${deleteWorkout?.fields.datum?.split('T')[0] ?? '?'}`}
        onConfirm={async () => { await LivingAppsService.deleteWorkout(deleteWorkout!.record_id); setDeleteWorkout(null); fetchAll(); }} />
      <DeleteConfirmDialog open={!!deleteErnaehrung} onOpenChange={v => !v && setDeleteErnaehrung(null)}
        label={deleteErnaehrung?.fields.beschreibung ?? 'Mahlzeit'}
        onConfirm={async () => { await LivingAppsService.deleteErnaehrungEntry(deleteErnaehrung!.record_id); setDeleteErnaehrung(null); fetchAll(); }} />
      <DeleteConfirmDialog open={!!deleteKoerperdaten} onOpenChange={v => !v && setDeleteKoerperdaten(null)}
        label={`Korperdaten vom ${deleteKoerperdaten?.fields.datum?.split('T')[0] ?? '?'}`}
        onConfirm={async () => { await LivingAppsService.deleteKoerperdatenEntry(deleteKoerperdaten!.record_id); setDeleteKoerperdaten(null); fetchAll(); }} />
      <DeleteConfirmDialog open={!!deleteUebung} onOpenChange={v => !v && setDeleteUebung(null)}
        label={deleteUebung?.fields.name ?? 'Ubung'}
        onConfirm={async () => { await LivingAppsService.deleteUebungenEntry(deleteUebung!.record_id); setDeleteUebung(null); fetchAll(); }} />
      <DeleteConfirmDialog open={!!deleteZiel} onOpenChange={v => !v && setDeleteZiel(null)}
        label="Ziel"
        onConfirm={async () => { await LivingAppsService.deleteZieleEntry(deleteZiel!.record_id); setDeleteZiel(null); fetchAll(); }} />
      <DeleteConfirmDialog open={!!deleteWL} onOpenChange={v => !v && setDeleteWL(null)}
        label={`Satz ${deleteWL?.fields.satz_nummer ?? '?'}`}
        onConfirm={async () => { await LivingAppsService.deleteWorkoutLog(deleteWL!.record_id); setDeleteWL(null); fetchAll(); }} />

      <div className="mx-auto max-w-[1200px] p-4 md:p-8">
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Fitness Tracker</h1>
            <p className="text-sm text-muted-foreground font-light">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          {!isMobile && (
            <div className="flex gap-2">
              <Button onClick={() => { setEditWorkout(null); setShowWorkoutDialog(true); }}>
                <Dumbbell className="h-4 w-4 mr-2" /> Workout loggen
              </Button>
              <Button variant="outline" onClick={() => { setEditErnaehrung(null); setShowErnaehrungDialog(true); }}>
                <Utensils className="h-4 w-4 mr-2" /> Mahlzeit
              </Button>
              <Button variant="outline" onClick={() => { setEditKoerperdaten(null); setShowKoerperdatenDialog(true); }}>
                <Scale className="h-4 w-4 mr-2" /> Messen
              </Button>
            </div>
          )}
        </header>

        {/* ─── Main Layout ─── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ─── Left Column (65%) ─── */}
          <div className="flex-1 lg:w-[65%] space-y-6">

            {/* Hero Section */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  {/* Progress Ring */}
                  <div className="flex flex-col items-center">
                    <ProgressRing progress={weekGoalDays > 0 ? weekWorkouts.length / weekGoalDays : 0}
                      size={isMobile ? 180 : 220} strokeWidth={10}>
                      <span className="text-5xl md:text-[56px] font-bold leading-none">{weekWorkouts.length}</span>
                      <span className="text-sm font-light text-muted-foreground mt-1">von {weekGoalDays} Tagen</span>
                    </ProgressRing>
                    <span className="text-xs text-muted-foreground mt-2">KW {format(new Date(), 'w')}</span>
                  </div>

                  {/* Today's Nutrition Progress */}
                  <div className="flex-1 w-full space-y-5">
                    <h2 className="text-sm font-medium text-muted-foreground">Heute</h2>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-chart-3" />Kalorien</span>
                        <span className="font-medium">{formatNum(todayCalories)} / {formatNum(goalCalories)} kcal</span>
                      </div>
                      <Progress value={Math.min((todayCalories / goalCalories) * 100, 100)} className="h-2.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Beef className="h-3.5 w-3.5 text-chart-2" />Protein</span>
                        <span className="font-medium">{formatNum(todayProtein)} / {formatNum(goalProtein)} g</span>
                      </div>
                      <Progress value={Math.min((todayProtein / goalProtein) * 100, 100)} className="h-2.5" />
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-6 pt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Dauer</div>
                        <div className="text-lg font-semibold">{avgDuration}<span className="text-sm font-normal text-muted-foreground ml-0.5">min</span></div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Stimmung</div>
                        <div className="text-lg font-semibold">
                          {dominantMood ? `${STIMMUNG_EMOJI[dominantMood]} ${STIMMUNG_LABELS[dominantMood]}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Workouts</div>
                        <div className="text-lg font-semibold">{weekWorkouts.length}<span className="text-sm font-normal text-muted-foreground ml-0.5">diese Woche</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Trainingsvolumen (letzte 4 Wochen)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(160 5% 50%)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(160 5% 50%)" width={40}
                        tickFormatter={v => `${v}m`} />
                      <Tooltip formatter={(v: number) => [`${v} Minuten`, 'Trainingszeit']}
                        contentStyle={{ backgroundColor: 'hsl(0 0% 100%)', border: '1px solid hsl(40 15% 88%)', borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="minuten" stroke="hsl(158 35% 30%)" strokeWidth={2}
                        fill="hsl(158 35% 30%)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for CRUD */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <Tabs defaultValue="workouts">
                  <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                    <TabsTrigger value="workouts">Workouts</TabsTrigger>
                    <TabsTrigger value="ernaehrung">Ernahrung</TabsTrigger>
                    <TabsTrigger value="koerper">Korper</TabsTrigger>
                    <TabsTrigger value="uebungen">Ubungen</TabsTrigger>
                    <TabsTrigger value="ziele">Ziele</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>
                  <div className="mt-4">
                    <TabsContent value="workouts">{renderWorkoutsTab()}</TabsContent>
                    <TabsContent value="ernaehrung">{renderErnaehrungTab()}</TabsContent>
                    <TabsContent value="koerper">{renderKoerperdatenTab()}</TabsContent>
                    <TabsContent value="uebungen">{renderUebungenTab()}</TabsContent>
                    <TabsContent value="ziele">{renderZieleTab()}</TabsContent>
                    <TabsContent value="logs">{renderWorkoutLogsTab()}</TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Column (35%) - Desktop Only ─── */}
          {!isMobile && (
            <div className="lg:w-[35%] space-y-6">
              {/* Active Goals */}
              {activeGoal && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" /> Aktives Ziel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {activeGoal.fields.taeglich_kalorien != null && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Kalorien/Tag</div>
                          <div className="text-sm font-semibold">{formatNum(activeGoal.fields.taeglich_kalorien)} kcal</div>
                        </div>
                      )}
                      {activeGoal.fields.taeglich_protein != null && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Protein/Tag</div>
                          <div className="text-sm font-semibold">{formatNum(activeGoal.fields.taeglich_protein)} g</div>
                        </div>
                      )}
                      {activeGoal.fields.trainingstage_pro_woche != null && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Training/Woche</div>
                          <div className="text-sm font-semibold">{activeGoal.fields.trainingstage_pro_woche}x</div>
                        </div>
                      )}
                      {activeGoal.fields.schlaf_ziel_stunden != null && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Schlafziel</div>
                          <div className="text-sm font-semibold">{activeGoal.fields.schlaf_ziel_stunden}h</div>
                        </div>
                      )}
                    </div>
                    {activeGoal.fields.notizen && (
                      <p className="text-xs text-muted-foreground border-t pt-2">{activeGoal.fields.notizen}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Weight Trend Sparkline */}
              {weightTrend.length > 2 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Gewichtsverlauf
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[100px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightTrend}>
                          <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                          <Tooltip formatter={(v: number) => [`${v} kg`, 'Gewicht']}
                            labelFormatter={l => format(parseISO(l as string), 'dd.MM.yyyy')} />
                          <Line type="monotone" dataKey="gewicht" stroke="hsl(158 35% 30%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Aktuell: {weightTrend[weightTrend.length - 1]?.gewicht ?? '-'} kg
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity Feed */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Letzte Aktivitat</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Noch keine Aktivitaten.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            a.type === 'workout' ? 'bg-primary' :
                            a.type === 'ernaehrung' ? 'bg-chart-3' : 'bg-chart-4'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm leading-tight">{a.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistance(parseISO(a.date), new Date(), { addSuffix: true, locale: de })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile FAB ─── */}
      {isMobile && (
        <button
          onClick={() => setShowQuickAction(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Neue Aktion"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
