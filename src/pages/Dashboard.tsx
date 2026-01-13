import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, subWeeks, getISOWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Dumbbell, Check, X, Utensils } from 'lucide-react';
import type { Workouts, Ernaehrung, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Progress Ring Component
function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 12,
  current,
  goal
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  current: number;
  goal: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: 'drop-shadow(0 0 8px hsl(36 95% 52% / 0.4))'
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-foreground">{current}</span>
        <span className="text-base text-muted-foreground">/{goal} Workouts</span>
      </div>
    </div>
  );
}

// Mood emoji mapping
const moodEmoji: Record<string, string> = {
  schlecht: '😓',
  okay: '😐',
  gut: '😊',
  brutal: '💪'
};

// Workout type labels
const workoutTypeLabels: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges'
};

// Macro bar component
function MacroBar({
  protein,
  carbs,
  fat
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const total = protein + carbs + fat;
  if (total === 0) return null;

  const proteinPercent = (protein / total) * 100;
  const carbsPercent = (carbs / total) * 100;
  const fatPercent = (fat / total) * 100;

  return (
    <div className="w-full">
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${proteinPercent}%` }}
        />
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${carbsPercent}%` }}
        />
        <div
          className="h-full bg-muted-foreground/30 transition-all"
          style={{ width: `${fatPercent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
        <span>P: {protein}g</span>
        <span>K: {carbs}g</span>
        <span>F: {fat}g</span>
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[65%] space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:w-[35%] space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new workout
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
    rest_day: false
  });

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [workoutsData, ernaehrungData, zieleData] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getZiele()
        ]);
        setWorkouts(workoutsData);
        setErnaehrung(ernaehrungData);
        setZiele(zieleData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get active goals
  const activeGoals = useMemo(() => {
    return ziele.find(z => z.fields.status === 'aktiv')?.fields || {
      trainingstage_pro_woche: 5,
      taeglich_kalorien: 2200,
      taeglich_protein: 150
    };
  }, [ziele]);

  // Calculate current week's workouts
  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekWorkouts = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    return {
      count: thisWeekWorkouts.length,
      goal: activeGoals.trainingstage_pro_woche || 5,
      weekStart: format(weekStart, 'd. MMM', { locale: de }),
      weekEnd: format(weekEnd, 'd. MMM', { locale: de })
    };
  }, [workouts, activeGoals]);

  // Calculate today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter(e =>
      e.fields.datum?.startsWith(today)
    );

    return {
      meals: todayMeals,
      calories: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fat: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0)
    };
  }, [ernaehrung]);

  // Check if workout done today
  const workoutToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return workouts.some(w =>
      w.fields.datum?.startsWith(today) && !w.fields.rest_day
    );
  }, [workouts]);

  // Chart data - last 8 weeks
  const chartData = useMemo(() => {
    const weeks: { name: string; workouts: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const weekDate = subWeeks(new Date(), i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

      const weekWorkouts = workouts.filter(w => {
        if (!w.fields.datum || w.fields.rest_day) return false;
        const workoutDate = parseISO(w.fields.datum);
        return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
      });

      weeks.push({
        name: `KW ${getISOWeek(weekDate)}`,
        workouts: weekWorkouts.length
      });
    }

    return weeks;
  }, [workouts]);

  // Recent workouts (sorted by date desc)
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => {
        const dateA = a.fields.datum || '';
        const dateB = b.fields.datum || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [workouts]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.typ && !formData.rest_day) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.rest_day ? undefined : formData.typ as Workouts['fields']['typ'],
        dauer_minuten: formData.rest_day ? undefined : (formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined),
        stimmung: formData.rest_day ? undefined : formData.stimmung as Workouts['fields']['stimmung'],
        rest_day: formData.rest_day
      });

      // Refresh data
      const newWorkouts = await LivingAppsService.getWorkouts();
      setWorkouts(newWorkouts);

      // Reset form and close dialog
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: '',
        dauer_minuten: '',
        stimmung: '',
        rest_day: false
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Meal type labels
  const mealTypeLabels: Record<string, string> = {
    fruehstueck: 'Frühstück',
    snack: 'Snack',
    mittagessen: 'Mittagessen',
    abendessen: 'Abendessen',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
    sonstiges: 'Sonstiges'
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive text-4xl mb-4">!</div>
            <h2 className="text-xl font-semibold mb-2">Fehler beim Laden</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Fitness Tracker</h1>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'dd. MMM yyyy', { locale: de })}
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-8 flex flex-col items-center">
          <ProgressRing
            progress={weekData.count / weekData.goal}
            size={200}
            strokeWidth={12}
            current={weekData.count}
            goal={weekData.goal}
          />
          <p className="mt-4 text-muted-foreground">
            Diese Woche ({weekData.weekStart} - {weekData.weekEnd})
          </p>
        </section>

        {/* Quick Stats Row */}
        <section className="px-6 py-2">
          <div className="flex items-center justify-around gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              {workoutToday ? (
                <Check className="w-4 h-4 text-[hsl(var(--success))]" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={workoutToday ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}>
                Training
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {todayNutrition.calories}/{activeGoals.taeglich_kalorien || 2200}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                P: {todayNutrition.protein}/{activeGoals.taeglich_protein || 150}g
              </span>
            </div>
          </div>
        </section>

        {/* Macros Section */}
        <section className="px-6 py-4">
          <p className="text-sm font-medium mb-2">Makros heute</p>
          <MacroBar
            protein={todayNutrition.protein}
            carbs={todayNutrition.carbs}
            fat={todayNutrition.fat}
          />
        </section>

        {/* Recent Workouts */}
        <section className="px-6 py-4 pb-24">
          <p className="text-sm font-medium mb-3">Letzte Workouts</p>
          <div className="space-y-1">
            {recentWorkouts.slice(0, 3).length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Noch keine Workouts erfasst
              </p>
            ) : (
              recentWorkouts.slice(0, 3).map((workout) => (
                <div
                  key={workout.record_id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {workoutTypeLabels[workout.fields.typ || ''] || workout.fields.typ}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {workout.fields.datum ? format(parseISO(workout.fields.datum), 'EEE dd.MM', { locale: de }) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{workout.fields.dauer_minuten}min</span>
                    <span>{moodEmoji[workout.fields.stimmung || ''] || ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 text-base font-medium">
                <Plus className="w-5 h-5 mr-2" />
                Workout starten
              </Button>
            </DialogTrigger>
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
                    onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rest_day"
                    checked={formData.rest_day}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, rest_day: checked as boolean })
                    }
                  />
                  <Label htmlFor="rest_day" className="text-sm font-normal">
                    Ruhetag
                  </Label>
                </div>

                {!formData.rest_day && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="typ">Trainingstyp</Label>
                      <Select
                        value={formData.typ}
                        onValueChange={(value) => setFormData({ ...formData, typ: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Typ wählen..." />
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
                        value={formData.stimmung}
                        onValueChange={(value) => setFormData({ ...formData, stimmung: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wie war's?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schlecht">😓 Schlecht</SelectItem>
                          <SelectItem value="okay">😐 Okay</SelectItem>
                          <SelectItem value="gut">😊 Gut</SelectItem>
                          <SelectItem value="brutal">💪 Brutal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || (!formData.rest_day && !formData.typ)}
                >
                  {submitting ? 'Speichern...' : 'Speichern'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Header */}
        <header className="border-b border-border px-8 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">Fitness Tracker</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Workout starten
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Neues Workout</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="datum-desktop">Datum</Label>
                    <Input
                      id="datum-desktop"
                      type="date"
                      value={formData.datum}
                      onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rest_day-desktop"
                      checked={formData.rest_day}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, rest_day: checked as boolean })
                      }
                    />
                    <Label htmlFor="rest_day-desktop" className="text-sm font-normal">
                      Ruhetag
                    </Label>
                  </div>

                  {!formData.rest_day && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="typ-desktop">Trainingstyp</Label>
                        <Select
                          value={formData.typ}
                          onValueChange={(value) => setFormData({ ...formData, typ: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Typ wählen..." />
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
                        <Label htmlFor="dauer-desktop">Dauer (Minuten)</Label>
                        <Input
                          id="dauer-desktop"
                          type="number"
                          placeholder="z.B. 60"
                          value={formData.dauer_minuten}
                          onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stimmung-desktop">Stimmung</Label>
                        <Select
                          value={formData.stimmung}
                          onValueChange={(value) => setFormData({ ...formData, stimmung: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Wie war's?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="schlecht">😓 Schlecht</SelectItem>
                            <SelectItem value="okay">😐 Okay</SelectItem>
                            <SelectItem value="gut">😊 Gut</SelectItem>
                            <SelectItem value="brutal">💪 Brutal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || (!formData.rest_day && !formData.typ)}
                  >
                    {submitting ? 'Speichern...' : 'Speichern'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content - 65/35 split */}
        <main className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex gap-6">
            {/* Left Column - 65% */}
            <div className="w-[65%] space-y-6">
              {/* Hero Section */}
              <Card className="shadow-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground mb-4">Wochenfortschritt</p>
                    <ProgressRing
                      progress={weekData.count / weekData.goal}
                      size={240}
                      strokeWidth={12}
                      current={weekData.count}
                      goal={weekData.goal}
                    />
                    <p className="mt-4 text-muted-foreground">
                      Diese Woche ({weekData.weekStart} - {weekData.weekEnd})
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Workout-Frequenz</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(222 47% 31%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(222 47% 31%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
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
                          domain={[0, 7]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="workouts"
                          stroke="hsl(222 47% 31%)"
                          strokeWidth={2}
                          fill="url(#colorWorkouts)"
                          name="Workouts"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 35% */}
            <div className="w-[35%] space-y-6">
              {/* Today's Nutrition */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Heute</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Calorie Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Kalorien</span>
                      <span className="font-medium">{todayNutrition.calories}/{activeGoals.taeglich_kalorien || 2200}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((todayNutrition.calories / (activeGoals.taeglich_kalorien || 2200)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Protein Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Protein</span>
                      <span className="font-medium">{todayNutrition.protein}/{activeGoals.taeglich_protein || 150}g</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.min((todayNutrition.protein / (activeGoals.taeglich_protein || 150)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Meal List */}
                  <div className="border-t border-border pt-4 mt-4">
                    {todayNutrition.meals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Noch keine Mahlzeiten heute
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {todayNutrition.meals.map((meal) => (
                          <div key={meal.record_id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {mealTypeLabels[meal.fields.mahlzeit_typ || ''] || meal.fields.mahlzeit_typ}
                            </span>
                            <span>{meal.fields.kalorien} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Workouts */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Letzte Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentWorkouts.length === 0 ? (
                    <div className="text-center py-6">
                      <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Noch keine Workouts erfasst
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentWorkouts.map((workout) => (
                        <div
                          key={workout.record_id}
                          className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {workoutTypeLabels[workout.fields.typ || ''] || workout.fields.typ}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {workout.fields.datum ? format(parseISO(workout.fields.datum), 'EEE dd.MM', { locale: de }) : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{workout.fields.dauer_minuten}m</span>
                            <span>{moodEmoji[workout.fields.stimmung || ''] || ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
