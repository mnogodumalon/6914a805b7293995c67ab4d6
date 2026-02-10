import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Uebungen, Workouts, WorkoutLogs, Ziele, Ernaehrung, Koerperdaten } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
  Plus, Dumbbell, Clock, Scale, TrendingUp, TrendingDown,
  Pencil, Trash2, AlertCircle, UtensilsCrossed, Target,
  Activity, ChevronRight,
} from 'lucide-react';

// ─── LOOKUP MAPS ─────────────────────────────────────────────
const MUSKELGRUPPE_LABELS: Record<string, string> = {
  brust: 'Brust', ruecken: 'Rücken', beine: 'Beine', schultern: 'Schultern',
  bizeps: 'Bizeps', trizeps: 'Trizeps', bauch: 'Bauch', ganzkoerper: 'Ganzkörper',
};
const EQUIPMENT_LABELS: Record<string, string> = {
  langhantel: 'Langhantel', kurzhantel: 'Kurzhantel', maschine: 'Maschine',
  kabelzug: 'Kabelzug', bodyweight: 'Bodyweight', kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band', sonstiges: 'Sonstiges',
};
const SCHWIERIGKEIT_LABELS: Record<string, string> = {
  anfaenger: 'Anfänger', fortgeschritten: 'Fortgeschritten', experte: 'Experte',
};
const WORKOUT_TYP_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges',
};
const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht', okay: 'Okay', gut: 'Gut', brutal: 'Brutal',
};
const STIMMUNG_EMOJI: Record<string, string> = {
  schlecht: '😞', okay: '😐', gut: '😊', brutal: '🔥',
};
const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück', snack: 'Snack', mittagessen: 'Mittagessen',
  abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges',
};
const MAHLZEIT_ORDER: string[] = ['fruehstueck', 'snack', 'mittagessen', 'abendessen', 'pre_workout', 'post_workout', 'sonstiges'];
const RPE_LABELS: Record<string, string> = {
  rpe_1: '1 - Sehr leicht', rpe_2: '2', rpe_3: '3', rpe_4: '4', rpe_5: '5 - Mittel',
  rpe_6: '6', rpe_7: '7', rpe_8: '8', rpe_9: '9', rpe_10: '10 - Maximal',
};
const ZIEL_STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv', erreicht: 'Erreicht', verworfen: 'Verworfen',
};
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ─── HELPERS ─────────────────────────────────────────────────
function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekInterval() {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
}

function formatNum(v: number | null | undefined, decimals = 0): string {
  if (v == null) return '-';
  return v.toFixed(decimals);
}

// ─── PROGRESS RING SVG ──────────────────────────────────────
function ProgressRing({ size, strokeWidth, progress, color, bgColor = 'hsl(30 15% 88%)' }: {
  size: number; strokeWidth: number; progress: number; color: string; bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference - clamped * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={bgColor} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
    </svg>
  );
}

