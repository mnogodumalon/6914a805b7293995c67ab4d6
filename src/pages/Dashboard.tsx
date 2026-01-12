import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, isWithinInterval, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dumbbell, Flame, Target, Scale, Clock, Plus, TrendingUp, Utensils } from 'lucide-react';

// Lookup data for display
const WORKOUT_TYPES: Record<string, string> = {
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

const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
};

function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'ganzkoerper',
    dauer_minuten: '',
    stimmung: 'gut',
  });

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
        setError(err instanceof Error ? err : new Error('Fehler beim Laden'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get active goal
  const activeGoal = useMemo(() => {
    return ziele.find((z) => z.fields.status === 'aktiv');
  }, [ziele]);

  // Calculate weekly workout stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekWorkouts = workouts.filter((w) => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });

    const totalMinutes = thisWeekWorkouts.reduce(
      (sum, w) => sum + (w.fields.dauer_minuten || 0),
      0
    );

    return {
      count: thisWeekWorkouts.length,
      goal: activeGoal?.fields.trainingstage_pro_woche || 4,
      totalMinutes,
    };
  }, [workouts, activeGoal]);

  // Calculate today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter((e) => e.fields.datum === today);

    return {
      kalorien: todayMeals.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, e) => sum + (e.fields.protein || 0), 0),
      kalorienGoal: activeGoal?.fields.taeglich_kalorien || 2000,
      proteinGoal: activeGoal?.fields.taeglich_protein || 150,
      meals: todayMeals,
    };
  }, [ernaehrung, activeGoal]);

  // Get latest weight
  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[0]?.fields.gewicht_kg;
  }, [koerperdaten]);

  // Chart data for weight trend
  const weightChartData = useMemo(() => {
    return [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
      .slice(-14)
      .map((k) => ({
        date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      }));
  }, [koerperdaten]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter((w) => !w.fields.rest_day)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [workouts]);

  // Handle workout form submit
  async function handleWorkoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await LivingAppsService.createWorkout({
        datum: workoutForm.datum,
        typ: workoutForm.typ as Workouts['fields']['typ'],
        dauer_minuten: workoutForm.dauer_minuten ? Number(workoutForm.dauer_minuten) : undefined,
        stimmung: workoutForm.stimmung as Workouts['fields']['stimmung'],
        rest_day: false,
      });
      // Refresh data
      const newWorkouts = await LivingAppsService.getWorkouts();
      setWorkouts(newWorkouts);
      setWorkoutDialogOpen(false);
      setWorkoutForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'ganzkoerper',
        dauer_minuten: '',
        stimmung: 'gut',
      });
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error.message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(
    (weeklyStats.count / weeklyStats.goal) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Fitness Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
            </p>
          </div>
          <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hidden md:flex">
                <Plus className="h-4 w-4" />
                Workout starten
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Workout</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleWorkoutSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={workoutForm.datum}
                    onChange={(e) =>
                      setWorkoutForm({ ...workoutForm, datum: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trainingstyp</Label>
                  <Select
                    value={workoutForm.typ}
                    onValueChange={(v) => setWorkoutForm({ ...workoutForm, typ: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORKOUT_TYPES).map(([key, label]) => (
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
                    placeholder="z.B. 60"
                    value={workoutForm.dauer_minuten}
                    onChange={(e) =>
                      setWorkoutForm({ ...workoutForm, dauer_minuten: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stimmung</Label>
                  <Select
                    value={workoutForm.stimmung}
                    onValueChange={(v) =>
                      setWorkoutForm({ ...workoutForm, stimmung: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Speichern...' : 'Workout speichern'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section - Weekly Progress Ring */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Progress Ring */}
              <div className="relative w-32 h-32 mx-auto md:mx-0 flex-shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    className="text-primary transition-all duration-500"
                    strokeDasharray={`${progressPercent * 3.52} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{weeklyStats.count}</span>
                  <span className="text-xs text-muted-foreground">
                    von {weeklyStats.goal}
                  </span>
                </div>
              </div>

              <div className="text-center md:text-left flex-1">
                <h2 className="text-lg font-semibold mb-1">Woche im Überblick</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {weeklyStats.count >= weeklyStats.goal
                    ? 'Ziel erreicht! Großartige Arbeit!'
                    : `Noch ${weeklyStats.goal - weeklyStats.count} Training${weeklyStats.goal - weeklyStats.count !== 1 ? 's' : ''} bis zum Wochenziel`}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {weeklyStats.totalMinutes} Minuten diese Woche
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Kalorien heute
                </span>
              </div>
              <div className="text-2xl font-bold">
                {todayNutrition.kalorien.toLocaleString('de-DE')}
              </div>
              <div className="text-xs text-muted-foreground">
                / {todayNutrition.kalorienGoal.toLocaleString('de-DE')} kcal
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min((todayNutrition.kalorien / todayNutrition.kalorienGoal) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Protein heute
                </span>
              </div>
              <div className="text-2xl font-bold">{todayNutrition.protein}g</div>
              <div className="text-xs text-muted-foreground">
                / {todayNutrition.proteinGoal}g
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(152,55%,42%)] transition-all"
                  style={{
                    width: `${Math.min((todayNutrition.protein / todayNutrition.proteinGoal) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Aktuelles Gewicht
                </span>
              </div>
              <div className="text-2xl font-bold">
                {latestWeight ? `${latestWeight.toFixed(1)} kg` : '–'}
              </div>
              <div className="text-xs text-muted-foreground">Letzte Messung</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Trainingszeit
                </span>
              </div>
              <div className="text-2xl font-bold">{weeklyStats.totalMinutes}</div>
              <div className="text-xs text-muted-foreground">Minuten diese Woche</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left Column - Chart + Workouts */}
          <div className="md:col-span-3 space-y-6">
            {/* Weight Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">
                    Gewichtsverlauf
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {weightChartData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightChartData}>
                        <defs>
                          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="hsl(12, 76%, 58%)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(12, 76%, 58%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          stroke="hsl(20, 10%, 45%)"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tick={{ fontSize: 11 }}
                          stroke="hsl(20, 10%, 45%)"
                          tickLine={false}
                          axisLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(30, 15%, 90%)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value} kg`, 'Gewicht']}
                        />
                        <Area
                          type="monotone"
                          dataKey="gewicht"
                          stroke="hsl(12, 76%, 58%)"
                          strokeWidth={2}
                          fill="url(#weightGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    Noch keine Gewichtsdaten vorhanden
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">
                    Letzte Workouts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorkouts.map((workout) => (
                      <div
                        key={workout.record_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {WORKOUT_TYPES[workout.fields.typ || 'sonstiges']}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {workout.fields.datum
                                ? format(parseISO(workout.fields.datum), 'd. MMM', {
                                    locale: de,
                                  })
                                : '–'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {workout.fields.dauer_minuten && (
                            <span className="text-sm text-muted-foreground">
                              {workout.fields.dauer_minuten} min
                            </span>
                          )}
                          {workout.fields.stimmung && (
                            <Badge
                              variant="secondary"
                              className={
                                workout.fields.stimmung === 'brutal'
                                  ? 'bg-[hsl(152,55%,42%)]/10 text-[hsl(152,55%,42%)]'
                                  : workout.fields.stimmung === 'gut'
                                    ? 'bg-primary/10 text-primary'
                                    : ''
                              }
                            >
                              {STIMMUNG_LABELS[workout.fields.stimmung]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Workouts vorhanden</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setWorkoutDialogOpen(true)}
                    >
                      Erstes Workout starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Today's Nutrition */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">
                    Heutige Mahlzeiten
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {todayNutrition.meals.length > 0 ? (
                  <div className="space-y-3">
                    {todayNutrition.meals.map((meal) => (
                      <div
                        key={meal.record_id}
                        className="p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary">
                            {MAHLZEIT_LABELS[meal.fields.mahlzeit_typ || 'sonstiges']}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {meal.fields.kalorien || 0} kcal
                          </span>
                        </div>
                        {meal.fields.beschreibung && (
                          <p className="text-sm truncate">
                            {meal.fields.beschreibung}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>P: {meal.fields.protein || 0}g</span>
                          <span>K: {meal.fields.carbs || 0}g</span>
                          <span>F: {meal.fields.fett || 0}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Mahlzeiten heute</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals Summary */}
            {activeGoal && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Aktive Ziele</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tägliche Kalorien</span>
                    <span className="font-medium">
                      {activeGoal.fields.taeglich_kalorien?.toLocaleString('de-DE')} kcal
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tägliches Protein</span>
                    <span className="font-medium">
                      {activeGoal.fields.taeglich_protein}g
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trainingstage/Woche</span>
                    <span className="font-medium">
                      {activeGoal.fields.trainingstage_pro_woche}x
                    </span>
                  </div>
                  {activeGoal.fields.schlaf_ziel_stunden && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Schlafziel</span>
                      <span className="font-medium">
                        {activeGoal.fields.schlaf_ziel_stunden}h
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6">
        <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[180px] w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-6">
            <Skeleton className="h-[280px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
