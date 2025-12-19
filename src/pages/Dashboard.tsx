import { useEffect, useState, useMemo } from 'react';
import { format, subDays, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dumbbell,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Scale,
  Utensils,
  Calendar,
  Plus,
  Zap,
  Timer,
  Activity,
  Award,
  ChevronRight,
  Loader2,
  AlertCircle,
  Moon,
  BarChart3,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, Uebungen, WorkoutLogs } from '@/types/app';
import { APP_IDS } from '@/types/app';

// Lookup Data für Labels
const TRAININGSTYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges'
};

const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal'
};

const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges'
};

const MUSKELGRUPPE_LABELS: Record<string, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  beine: 'Beine',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  bauch: 'Bauch',
  ganzkoerper: 'Ganzkörper'
};

const EQUIPMENT_LABELS: Record<string, string> = {
  langhantel: 'Langhantel',
  kurzhantel: 'Kurzhantel',
  maschine: 'Maschine',
  kabelzug: 'Kabelzug',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band',
  sonstiges: 'Sonstiges'
};

// Farben für Charts
const CHART_COLORS = ['#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];
const MACRO_COLORS = { protein: '#ef4444', carbs: '#f97316', fett: '#22c55e' };

export default function Dashboard() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'workout' | 'ernaehrung' | 'koerperdaten'>('workout');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [workoutForm, setWorkoutForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
    rest_day: false
  });

  const [ernaehrungForm, setErnaehrungForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    mahlzeit_typ: '',
    beschreibung: '',
    kalorien: '',
    protein: '',
    carbs: '',
    fett: ''
  });

  const [koerperdatenForm, setKoerperdatenForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    gewicht_kg: '',
    kfa_geschaetzt: '',
    notizen: ''
  });

  // Daten laden
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [workoutsData, ernaehrungData, koerperdatenData, zieleData, uebungenData, logsData] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkoutLogs()
      ]);
      setWorkouts(workoutsData);
      setErnaehrung(ernaehrungData);
      setKoerperdaten(koerperdatenData);
      setZiele(zieleData);
      setUebungen(uebungenData);
      setWorkoutLogs(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  // Aktive Ziele
  const activeGoals = useMemo(() => {
    return ziele.filter(z => z.fields.status === 'aktiv');
  }, [ziele]);

  const currentGoal = activeGoals[0];

  // Heutiges Datum
  const today = format(new Date(), 'yyyy-MM-dd');

  // Workouts diese Woche
  const thisWeekWorkouts = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start, end });
    });
  }, [workouts]);

  // Trainingsminuten diese Woche
  const weeklyMinutes = useMemo(() => {
    return thisWeekWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);
  }, [thisWeekWorkouts]);

  // Ernährung heute
  const todayNutrition = useMemo(() => {
    const todayMeals = ernaehrung.filter(e => e.fields.datum === today);
    return {
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fett: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0),
      meals: todayMeals.length
    };
  }, [ernaehrung, today]);

  // Letztes Gewicht
  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[0]?.fields.gewicht_kg;
  }, [koerperdaten]);

  // Gewichtsverlauf für Chart (letzte 30 Tage)
  const weightChartData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''));

    return sorted.slice(-14).map(k => ({
      datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg,
      kfa: k.fields.kfa_geschaetzt
    }));
  }, [koerperdaten]);

  // Kalorien letzte 7 Tage
  const caloriesChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayMeals = ernaehrung.filter(e => e.fields.datum === dateStr);
      const totalCal = dayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);
      return {
        datum: format(date, 'EEE', { locale: de }),
        kalorien: totalCal,
        ziel: currentGoal?.fields.taeglich_kalorien || 2000
      };
    });
    return last7Days;
  }, [ernaehrung, currentGoal]);

  // Trainingstyp Verteilung
  const workoutTypeDistribution = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    workouts.forEach(w => {
      if (w.fields.typ && !w.fields.rest_day) {
        typeCounts[w.fields.typ] = (typeCounts[w.fields.typ] || 0) + 1;
      }
    });
    return Object.entries(typeCounts).map(([typ, count]) => ({
      name: TRAININGSTYP_LABELS[typ] || typ,
      value: count
    }));
  }, [workouts]);

  // Makro-Verteilung heute
  const macroDistribution = useMemo(() => {
    const total = todayNutrition.protein + todayNutrition.carbs + todayNutrition.fett;
    if (total === 0) return [];
    return [
      { name: 'Protein', value: todayNutrition.protein, color: MACRO_COLORS.protein },
      { name: 'Carbs', value: todayNutrition.carbs, color: MACRO_COLORS.carbs },
      { name: 'Fett', value: todayNutrition.fett, color: MACRO_COLORS.fett }
    ];
  }, [todayNutrition]);

  // Letzte Workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.fields.datum)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5);
  }, [workouts]);

  // Streak berechnen (aufeinanderfolgende Trainingstage)
  const streak = useMemo(() => {
    const sortedDates = workouts
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .map(w => w.fields.datum!)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) return 0;

    let count = 0;
    let currentDate = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(currentDate, i), 'yyyy-MM-dd');
      if (sortedDates.includes(checkDate)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [workouts]);

  // Dialog öffnen
  function openDialog(type: 'workout' | 'ernaehrung' | 'koerperdaten') {
    setDialogType(type);
    setDialogOpen(true);
  }

  // Form Submit
  async function handleSubmit() {
    try {
      setSubmitting(true);

      if (dialogType === 'workout') {
        await LivingAppsService.createWorkout({
          datum: workoutForm.datum,
          typ: workoutForm.typ as Workouts['fields']['typ'],
          dauer_minuten: workoutForm.dauer_minuten ? Number(workoutForm.dauer_minuten) : undefined,
          stimmung: workoutForm.stimmung as Workouts['fields']['stimmung'],
          rest_day: workoutForm.rest_day
        });
        setWorkoutForm({
          datum: format(new Date(), 'yyyy-MM-dd'),
          typ: '',
          dauer_minuten: '',
          stimmung: '',
          rest_day: false
        });
      } else if (dialogType === 'ernaehrung') {
        await LivingAppsService.createErnaehrungEntry({
          datum: ernaehrungForm.datum,
          mahlzeit_typ: ernaehrungForm.mahlzeit_typ as Ernaehrung['fields']['mahlzeit_typ'],
          beschreibung: ernaehrungForm.beschreibung || undefined,
          kalorien: ernaehrungForm.kalorien ? Number(ernaehrungForm.kalorien) : undefined,
          protein: ernaehrungForm.protein ? Number(ernaehrungForm.protein) : undefined,
          carbs: ernaehrungForm.carbs ? Number(ernaehrungForm.carbs) : undefined,
          fett: ernaehrungForm.fett ? Number(ernaehrungForm.fett) : undefined
        });
        setErnaehrungForm({
          datum: format(new Date(), 'yyyy-MM-dd'),
          mahlzeit_typ: '',
          beschreibung: '',
          kalorien: '',
          protein: '',
          carbs: '',
          fett: ''
        });
      } else if (dialogType === 'koerperdaten') {
        await LivingAppsService.createKoerperdatenEntry({
          datum: koerperdatenForm.datum,
          gewicht_kg: koerperdatenForm.gewicht_kg ? Number(koerperdatenForm.gewicht_kg) : undefined,
          kfa_geschaetzt: koerperdatenForm.kfa_geschaetzt ? Number(koerperdatenForm.kfa_geschaetzt) : undefined,
          notizen: koerperdatenForm.notizen || undefined
        });
        setKoerperdatenForm({
          datum: format(new Date(), 'yyyy-MM-dd'),
          gewicht_kg: '',
          kfa_geschaetzt: '',
          notizen: ''
        });
      }

      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-zinc-400 font-medium">Lade Fitnessdaten...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Fehler beim Laden</h2>
              <p className="text-zinc-400">{error}</p>
              <Button onClick={loadData} className="bg-orange-500 hover:bg-orange-600">
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fortschritt berechnen
  const calorieProgress = currentGoal?.fields.taeglich_kalorien
    ? Math.min((todayNutrition.kalorien / currentGoal.fields.taeglich_kalorien) * 100, 100)
    : 0;

  const proteinProgress = currentGoal?.fields.taeglich_protein
    ? Math.min((todayNutrition.protein / currentGoal.fields.taeglich_protein) * 100, 100)
    : 0;

  const trainingProgress = currentGoal?.fields.trainingstage_pro_woche
    ? Math.min((thisWeekWorkouts.length / currentGoal.fields.trainingstage_pro_woche) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-zinc-950 to-red-500/5 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
                FITNESS TRACKER
              </span>
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => openDialog('workout')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 shadow-lg shadow-orange-500/20"
            >
              <Dumbbell className="w-4 h-4" />
              Workout
            </Button>
            <Button
              onClick={() => openDialog('ernaehrung')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-white font-semibold gap-2"
            >
              <Utensils className="w-4 h-4" />
              Mahlzeit
            </Button>
            <Button
              onClick={() => openDialog('koerperdaten')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-white font-semibold gap-2"
            >
              <Scale className="w-4 h-4" />
              Gewicht
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak */}
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-300/80 text-sm font-medium uppercase tracking-wider">Streak</p>
                  <p className="text-4xl font-black text-white mt-1">{streak}</p>
                  <p className="text-zinc-400 text-sm">Tage</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workouts diese Woche */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-300/80 text-sm font-medium uppercase tracking-wider">Diese Woche</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {thisWeekWorkouts.length}
                    <span className="text-xl text-zinc-500">/{currentGoal?.fields.trainingstage_pro_woche || '?'}</span>
                  </p>
                  <p className="text-zinc-400 text-sm">Workouts</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kalorien heute */}
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-300/80 text-sm font-medium uppercase tracking-wider">Kalorien</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {todayNutrition.kalorien.toLocaleString('de-DE')}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    von {currentGoal?.fields.taeglich_kalorien?.toLocaleString('de-DE') || '—'} kcal
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Flame className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gewicht */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-300/80 text-sm font-medium uppercase tracking-wider">Gewicht</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {latestWeight?.toFixed(1) || '—'}
                  </p>
                  <p className="text-zinc-400 text-sm">kg</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Scale className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {currentGoal && (
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                <CardTitle className="text-lg">Tagesziele</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Kalorien */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Kalorien</span>
                    <span className="text-white font-medium">
                      {todayNutrition.kalorien} / {currentGoal.fields.taeglich_kalorien} kcal
                    </span>
                  </div>
                  <Progress value={calorieProgress} className="h-2 bg-zinc-800" />
                </div>

                {/* Protein */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Protein</span>
                    <span className="text-white font-medium">
                      {todayNutrition.protein}g / {currentGoal.fields.taeglich_protein}g
                    </span>
                  </div>
                  <Progress value={proteinProgress} className="h-2 bg-zinc-800" />
                </div>

                {/* Training */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Training (Woche)</span>
                    <span className="text-white font-medium">
                      {thisWeekWorkouts.length} / {currentGoal.fields.trainingstage_pro_woche} Tage
                    </span>
                  </div>
                  <Progress value={trainingProgress} className="h-2 bg-zinc-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gewichtsverlauf */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-lg">Gewichtsverlauf</CardTitle>
                </div>
                <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                  Letzte 14 Einträge
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {weightChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="datum" stroke="#71717a" fontSize={12} />
                      <YAxis stroke="#71717a" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="gewicht"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="url(#weightGradient)"
                        name="Gewicht (kg)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  <p>Noch keine Gewichtsdaten vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kalorien Chart */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-lg">Kalorien letzte 7 Tage</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caloriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="datum" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="kalorien" fill="#22c55e" radius={[4, 4, 0, 0]} name="Kalorien" />
                    <Bar dataKey="ziel" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Ziel" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trainingstyp Verteilung */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg">Trainingsverteilung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {workoutTypeDistribution.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workoutTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {workoutTypeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  <p>Noch keine Workouts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Makros heute */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-400" />
                <CardTitle className="text-lg">Makros heute</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {macroDistribution.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {macroDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value}g`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                      <p className="text-xs text-zinc-400">Protein</p>
                      <p className="font-bold text-white">{todayNutrition.protein}g</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 rounded-full bg-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-zinc-400">Carbs</p>
                      <p className="font-bold text-white">{todayNutrition.carbs}g</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1" />
                      <p className="text-xs text-zinc-400">Fett</p>
                      <p className="font-bold text-white">{todayNutrition.fett}g</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  <p>Noch keine Mahlzeiten heute</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Letzte Workouts */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg">Letzte Workouts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          workout.fields.rest_day
                            ? 'bg-zinc-700'
                            : 'bg-orange-500/20'
                        }`}>
                          {workout.fields.rest_day ? (
                            <Moon className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <Dumbbell className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {workout.fields.rest_day
                              ? 'Ruhetag'
                              : TRAININGSTYP_LABELS[workout.fields.typ || ''] || workout.fields.typ || 'Workout'
                            }
                          </p>
                          <p className="text-xs text-zinc-500">
                            {workout.fields.datum
                              ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })
                              : '—'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workout.fields.dauer_minuten && !workout.fields.rest_day && (
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                            <Timer className="w-3 h-3 mr-1" />
                            {workout.fields.dauer_minuten} min
                          </Badge>
                        )}
                        {workout.fields.stimmung && (
                          <Badge
                            className={`
                              ${workout.fields.stimmung === 'brutal' ? 'bg-orange-500/20 text-orange-400' : ''}
                              ${workout.fields.stimmung === 'gut' ? 'bg-green-500/20 text-green-400' : ''}
                              ${workout.fields.stimmung === 'okay' ? 'bg-blue-500/20 text-blue-400' : ''}
                              ${workout.fields.stimmung === 'schlecht' ? 'bg-red-500/20 text-red-400' : ''}
                            `}
                          >
                            {STIMMUNG_LABELS[workout.fields.stimmung]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  <p>Noch keine Workouts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Übungen Übersicht */}
        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-lg">Übungen im Katalog</CardTitle>
              </div>
              <Badge className="bg-zinc-800 text-zinc-300">
                {uebungen.length} Übungen
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(MUSKELGRUPPE_LABELS).map(([key, label]) => {
                const count = uebungen.filter(u => u.fields.muskelgruppe === key).length;
                return (
                  <div
                    key={key}
                    className="p-3 bg-zinc-800/50 rounded-lg text-center hover:bg-zinc-800 transition-colors"
                  >
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-zinc-400">{label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{workouts.length}</p>
            <p className="text-sm text-zinc-500">Workouts gesamt</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white">{ernaehrung.length}</p>
            <p className="text-sm text-zinc-500">Mahlzeiten geloggt</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white">{koerperdaten.length}</p>
            <p className="text-sm text-zinc-500">Körperdaten-Einträge</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white">{weeklyMinutes}</p>
            <p className="text-sm text-zinc-500">Minuten diese Woche</p>
          </div>
        </div>
      </div>

      {/* Dialog für neue Einträge */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === 'workout' && <><Dumbbell className="w-5 h-5 text-orange-400" /> Neues Workout</>}
              {dialogType === 'ernaehrung' && <><Utensils className="w-5 h-5 text-green-400" /> Neue Mahlzeit</>}
              {dialogType === 'koerperdaten' && <><Scale className="w-5 h-5 text-purple-400" /> Körperdaten</>}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={dialogType} onValueChange={(v) => setDialogType(v as any)}>
            <TabsList className="grid grid-cols-3 bg-zinc-800">
              <TabsTrigger value="workout" className="data-[state=active]:bg-orange-500">
                <Dumbbell className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="ernaehrung" className="data-[state=active]:bg-green-500">
                <Utensils className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="koerperdaten" className="data-[state=active]:bg-purple-500">
                <Scale className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* Workout Form */}
            <TabsContent value="workout" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={workoutForm.datum}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, datum: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rest_day"
                  checked={workoutForm.rest_day}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, rest_day: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="rest_day">Ruhetag</Label>
              </div>

              {!workoutForm.rest_day && (
                <>
                  <div className="space-y-2">
                    <Label>Trainingstyp</Label>
                    <Select
                      value={workoutForm.typ}
                      onValueChange={(v) => setWorkoutForm(f => ({ ...f, typ: v }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Typ auswählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {Object.entries(TRAININGSTYP_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dauer (Minuten)</Label>
                    <Input
                      type="number"
                      value={workoutForm.dauer_minuten}
                      onChange={(e) => setWorkoutForm(f => ({ ...f, dauer_minuten: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="z.B. 60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stimmung</Label>
                    <Select
                      value={workoutForm.stimmung}
                      onValueChange={(v) => setWorkoutForm(f => ({ ...f, stimmung: v }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Wie fühlst du dich?" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Ernährung Form */}
            <TabsContent value="ernaehrung" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={ernaehrungForm.datum}
                  onChange={(e) => setErnaehrungForm(f => ({ ...f, datum: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Mahlzeitentyp</Label>
                <Select
                  value={ernaehrungForm.mahlzeit_typ}
                  onValueChange={(v) => setErnaehrungForm(f => ({ ...f, mahlzeit_typ: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Typ auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {Object.entries(MAHLZEIT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  value={ernaehrungForm.beschreibung}
                  onChange={(e) => setErnaehrungForm(f => ({ ...f, beschreibung: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Was hast du gegessen?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kalorien (kcal)</Label>
                  <Input
                    type="number"
                    value={ernaehrungForm.kalorien}
                    onChange={(e) => setErnaehrungForm(f => ({ ...f, kalorien: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={ernaehrungForm.protein}
                    onChange={(e) => setErnaehrungForm(f => ({ ...f, protein: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={ernaehrungForm.carbs}
                    onChange={(e) => setErnaehrungForm(f => ({ ...f, carbs: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fett (g)</Label>
                  <Input
                    type="number"
                    value={ernaehrungForm.fett}
                    onChange={(e) => setErnaehrungForm(f => ({ ...f, fett: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Körperdaten Form */}
            <TabsContent value="koerperdaten" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={koerperdatenForm.datum}
                  onChange={(e) => setKoerperdatenForm(f => ({ ...f, datum: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gewicht (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={koerperdatenForm.gewicht_kg}
                    onChange={(e) => setKoerperdatenForm(f => ({ ...f, gewicht_kg: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="z.B. 75.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>KFA geschätzt (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={koerperdatenForm.kfa_geschaetzt}
                    onChange={(e) => setKoerperdatenForm(f => ({ ...f, kfa_geschaetzt: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="z.B. 15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea
                  value={koerperdatenForm.notizen}
                  onChange={(e) => setKoerperdatenForm(f => ({ ...f, notizen: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Optionale Notizen..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-zinc-700"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Speichern...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Speichern</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
