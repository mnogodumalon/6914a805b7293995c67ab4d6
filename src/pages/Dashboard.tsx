import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, subDays, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, Dumbbell, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';

// Lookup-Mappings
const WORKOUT_TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal',
};

const STIMMUNG_COLORS: Record<string, string> = {
  schlecht: 'destructive',
  okay: 'secondary',
  gut: 'default',
  brutal: 'default',
};

// Chart Colors
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  ziele: Ziele[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [workouts, ernaehrung, koerperdaten, ziele] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
        ]);
        setData({ workouts, ernaehrung, koerperdaten, ziele });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Fehler beim Laden</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!data) return null;

  // Date helpers
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Get active goal
  const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv');

  // --- KPI 1: Today's Workout ---
  const todayWorkout = data.workouts.find(w => w.fields.datum === today);
  const todayWorkoutDisplay = todayWorkout
    ? todayWorkout.fields.rest_day
      ? 'Ruhetag'
      : `${WORKOUT_TYP_LABELS[todayWorkout.fields.typ || ''] || 'Training'} (${todayWorkout.fields.dauer_minuten || 0} min)`
    : 'Kein Training';

  // --- KPI 2: Today's Calories ---
  const todayCalories = data.ernaehrung
    .filter(e => e.fields.datum === today)
    .reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const calorieGoal = activeGoal?.fields.taeglich_kalorien || 2000;
  const calorieProgress = Math.min(Math.round((todayCalories / calorieGoal) * 100), 100);

  // --- KPI 3: Today's Protein ---
  const todayProtein = data.ernaehrung
    .filter(e => e.fields.datum === today)
    .reduce((sum, e) => sum + (e.fields.protein || 0), 0);
  const proteinGoal = activeGoal?.fields.taeglich_protein || 150;
  const proteinProgress = Math.min(Math.round((todayProtein / proteinGoal) * 100), 100);

  // --- KPI 4: Weekly Workouts ---
  const weeklyWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    try {
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  }).length;
  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche || 4;

  // --- Chart 1: Workout Frequency (Last 4 Weeks) ---
  const workoutFrequencyData = (() => {
    const weeks: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const count = data.workouts.filter(w => {
        if (!w.fields.datum || w.fields.rest_day) return false;
        try {
          const workoutDate = parseISO(w.fields.datum);
          return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
        } catch {
          return false;
        }
      }).length;
      weeks.push({
        week: `KW ${format(weekStart, 'w', { locale: de })}`,
        count,
      });
    }
    return weeks;
  })();

  // --- Chart 2: Training Types Distribution (Last 30 Days) ---
  const trainingTypesData = (() => {
    const last30Days = subDays(new Date(), 30);
    const typeCounts: Record<string, number> = {};
    data.workouts
      .filter(w => {
        if (!w.fields.datum || w.fields.rest_day || !w.fields.typ) return false;
        try {
          const workoutDate = parseISO(w.fields.datum);
          return workoutDate >= last30Days;
        } catch {
          return false;
        }
      })
      .forEach(w => {
        const typ = w.fields.typ!;
        typeCounts[typ] = (typeCounts[typ] || 0) + 1;
      });
    return Object.entries(typeCounts).map(([key, value]) => ({
      name: WORKOUT_TYP_LABELS[key] || key,
      value,
    }));
  })();

  // --- Chart 3: Weight Progress (Last 90 Days) ---
  const weightProgressData = (() => {
    const last90Days = subDays(new Date(), 90);
    return data.koerperdaten
      .filter(k => {
        if (!k.fields.datum || !k.fields.gewicht_kg) return false;
        try {
          const date = parseISO(k.fields.datum);
          return date >= last90Days;
        } catch {
          return false;
        }
      })
      .map(k => ({
        datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      }))
      .sort((a, b) => a.datum.localeCompare(b.datum));
  })();

  // --- Chart 4: Nutrition Consistency (Last 14 Days) ---
  const nutritionConsistencyData = (() => {
    const days: { datum: string; kalorien: number; protein: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayData = data.ernaehrung.filter(e => e.fields.datum === date);
      const kalorien = dayData.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
      const protein = dayData.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
      days.push({
        datum: format(subDays(new Date(), i), 'dd.MM', { locale: de }),
        kalorien,
        protein,
      });
    }
    return days;
  })();

  // --- Recent Workouts Table ---
  const recentWorkouts = data.workouts
    .filter(w => w.fields.datum && !w.fields.rest_day)
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fitness & Ernährungs-Tracker</h1>
        <p className="text-muted-foreground">Deine persönliche Übersicht</p>
      </div>

      {/* KPIs - Heute */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Heute</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Today's Workout */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heutiges Training</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayWorkoutDisplay}</div>
              {todayWorkout?.fields.stimmung && (
                <Badge variant={STIMMUNG_COLORS[todayWorkout.fields.stimmung] as any} className="mt-2">
                  {STIMMUNG_LABELS[todayWorkout.fields.stimmung]}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* KPI 2: Today's Calories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalorien Heute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCalories} kcal</div>
              <div className="text-xs text-muted-foreground mb-2">Ziel: {calorieGoal} kcal</div>
              <Progress value={calorieProgress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">{calorieProgress}%</div>
            </CardContent>
          </Card>

          {/* KPI 3: Today's Protein */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein Heute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(todayProtein)} g</div>
              <div className="text-xs text-muted-foreground mb-2">Ziel: {proteinGoal} g</div>
              <Progress value={proteinProgress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">{proteinProgress}%</div>
            </CardContent>
          </Card>

          {/* KPI 4: Weekly Workouts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trainings diese Woche</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyWorkouts} / {weeklyGoal}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {weeklyWorkouts >= weeklyGoal ? 'Ziel erreicht!' : `Noch ${weeklyGoal - weeklyWorkouts} Training(s)`}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts - Diese Woche */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Diese Woche</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Workout Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingsfrequenz (Letzte 4 Wochen)</CardTitle>
              <CardDescription>Anzahl der Trainings pro Woche</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workoutFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} name="Trainings" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty>
                  <EmptyDescription>Keine Trainings erfasst</EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Training Types */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingsarten (Letzter Monat)</CardTitle>
              <CardDescription>Verteilung der Trainingstypen</CardDescription>
            </CardHeader>
            <CardContent>
              {trainingTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trainingTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trainingTypesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty>
                  <EmptyDescription>Keine Trainings erfasst</EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts - Fortschritt */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Fortschritt</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Weight Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Gewichtsentwicklung</CardTitle>
              <CardDescription>Letzte 90 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              {weightProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gewicht" stroke={CHART_COLORS[4]} name="Gewicht (kg)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty>
                  <EmptyDescription>Keine Körperdaten erfasst</EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>

          {/* Chart 4: Nutrition Consistency */}
          <Card>
            <CardHeader>
              <CardTitle>Ernährungsconsistenz (14 Tage)</CardTitle>
              <CardDescription>Tägliche Kalorien und Protein</CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionConsistencyData.some(d => d.kalorien > 0 || d.protein > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nutritionConsistencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="kalorien" fill={CHART_COLORS[2]} name="Kalorien" />
                    <Bar dataKey="protein" fill={CHART_COLORS[1]} name="Protein (g)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty>
                  <EmptyDescription>Keine Ernährungsdaten erfasst</EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Workouts Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Letzte Trainings</CardTitle>
            <CardDescription>Deine jüngsten Trainingseinheiten</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout.record_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {workout.fields.datum && format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {WORKOUT_TYP_LABELS[workout.fields.typ || ''] || 'Training'}
                        {workout.fields.dauer_minuten && ` • ${workout.fields.dauer_minuten} min`}
                      </div>
                    </div>
                    {workout.fields.stimmung && (
                      <Badge variant={STIMMUNG_COLORS[workout.fields.stimmung] as any}>
                        {STIMMUNG_LABELS[workout.fields.stimmung]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyDescription>Noch keine Trainings erfasst</EmptyDescription>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
