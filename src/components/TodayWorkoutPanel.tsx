import { useState } from 'react';
import { Plus, Trash2, Edit2, Dumbbell, Timer, Smile, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Workouts, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  selectedDate: string;
  workouts: Workouts[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
  loading: boolean;
  onRefresh: () => void;
}

const WORKOUT_TYPES = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
};
const STIMMUNG = { schlecht: '😞', okay: '😐', gut: '😊', brutal: '🔥' };
const RPE_LABELS: Record<string, string> = {
  rpe_1: '1', rpe_2: '2', rpe_3: '3', rpe_4: '4', rpe_5: '5',
  rpe_6: '6', rpe_7: '7', rpe_8: '8', rpe_9: '9', rpe_10: '10'
};

export default function TodayWorkoutPanel({ selectedDate, workouts, workoutLogs, uebungen, loading, onRefresh }: Props) {
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workouts | null>(null);
  const [editingLog, setEditingLog] = useState<WorkoutLogs | null>(null);
  const [saving, setSaving] = useState(false);

  const [workoutForm, setWorkoutForm] = useState({
    typ: 'push', dauer_minuten: '', stimmung: 'gut', rest_day: false
  });
  const [logForm, setLogForm] = useState({
    uebung: '', satz_nummer: '1', gewicht: '', wiederholungen: '', rpe: 'rpe_7'
  });

  const todayWorkout = workouts.find(w => w.fields.datum === selectedDate);
  const todayLogs = workoutLogs.filter(log => {
    const wId = extractRecordId(log.fields.workout);
    return wId === todayWorkout?.record_id;
  });

  function openWorkoutCreate() {
    setEditingWorkout(null);
    setWorkoutForm({ typ: 'push', dauer_minuten: '', stimmung: 'gut', rest_day: false });
    setShowWorkoutDialog(true);
  }

  function openWorkoutEdit(w: Workouts) {
    setEditingWorkout(w);
    setWorkoutForm({
      typ: w.fields.typ || 'push',
      dauer_minuten: String(w.fields.dauer_minuten ?? ''),
      stimmung: w.fields.stimmung || 'gut',
      rest_day: w.fields.rest_day || false,
    });
    setShowWorkoutDialog(true);
  }

  async function saveWorkout() {
    setSaving(true);
    try {
      const fields: Workouts['fields'] = {
        datum: selectedDate,
        typ: workoutForm.typ as Workouts['fields']['typ'],
        dauer_minuten: workoutForm.dauer_minuten ? Number(workoutForm.dauer_minuten) : undefined,
        stimmung: workoutForm.stimmung as Workouts['fields']['stimmung'],
        rest_day: workoutForm.rest_day,
      };
      if (editingWorkout) {
        await LivingAppsService.updateWorkout(editingWorkout.record_id, fields);
      } else {
        await LivingAppsService.createWorkout(fields);
      }
      setShowWorkoutDialog(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(id: string) {
    if (!confirm('Workout löschen?')) return;
    await LivingAppsService.deleteWorkout(id);
    onRefresh();
  }

  function openLogCreate() {
    if (!todayWorkout) return;
    setEditingLog(null);
    setLogForm({ uebung: '', satz_nummer: String(todayLogs.length + 1), gewicht: '', wiederholungen: '', rpe: 'rpe_7' });
    setShowLogDialog(true);
  }

  function openLogEdit(log: WorkoutLogs) {
    setEditingLog(log);
    const uId = extractRecordId(log.fields.uebung);
    setLogForm({
      uebung: uId || '',
      satz_nummer: String(log.fields.satz_nummer ?? ''),
      gewicht: String(log.fields.gewicht ?? ''),
      wiederholungen: String(log.fields.wiederholungen ?? ''),
      rpe: log.fields.rpe || 'rpe_7',
    });
    setShowLogDialog(true);
  }

  async function saveLog() {
    if (!todayWorkout || !logForm.uebung) return;
    setSaving(true);
    try {
      const fields: WorkoutLogs['fields'] = {
        workout: createRecordUrl(APP_IDS.WORKOUTS, todayWorkout.record_id),
        uebung: createRecordUrl(APP_IDS.UEBUNGEN, logForm.uebung),
        satz_nummer: Number(logForm.satz_nummer),
        gewicht: logForm.gewicht ? Number(logForm.gewicht) : undefined,
        wiederholungen: logForm.wiederholungen ? Number(logForm.wiederholungen) : undefined,
        rpe: logForm.rpe as WorkoutLogs['fields']['rpe'],
      };
      if (editingLog) {
        await LivingAppsService.updateWorkoutLog(editingLog.record_id, fields);
      } else {
        await LivingAppsService.createWorkoutLog(fields);
      }
      setShowLogDialog(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog(id: string) {
    await LivingAppsService.deleteWorkoutLog(id);
    onRefresh();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workout Header */}
      {!todayWorkout ? (
        <div
          className="rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-accent/60 transition-all"
          onClick={openWorkoutCreate}
        >
          <Dumbbell className="mx-auto mb-2 text-primary/60" size={28} />
          <p className="text-sm font-semibold text-primary/80">Workout starten</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tippe um ein Workout für heute zu erstellen</p>
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {todayWorkout.fields.rest_day ? (
                  <span className="flex items-center gap-1.5 text-white/90 text-sm font-semibold">
                    <Moon size={16} /> Ruhetag
                  </span>
                ) : (
                  <span className="text-white font-bold text-lg">
                    {WORKOUT_TYPES[todayWorkout.fields.typ || 'sonstiges']}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/80 text-xs">
                {todayWorkout.fields.dauer_minuten && (
                  <span className="flex items-center gap-1">
                    <Timer size={12} /> {todayWorkout.fields.dauer_minuten} Min
                  </span>
                )}
                {todayWorkout.fields.stimmung && (
                  <span className="flex items-center gap-1">
                    <Smile size={12} /> {STIMMUNG[todayWorkout.fields.stimmung]}
                  </span>
                )}
                <span className="text-white/60">{todayLogs.length} Sätze</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                onClick={() => openWorkoutEdit(todayWorkout)}
              >
                <Edit2 size={14} />
              </button>
              <button
                className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/60 text-white transition-colors"
                onClick={() => deleteWorkout(todayWorkout.record_id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Entries */}
      {todayWorkout && !todayWorkout.fields.rest_day && (
        <div className="space-y-2">
          {todayLogs.length > 0 && (
            <div className="space-y-1.5">
              {todayLogs.map(log => {
                const uId = extractRecordId(log.fields.uebung);
                const uebung = uId ? uebungen.find(u => u.record_id === uId) : null;
                return (
                  <div key={log.record_id} className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5 shadow-sm border border-border/50 group">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground">{uebung?.fields.name || 'Unbekannt'}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">Satz {log.fields.satz_nummer}</span>
                        {log.fields.gewicht != null && (
                          <span className="text-xs text-primary font-medium">{log.fields.gewicht} kg</span>
                        )}
                        {log.fields.wiederholungen != null && (
                          <span className="text-xs text-muted-foreground">× {log.fields.wiederholungen}</span>
                        )}
                        {log.fields.rpe && (
                          <span className="text-xs text-muted-foreground">RPE {RPE_LABELS[log.fields.rpe]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" onClick={() => openLogEdit(log)}>
                        <Edit2 size={12} />
                      </button>
                      <button className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => deleteLog(log.record_id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed border-primary/40 text-primary hover:bg-accent hover:text-primary"
            onClick={openLogCreate}
          >
            <Plus size={14} className="mr-1" /> Satz hinzufügen
          </Button>
        </div>
      )}

      {/* Workout Dialog */}
      <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingWorkout ? 'Workout bearbeiten' : 'Neues Workout'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label>Ruhetag</Label>
              <Switch
                checked={workoutForm.rest_day}
                onCheckedChange={v => setWorkoutForm(f => ({ ...f, rest_day: v }))}
              />
            </div>
            {!workoutForm.rest_day && (
              <>
                <div className="space-y-1.5">
                  <Label>Trainingstyp</Label>
                  <Select value={workoutForm.typ} onValueChange={v => setWorkoutForm(f => ({ ...f, typ: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORKOUT_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dauer (Minuten)</Label>
                  <Input
                    type="number"
                    placeholder="z.B. 60"
                    value={workoutForm.dauer_minuten}
                    onChange={e => setWorkoutForm(f => ({ ...f, dauer_minuten: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stimmung</Label>
                  <Select value={workoutForm.stimmung} onValueChange={v => setWorkoutForm(f => ({ ...f, stimmung: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schlecht">😞 Schlecht</SelectItem>
                      <SelectItem value="okay">😐 Okay</SelectItem>
                      <SelectItem value="gut">😊 Gut</SelectItem>
                      <SelectItem value="brutal">🔥 Brutal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkoutDialog(false)}>Abbrechen</Button>
            <Button onClick={saveWorkout} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingLog ? 'Satz bearbeiten' : 'Satz hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Übung</Label>
              <Select value={logForm.uebung || 'none'} onValueChange={v => setLogForm(f => ({ ...f, uebung: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Übung wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Übung wählen --</SelectItem>
                  {uebungen.map(u => (
                    <SelectItem key={u.record_id} value={u.record_id}>{u.fields.name || '(Ohne Name)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Satz Nr.</Label>
                <Input type="number" value={logForm.satz_nummer} onChange={e => setLogForm(f => ({ ...f, satz_nummer: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gewicht (kg)</Label>
                <Input type="number" placeholder="0" value={logForm.gewicht} onChange={e => setLogForm(f => ({ ...f, gewicht: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Wdh.</Label>
                <Input type="number" placeholder="0" value={logForm.wiederholungen} onChange={e => setLogForm(f => ({ ...f, wiederholungen: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>RPE (Anstrengung)</Label>
              <Select value={logForm.rpe} onValueChange={v => setLogForm(f => ({ ...f, rpe: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rpe_1">1 – Sehr leicht</SelectItem>
                  <SelectItem value="rpe_2">2</SelectItem>
                  <SelectItem value="rpe_3">3</SelectItem>
                  <SelectItem value="rpe_4">4</SelectItem>
                  <SelectItem value="rpe_5">5 – Mittel</SelectItem>
                  <SelectItem value="rpe_6">6</SelectItem>
                  <SelectItem value="rpe_7">7</SelectItem>
                  <SelectItem value="rpe_8">8</SelectItem>
                  <SelectItem value="rpe_9">9</SelectItem>
                  <SelectItem value="rpe_10">10 – Maximal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>Abbrechen</Button>
            <Button onClick={saveLog} disabled={saving || !logForm.uebung} className="bg-primary text-primary-foreground">
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
