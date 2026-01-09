import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import {
  Dumbbell,
  Timer,
  Flame,
  Scale,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, subDays, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  ziele: Ziele[];
}

interface KPIData {
  value: number | string;
  trend?: number;
  unit: string;
}

const MOOD_COLORS = {
  schlecht: 'hsl(0 75% 58%)',
  okay: 'hsl(40 90% 55%)',
  gut: 'hsl(142 70% 50%)',
  brutal: 'hsl(170 80% 50%)'
};

const MOOD_LABELS = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal'
};

const TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges'
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [workouts, ernaehrung, koerperdaten, ziele] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele()
      ]);

      setData({ workouts, ernaehrung, koerperdaten, ziele });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  const calculateKPIs = (): Record<string, KPIData> => {
    if (!data) return {};

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(weekStart, 7);
    const lastWeekEnd = subDays(weekEnd, 7);

    // Workouts this week (non-rest days)
    const workoutsThisWeek = data.workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    }).length;

    const workoutsLastWeek = data.workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
    }).length;

    const workoutsTrend = workoutsLastWeek > 0
      ? Math.round(((workoutsThisWeek - workoutsLastWeek) / workoutsLastWeek) * 100)
      : 0;

    // Training time this week
    const trainingTimeThisWeek = data.workouts
      .filter(w => {
        if (!w.fields.datum) return false;
        const date = parseISO(w.fields.datum);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

    const trainingTimeLastWeek = data.workouts
      .filter(w => {
        if (!w.fields.datum) return false;
        const date = parseISO(w.fields.datum);
        return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
      })
      .reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

    const timeTrend = trainingTimeLastWeek > 0
      ? Math.round(((trainingTimeThisWeek - trainingTimeLastWeek) / trainingTimeLastWeek) * 100)
      : 0;

    // Calories today
    const todayStr = format(today, 'yyyy-MM-dd');
    const caloriesToday = data.ernaehrung
      .filter(e => e.fields.datum === todayStr)
      .reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);

    // Get active goal
    const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv');
    const calorieGoal = activeGoal?.fields.taeglich_kalorien || 0;
    const calorieProgress = calorieGoal > 0 ? (caloriesToday / calorieGoal) * 100 : 0;

    // Current weight
    const sortedWeight = [...data.koerperdaten]
      .filter(k => k.fields.gewicht_kg != null)
      .sort((a, b) => {
        if (!a.fields.datum || !b.fields.datum) return 0;
        return new Date(b.fields.datum).getTime() - new Date(a.fields.datum).getTime();
      });

    const currentWeight = sortedWeight[0]?.fields.gewicht_kg || 0;
    const previousWeight = sortedWeight[1]?.fields.gewicht_kg || 0;
    const weightChange = previousWeight > 0 ? currentWeight - previousWeight : 0;

    return {
      workouts: {
        value: workoutsThisWeek,
        trend: workoutsTrend,
        unit: 'Trainings'
      },
      trainingTime: {
        value: Math.round(trainingTimeThisWeek),
        trend: timeTrend,
        unit: 'min'
      },
      calories: {
        value: Math.round(caloriesToday),
        trend: Math.round(calorieProgress - 100),
        unit: 'kcal'
      },
      weight: {
        value: currentWeight.toFixed(1),
        trend: weightChange ? parseFloat((weightChange).toFixed(1)) : undefined,
        unit: 'kg'
      },
      calorieGoal: {
        value: calorieGoal,
        unit: ''
      },
      proteinGoal: {
        value: activeGoal?.fields.taeglich_protein || 0,
        unit: ''
      },
      calorieProgress: {
        value: Math.min(calorieProgress, 100),
        unit: ''
      },
      proteinToday: {
        value: data.ernaehrung
          .filter(e => e.fields.datum === todayStr)
          .reduce((sum, e) => sum + (e.fields.protein || 0), 0),
        unit: ''
      }
    };
  };

  const getWorkoutChartData = () => {
    if (!data) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, 'yyyy-MM-dd');
    });

    return last30Days.map(dateStr => {
      const workout = data.workouts.find(w => w.fields.datum === dateStr);
      return {
        date: format(parseISO(dateStr), 'dd.MM', { locale: de }),
        fullDate: dateStr,
        dauer: workout?.fields.dauer_minuten || 0,
        stimmung: workout?.fields.stimmung,
        restDay: workout?.fields.rest_day || false
      };
    });
  };

  const getWeightChartData = () => {
    if (!data) return [];

    const last90Days = subDays(new Date(), 90);

    return data.koerperdaten
      .filter(k => k.fields.datum && k.fields.gewicht_kg != null)
      .filter(k => {
        const date = parseISO(k.fields.datum!);
        return date >= last90Days;
      })
      .sort((a, b) => {
        if (!a.fields.datum || !b.fields.datum) return 0;
        return new Date(a.fields.datum).getTime() - new Date(b.fields.datum).getTime();
      })
      .map(k => ({
        date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg
      }));
  };

  const getWorkoutTypeDistribution = () => {
    if (!data) return [];

    const last30Days = subDays(new Date(), 30);
    const recentWorkouts = data.workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return date >= last30Days;
    });

    const typeCounts: Record<string, number> = {};
    recentWorkouts.forEach(w => {
      const typ = w.fields.typ || 'sonstiges';
      typeCounts[typ] = (typeCounts[typ] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([typ, count]) => ({
        typ: TYP_LABELS[typ] || typ,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getRecentWorkouts = () => {
    if (!data) return [];

    return [...data.workouts]
      .filter(w => w.fields.datum)
      .sort((a, b) => {
        if (!a.fields.datum || !b.fields.datum) return 0;
        return new Date(b.fields.datum).getTime() - new Date(a.fields.datum).getTime();
      })
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kpis = calculateKPIs();
  const workoutChartData = getWorkoutChartData();
  const weightChartData = getWeightChartData();
  const workoutTypeDist = getWorkoutTypeDistribution();
  const recentWorkouts = getRecentWorkouts();

  const KPICard = ({
    title,
    value,
    unit,
    trend,
    icon: Icon,
    delay
  }: {
    title: string;
    value: number | string;
    unit: string;
    trend?: number;
    icon: any;
    delay: number;
  }) => (
    <Card className="card-lift animate-in relative overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {value} <span className="text-lg sm:text-xl text-muted-foreground font-medium">{unit}</span>
            </p>
            {trend !== undefined && trend !== 0 && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-positive" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${trend > 0 ? 'text-positive' : 'text-destructive'}`}>
                  {Math.abs(trend)}{unit === 'kg' ? ' kg' : '%'}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded-full bg-primary/10">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{data.fullDate || data.date}</p>
          {data.dauer !== undefined && (
            <p className="text-sm text-muted-foreground">
              Dauer: {data.dauer} min
            </p>
          )}
          {data.stimmung && (
            <p className="text-sm">
              Stimmung: <span style={{ color: MOOD_COLORS[data.stimmung as keyof typeof MOOD_COLORS] }}>
                {MOOD_LABELS[data.stimmung as keyof typeof MOOD_LABELS]}
              </span>
            </p>
          )}
          {data.gewicht !== undefined && (
            <p className="text-sm text-muted-foreground">
              Gewicht: {data.gewicht} kg
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between">
          <div className="animate-in" style={{ animationDelay: '0ms' }}>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Fitness Tracker
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
            </p>
          </div>
          <Button className="animate-in" style={{ animationDelay: '80ms' }}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Workout Eintragen</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KPICard
            title="Workouts Diese Woche"
            value={kpis.workouts.value}
            unit={kpis.workouts.unit}
            trend={kpis.workouts.trend}
            icon={Dumbbell}
            delay={80}
          />
          <KPICard
            title="Trainingszeit"
            value={kpis.trainingTime.value}
            unit={kpis.trainingTime.unit}
            trend={kpis.trainingTime.trend}
            icon={Timer}
            delay={160}
          />
          <KPICard
            title="Kalorien Heute"
            value={kpis.calories.value}
            unit={kpis.calories.unit}
            trend={kpis.calories.trend}
            icon={Flame}
            delay={240}
          />
          <KPICard
            title="Aktuelles Gewicht"
            value={kpis.weight.value}
            unit={kpis.weight.unit}
            trend={kpis.weight.trend}
            icon={Scale}
            delay={320}
          />
        </div>

        {/* Main Chart */}
        <Card className="card-lift animate-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Workouts & Stimmung (Letzte 30 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[300px] lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workoutChartData}>
                  <defs>
                    <linearGradient id="colorDauer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(25 95% 58%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(25 95% 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'hsl(220 10% 65%)' }}
                    stroke="hsl(220 15% 18%)"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(220 10% 65%)' }}
                    stroke="hsl(220 15% 18%)"
                    label={{ value: 'Minuten', angle: -90, position: 'insideLeft', fill: 'hsl(220 10% 65%)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="dauer"
                    stroke="hsl(25 95% 58%)"
                    strokeWidth={2}
                    fill="url(#colorDauer)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Nutrition Progress */}
          <Card className="card-lift animate-in" style={{ animationDelay: '480ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Heutige Ernährung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Kalorien</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(kpis.calories.value as number)} / {kpis.calorieGoal.value} kcal
                  </span>
                </div>
                <Progress value={kpis.calorieProgress.value as number} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(kpis.proteinToday.value as number)} / {kpis.proteinGoal.value} g
                  </span>
                </div>
                <Progress
                  value={(kpis.proteinGoal.value as number) > 0 ? Math.min((kpis.proteinToday.value as number / (kpis.proteinGoal.value as number)) * 100, 100) : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Weight Chart */}
          {weightChartData.length > 0 && (
            <Card className="card-lift animate-in" style={{ animationDelay: '560ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">Gewichtsverlauf (90 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'hsl(220 10% 65%)' }}
                        stroke="hsl(220 15% 18%)"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(220 10% 65%)' }}
                        stroke="hsl(220 15% 18%)"
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="gewicht"
                        stroke="hsl(170 70% 45%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(170 70% 45%)', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Workouts */}
          <Card className="card-lift animate-in" style={{ animationDelay: '640ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Letzte Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.record_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {workout.fields.datum ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de }) : '-'}
                        </span>
                        {workout.fields.rest_day && (
                          <Badge variant="outline" className="text-xs">Ruhetag</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{workout.fields.typ ? TYP_LABELS[workout.fields.typ] : '-'}</span>
                        {workout.fields.dauer_minuten && (
                          <>
                            <span>•</span>
                            <span>{workout.fields.dauer_minuten} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    {workout.fields.stimmung && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MOOD_COLORS[workout.fields.stimmung] }}
                        title={MOOD_LABELS[workout.fields.stimmung]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workout Type Distribution */}
          {workoutTypeDist.length > 0 && (
            <Card className="card-lift animate-in" style={{ animationDelay: '720ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">Workout-Typ Verteilung (30 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutTypeDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: 'hsl(220 10% 65%)' }}
                        stroke="hsl(220 15% 18%)"
                      />
                      <YAxis
                        type="category"
                        dataKey="typ"
                        tick={{ fontSize: 11, fill: 'hsl(220 10% 65%)' }}
                        stroke="hsl(220 15% 18%)"
                        width={100}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(25 95% 58%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
