import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, AlertCircle, Dumbbell, Scale, Flame } from 'lucide-react';

// Stimmung emoji mapping
const STIMMUNG_EMOJI: Record<string, string> = {
  schlecht: '😫',
  okay: '😐',
  gut: '😊',
  brutal: '💪',
};

// Workout type labels
const WORKOUT_TYPE_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

export default function Dashboard() {
  // Data states
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [weeklyWorkoutsOpen, setWeeklyWorkoutsOpen] = useState(false);
  const [workoutDetailOpen, setWorkoutDetailOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workouts | null>(null);
  const [nutritionDetailOpen, setNutritionDetailOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as Workouts['fields']['typ'],
    dauer_minuten: 60,
    stimmung: 'gut' as Workouts['fields']['stimmung'],
    rest_day: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [w, e, z, k, wl, u] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getZiele(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getWorkoutLogs(),
          LivingAppsService.getUebungen(),
        ]);
        setWorkouts(w);
        setErnaehrung(e);
        setZiele(z);
        setKoerperdaten(k);
        setWorkoutLogs(wl);
        setUebungen(u);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate weekly workouts
  const weeklyWorkoutsData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekWorkouts = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum.split('T')[0]);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    return thisWeekWorkouts;
  }, [workouts]);

  // Get active goal
  const activeGoal = useMemo(() => {
    return ziele.find(z => z.fields.status === 'aktiv') || ziele[0];
  }, [ziele]);

  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche || 5;
  const workoutsThisWeek = weeklyWorkoutsData.length;
  const progressPercent = Math.min((workoutsThisWeek / weeklyGoal) * 100, 100);

  // Today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter(e => e.fields.datum?.split('T')[0] === today);

    return {
      meals: todayMeals,
      calories: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fett: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0),
    };
  }, [ernaehrung]);

  // Latest body weight
  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[0]?.fields.gewicht_kg;
  }, [koerperdaten]);

  // Training streak calculation
  const trainingStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const hasWorkout = workouts.some(w => {
        const workoutDate = w.fields.datum?.split('T')[0];
        return workoutDate === checkDate && !w.fields.rest_day;
      });
      const hasRestDay = workouts.some(w => {
        const workoutDate = w.fields.datum?.split('T')[0];
        return workoutDate === checkDate && w.fields.rest_day;
      });

      if (hasWorkout || hasRestDay) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [workouts]);

  // Recent workouts (last 5)
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => !w.fields.rest_day)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [workouts]);

  // Chart data - last 7 days
  const chartData = useMemo(() => {
    const days: { name: string; duration: number; date: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayWorkouts = workouts.filter(w => w.fields.datum?.split('T')[0] === dateStr && !w.fields.rest_day);
      const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

      days.push({
        name: format(date, 'EEE', { locale: de }),
        duration: totalDuration,
        date: dateStr,
      });
    }

    return days;
  }, [workouts]);

  // Workout logs for selected workout
  const selectedWorkoutLogs = useMemo(() => {
    if (!selectedWorkout) return [];
    return workoutLogs.filter(log => {
      const workoutId = extractRecordId(log.fields.workout);
      return workoutId === selectedWorkout.record_id;
    });
  }, [workoutLogs, selectedWorkout]);

  // Create exercise lookup map
  const uebungenMap = useMemo(() => {
    const map = new Map<string, Uebungen>();
    uebungen.forEach(u => map.set(u.record_id, u));
    return map;
  }, [uebungen]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.rest_day ? undefined : formData.typ,
        dauer_minuten: formData.rest_day ? undefined : formData.dauer_minuten,
        stimmung: formData.rest_day ? undefined : formData.stimmung,
        rest_day: formData.rest_day,
      });

      // Refresh workouts
      const newWorkouts = await LivingAppsService.getWorkouts();
      setWorkouts(newWorkouts);

      setAddWorkoutOpen(false);
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: 60,
        stimmung: 'gut',
        rest_day: false,
      });
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[65%] flex items-center justify-center py-20">
              <Skeleton className="w-64 h-64 rounded-full" />
            </div>
            <div className="lg:w-[35%] space-y-5">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <header className="px-6 pt-6 pb-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-foreground">Fitness Tracker</h1>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), 'EEE, d. MMMM', { locale: de })}
          </span>
        </header>

        {/* Hero - Progress Ring */}
        <div
          className="px-6 py-8 flex flex-col items-center cursor-pointer"
          onClick={() => setWeeklyWorkoutsOpen(true)}
        >
          <div className="relative w-56 h-56">
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="hsl(35 25% 92%)"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="hsl(16 65% 50%)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 5.34} 534`}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: progressPercent >= 100 ? 'drop-shadow(0 0 8px hsl(16 65% 50% / 0.5))' : 'none',
                }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-foreground">
                {workoutsThisWeek}/{weeklyGoal}
              </span>
              <span className="text-sm text-muted-foreground mt-1">Workouts diese Woche</span>
            </div>
          </div>
        </div>

        {/* Today's Stats Row */}
        <div className="px-6 pb-4">
          <div
            className="flex gap-4 cursor-pointer"
            onClick={() => setNutritionDetailOpen(true)}
          >
            <div className="flex-1 bg-card rounded-xl p-4 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Kalorien heute</div>
              <div className="text-lg font-semibold text-foreground">
                {todayNutrition.calories.toLocaleString('de-DE')} / {(activeGoal?.fields.taeglich_kalorien || 2200).toLocaleString('de-DE')}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayNutrition.calories / (activeGoal?.fields.taeglich_kalorien || 2200)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-1 bg-card rounded-xl p-4 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Protein heute</div>
              <div className="text-lg font-semibold text-foreground">
                {todayNutrition.protein}g / {activeGoal?.fields.taeglich_protein || 150}g
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((todayNutrition.protein / (activeGoal?.fields.taeglich_protein || 150)) * 100, 100)}%`,
                    backgroundColor: 'hsl(152 55% 40%)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="px-6 pb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Letzte Workouts</h2>
          <div className="space-y-2">
            {recentWorkouts.length === 0 ? (
              <div className="bg-card rounded-xl p-4 text-center text-muted-foreground">
                Noch keine Workouts. Starte dein erstes Training!
              </div>
            ) : (
              recentWorkouts.map(workout => (
                <div
                  key={workout.record_id}
                  className="bg-card rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedWorkout(workout);
                    setWorkoutDetailOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {WORKOUT_TYPE_LABELS[workout.fields.typ || 'sonstiges']}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workout.fields.datum && format(parseISO(workout.fields.datum.split('T')[0]), 'EEE, d. MMM', { locale: de })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{workout.fields.dauer_minuten} min</span>
                    <span className="text-lg">{STIMMUNG_EMOJI[workout.fields.stimmung || 'okay']}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="px-6 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="flex-shrink-0 bg-card rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{latestWeight ? `${latestWeight.toFixed(1)} kg` : '- kg'}</span>
            </div>
            <div className="flex-shrink-0 bg-card rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{trainingStreak} Tage Streak</span>
            </div>
            <div className="flex-shrink-0 bg-card rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {workouts.length > 0
                  ? `Ø ${Math.round(workouts.filter(w => !w.fields.rest_day).reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) / Math.max(workouts.filter(w => !w.fields.rest_day).length, 1))} min`
                  : '- min'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <Button
            className="w-full h-14 text-base font-medium"
            onClick={() => setAddWorkoutOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Workout starten
          </Button>
        </div>

        {/* Bottom padding for fixed button */}
        <div className="h-24" />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-10">
            {/* Left Column - 65% */}
            <div className="w-[65%] flex flex-col items-center justify-center min-h-[600px]">
              {/* Hero Progress Ring */}
              <div
                className="cursor-pointer group"
                onClick={() => setWeeklyWorkoutsOpen(true)}
              >
                <div className="relative w-72 h-72 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="hsl(35 25% 92%)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="hsl(16 65% 50%)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 5.34} 534`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: progressPercent >= 100 ? 'drop-shadow(0 0 12px hsl(16 65% 50% / 0.6))' : 'none',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold text-foreground">
                      {workoutsThisWeek}/{weeklyGoal}
                    </span>
                    <span className="text-base text-muted-foreground mt-2">Workouts diese Woche</span>
                  </div>
                </div>
              </div>

              {/* Date and Streak */}
              <div className="mt-10 text-center">
                <div className="text-lg text-muted-foreground">
                  Heute: {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
                </div>
                {trainingStreak > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-primary">
                    <Flame className="w-5 h-5" />
                    <span className="font-medium">{trainingStreak} Tage Streak</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - 35% */}
            <div className="w-[35%] space-y-5">
              {/* Today's Nutrition Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setNutritionDetailOpen(true)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Heute</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Kalorien</span>
                      <span className="font-medium">{todayNutrition.calories.toLocaleString('de-DE')} / {(activeGoal?.fields.taeglich_kalorien || 2200).toLocaleString('de-DE')} kcal</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((todayNutrition.calories / (activeGoal?.fields.taeglich_kalorien || 2200)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Protein</span>
                      <span className="font-medium">{todayNutrition.protein} / {activeGoal?.fields.taeglich_protein || 150}g</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((todayNutrition.protein / (activeGoal?.fields.taeglich_protein || 150)) * 100, 100)}%`,
                          backgroundColor: 'hsl(152 55% 40%)'
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Workouts Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Letzte Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentWorkouts.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4 text-sm">
                        Noch keine Workouts
                      </div>
                    ) : (
                      recentWorkouts.map(workout => (
                        <div
                          key={workout.record_id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedWorkout(workout);
                            setWorkoutDetailOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-12">
                              {workout.fields.datum && format(parseISO(workout.fields.datum.split('T')[0]), 'EEE', { locale: de })}
                            </span>
                            <span className="font-medium text-sm">
                              {WORKOUT_TYPE_LABELS[workout.fields.typ || 'sonstiges']}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{workout.fields.dauer_minuten} min</span>
                            <span>{STIMMUNG_EMOJI[workout.fields.stimmung || 'okay']}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trend (7 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(16 65% 50%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(16 65% 50%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'hsl(25 10% 45%)' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(35 20% 88%)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => [`${value} min`, 'Dauer']}
                        />
                        <Area
                          type="monotone"
                          dataKey="duration"
                          stroke="hsl(16 65% 50%)"
                          strokeWidth={2}
                          fill="url(#colorDuration)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={() => setAddWorkoutOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Workout starten
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Workout Dialog */}
      <Dialog open={addWorkoutOpen} onOpenChange={setAddWorkoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Workout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum</Label>
              <Input
                id="datum"
                type="date"
                value={formData.datum}
                onChange={e => setFormData(prev => ({ ...prev, datum: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rest_day"
                checked={formData.rest_day}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, rest_day: checked === true }))}
              />
              <Label htmlFor="rest_day" className="cursor-pointer">Ruhetag</Label>
            </div>

            {!formData.rest_day && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="typ">Trainingstyp</Label>
                  <Select
                    value={formData.typ}
                    onValueChange={value => setFormData(prev => ({ ...prev, typ: value as Workouts['fields']['typ'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dauer">Dauer (Minuten)</Label>
                  <Input
                    id="dauer"
                    type="number"
                    min={1}
                    value={formData.dauer_minuten}
                    onChange={e => setFormData(prev => ({ ...prev, dauer_minuten: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stimmung">Stimmung</Label>
                  <Select
                    value={formData.stimmung}
                    onValueChange={value => setFormData(prev => ({ ...prev, stimmung: value as Workouts['fields']['stimmung'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schlecht">{STIMMUNG_EMOJI.schlecht} Schlecht</SelectItem>
                      <SelectItem value="okay">{STIMMUNG_EMOJI.okay} Okay</SelectItem>
                      <SelectItem value="gut">{STIMMUNG_EMOJI.gut} Gut</SelectItem>
                      <SelectItem value="brutal">{STIMMUNG_EMOJI.brutal} Brutal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Speichern...' : 'Workout speichern'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Weekly Workouts Dialog */}
      <Dialog open={weeklyWorkoutsOpen} onOpenChange={setWeeklyWorkoutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workouts diese Woche</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {weeklyWorkoutsData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Noch keine Workouts diese Woche
              </div>
            ) : (
              weeklyWorkoutsData.map(workout => (
                <div
                  key={workout.record_id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    setSelectedWorkout(workout);
                    setWeeklyWorkoutsOpen(false);
                    setWorkoutDetailOpen(true);
                  }}
                >
                  <div>
                    <div className="font-medium">
                      {WORKOUT_TYPE_LABELS[workout.fields.typ || 'sonstiges']}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {workout.fields.datum && format(parseISO(workout.fields.datum.split('T')[0]), 'EEEE, d. MMM', { locale: de })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{workout.fields.dauer_minuten} min</span>
                    <span className="text-lg">{STIMMUNG_EMOJI[workout.fields.stimmung || 'okay']}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout Detail Dialog */}
      <Dialog open={workoutDetailOpen} onOpenChange={setWorkoutDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkout && WORKOUT_TYPE_LABELS[selectedWorkout.fields.typ || 'sonstiges']} - Details
            </DialogTitle>
          </DialogHeader>
          {selectedWorkout && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Datum</div>
                  <div className="font-medium">
                    {selectedWorkout.fields.datum && format(parseISO(selectedWorkout.fields.datum.split('T')[0]), 'EEEE, d. MMMM yyyy', { locale: de })}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Dauer</div>
                  <div className="font-medium">{selectedWorkout.fields.dauer_minuten} Minuten</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Trainingstyp</div>
                  <div className="font-medium">{WORKOUT_TYPE_LABELS[selectedWorkout.fields.typ || 'sonstiges']}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Stimmung</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-xl">{STIMMUNG_EMOJI[selectedWorkout.fields.stimmung || 'okay']}</span>
                    <span className="capitalize">{selectedWorkout.fields.stimmung}</span>
                  </div>
                </div>
              </div>

              {selectedWorkoutLogs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Übungen</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedWorkoutLogs.map(log => {
                      const uebungId = extractRecordId(log.fields.uebung);
                      const uebung = uebungId ? uebungenMap.get(uebungId) : null;
                      return (
                        <div key={log.record_id} className="bg-muted/50 rounded-lg p-3">
                          <div className="font-medium">{uebung?.fields.name || 'Unbekannte Übung'}</div>
                          <div className="text-sm text-muted-foreground">
                            Satz {log.fields.satz_nummer}: {log.fields.gewicht}kg × {log.fields.wiederholungen} Wdh
                            {log.fields.rpe && ` @ RPE ${log.fields.rpe.replace('rpe_', '')}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nutrition Detail Dialog */}
      <Dialog open={nutritionDetailOpen} onOpenChange={setNutritionDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ernährung heute</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Macro Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Kalorien</div>
                <div className="text-lg font-bold text-primary">{todayNutrition.calories}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Protein</div>
                <div className="text-lg font-bold">{todayNutrition.protein}g</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Carbs</div>
                <div className="text-lg font-bold">{todayNutrition.carbs}g</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Fett</div>
                <div className="text-lg font-bold">{todayNutrition.fett}g</div>
              </div>
            </div>

            {/* Meals List */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Mahlzeiten</h3>
              {todayNutrition.meals.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Noch keine Mahlzeiten heute
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {todayNutrition.meals.map(meal => (
                    <div key={meal.record_id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium capitalize">
                            {meal.fields.mahlzeit_typ?.replace('_', '-') || 'Mahlzeit'}
                          </div>
                          {meal.fields.beschreibung && (
                            <div className="text-sm text-muted-foreground">{meal.fields.beschreibung}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{meal.fields.kalorien} kcal</div>
                          <div className="text-xs text-muted-foreground">
                            P: {meal.fields.protein}g | K: {meal.fields.carbs}g | F: {meal.fields.fett}g
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
