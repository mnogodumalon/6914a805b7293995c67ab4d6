import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Calendar,
  Dumbbell, Apple, Scale, Target, PlusCircle
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, subDays, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

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
        setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subDays(currentMonthStart, 1));
    const lastMonthEnd = endOfMonth(subDays(currentMonthStart, 1));
    const thirtyDaysAgo = subDays(now, 30);

    // Workouts this month
    const workoutsThisMonth = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
    }).length;

    const workoutsLastMonth = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    }).length;

    const workoutChange = workoutsThisMonth - workoutsLastMonth;

    // Calories today
    const caloriesToday = ernaehrung
      .filter(e => e.fields.datum === today)
      .reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);

    // Protein today
    const proteinToday = ernaehrung
      .filter(e => e.fields.datum === today)
      .reduce((sum, e) => sum + (e.fields.protein || 0), 0);

    // Current weight
    const sortedWeight = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''));
    const currentWeight = sortedWeight[0]?.fields.gewicht_kg;

    const weightThirtyDaysAgo = koerperdaten
      .filter(k => k.fields.gewicht_kg && k.fields.datum)
      .filter(k => {
        const date = parseISO(k.fields.datum!);
        return date < thirtyDaysAgo;
      })
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))[0]?.fields.gewicht_kg;

    const weightChange = currentWeight && weightThirtyDaysAgo ? currentWeight - weightThirtyDaysAgo : null;

    // Last workout
    const lastWorkout = workouts
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))[0];

    // Active goals
    const activeGoals = ziele.filter(z => z.fields.status === 'aktiv')[0];

    return {
      workoutsThisMonth,
      workoutChange,
      caloriesToday,
      proteinToday,
      currentWeight,
      weightChange,
      lastWorkout,
      activeGoals,
    };
  }, [workouts, ernaehrung, koerperdaten, ziele]);

  // Chart data for workouts (last 30 days)
  const workoutChartData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const filteredWorkouts = workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return date >= thirtyDaysAgo;
    });

    const grouped = new Map<string, { push: number; pull: number; beine: number; other: number }>();
    filteredWorkouts.forEach(w => {
      const date = w.fields.datum!.split('T')[0];
      const current = grouped.get(date) || { push: 0, pull: 0, beine: 0, other: 0 };

      if (w.fields.typ === 'push') current.push++;
      else if (w.fields.typ === 'pull') current.pull++;
      else if (w.fields.typ === 'beine') current.beine++;
      else current.other++;

      grouped.set(date, current);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [workouts]);

  // Chart data for nutrition (last 7 days)
  const nutritionChartData = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const grouped = new Map<string, { kalorien: number; protein: number }>();

    ernaehrung.forEach(e => {
      if (!e.fields.datum) return;
      const date = parseISO(e.fields.datum);
      if (date < sevenDaysAgo) return;

      const dateStr = e.fields.datum;
      const current = grouped.get(dateStr) || { kalorien: 0, protein: 0 };
      current.kalorien += e.fields.kalorien || 0;
      current.protein += e.fields.protein || 0;
      grouped.set(dateStr, current);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [ernaehrung]);

  // Chart data for body weight (last 30 days)
  const bodyWeightChartData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return koerperdaten
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .filter(k => parseISO(k.fields.datum!) >= thirtyDaysAgo)
      .map(k => ({
        date: k.fields.datum!,
        gewicht: k.fields.gewicht_kg!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [koerperdaten]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_20%_98%)] via-background to-[hsl(30_40%_96%)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>
            Fitness Dashboard
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'PPP', { locale: de })}
          </p>
        </div>

        {/* Desktop Layout: Hero + Quick Stats + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Hero KPI - Workouts This Month (spans 2 cols on desktop) */}
          <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Workouts This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-6">
                <div className="text-6xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                  {kpis.workoutsThisMonth}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  {kpis.workoutChange > 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">
                        +{kpis.workoutChange} vs letzten Monat
                      </span>
                    </>
                  ) : kpis.workoutChange < 0 ? (
                    <>
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <span className="text-lg font-semibold text-destructive">
                        {kpis.workoutChange} vs letzten Monat
                      </span>
                    </>
                  ) : (
                    <span className="text-lg text-muted-foreground">Gleich wie letzten Monat</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Primary Action (desktop) */}
          <div className="hidden lg:block">
            <AddWorkoutDialog />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Kalorien Heute"
            value={kpis.caloriesToday.toFixed(0)}
            subtitle={kpis.activeGoals?.fields.taeglich_kalorien
              ? `Ziel: ${kpis.activeGoals.fields.taeglich_kalorien} kcal`
              : undefined}
            icon={Apple}
            trend={kpis.activeGoals?.fields.taeglich_kalorien
              ? ((kpis.caloriesToday / kpis.activeGoals.fields.taeglich_kalorien) * 100).toFixed(0) + '%'
              : undefined}
          />
          <StatCard
            title="Protein Heute"
            value={`${kpis.proteinToday.toFixed(0)}g`}
            subtitle={kpis.activeGoals?.fields.taeglich_protein
              ? `Ziel: ${kpis.activeGoals.fields.taeglich_protein}g`
              : undefined}
            icon={Target}
            trend={kpis.activeGoals?.fields.taeglich_protein
              ? ((kpis.proteinToday / kpis.activeGoals.fields.taeglich_protein) * 100).toFixed(0) + '%'
              : undefined}
          />
          <StatCard
            title="Aktuelles Gewicht"
            value={kpis.currentWeight ? `${kpis.currentWeight.toFixed(1)} kg` : '-'}
            subtitle={kpis.weightChange
              ? `${kpis.weightChange > 0 ? '+' : ''}${kpis.weightChange.toFixed(1)} kg (30 Tage)`
              : undefined}
            icon={Scale}
          />
          <StatCard
            title="Letztes Workout"
            value={kpis.lastWorkout?.fields.typ
              ? kpis.lastWorkout.fields.typ.charAt(0).toUpperCase() + kpis.lastWorkout.fields.typ.slice(1)
              : 'Keine'}
            subtitle={kpis.lastWorkout?.fields.datum
              ? format(parseISO(kpis.lastWorkout.fields.datum), 'dd.MM.yyyy', { locale: de })
              : undefined}
            icon={Calendar}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Workout Performance Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Workout Performance (Letzte 30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {workoutChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(val) => format(parseISO(val), 'dd.MM', { locale: de })}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(val) => format(parseISO(val as string), 'dd.MM.yyyy', { locale: de })}
                      />
                      <Legend />
                      <Bar dataKey="push" stackId="a" fill="hsl(14 90% 53%)" name="Push" />
                      <Bar dataKey="pull" stackId="a" fill="hsl(142 71% 45%)" name="Pull" />
                      <Bar dataKey="beine" stackId="a" fill="hsl(30 85% 65%)" name="Beine" />
                      <Bar dataKey="other" stackId="a" fill="hsl(200 80% 55%)" name="Sonstiges" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState message="Keine Workouts in den letzten 30 Tagen" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition This Week Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Ernährung Diese Woche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {nutritionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={nutritionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(val) => format(parseISO(val), 'EEE', { locale: de })}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        label={{ value: 'Kalorien', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        label={{ value: 'Protein (g)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(val) => format(parseISO(val as string), 'dd.MM.yyyy', { locale: de })}
                      />
                      {kpis.activeGoals?.fields.taeglich_kalorien && (
                        <ReferenceLine
                          yAxisId="left"
                          y={kpis.activeGoals.fields.taeglich_kalorien}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="3 3"
                          label="Ziel"
                        />
                      )}
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="kalorien"
                        stroke="hsl(14 90% 53%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Kalorien"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="protein"
                        stroke="hsl(142 71% 45%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Protein (g)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState message="Keine Ernährungsdaten in den letzten 7 Tagen" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Body Weight Trend Chart (full width) */}
        <Card className="shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Körpergewicht Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {bodyWeightChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyWeightChartData}>
                    <defs>
                      <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(14 90% 53%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(14 90% 53%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(val) => format(parseISO(val), 'dd.MM', { locale: de })}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={['dataMin - 2', 'dataMax + 2']}
                      label={{ value: 'Gewicht (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(val) => format(parseISO(val as string), 'dd.MM.yyyy', { locale: de })}
                    />
                    <Area
                      type="monotone"
                      dataKey="gewicht"
                      stroke="hsl(14 90% 53%)"
                      strokeWidth={2}
                      fill="url(#colorGewicht)"
                      name="Gewicht (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Keine Gewichtsdaten in den letzten 30 Tagen" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts List */}
        <Card className="shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Letzte Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.filter(w => !w.fields.rest_day).slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {workouts
                  .filter(w => !w.fields.rest_day)
                  .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
                  .slice(0, 5)
                  .map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {workout.fields.typ
                              ? workout.fields.typ.charAt(0).toUpperCase() + workout.fields.typ.slice(1)
                              : 'Workout'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {workout.fields.datum && format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {workout.fields.dauer_minuten && (
                          <Badge variant="secondary">
                            {workout.fields.dauer_minuten} min
                          </Badge>
                        )}
                        {workout.fields.stimmung && (
                          <Badge
                            variant={
                              workout.fields.stimmung === 'brutal' ? 'default' :
                              workout.fields.stimmung === 'gut' ? 'secondary' :
                              'outline'
                            }
                          >
                            {workout.fields.stimmung === 'brutal' ? '🔥 Brutal' :
                             workout.fields.stimmung === 'gut' ? '👍 Gut' :
                             workout.fields.stimmung === 'okay' ? '👌 Okay' :
                             '😕 Schlecht'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="Keine Workouts vorhanden"
                description="Starte deine Fitness-Reise und logge dein erstes Workout!"
              />
            )}
          </CardContent>
        </Card>

        {/* Mobile Fixed Action Button */}
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <AddWorkoutDialog />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs font-semibold text-primary mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Add Workout Dialog Component
function AddWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ as any || undefined,
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung as any || undefined,
        rest_day: false,
      });

      setOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Fehler beim Erstellen des Workouts:', err);
      alert('Fehler beim Speichern des Workouts');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <PlusCircle className="mr-2 h-5 w-5" />
          Log Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Workout loggen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="typ">Trainingstyp</Label>
            <Select value={formData.typ} onValueChange={(val) => setFormData({ ...formData, typ: val })}>
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
          <div>
            <Label htmlFor="dauer">Dauer (Minuten)</Label>
            <Input
              id="dauer"
              type="number"
              value={formData.dauer_minuten}
              onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stimmung">Stimmung</Label>
            <Select value={formData.stimmung} onValueChange={(val) => setFormData({ ...formData, stimmung: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Wie war es?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brutal">🔥 Brutal</SelectItem>
                <SelectItem value="gut">👍 Gut</SelectItem>
                <SelectItem value="okay">👌 Okay</SelectItem>
                <SelectItem value="schlecht">😕 Schlecht</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Speichern...' : 'Workout Speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Fehler beim Laden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty State Component
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-medium mb-2">{title}</p>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// Empty Chart State Component
function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
