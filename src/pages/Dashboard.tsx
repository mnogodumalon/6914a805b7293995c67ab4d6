import { useState, useEffect, useMemo } from 'react';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dumbbell,
  Flame,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Plus
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // KPI Calculations
  const kpis = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(weekStart, 7);
    const lastWeekEnd = subDays(weekEnd, 7);

    // This week workouts
    const thisWeekWorkouts = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });

    // Last week workouts
    const lastWeekWorkouts = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
    });

    // Today calories
    const todayMeals = ernaehrung.filter(e => e.fields.datum === todayStr);
    const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.fields.kalorien || 0), 0);

    // Active goal
    const activeGoal = ziele.find(z => z.fields.status === 'aktiv');
    const goalCalories = activeGoal?.fields.taeglich_kalorien || 2000;

    // Latest weight
    const sortedWeights = [...koerperdaten]
      .filter(k => k.fields.gewicht_kg != null)
      .sort((a, b) => {
        const dateA = a.fields.datum || a.createdat;
        const dateB = b.fields.datum || b.createdat;
        return dateB.localeCompare(dateA);
      });
    const latestWeight = sortedWeights[0]?.fields.gewicht_kg;
    const lastMonthWeight = sortedWeights.find((_k, i) => i > 0)?.fields.gewicht_kg;
    const weightChange = latestWeight && lastMonthWeight
      ? ((latestWeight - lastMonthWeight) / lastMonthWeight) * 100
      : null;

    // Workout streak
    const sortedWorkouts = [...workouts]
      .filter(w => w.fields.datum && !w.fields.rest_day)
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''));

    let streak = 0;
    let currentDate = new Date();
    for (const workout of sortedWorkouts) {
      if (!workout.fields.datum) continue;
      const workoutDate = parseISO(workout.fields.datum);
      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= streak + 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return {
      thisWeek: thisWeekWorkouts.length,
      lastWeek: lastWeekWorkouts.length,
      weeklyTrend: lastWeekWorkouts.length > 0
        ? ((thisWeekWorkouts.length - lastWeekWorkouts.length) / lastWeekWorkouts.length) * 100
        : null,
      todayCalories,
      goalCalories,
      caloriesPercent: (todayCalories / goalCalories) * 100,
      latestWeight,
      weightChange,
      streak,
    };
  }, [workouts, ernaehrung, koerperdaten, ziele]);

  // Chart data for weight progress
  const weightChartData = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    return koerperdaten
      .filter(k => {
        if (!k.fields.datum) return false;
        const date = parseISO(k.fields.datum);
        return date >= last30Days;
      })
      .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
      .map(k => ({
        datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg || 0,
        kfa: k.fields.kfa_geschaetzt || 0,
      }));
  }, [koerperdaten]);

  // Chart data for workout types
  const workoutTypeData = useMemo(() => {
    const last7Days = subDays(new Date(), 7);
    const recentWorkouts = workouts.filter(w => {
      if (!w.fields.datum) return false;
      const date = parseISO(w.fields.datum);
      return date >= last7Days;
    });

    const typeCounts: Record<string, number> = {};
    recentWorkouts.forEach(w => {
      const typ = w.fields.typ || 'sonstiges';
      typeCounts[typ] = (typeCounts[typ] || 0) + 1;
    });

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

    return Object.entries(typeCounts).map(([typ, count]) => ({
      typ: typeLabels[typ] || typ,
      count,
    }));
  }, [workouts]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
      .slice(0, 5);
  }, [workouts]);

  // Active goals
  const activeGoals = useMemo(() => {
    return ziele.filter(z => z.fields.status === 'aktiv').slice(0, 3);
  }, [ziele]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(180deg, hsl(220 20% 8%) 0%, hsl(220 25% 6%) 100%)',
      backgroundImage: 'radial-gradient(circle at 20% 10%, hsla(26, 90%, 58%, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsla(165, 75%, 52%, 0.06) 0%, transparent 50%)'
    }}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Fitness Dashboard
          </h1>
          <p className="text-muted-foreground">Dein Fortschritt auf einen Blick</p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <KPICard
            title="Diese Woche"
            description="Trainingseinheiten"
            value={kpis.thisWeek}
            icon={Dumbbell}
            trend={kpis.weeklyTrend}
            delay={0}
          />
          <KPICard
            title="Heute"
            description="Kalorien / Ziel"
            value={`${Math.round(kpis.todayCalories)} / ${kpis.goalCalories}`}
            icon={Flame}
            trend={kpis.caloriesPercent - 100}
            delay={80}
            subtitle={`${Math.round(kpis.caloriesPercent)}%`}
          />
          <KPICard
            title="Aktuell"
            description="Körpergewicht"
            value={kpis.latestWeight ? `${kpis.latestWeight.toFixed(1)} kg` : '-'}
            icon={Scale}
            trend={kpis.weightChange}
            delay={160}
          />
          <KPICard
            title="Streak"
            description="Tage Training"
            value={kpis.streak}
            icon={TrendingUp}
            delay={240}
          />
        </div>

        {/* Main Chart */}
        {weightChartData.length > 0 && (
          <Card className="mb-6 animate-fade-in" style={{ animationDelay: '320ms' }}>
            <CardHeader>
              <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[300px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightChartData}>
                    <defs>
                      <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(26 90% 58%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(26 90% 58%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                    <XAxis
                      dataKey="datum"
                      tick={{ fontSize: 12, fill: 'hsl(220 10% 70%)' }}
                      stroke="hsl(220 15% 18%)"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: 'hsl(220 10% 70%)' }}
                      stroke="hsl(220 15% 18%)"
                      label={{ value: 'Gewicht (kg)', angle: -90, position: 'insideLeft', fill: 'hsl(220 10% 70%)' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: 'hsl(220 10% 70%)' }}
                      stroke="hsl(220 15% 18%)"
                      label={{ value: 'KFA (%)', angle: 90, position: 'insideRight', fill: 'hsl(220 10% 70%)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(220 20% 12%)',
                        border: '1px solid hsl(220 15% 18%)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="gewicht"
                      stroke="hsl(26 90% 58%)"
                      strokeWidth={2}
                      fill="url(#colorGewicht)"
                    />
                    {weightChartData.some(d => d.kfa > 0) && (
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="kfa"
                        stroke="hsl(165 75% 52%)"
                        strokeWidth={2}
                        fill="none"
                        strokeDasharray="5 5"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Types Chart */}
          {workoutTypeData.length > 0 && (
            <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle>Training nach Typ (7 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                      <XAxis
                        dataKey="typ"
                        tick={{ fontSize: 12, fill: 'hsl(220 10% 70%)' }}
                        stroke="hsl(220 15% 18%)"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(220 10% 70%)' }}
                        stroke="hsl(220 15% 18%)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(220 20% 12%)',
                          border: '1px solid hsl(220 15% 18%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(26 90% 58%)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Workouts */}
          <Card className="animate-fade-in" style={{ animationDelay: '480ms' }}>
            <CardHeader>
              <CardTitle>Letzte Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Keine Workouts vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {workout.fields.typ ? workout.fields.typ.charAt(0).toUpperCase() + workout.fields.typ.slice(1) : 'Workout'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {workout.fields.datum && format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workout.fields.dauer_minuten && (
                          <Badge variant="outline">{workout.fields.dauer_minuten} min</Badge>
                        )}
                        {workout.fields.stimmung && (
                          <Badge
                            variant={workout.fields.stimmung === 'brutal' ? 'default' : 'secondary'}
                          >
                            {workout.fields.stimmung}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <Card className="mt-6 animate-fade-in" style={{ animationDelay: '560ms' }}>
            <CardHeader>
              <CardTitle>Aktive Ziele</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeGoals.map((ziel) => (
                  <div key={ziel.record_id} className="p-4 rounded-lg border bg-card">
                    {ziel.fields.taeglich_kalorien && (
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">Tägl. Kalorien</p>
                        <p className="text-2xl font-bold">{ziel.fields.taeglich_kalorien} kcal</p>
                      </div>
                    )}
                    {ziel.fields.taeglich_protein && (
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">Tägl. Protein</p>
                        <p className="text-2xl font-bold">{ziel.fields.taeglich_protein} g</p>
                      </div>
                    )}
                    {ziel.fields.trainingstage_pro_woche && (
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">Trainingstage/Woche</p>
                        <p className="text-2xl font-bold">{ziel.fields.trainingstage_pro_woche}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: 'hsl(26 90% 58%)', color: 'white' }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workout loggen</DialogTitle>
          </DialogHeader>
          <QuickLogForm onSuccess={() => {
            setDialogOpen(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({
  title,
  description,
  value,
  icon: Icon,
  trend,
  delay,
  subtitle
}: {
  title: string;
  description: string;
  value: string | number;
  icon: any;
  trend?: number | null;
  delay: number;
  subtitle?: string;
}) {
  return (
    <Card
      className="relative overflow-hidden hover:shadow-md transition-all animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground/70">{description}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: 'hsl(220 20% 12%)' }}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'hsl(26 90% 58%)' }} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend != null && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : null}
            <p className={`text-xs sm:text-sm ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLogForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.datum || !formData.typ) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ as any,
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung as any || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
        <Select value={formData.typ} onValueChange={(v) => setFormData({ ...formData, typ: v })}>
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
          placeholder="60"
        />
      </div>
      <div>
        <Label htmlFor="stimmung">Stimmung</Label>
        <Select value={formData.stimmung} onValueChange={(v) => setFormData({ ...formData, stimmung: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Wie war's?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schlecht">Schlecht</SelectItem>
            <SelectItem value="okay">Okay</SelectItem>
            <SelectItem value="gut">Gut</SelectItem>
            <SelectItem value="brutal">Brutal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Wird gespeichert...' : 'Workout hinzufügen'}
      </Button>
    </form>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(220 20% 8%)' }}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 mb-6" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(220 20% 8%)' }}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>{error.message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
