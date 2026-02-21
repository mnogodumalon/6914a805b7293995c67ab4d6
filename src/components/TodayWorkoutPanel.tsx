import { useState } from 'react';
import { Plus, Trash2, Dumbbell, Clock, Smile, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Workouts, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  workouts: Workouts[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
  onWorkoutsChange: (w: Workouts[]) => void;
  onLogsChange: (l: WorkoutLogs[]) => void;
}

const TYP_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
};

const STIMMUNG_EMOJI: Record<string, string> = {
  schlecht: '😣', okay: '😐', gut: '💪', brutal: '🔥'
};

const RPE_LABELS: Record<string, string> = {
  rpe_1: '1', rpe_2: '2', rpe_3: '3', rpe_4: '4', rpe_5: '5',
  rpe_6: '6', rpe_7: '7', rpe_8: '8', rpe_9: '9', rpe_10: '10'
};

export default function TodayWorkoutPanel({ workouts, workoutLogs, uebungen, onWorkoutsChange, onLogsChange }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayWorkout = workouts.find(w => w.fields.datum === today);
  const todayLogs = todayWorkout
    ? workoutLogs.filter(l => extractRecordId(l.fields.workout) === todayWorkout.record_id)
    : [];

  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const [workoutForm, setWorkoutForm] = useState({
    typ: 'push', dauer_minuten: '', stimmung: 'gut', rest_day: false
  });
  const [logForm, setLogForm] = useState({
    uebung: '', satz_nummer: '1', gewicht: '', wiederholungen: '', rpe: 'rpe_8'
  });
  const [saving, setSaving] = useState(false);

  const exerciseMap = new Map(uebungen.map(u => [u.record_id, u]));

  // Group logs by exercise
  const logsByExercise = todayLogs.reduce<Record<string, WorkoutLogs[]>>((acc, log) => {
    const id = extractRecordId(log.fields.uebung) ?? 'unknown';
    if (!acc[id]) acc[id] = [];
    acc[id].push(log);
    return acc;
  }, {});

  async function handleCreateWorkout() {
    setSaving(true);
    try {
      await LivingAppsService.createWorkout({
        datum: today,
        typ: workoutForm.typ as Workouts['fields']['typ'],
        dauer_minuten: workoutForm.dauer_minuten ? Number(workoutForm.dauer_minuten) : undefined,
        stimmung: workoutForm.stimmung as Workouts['fields']['stimmung'],
        rest_day: workoutForm.rest_day,
      });
      const updated = await LivingAppsService.getWorkouts();
      onWorkoutsChange(updated);
      setShowWorkoutForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLog() {
    if (!todayWorkout || !logForm.uebung) return;
    setSaving(true);
    try {
      await LivingAppsService.createWorkoutLog({
        workout: createRecordUrl(APP_IDS.WORKOUTS, todayWorkout.record_id),
        uebung: createRecordUrl(APP_IDS.UEBUNGEN, logForm.uebung),
        satz_nummer: Number(logForm.satz_nummer),
        gewicht: logForm.gewicht ? Number(logForm.gewicht) : undefined,
        wiederholungen: logForm.wiederholungen ? Number(logForm.wiederholungen) : undefined,
        rpe: logForm.rpe as WorkoutLogs['fields']['rpe'],
      });
      const updated = await LivingAppsService.getWorkoutLogs();
      onLogsChange(updated);
      setLogForm(f => ({ ...f, satz_nummer: String(Number(f.satz_nummer) + 1) }));
      setShowLogForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(id: string) {
    await LivingAppsService.deleteWorkoutLog(id);
    onLogsChange(workoutLogs.filter(l => l.record_id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
          </p>
          <h2 className="text-2xl font-800 text-foreground mt-0.5">Heutiges Training</h2>
        </div>
        {todayWorkout && (
          <Button size="sm" onClick={() => setShowLogForm(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 gap-1.5">
            <Plus size={14} /> Satz eintragen
          </Button>
        )}
      </div>

      {/* Today's workout card or create prompt */}
      {!todayWorkout ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
            <Dumbbell size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-600 text-foreground">Kein Workout heute</p>
            <p className="text-sm text-muted-foreground mt-1">Starte dein heutiges Training oder markiere es als Ruhetag.</p>
          </div>
          <Button onClick={() => setShowWorkoutForm(true)} className="bg-primary text-primary-foreground hover:opacity-90 gap-2">
            <Plus size={16} /> Training starten
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {/* Workout meta bar */}
          <div className="px-5 py-4 flex items-center gap-4 border-b border-border"
            style={{ background: 'var(--gradient-hero)' }}>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-2xl">{STIMMUNG_EMOJI[todayWorkout.fields.stimmung ?? 'gut']}</span>
              <div>
                <p className="font-700 text-white text-lg leading-tight">
                  {TYP_LABELS[todayWorkout.fields.typ ?? 'sonstiges']}
                </p>
                {todayWorkout.fields.rest_day && (
                  <Badge className="bg-white/20 text-white text-xs mt-0.5">Ruhetag</Badge>
                )}
              </div>
            </div>
            {todayWorkout.fields.dauer_minuten && (
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Clock size={14} />
                <span>{todayWorkout.fields.dauer_minuten} Min</span>
              </div>
            )}
            <Badge className="bg-white/20 text-white border-0">
              {todayLogs.length} Sätze
            </Badge>
          </div>

          {/* Exercises */}
          <div className="divide-y divide-border">
            {Object.keys(logsByExercise).length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                Noch keine Übungen eingetragen. Klicke oben auf "Satz eintragen".
              </div>
            ) : (
              Object.entries(logsByExercise).map(([exId, logs]) => {
                const exercise = exerciseMap.get(exId);
                const isExpanded = expandedExercise === exId;
                return (
                  <div key={exId}>
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : exId)}
                      className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <Dumbbell size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-600 text-sm text-foreground truncate">
                          {exercise?.fields.name ?? 'Unbekannte Übung'}
                        </p>
                        <p className="text-xs text-muted-foreground">{logs.length} Sätze</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-500">
                          {Math.max(...logs.map(l => l.fields.gewicht ?? 0))} kg max
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-3 bg-muted/30">
                        <div className="space-y-1">
                          {logs
                            .sort((a, b) => (a.fields.satz_nummer ?? 0) - (b.fields.satz_nummer ?? 0))
                            .map(log => (
                              <div key={log.record_id}
                                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-card">
                                <span className="text-xs font-700 text-primary w-6">
                                  S{log.fields.satz_nummer}
                                </span>
                                <span className="text-sm font-500 flex-1">
                                  {log.fields.gewicht ?? '–'} kg × {log.fields.wiederholungen ?? '–'}
                                </span>
                                {log.fields.rpe && (
                                  <Badge variant="secondary" className="text-xs">
                                    RPE {RPE_LABELS[log.fields.rpe]}
                                  </Badge>
                                )}
                                <button
                                  onClick={() => handleDeleteLog(log.record_id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Workout Dialog */}
      <Dialog open={showWorkoutForm} onOpenChange={setShowWorkoutForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Training starten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Trainingstyp</Label>
              <Select value={workoutForm.typ} onValueChange={v => setWorkoutForm(f => ({ ...f, typ: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dauer (Minuten)</Label>
              <Input type="number" placeholder="z.B. 60" className="mt-1.5"
                value={workoutForm.dauer_minuten}
                onChange={e => setWorkoutForm(f => ({ ...f, dauer_minuten: e.target.value }))} />
            </div>
            <div>
              <Label>Stimmung</Label>
              <div className="flex gap-2 mt-1.5">
                {Object.entries(STIMMUNG_EMOJI).map(([k, emoji]) => (
                  <button key={k}
                    onClick={() => setWorkoutForm(f => ({ ...f, stimmung: k }))}
                    className={`flex-1 py-2 rounded-xl text-xl transition-all ${
                      workoutForm.stimmung === k
                        ? 'bg-primary/15 ring-2 ring-primary'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted cursor-pointer"
              onClick={() => setWorkoutForm(f => ({ ...f, rest_day: !f.rest_day }))}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                workoutForm.rest_day ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {workoutForm.rest_day && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-500">Ruhetag</span>
            </div>
            <Button onClick={handleCreateWorkout} disabled={saving} className="w-full bg-primary text-primary-foreground">
              {saving ? 'Wird gespeichert...' : 'Training starten'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Log Dialog */}
      <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Satz eintragen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Übung</Label>
              <Select value={logForm.uebung} onValueChange={v => setLogForm(f => ({ ...f, uebung: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Übung wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {uebungen.map(u => (
                    <SelectItem key={u.record_id} value={u.record_id}>
                      {u.fields.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Satz #</Label>
                <Input type="number" className="mt-1.5"
                  value={logForm.satz_nummer}
                  onChange={e => setLogForm(f => ({ ...f, satz_nummer: e.target.value }))} />
              </div>
              <div>
                <Label>Gewicht (kg)</Label>
                <Input type="number" className="mt-1.5" placeholder="80"
                  value={logForm.gewicht}
                  onChange={e => setLogForm(f => ({ ...f, gewicht: e.target.value }))} />
              </div>
              <div>
                <Label>Wiederh.</Label>
                <Input type="number" className="mt-1.5" placeholder="10"
                  value={logForm.wiederholungen}
                  onChange={e => setLogForm(f => ({ ...f, wiederholungen: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>RPE (Anstrengung 1-10)</Label>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {Object.entries(RPE_LABELS).map(([k, v]) => (
                  <button key={k}
                    onClick={() => setLogForm(f => ({ ...f, rpe: k }))}
                    className={`w-9 h-9 rounded-lg text-xs font-700 transition-all ${
                      logForm.rpe === k
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleAddLog} disabled={saving || !logForm.uebung}
              className="w-full bg-primary text-primary-foreground">
              {saving ? 'Wird gespeichert...' : 'Satz speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
