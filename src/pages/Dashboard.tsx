import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Dumbbell, Flame, Scale, Beef, AlertCircle, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfDay, isWithinInterval, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';

// Theme colors from design_spec.json
const colors = {
  background: 'hsl(215 28% 7%)',
  foreground: 'hsl(215 10% 92%)',
  primary: 'hsl(25 95% 53%)',
  accent: 'hsl(173 80% 45%)',
  muted: 'hsl(215 15% 20%)',
  positive: 'hsl(142 76% 36%)',
  negative: 'hsl(0 84% 60%)',
  card: 'hsl(215 25% 12%)',
  border: 'hsl(215 20% 18%)',
};

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  ziele: Ziele[];
}

function LoadingState() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-12 w-64 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <Skeleton className="h-[300px] md:h-[400px]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 mt-2">
          <span>{error.message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${colors.accent}15` }}>
        <Dumbbell className="w-10 h-10" style={{ color: colors.accent }} />
      </div>
      <h3 className="text-xl font-bold mb-3">Willkommen zum Fitness Tracker!</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Starte deine Fitness-Reise, indem du dein erstes Workout oder deine erste Mahlzeit einträgst.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <a href="https://my.living-apps.de/apps/6914a7e7b773d677cf3838c1" target="_blank" rel="noopener noreferrer">
            <Dumbbell className="w-4 h-4 mr-2" />
            Workout hinzufügen
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://my.living-apps.de/apps/6914a7e8078cdd936a7fe8bf" target="_blank" rel="noopener noreferrer">
            <Flame className="w-4 h-4 mr-2" />
            Mahlzeit hinzufügen
          </a>
        </Button>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  unit = '',
  icon: Icon,
  color,
  trend,
  goal,
  index
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: any;
  color: string;
  trend?: { value: number; isPositive: boolean };
  goal?: number;
  index: number;
}) {
  const progress = goal ? Math.min((Number(value) / goal) * 100, 100) : null;

  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 animate-in opacity-0"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'forwards',
        animationDuration: '0.5s',
        animationName: 'fadeInUp',
      }}
    >
      <div className="absolute inset-0 opacity-10" style={{
        background: `linear-gradient(135deg, ${color} 0%, transparent 100%)`
      }} />
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-light mb-2" style={{ fontWeight: 300, color: colors.foreground }}>
              {title}
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold" style={{ fontWeight: 800, color: colors.foreground }}>
              {value}
              {unit && <span className="text-lg ml-1" style={{ fontWeight: 500 }}>{unit}</span>}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4" style={{ color: colors.positive }} />
                ) : (
                  <TrendingDown className="w-4 h-4" style={{ color: colors.negative }} />
                )}
                <span style={{ color: trend.isPositive ? colors.positive : colors.negative }}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
            {progress !== null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: colors.foreground, opacity: 0.7 }}>Ziel: {goal}</span>
                  <span style={{ color }}>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.muted }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workouts, ernaehrung, koerperdaten, ziele] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
      ]);
      setData({ workouts, ernaehrung, koerperdaten, ziele });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const weekStart = startOfWeek(now, { locale: de });
    const weekEnd = endOfWeek(now, { locale: de });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: de });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: de });
    const today = startOfDay(now);

    // Workouts this week
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

    // Calories today
    const caloriesToday = data.ernaehrung
      .filter(e => {
        if (!e.fields.datum) return false;
        const date = parseISO(e.fields.datum);
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
      })
      .reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);

    // Protein today
    const proteinToday = data.ernaehrung
      .filter(e => {
        if (!e.fields.datum) return false;
        const date = parseISO(e.fields.datum);
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
      })
      .reduce((sum, e) => sum + (e.fields.protein || 0), 0);

    // Current weight
    const sortedWeight = [...data.koerperdaten]
      .filter(k => k.fields.gewicht_kg && k.fields.datum)
      .sort((a, b) => {
        const dateA = parseISO(a.fields.datum!);
        const dateB = parseISO(b.fields.datum!);
        return dateB.getTime() - dateA.getTime();
      });

    const currentWeight = sortedWeight[0]?.fields.gewicht_kg || null;
    const lastMonthWeight = sortedWeight.find(k => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 28 && daysDiff <= 35;
    })?.fields.gewicht_kg;

    const weightTrend = lastMonthWeight && currentWeight
      ? Math.round(((currentWeight - lastMonthWeight) / lastMonthWeight) * 100)
      : null;

    // Goals
    const activeGoals = data.ziele.filter(z => z.fields.status === 'aktiv');
    const calorieGoal = activeGoals[0]?.fields.taeglich_kalorien;
    const proteinGoal = activeGoals[0]?.fields.taeglich_protein;

    return {
      workoutsThisWeek,
      workoutsTrend,
      caloriesToday,
      calorieGoal,
      proteinToday,
      proteinGoal,
      currentWeight,
      weightTrend,
    };
  }, [data]);

  // Chart data for weight progress
  const weightChartData = useMemo(() => {
    if (!data) return [];
    return data.koerperdaten
      .filter(k => k.fields.gewicht_kg && k.fields.datum)
      .map(k => ({
        date: k.fields.datum!,
        weight: k.fields.gewicht_kg!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 entries
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (!data || (data.workouts.length === 0 && data.ernaehrung.length === 0 && data.koerperdaten.length === 0)) {
    return <EmptyState />;
  }

  const recentWorkouts = [...data.workouts]
    .filter(w => w.fields.datum)
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!);
      const dateB = parseISO(b.fields.datum!);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const activeGoals = data.ziele.filter(z => z.fields.status === 'aktiv');

  const todaysMeals = data.ernaehrung.filter(e => {
    if (!e.fields.datum) return false;
    const date = parseISO(e.fields.datum);
    const today = startOfDay(new Date());
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  });

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

  const moodLabels: Record<string, string> = {
    schlecht: '😞 Schlecht',
    okay: '😐 Okay',
    gut: '😊 Gut',
    brutal: '🔥 Brutal',
  };

  const mealTypeLabels: Record<string, string> = {
    fruehstueck: 'Frühstück',
    snack: 'Snack',
    mittagessen: 'Mittagessen',
    abendessen: 'Abendessen',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
    sonstiges: 'Sonstiges',
  };

  return (
    <div className="min-h-screen" style={{
      background: `radial-gradient(ellipse at top right, hsl(173 80% 10% / 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom left, hsl(25 95% 10% / 0.12) 0%, transparent 50%), ${colors.background}`,
      fontFamily: "'Space Grotesk', sans-serif",
      color: colors.foreground,
    }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b p-4 md:p-6" style={{
        backgroundColor: `${colors.background}cc`,
        borderColor: colors.border,
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontWeight: 800 }}>
              Fitness Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ fontWeight: 300, color: `${colors.foreground}99` }}>
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <a href="https://my.living-apps.de/apps/6914a7e7b773d677cf3838c1" target="_blank" rel="noopener noreferrer">
                <Dumbbell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Log Workout</span>
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://my.living-apps.de/apps/6914a7e8078cdd936a7fe8bf" target="_blank" rel="noopener noreferrer">
                <Flame className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Meal</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto relative">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <KPICard
            title="Workouts This Week"
            value={kpis?.workoutsThisWeek || 0}
            icon={Dumbbell}
            color={colors.accent}
            trend={kpis?.workoutsTrend ? {
              value: kpis.workoutsTrend,
              isPositive: kpis.workoutsTrend >= 0
            } : undefined}
            index={0}
          />
          <KPICard
            title="Calories Today"
            value={Math.round(kpis?.caloriesToday || 0)}
            icon={Flame}
            color={colors.primary}
            goal={kpis?.calorieGoal}
            index={1}
          />
          <KPICard
            title="Current Weight"
            value={kpis?.currentWeight?.toFixed(1) || '-'}
            unit="kg"
            icon={Scale}
            color={colors.foreground}
            trend={kpis?.weightTrend ? {
              value: kpis.weightTrend,
              isPositive: kpis.weightTrend <= 0 // Weight loss is positive
            } : undefined}
            index={2}
          />
          <KPICard
            title="Protein Today"
            value={Math.round(kpis?.proteinToday || 0)}
            unit="g"
            icon={Beef}
            color={colors.positive}
            goal={kpis?.proteinGoal}
            index={3}
          />
        </div>

        {/* Weight Progress Chart */}
        {weightChartData.length > 0 && (
          <Card className="mb-6 animate-in" style={{ animationDelay: '320ms' }}>
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightChartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: colors.foreground }}
                      stroke={colors.border}
                      tickFormatter={(date) => format(parseISO(date), 'dd.MM', { locale: de })}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: colors.foreground }}
                      stroke={colors.border}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.foreground,
                      }}
                      labelFormatter={(date) => format(parseISO(date), 'PPP', { locale: de })}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke={colors.accent}
                      strokeWidth={3}
                      fill="url(#weightGradient)"
                      dot={{ fill: colors.accent, strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Workouts */}
          <Card className="animate-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>Recent Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-sm" style={{ color: `${colors.foreground}80` }}>
                  Noch keine Workouts vorhanden
                </p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/5"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ fontWeight: 600 }}>
                            {workout.fields.typ ? workoutTypeLabels[workout.fields.typ] : 'Workout'}
                          </span>
                          {workout.fields.stimmung && (
                            <span className="text-sm">
                              {moodLabels[workout.fields.stimmung]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm" style={{ color: `${colors.foreground}80` }}>
                          <span>
                            {workout.fields.datum ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de }) : '-'}
                          </span>
                          {workout.fields.dauer_minuten && (
                            <span>{workout.fields.dauer_minuten} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals & Today's Meals */}
          <div className="space-y-4">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <Card className="animate-in" style={{ animationDelay: '480ms' }}>
                <CardHeader>
                  <CardTitle style={{ fontWeight: 700 }}>Active Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeGoals.map((goal) => (
                      <div key={goal.record_id} className="space-y-2">
                        {goal.fields.taeglich_kalorien && (
                          <div className="flex justify-between items-center text-sm">
                            <span style={{ color: `${colors.foreground}cc` }}>Tägliche Kalorien</span>
                            <span className="font-semibold" style={{ color: colors.primary }}>
                              {goal.fields.taeglich_kalorien} kcal
                            </span>
                          </div>
                        )}
                        {goal.fields.taeglich_protein && (
                          <div className="flex justify-between items-center text-sm">
                            <span style={{ color: `${colors.foreground}cc` }}>Tägliches Protein</span>
                            <span className="font-semibold" style={{ color: colors.positive }}>
                              {goal.fields.taeglich_protein} g
                            </span>
                          </div>
                        )}
                        {goal.fields.trainingstage_pro_woche && (
                          <div className="flex justify-between items-center text-sm">
                            <span style={{ color: `${colors.foreground}cc` }}>Trainingstage/Woche</span>
                            <span className="font-semibold" style={{ color: colors.accent }}>
                              {goal.fields.trainingstage_pro_woche}
                            </span>
                          </div>
                        )}
                        {goal.fields.schlaf_ziel_stunden && (
                          <div className="flex justify-between items-center text-sm">
                            <span style={{ color: `${colors.foreground}cc` }}>Schlafziel</span>
                            <span className="font-semibold" style={{ color: colors.foreground }}>
                              {goal.fields.schlaf_ziel_stunden} h
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Meals */}
            <Card className="animate-in" style={{ animationDelay: '560ms' }}>
              <CardHeader>
                <CardTitle style={{ fontWeight: 700 }}>Today's Meals</CardTitle>
              </CardHeader>
              <CardContent>
                {todaysMeals.length === 0 ? (
                  <p className="text-sm" style={{ color: `${colors.foreground}80` }}>
                    Noch keine Mahlzeiten heute
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todaysMeals.map((meal) => (
                      <div
                        key={meal.record_id}
                        className="flex justify-between items-start p-2 rounded border"
                        style={{ borderColor: colors.border }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {meal.fields.mahlzeit_typ ? mealTypeLabels[meal.fields.mahlzeit_typ] : 'Mahlzeit'}
                          </div>
                          {meal.fields.beschreibung && (
                            <div className="text-xs mt-1" style={{ color: `${colors.foreground}80` }}>
                              {meal.fields.beschreibung}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm ml-2">
                          <div className="font-semibold">{meal.fields.kalorien || 0} kcal</div>
                          <div className="text-xs" style={{ color: colors.positive }}>
                            {meal.fields.protein || 0}g P
                          </div>
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
  );
}
