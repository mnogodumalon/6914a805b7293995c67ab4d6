import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, WorkoutLogs, Uebungen } from '@/types/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dumbbell,
  Apple,
  TrendingUp,
  Target,
  Calendar,
  Flame,
  Activity,
  Award,
  Scale,
  Brain,
  Trophy,
  Zap,
  PlusCircle,
  LoaderCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  ziele: Ziele[];
  koerperdaten: Koerperdaten[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
}

// Farbschema: Kraftvoll und energetisch, inspiriert von Peak Performance
const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F7B801',
  success: '#06D6A0',
  danger: '#EF476F',
  neutral: '#8B95A5',
  chart: ['#FF6B35', '#004E89', '#F7B801', '#06D6A0', '#EF476F', '#8B95A5']
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick Log Form State
  const [quickLogForm, setQuickLogForm] = useState({
    workout_id: '',
    uebung_id: '',
    satz_nummer: 1,
    gewicht: '',
    wiederholungen: '',
    rpe: 'rpe_5' as const
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [workouts, ernaehrung, ziele, koerperdaten, workoutLogs, uebungen] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getZiele(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen()
      ]);
      setData({ workouts, ernaehrung, ziele, koerperdaten, workoutLogs, uebungen });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickLogForm.workout_id || !quickLogForm.uebung_id || !quickLogForm.gewicht || !quickLogForm.wiederholungen) {
      return;
    }

    try {
      setSubmitting(true);
      await LivingAppsService.createWorkoutLog({
        workout: quickLogForm.workout_id,
        uebung: quickLogForm.uebung_id,
        satz_nummer: quickLogForm.satz_nummer,
        gewicht: parseFloat(quickLogForm.gewicht),
        wiederholungen: parseFloat(quickLogForm.wiederholungen),
        rpe: quickLogForm.rpe
      });

      // Daten neu laden und Dialog schließen
      await loadDashboardData();
      setDialogOpen(false);

      // Form zurücksetzen
      setQuickLogForm({
        workout_id: quickLogForm.workout_id, // Workout beibehalten
        uebung_id: '',
        satz_nummer: quickLogForm.satz_nummer + 1, // Nächste Satznummer
        gewicht: quickLogForm.gewicht, // Gewicht beibehalten
        wiederholungen: '',
        rpe: 'rpe_5'
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <LoaderCircle className="w-16 h-16 animate-spin mx-auto" style={{ color: COLORS.primary }} />
          <p className="text-xl font-semibold text-slate-700">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Fehler beim Laden</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDashboardData} className="w-full" style={{ backgroundColor: COLORS.primary }}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // ===== BERECHNUNGEN =====

  // Letzte 7 Tage
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  // Aktuelle Woche
  const weekStart = startOfWeek(today, { locale: de });
  const weekEnd = endOfWeek(today, { locale: de });

  // Aktive Ziele
  const activeGoals = data.ziele.filter(z => z.fields.status === 'aktiv');
  const currentGoal = activeGoals[0]; // Nehme das erste aktive Ziel

  // Workouts diese Woche
  const workoutsThisWeek = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    const workoutDate = parseISO(w.fields.datum);
    return workoutDate >= weekStart && workoutDate <= weekEnd && !w.fields.rest_day;
  }).length;

  // Workouts letzte 7 Tage
  const workoutsLast7Days = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    return last7Days.includes(w.fields.datum) && !w.fields.rest_day;
  });

  // Durchschnittliche Workout-Dauer
  const avgWorkoutDuration = workoutsLast7Days.length > 0
    ? Math.round(
        workoutsLast7Days
          .filter(w => w.fields.dauer_minuten)
          .reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) / workoutsLast7Days.length
      )
    : 0;

  // Ernährung heute
  const todayString = format(today, 'yyyy-MM-dd');
  const todayNutrition = data.ernaehrung.filter(e => e.fields.datum === todayString);
  const todayCalories = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const todayProtein = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
  const todayCarbs = todayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
  const todayFett = todayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

  // Makro-Verteilung heute
  const macroData = [
    { name: 'Protein', value: todayProtein * 4, display: todayProtein + 'g' },
    { name: 'Carbs', value: todayCarbs * 4, display: todayCarbs + 'g' },
    { name: 'Fett', value: todayFett * 9, display: todayFett + 'g' }
  ];

  // Kalorien-Verlauf (letzte 7 Tage)
  const caloriesTrendData = last7Days.map(date => {
    const dayMeals = data.ernaehrung.filter(e => e.fields.datum === date);
    const calories = dayMeals.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    const protein = dayMeals.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
    return {
      date: format(parseISO(date), 'EEE', { locale: de }),
      kalorien: calories,
      protein: protein,
      ziel_kalorien: currentGoal?.fields.taeglich_kalorien || 0
    };
  });

  // Gewichtsverlauf (letzte 30 Tage)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const weightData = last30Days
    .map(date => {
      const entry = data.koerperdaten
        .filter(k => k.fields.datum === date)
        .sort((a, b) => (b.createdat || '').localeCompare(a.createdat || ''))[0];

      return {
        date: format(parseISO(date), 'dd.MM', { locale: de }),
        gewicht: entry?.fields.gewicht_kg || null
      };
    })
    .filter(d => d.gewicht !== null);

  // Letztes Gewicht
  const latestWeight = data.koerperdaten
    .filter(k => k.fields.gewicht_kg)
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))[0];

  // Trainings-Verteilung (letzte 30 Tage)
  const last30DaysWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    return last30Days.includes(w.fields.datum) && !w.fields.rest_day;
  });

  const workoutTypeDistribution = last30DaysWorkouts.reduce((acc, w) => {
    const type = w.fields.typ || 'sonstiges';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workoutTypeData = Object.entries(workoutTypeDistribution).map(([key, value]) => ({
    name: getLookupLabel('typ', key),
    value
  }));

  // Top Übungen (meiste Logs)
  const exerciseLogCount = data.workoutLogs.reduce((acc, log) => {
    const uebungId = extractRecordId(log.fields.uebung);
    if (!uebungId) return acc;
    acc[uebungId] = (acc[uebungId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topExercises = Object.entries(exerciseLogCount)
    .map(([id, count]) => {
      const uebung = data.uebungen.find(u => u.record_id === id);
      return { name: uebung?.fields.name || 'Unbekannt', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Letzte Workouts
  const recentWorkouts = data.workouts
    .filter(w => w.fields.datum)
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
    .slice(0, 5);

  // Helper: Lookup Label holen
  function getLookupLabel(field: string, key: string): string {
    const metadata = {
      typ: { push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper', oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges' },
      stimmung: { schlecht: 'Schlecht', okay: 'Okay', gut: 'Gut', brutal: 'Brutal' },
      muskelgruppe: { brust: 'Brust', ruecken: 'Rücken', beine: 'Beine', schultern: 'Schultern', bizeps: 'Bizeps', trizeps: 'Trizeps', bauch: 'Bauch', ganzkoerper: 'Ganzkörper' }
    };
    return (metadata[field as keyof typeof metadata] as any)?.[key] || key;
  }

  // Helper: Stimmung Badge Farbe
  function getMoodColor(mood?: string) {
    switch (mood) {
      case 'brutal': return COLORS.success;
      case 'gut': return COLORS.accent;
      case 'okay': return COLORS.neutral;
      case 'schlecht': return COLORS.danger;
      default: return COLORS.neutral;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header mit Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: COLORS.secondary }}>
                Fitness Dashboard
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                {format(today, 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="shadow-lg font-bold text-white hover:scale-105 transition-transform"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Workout Log
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
                    Neuer Workout Log
                  </DialogTitle>
                  <DialogDescription>
                    Logge schnell einen neuen Satz für dein aktuelles Workout
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleQuickLogSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workout">Workout</Label>
                    <Select
                      value={quickLogForm.workout_id}
                      onValueChange={(val) => setQuickLogForm(prev => ({ ...prev, workout_id: val }))}
                    >
                      <SelectTrigger id="workout">
                        <SelectValue placeholder="Workout auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentWorkouts.map(w => (
                          <SelectItem key={w.record_id} value={w.record_id}>
                            {format(parseISO(w.fields.datum!), 'dd.MM.yyyy', { locale: de })} - {getLookupLabel('typ', w.fields.typ || '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uebung">Übung</Label>
                    <Select
                      value={quickLogForm.uebung_id}
                      onValueChange={(val) => setQuickLogForm(prev => ({ ...prev, uebung_id: val }))}
                    >
                      <SelectTrigger id="uebung">
                        <SelectValue placeholder="Übung auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.uebungen.map(u => (
                          <SelectItem key={u.record_id} value={u.record_id}>
                            {u.fields.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="satz">Satz Nr.</Label>
                      <Input
                        id="satz"
                        type="number"
                        value={quickLogForm.satz_nummer}
                        onChange={(e) => setQuickLogForm(prev => ({ ...prev, satz_nummer: parseInt(e.target.value) || 1 }))}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gewicht">Gewicht (kg)</Label>
                      <Input
                        id="gewicht"
                        type="number"
                        step="0.5"
                        value={quickLogForm.gewicht}
                        onChange={(e) => setQuickLogForm(prev => ({ ...prev, gewicht: e.target.value }))}
                        placeholder="z.B. 80"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wdh">Wiederholungen</Label>
                      <Input
                        id="wdh"
                        type="number"
                        value={quickLogForm.wiederholungen}
                        onChange={(e) => setQuickLogForm(prev => ({ ...prev, wiederholungen: e.target.value }))}
                        placeholder="z.B. 8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rpe">RPE</Label>
                      <Select
                        value={quickLogForm.rpe}
                        onValueChange={(val: any) => setQuickLogForm(prev => ({ ...prev, rpe: val }))}
                      >
                        <SelectTrigger id="rpe">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rpe_5">5 - Mittel</SelectItem>
                          <SelectItem value="rpe_6">6</SelectItem>
                          <SelectItem value="rpe_7">7</SelectItem>
                          <SelectItem value="rpe_8">8</SelectItem>
                          <SelectItem value="rpe_9">9</SelectItem>
                          <SelectItem value="rpe_10">10 - Maximal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={submitting || !quickLogForm.workout_id || !quickLogForm.uebung_id || !quickLogForm.gewicht || !quickLogForm.wiederholungen}
                      className="w-full font-bold"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      {submitting ? 'Speichern...' : 'Satz loggen'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Workouts diese Woche */}
          <Card className="border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center justify-between">
                Workouts diese Woche
                <Dumbbell className="h-5 w-5" style={{ color: COLORS.primary }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black" style={{ color: COLORS.secondary }}>
                  {workoutsThisWeek}
                </span>
                {currentGoal?.fields.trainingstage_pro_woche && (
                  <span className="text-xl text-slate-500 font-semibold">
                    / {currentGoal.fields.trainingstage_pro_woche}
                  </span>
                )}
              </div>
              {currentGoal?.fields.trainingstage_pro_woche && (
                <div className="mt-4 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((workoutsThisWeek / currentGoal.fields.trainingstage_pro_woche) * 100, 100)}%`,
                      backgroundColor: COLORS.primary
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kalorien heute */}
          <Card className="border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center justify-between">
                Kalorien heute
                <Flame className="h-5 w-5" style={{ color: COLORS.accent }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black" style={{ color: COLORS.secondary }}>
                  {Math.round(todayCalories)}
                </span>
                {currentGoal?.fields.taeglich_kalorien && (
                  <span className="text-xl text-slate-500 font-semibold">
                    / {currentGoal.fields.taeglich_kalorien}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                Protein: {Math.round(todayProtein)}g
                {currentGoal?.fields.taeglich_protein && ` / ${currentGoal.fields.taeglich_protein}g`}
              </p>
            </CardContent>
          </Card>

          {/* Gewicht */}
          <Card className="border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center justify-between">
                Aktuelles Gewicht
                <Scale className="h-5 w-5" style={{ color: COLORS.success }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestWeight ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black" style={{ color: COLORS.secondary }}>
                      {latestWeight.fields.gewicht_kg?.toFixed(1)}
                    </span>
                    <span className="text-xl text-slate-500 font-semibold">kg</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 font-medium">
                    {format(parseISO(latestWeight.fields.datum!), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </>
              ) : (
                <p className="text-slate-500 italic">Noch keine Daten</p>
              )}
            </CardContent>
          </Card>

          {/* Ø Workout Dauer */}
          <Card className="border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center justify-between">
                Ø Workout-Dauer
                <Activity className="h-5 w-5" style={{ color: COLORS.secondary }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black" style={{ color: COLORS.secondary }}>
                  {avgWorkoutDuration}
                </span>
                <span className="text-xl text-slate-500 font-semibold">min</span>
              </div>
              <p className="text-sm text-slate-600 mt-2 font-medium">Letzte 7 Tage</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kalorien & Protein Trend */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <TrendingUp className="h-5 w-5" />
                Ernährungs-Trend (7 Tage)
              </CardTitle>
              <CardDescription className="font-medium">Kalorien & Protein im Vergleich zum Ziel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={caloriesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px', fontWeight: 600 }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #E2E8F0',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: 600 }} />
                  <Line
                    type="monotone"
                    dataKey="kalorien"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    name="Kalorien (kcal)"
                    dot={{ fill: COLORS.primary, r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    stroke={COLORS.success}
                    strokeWidth={3}
                    name="Protein (g)"
                    dot={{ fill: COLORS.success, r: 5 }}
                  />
                  {currentGoal?.fields.taeglich_kalorien && (
                    <Line
                      type="monotone"
                      dataKey="ziel_kalorien"
                      stroke={COLORS.neutral}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Ziel Kalorien"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gewichtsverlauf */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <Scale className="h-5 w-5" />
                Gewichtsverlauf (30 Tage)
              </CardTitle>
              <CardDescription className="font-medium">Entwicklung deines Körpergewichts</CardDescription>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <YAxis
                      stroke="#64748B"
                      style={{ fontSize: '12px', fontWeight: 600 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                      formatter={(value: any) => [`${value} kg`, 'Gewicht']}
                    />
                    <Line
                      type="monotone"
                      dataKey="gewicht"
                      stroke={COLORS.success}
                      strokeWidth={3}
                      name="Gewicht (kg)"
                      dot={{ fill: COLORS.success, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p className="text-center font-medium">
                    Noch keine Gewichtsdaten vorhanden.<br />Beginne mit dem Tracking!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Makro-Verteilung heute */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <Apple className="h-5 w-5" />
                Makros heute
              </CardTitle>
              <CardDescription className="font-medium">Verteilung in kcal</CardDescription>
            </CardHeader>
            <CardContent>
              {todayCalories > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.display}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                      formatter={(value: any, name: string) => [`${Math.round(value)} kcal`, name]}
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  <p className="text-center font-medium">
                    Noch keine Mahlzeiten heute geloggt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trainings-Verteilung */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <Target className="h-5 w-5" />
                Trainingstypen
              </CardTitle>
              <CardDescription className="font-medium">Letzte 30 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workoutTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#64748B" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                      formatter={(value: any) => [`${value} Workouts`, 'Anzahl']}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  <p className="text-center font-medium">Noch keine Workouts vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Übungen */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <Trophy className="h-5 w-5" />
                Top Übungen
              </CardTitle>
              <CardDescription className="font-medium">Meist geloggt</CardDescription>
            </CardHeader>
            <CardContent>
              {topExercises.length > 0 ? (
                <div className="space-y-4">
                  {topExercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm"
                          style={{ backgroundColor: COLORS.chart[idx % COLORS.chart.length] }}
                        >
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-700">{ex.name}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="font-bold px-3 py-1"
                        style={{ backgroundColor: `${COLORS.chart[idx % COLORS.chart.length]}20` }}
                      >
                        {ex.count} Sätze
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  <p className="text-center font-medium">Noch keine Logs vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Letzte Workouts */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
              <Calendar className="h-5 w-5" />
              Letzte Workouts
            </CardTitle>
            <CardDescription className="font-medium">Deine neuesten Trainingseinheiten</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.record_id}
                    className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        className="font-bold"
                        style={{
                          backgroundColor: `${getMoodColor(workout.fields.stimmung)}30`,
                          color: getMoodColor(workout.fields.stimmung)
                        }}
                      >
                        {getLookupLabel('typ', workout.fields.typ || '')}
                      </Badge>
                    </div>
                    <p className="text-2xl font-black mb-2" style={{ color: COLORS.secondary }}>
                      {format(parseISO(workout.fields.datum!), 'dd.MM', { locale: de })}
                    </p>
                    <div className="space-y-1 text-sm">
                      {workout.fields.dauer_minuten && (
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Zap className="h-4 w-4" style={{ color: COLORS.accent }} />
                          {workout.fields.dauer_minuten} min
                        </div>
                      )}
                      {workout.fields.stimmung && (
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Brain className="h-4 w-4" style={{ color: getMoodColor(workout.fields.stimmung) }} />
                          {getLookupLabel('stimmung', workout.fields.stimmung)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Noch keine Workouts vorhanden</p>
                <p className="text-sm mt-2">Starte dein erstes Training!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktive Ziele */}
        {activeGoals.length > 0 && (
          <Card className="border-2 shadow-lg bg-gradient-to-br from-white to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black" style={{ color: COLORS.secondary }}>
                <Award className="h-5 w-5" />
                Deine Ziele
              </CardTitle>
              <CardDescription className="font-medium">Aktive Fitnessziele</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeGoals.map((goal) => (
                  <div key={goal.record_id} className="border-2 rounded-lg p-5 bg-white">
                    <Badge className="mb-3 font-bold" style={{ backgroundColor: COLORS.success }}>
                      {getLookupLabel('status', goal.fields.status || '')}
                    </Badge>
                    <div className="space-y-3">
                      {goal.fields.taeglich_kalorien && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600">Tägliche Kalorien:</span>
                          <span className="text-lg font-black" style={{ color: COLORS.secondary }}>
                            {goal.fields.taeglich_kalorien} kcal
                          </span>
                        </div>
                      )}
                      {goal.fields.taeglich_protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600">Tägliches Protein:</span>
                          <span className="text-lg font-black" style={{ color: COLORS.secondary }}>
                            {goal.fields.taeglich_protein}g
                          </span>
                        </div>
                      )}
                      {goal.fields.trainingstage_pro_woche && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600">Trainingstage/Woche:</span>
                          <span className="text-lg font-black" style={{ color: COLORS.secondary }}>
                            {goal.fields.trainingstage_pro_woche}
                          </span>
                        </div>
                      )}
                      {goal.fields.schlaf_ziel_stunden && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600">Schlafziel:</span>
                          <span className="text-lg font-black" style={{ color: COLORS.secondary }}>
                            {goal.fields.schlaf_ziel_stunden}h
                          </span>
                        </div>
                      )}
                      {goal.fields.notizen && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-slate-600 italic font-medium">{goal.fields.notizen}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
