import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfWeek, isAfter, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Dumbbell,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Helper: Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Helper: Get Monday of current week
function getWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

// Helper: Mood emoji mapping
function getMoodEmoji(mood?: string): string {
  switch (mood) {
    case 'schlecht': return '😫';
    case 'okay': return '😐';
    case 'gut': return '😊';
    case 'brutal': return '💪';
    default: return '';
  }
}

// Helper: Workout type display
function getWorkoutTypeDisplay(typ?: string): string {
  const types: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    beine: 'Beine',
    ganzkoerper: 'Ganzkörper',
    oberkoerper: 'Oberkörper',
    unterkoerper: 'Unterkörper',
    cardio: 'Cardio',
    sonstiges: 'Sonstiges',
  };
  return typ ? types[typ] || typ : '';
}

// Circular Progress Ring Component
function CircularProgress({
  value,
  max,
  size = 80,
  strokeWidth = 8,
  color = 'hsl(15 70% 50%)'
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(35 20% 93%)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-600 ease-out"
      />
    </svg>
  );
}

// Nutrition Card with Progress Ring
function NutritionCard({
  label,
  value,
  goal,
  unit,
  showRing = false
}: {
  label: string;
  value: number;
  goal?: number;
  unit: string;
  showRing?: boolean;
}) {
  const hasGoal = goal !== undefined && goal > 0;

  return (
    <div className="flex-shrink-0 w-[100px] md:w-auto">
      <Card className="h-full shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          {showRing && hasGoal ? (
            <div className="relative mb-2">
              <CircularProgress value={value} max={goal} size={64} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{Math.round((value / goal) * 100)}%</span>
              </div>
            </div>
          ) : null}
          <div className="text-center">
            <p className="text-lg font-bold">{value.toLocaleString('de-DE')}</p>
            {hasGoal && (
              <p className="text-xs text-muted-foreground">/ {goal.toLocaleString('de-DE')} {unit}</p>
            )}
            {!hasGoal && (
              <p className="text-xs text-muted-foreground">{unit}</p>
            )}
            <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-200">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-[100px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}

