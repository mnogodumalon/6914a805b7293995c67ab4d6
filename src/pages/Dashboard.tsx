import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Dumbbell,
  Flame,
  Target,
  Scale,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Clock,
  Smile,
} from 'lucide-react';

import type {
  Workouts,
  Ernaehrung,
  Koerperdaten,
  Ziele,
} from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Lookup data for workout types
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

const STIMMUNG_LABELS: Record<string, { label: string; color: string }> = {
  schlecht: { label: 'Schlecht', color: 'bg-red-100 text-red-700' },
  okay: { label: 'Okay', color: 'bg-yellow-100 text-yellow-700' },
  gut: { label: 'Gut', color: 'bg-green-100 text-green-700' },
  brutal: { label: 'Brutal', color: 'bg-primary/10 text-primary' },
};

function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new workout
  const [newWorkout, setNewWorkout] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
  });

  // Fetch all data
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

  // Calculate weekly training count
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekWorkouts = workouts.filter((w) => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum.split('T')[0]);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    return {
      count: thisWeekWorkouts.length,
      weekStart,
      weekEnd,
    };
  }, [workouts]);

  // Get active goal
  const activeGoal = useMemo(() => {
    return ziele.find((z) => z.fields.status === 'aktiv');
  }, [ziele]);

  // Today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter(
      (e) => e.fields.datum?.split('T')[0] === today
    );

    return {
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
    };
  }, [ernaehrung]);

  // Latest body weight and trend
  const weightData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      });

    const latest = sorted[0];
    const previous = sorted[1];

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let diff = 0;

    if (latest && previous && latest.fields.gewicht_kg && previous.fields.gewicht_kg) {
      diff = latest.fields.gewicht_kg - previous.fields.gewicht_kg;
      trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    }

    return {
      latest: latest?.fields.gewicht_kg,
      trend,
      diff: Math.abs(diff).toFixed(1),
    };
  }, [koerperdaten]);

  // Chart data for weight
  const weightChartData = useMemo(() => {
    return [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateA.localeCompare(dateB);
      })
      .slice(-14) // Last 14 entries
      .map((k) => ({
        date: format(parseISO(k.fields.datum!.split('T')[0]), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      }));
  }, [koerperdaten]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter((w) => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [workouts]);

  // Handle new workout submission
  async function handleSubmitWorkout(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createWorkout({
        datum: newWorkout.datum,
        typ: newWorkout.typ as Workouts['fields']['typ'],
        dauer_minuten: newWorkout.dauer_minuten
          ? Number(newWorkout.dauer_minuten)
          : undefined,
        stimmung: newWorkout.stimmung as Workouts['fields']['stimmung'],
      });

      // Refresh workouts
      const updatedWorkouts = await LivingAppsService.getWorkouts();
      setWorkouts(updatedWorkouts);

      // Reset form and close dialog
      setNewWorkout({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: '',
        dauer_minuten: '',
        stimmung: '',
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-destructive">
              Fehler beim Laden der Daten
            </p>
            <p className="mt-2 text-muted-foreground">{error.message}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goalTrainingDays = activeGoal?.fields.trainingstage_pro_woche || 4;
  const goalKalorien = activeGoal?.fields.taeglich_kalorien || 2000;
  const goalProtein = activeGoal?.fields.taeglich_protein || 150;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Fitness Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>

          {/* Desktop: Button in header */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hidden md:flex">
                <Plus className="mr-2 h-4 w-4" />
                Workout starten
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neues Workout</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitWorkout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={newWorkout.datum}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, datum: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typ">Trainingstyp</Label>
                  <Select
                    value={newWorkout.typ || 'none'}
                    onValueChange={(v) =>
                      setNewWorkout({
                        ...newWorkout,
                        typ: v === 'none' ? '' : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Typ</SelectItem>
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
                    value={newWorkout.dauer_minuten}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        dauer_minuten: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stimmung">Stimmung</Label>
                  <Select
                    value={newWorkout.stimmung || 'none'}
                    onValueChange={(v) =>
                      setNewWorkout({
                        ...newWorkout,
                        stimmung: v === 'none' ? '' : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wie war's?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Angabe</SelectItem>
                      <SelectItem value="schlecht">Schlecht</SelectItem>
                      <SelectItem value="okay">Okay</SelectItem>
                      <SelectItem value="gut">Gut</SelectItem>
                      <SelectItem value="brutal">Brutal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {/* Hero KPI - Training Streak */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-8 md:flex-row md:justify-between md:py-10">
            <div className="flex flex-col items-center text-center md:flex-row md:text-left">
              <div className="relative mb-4 md:mb-0 md:mr-8">
                {/* Circular progress ring */}
                <svg className="h-32 w-32 -rotate-90 transform md:h-40 md:w-40">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(weeklyStats.count / goalTrainingDays) * 283} 283`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold md:text-5xl">
                    {weeklyStats.count}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    von {goalTrainingDays}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Diese Woche
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {weeklyStats.count >= goalTrainingDays
                    ? 'Ziel erreicht!'
                    : `Noch ${goalTrainingDays - weeklyStats.count} Training${goalTrainingDays - weeklyStats.count !== 1 ? 's' : ''} bis zum Ziel`}
                </p>
              </div>
            </div>
            <Dumbbell className="mt-4 hidden h-16 w-16 text-primary/20 md:mt-0 md:block" />
          </CardContent>
        </Card>

        {/* Desktop: Two column layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column - 60% */}
          <div className="space-y-6 lg:col-span-3">
            {/* Weight Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Gewichtsverlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightChartData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightChartData}>
                        <defs>
                          <linearGradient
                            id="weightGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickFormatter={(v) => `${v} kg`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value} kg`, 'Gewicht']}
                        />
                        <Area
                          type="monotone"
                          dataKey="gewicht"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#weightGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    Noch keine Gewichtsdaten vorhanden
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Letzte Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorkouts.map((workout) => (
                      <div
                        key={workout.record_id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {workout.fields.typ
                                ? WORKOUT_TYPES[workout.fields.typ]
                                : 'Workout'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {workout.fields.datum
                                ? format(
                                    parseISO(workout.fields.datum.split('T')[0]),
                                    'EEEE, d. MMM',
                                    { locale: de }
                                  )
                                : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {workout.fields.dauer_minuten && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {workout.fields.dauer_minuten} min
                            </div>
                          )}
                          {workout.fields.stimmung &&
                            STIMMUNG_LABELS[workout.fields.stimmung] && (
                              <Badge
                                variant="secondary"
                                className={
                                  STIMMUNG_LABELS[workout.fields.stimmung].color
                                }
                              >
                                {STIMMUNG_LABELS[workout.fields.stimmung].label}
                              </Badge>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Dumbbell className="mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Noch keine Workouts eingetragen
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setDialogOpen(true)}
                    >
                      Erstes Workout starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - 40% */}
          <div className="space-y-6 lg:col-span-2">
            {/* Current Weight */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Aktuelles Gewicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.latest != null ? (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">
                      {weightData.latest.toFixed(1)}
                    </span>
                    <span className="mb-1 text-lg text-muted-foreground">
                      kg
                    </span>
                    {weightData.trend !== 'neutral' && (
                      <span
                        className={`mb-1 flex items-center text-sm ${
                          weightData.trend === 'down'
                            ? 'text-green-600'
                            : 'text-red-500'
                        }`}
                      >
                        {weightData.trend === 'down' ? (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        ) : (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        )}
                        {weightData.diff} kg
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Keine Daten</p>
                )}
              </CardContent>
            </Card>

            {/* Today's Calories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  Kalorien heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">
                      {todayNutrition.kalorien.toLocaleString('de-DE')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {goalKalorien.toLocaleString('de-DE')} kcal
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (todayNutrition.kalorien / goalKalorien) * 100,
                      100
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Today's Protein */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Protein heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">
                      {todayNutrition.protein}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {goalProtein} g
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (todayNutrition.protein / goalProtein) * 100,
                      100
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {activeGoal && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                    Aktives Ziel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {activeGoal.fields.taeglich_kalorien && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tägliche Kalorien
                        </span>
                        <span className="font-medium">
                          {activeGoal.fields.taeglich_kalorien.toLocaleString(
                            'de-DE'
                          )}{' '}
                          kcal
                        </span>
                      </div>
                    )}
                    {activeGoal.fields.taeglich_protein && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tägliches Protein
                        </span>
                        <span className="font-medium">
                          {activeGoal.fields.taeglich_protein} g
                        </span>
                      </div>
                    )}
                    {activeGoal.fields.trainingstage_pro_woche && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Trainingstage/Woche
                        </span>
                        <span className="font-medium">
                          {activeGoal.fields.trainingstage_pro_woche}
                        </span>
                      </div>
                    )}
                    {activeGoal.fields.schlaf_ziel_stunden && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schlafziel</span>
                        <span className="font-medium">
                          {activeGoal.fields.schlaf_ziel_stunden} h
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}

export default Dashboard;
