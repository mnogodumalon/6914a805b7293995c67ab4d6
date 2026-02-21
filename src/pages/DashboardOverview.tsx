import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isToday, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, Uebungen } from '@/types/app';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  Dumbbell, Utensils, TrendingUp, Target, Flame, Zap,
  Plus, CheckCircle2, Clock, Activity, Weight
} from 'lucide-react';

// ---- Helpers ----
const today = format(new Date(), 'yyyy-MM-dd');

function getMoodEmoji(mood?: string) {
  const map: Record<string, string> = { schlecht: '😞', okay: '😐', gut: '😊', brutal: '🔥' };
  return mood ? map[mood] ?? '—' : '—';
}
function getTypLabel(typ?: string) {
  const map: Record<string, string> = {
    push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
    oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
  };
  return typ ? map[typ] ?? typ : '—';
}
function getMahlzeitLabel(typ?: string) {
  const map: Record<string, string> = {
    fruehstueck: 'Frühstück', snack: 'Snack', mittagessen: 'Mittagessen',
    abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges'
  };
  return typ ? map[typ] ?? typ : '—';
}

// ---- Skeleton ----
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ''}`} />;
}

// ---- Circular Progress ----
function CircleProgress({ value, max, label, color, unit }: {
  value: number; max: number; label: string; color: string; unit: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-tight" style={{ color }}>{Math.round(value)}</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  );
}

// ---- Quick Add Workout Log Form ----
function QuickWorkoutForm({ uebungen, onSave, onCancel }: {
  uebungen: Uebungen[];
  onSave: (exerciseId: string, satz: number, gewicht: number, wiederholungen: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [exerciseId, setExerciseId] = useState('');
  const [satz, setSatz] = useState(1);
  const [gewicht, setGewicht] = useState(0);
  const [wdh, setWdh] = useState(8);
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-3">
      <select
        value={exerciseId}
        onChange={e => setExerciseId(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Übung wählen…</option>
        {uebungen.map(u => (
          <option key={u.record_id} value={u.record_id}>{u.fields.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Satz', val: satz, set: setSatz, min: 1, step: 1 },
          { label: 'Gewicht (kg)', val: gewicht, set: setGewicht, min: 0, step: 0.5 },
          { label: 'Wdh.', val: wdh, set: setWdh, min: 1, step: 1 },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type="number" min={f.min} step={f.step} value={f.val}
              onChange={e => f.set(+e.target.value)}
              className="w-full px-2 py-2 rounded-xl border border-border bg-card text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          Abbrechen
        </button>
        <button
          disabled={!exerciseId || saving}
          onClick={async () => { setSaving(true); await onSave(exerciseId, satz, gewicht, wdh); setSaving(false); }}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

// ---- Quick Add Meal Form ----
function QuickMealForm({ onSave, onCancel }: {
  onSave: (fields: Ernaehrung['fields']) => Promise<void>;
  onCancel: () => void;
}) {
  const mealTypes = ['fruehstueck', 'snack', 'mittagessen', 'abendessen', 'pre_workout', 'post_workout'] as const;
  const [typ, setTyp] = useState<string>('snack');
  const [beschreibung, setBeschreibung] = useState('');
  const [kalorien, setKalorien] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fett, setFett] = useState(0);
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {mealTypes.map(t => (
          <button key={t} onClick={() => setTyp(t)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
              typ === t ? 'border-primary text-primary bg-accent' : 'border-border text-muted-foreground hover:bg-muted'
            }`}>
            {getMahlzeitLabel(t)}
          </button>
        ))}
      </div>
      <input
        placeholder="Beschreibung (optional)"
        value={beschreibung}
        onChange={e => setBeschreibung(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Kalorien (kcal)', val: kalorien, set: setKalorien },
          { label: 'Protein (g)', val: protein, set: setProtein },
          { label: 'Carbs (g)', val: carbs, set: setCarbs },
          { label: 'Fett (g)', val: fett, set: setFett },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type="number" min={0} value={f.val}
              onChange={e => f.set(+e.target.value)}
              className="w-full px-2 py-2 rounded-xl border border-border bg-card text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          Abbrechen
        </button>
        <button
          disabled={saving || kalorien === 0}
          onClick={async () => {
            setSaving(true);
            await onSave({
              datum: today,
              mahlzeit_typ: typ as Ernaehrung['fields']['mahlzeit_typ'],
              beschreibung: beschreibung || undefined,
              kalorien, protein, carbs, fett
            });
            setSaving(false);
          }}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function DashboardOverview() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [nutrition, setNutrition] = useState<Ernaehrung[]>([]);
  const [koerper, setKoerper] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getWorkouts(),
      LivingAppsService.getErnaehrung(),
      LivingAppsService.getKoerperdaten(),
      LivingAppsService.getZiele(),
      LivingAppsService.getUebungen(),
    ]).then(([w, n, k, z, u]) => {
      setWorkouts(w);
      setNutrition(n);
      setKoerper(k);
      setZiele(z);
      setUebungen(u);
    }).catch(e => setError(e instanceof Error ? e.message : 'Fehler')).finally(() => setLoading(false));
  }, []);

  // --- Derived data ---
  const activeZiel = useMemo(() => ziele.find(z => z.fields.status === 'aktiv') ?? ziele[0], [ziele]);
  const todayWorkout = useMemo(() => workouts.find(w => w.fields.datum === today), [workouts]);

  const todayNutrition = useMemo(() => nutrition.filter(n => n.fields.datum === today), [nutrition]);
  const todayKalorien = useMemo(() => todayNutrition.reduce((s, n) => s + (n.fields.kalorien ?? 0), 0), [todayNutrition]);
  const todayProtein = useMemo(() => todayNutrition.reduce((s, n) => s + (n.fields.protein ?? 0), 0), [todayNutrition]);
  const todayCarbs = useMemo(() => todayNutrition.reduce((s, n) => s + (n.fields.carbs ?? 0), 0), [todayNutrition]);
  const todayFett = useMemo(() => todayNutrition.reduce((s, n) => s + (n.fields.fett ?? 0), 0), [todayNutrition]);

  const weightTrend = useMemo(() =>
    [...koerper]
      .filter(k => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''))
      .slice(-8)
      .map(k => ({
        date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      })),
    [koerper]);

  const latestKoerper = useMemo(() =>
    [...koerper].sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? ''))[0],
    [koerper]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekWorkouts = useMemo(() =>
    workouts.filter(w => {
      if (!w.fields.datum) return false;
      const d = parseISO(w.fields.datum);
      return d >= weekStart && d <= weekEnd && !w.fields.rest_day;
    }),
    [workouts]);

  const calorieChart = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const kcal = nutrition
        .filter(n => n.fields.datum === d)
        .reduce((s, n) => s + (n.fields.kalorien ?? 0), 0);
      return { date: format(parseISO(d), 'EEE', { locale: de }), kcal };
    }),
    [nutrition]);

  // ---- Actions ----
  async function handleAddWorkoutLog(exerciseId: string, satz: number, gewicht: number, wiederholungen: number) {
    let workoutId = todayWorkout?.record_id;
    if (!workoutId) {
      const created = await LivingAppsService.createWorkout({ datum: today, typ: 'sonstiges' });
      workoutId = created.record_id ?? created.id;
      const updated = await LivingAppsService.getWorkouts();
      setWorkouts(updated);
    }
    await LivingAppsService.createWorkoutLog({
      workout: createRecordUrl(APP_IDS.WORKOUTS, workoutId!),
      uebung: createRecordUrl(APP_IDS.UEBUNGEN, exerciseId),
      satz_nummer: satz,
      gewicht,
      wiederholungen,
    });
    setShowWorkoutForm(false);
  }

  async function handleAddMeal(fields: Ernaehrung['fields']) {
    await LivingAppsService.createErnaehrungEntry(fields);
    const updated = await LivingAppsService.getErnaehrung();
    setNutrition(updated);
    setShowMealForm(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="col-span-2 h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-2">
          <p className="text-destructive font-semibold">Fehler beim Laden</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const goalKcal = activeZiel?.fields.taeglich_kalorien ?? 2000;
  const goalProtein = activeZiel?.fields.taeglich_protein ?? 150;
  const goalTraining = activeZiel?.fields.trainingstage_pro_woche ?? 4;

  return (
    <div className="space-y-5 pb-8" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
          </p>
          <h1 className="text-3xl font-extrabold text-foreground mt-0.5 leading-tight">Heute</h1>
        </div>
        {todayWorkout && !todayWorkout.fields.rest_day && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mt-1">
            <CheckCircle2 size={13} /> Training erledigt
          </span>
        )}
      </div>

      {/* ---- Top Row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Today's Workout */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.92 0.06 145)' }}>
                <Dumbbell size={15} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="font-bold text-sm">Heutiges Training</span>
            </div>
            <button
              onClick={() => setShowWorkoutForm(v => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              style={{ color: 'var(--primary)' }}
              title="Übung loggen"
            >
              <Plus size={16} />
            </button>
          </div>

          {showWorkoutForm && (
            <QuickWorkoutForm
              uebungen={uebungen}
              onSave={handleAddWorkoutLog}
              onCancel={() => setShowWorkoutForm(false)}
            />
          )}

          {todayWorkout ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--gradient-primary)' }}>
                  {getTypLabel(todayWorkout.fields.typ)}
                </span>
                {todayWorkout.fields.rest_day && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground">Ruhetag</span>
                )}
                {todayWorkout.fields.stimmung && (
                  <span className="text-xl">{getMoodEmoji(todayWorkout.fields.stimmung)}</span>
                )}
              </div>
              {todayWorkout.fields.dauer_minuten && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock size={13} />
                  <span>{todayWorkout.fields.dauer_minuten} Min.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-5 text-center">
              <Activity size={30} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Noch kein Training erfasst</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">Klicke + um eine Übung zu loggen</p>
            </div>
          )}
        </div>

        {/* Body Weight */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50">
              <Weight size={15} className="text-blue-500" />
            </div>
            <span className="font-bold text-sm">Gewicht</span>
          </div>
          {latestKoerper ? (
            <>
              <p className="text-3xl font-extrabold text-foreground leading-none">
                {latestKoerper.fields.gewicht_kg?.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">kg</p>
              {latestKoerper.fields.kfa_geschaetzt != null && (
                <p className="text-xs text-muted-foreground mt-1.5">KFA: {latestKoerper.fields.kfa_geschaetzt}%</p>
              )}
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {format(parseISO(latestKoerper.fields.datum ?? latestKoerper.createdat), 'dd.MM.yyyy')}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Keine Daten</p>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-50">
              <Target size={15} className="text-orange-500" />
            </div>
            <span className="font-bold text-sm">Diese Woche</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground leading-none">
            {weekWorkouts.length}
            <span className="text-base font-normal text-muted-foreground">/{goalTraining}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Trainingstage</p>
          <div className="flex gap-1 mt-auto">
            {weekDays.map((d, i) => {
              const ds = format(d, 'yyyy-MM-dd');
              const done = workouts.some(w => w.fields.datum === ds && !w.fields.rest_day);
              const curr = isToday(d);
              return (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${
                  done ? 'bg-primary' : curr ? 'bg-muted-foreground/20' : 'bg-muted'
                }`} />
              );
            })}
          </div>
          <div className="flex mt-1">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => (
              <span key={i} className={`flex-1 text-center text-[9px] ${isToday(weekDays[i]) ? 'font-bold text-primary' : 'text-muted-foreground/40'}`}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Nutrition Hero ---- */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-50">
              <Utensils size={15} className="text-orange-500" />
            </div>
            <span className="font-bold text-base">Ernährung heute</span>
          </div>
          <button
            onClick={() => setShowMealForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <Plus size={12} /> Mahlzeit
          </button>
        </div>

        {showMealForm && (
          <div className="mb-4">
            <QuickMealForm onSave={handleAddMeal} onCancel={() => setShowMealForm(false)} />
          </div>
        )}

        {/* Macro Rings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <CircleProgress value={todayKalorien} max={goalKcal} label="Kalorien" unit="kcal" color="oklch(0.62 0.18 30)" />
          <CircleProgress value={todayProtein} max={goalProtein} label="Protein" unit="g" color="oklch(0.55 0.2 145)" />
          <CircleProgress value={todayCarbs} max={300} label="Carbs" unit="g" color="oklch(0.55 0.15 220)" />
          <CircleProgress value={todayFett} max={80} label="Fett" unit="g" color="oklch(0.62 0.18 280)" />
        </div>

        {/* Meal List */}
        {todayNutrition.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Mahlzeiten</p>
            {todayNutrition.map(n => (
              <div key={n.record_id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Flame size={13} className="text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{getMahlzeitLabel(n.fields.mahlzeit_typ)}</p>
                    {n.fields.beschreibung && (
                      <p className="text-xs text-muted-foreground truncate">{n.fields.beschreibung}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
                  <span className="font-semibold text-foreground">{n.fields.kalorien ?? 0} kcal</span>
                  <span className="hidden sm:inline">{n.fields.protein ?? 0}g P</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Noch keine Mahlzeiten heute erfasst
          </div>
        )}
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calorie Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={15} className="text-orange-500" />
            <span className="font-bold text-sm">Kalorien (7 Tage)</span>
            {goalKcal > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">Ziel: {goalKcal} kcal</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={calorieChart} barSize={18}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }}
                formatter={(v: number) => [`${v} kcal`, 'Kalorien']}
              />
              <Bar dataKey="kcal" fill="oklch(0.62 0.18 30)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Trend */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
            <span className="font-bold text-sm">Gewichtsverlauf</span>
          </div>
          {weightTrend.length >= 2 ? (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={weightTrend}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.2 145)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="oklch(0.55 0.2 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }}
                  formatter={(v: number) => [`${v} kg`, 'Gewicht']}
                />
                <Area type="monotone" dataKey="gewicht" stroke="oklch(0.55 0.2 145)" strokeWidth={2.5}
                  fill="url(#weightGrad)" dot={{ r: 4, fill: 'oklch(0.55 0.2 145)', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">
              Mindestens 2 Messungen nötig
            </div>
          )}
        </div>
      </div>

      {/* ---- Goals ---- */}
      {activeZiel && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-50">
                <Zap size={15} className="text-purple-500" />
              </div>
              <span className="font-bold text-sm">Aktive Ziele</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              activeZiel.fields.status === 'aktiv' ? 'bg-accent text-accent-foreground' :
              activeZiel.fields.status === 'erreicht' ? 'bg-green-100 text-green-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {activeZiel.fields.status === 'aktiv' ? 'Aktiv' :
               activeZiel.fields.status === 'erreicht' ? 'Erreicht ✓' : 'Verworfen'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Kalorien/Tag', val: activeZiel.fields.taeglich_kalorien, unit: 'kcal' },
              { label: 'Protein/Tag', val: activeZiel.fields.taeglich_protein, unit: 'g' },
              { label: 'Training/Woche', val: activeZiel.fields.trainingstage_pro_woche, unit: 'Tage' },
              { label: 'Schlaf/Nacht', val: activeZiel.fields.schlaf_ziel_stunden, unit: 'h' },
            ].filter(g => g.val != null).map(g => (
              <div key={g.label} className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">{g.label}</p>
                <p className="text-2xl font-extrabold leading-none">{g.val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.unit}</p>
              </div>
            ))}
          </div>
          {activeZiel.fields.notizen && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
              {activeZiel.fields.notizen}
            </p>
          )}
        </div>
      )}

      {/* ---- Body Measurements ---- */}
      {latestKoerper && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50">
                <Activity size={15} className="text-blue-500" />
              </div>
              <span className="font-bold text-sm">Letzte Körpermessung</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(latestKoerper.fields.datum ?? latestKoerper.createdat), 'dd.MM.yyyy')}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'Brust', val: latestKoerper.fields.brustumfang, unit: 'cm' },
              { label: 'Taille', val: latestKoerper.fields.taillenumfang, unit: 'cm' },
              { label: 'Hüfte', val: latestKoerper.fields.hueftumfang, unit: 'cm' },
              { label: 'Arm', val: latestKoerper.fields.armumfang, unit: 'cm' },
              { label: 'Bein', val: latestKoerper.fields.beinumfang, unit: 'cm' },
              { label: 'KFA', val: latestKoerper.fields.kfa_geschaetzt, unit: '%' },
            ].filter(m => m.val != null).map(m => (
              <div key={m.label} className="text-center py-2.5 px-1 rounded-xl bg-muted/40">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">{m.label}</p>
                <p className="text-lg font-extrabold leading-none">{m.val}</p>
                <p className="text-[10px] text-muted-foreground">{m.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
