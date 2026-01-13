import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus,
  Flame,
  Dumbbell,
  Scale,
  AlertCircle,
  Utensils,
  Activity,
  TrendingUp,
} from 'lucide-react';

// Types for combined activities
interface CombinedActivity {
  id: string;
  type: 'workout' | 'meal';
  date: string;
  title: string;
  subtitle: string;
}

// Progress ring component
function ProgressRing({
  progress,
  current,
  goal,
  size = 180,
  strokeWidth = 12,
}: {
  progress: number;
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
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
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-800 ease-out"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(16 70% 50%)" />
            <stop offset="100%" stopColor="hsl(12 80% 62%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-foreground">{current}/{goal}</span>
        <span className="text-sm text-muted-foreground mt-1">Trainings diese Woche</span>
      </div>
    </div>
  );
}

// Stat pill component for compact display
function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 min-w-[120px]">
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold leading-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </div>
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Skeleton className="h-14 w-32 rounded-full flex-shrink-0" />
          <Skeleton className="h-14 w-32 rounded-full flex-shrink-0" />
          <Skeleton className="h-14 w-32 rounded-full flex-shrink-0" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl mb-6" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// Add Workout Dialog
function AddWorkoutDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
    rest_day: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workoutTypes = [
    { key: 'push', label: 'Push' },
    { key: 'pull', label: 'Pull' },
    { key: 'beine', label: 'Beine' },
    { key: 'ganzkoerper', label: 'Ganzkörper' },
    { key: 'oberkoerper', label: 'Oberkörper' },
    { key: 'unterkoerper', label: 'Unterkörper' },
    { key: 'cardio', label: 'Cardio' },
    { key: 'sonstiges', label: 'Sonstiges' },
  ];

  const stimmungen = [
    { key: 'schlecht', label: 'Schlecht' },
    { key: 'okay', label: 'Okay' },
    { key: 'gut', label: 'Gut' },
    { key: 'brutal', label: 'Brutal' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ as Workouts['fields']['typ'],
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung as Workouts['fields']['stimmung'],
        rest_day: formData.rest_day,
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: '',
        dauer_minuten: '',
        stimmung: '',
        rest_day: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Workout starten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typ">Trainingstyp</Label>
            <Select
              value={formData.typ}
              onValueChange={(value) => setFormData({ ...formData, typ: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Typ auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {workoutTypes.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
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
                <SelectValue placeholder="Wie fühlst du dich?" />
              </SelectTrigger>
              <SelectContent>
                {stimmungen.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="rest_day"
              checked={formData.rest_day}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rest_day: checked === true })
              }
            />
            <Label htmlFor="rest_day" className="text-sm font-normal">
              Ruhetag
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
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
  );
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate weekly workout stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const workoutsThisWeek = workouts.filter((w) => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });

    const activeGoal = ziele.find((z) => z.fields.status === 'aktiv');
    const trainingGoal = activeGoal?.fields.trainingstage_pro_woche || 5;

    const totalDuration = workoutsThisWeek.reduce(
      (sum, w) => sum + (w.fields.dauer_minuten || 0),
      0
    );
    const avgDuration =
      workoutsThisWeek.length > 0 ? Math.round(totalDuration / workoutsThisWeek.length) : 0;

    // Count stimmung
    const stimmungCounts = workoutsThisWeek.reduce(
      (acc, w) => {
        if (w.fields.stimmung) {
          acc[w.fields.stimmung] = (acc[w.fields.stimmung] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const mostCommonStimmung =
      Object.entries(stimmungCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const stimmungLabels: Record<string, string> = {
      schlecht: 'Schlecht',
      okay: 'Okay',
      gut: 'Gut',
      brutal: 'Brutal',
    };

    return {
      count: workoutsThisWeek.length,
      goal: trainingGoal,
      progress: workoutsThisWeek.length / trainingGoal,
      avgDuration,
      stimmung: mostCommonStimmung ? stimmungLabels[mostCommonStimmung] : '-',
    };
  }, [workouts, ziele]);

  // Calculate today's nutrition
  const todayNutrition = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = ernaehrung.filter((e) => e.fields.datum?.startsWith(today));

    return {
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fett: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0),
    };
  }, [ernaehrung]);

  // Get latest weight
  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter((k) => k.fields.gewicht_kg != null)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''));
    return sorted[0]?.fields.gewicht_kg;
  }, [koerperdaten]);

  // Weight chart data (last 14 days for mobile, 30 for desktop)
  const weightChartData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''));

    return sorted.slice(-30).map((k) => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM'),
      weight: k.fields.gewicht_kg,
    }));
  }, [koerperdaten]);

  // Calories chart data (last 7 days)
  const caloriesChartData = useMemo(() => {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayMeals = ernaehrung.filter((e) => e.fields.datum?.startsWith(dateStr));
      const totalCalories = dayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);

      return {
        day,
        kalorien: totalCalories,
      };
    });
  }, [ernaehrung]);

  // Combined activities for activity feed
  const recentActivities = useMemo((): CombinedActivity[] => {
    const workoutActivities: CombinedActivity[] = workouts
      .filter((w) => w.fields.datum && !w.fields.rest_day)
      .map((w) => ({
        id: `workout-${w.record_id}`,
        type: 'workout' as const,
        date: w.fields.datum!,
        title: w.fields.typ
          ? {
              push: 'Push',
              pull: 'Pull',
              beine: 'Beine',
              ganzkoerper: 'Ganzkörper',
              oberkoerper: 'Oberkörper',
              unterkoerper: 'Unterkörper',
              cardio: 'Cardio',
              sonstiges: 'Sonstiges',
            }[w.fields.typ] || 'Training'
          : 'Training',
        subtitle: w.fields.dauer_minuten ? `${w.fields.dauer_minuten} min` : '',
      }));

    const mealActivities: CombinedActivity[] = ernaehrung
      .filter((e) => e.fields.datum)
      .map((e) => ({
        id: `meal-${e.record_id}`,
        type: 'meal' as const,
        date: e.fields.datum!,
        title: e.fields.mahlzeit_typ
          ? {
              fruehstueck: 'Frühstück',
              snack: 'Snack',
              mittagessen: 'Mittagessen',
              abendessen: 'Abendessen',
              pre_workout: 'Pre-Workout',
              post_workout: 'Post-Workout',
              sonstiges: 'Sonstiges',
            }[e.fields.mahlzeit_typ] || 'Mahlzeit'
          : 'Mahlzeit',
        subtitle: e.fields.kalorien ? `${e.fields.kalorien} kcal` : '',
      }));

    return [...workoutActivities, ...mealActivities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [workouts, ernaehrung]);

  // Get goals for nutrition progress
  const nutritionGoals = useMemo(() => {
    const activeGoal = ziele.find((z) => z.fields.status === 'aktiv');
    return {
      kalorien: activeGoal?.fields.taeglich_kalorien || 2000,
      protein: activeGoal?.fields.taeglich_protein || 150,
    };
  }, [ziele]);

  // Format relative date
  function formatRelativeDate(dateStr: string): string {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const dateOnly = dateStr.split('T')[0];

    if (dateOnly === today) return 'Heute';
    if (dateOnly === yesterday) return 'Gestern';
    return format(parseISO(dateOnly), 'dd.MM.', { locale: de });
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => fetchData()}
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">Fitness Tracker</h1>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Workout starten</span>
            <span className="sm:hidden">Workout</span>
          </Button>
        </div>
      </header>

      {/* Add Workout Dialog */}
      <AddWorkoutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Desktop layout: 2 columns */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left column (main content) */}
          <div>
            {/* Hero Section - Progress Ring */}
            <div className="flex flex-col items-center mb-8 md:mb-10">
              <div className="mb-3">
                <ProgressRing
                  progress={weeklyStats.progress}
                  current={weeklyStats.count}
                  goal={weeklyStats.goal}
                  size={180}
                  strokeWidth={12}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Ziel: {weeklyStats.goal}x pro Woche
              </p>

              {/* Desktop: Secondary stats next to hero */}
              <div className="hidden lg:flex gap-6 mt-6 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">Ø Dauer:</strong> {weeklyStats.avgDuration}{' '}
                  min
                </span>
                <span>
                  <strong className="text-foreground">Stimmung:</strong> Meist {weeklyStats.stimmung}
                </span>
              </div>
            </div>

            {/* Mobile: Today's Snapshot - Horizontal scroll stats */}
            <div className="lg:hidden mb-8">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <StatPill
                  icon={Flame}
                  value={`${todayNutrition.kalorien}`}
                  label="kcal heute"
                />
                <StatPill
                  icon={Dumbbell}
                  value={`${todayNutrition.protein}g`}
                  label="Protein"
                />
                <StatPill
                  icon={Scale}
                  value={latestWeight ? `${latestWeight.toFixed(1)}` : '-'}
                  label="kg"
                />
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
              {/* Weight Chart */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Gewichtsverlauf
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weightChartData.length > 0 ? (
                    <div className="h-[150px] md:h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightChartData}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="hsl(16 70% 50%)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(16 70% 50%)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            stroke="hsl(var(--muted-foreground))"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="hsl(var(--muted-foreground))"
                            tickLine={false}
                            axisLine={false}
                            domain={['dataMin - 2', 'dataMax + 2']}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                            formatter={(value: number) => [`${value} kg`, 'Gewicht']}
                          />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="hsl(16 70% 50%)"
                            strokeWidth={2}
                            fill="url(#weightGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Daten"
                      description="Trage dein erstes Gewicht ein"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Calories Chart - Desktop only full, Mobile compact */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Kalorien diese Woche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px] md:h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caloriesChartData}>
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value} kcal`, 'Kalorien']}
                        />
                        <Bar
                          dataKey="kalorien"
                          fill="hsl(16 70% 50%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nutrition Progress - Desktop */}
            <Card className="shadow-sm hover:shadow-md transition-shadow mb-6 hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ernährung heute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Kalorien</span>
                      <span className="font-medium">
                        {todayNutrition.kalorien} / {nutritionGoals.kalorien}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min((todayNutrition.kalorien / nutritionGoals.kalorien) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Protein</span>
                      <span className="font-medium">
                        {todayNutrition.protein}g / {nutritionGoals.protein}g
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((todayNutrition.protein / nutritionGoals.protein) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Kohlenhydrate</span>
                      <span className="font-medium">{todayNutrition.carbs}g</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-3 rounded-full transition-all"
                        style={{ width: `${Math.min(todayNutrition.carbs / 3, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Fett</span>
                      <span className="font-medium">{todayNutrition.fett}g</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-4 rounded-full transition-all"
                        style={{ width: `${Math.min(todayNutrition.fett / 1, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile: Activity List */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Letzte Aktivitäten</h2>
              </div>
              {recentActivities.length > 0 ? (
                <div className="space-y-1">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5 min-w-[60px] justify-center"
                      >
                        {formatRelativeDate(activity.date)}
                      </Badge>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'workout'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-chart-2/10 text-chart-2'
                        }`}
                      >
                        {activity.type === 'workout' ? (
                          <Dumbbell className="h-4 w-4" />
                        ) : (
                          <Utensils className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.title}</p>
                        {activity.subtitle && (
                          <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Keine Aktivitäten"
                  description="Starte dein erstes Workout!"
                  action={
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Workout starten
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Right column - Activity Feed (Desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Letzte Aktivitäten</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {recentActivities.length > 0 ? (
                    <div className="space-y-1">
                      {recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
                        >
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 min-w-[60px] justify-center"
                          >
                            {formatRelativeDate(activity.date)}
                          </Badge>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'workout'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-chart-2/10 text-chart-2'
                            }`}
                          >
                            {activity.type === 'workout' ? (
                              <Dumbbell className="h-4 w-4" />
                            ) : (
                              <Utensils className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{activity.title}</p>
                            {activity.subtitle && (
                              <p className="text-xs text-muted-foreground">
                                {activity.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Aktivitäten"
                      description="Starte dein erstes Workout!"
                      action={
                        <Button size="sm" onClick={() => setDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Workout starten
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setDialogOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50"
        aria-label="Workout hinzufügen"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
