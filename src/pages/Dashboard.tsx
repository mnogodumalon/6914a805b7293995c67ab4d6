import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertCircle, Plus, Dumbbell } from 'lucide-react';

function Dashboard() {
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
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get active goal
  const activeGoal = useMemo(() => {
    return ziele.find((z) => z.fields.status === 'aktiv') || null;
  }, [ziele]);

  // Calculate weekly training streak
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1, locale: de });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1, locale: de });

    const thisWeekWorkouts = workouts.filter((w) => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    const goal = activeGoal?.fields.trainingstage_pro_woche || 5;
    const completed = thisWeekWorkouts.length;
    const percentage = (completed / goal) * 100;

    return { completed, goal, percentage };
  }, [workouts, activeGoal]);

  // Calculate today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter((e) => e.fields.datum === today);

    const kalorien = todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);
    const protein = todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0);

    const kalorienGoal = activeGoal?.fields.taeglich_kalorien || 2000;
    const proteinGoal = activeGoal?.fields.taeglich_protein || 150;

    return { kalorien, protein, kalorienGoal, proteinGoal };
  }, [ernaehrung, activeGoal]);

  // Get latest body weight
  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten].sort((a, b) => {
      const dateA = a.fields.datum || '';
      const dateB = b.fields.datum || '';
      return dateB.localeCompare(dateA);
    });
    return sorted[0]?.fields.gewicht_kg || null;
  }, [koerperdaten]);

  // Chart data: Training minutes this week
  const chartData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1, locale: de });
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayWorkouts = workouts.filter(
        (w) => w.fields.datum === dateStr && !w.fields.rest_day
      );
      const minutes = dayWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

      return { day, minutes };
    });
  }, [workouts]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 7);
  }, [workouts]);

  // Mood emoji mapping
  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'schlecht':
        return '😞';
      case 'okay':
        return '😐';
      case 'gut':
        return '😊';
      case 'brutal':
        return '🔥';
      default:
        return '';
    }
  };

  // Workout type labels
  const getWorkoutTypeLabel = (typ?: string) => {
    const labels: Record<string, string> = {
      push: 'Push',
      pull: 'Pull',
      beine: 'Beine',
      ganzkoerper: 'Ganzkörper',
      oberkoerper: 'Oberkörper',
      unterkoerper: 'Unterkörper',
      cardio: 'Cardio',
      sonstiges: 'Sonstiges',
    };
    return labels[typ || ''] || typ || '-';
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 mb-8">
        <h1 className="text-xl font-semibold">Fitness Tracker</h1>
        <AddWorkoutDialog onSuccess={() => window.location.reload()} />
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop: Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[65%_35%] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Hero: Weekly Training Streak */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-10 md:p-12 relative overflow-hidden">
                {/* Radial gradient backdrop */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, hsl(14 65% 85%), transparent 70%)',
                  }}
                />

                <div className="relative z-10 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Diese Woche</p>
                  <div
                    className="text-[56px] md:text-[72px] font-extrabold leading-none mb-2"
                    style={{ letterSpacing: '-0.02em', fontWeight: 800 }}
                  >
                    {weeklyStats.completed}
                  </div>
                  <p className="text-base md:text-lg font-medium text-muted-foreground mb-6">
                    von {weeklyStats.goal} Trainings
                  </p>

                  {/* Progress bar */}
                  <div className="w-full max-w-md mx-auto h-2 md:h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(weeklyStats.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart: Training Minutes This Week */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-semibold">
                  Trainingsminuten diese Woche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: 'hsl(25 15% 50%)' }}
                        stroke="hsl(30 20% 88%)"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(25 15% 50%)' }}
                        stroke="hsl(30 20% 88%)"
                        label={{ value: 'Minuten', angle: -90, position: 'insideLeft', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(30 20% 88%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="minutes" fill="hsl(14 65% 55%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <Card className="shadow-sm hidden md:block">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-semibold">
                  Letzte Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentWorkouts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Noch keine Workouts vorhanden</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Datum</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Typ</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Dauer</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Stimmung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentWorkouts.map((workout) => (
                          <tr
                            key={workout.record_id}
                            className="border-b border-border hover:bg-muted transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-3 text-sm">
                              {workout.fields.datum
                                ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy')
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-sm">{getWorkoutTypeLabel(workout.fields.typ)}</td>
                            <td className="py-3 px-3 text-sm">
                              {workout.fields.dauer_minuten ? `${workout.fields.dauer_minuten} min` : '-'}
                            </td>
                            <td className="py-3 px-3 text-2xl">{getMoodEmoji(workout.fields.stimmung)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Desktop) / Below (Mobile) */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Heute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Kalorien</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Math.round(todayNutrition.kalorien)} <span className="text-sm font-normal text-muted-foreground">/ {todayNutrition.kalorienGoal} kcal</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Math.round(todayNutrition.protein)} <span className="text-sm font-normal text-muted-foreground">/ {todayNutrition.proteinGoal} g</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aktuelles Gewicht</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {latestWeight ? `${latestWeight.toFixed(1)} kg` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Goal */}
            {activeGoal && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Aktives Ziel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trainingstage/Woche</span>
                    <span className="font-semibold">{activeGoal.fields.trainingstage_pro_woche || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kalorien/Tag</span>
                    <span className="font-semibold">{activeGoal.fields.taeglich_kalorien || '-'} kcal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protein/Tag</span>
                    <span className="font-semibold">{activeGoal.fields.taeglich_protein || '-'} g</span>
                  </div>
                  {activeGoal.fields.notizen && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      {activeGoal.fields.notizen}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Workouts (Mobile Cards) */}
            <div className="md:hidden space-y-3">
              <h2 className="text-base font-semibold px-1">Letzte Workouts</h2>
              {recentWorkouts.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Noch keine Workouts vorhanden
                  </CardContent>
                </Card>
              ) : (
                recentWorkouts.slice(0, 3).map((workout) => (
                  <Card key={workout.record_id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {workout.fields.datum
                              ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy')
                              : '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getWorkoutTypeLabel(workout.fields.typ)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {workout.fields.dauer_minuten ? `${workout.fields.dauer_minuten} min` : '-'}
                          </p>
                          <p className="text-2xl">{getMoodEmoji(workout.fields.stimmung)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <AddWorkoutDialog onSuccess={() => window.location.reload()} trigger={
          <Button className="w-full h-14 text-base shadow-lg" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Workout starten
          </Button>
        } />
      </div>
    </div>
  );
}

function AddWorkoutDialog({ onSuccess, trigger }: { onSuccess: () => void; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'ganzkoerper',
    dauer_minuten: '',
    stimmung: 'gut',
    rest_day: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ as any,
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung as any,
        rest_day: formData.rest_day,
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-md hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Workout starten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Neues Workout
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="typ">Trainingstyp</Label>
            <Select value={formData.typ} onValueChange={(v) => setFormData({ ...formData, typ: v })}>
              <SelectTrigger id="typ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="beine">Beine</SelectItem>
                <SelectItem value="ganzkoerper">Ganzkörper</SelectItem>
                <SelectItem value="oberkoerper">Oberkörper</SelectItem>
                <SelectItem value="unterkoerper">Unterkörper</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dauer">Dauer (Minuten)</Label>
            <Input
              id="dauer"
              type="number"
              placeholder="z.B. 60"
              value={formData.dauer_minuten}
              onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="stimmung">Stimmung</Label>
            <Select value={formData.stimmung} onValueChange={(v) => setFormData({ ...formData, stimmung: v })}>
              <SelectTrigger id="stimmung">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schlecht">😞 Schlecht</SelectItem>
                <SelectItem value="okay">😐 Okay</SelectItem>
                <SelectItem value="gut">😊 Gut</SelectItem>
                <SelectItem value="brutal">🔥 Brutal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rest_day"
              checked={formData.rest_day}
              onChange={(e) => setFormData({ ...formData, rest_day: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="rest_day" className="cursor-pointer">Ruhetag</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message}
          <Button variant="outline" onClick={onRetry} className="mt-4 w-full">
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default Dashboard;
