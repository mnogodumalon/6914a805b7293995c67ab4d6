import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Utensils, Weight, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [w, e, k, z] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
        ]);
        setWorkouts(w);
        setErnaehrung(e);
        setKoerperdaten(k);
        setZiele(z);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get active goals
  const activeGoal = useMemo(() => {
    return ziele.find(z => z.fields.status === 'aktiv') || ziele[0];
  }, [ziele]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    // Workouts this week (non-rest days)
    const workoutsThisWeek = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum);
      return workoutDate >= sevenDaysAgo && workoutDate <= today;
    }).length;

    // Calories and protein today
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter(e => e.fields.datum === todayStr);
    const caloriesToday = todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);
    const proteinToday = todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0);

    // Latest weight
    const sortedWeights = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg != null)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''));
    const latestWeight = sortedWeights[0]?.fields.gewicht_kg || null;
    const previousWeight = sortedWeights[1]?.fields.gewicht_kg || null;
    const weightTrend = latestWeight && previousWeight ? latestWeight - previousWeight : null;

    return {
      workoutsThisWeek,
      workoutsGoal: activeGoal?.fields.trainingstage_pro_woche || 4,
      caloriesToday,
      caloriesGoal: activeGoal?.fields.taeglich_kalorien || 2000,
      proteinToday,
      proteinGoal: activeGoal?.fields.taeglich_protein || 150,
      latestWeight,
      weightTrend,
    };
  }, [workouts, ernaehrung, koerperdaten, activeGoal]);

  // Chart data - Last 7 days workouts
  const workoutChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });

    return last7Days.map(dateStr => {
      const workout = workouts.find(w => w.fields.datum === dateStr && !w.fields.rest_day);
      return {
        date: format(parseISO(dateStr), 'EEE', { locale: de }),
        dauer: workout?.fields.dauer_minuten || 0,
      };
    });
  }, [workouts]);

  // Weight chart data - Last 30 days
  const weightChartData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg != null && k.fields.datum)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
      .slice(-30);

    return sorted.map(k => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg,
    }));
  }, [koerperdaten]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5);
  }, [workouts]);

  // Today's meals
  const todayMeals = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return ernaehrung.filter(e => e.fields.datum === todayStr);
  }, [ernaehrung]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  if (workouts.length === 0 && ernaehrung.length === 0 && koerperdaten.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fitness Dashboard</h1>
            <p className="text-muted-foreground">Deine Fortschritte im Überblick</p>
          </div>
        </div>

        {/* Hero KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Workouts diese Woche
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.workoutsThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {kpis.workoutsGoal} / Woche
              </p>
              {kpis.workoutsThisWeek >= kpis.workoutsGoal && (
                <Badge className="mt-2 bg-primary text-primary-foreground">Ziel erreicht!</Badge>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kalorien heute
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(kpis.caloriesToday)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {kpis.caloriesGoal} kcal
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (kpis.caloriesToday / kpis.caloriesGoal) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Protein heute
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(kpis.proteinToday)}g</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {kpis.proteinGoal}g
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (kpis.proteinToday / kpis.proteinGoal) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktuelles Gewicht
              </CardTitle>
              <Weight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.latestWeight ? `${kpis.latestWeight.toFixed(1)} kg` : '-'}
              </div>
              {kpis.weightTrend !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {kpis.weightTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-primary" />
                  )}
                  <p className={`text-xs ${kpis.weightTrend > 0 ? 'text-destructive' : 'text-primary'}`}>
                    {kpis.weightTrend > 0 ? '+' : ''}{kpis.weightTrend.toFixed(1)} kg
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingsaktivität (7 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutChartData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                      label={{ value: 'Minuten', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="dauer" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weight Trend Chart */}
          {weightChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                        label={{ value: 'kg', angle: -90, position: 'insideLeft', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="gewicht"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Letzte Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Workouts vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {workout.fields.typ ? workout.fields.typ.charAt(0).toUpperCase() + workout.fields.typ.slice(1) : 'Training'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {workout.fields.datum ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de }) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{workout.fields.dauer_minuten || 0} Min</p>
                        {workout.fields.stimmung && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {workout.fields.stimmung}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Nutrition */}
          <Card>
            <CardHeader>
              <CardTitle>Heutige Mahlzeiten</CardTitle>
            </CardHeader>
            <CardContent>
              {todayMeals.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Mahlzeiten heute erfasst</p>
              ) : (
                <div className="space-y-3">
                  {todayMeals.map((meal) => (
                    <div
                      key={meal.record_id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">
                          {meal.fields.mahlzeit_typ ?
                            meal.fields.mahlzeit_typ.replace('_', '-').charAt(0).toUpperCase() +
                            meal.fields.mahlzeit_typ.replace('_', '-').slice(1)
                            : 'Mahlzeit'}
                        </p>
                        <p className="text-sm font-medium">{meal.fields.kalorien || 0} kcal</p>
                      </div>
                      {meal.fields.beschreibung && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{meal.fields.beschreibung}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {meal.fields.protein != null && <span>P: {meal.fields.protein}g</span>}
                        {meal.fields.carbs != null && <span>K: {meal.fields.carbs}g</span>}
                        {meal.fields.fett != null && <span>F: {meal.fields.fett}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{error.message}</p>
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-background text-foreground rounded-md hover:bg-muted transition-colors"
          >
            Erneut versuchen
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Noch keine Daten vorhanden</h2>
        <p className="text-muted-foreground mb-6">
          Starte jetzt mit deinem ersten Workout und tracke deine Ernährung!
        </p>
      </div>
    </div>
  );
}