// ─── DELETE CONFIRM ──────────────────────────────────────────
function DeleteConfirm({ open, onOpenChange, name, onConfirm, deleting }: {
  open: boolean; onOpenChange: (o: boolean) => void; name: string;
  onConfirm: () => void; deleting: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du &quot;{name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90">
            {deleting ? 'Löscht...' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  // ─── STATE ─────────────────────────────────────────────────
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [ernaehrungDialog, setErnaehrungDialog] = useState(false);
  const [editErnaehrung, setEditErnaehrung] = useState<Ernaehrung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [workoutDialog, setWorkoutDialog] = useState(false);
  const [editWorkout, setEditWorkout] = useState<Workouts | null>(null);

  const [workoutLogDialog, setWorkoutLogDialog] = useState(false);
  const [editWorkoutLog, setEditWorkoutLog] = useState<WorkoutLogs | null>(null);

  const [uebungDialog, setUebungDialog] = useState(false);
  const [editUebung, setEditUebung] = useState<Uebungen | null>(null);

  const [zieleDialog, setZieleDialog] = useState(false);
  const [editZiel, setEditZiel] = useState<Ziele | null>(null);

  const [koerperdatenDialog, setKoerperdatenDialog] = useState(false);
  const [editKoerperdaten, setEditKoerperdaten] = useState<Koerperdaten | null>(null);

  const [activeManageTab, setActiveManageTab] = useState('ernaehrung');

  // ─── DATA FETCHING ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, w, wl, z, e, k] = await Promise.all([
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkouts(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getZiele(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
      ]);
      setUebungen(u); setWorkouts(w); setWorkoutLogs(wl);
      setZiele(z); setErnaehrung(e); setKoerperdaten(k);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── COMPUTED DATA ─────────────────────────────────────────
  const today = todayStr();
  const weekInterval = useMemo(() => getWeekInterval(), []);

  const activeZiel = useMemo(() =>
    ziele.find(z => z.fields.status === 'aktiv'), [ziele]);

  const todayMeals = useMemo(() =>
    ernaehrung
      .filter(e => e.fields.datum === today)
      .sort((a, b) => {
        const ai = MAHLZEIT_ORDER.indexOf(a.fields.mahlzeit_typ || '');
        const bi = MAHLZEIT_ORDER.indexOf(b.fields.mahlzeit_typ || '');
        return ai - bi;
      }),
    [ernaehrung, today]);

  const todayCalories = useMemo(() =>
    todayMeals.reduce((s, m) => s + (m.fields.kalorien || 0), 0), [todayMeals]);
  const todayProtein = useMemo(() =>
    todayMeals.reduce((s, m) => s + (m.fields.protein || 0), 0), [todayMeals]);

  const calGoal = activeZiel?.fields.taeglich_kalorien || 2000;
  const protGoal = activeZiel?.fields.taeglich_protein || 150;
  const calProgress = calGoal > 0 ? todayCalories / calGoal : 0;
  const protProgress = protGoal > 0 ? todayProtein / protGoal : 0;

  const weekWorkouts = useMemo(() =>
    workouts.filter(w => {
      if (w.fields.rest_day) return false;
      const d = w.fields.datum;
      if (!d) return false;
      try {
        const parsed = parseISO(d.split('T')[0]);
        return isWithinInterval(parsed, weekInterval);
      } catch { return false; }
    }), [workouts, weekInterval]);

  const weekWorkoutGoal = activeZiel?.fields.trainingstage_pro_woche || 5;
  const avgDuration = useMemo(() => {
    const durations = weekWorkouts.map(w => w.fields.dauer_minuten).filter((d): d is number => d != null);
    return durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }, [weekWorkouts]);

  const sortedKoerperdaten = useMemo(() =>
    [...koerperdaten].sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || '')),
    [koerperdaten]);
  const latestWeight = sortedKoerperdaten[0]?.fields.gewicht_kg;
  const prevWeight = sortedKoerperdaten[1]?.fields.gewicht_kg;
  const weightDelta = (latestWeight != null && prevWeight != null) ? latestWeight - prevWeight : null;

  // Weekly chart data
  const weekChartData = useMemo(() => {
    const week = weekInterval;
    return DAY_LABELS.map((label, i) => {
      const dayDate = new Date(week.start);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const dayWorkouts = workouts.filter(w => {
        const wd = w.fields.datum?.split('T')[0];
        return wd === dayStr && !w.fields.rest_day;
      });
      const duration = dayWorkouts.reduce((s, w) => s + (w.fields.dauer_minuten || 0), 0);
      const isRest = workouts.some(w => w.fields.datum?.split('T')[0] === dayStr && w.fields.rest_day);
      return { label, duration, isRest, count: dayWorkouts.length };
    });
  }, [workouts, weekInterval]);

  // Weight chart data (last 30 days)
  const weightChartData = useMemo(() =>
    [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
      .slice(-30)
      .map(k => ({
        date: format(parseISO(k.fields.datum!.split('T')[0]), 'dd.MM'),
        gewicht: k.fields.gewicht_kg,
      })),
    [koerperdaten]);

  // Recent workouts (non-rest, last 5)
  const recentWorkouts = useMemo(() =>
    [...workouts]
      .filter(w => !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5),
    [workouts]);

  // Uebung lookup map
  const uebungMap = useMemo(() => {
    const m = new Map<string, Uebungen>();
    uebungen.forEach(u => m.set(u.record_id, u));
    return m;
  }, [uebungen]);

  // ─── DELETE HANDLER ────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      switch (deleteTarget.type) {
        case 'ernaehrung': await LivingAppsService.deleteErnaehrungEntry(deleteTarget.id); break;
        case 'workout': await LivingAppsService.deleteWorkout(deleteTarget.id); break;
        case 'workoutLog': await LivingAppsService.deleteWorkoutLog(deleteTarget.id); break;
        case 'uebung': await LivingAppsService.deleteUebungenEntry(deleteTarget.id); break;
        case 'ziel': await LivingAppsService.deleteZieleEntry(deleteTarget.id); break;
        case 'koerperdaten': await LivingAppsService.deleteKoerperdatenEntry(deleteTarget.id); break;
      }
      toast.success('Gelöscht', { description: `"${deleteTarget.name}" wurde gelöscht.` });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error('Fehler', { description: 'Eintrag konnte nicht gelöscht werden.' });
    } finally {
      setDeleting(false);
    }
  }

  // ─── LOADING STATE ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 font-[Outfit]">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex justify-center"><Skeleton className="h-60 w-60 rounded-full" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ───────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-[Outfit]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchAll}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background font-[Outfit] pb-20 md:pb-8">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Fitness Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditWorkout(null); setWorkoutDialog(true); }}>
              <Dumbbell className="h-4 w-4 mr-1" /> Workout
            </Button>
            <Button size="sm" onClick={() => { setEditErnaehrung(null); setErnaehrungDialog(true); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> Mahlzeit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6">
        {/* DESKTOP: 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN (65%) */}
          <div className="flex-1 lg:max-w-[65%] space-y-8">
            {/* HERO SECTION */}
            <section className="flex flex-col md:flex-row items-center gap-8 pt-4">
              {/* Progress Rings */}
              <div className="relative flex-shrink-0">
                <div className="relative w-[240px] h-[240px] md:w-[300px] md:h-[300px]">
                  {/* Outer ring - Calories */}
                  <div className="absolute inset-0">
                    <ProgressRing
                      size={240} strokeWidth={10} progress={calProgress}
                      color="hsl(14 70% 50%)"
                    />
                  </div>
                  <div className="absolute inset-0 hidden md:block">
                    <ProgressRing
                      size={300} strokeWidth={10} progress={calProgress}
                      color="hsl(14 70% 50%)"
                    />
                  </div>
                  {/* Inner ring - Protein */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <ProgressRing
                      size={160} strokeWidth={6} progress={protProgress}
                      color="hsl(40 60% 50%)"
                    />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <ProgressRing
                      size={200} strokeWidth={6} progress={protProgress}
                      color="hsl(40 60% 50%)"
                    />
                  </div>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[48px] font-bold leading-none tracking-tight">{todayCalories}</span>
                    <span className="text-base font-light text-muted-foreground">/ {calGoal} kcal</span>
                    <span className="text-sm font-medium mt-2 text-accent-foreground">
                      {todayProtein}g / {protGoal}g Protein
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero side info (desktop) */}
              <div className="hidden md:flex flex-col gap-4 flex-1">
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Tagesfortschritt</h2>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(calProgress * 100)}% deines Kalorienziels erreicht
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Kohlenhydrate</div>
                    <div className="text-lg font-semibold">
                      {todayMeals.reduce((s, m) => s + (m.fields.carbs || 0), 0)}g
                    </div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Protein</div>
                    <div className="text-lg font-semibold">{todayProtein}g</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Fett</div>
                    <div className="text-lg font-semibold">
                      {todayMeals.reduce((s, m) => s + (m.fields.fett || 0), 0)}g
                    </div>
                  </div>
                </div>
                <Button onClick={() => { setEditErnaehrung(null); setErnaehrungDialog(true); }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit">
                  <UtensilsCrossed className="h-4 w-4 mr-2" /> Mahlzeit erfassen
                </Button>
              </div>
            </section>

            {/* QUICK STATS ROW */}
            <section className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              <StatBadge icon={<Dumbbell className="h-4 w-4" />} label="Workouts"
                value={`${weekWorkouts.length} / ${weekWorkoutGoal}`} />
              <StatBadge icon={<Clock className="h-4 w-4" />} label="Ø Dauer"
                value={`${avgDuration} min`} />
              <StatBadge icon={<Scale className="h-4 w-4" />} label="Gewicht"
                value={latestWeight != null ? `${formatNum(latestWeight, 1)} kg` : '-'} />
              <StatBadge
                icon={weightDelta != null
                  ? (weightDelta <= 0 ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-500" />)
                  : <Scale className="h-4 w-4" />}
                label="Trend"
                value={weightDelta != null ? `${weightDelta > 0 ? '+' : ''}${formatNum(weightDelta, 1)} kg` : '-'} />
            </section>

            {/* WEEKLY CHART */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Diese Woche</h3>
              <Card>
                <CardContent className="pt-4 pb-2">
                  <div className="h-[200px] md:h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekChartData} barCategoryGap="20%">
                        <XAxis dataKey="label" tick={{ fontSize: 13, fill: 'hsl(20 5% 45%)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: 'hsl(20 5% 45%)' }} axisLine={false} tickLine={false} width={35} unit=" min" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(36 33% 99%)', border: '1px solid hsl(30 15% 88%)', borderRadius: '8px', fontFamily: 'Outfit' }}
                          formatter={(value: number) => [`${value} min`, 'Dauer']}
                        />
                        <Bar dataKey="duration" fill="hsl(14 70% 50%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* RECENT WORKOUTS */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Letzte Workouts</h3>
                <Button size="sm" variant="ghost" onClick={() => { setEditWorkout(null); setWorkoutDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {recentWorkouts.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Noch keine Workouts. Starte dein erstes Training!</p>
                  <Button size="sm" className="mt-3" onClick={() => { setEditWorkout(null); setWorkoutDialog(true); }}>
                    Workout starten
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {recentWorkouts.map(w => (
                    <Card key={w.record_id}
                      className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground w-20">
                            {w.fields.datum ? format(parseISO(w.fields.datum.split('T')[0]), 'dd.MM.yy') : '-'}
                          </div>
                          <Badge variant="secondary">
                            {WORKOUT_TYP_LABELS[w.fields.typ || ''] || w.fields.typ || '-'}
                          </Badge>
                          {w.fields.dauer_minuten != null && (
                            <span className="text-sm text-muted-foreground">{w.fields.dauer_minuten} min</span>
                          )}
                          {w.fields.stimmung && (
                            <span className="text-sm">{STIMMUNG_EMOJI[w.fields.stimmung]}</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setEditWorkout(w); setWorkoutDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'workout', id: w.record_id, name: `Workout vom ${w.fields.datum || '?'}` });
                            }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN (35%) */}
          <div className="lg:w-[35%] space-y-8">
            {/* TODAY'S MEALS */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Heute gegessen</h3>
                <Button size="sm" variant="ghost" onClick={() => { setEditErnaehrung(null); setErnaehrungDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Hinzufügen
                </Button>
              </div>
              {todayMeals.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Noch nichts gegessen heute.</p>
                  <Button size="sm" className="mt-3" onClick={() => { setEditErnaehrung(null); setErnaehrungDialog(true); }}>
                    Mahlzeit erfassen
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {todayMeals.map(m => (
                    <div key={m.record_id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => { setEditErnaehrung(m); setErnaehrungDialog(true); }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {MAHLZEIT_LABELS[m.fields.mahlzeit_typ || ''] || 'Sonstiges'}
                        </Badge>
                        <span className="text-sm truncate">{m.fields.beschreibung || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-medium">{m.fields.kalorien || 0} kcal</div>
                          <div className="text-xs text-muted-foreground">{m.fields.protein || 0}g P</div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); setEditErnaehrung(m); setErnaehrungDialog(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'ernaehrung', id: m.record_id, name: m.fields.beschreibung || 'Mahlzeit' });
                            }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* BODY PROGRESS */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Körperfortschritt</h3>
                <Button size="sm" variant="ghost" onClick={() => { setEditKoerperdaten(null); setKoerperdatenDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Messung
                </Button>
              </div>
              {weightChartData.length > 1 ? (
                <Card>
                  <CardContent className="pt-4 pb-2">
                    <div className="h-[160px] md:h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightChartData}>
                          <defs>
                            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(14 70% 50%)" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="hsl(14 70% 50%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(20 5% 45%)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'hsl(20 5% 45%)' }} axisLine={false} tickLine={false} width={40}
                            domain={['dataMin - 1', 'dataMax + 1']} unit=" kg" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(36 33% 99%)', border: '1px solid hsl(30 15% 88%)', borderRadius: '8px', fontFamily: 'Outfit' }}
                            formatter={(value: number) => [`${value} kg`, 'Gewicht']} />
                          <Area type="monotone" dataKey="gewicht" stroke="hsl(14 70% 50%)" strokeWidth={2}
                            fill="url(#weightFill)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">
                  <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Noch nicht genug Messungen für einen Verlauf.</p>
                  <Button size="sm" className="mt-3" variant="outline"
                    onClick={() => { setEditKoerperdaten(null); setKoerperdatenDialog(true); }}>
                    Messung erfassen
                  </Button>
                </CardContent></Card>
              )}

              {/* Latest measurements grid */}
              {sortedKoerperdaten.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: 'Brust', val: sortedKoerperdaten[0]?.fields.brustumfang },
                    { label: 'Taille', val: sortedKoerperdaten[0]?.fields.taillenumfang },
                    { label: 'Hüfte', val: sortedKoerperdaten[0]?.fields.hueftumfang },
                    { label: 'Arm', val: sortedKoerperdaten[0]?.fields.armumfang },
                    { label: 'Bein', val: sortedKoerperdaten[0]?.fields.beinumfang },
                    { label: 'KFA', val: sortedKoerperdaten[0]?.fields.kfa_geschaetzt },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center p-2 rounded-lg bg-muted/50 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{val != null ? `${formatNum(val, 1)} ${label === 'KFA' ? '%' : 'cm'}` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* GOALS */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Aktive Ziele</h3>
                <Button size="sm" variant="ghost" onClick={() => { setEditZiel(null); setZieleDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Ziel
                </Button>
              </div>
              {ziele.filter(z => z.fields.status === 'aktiv').length === 0 ? (
                <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Keine aktiven Ziele gesetzt.</p>
                  <Button size="sm" className="mt-3" variant="outline"
                    onClick={() => { setEditZiel(null); setZieleDialog(true); }}>
                    Ziel erstellen
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {ziele.filter(z => z.fields.status === 'aktiv').map(z => (
                    <Card key={z.record_id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => { setEditZiel(z); setZieleDialog(true); }}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Tagesziele</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); setEditZiel(z); setZieleDialog(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ type: 'ziel', id: z.record_id, name: 'Aktives Ziel' });
                              }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {z.fields.taeglich_kalorien != null && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Kalorien</span><span>{z.fields.taeglich_kalorien} kcal</span></div>
                          )}
                          {z.fields.taeglich_protein != null && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Protein</span><span>{z.fields.taeglich_protein}g</span></div>
                          )}
                          {z.fields.trainingstage_pro_woche != null && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Training/Woche</span><span>{z.fields.trainingstage_pro_woche}x</span></div>
                          )}
                          {z.fields.schlaf_ziel_stunden != null && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Schlaf</span><span>{z.fields.schlaf_ziel_stunden}h</span></div>
                          )}
                        </div>
                        {z.fields.notizen && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{z.fields.notizen}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* DATA MANAGEMENT */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Daten verwalten</h3>
              <Tabs value={activeManageTab} onValueChange={setActiveManageTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="ernaehrung" className="flex-1 text-xs">Ernährung</TabsTrigger>
                  <TabsTrigger value="uebungen" className="flex-1 text-xs">Übungen</TabsTrigger>
                  <TabsTrigger value="logs" className="flex-1 text-xs">Sätze</TabsTrigger>
                  <TabsTrigger value="koerper" className="flex-1 text-xs">Körper</TabsTrigger>
                </TabsList>

                {/* Ernährung Tab */}
                <TabsContent value="ernaehrung">
                  <div className="space-y-1 mt-2 max-h-[300px] overflow-y-auto">
                    {ernaehrung.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine Einträge</p>
                    ) : (
                      [...ernaehrung]
                        .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
                        .slice(0, 20)
                        .map(e => (
                          <div key={e.record_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-muted-foreground w-16 flex-shrink-0">
                                {e.fields.datum ? format(parseISO(e.fields.datum.split('T')[0]), 'dd.MM') : '-'}
                              </span>
                              <span className="truncate">{e.fields.beschreibung || MAHLZEIT_LABELS[e.fields.mahlzeit_typ || ''] || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-muted-foreground">{e.fields.kalorien || 0} kcal</span>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6"
                                  onClick={() => { setEditErnaehrung(e); setErnaehrungDialog(true); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                  onClick={() => setDeleteTarget({ type: 'ernaehrung', id: e.record_id, name: e.fields.beschreibung || 'Mahlzeit' })}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                {/* Übungen Tab */}
                <TabsContent value="uebungen">
                  <div className="flex justify-end mb-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditUebung(null); setUebungDialog(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Übung
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {uebungen.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine Übungen</p>
                    ) : (
                      uebungen.map(u => (
                        <div key={u.record_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.fields.name || '-'}</span>
                            {u.fields.muskelgruppe && (
                              <Badge variant="outline" className="text-xs">{MUSKELGRUPPE_LABELS[u.fields.muskelgruppe]}</Badge>
                            )}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => { setEditUebung(u); setUebungDialog(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => setDeleteTarget({ type: 'uebung', id: u.record_id, name: u.fields.name || 'Übung' })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Workout Logs Tab */}
                <TabsContent value="logs">
                  <div className="flex justify-end mb-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditWorkoutLog(null); setWorkoutLogDialog(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Satz
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {workoutLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine Sätze</p>
                    ) : (
                      [...workoutLogs].slice(0, 20).map(wl => {
                        const uId = extractRecordId(wl.fields.uebung);
                        const uName = uId ? uebungMap.get(uId)?.fields.name : null;
                        return (
                          <div key={wl.record_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{uName || 'Übung'}</span>
                              <span className="text-muted-foreground">
                                Satz {wl.fields.satz_nummer || '?'} · {wl.fields.gewicht || 0}kg × {wl.fields.wiederholungen || 0}
                              </span>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={() => { setEditWorkoutLog(wl); setWorkoutLogDialog(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                onClick={() => setDeleteTarget({ type: 'workoutLog', id: wl.record_id, name: `Satz ${wl.fields.satz_nummer || ''}` })}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                {/* Körperdaten Tab */}
                <TabsContent value="koerper">
                  <div className="space-y-1 mt-2 max-h-[300px] overflow-y-auto">
                    {sortedKoerperdaten.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine Messungen</p>
                    ) : (
                      sortedKoerperdaten.slice(0, 20).map(k => (
                        <div key={k.record_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-16">
                              {k.fields.datum ? format(parseISO(k.fields.datum.split('T')[0]), 'dd.MM.yy') : '-'}
                            </span>
                            <span className="font-medium">{k.fields.gewicht_kg != null ? `${formatNum(k.fields.gewicht_kg, 1)} kg` : '-'}</span>
                            {k.fields.kfa_geschaetzt != null && (
                              <span className="text-muted-foreground">KFA {formatNum(k.fields.kfa_geschaetzt, 1)}%</span>
                            )}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => { setEditKoerperdaten(k); setKoerperdatenDialog(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => setDeleteTarget({ type: 'koerperdaten', id: k.record_id, name: `Messung vom ${k.fields.datum || '?'}` })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </main>

      {/* MOBILE FIXED BOTTOM ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border md:hidden z-30">
        <Button className="w-full h-[52px] text-base bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => { setEditErnaehrung(null); setErnaehrungDialog(true); }}>
          <UtensilsCrossed className="h-5 w-5 mr-2" /> Mahlzeit erfassen
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DIALOGS */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* ERNÄHRUNG DIALOG */}
      <ErnaehrungFormDialog
        open={ernaehrungDialog}
        onOpenChange={setErnaehrungDialog}
        record={editErnaehrung}
        onSuccess={fetchAll}
      />

      {/* WORKOUT DIALOG */}
      <WorkoutFormDialog
        open={workoutDialog}
        onOpenChange={setWorkoutDialog}
        record={editWorkout}
        onSuccess={fetchAll}
      />

      {/* WORKOUT LOG DIALOG */}
      <WorkoutLogFormDialog
        open={workoutLogDialog}
        onOpenChange={setWorkoutLogDialog}
        record={editWorkoutLog}
        workouts={workouts}
        uebungen={uebungen}
        onSuccess={fetchAll}
      />

      {/* ÜBUNG DIALOG */}
      <UebungFormDialog
        open={uebungDialog}
        onOpenChange={setUebungDialog}
        record={editUebung}
        onSuccess={fetchAll}
      />

      {/* ZIELE DIALOG */}
      <ZieleFormDialog
        open={zieleDialog}
        onOpenChange={setZieleDialog}
        record={editZiel}
        onSuccess={fetchAll}
      />

      {/* KÖRPERDATEN DIALOG */}
      <KoerperdatenFormDialog
        open={koerperdatenDialog}
        onOpenChange={setKoerperdatenDialog}
        record={editKoerperdaten}
        onSuccess={fetchAll}
      />

      {/* DELETE CONFIRMATION */}
      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        name={deleteTarget?.name || ''}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}

// ─── STAT BADGE ──────────────────────────────────────────────
function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2.5 flex-shrink-0 snap-start">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-none">{label}</span>
        <span className="text-sm font-semibold leading-tight">{value}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORM DIALOGS
// ═══════════════════════════════════════════════════════════════

// ─── ERNÄHRUNG FORM ──────────────────────────────────────────
function ErnaehrungFormDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Ernaehrung | null; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    datum: todayStr(), mahlzeit_typ: 'mittagessen', beschreibung: '',
    kalorien: '', protein: '', carbs: '', fett: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] || todayStr(),
        mahlzeit_typ: record?.fields.mahlzeit_typ || 'mittagessen',
        beschreibung: record?.fields.beschreibung || '',
        kalorien: record?.fields.kalorien?.toString() || '',
        protein: record?.fields.protein?.toString() || '',
        carbs: record?.fields.carbs?.toString() || '',
        fett: record?.fields.fett?.toString() || '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: Ernaehrung['fields'] = {
      datum: form.datum,
      mahlzeit_typ: form.mahlzeit_typ as Ernaehrung['fields']['mahlzeit_typ'],
      beschreibung: form.beschreibung,
      kalorien: form.kalorien ? Number(form.kalorien) : undefined,
      protein: form.protein ? Number(form.protein) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fett: form.fett ? Number(form.fett) : undefined,
    };
    try {
      if (isEditing) {
        await LivingAppsService.updateErnaehrungEntry(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Mahlzeit wurde aktualisiert.' });
      } else {
        await LivingAppsService.createErnaehrungEntry(data);
        toast.success('Erstellt', { description: 'Mahlzeit wurde erfasst.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Mahlzeit bearbeiten' : 'Mahlzeit erfassen'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ändere die Daten dieser Mahlzeit.' : 'Erfasse was du gegessen hast.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-datum">Datum</Label>
              <Input id="e-datum" type="date" value={form.datum}
                onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Mahlzeitentyp</Label>
              <Select value={form.mahlzeit_typ} onValueChange={v => setForm(p => ({ ...p, mahlzeit_typ: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAHLZEIT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-beschr">Beschreibung</Label>
            <Textarea id="e-beschr" value={form.beschreibung} placeholder="Was hast du gegessen?"
              onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-kcal">Kalorien (kcal)</Label>
              <Input id="e-kcal" type="number" min="0" value={form.kalorien}
                onChange={e => setForm(p => ({ ...p, kalorien: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-prot">Protein (g)</Label>
              <Input id="e-prot" type="number" min="0" value={form.protein}
                onChange={e => setForm(p => ({ ...p, protein: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-carbs">Kohlenhydrate (g)</Label>
              <Input id="e-carbs" type="number" min="0" value={form.carbs}
                onChange={e => setForm(p => ({ ...p, carbs: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-fett">Fett (g)</Label>
              <Input id="e-fett" type="number" min="0" value={form.fett}
                onChange={e => setForm(p => ({ ...p, fett: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erfassen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WORKOUT FORM ────────────────────────────────────────────
function WorkoutFormDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Workouts | null; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    datum: todayStr(), typ: 'push', dauer_minuten: '', stimmung: 'gut', rest_day: false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] || todayStr(),
        typ: record?.fields.typ || 'push',
        dauer_minuten: record?.fields.dauer_minuten?.toString() || '',
        stimmung: record?.fields.stimmung || 'gut',
        rest_day: record?.fields.rest_day || false,
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: Workouts['fields'] = {
      datum: form.datum,
      typ: form.typ as Workouts['fields']['typ'],
      dauer_minuten: form.dauer_minuten ? Number(form.dauer_minuten) : undefined,
      stimmung: form.stimmung as Workouts['fields']['stimmung'],
      rest_day: form.rest_day,
    };
    try {
      if (isEditing) {
        await LivingAppsService.updateWorkout(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Workout wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWorkout(data);
        toast.success('Erstellt', { description: 'Workout wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Workout bearbeiten' : 'Workout starten'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Ändere die Workout-Daten.' : 'Erfasse ein neues Workout.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="w-datum">Datum</Label>
              <Input id="w-datum" type="date" value={form.datum}
                onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Trainingstyp</Label>
              <Select value={form.typ} onValueChange={v => setForm(p => ({ ...p, typ: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKOUT_TYP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="w-dauer">Dauer (Minuten)</Label>
              <Input id="w-dauer" type="number" min="0" value={form.dauer_minuten}
                onChange={e => setForm(p => ({ ...p, dauer_minuten: e.target.value }))} placeholder="60" />
            </div>
            <div className="space-y-2">
              <Label>Stimmung</Label>
              <Select value={form.stimmung} onValueChange={v => setForm(p => ({ ...p, stimmung: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STIMMUNG_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{STIMMUNG_EMOJI[k]} {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="w-rest" checked={form.rest_day}
              onChange={e => setForm(p => ({ ...p, rest_day: e.target.checked }))}
              className="h-4 w-4 rounded border-border" />
            <Label htmlFor="w-rest">Ruhetag</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WORKOUT LOG FORM ────────────────────────────────────────
function WorkoutLogFormDialog({ open, onOpenChange, record, workouts, uebungen, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: WorkoutLogs | null;
  workouts: Workouts[]; uebungen: Uebungen[]; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    workout: '', uebung: '', satz_nummer: '', gewicht: '', wiederholungen: '', rpe: 'rpe_5',
  });

  useEffect(() => {
    if (open) {
      setForm({
        workout: (record?.fields.workout ? extractRecordId(record.fields.workout) : '') || '',
        uebung: (record?.fields.uebung ? extractRecordId(record.fields.uebung) : '') || '',
        satz_nummer: record?.fields.satz_nummer?.toString() || '',
        gewicht: record?.fields.gewicht?.toString() || '',
        wiederholungen: record?.fields.wiederholungen?.toString() || '',
        rpe: record?.fields.rpe || 'rpe_5',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: WorkoutLogs['fields'] = {
      workout: form.workout ? createRecordUrl(APP_IDS.WORKOUTS, form.workout) : undefined,
      uebung: form.uebung ? createRecordUrl(APP_IDS.UEBUNGEN, form.uebung) : undefined,
      satz_nummer: form.satz_nummer ? Number(form.satz_nummer) : undefined,
      gewicht: form.gewicht ? Number(form.gewicht) : undefined,
      wiederholungen: form.wiederholungen ? Number(form.wiederholungen) : undefined,
      rpe: form.rpe as WorkoutLogs['fields']['rpe'],
    };
    try {
      if (isEditing) {
        await LivingAppsService.updateWorkoutLog(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Satz wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWorkoutLog(data);
        toast.success('Erstellt', { description: 'Satz wurde hinzugefügt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  const recentWorkouts = [...workouts]
    .filter(w => !w.fields.rest_day)
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
    .slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Satz bearbeiten' : 'Satz hinzufügen'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Ändere die Satzdaten.' : 'Erfasse einen neuen Satz.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Workout</Label>
            <Select value={form.workout || 'none'} onValueChange={v => setForm(p => ({ ...p, workout: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Workout wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Workout</SelectItem>
                {recentWorkouts.map(w => (
                  <SelectItem key={w.record_id} value={w.record_id}>
                    {w.fields.datum?.split('T')[0] || '?'} - {WORKOUT_TYP_LABELS[w.fields.typ || ''] || w.fields.typ}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Übung</Label>
            <Select value={form.uebung || 'none'} onValueChange={v => setForm(p => ({ ...p, uebung: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Übung wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Übung</SelectItem>
                {uebungen.map(u => (
                  <SelectItem key={u.record_id} value={u.record_id}>
                    {u.fields.name || '-'} {u.fields.muskelgruppe ? `(${MUSKELGRUPPE_LABELS[u.fields.muskelgruppe]})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wl-satz">Satz #</Label>
              <Input id="wl-satz" type="number" min="1" value={form.satz_nummer}
                onChange={e => setForm(p => ({ ...p, satz_nummer: e.target.value }))} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-gew">Gewicht (kg)</Label>
              <Input id="wl-gew" type="number" min="0" step="0.5" value={form.gewicht}
                onChange={e => setForm(p => ({ ...p, gewicht: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-wdh">Wdh.</Label>
              <Input id="wl-wdh" type="number" min="0" value={form.wiederholungen}
                onChange={e => setForm(p => ({ ...p, wiederholungen: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>RPE / Gefühl</Label>
            <Select value={form.rpe} onValueChange={v => setForm(p => ({ ...p, rpe: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ÜBUNG FORM ──────────────────────────────────────────────
function UebungFormDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Uebungen | null; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', muskelgruppe: 'brust', equipment: 'langhantel', schwierigkeitsgrad: 'anfaenger',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: record?.fields.name || '',
        muskelgruppe: record?.fields.muskelgruppe || 'brust',
        equipment: record?.fields.equipment || 'langhantel',
        schwierigkeitsgrad: record?.fields.schwierigkeitsgrad || 'anfaenger',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: Uebungen['fields'] = {
      name: form.name,
      muskelgruppe: form.muskelgruppe as Uebungen['fields']['muskelgruppe'],
      equipment: form.equipment as Uebungen['fields']['equipment'],
      schwierigkeitsgrad: form.schwierigkeitsgrad as Uebungen['fields']['schwierigkeitsgrad'],
    };
    try {
      if (isEditing) {
        await LivingAppsService.updateUebungenEntry(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Übung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createUebungenEntry(data);
        toast.success('Erstellt', { description: 'Übung wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Übung bearbeiten' : 'Neue Übung'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Ändere die Übungsdaten.' : 'Erstelle eine neue Übung.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Übungsname</Label>
            <Input id="u-name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="z.B. Bankdrücken" />
          </div>
          <div className="space-y-2">
            <Label>Muskelgruppe</Label>
            <Select value={form.muskelgruppe} onValueChange={v => setForm(p => ({ ...p, muskelgruppe: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MUSKELGRUPPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select value={form.equipment} onValueChange={v => setForm(p => ({ ...p, equipment: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schwierigkeit</Label>
              <Select value={form.schwierigkeitsgrad} onValueChange={v => setForm(p => ({ ...p, schwierigkeitsgrad: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCHWIERIGKEIT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ZIELE FORM ──────────────────────────────────────────────
function ZieleFormDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Ziele | null; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    taeglich_kalorien: '', taeglich_protein: '', trainingstage_pro_woche: '',
    schlaf_ziel_stunden: '', status: 'aktiv', notizen: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        taeglich_kalorien: record?.fields.taeglich_kalorien?.toString() || '',
        taeglich_protein: record?.fields.taeglich_protein?.toString() || '',
        trainingstage_pro_woche: record?.fields.trainingstage_pro_woche?.toString() || '',
        schlaf_ziel_stunden: record?.fields.schlaf_ziel_stunden?.toString() || '',
        status: record?.fields.status || 'aktiv',
        notizen: record?.fields.notizen || '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: Ziele['fields'] = {
      taeglich_kalorien: form.taeglich_kalorien ? Number(form.taeglich_kalorien) : undefined,
      taeglich_protein: form.taeglich_protein ? Number(form.taeglich_protein) : undefined,
      trainingstage_pro_woche: form.trainingstage_pro_woche ? Number(form.trainingstage_pro_woche) : undefined,
      schlaf_ziel_stunden: form.schlaf_ziel_stunden ? Number(form.schlaf_ziel_stunden) : undefined,
      status: form.status as Ziele['fields']['status'],
      notizen: form.notizen || undefined,
    };
    try {
      if (isEditing) {
        await LivingAppsService.updateZieleEntry(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Ziel wurde aktualisiert.' });
      } else {
        await LivingAppsService.createZieleEntry(data);
        toast.success('Erstellt', { description: 'Ziel wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ziel bearbeiten' : 'Neues Ziel'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Ändere deine Zielwerte.' : 'Setze dir neue Tagesziele.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="z-kcal">Tägliche Kalorien</Label>
              <Input id="z-kcal" type="number" min="0" value={form.taeglich_kalorien}
                onChange={e => setForm(p => ({ ...p, taeglich_kalorien: e.target.value }))} placeholder="2000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-prot">Tägliches Protein (g)</Label>
              <Input id="z-prot" type="number" min="0" value={form.taeglich_protein}
                onChange={e => setForm(p => ({ ...p, taeglich_protein: e.target.value }))} placeholder="150" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-train">Trainingstage/Woche</Label>
              <Input id="z-train" type="number" min="0" max="7" value={form.trainingstage_pro_woche}
                onChange={e => setForm(p => ({ ...p, trainingstage_pro_woche: e.target.value }))} placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-schlaf">Schlafziel (Stunden)</Label>
              <Input id="z-schlaf" type="number" min="0" max="24" step="0.5" value={form.schlaf_ziel_stunden}
                onChange={e => setForm(p => ({ ...p, schlaf_ziel_stunden: e.target.value }))} placeholder="8" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ZIEL_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="z-notizen">Notizen</Label>
            <Textarea id="z-notizen" value={form.notizen}
              onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Optionale Notizen..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── KÖRPERDATEN FORM ────────────────────────────────────────
function KoerperdatenFormDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Koerperdaten | null; onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    datum: todayStr(), gewicht_kg: '', kfa_geschaetzt: '',
    brustumfang: '', taillenumfang: '', hueftumfang: '',
    armumfang: '', beinumfang: '', notizen: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        datum: record?.fields.datum?.split('T')[0] || todayStr(),
        gewicht_kg: record?.fields.gewicht_kg?.toString() || '',
        kfa_geschaetzt: record?.fields.kfa_geschaetzt?.toString() || '',
        brustumfang: record?.fields.brustumfang?.toString() || '',
        taillenumfang: record?.fields.taillenumfang?.toString() || '',
        hueftumfang: record?.fields.hueftumfang?.toString() || '',
        armumfang: record?.fields.armumfang?.toString() || '',
        beinumfang: record?.fields.beinumfang?.toString() || '',
        notizen: record?.fields.notizen || '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data: Koerperdaten['fields'] = {
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
    try {
      if (isEditing) {
        await LivingAppsService.updateKoerperdatenEntry(record!.record_id, data);
        toast.success('Gespeichert', { description: 'Messung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createKoerperdatenEntry(data);
        toast.success('Erstellt', { description: 'Messung wurde erfasst.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Messung bearbeiten' : 'Neue Messung'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Ändere deine Körperdaten.' : 'Erfasse deine aktuellen Körperdaten.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="k-datum">Datum</Label>
              <Input id="k-datum" type="date" value={form.datum}
                onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-gew">Gewicht (kg)</Label>
              <Input id="k-gew" type="number" min="0" step="0.1" value={form.gewicht_kg}
                onChange={e => setForm(p => ({ ...p, gewicht_kg: e.target.value }))} placeholder="80.0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-kfa">Körperfettanteil (%)</Label>
            <Input id="k-kfa" type="number" min="0" max="100" step="0.1" value={form.kfa_geschaetzt}
              onChange={e => setForm(p => ({ ...p, kfa_geschaetzt: e.target.value }))} placeholder="15.0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="k-brust">Brust (cm)</Label>
              <Input id="k-brust" type="number" min="0" step="0.1" value={form.brustumfang}
                onChange={e => setForm(p => ({ ...p, brustumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-taille">Taille (cm)</Label>
              <Input id="k-taille" type="number" min="0" step="0.1" value={form.taillenumfang}
                onChange={e => setForm(p => ({ ...p, taillenumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-huefte">Hüfte (cm)</Label>
              <Input id="k-huefte" type="number" min="0" step="0.1" value={form.hueftumfang}
                onChange={e => setForm(p => ({ ...p, hueftumfang: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-arm">Arm (cm)</Label>
              <Input id="k-arm" type="number" min="0" step="0.1" value={form.armumfang}
                onChange={e => setForm(p => ({ ...p, armumfang: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-bein">Bein (cm)</Label>
            <Input id="k-bein" type="number" min="0" step="0.1" value={form.beinumfang}
              onChange={e => setForm(p => ({ ...p, beinumfang: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-notizen">Notizen</Label>
            <Textarea id="k-notizen" value={form.notizen}
              onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Optionale Notizen..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erfassen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
