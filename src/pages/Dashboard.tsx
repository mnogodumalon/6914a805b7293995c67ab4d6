import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, Uebungen, WorkoutLogs } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Flame,
  Dumbbell,
  Apple,
  Target,
  Activity,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  ziele: Ziele[];
  uebungen: Uebungen[];
  workoutLogs: WorkoutLogs[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new workout
  const [newWorkout, setNewWorkout] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as const,
    dauer_minuten: 60,
    stimmung: 'gut' as const,
    rest_day: false
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const [workouts, ernaehrung, koerperdaten, ziele, uebungen, workoutLogs] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkoutLogs()
      ]);

      setData({ workouts, ernaehrung, koerperdaten, ziele, uebungen, workoutLogs });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkout() {
    if (!newWorkout.datum) return;

    try {
      setSubmitting(true);
      await LivingAppsService.createWorkout(newWorkout);
      await loadDashboardData(); // Reload data
      setDialogOpen(false);

      // Reset form
      setNewWorkout({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: 60,
        stimmung: 'gut',
        rest_day: false
      });
    } catch (err) {
      alert('Fehler beim Erstellen des Workouts: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Fehler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData} className="w-full">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // --- CALCULATIONS ---
  const today = new Date();
  const last7Days = subDays(today, 7);
  const last30Days = subDays(today, 30);
  const thisWeek = { start: startOfWeek(today, { locale: de }), end: endOfWeek(today, { locale: de }) };

  // Active goals
  const activeGoals = data.ziele.filter(z => z.fields.status === 'aktiv');
  const dailyCalorieGoal = activeGoals[0]?.fields.taeglich_kalorien || 2000;
  const dailyProteinGoal = activeGoals[0]?.fields.taeglich_protein || 150;
  const weeklyWorkoutGoal = activeGoals[0]?.fields.trainingstage_pro_woche || 4;

  // Workouts this week
  const workoutsThisWeek = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    const workoutDate = new Date(w.fields.datum);
    return isWithinInterval(workoutDate, thisWeek);
  });

  // Nutrition today
  const nutritionToday = data.ernaehrung.filter(e => {
    if (!e.fields.datum) return false;
    return e.fields.datum === format(today, 'yyyy-MM-dd');
  });

  const todayCalories = nutritionToday.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const todayProtein = nutritionToday.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  // Latest body data
  const latestBodyData = [...data.koerperdaten]
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
    [0];

  const currentWeight = latestBodyData?.fields.gewicht_kg || 0;
  const currentBodyFat = latestBodyData?.fields.kfa_geschaetzt || 0;

  // Weight trend (last 30 days)
  const weightData = data.koerperdaten
    .filter(k => k.fields.datum && new Date(k.fields.datum) >= last30Days)
    .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
    .map(k => ({
      date: format(new Date(k.fields.datum!), 'dd.MM', { locale: de }),
      weight: k.fields.gewicht_kg || 0,
      bodyFat: k.fields.kfa_geschaetzt || 0
    }));

  // Weight change
  const weightChange = weightData.length >= 2
    ? weightData[weightData.length - 1].weight - weightData[0].weight
    : 0;

  // Nutrition chart (last 7 days)
  const nutritionByDay = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(today, 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEntries = data.ernaehrung.filter(e => e.fields.datum === dayStr);

    return {
      date: format(day, 'EEE', { locale: de }),
      kalorien: dayEntries.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0),
      protein: dayEntries.reduce((sum, e) => sum + (e.fields.protein || 0), 0),
      goal: dailyCalorieGoal
    };
  });

  // Workout frequency by type
  const workoutsByType = data.workouts.reduce((acc, w) => {
    const type = w.fields.typ || 'sonstiges';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workoutTypeData = Object.entries(workoutsByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

  // Workout mood distribution
  const moodCounts = data.workouts.reduce((acc, w) => {
    const mood = w.fields.stimmung || 'okay';
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const MOOD_LABELS: Record<string, string> = {
    schlecht: 'Schlecht',
    okay: 'Okay',
    gut: 'Gut',
    brutal: 'Brutal'
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fitness & Ernährungs-Tracker</h1>
            <p className="text-muted-foreground mt-1">
              {format(today, 'EEEE, dd. MMMM yyyy', { locale: de })}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Neues Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Neues Workout erstellen</DialogTitle>
                <DialogDescription>
                  Trage die Details deines Workouts ein.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={newWorkout.datum}
                    onChange={(e) => setNewWorkout({ ...newWorkout, datum: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="typ">Trainingstyp</Label>
                  <Select
                    value={newWorkout.typ}
                    onValueChange={(value: any) => setNewWorkout({ ...newWorkout, typ: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="grid gap-2">
                  <Label htmlFor="dauer">Dauer (Minuten)</Label>
                  <Input
                    id="dauer"
                    type="number"
                    value={newWorkout.dauer_minuten}
                    onChange={(e) => setNewWorkout({ ...newWorkout, dauer_minuten: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stimmung">Stimmung</Label>
                  <Select
                    value={newWorkout.stimmung}
                    onValueChange={(value: any) => setNewWorkout({ ...newWorkout, stimmung: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schlecht">Schlecht</SelectItem>
                      <SelectItem value="okay">Okay</SelectItem>
                      <SelectItem value="gut">Gut</SelectItem>
                      <SelectItem value="brutal">Brutal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateWorkout}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    'Workout erstellen'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Workouts this week */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workoutsThisWeek.length} / {weeklyWorkoutGoal}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((workoutsThisWeek.length / weeklyWorkoutGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((workoutsThisWeek.length / weeklyWorkoutGoal) * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ziel: {weeklyWorkoutGoal} Trainings
              </p>
            </CardContent>
          </Card>

          {/* Calories today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalorien heute</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayCalories} <span className="text-sm font-normal text-muted-foreground">kcal</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      todayCalories > dailyCalorieGoal ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((todayCalories / dailyCalorieGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((todayCalories / dailyCalorieGoal) * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ziel: {dailyCalorieGoal} kcal
              </p>
            </CardContent>
          </Card>

          {/* Protein today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein heute</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayProtein} <span className="text-sm font-normal text-muted-foreground">g</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((todayProtein / dailyProteinGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((todayProtein / dailyProteinGoal) * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ziel: {dailyProteinGoal}g
              </p>
            </CardContent>
          </Card>

          {/* Current weight */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentWeight > 0 ? currentWeight.toFixed(1) : '-'} <span className="text-sm font-normal text-muted-foreground">kg</span>
              </div>
              {weightChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 ${weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {weightChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                KFA: {currentBodyFat > 0 ? `${currentBodyFat.toFixed(1)}%` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
              <CardDescription>Dein Gewicht und Körperfettanteil im Verlauf</CardDescription>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Gewicht (kg)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="KFA (%)"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Körperdaten vorhanden</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition last 7 days */}
          <Card>
            <CardHeader>
              <CardTitle>Ernährung (7 Tage)</CardTitle>
              <CardDescription>Kalorien und Protein im Vergleich zum Ziel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={nutritionByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kalorien" fill="#8884d8" name="Kalorien (kcal)" />
                  <Bar dataKey="protein" fill="#82ca9d" name="Protein (g)" />
                  <Line type="monotone" dataKey="goal" stroke="#ff7c7c" strokeDasharray="5 5" name="Ziel (kcal)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Types */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingstypen</CardTitle>
              <CardDescription>Verteilung deiner Workouts</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workoutTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workoutTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Workouts vorhanden</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Workouts & Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Letzte Workouts</CardTitle>
              <CardDescription>Deine letzten 5 Trainingseinheiten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.workouts
                  .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
                  .slice(0, 5)
                  .map((workout) => (
                    <div key={workout.record_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {workout.fields.datum ? format(new Date(workout.fields.datum), 'dd.MM.yyyy', { locale: de }) : '-'}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {workout.fields.typ || 'Unbekannt'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {workout.fields.dauer_minuten || 0} min
                        </Badge>
                        <Badge
                          variant={
                            workout.fields.stimmung === 'brutal' ? 'default' :
                            workout.fields.stimmung === 'gut' ? 'secondary' :
                            'outline'
                          }
                        >
                          {MOOD_LABELS[workout.fields.stimmung || 'okay']}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {data.workouts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Workouts vorhanden</p>
                    <p className="text-sm mt-1">Erstelle dein erstes Workout!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Goals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktive Ziele</CardTitle>
                  <CardDescription>Deine aktuellen Fitness- und Ernährungsziele</CardDescription>
                </div>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <div key={goal.record_id} className="border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tägliche Kalorien</p>
                          <p className="text-lg font-semibold">{goal.fields.taeglich_kalorien || '-'} kcal</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tägliches Protein</p>
                          <p className="text-lg font-semibold">{goal.fields.taeglich_protein || '-'} g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trainingstage/Woche</p>
                          <p className="text-lg font-semibold">{goal.fields.trainingstage_pro_woche || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Schlafziel</p>
                          <p className="text-lg font-semibold">{goal.fields.schlaf_ziel_stunden || '-'} h</p>
                        </div>
                      </div>
                      {goal.fields.notizen && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{goal.fields.notizen}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine aktiven Ziele vorhanden</p>
                  <p className="text-sm mt-1">Setze dir Ziele für besseren Fortschritt!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
              <CardDescription>Deine Übersicht auf einen Blick</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Übungen total</span>
                <span className="text-lg font-semibold">{data.uebungen.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Workouts total</span>
                <span className="text-lg font-semibold">{data.workouts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Workout-Logs</span>
                <span className="text-lg font-semibold">{data.workoutLogs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ernährungseinträge</span>
                <span className="text-lg font-semibold">{data.ernaehrung.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Körperdaten-Logs</span>
                <span className="text-lg font-semibold">{data.koerperdaten.length}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Avg. Workout-Dauer</span>
                <span className="text-lg font-semibold">
                  {data.workouts.length > 0
                    ? Math.round(
                        data.workouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0) /
                        data.workouts.length
                      )
                    : 0} min
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
