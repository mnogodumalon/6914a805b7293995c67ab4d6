import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Dumbbell, Utensils, Scale } from 'lucide-react';

import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Workout type colors for left border
const WORKOUT_TYPE_COLORS: Record<string, string> = {
  push: 'hsl(85 35% 35%)',
  pull: 'hsl(175 40% 35%)',
  beine: 'hsl(35 60% 50%)',
  ganzkoerper: 'hsl(260 40% 50%)',
  oberkoerper: 'hsl(85 35% 35%)',
  unterkoerper: 'hsl(35 60% 50%)',
  cardio: 'hsl(350 60% 50%)',
  sonstiges: 'hsl(30 5% 45%)',
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

// Stimmung indicators
const STIMMUNG_ICONS: Record<string, string> = {
  schlecht: '😓',
  okay: '😐',
  gut: '😊',
  brutal: '💪',
};

// Progress Ring Component
function ProgressRing({
  progress,
  current,
  goal,
  label,
  color = 'hsl(85 35% 35%)',
  size = 100,
  strokeWidth = 10,
}: {
  progress: number;
  current: number | string;
  goal: number | string;
  label: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(45 20% 93%)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {current}
          </span>
          <span className="text-xs text-muted-foreground">/{goal}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// Workout Card Component
function WorkoutCard({ workout }: { workout: Workouts }) {
  const borderColor = workout.fields.typ
    ? WORKOUT_TYPE_COLORS[workout.fields.typ] || WORKOUT_TYPE_COLORS.sonstiges
    : WORKOUT_TYPE_COLORS.sonstiges;

  const typeLabel = workout.fields.typ
    ? WORKOUT_TYPE_LABELS[workout.fields.typ] || 'Sonstiges'
    : 'Sonstiges';

  const stimmungIcon = workout.fields.stimmung
    ? STIMMUNG_ICONS[workout.fields.stimmung] || ''
    : '';

  const dateFormatted = workout.fields.datum
    ? format(parseISO(workout.fields.datum), 'dd.MM', { locale: de })
    : '-';

  return (
    <Card
      className="hover:shadow-md transition-shadow duration-150"
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{dateFormatted}</span>
        <Badge variant="secondary" className="font-medium">
          {typeLabel}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {workout.fields.dauer_minuten ? `${workout.fields.dauer_minuten} min` : '-'}
          </span>
          {stimmungIcon && <span className="text-lg">{stimmungIcon}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Hero skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-around">
              <Skeleton className="h-[120px] w-[100px] rounded-full" />
              <Skeleton className="h-[120px] w-[100px] rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workouts skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [workoutsData, ernaehrungData, koerperdatenData, zieleData] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
        ]);
        setWorkouts(workoutsData);
        setErnaehrung(ernaehrungData);
        setKoerperdaten(koerperdatenData);
        setZiele(zieleData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fehler beim Laden'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get active goals
  const activeGoal = useMemo(() => {
    return ziele.find((z) => z.fields.status === 'aktiv') || ziele[0];
  }, [ziele]);

  // Calculate weekly workouts
  const weeklyWorkouts = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return workouts.filter((w) => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });
  }, [workouts]);

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

  // Weight chart data (last 30 days)
  const weightChartData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (a.fields.datum! > b.fields.datum! ? 1 : -1));

    const thirtyDaysAgo = subDays(new Date(), 30);

    return sorted
      .filter((k) => parseISO(k.fields.datum!) >= thirtyDaysAgo)
      .map((k) => ({
        date: format(parseISO(k.fields.datum!), 'dd.MM'),
        weight: k.fields.gewicht_kg,
      }));
  }, [koerperdaten]);

  // Current weight and delta
  const weightStats = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (b.fields.datum! > a.fields.datum! ? 1 : -1));

    const current = sorted[0]?.fields.gewicht_kg;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const oldEntry = sorted.find((k) => parseISO(k.fields.datum!) <= thirtyDaysAgo);
    const delta = current && oldEntry?.fields.gewicht_kg ? current - oldEntry.fields.gewicht_kg : null;

    return { current, delta };
  }, [koerperdaten]);

  // Recent workouts (sorted by date, most recent first)
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter((w) => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum! > a.fields.datum! ? 1 : -1))
      .slice(0, 5);
  }, [workouts]);

  // Goals
  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche || 5;
  const dailyProteinGoal = activeGoal?.fields.taeglich_protein || 150;
  const dailyCalorieGoal = activeGoal?.fields.taeglich_kalorien || 2500;

  // Progress calculations
  const workoutProgress = weeklyWorkouts.length / weeklyGoal;
  const proteinProgress = todayNutrition.protein / dailyProteinGoal;
  const calorieProgress = todayNutrition.kalorien / dailyCalorieGoal;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayFormatted = format(new Date(), 'EEE, d. MMM', { locale: de });

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Main Content */}
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-foreground">Mein Fitness</h1>
          <span className="text-sm text-muted-foreground">{todayFormatted}</span>
        </header>

        {/* Desktop: Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left Column (60%) */}
          <div className="lg:col-span-3 space-y-4 md:space-y-6">
            {/* Hero: Dual Progress Rings */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-around items-center">
                  <ProgressRing
                    progress={workoutProgress}
                    current={weeklyWorkouts.length}
                    goal={weeklyGoal}
                    label="Diese Woche"
                    color="hsl(85 35% 35%)"
                    size={100}
                    strokeWidth={10}
                  />
                  <ProgressRing
                    progress={proteinProgress}
                    current={Math.round(todayNutrition.protein)}
                    goal={`${dailyProteinGoal}g`}
                    label="Heute Protein"
                    color="hsl(85 40% 45%)"
                    size={100}
                    strokeWidth={10}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Today's Nutrition Summary */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                  {/* Kalorien with progress bar */}
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground">
                      {Math.round(todayNutrition.kalorien)}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Kalorien</div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(calorieProgress * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Protein */}
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground">
                      {Math.round(todayNutrition.protein)}g
                    </div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  {/* Carbs */}
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground">
                      {Math.round(todayNutrition.carbs)}g
                    </div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  {/* Fett */}
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground">
                      {Math.round(todayNutrition.fett)}g
                    </div>
                    <div className="text-xs text-muted-foreground">Fett</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Letzte Workouts</h2>
                <Badge variant="secondary" className="text-xs">
                  {recentWorkouts.length}
                </Badge>
              </div>
              {recentWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {/* Show 3 on mobile, 5 on desktop */}
                  {recentWorkouts.slice(0, window.innerWidth >= 1024 ? 5 : 3).map((workout) => (
                    <WorkoutCard key={workout.record_id} workout={workout} />
                  ))}
                </div>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <EmptyState
                      title="Noch keine Workouts"
                      description="Zeit loszulegen!"
                      icon={Dumbbell}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Body Weight Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gewichtsverlauf
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {weightStats.current ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold text-foreground">
                        {weightStats.current.toFixed(1)} kg
                      </span>
                      {weightStats.delta !== null && (
                        <span
                          className={`text-sm font-medium ${
                            weightStats.delta < 0 ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {weightStats.delta > 0 ? '+' : ''}
                          {weightStats.delta.toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    {weightChartData.length > 1 ? (
                      <div className="h-[120px] md:h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weightChartData}>
                            <defs>
                              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(85 35% 35%)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="hsl(85 35% 35%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: 'hsl(30 5% 45%)' }}
                              axisLine={false}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tick={{ fontSize: 10, fill: 'hsl(30 5% 45%)' }}
                              axisLine={false}
                              tickLine={false}
                              width={35}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(0 0% 100%)',
                                border: '1px solid hsl(45 15% 88%)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
                            />
                            <Area
                              type="monotone"
                              dataKey="weight"
                              stroke="hsl(85 35% 35%)"
                              strokeWidth={2}
                              fill="url(#weightGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Mehr Datenpunkte für Chart nötig
                      </p>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="Keine Körperdaten"
                    description="Füge dein Gewicht hinzu"
                    icon={Scale}
                  />
                )}
              </CardContent>
            </Card>

            {/* Quick Stats - Desktop only */}
            <div className="hidden lg:block">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ziele
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trainingstage/Woche</span>
                    <span className="font-medium">{weeklyGoal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tägliche Kalorien</span>
                    <span className="font-medium">{dailyCalorieGoal} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tägliches Protein</span>
                    <span className="font-medium">{dailyProteinGoal}g</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="mb-4">
            <SheetTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Schnelleintrag</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 pb-6">
            <button
              onClick={() => setSheetOpen(false)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Workout
              </span>
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Utensils className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Mahlzeit
              </span>
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Körperdaten
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
