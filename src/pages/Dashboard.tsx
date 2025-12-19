import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  TrendingDown,
  Scale,
  Utensils,
  Calendar,
  Plus,
  Zap,
  Moon,
  Activity,
  ChevronRight,
  Award,
  Timer,
  Heart,
  BarChart3,
  Loader2,
  AlertCircle,
  Coffee,
  Beef,
  Wheat,
  Droplets,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Uebungen, Workouts, Ziele, Ernaehrung, Koerperdaten, WorkoutLogs } from '@/types/app';

// Lookup Labels für die UI
const MUSKELGRUPPEN: Record<string, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  beine: 'Beine',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  bauch: 'Bauch',
  ganzkoerper: 'Ganzkörper',
};

const WORKOUT_TYPEN: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

const STIMMUNGEN: Record<string, { label: string; color: string }> = {
  schlecht: { label: 'Schlecht', color: '#ef4444' },
  okay: { label: 'Okay', color: '#f59e0b' },
  gut: { label: 'Gut', color: '#22c55e' },
  brutal: { label: 'Brutal', color: '#8b5cf6' },
};

const MAHLZEIT_TYPEN: Record<string, string> = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
};

export default function Dashboard() {
  // Data states
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [ernaehrungDialogOpen, setErnaehrungDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [workoutForm, setWorkoutForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as const,
    dauer_minuten: 60,
    stimmung: 'gut' as const,
    rest_day: false,
  });

  const [ernaehrungForm, setErnaehrungForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    mahlzeit_typ: 'mittagessen' as const,
    beschreibung: '',
    kalorien: 0,
    protein: 0,
    carbs: 0,
    fett: 0,
  });

  // Load all data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [uebungenData, workoutsData, zieleData, ernaehrungData, koerperdatenData, logsData] = await Promise.all([
          LivingAppsService.getUebungen(),
          LivingAppsService.getWorkouts(),
          LivingAppsService.getZiele(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getWorkoutLogs(),
        ]);
        setUebungen(uebungenData);
        setWorkouts(workoutsData);
        setZiele(zieleData);
        setErnaehrung(ernaehrungData);
        setKoerperdaten(koerperdatenData);
        setWorkoutLogs(logsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Computed values
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const activeZiel = useMemo(() => ziele.find((z) => z.fields.status === 'aktiv'), [ziele]);

  const todayErnaehrung = useMemo(
    () => ernaehrung.filter((e) => e.fields.datum === today),
    [ernaehrung, today]
  );

  const todayMacros = useMemo(() => {
    return todayErnaehrung.reduce(
      (acc, e) => ({
        kalorien: acc.kalorien + (e.fields.kalorien || 0),
        protein: acc.protein + (e.fields.protein || 0),
        carbs: acc.carbs + (e.fields.carbs || 0),
        fett: acc.fett + (e.fields.fett || 0),
      }),
      { kalorien: 0, protein: 0, carbs: 0, fett: 0 }
    );
  }, [todayErnaehrung]);

  const weekWorkouts = useMemo(
    () =>
      workouts.filter((w) => {
        if (!w.fields.datum || w.fields.rest_day) return false;
        const date = parseISO(w.fields.datum);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      }),
    [workouts, weekStart, weekEnd]
  );

  const weekTrainingMinutes = useMemo(
    () => weekWorkouts.reduce((acc, w) => acc + (w.fields.dauer_minuten || 0), 0),
    [weekWorkouts]
  );

  const latestKoerperdaten = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[0];
  }, [koerperdaten]);

  const previousKoerperdaten = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[1];
  }, [koerperdaten]);

  const gewichtTrend = useMemo(() => {
    if (!latestKoerperdaten?.fields.gewicht_kg || !previousKoerperdaten?.fields.gewicht_kg) return null;
    return latestKoerperdaten.fields.gewicht_kg - previousKoerperdaten.fields.gewicht_kg;
  }, [latestKoerperdaten, previousKoerperdaten]);

  // Weight chart data (last 30 days)
  const gewichtChartData = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    return koerperdaten
      .filter((k) => k.fields.datum && k.fields.gewicht_kg && parseISO(k.fields.datum) >= last30Days)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
      .map((k) => ({
        datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      }));
  }, [koerperdaten]);

  // Weekly workout distribution
  const workoutTypeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    weekWorkouts.forEach((w) => {
      const typ = w.fields.typ || 'sonstiges';
      distribution[typ] = (distribution[typ] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: WORKOUT_TYPEN[name] || name,
      value,
      fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));
  }, [weekWorkouts]);

  // Muscle group distribution from workout logs
  const muskelgruppenVerteilung = useMemo(() => {
    const distribution: Record<string, number> = {};
    workoutLogs.forEach((log) => {
      const uebungId = extractRecordId(log.fields.uebung);
      if (!uebungId) return;
      const uebung = uebungen.find((u) => u.record_id === uebungId);
      if (!uebung?.fields.muskelgruppe) return;
      const mg = uebung.fields.muskelgruppe;
      distribution[mg] = (distribution[mg] || 0) + 1;
    });
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return Object.entries(distribution)
      .map(([name, value], i) => ({
        name: MUSKELGRUPPEN[name] || name,
        value,
        fill: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [workoutLogs, uebungen]);

  // Recent workouts
  const recentWorkouts = useMemo(
    () =>
      [...workouts]
        .filter((w) => !w.fields.rest_day)
        .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
        .slice(0, 5),
    [workouts]
  );

  // Calorie trend (last 7 days)
  const kalorienTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayErnaehrung = ernaehrung.filter((e) => e.fields.datum === dateStr);
      const kalorien = dayErnaehrung.reduce((acc, e) => acc + (e.fields.kalorien || 0), 0);
      return {
        tag: format(date, 'EEE', { locale: de }),
        kalorien,
        ziel: activeZiel?.fields.taeglich_kalorien || 2000,
      };
    });
    return last7Days;
  }, [ernaehrung, activeZiel]);

  // Chart configs
  const gewichtChartConfig: ChartConfig = {
    gewicht: {
      label: 'Gewicht (kg)',
      color: '#FF6B6B',
    },
  };

  const kalorienChartConfig: ChartConfig = {
    kalorien: {
      label: 'Kalorien',
      color: '#4ECDC4',
    },
    ziel: {
      label: 'Ziel',
      color: '#94a3b8',
    },
  };

  // Handlers
  const handleCreateWorkout = async () => {
    try {
      setSubmitting(true);
      await LivingAppsService.createWorkout(workoutForm);
      const updatedWorkouts = await LivingAppsService.getWorkouts();
      setWorkouts(updatedWorkouts);
      setWorkoutDialogOpen(false);
      setWorkoutForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: 60,
        stimmung: 'gut',
        rest_day: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateErnaehrung = async () => {
    try {
      setSubmitting(true);
      await LivingAppsService.createErnaehrungEntry(ernaehrungForm);
      const updatedErnaehrung = await LivingAppsService.getErnaehrung();
      setErnaehrung(updatedErnaehrung);
      setErnaehrungDialogOpen(false);
      setErnaehrungForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        mahlzeit_typ: 'mittagessen',
        beschreibung: '',
        kalorien: 0,
        protein: 0,
        carbs: 0,
        fett: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress calculations
  const kalorienProgress = activeZiel?.fields.taeglich_kalorien
    ? Math.min(100, (todayMacros.kalorien / activeZiel.fields.taeglich_kalorien) * 100)
    : 0;

  const proteinProgress = activeZiel?.fields.taeglich_protein
    ? Math.min(100, (todayMacros.protein / activeZiel.fields.taeglich_protein) * 100)
    : 0;

  const trainingProgress = activeZiel?.fields.trainingstage_pro_woche
    ? Math.min(100, (weekWorkouts.length / activeZiel.fields.trainingstage_pro_woche) * 100)
    : 0;

  // Radial chart data for macro overview
  const macroRadialData = [
    {
      name: 'Protein',
      value: proteinProgress,
      fill: '#FF6B6B',
    },
    {
      name: 'Kalorien',
      value: kalorienProgress,
      fill: '#4ECDC4',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-rose-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-orange-200 animate-pulse" />
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 font-medium tracking-wide">Lade deine Fitness-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-rose-50 p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Fehler beim Laden</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => window.location.reload()}
                >
                  Erneut versuchen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-rose-50/40">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-amber-200/25 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 px-4 py-8 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl shadow-lg shadow-orange-500/25">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-orange-600 tracking-widest uppercase">
                  Fitness & Ernährung
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                Dein <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Fortschritt</span>
              </h1>
              <p className="text-slate-500 mt-1">
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setErnaehrungDialogOpen(true)}
                variant="outline"
                className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-semibold shadow-sm"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Mahlzeit
              </Button>
              <Button
                onClick={() => setWorkoutDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold shadow-lg shadow-orange-500/25 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Workout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Workouts diese Woche */}
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Workouts</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{weekWorkouts.length}</span>
                    <span className="text-slate-400 text-sm">/ {activeZiel?.fields.trainingstage_pro_woche || '?'}</span>
                  </div>
                  <Progress value={trainingProgress} className="h-1.5 mt-3 bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-rose-400" />
                </CardContent>
              </Card>

              {/* Kalorien heute */}
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Kalorien</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{todayMacros.kalorien.toLocaleString()}</span>
                    <span className="text-slate-400 text-sm">kcal</span>
                  </div>
                  <Progress value={kalorienProgress} className="h-1.5 mt-3 bg-emerald-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-400" />
                </CardContent>
              </Card>

              {/* Protein heute */}
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-violet-600 mb-2">
                    <Beef className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Protein</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{todayMacros.protein}</span>
                    <span className="text-slate-400 text-sm">/ {activeZiel?.fields.taeglich_protein || '?'}g</span>
                  </div>
                  <Progress value={proteinProgress} className="h-1.5 mt-3 bg-violet-100 [&>div]:bg-gradient-to-r [&>div]:from-violet-400 [&>div]:to-purple-400" />
                </CardContent>
              </Card>

              {/* Gewicht */}
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-sky-100 to-transparent rounded-bl-full" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-sky-600 mb-2">
                    <Scale className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Gewicht</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">
                      {latestKoerperdaten?.fields.gewicht_kg?.toFixed(1) || '--'}
                    </span>
                    <span className="text-slate-400 text-sm">kg</span>
                  </div>
                  {gewichtTrend !== null && (
                    <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${gewichtTrend < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {gewichtTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(gewichtTrend).toFixed(1)} kg
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weight Chart */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-rose-500" />
                      Gewichtsverlauf
                    </CardTitle>
                    <CardDescription>Letzte 30 Tage</CardDescription>
                  </div>
                  {latestKoerperdaten?.fields.kfa_geschaetzt && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-0">
                      {latestKoerperdaten.fields.kfa_geschaetzt}% KFA
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {gewichtChartData.length > 0 ? (
                  <ChartContainer config={gewichtChartConfig} className="h-[220px] w-full">
                    <AreaChart data={gewichtChartData}>
                      <defs>
                        <linearGradient id="gewichtGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="datum" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="gewicht"
                        stroke="#FF6B6B"
                        strokeWidth={3}
                        fill="url(#gewichtGradient)"
                        dot={{ fill: '#FF6B6B', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#FF6B6B', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>Noch keine Körperdaten vorhanden</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calorie Trend Chart */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      Kalorien-Trend
                    </CardTitle>
                    <CardDescription>Diese Woche im Vergleich zum Ziel</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={kalorienChartConfig} className="h-[200px] w-full">
                  <BarChart data={kalorienTrend} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="tag" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={50} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="kalorien" fill="#4ECDC4" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="ziel" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Letzte Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorkouts.map((workout) => (
                      <div
                        key={workout.record_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md shadow-orange-500/20">
                            <Dumbbell className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {WORKOUT_TYPEN[workout.fields.typ || 'sonstiges']}
                            </p>
                            <p className="text-sm text-slate-500">
                              {workout.fields.datum
                                ? format(parseISO(workout.fields.datum), 'EEEE, d. MMM', { locale: de })
                                : 'Unbekannt'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-slate-700">{workout.fields.dauer_minuten || 0} min</p>
                            {workout.fields.stimmung && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${STIMMUNGEN[workout.fields.stimmung]?.color}20`,
                                  color: STIMMUNGEN[workout.fields.stimmung]?.color,
                                }}
                              >
                                {STIMMUNGEN[workout.fields.stimmung]?.label}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Noch keine Workouts vorhanden</p>
                    <Button variant="link" className="text-orange-500 mt-2" onClick={() => setWorkoutDialogOpen(true)}>
                      Erstes Workout erstellen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Side Panels */}
          <div className="lg:col-span-4 space-y-6">
            {/* Goals Card */}
            {activeZiel && (
              <Card className="border-0 bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/25 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold">Aktive Ziele</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-90">Kalorien</span>
                      </div>
                      <p className="text-xl font-black">{activeZiel.fields.taeglich_kalorien?.toLocaleString() || '--'}</p>
                      <p className="text-xs opacity-75">kcal/Tag</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Beef className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-90">Protein</span>
                      </div>
                      <p className="text-xl font-black">{activeZiel.fields.taeglich_protein || '--'}</p>
                      <p className="text-xs opacity-75">g/Tag</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Dumbbell className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-90">Training</span>
                      </div>
                      <p className="text-xl font-black">{activeZiel.fields.trainingstage_pro_woche || '--'}</p>
                      <p className="text-xs opacity-75">Tage/Woche</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-90">Schlaf</span>
                      </div>
                      <p className="text-xl font-black">{activeZiel.fields.schlaf_ziel_stunden || '--'}</p>
                      <p className="text-xs opacity-75">Stunden</p>
                    </div>
                  </div>
                  {activeZiel.fields.notizen && (
                    <div className="bg-white/10 rounded-lg p-3 text-sm">
                      <p className="opacity-90">{activeZiel.fields.notizen}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Macros Radial */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Makros heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={macroRadialData} startAngle={90} endAngle={-270}>
                        <RadialBar background dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                    <div>
                      <p className="text-xs text-slate-500">Protein</p>
                      <p className="font-bold text-slate-800">{todayMacros.protein}g</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-[#4ECDC4]" />
                    <div>
                      <p className="text-xs text-slate-500">Kalorien</p>
                      <p className="font-bold text-slate-800">{todayMacros.kalorien}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <Wheat className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-500">Carbs</p>
                      <p className="font-bold text-slate-800">{todayMacros.carbs}g</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                    <Droplets className="w-4 h-4 text-violet-500" />
                    <div>
                      <p className="text-xs text-slate-500">Fett</p>
                      <p className="font-bold text-slate-800">{todayMacros.fett}g</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Muscle Group Distribution */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-violet-500" />
                  Muskelgruppen
                </CardTitle>
                <CardDescription>Verteilung deiner Übungen</CardDescription>
              </CardHeader>
              <CardContent>
                {muskelgruppenVerteilung.length > 0 ? (
                  <>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={muskelgruppenVerteilung}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {muskelgruppenVerteilung.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {muskelgruppenVerteilung.slice(0, 6).map((mg) => (
                        <div key={mg.name} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mg.fill }} />
                          <span className="text-slate-600 truncate">{mg.name}</span>
                          <span className="text-slate-400 ml-auto">{mg.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Noch keine Workout-Logs vorhanden</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Meals */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    Heute gegessen
                  </CardTitle>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                    {todayErnaehrung.length} Mahlzeiten
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {todayErnaehrung.length > 0 ? (
                  <div className="space-y-2">
                    {todayErnaehrung.map((meal) => (
                      <div
                        key={meal.record_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 text-sm">
                              {MAHLZEIT_TYPEN[meal.fields.mahlzeit_typ || 'sonstiges']}
                            </p>
                            {meal.fields.beschreibung && (
                              <p className="text-xs text-slate-400 truncate max-w-[120px]">
                                {meal.fields.beschreibung}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-700 text-sm">{meal.fields.kalorien || 0} kcal</p>
                          <p className="text-xs text-slate-400">{meal.fields.protein || 0}g P</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Noch nichts getrackt</p>
                    <Button variant="link" className="text-emerald-500 text-sm mt-1" onClick={() => setErnaehrungDialogOpen(true)}>
                      Mahlzeit hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Stats Summary */}
            <Card className="border-0 bg-slate-800 text-white shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Timer className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold">Diese Woche</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Trainingszeit</p>
                    <p className="text-2xl font-black">{weekTrainingMinutes} <span className="text-base font-normal text-slate-400">min</span></p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sessions</p>
                    <p className="text-2xl font-black">{weekWorkouts.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Übungen</p>
                    <p className="text-2xl font-black">{uebungen.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Logs</p>
                    <p className="text-2xl font-black">{workoutLogs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Workout Dialog */}
      <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              Neues Workout
            </DialogTitle>
            <DialogDescription>Trage dein heutiges Training ein</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum</Label>
              <Input
                id="datum"
                type="date"
                value={workoutForm.datum}
                onChange={(e) => setWorkoutForm({ ...workoutForm, datum: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Trainingstyp</Label>
              <Select
                value={workoutForm.typ}
                onValueChange={(v) => setWorkoutForm({ ...workoutForm, typ: v as typeof workoutForm.typ })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKOUT_TYPEN).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dauer">Dauer (Minuten)</Label>
              <Input
                id="dauer"
                type="number"
                value={workoutForm.dauer_minuten}
                onChange={(e) => setWorkoutForm({ ...workoutForm, dauer_minuten: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stimmung</Label>
              <Select
                value={workoutForm.stimmung}
                onValueChange={(v) => setWorkoutForm({ ...workoutForm, stimmung: v as typeof workoutForm.stimmung })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STIMMUNGEN).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkoutDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateWorkout}
              disabled={submitting}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ernährung Dialog */}
      <Dialog open={ernaehrungDialogOpen} onOpenChange={setErnaehrungDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              Neue Mahlzeit
            </DialogTitle>
            <DialogDescription>Tracke deine Ernährung</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ernaehrung-datum">Datum</Label>
                <Input
                  id="ernaehrung-datum"
                  type="date"
                  value={ernaehrungForm.datum}
                  onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, datum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mahlzeit</Label>
                <Select
                  value={ernaehrungForm.mahlzeit_typ}
                  onValueChange={(v) => setErnaehrungForm({ ...ernaehrungForm, mahlzeit_typ: v as typeof ernaehrungForm.mahlzeit_typ })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MAHLZEIT_TYPEN).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                placeholder="Was hast du gegessen?"
                value={ernaehrungForm.beschreibung}
                onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, beschreibung: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kalorien">Kalorien (kcal)</Label>
                <Input
                  id="kalorien"
                  type="number"
                  value={ernaehrungForm.kalorien || ''}
                  onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, kalorien: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={ernaehrungForm.protein || ''}
                  onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, protein: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Kohlenhydrate (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={ernaehrungForm.carbs || ''}
                  onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, carbs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fett">Fett (g)</Label>
                <Input
                  id="fett"
                  type="number"
                  value={ernaehrungForm.fett || ''}
                  onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, fett: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErnaehrungDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateErnaehrung}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
