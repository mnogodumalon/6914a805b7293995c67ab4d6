import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths, isAfter, isBefore, parseISO } from 'date-fns';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [workoutsData, ernaehrungData, koerperdatenData, zieleData, logsData, uebungenData] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen(),
      ]);
      setWorkouts(workoutsData);
      setErnaehrung(ernaehrungData);
      setKoerperdaten(koerperdatenData);
      setZiele(zieleData);
      setWorkoutLogs(logsData);
      setUebungen(uebungenData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Helper functions
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = endOfMonth(subMonths(today, 1));
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const activeGoal = ziele.find(z => z.fields.status === 'aktiv');

  // KPI Calculations
  const currentMonthWorkouts = workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    const date = parseISO(w.fields.datum);
    return isAfter(date, currentMonthStart) && isBefore(date, currentMonthEnd);
  });

  const previousMonthWorkouts = workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    const date = parseISO(w.fields.datum);
    return isAfter(date, previousMonthStart) && isBefore(date, previousMonthEnd);
  });

  const totalWorkoutsThisMonth = currentMonthWorkouts.length;
  const totalWorkoutsLastMonth = previousMonthWorkouts.length;
  const workoutsTrend = totalWorkoutsLastMonth > 0
    ? ((totalWorkoutsThisMonth - totalWorkoutsLastMonth) / totalWorkoutsLastMonth * 100).toFixed(0)
    : '0';

  const avgWorkoutDuration = currentMonthWorkouts.length > 0
    ? Math.round(currentMonthWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) / currentMonthWorkouts.length)
    : 0;

  const previousMonthAvgDuration = previousMonthWorkouts.length > 0
    ? Math.round(previousMonthWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) / previousMonthWorkouts.length)
    : 0;

  const durationTrend = previousMonthAvgDuration > 0
    ? ((avgWorkoutDuration - previousMonthAvgDuration) / previousMonthAvgDuration * 100).toFixed(0)
    : '0';

  const todayNutrition = ernaehrung.filter(e => e.fields.datum === todayStr);
  const caloriesToday = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const proteinToday = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  const calorieGoal = activeGoal?.fields.taeglich_kalorien || 2000;
  const proteinGoal = activeGoal?.fields.taeglich_protein || 150;
  const calorieProgress = Math.min((caloriesToday / calorieGoal) * 100, 100);
  const proteinProgress = Math.min((proteinToday / proteinGoal) * 100, 100);

  const sortedBodyData = [...koerperdaten].sort((a, b) => {
    const dateA = a.fields.datum ? parseISO(a.fields.datum) : new Date(0);
    const dateB = b.fields.datum ? parseISO(b.fields.datum) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const currentWeight = sortedBodyData[0]?.fields.gewicht_kg || 0;
  const weight30DaysAgo = sortedBodyData.find(k => {
    if (!k.fields.datum) return false;
    const date = parseISO(k.fields.datum);
    return isBefore(date, subDays(today, 30));
  })?.fields.gewicht_kg || currentWeight;

  const weightChange = currentWeight - weight30DaysAgo;
  const weightTrend = weightChange.toFixed(1);

  const weeklyWorkouts = workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    const date = parseISO(w.fields.datum);
    return isAfter(date, currentWeekStart) && isBefore(date, currentWeekEnd);
  });

  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche || 4;
  const weeklyProgress = Math.min((weeklyWorkouts.length / weeklyGoal) * 100, 100);

  // Chart data: Workout Frequency (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const workoutFrequencyData = last30Days.map(date => {
    const dayWorkouts = workouts.filter(w => w.fields.datum === date && !w.fields.rest_day);
    return {
      date: format(parseISO(date), 'dd.MM'),
      count: dayWorkouts.length,
    };
  });

  // Chart data: Workout Duration Trend (last 30 days)
  const workoutDurationData = workouts
    .filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isAfter(date, subDays(today, 30));
    })
    .sort((a, b) => {
      const dateA = a.fields.datum ? parseISO(a.fields.datum) : new Date(0);
      const dateB = b.fields.datum ? parseISO(b.fields.datum) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    })
    .map(w => ({
      date: format(parseISO(w.fields.datum!), 'dd.MM'),
      duration: w.fields.dauer_minuten || 0,
    }));

  const avgDuration = workoutDurationData.length > 0
    ? workoutDurationData.reduce((sum, d) => sum + d.duration, 0) / workoutDurationData.length
    : 0;

  // Chart data: Workout Type Distribution (last 30 days)
  const workoutTypeMap: Record<string, number> = {};
  const typeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    beine: 'Beine',
    ganzkoerper: 'Ganzkörper',
    oberkoerper: 'Oberkörper',
    unterkoerper: 'Unterkörper',
    cardio: 'Cardio',
    sonstiges: 'Sonstiges',
  };

  workouts
    .filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isAfter(date, subDays(today, 30));
    })
    .forEach(w => {
      const typ = w.fields.typ || 'sonstiges';
      workoutTypeMap[typ] = (workoutTypeMap[typ] || 0) + 1;
    });

  const workoutTypeData = Object.entries(workoutTypeMap).map(([key, value]) => ({
    name: typeLabels[key] || key,
    value,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Chart data: Weekly Nutrition (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const nutritionWeeklyData = last7Days.map(date => {
    const dayNutrition = ernaehrung.filter(e => e.fields.datum === date);
    const totalCalories = dayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    return {
      date: format(parseISO(date), 'dd.MM'),
      calories: totalCalories,
      goal: calorieGoal,
    };
  });

  // Chart data: Today's Macros
  const totalCarbs = todayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
  const totalFett = todayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

  const macrosData = [
    { name: 'Protein', value: Math.round(proteinToday) },
    { name: 'Carbs', value: Math.round(totalCarbs) },
    { name: 'Fett', value: Math.round(totalFett) },
  ];

  // Chart data: Weight Progress (last 90 days)
  const weightProgressData = koerperdaten
    .filter(k => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      return isAfter(date, subDays(today, 90));
    })
    .sort((a, b) => {
      const dateA = a.fields.datum ? parseISO(a.fields.datum) : new Date(0);
      const dateB = b.fields.datum ? parseISO(b.fields.datum) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    })
    .map(k => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM'),
      weight: k.fields.gewicht_kg || 0,
    }));

  // Chart data: Body Measurements (last 90 days)
  const bodyMeasurementsData = koerperdaten
    .filter(k => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      return isAfter(date, subDays(today, 90));
    })
    .sort((a, b) => {
      const dateA = a.fields.datum ? parseISO(a.fields.datum) : new Date(0);
      const dateB = b.fields.datum ? parseISO(b.fields.datum) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    })
    .map(k => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM'),
      brust: k.fields.brustumfang || 0,
      taille: k.fields.taillenumfang || 0,
      arm: k.fields.armumfang || 0,
    }));

  // Chart data: Workout Mood Distribution (last 30 days)
  const moodMap: Record<string, number> = {};
  const moodLabels: Record<string, string> = {
    schlecht: 'Schlecht',
    okay: 'Okay',
    gut: 'Gut',
    brutal: 'Brutal',
  };

  workouts
    .filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isAfter(date, subDays(today, 30));
    })
    .forEach(w => {
      const stimmung = w.fields.stimmung || 'okay';
      moodMap[stimmung] = (moodMap[stimmung] || 0) + 1;
    });

  const moodData = Object.entries(moodMap).map(([key, value]) => ({
    name: moodLabels[key] || key,
    value,
  }));

  // Chart data: Exercise Progress (top 3 exercises by frequency, last 60 days)
  const exerciseFrequency: Record<string, number> = {};
  workoutLogs.forEach(log => {
    const exerciseId = extractRecordId(log.fields.uebung);
    if (exerciseId) {
      exerciseFrequency[exerciseId] = (exerciseFrequency[exerciseId] || 0) + 1;
    }
  });

  const topExerciseIds = Object.entries(exerciseFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  const exerciseProgressMap: Record<string, Array<{ date: string; weight: number }>> = {};

  workoutLogs
    .filter(log => {
      const exerciseId = extractRecordId(log.fields.uebung);
      if (!exerciseId || !topExerciseIds.includes(exerciseId)) return false;
      const workoutId = extractRecordId(log.fields.workout);
      if (!workoutId) return false;
      const workout = workouts.find(w => w.record_id === workoutId);
      if (!workout?.fields.datum) return false;
      const date = parseISO(workout.fields.datum);
      return isAfter(date, subDays(today, 60));
    })
    .forEach(log => {
      const exerciseId = extractRecordId(log.fields.uebung);
      const workoutId = extractRecordId(log.fields.workout);
      if (!exerciseId || !workoutId) return;
      const workout = workouts.find(w => w.record_id === workoutId);
      if (!workout?.fields.datum) return;

      if (!exerciseProgressMap[exerciseId]) {
        exerciseProgressMap[exerciseId] = [];
      }

      exerciseProgressMap[exerciseId].push({
        date: workout.fields.datum,
        weight: log.fields.gewicht || 0,
      });
    });

  const exerciseProgressData: Array<{ date: string; [key: string]: number | string }> = [];
  const allDates = new Set<string>();

  Object.values(exerciseProgressMap).forEach(logs => {
    logs.forEach(log => allDates.add(log.date));
  });

  Array.from(allDates)
    .sort()
    .forEach(date => {
      const dataPoint: { date: string; [key: string]: number | string } = {
        date: format(parseISO(date), 'dd.MM'),
      };

      topExerciseIds.forEach(exerciseId => {
        const exercise = uebungen.find(u => u.record_id === exerciseId);
        const exerciseName = exercise?.fields.name || exerciseId.slice(0, 8);
        const logsForDate = exerciseProgressMap[exerciseId]?.filter(l => l.date === date) || [];
        const maxWeight = Math.max(...logsForDate.map(l => l.weight), 0);
        dataPoint[exerciseName] = maxWeight;
      });

      exerciseProgressData.push(dataPoint);
    });

  const exerciseNames = topExerciseIds.map(id => {
    const exercise = uebungen.find(u => u.record_id === id);
    return exercise?.fields.name || id.slice(0, 8);
  });

  const chartConfig = {
    workouts: { label: 'Workouts', color: 'hsl(var(--chart-1))' },
    duration: { label: 'Minuten', color: 'hsl(var(--chart-2))' },
    calories: { label: 'Kalorien', color: 'hsl(var(--chart-3))' },
    goal: { label: 'Ziel', color: 'hsl(var(--chart-5))' },
    weight: { label: 'Gewicht (kg)', color: 'hsl(var(--chart-1))' },
    protein: { label: 'Protein (g)', color: 'hsl(var(--chart-2))' },
    carbs: { label: 'Carbs (g)', color: 'hsl(var(--chart-3))' },
    fett: { label: 'Fett (g)', color: 'hsl(var(--chart-4))' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Fitness & Ernährungs-Tracker</h1>
          <p className="text-muted-foreground mt-2">Deine persönliche Übersicht über Training, Ernährung und Fortschritt</p>
        </div>

        {/* KPI Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Workouts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalWorkoutsThisMonth}</div>
              <p className="text-muted-foreground text-xs mt-1">
                {Number(workoutsTrend) >= 0 ? '+' : ''}{workoutsTrend}% vs. letzter Monat
              </p>
            </CardContent>
          </Card>

          {/* Avg Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgWorkoutDuration} <span className="text-xl text-muted-foreground">min</span></div>
              <p className="text-muted-foreground text-xs mt-1">
                {Number(durationTrend) >= 0 ? '+' : ''}{durationTrend}% vs. letzter Monat
              </p>
            </CardContent>
          </Card>

          {/* Calories Today */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Calories Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(caloriesToday)} <span className="text-xl text-muted-foreground">kcal</span></div>
              <Progress value={calorieProgress} className="mt-2" />
              <p className="text-muted-foreground text-xs mt-1">{Math.round(calorieProgress)}% von {calorieGoal} kcal Ziel</p>
            </CardContent>
          </Card>

          {/* Protein Today */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Protein Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(proteinToday)} <span className="text-xl text-muted-foreground">g</span></div>
              <Progress value={proteinProgress} className="mt-2" />
              <p className="text-muted-foreground text-xs mt-1">{Math.round(proteinProgress)}% von {proteinGoal} g Ziel</p>
            </CardContent>
          </Card>

          {/* Current Weight */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{currentWeight.toFixed(1)} <span className="text-xl text-muted-foreground">kg</span></div>
              <p className="text-muted-foreground text-xs mt-1">
                {Number(weightTrend) >= 0 ? '+' : ''}{weightTrend} kg (30 Tage)
              </p>
            </CardContent>
          </Card>

          {/* Weekly Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{weeklyWorkouts.length}/{weeklyGoal}</div>
              <Progress value={weeklyProgress} className="mt-2" />
              <p className="text-muted-foreground text-xs mt-1">{Math.round(weeklyProgress)}% dieser Woche</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Workout Frequency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={workoutFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Workouts" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Weekly Nutrition Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Nutrition Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={nutritionWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="calories" fill="hsl(var(--chart-3))" stroke="hsl(var(--chart-3))" name="Kalorien" />
                  <Line type="monotone" dataKey="goal" stroke="hsl(var(--chart-5))" strokeDasharray="5 5" name="Ziel" dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Weight Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={weightProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--chart-1))" name="Gewicht (kg)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Workout Duration Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Duration Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={workoutDurationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="duration" stroke="hsl(var(--chart-2))" name="Minuten" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Workout Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Training Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie data={workoutTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {workoutTypeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Today's Macros */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Macros</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={macrosData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" name="Gramm" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Exercise Progress Chart */}
          {exerciseProgressData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Exercise Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={exerciseProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {exerciseNames.map((name, index) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[index % COLORS.length]}
                        name={name}
                        strokeWidth={2}
                      />
                    ))}
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {moodData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Body Measurements Chart - Full Width */}
        {bodyMeasurementsData.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Body Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={bodyMeasurementsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="brust" stroke="hsl(var(--chart-1))" name="Brust (cm)" strokeWidth={2} />
                    <Line type="monotone" dataKey="taille" stroke="hsl(var(--chart-2))" name="Taille (cm)" strokeWidth={2} />
                    <Line type="monotone" dataKey="arm" stroke="hsl(var(--chart-3))" name="Arm (cm)" strokeWidth={2} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
