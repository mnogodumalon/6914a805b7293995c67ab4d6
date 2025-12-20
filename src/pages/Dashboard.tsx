import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Dumbbell, Flame, Apple, TrendingUp, Target, Activity,
  PlusCircle, Calendar, Award
} from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isToday, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [workoutsData, ernaehrungData, koerperdatenData, zieleData, logsData] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
          LivingAppsService.getWorkoutLogs(),
        ]);
        setWorkouts(workoutsData);
        setErnaehrung(ernaehrungData);
        setKoerperdaten(koerperdatenData);
        setZiele(zieleData);
        setWorkoutLogs(logsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Active goal
    const activeGoal = ziele.find(z => z.fields.status === 'aktiv');

    // Workouts this week
    const weekWorkouts = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return date >= weekStart && date <= weekEnd && !w.fields.rest_day;
    });

    // Today's nutrition
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayNutrition = ernaehrung.filter(e => e.fields.datum?.startsWith(todayStr));
    const todayCalories = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    const todayProtein = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

    // Current weight & trend
    const sortedWeight = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg)
      .sort((a, b) => {
        const dateA = a.fields.datum ? parseISO(a.fields.datum).getTime() : 0;
        const dateB = b.fields.datum ? parseISO(b.fields.datum).getTime() : 0;
        return dateB - dateA;
      });
    const currentWeight = sortedWeight[0]?.fields.gewicht_kg;
    const previousWeight = sortedWeight[1]?.fields.gewicht_kg;
    const weightTrend = currentWeight && previousWeight ? currentWeight - previousWeight : 0;

    // Total sets this week
    const weekWorkoutIds = new Set(weekWorkouts.map(w => w.record_id));
    const weekLogs = workoutLogs.filter(log => {
      const workoutUrl = log.fields.workout;
      if (!workoutUrl) return false;
      const match = workoutUrl.match(/([a-f0-9]{24})$/i);
      return match && weekWorkoutIds.has(match[1]);
    });
    const totalSets = weekLogs.length;

    // Goal progress (example: training days per week)
    const goalTrainingDays = activeGoal?.fields.trainingstage_pro_woche || 0;
    const actualTrainingDays = weekWorkouts.length;
    const goalProgress = goalTrainingDays > 0 ? (actualTrainingDays / goalTrainingDays) * 100 : 0;

    return {
      weeklyWorkouts: actualTrainingDays,
      todayCalories,
      calorieGoal: activeGoal?.fields.taeglich_kalorien || 2500,
      todayProtein,
      proteinGoal: activeGoal?.fields.taeglich_protein || 150,
      currentWeight: currentWeight || 0,
      weightTrend,
      goalProgress: Math.min(goalProgress, 100),
      totalSets,
      avgWorkoutDuration: weekWorkouts.length > 0
        ? weekWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) / weekWorkouts.length
        : 0,
    };
  }, [workouts, ernaehrung, koerperdaten, ziele, workoutLogs]);

  // Chart data
  const last7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayWorkouts = workouts.filter(w => w.fields.datum?.startsWith(dateStr) && !w.fields.rest_day);
      const dayNutrition = ernaehrung.filter(e => e.fields.datum?.startsWith(dateStr));

      data.push({
        date: format(date, 'EEE', { locale: de }),
        workouts: dayWorkouts.length,
        kalorien: dayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0),
        protein: dayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0),
        carbs: dayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0),
        fett: dayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0),
      });
    }
    return data;
  }, [workouts, ernaehrung]);

  const weightData = useMemo(() => {
    return [...koerperdaten]
      .filter(k => k.fields.gewicht_kg && k.fields.datum)
      .sort((a, b) => {
        const dateA = a.fields.datum ? parseISO(a.fields.datum).getTime() : 0;
        const dateB = b.fields.datum ? parseISO(b.fields.datum).getTime() : 0;
        return dateA - dateB;
      })
      .slice(-30)
      .map(k => ({
        datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
      }));
  }, [koerperdaten]);

  const macrosData = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayNutrition = ernaehrung.filter(e => e.fields.datum?.startsWith(today));

    const protein = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
    const carbs = todayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
    const fett = todayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

    return [
      { name: 'Protein', value: protein, color: '#22C55E' },
      { name: 'Carbs', value: carbs, color: '#3B82F6' },
      { name: 'Fett', value: fett, color: '#FBBF24' },
    ].filter(item => item.value > 0);
  }, [ernaehrung]);

  const muscleGroupData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekWorkouts = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return date >= weekStart && date <= weekEnd;
    });

    const counts: Record<string, number> = {};

    weekWorkouts.forEach(w => {
      const typ = w.fields.typ || 'sonstiges';
      counts[typ] = (counts[typ] || 0) + 1;
    });

    const colors: Record<string, string> = {
      push: '#FF4500',
      pull: '#3B82F6',
      beine: '#22C55E',
      ganzkoerper: '#8B5CF6',
      cardio: '#EC4899',
      oberkoerper: '#F59E0B',
      unterkoerper: '#14B8A6',
      sonstiges: '#737373',
    };

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name] || '#737373',
    }));
  }, [workouts]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Sticky Stats Bar */}
      <section
        className="sticky top-0 z-50 py-6 px-6 border-b animate-fade-in-up"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'rgba(255, 69, 0, 0.15)'
        }}
      >
        <div className="container mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatsMetric
              icon={<Dumbbell className="h-5 w-5" />}
              label="Workouts diese Woche"
              value={metrics.weeklyWorkouts}
              color="var(--color-primary-500)"
            />
            <StatsMetric
              icon={<Flame className="h-5 w-5" />}
              label="Kalorien heute"
              value={`${metrics.todayCalories} / ${metrics.calorieGoal}`}
              subtext="kcal"
              color="var(--color-accent-main)"
              progress={(metrics.todayCalories / metrics.calorieGoal) * 100}
            />
            <StatsMetric
              icon={<Apple className="h-5 w-5" />}
              label="Protein heute"
              value={`${metrics.todayProtein} / ${metrics.proteinGoal}`}
              subtext="g"
              color="var(--color-secondary-500)"
              progress={(metrics.todayProtein / metrics.proteinGoal) * 100}
            />
            <StatsMetric
              icon={<TrendingUp className="h-5 w-5" />}
              label="Aktuelles Gewicht"
              value={metrics.currentWeight.toFixed(1)}
              subtext="kg"
              trend={metrics.weightTrend}
              color="var(--color-accent-main)"
            />
            <StatsMetric
              icon={<Target className="h-5 w-5" />}
              label="Zielfortschritt"
              value={`${metrics.goalProgress.toFixed(0)}%`}
              color="var(--color-success)"
              progress={metrics.goalProgress}
            />
          </div>
        </div>
      </section>

      {/* KPI Cards Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Training Volume */}
            <Card
              className="animate-fade-in-up animate-delay-1 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 69, 0, 0.15)',
                borderRadius: 'var(--card-radius)'
              }}
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Dumbbell className="h-6 w-6" style={{ color: 'var(--color-primary-500)' }} />
                  Wöchentliches Trainingsvolumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-mono text-5xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
                    {metrics.totalSets}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sätze</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Gesamtzeit</p>
                    <p className="font-mono text-lg font-bold">{Math.round(metrics.avgWorkoutDuration * metrics.weeklyWorkouts)} min</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Workouts</p>
                    <p className="font-mono text-lg font-bold">{metrics.weeklyWorkouts}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={last7DaysData}>
                    <Bar
                      dataKey="workouts"
                      fill="var(--color-primary-500)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Nutrition Today */}
            <Card
              className="animate-fade-in-up animate-delay-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 69, 0, 0.15)',
                borderRadius: 'var(--card-radius)'
              }}
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Apple className="h-6 w-6" style={{ color: 'var(--color-secondary-500)' }} />
                  Ernährung heute
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-mono text-5xl font-bold" style={{ color: 'var(--color-accent-main)' }}>
                    {metrics.todayCalories}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    / {metrics.calorieGoal} kcal
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Protein</p>
                    <p className="font-mono font-bold" style={{ color: 'var(--color-secondary-500)' }}>
                      {metrics.todayProtein}g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Carbs</p>
                    <p className="font-mono font-bold" style={{ color: 'var(--color-info)' }}>
                      {last7DaysData[6]?.carbs || 0}g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Fett</p>
                    <p className="font-mono font-bold" style={{ color: 'var(--color-accent-main)' }}>
                      {last7DaysData[6]?.fett || 0}g
                    </p>
                  </div>
                </div>
                {macrosData.length > 0 && (
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={macrosData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macrosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Body Progress */}
            <Card
              className="animate-fade-in-up animate-delay-3 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 69, 0, 0.15)',
                borderRadius: 'var(--card-radius)'
              }}
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Activity className="h-6 w-6" style={{ color: 'var(--color-accent-main)' }} />
                  Körperfortschritt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-mono text-5xl font-bold" style={{ color: 'var(--color-accent-main)' }}>
                    {metrics.currentWeight > 0 ? metrics.currentWeight.toFixed(1) : '--'}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>kg</p>
                    {metrics.weightTrend !== 0 && (
                      <span
                        className="text-xs font-mono"
                        style={{ color: metrics.weightTrend > 0 ? 'var(--color-success)' : 'var(--color-error)' }}
                      >
                        {metrics.weightTrend > 0 ? '+' : ''}{metrics.weightTrend.toFixed(1)} kg
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Messungen</p>
                    <p className="font-mono text-lg font-bold">{koerperdaten.length}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Letzte</p>
                    <p className="font-mono text-lg font-bold">
                      {koerperdaten[0]?.fields.datum
                        ? format(parseISO(koerperdaten[0].fields.datum), 'dd.MM', { locale: de })
                        : '--'}
                    </p>
                  </div>
                </div>
                {weightData.length > 0 && (
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={weightData}>
                      <Line
                        type="monotone"
                        dataKey="gewicht"
                        stroke="var(--color-accent-main)"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-8 px-6">
        <div className="container mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Nutrition Timeline */}
              <Card
                className="animate-fade-in-up animate-delay-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                  border: '1px solid rgba(255, 69, 0, 0.15)',
                  borderRadius: 'var(--card-radius)'
                }}
              >
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Kalorien & Makros (7 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={last7DaysData}>
                      <defs>
                        <linearGradient id="colorKalorien" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="var(--chart-grid)"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                      />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(31, 31, 31, 0.98)',
                          border: '1px solid rgba(255, 69, 0, 0.3)',
                          borderRadius: '0.5rem',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="kalorien"
                        stroke="var(--color-primary-500)"
                        fill="url(#colorKalorien)"
                        strokeWidth={3}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weight Progression */}
              {weightData.length > 0 && (
                <Card
                  className="animate-fade-in-up animate-delay-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                    border: '1px solid rgba(255, 69, 0, 0.15)',
                    borderRadius: 'var(--card-radius)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Gewichtsentwicklung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weightData}>
                        <defs>
                          <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-accent-main)" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="var(--color-accent-main)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="var(--chart-grid)"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="datum"
                          stroke="var(--color-text-secondary)"
                          style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                        />
                        <YAxis
                          stroke="var(--color-text-secondary)"
                          style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                          domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(31, 31, 31, 0.98)',
                            border: '1px solid rgba(255, 69, 0, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="gewicht"
                          stroke="var(--color-accent-main)"
                          fill="url(#colorGewicht)"
                          strokeWidth={3}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Muscle Group Distribution */}
              {muscleGroupData.length > 0 && (
                <Card
                  className="animate-fade-in-up animate-delay-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                    border: '1px solid rgba(255, 69, 0, 0.15)',
                    borderRadius: 'var(--card-radius)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Training diese Woche</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={muscleGroupData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {muscleGroupData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(31, 31, 31, 0.98)',
                            border: '1px solid rgba(255, 69, 0, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {muscleGroupData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card
                className="animate-fade-in-up animate-delay-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(31, 31, 31, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
                  border: '1px solid rgba(255, 69, 0, 0.15)',
                  borderRadius: 'var(--card-radius)'
                }}
              >
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: 'var(--color-accent-main)' }} />
                    Statistiken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Gesamt Workouts</p>
                    <p className="font-mono text-3xl font-bold">{workouts.filter(w => !w.fields.rest_day).length}</p>
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ernährungseinträge</p>
                    <p className="font-mono text-3xl font-bold">{ernaehrung.length}</p>
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Körpermessungen</p>
                    <p className="font-mono text-3xl font-bold">{koerperdaten.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-8 right-8 rounded-full h-16 w-16 p-0 shadow-2xl transition-all duration-200 hover:scale-110 hover:rotate-90"
        style={{
          background: 'linear-gradient(135deg, #FF4500 0%, #C72A00 100%)',
          boxShadow: '0 8px 24px rgba(255, 69, 0, 0.5)'
        }}
      >
        <PlusCircle className="h-8 w-8" />
      </Button>
    </div>
  );
}

// Stats Metric Component
interface StatsMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  trend?: number;
  progress?: number;
}

function StatsMetric({ icon, label, value, subtext, color, trend, progress }: StatsMetricProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="font-mono font-bold text-lg" style={{ color }}>
            {value}
          </p>
          {subtext && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {subtext}
            </span>
          )}
          {trend !== undefined && trend !== 0 && (
            <span
              className="text-xs font-mono ml-1"
              style={{ color: trend > 0 ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          )}
        </div>
        {progress !== undefined && (
          <div
            className="h-1 rounded-full mt-1 overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="sticky top-0 z-50 py-6 px-6 border-b" style={{ background: 'var(--color-surface)' }}>
        <div className="container mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 skeleton-shimmer" />
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 px-6">
        <div className="container mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96 skeleton-shimmer" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
