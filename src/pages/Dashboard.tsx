import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertCircle,
  Flame,
  Beef,
  Wheat,
  Droplet,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Scale
} from 'lucide-react';

// Helper to get today's date in YYYY-MM-DD format
function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Helper to get current week range
function getCurrentWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 })
  };
}

// Get weekday from date (0 = Monday, 6 = Sunday)
function getWeekdayIndex(dateStr: string): number {
  const date = parseISO(dateStr);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0
}

// Protein Progress Ring Component
function ProteinRing({ current, goal, size = 120 }: { current: number; goal: number; size?: number }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl md:text-4xl font-bold tracking-tight">{Math.round(current)}</span>
        <span className="text-xs text-muted-foreground">von {goal}g</span>
      </div>
    </div>
  );
}

// Macro Stat Card Component
function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
  goal,
  color = 'primary'
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  goal?: number;
  color?: 'primary' | 'secondary';
}) {
  const percentage = goal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <Card className="flex-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-xl font-bold">
          {Math.round(value)}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        {goal && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color === 'primary' ? 'bg-primary' : 'bg-chart-2'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Weekly Workout Dots Component
function WeeklyDots({ workoutDays }: { workoutDays: boolean[] }) {
  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="flex gap-2 justify-center">
      {dayLabels.map((day, index) => (
        <div key={day} className="flex flex-col items-center gap-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
              workoutDays[index]
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {workoutDays[index] ? <Dumbbell className="h-3 w-3" /> : null}
          </div>
          <span className="text-[10px] text-muted-foreground">{day}</span>
        </div>
      ))}
    </div>
  );
}

// Workout Type Badge Colors
const workoutTypeColors: Record<string, string> = {
  push: 'bg-orange-100 text-orange-700 border-orange-200',
  pull: 'bg-blue-100 text-blue-700 border-blue-200',
  beine: 'bg-purple-100 text-purple-700 border-purple-200',
  ganzkoerper: 'bg-green-100 text-green-700 border-green-200',
  oberkoerper: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  unterkoerper: 'bg-pink-100 text-pink-700 border-pink-200',
  cardio: 'bg-red-100 text-red-700 border-red-200',
  sonstiges: 'bg-gray-100 text-gray-700 border-gray-200',
};

const workoutTypeLabels: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

const moodEmojis: Record<string, string> = {
  schlecht: '😔',
  okay: '😐',
  gut: '😊',
  brutal: '💪',
};

// Loading Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 pb-24 md:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Hero Skeleton */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-24 mt-4" />
          </CardContent>
        </Card>

        {/* Macros Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-muted-foreground mb-2">{title}</div>
      <p className="text-sm text-muted-foreground/70">{description}</p>
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
        setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate today's nutrition
  const todayNutrition = useMemo(() => {
    const today = getToday();
    const todayMeals = ernaehrung.filter(e => e.fields.datum === today);

    return {
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0),
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.fields.carbs || 0), 0),
      fett: todayMeals.reduce((sum, m) => sum + (m.fields.fett || 0), 0),
    };
  }, [ernaehrung]);

  // Get active goals
  const activeGoals = useMemo(() => {
    const active = ziele.find(z => z.fields.status === 'aktiv');
    return {
      protein: active?.fields.taeglich_protein || 150,
      kalorien: active?.fields.taeglich_kalorien || 2500,
      trainingstage: active?.fields.trainingstage_pro_woche || 4,
    };
  }, [ziele]);

  // Calculate weekly workouts
  const weeklyWorkouts = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    const weekWorkouts = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start, end });
    });

    // Create array of 7 booleans for each day of the week
    const workoutDays = Array(7).fill(false);
    weekWorkouts.forEach(w => {
      if (w.fields.datum) {
        const dayIndex = getWeekdayIndex(w.fields.datum);
        workoutDays[dayIndex] = true;
      }
    });

    return {
      count: weekWorkouts.length,
      days: workoutDays,
    };
  }, [workouts]);

  // Get latest weight and trend
  const weightData = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''));

    const latest = sorted[0];
    const oneWeekAgo = subDays(new Date(), 7);
    const weekAgoEntry = sorted.find(k => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      return date <= oneWeekAgo;
    });

    const trend = latest && weekAgoEntry
      ? (latest.fields.gewicht_kg || 0) - (weekAgoEntry.fields.gewicht_kg || 0)
      : null;

    // Chart data - last 14 days for mobile, 30 for desktop
    const chartData = sorted
      .slice(0, 30)
      .reverse()
      .map(k => ({
        date: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
        gewicht: k.fields.gewicht_kg || 0,
      }));

    return {
      latest: latest?.fields.gewicht_kg || null,
      trend,
      chartData,
    };
  }, [koerperdaten]);

  // Get recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5);
  }, [workouts]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
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
      {/* Main Content */}
      <div className="p-4 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">Fitness Tracker</h1>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'dd. MMMM yyyy', { locale: de })}
            </span>
          </header>

          {/* Desktop: Two Column Layout */}
          <div className="grid md:grid-cols-[1fr_340px] gap-6">
            {/* Left Column - Main Content */}
            <div className="space-y-6">
              {/* Hero: Protein Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Protein heute</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <ProteinRing
                    current={todayNutrition.protein}
                    goal={activeGoals.protein}
                    size={140}
                  />
                  <p className="text-sm text-muted-foreground mt-3">
                    {Math.round((todayNutrition.protein / activeGoals.protein) * 100)}% erreicht
                  </p>
                </CardContent>
              </Card>

              {/* Today's Macros */}
              <div className="grid grid-cols-3 gap-3">
                <MacroCard
                  icon={Flame}
                  label="Kalorien"
                  value={todayNutrition.kalorien}
                  unit="kcal"
                  goal={activeGoals.kalorien}
                />
                <MacroCard
                  icon={Wheat}
                  label="Carbs"
                  value={todayNutrition.carbs}
                  unit="g"
                />
                <MacroCard
                  icon={Droplet}
                  label="Fett"
                  value={todayNutrition.fett}
                  unit="g"
                />
              </div>

              {/* Weekly Workouts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span>Diese Woche</span>
                    <span className="text-2xl font-bold">
                      {weeklyWorkouts.count}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        von {activeGoals.trainingstage}
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WeeklyDots workoutDays={weeklyWorkouts.days} />
                </CardContent>
              </Card>

              {/* Weight Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span>Gewicht</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {weightData.latest ? `${weightData.latest.toFixed(1)} kg` : '-'}
                      </span>
                      {weightData.trend !== null && (
                        <span className={`flex items-center text-sm ${weightData.trend > 0 ? 'text-destructive' : 'text-chart-2'}`}>
                          {weightData.trend > 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(weightData.trend).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weightData.chartData.length > 0 ? (
                    <div className="h-[120px] -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightData.chartData}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)',
                              fontSize: '12px'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
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
                    <EmptyState
                      title="Keine Daten"
                      description="Trage dein Gewicht ein, um den Verlauf zu sehen."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Secondary Content (Desktop) / Below on Mobile */}
            <div className="space-y-6">
              {/* Recent Workouts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Letzte Workouts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentWorkouts.length > 0 ? (
                    recentWorkouts.slice(0, window.innerWidth >= 768 ? 5 : 3).map(workout => (
                      <div
                        key={workout.record_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={workout.fields.typ ? workoutTypeColors[workout.fields.typ] : ''}
                          >
                            {workout.fields.typ ? workoutTypeLabels[workout.fields.typ] : 'Workout'}
                          </Badge>
                          <div>
                            <div className="text-sm font-medium">
                              {workout.fields.datum
                                ? format(parseISO(workout.fields.datum), 'EEEE, dd.MM', { locale: de })
                                : '-'
                              }
                            </div>
                            {workout.fields.dauer_minuten && (
                              <div className="text-xs text-muted-foreground">
                                {workout.fields.dauer_minuten} Min
                              </div>
                            )}
                          </div>
                        </div>
                        {workout.fields.stimmung && (
                          <span className="text-lg">{moodEmojis[workout.fields.stimmung]}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Keine Workouts"
                      description="Starte dein erstes Training!"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions (Desktop only) */}
              <Card className="hidden md:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Schnellaktionen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start gap-2"
                    onClick={() => alert('Workout starten - Coming soon!')}
                  >
                    <Dumbbell className="h-4 w-4" />
                    Workout starten
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => alert('Mahlzeit eintragen - Coming soon!')}
                  >
                    <Beef className="h-4 w-4" />
                    Mahlzeit eintragen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA (Mobile only) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t md:hidden">
        <Button
          className="w-full h-12 text-base font-semibold gap-2"
          onClick={() => alert('Workout starten - Coming soon!')}
        >
          <Dumbbell className="h-5 w-5" />
          Workout starten
        </Button>
      </div>
    </div>
  );
}