// Add Workout Form
function AddWorkoutForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    datum: getTodayString(),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.typ) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ as Workouts['fields']['typ'],
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung ? formData.stimmung as Workouts['fields']['stimmung'] : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="datum">Datum</Label>
        <Input
          id="datum"
          type="date"
          value={formData.datum}
          onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="typ">Trainingstyp *</Label>
        <Select
          value={formData.typ}
          onValueChange={(value) => setFormData({ ...formData, typ: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wähle einen Typ..." />
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

      <div className="space-y-2">
        <Label htmlFor="dauer">Dauer (Minuten)</Label>
        <Input
          id="dauer"
          type="number"
          placeholder="z.B. 60"
          value={formData.dauer_minuten}
          onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stimmung">Stimmung</Label>
        <Select
          value={formData.stimmung || 'none'}
          onValueChange={(value) => setFormData({ ...formData, stimmung: value === 'none' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wie fühlst du dich?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine Angabe</SelectItem>
            <SelectItem value="schlecht">😫 Schlecht</SelectItem>
            <SelectItem value="okay">😐 Okay</SelectItem>
            <SelectItem value="gut">😊 Gut</SelectItem>
            <SelectItem value="brutal">💪 Brutal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onClose}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!formData.typ || submitting}
        >
          {submitting ? 'Speichern...' : 'Workout speichern'}
        </Button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Computed values
  const todayString = getTodayString();
  const weekStart = getWeekStart();

  // Today's workout status
  const todayWorkout = useMemo(() => {
    return workouts.find(w => w.fields.datum === todayString && !w.fields.rest_day);
  }, [workouts, todayString]);

  // Weekly workout count
  const weeklyWorkoutCount = useMemo(() => {
    return workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum);
      return isAfter(workoutDate, weekStart) || isSameDay(workoutDate, weekStart);
    }).length;
  }, [workouts, weekStart]);

  // Active goals
  const activeGoals = useMemo(() => {
    return ziele.find(z => z.fields.status === 'aktiv');
  }, [ziele]);

  const weeklyGoal = activeGoals?.fields.trainingstage_pro_woche || 5;
  const calorieGoal = activeGoals?.fields.taeglich_kalorien || 2200;
  const proteinGoal = activeGoals?.fields.taeglich_protein || 150;

  // Today's nutrition
  const todayNutrition = useMemo(() => {
    const todayMeals = ernaehrung.filter(e => e.fields.datum === todayString);
    return {
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fett: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0),
    };
  }, [ernaehrung, todayString]);

  // Body data sorted by date
  const sortedKoerperdaten = useMemo(() => {
    return [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''));
  }, [koerperdaten]);

  // Latest weight and trend
  const latestWeight = sortedKoerperdaten[sortedKoerperdaten.length - 1];
  const previousWeight = sortedKoerperdaten[sortedKoerperdaten.length - 2];
  const weightChange = latestWeight && previousWeight
    ? (latestWeight.fields.gewicht_kg || 0) - (previousWeight.fields.gewicht_kg || 0)
    : null;

  // Chart data (last 14 for mobile, 30 for desktop)
  const chartData = useMemo(() => {
    return sortedKoerperdaten.slice(-30).map(k => ({
      date: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
      gewicht: k.fields.gewicht_kg,
    }));
  }, [sortedKoerperdaten]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5);
  }, [workouts]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-200">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Fitness Tracker</h1>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'dd. MMM yyyy', { locale: de })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 pb-24 space-y-6">
          {/* Hero: Today's Status */}
          <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${todayWorkout ? 'bg-[hsl(145_60%_90%)]' : 'bg-muted'}`}>
                  {todayWorkout ? (
                    <CheckCircle2 className="w-12 h-12 text-[hsl(145_60%_40%)]" />
                  ) : (
                    <Circle className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {todayWorkout ? 'Heute trainiert!' : 'Noch kein Training'}
                  </h2>
                  {todayWorkout && (
                    <p className="text-muted-foreground">
                      {getWorkoutTypeDisplay(todayWorkout.fields.typ)}
                      {todayWorkout.fields.dauer_minuten && ` • ${todayWorkout.fields.dauer_minuten} Min`}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diese Woche</span>
                  <span className="font-medium">{weeklyWorkoutCount}/{weeklyGoal} Trainings</span>
                </div>
                <Progress value={(weeklyWorkoutCount / weeklyGoal) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Today - Horizontal Scroll */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Ernährung heute</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <NutritionCard
                label="Kalorien"
                value={todayNutrition.kalorien}
                goal={calorieGoal}
                unit="kcal"
                showRing
              />
              <NutritionCard
                label="Protein"
                value={todayNutrition.protein}
                goal={proteinGoal}
                unit="g"
                showRing
              />
              <NutritionCard
                label="Carbs"
                value={todayNutrition.carbs}
                unit="g"
              />
              <NutritionCard
                label="Fett"
                value={todayNutrition.fett}
                unit="g"
              />
            </div>
          </section>

          {/* Recent Workouts */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Letzte Workouts</h3>
            <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
              <CardContent className="p-0">
                {recentWorkouts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Workouts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentWorkouts.slice(0, 3).map((workout) => (
                      <div
                        key={workout.record_id}
                        className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {workout.fields.datum
                              ? format(parseISO(workout.fields.datum), 'EEEE, dd.MM', { locale: de })
                              : 'Unbekannt'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getWorkoutTypeDisplay(workout.fields.typ)}
                            {workout.fields.dauer_minuten && ` • ${workout.fields.dauer_minuten} Min`}
                          </p>
                        </div>
                        <span className="text-2xl">{getMoodEmoji(workout.fields.stimmung)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Body Progress */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Körpergewicht</h3>
            <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
              <CardContent className="p-4">
                {latestWeight ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold">
                        {latestWeight.fields.gewicht_kg?.toFixed(1)} kg
                      </span>
                      {weightChange !== null && (
                        <span className={`flex items-center text-sm font-medium ${
                          weightChange > 0 ? 'text-destructive' : weightChange < 0 ? 'text-[hsl(145_60%_40%)]' : 'text-muted-foreground'
                        }`}>
                          {weightChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> :
                           weightChange < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> :
                           <Minus className="w-4 h-4 mr-1" />}
                          {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    {chartData.length > 1 && (
                      <div className="h-[180px] -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData.slice(-14)}>
                            <defs>
                              <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(15 70% 50%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(15 70% 50%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10 }}
                              stroke="hsl(20 10% 45%)"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tick={{ fontSize: 10 }}
                              stroke="hsl(20 10% 45%)"
                              tickLine={false}
                              axisLine={false}
                              width={35}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(0 0% 100%)',
                                border: '1px solid hsl(30 15% 88%)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
                            />
                            <Area
                              type="monotone"
                              dataKey="gewicht"
                              stroke="hsl(15 70% 50%)"
                              strokeWidth={2}
                              fill="url(#colorGewicht)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <p>Noch keine Körperdaten</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-[52px] text-base font-semibold shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Workout starten
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neues Workout</DialogTitle>
              </DialogHeader>
              <AddWorkoutForm onSuccess={fetchData} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-[1200px] mx-auto p-8">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Fitness Tracker</h1>
              <p className="text-muted-foreground">
                {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 font-semibold">
                  <Plus className="w-5 h-5 mr-2" />
                  Workout starten
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Neues Workout</DialogTitle>
                </DialogHeader>
                <AddWorkoutForm onSuccess={fetchData} onClose={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </header>

          {/* Main Content */}
          <div className="grid grid-cols-5 gap-8">
            {/* Left Column (60%) */}
            <div className="col-span-3 space-y-8">
              {/* Hero Row: Today Status + Weekly Progress */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${todayWorkout ? 'bg-[hsl(145_60%_90%)]' : 'bg-muted'}`}>
                        {todayWorkout ? (
                          <CheckCircle2 className="w-10 h-10 text-[hsl(145_60%_40%)]" />
                        ) : (
                          <Circle className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {todayWorkout ? 'Heute trainiert!' : 'Noch kein Training'}
                        </h2>
                        {todayWorkout && (
                          <p className="text-muted-foreground text-sm">
                            {getWorkoutTypeDisplay(todayWorkout.fields.typ)}
                            {todayWorkout.fields.dauer_minuten && ` • ${todayWorkout.fields.dauer_minuten} Min`}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Wochenfortschritt</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-bold">{weeklyWorkoutCount}</span>
                      <span className="text-muted-foreground">/ {weeklyGoal} Trainings</span>
                    </div>
                    <Progress value={(weeklyWorkoutCount / weeklyGoal) * 100} className="h-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Ernährung heute</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="relative mb-2">
                        <CircularProgress value={todayNutrition.kalorien} max={calorieGoal} size={72} strokeWidth={6} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold">
                            {Math.round((todayNutrition.kalorien / calorieGoal) * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-bold">{todayNutrition.kalorien.toLocaleString('de-DE')}</p>
                      <p className="text-xs text-muted-foreground">/ {calorieGoal.toLocaleString('de-DE')} kcal</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Kalorien</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="relative mb-2">
                        <CircularProgress value={todayNutrition.protein} max={proteinGoal} size={72} strokeWidth={6} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold">
                            {Math.round((todayNutrition.protein / proteinGoal) * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-bold">{todayNutrition.protein}</p>
                      <p className="text-xs text-muted-foreground">/ {proteinGoal}g</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Protein</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <p className="text-2xl font-bold">{todayNutrition.carbs}</p>
                      <p className="text-xs text-muted-foreground">g</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Kohlenhydrate</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <p className="text-2xl font-bold">{todayNutrition.fett}</p>
                      <p className="text-xs text-muted-foreground">g</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Fett</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Recent Workouts Table */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Letzte Workouts</h3>
                <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                  <CardContent className="p-0">
                    {recentWorkouts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Noch keine Workouts</p>
                        <p className="text-sm">Starte dein erstes Training!</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Datum</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Typ</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dauer</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stimmung</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentWorkouts.map((workout) => (
                            <tr
                              key={workout.record_id}
                              className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                            >
                              <td className="p-4 font-medium">
                                {workout.fields.datum
                                  ? format(parseISO(workout.fields.datum), 'EEEE, dd.MM', { locale: de })
                                  : '-'}
                              </td>
                              <td className="p-4">{getWorkoutTypeDisplay(workout.fields.typ)}</td>
                              <td className="p-4">{workout.fields.dauer_minuten ? `${workout.fields.dauer_minuten} Min` : '-'}</td>
                              <td className="p-4 text-xl">{getMoodEmoji(workout.fields.stimmung) || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column (40%) */}
            <div className="col-span-2 space-y-8">
              {/* Weight Chart */}
              <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Gewichtsverlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestWeight ? (
                    <>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl font-bold">
                          {latestWeight.fields.gewicht_kg?.toFixed(1)} kg
                        </span>
                        {weightChange !== null && (
                          <span className={`flex items-center text-sm font-medium ${
                            weightChange > 0 ? 'text-destructive' : weightChange < 0 ? 'text-[hsl(145_60%_40%)]' : 'text-muted-foreground'
                          }`}>
                            {weightChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> :
                             weightChange < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> :
                             <Minus className="w-4 h-4 mr-1" />}
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                      {chartData.length > 1 && (
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorGewichtDesktop" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(15 70% 50%)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(15 70% 50%)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                stroke="hsl(20 10% 45%)"
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                domain={['dataMin - 1', 'dataMax + 1']}
                                tick={{ fontSize: 11 }}
                                stroke="hsl(20 10% 45%)"
                                tickLine={false}
                                axisLine={false}
                                width={40}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(0 0% 100%)',
                                  border: '1px solid hsl(30 15% 88%)',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                }}
                                formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
                              />
                              <Area
                                type="monotone"
                                dataKey="gewicht"
                                stroke="hsl(15 70% 50%)"
                                strokeWidth={2}
                                fill="url(#colorGewichtDesktop)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <p>Noch keine Körperdaten erfasst</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Goals Overview */}
              {activeGoals && (
                <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Aktive Ziele</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeGoals.fields.taeglich_kalorien && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tägliche Kalorien</span>
                        <span className="font-medium">{activeGoals.fields.taeglich_kalorien.toLocaleString('de-DE')} kcal</span>
                      </div>
                    )}
                    {activeGoals.fields.taeglich_protein && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tägliches Protein</span>
                        <span className="font-medium">{activeGoals.fields.taeglich_protein}g</span>
                      </div>
                    )}
                    {activeGoals.fields.trainingstage_pro_woche && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Trainingstage/Woche</span>
                        <span className="font-medium">{activeGoals.fields.trainingstage_pro_woche}x</span>
                      </div>
                    )}
                    {activeGoals.fields.schlaf_ziel_stunden && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Schlafziel</span>
                        <span className="font-medium">{activeGoals.fields.schlaf_ziel_stunden}h</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="shadow-[0_1px_3px_hsl(20_20%_10%/0.04),0_4px_12px_hsl(20_20%_10%/0.06)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Statistiken</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Workouts insgesamt</span>
                    <span className="font-medium">{workouts.filter(w => !w.fields.rest_day).length}</span>
                  </div>
                  {workouts.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Durchschn. Dauer</span>
                      <span className="font-medium">
                        {Math.round(
                          workouts
                            .filter(w => w.fields.dauer_minuten)
                            .reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) /
                          workouts.filter(w => w.fields.dauer_minuten).length || 1
                        )} Min
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Körperdaten-Einträge</span>
                    <span className="font-medium">{koerperdaten.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
