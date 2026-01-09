import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Flame, Beef, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface KPICardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  delay: number;
}

function KPICard({ title, value, suffix, icon: Icon, trend, delay }: KPICardProps) {
  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {value}{suffix && <span className="text-lg sm:text-xl text-muted-foreground ml-1">{suffix}</span>}
            </p>
            {trend !== undefined && trend !== 0 && (
              <p className={`text-xs sm:text-sm mt-2 font-medium ${trend > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
              </p>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded-full bg-primary/10">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{error.message}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
    const startOfLastWeek = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    const lastMonth = subDays(today, 30);

    // Workouts this week
    const workoutsThisWeek = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return date >= startOfThisWeek && date <= endOfThisWeek;
    }).length;

    const workoutsLastWeek = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return date >= startOfLastWeek && date <= endOfLastWeek;
    }).length;

    const workoutsTrend = workoutsLastWeek > 0
      ? ((workoutsThisWeek - workoutsLastWeek) / workoutsLastWeek) * 100
      : 0;

    // Calories today
    const caloriesToday = ernaehrung
      .filter(e => e.fields.datum === todayStr)
      .reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);

    const activeGoal = ziele.find(z => z.fields.status === 'aktiv');
    const calorieGoal = activeGoal?.fields.taeglich_kalorien || 0;
    const calorieTrend = calorieGoal > 0 ? ((caloriesToday / calorieGoal) * 100) - 100 : 0;

    // Protein today
    const proteinToday = ernaehrung
      .filter(e => e.fields.datum === todayStr)
      .reduce((sum, e) => sum + (e.fields.protein || 0), 0);

    const proteinGoal = activeGoal?.fields.taeglich_protein || 0;
    const proteinTrend = proteinGoal > 0 ? ((proteinToday / proteinGoal) * 100) - 100 : 0;

    // Current weight
    const sortedWeights = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg != null)
      .sort((a, b) => {
        const dateA = a.fields.datum ? parseISO(a.fields.datum) : new Date(a.createdat);
        const dateB = b.fields.datum ? parseISO(b.fields.datum) : new Date(b.createdat);
        return dateB.getTime() - dateA.getTime();
      });

    const currentWeight = sortedWeights[0]?.fields.gewicht_kg || 0;

    const lastMonthWeights = koerperdaten.filter(k => {
      const date = k.fields.datum ? parseISO(k.fields.datum) : new Date(k.createdat);
      return date >= lastMonth && k.fields.gewicht_kg != null;
    });
    const avgLastMonth = lastMonthWeights.length > 0
      ? lastMonthWeights.reduce((sum, k) => sum + (k.fields.gewicht_kg || 0), 0) / lastMonthWeights.length
      : 0;

    const weightTrend = avgLastMonth > 0 ? ((currentWeight - avgLastMonth) / avgLastMonth) * 100 : 0;

    return {
      workoutsThisWeek,
      workoutsTrend,
      caloriesToday,
      calorieTrend,
      proteinToday,
      proteinTrend,
      currentWeight,
      weightTrend,
    };
  }, [workouts, ernaehrung, koerperdaten, ziele]);

  // Chart data for last 4 weeks
  const workoutChartData = useMemo(() => {
    const last28Days = Array.from({ length: 28 }, (_, i) => {
      const date = subDays(new Date(), 27 - i);
      return format(date, 'yyyy-MM-dd');
    });

    return last28Days.map(dateStr => {
      const dayWorkouts = workouts.filter(w => w.fields.datum === dateStr);
      const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);
      return {
        date: format(parseISO(dateStr), 'dd.MM', { locale: de }),
        dauer: totalDuration,
      };
    });
  }, [workouts]);

  // Weight trend chart (last 30 days)
  const weightChartData = useMemo(() => {
    const sortedData = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg != null && k.fields.datum)
      .sort((a, b) => {
        const dateA = parseISO(a.fields.datum!);
        const dateB = parseISO(b.fields.datum!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30);

    return sortedData.map(k => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg,
    }));
  }, [koerperdaten]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.fields.datum)
      .sort((a, b) => {
        const dateA = parseISO(a.fields.datum!);
        const dateB = parseISO(b.fields.datum!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [workouts]);

  // Active goals
  const activeGoals = useMemo(() => {
    return ziele.filter(z => z.fields.status === 'aktiv');
  }, [ziele]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  const getStimmungColor = (stimmung?: string) => {
    switch (stimmung) {
      case 'brutal': return 'bg-chart-2 text-black';
      case 'gut': return 'bg-chart-3 text-black';
      case 'okay': return 'bg-chart-4 text-white';
      case 'schlecht': return 'bg-destructive text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypLabel = (typ?: string) => {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b p-4 animate-fade-in-up">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Fitness & Ernährungs-Tracker</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {format(new Date(), 'PPP', { locale: de })}
            </p>
          </div>
          <Button asChild>
            <a
              href="https://my.living-apps.de/workspaces/6914a805b7293995c67ab4d6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Workout loggen
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KPICard
            title="Workouts Diese Woche"
            value={kpis.workoutsThisWeek}
            suffix=" Sessions"
            icon={Dumbbell}
            trend={kpis.workoutsTrend}
            delay={100}
          />
          <KPICard
            title="Kalorien Heute"
            value={Math.round(kpis.caloriesToday)}
            suffix=" kcal"
            icon={Flame}
            trend={kpis.calorieTrend}
            delay={180}
          />
          <KPICard
            title="Protein Heute"
            value={Math.round(kpis.proteinToday)}
            suffix="g"
            icon={Beef}
            trend={kpis.proteinTrend}
            delay={260}
          />
          <KPICard
            title="Aktuelles Gewicht"
            value={kpis.currentWeight.toFixed(1)}
            suffix=" kg"
            icon={TrendingUp}
            trend={kpis.weightTrend}
            delay={340}
          />
        </div>

        {/* Main Chart */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '420ms' }}>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Trainingsvolumen (letzte 4 Wochen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workoutChartData}>
                  <defs>
                    <linearGradient id="colorDauer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    label={{ value: 'Minuten', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dauer"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorDauer)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Workouts */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Letzte Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Noch keine Workouts vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout, idx) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${500 + idx * 50}ms` }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getTypLabel(workout.fields.typ)}
                          </Badge>
                          {workout.fields.stimmung && (
                            <Badge className={`text-xs ${getStimmungColor(workout.fields.stimmung)}`}>
                              {workout.fields.stimmung}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {workout.fields.datum ? format(parseISO(workout.fields.datum), 'PPP', { locale: de }) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{workout.fields.dauer_minuten || 0}</p>
                        <p className="text-xs text-muted-foreground">Minuten</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weight Trend */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '580ms' }}>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Körpergewicht Trend (30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              {weightChartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Noch keine Körperdaten vorhanden</p>
              ) : (
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="gewicht"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <Card className="animate-fade-in-up" style={{ animationDelay: '660ms' }}>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Aktive Ziele</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeGoals.map((goal) => (
                  <div key={goal.record_id} className="space-y-2">
                    {goal.fields.taeglich_kalorien != null && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Tägliche Kalorien</p>
                        <p className="text-xl font-bold">{goal.fields.taeglich_kalorien} kcal</p>
                      </div>
                    )}
                    {goal.fields.taeglich_protein != null && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Tägliches Protein</p>
                        <p className="text-xl font-bold">{goal.fields.taeglich_protein}g</p>
                      </div>
                    )}
                    {goal.fields.trainingstage_pro_woche != null && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Trainingstage/Woche</p>
                        <p className="text-xl font-bold">{goal.fields.trainingstage_pro_woche}</p>
                      </div>
                    )}
                    {goal.fields.schlaf_ziel_stunden != null && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Schlafziel</p>
                        <p className="text-xl font-bold">{goal.fields.schlaf_ziel_stunden}h</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
