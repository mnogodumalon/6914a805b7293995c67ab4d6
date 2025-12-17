import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, Uebungen, WorkoutLogs } from '@/types/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Apple, Target, Scale, Dumbbell, Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

// Lookup Labels (aus app_metadata.json)
const MUSKELGRUPPEN_LABELS: Record<string, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  beine: 'Beine',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  bauch: 'Bauch',
  ganzkoerper: 'Ganzkörper'
};

const WORKOUT_TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges'
};

const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal'
};

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  ziele: Ziele[];
  koerperdaten: Koerperdaten[];
  uebungen: Uebungen[];
  workoutLogs: WorkoutLogs[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State für neues Workout
  const [newWorkout, setNewWorkout] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push',
    dauer_minuten: 60,
    stimmung: 'gut',
    rest_day: false
  });

  // Daten laden
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [workouts, ernaehrung, ziele, koerperdaten, uebungen, workoutLogs] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getZiele(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkoutLogs()
      ]);
      setData({ workouts, ernaehrung, ziele, koerperdaten, uebungen, workoutLogs });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkout() {
    try {
      setSaving(true);
      await LivingAppsService.createWorkout({
        datum: newWorkout.datum, // date/date Format bleibt YYYY-MM-DD
        typ: newWorkout.typ as Workouts['fields']['typ'],
        dauer_minuten: newWorkout.dauer_minuten,
        stimmung: newWorkout.stimmung as Workouts['fields']['stimmung'],
        rest_day: newWorkout.rest_day
      });
      setDialogOpen(false);
      await loadDashboardData();
      // Reset Form
      setNewWorkout({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: 60,
        stimmung: 'gut',
        rest_day: false
      });
    } catch (err) {
      alert('Fehler beim Erstellen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline" className="w-full">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // --- BERECHNUNGEN ---

  // Aktives Ziel
  const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv');

  // Diese Woche Daten
  const now = new Date();
  const weekStart = startOfWeek(now, { locale: de });
  const weekEnd = endOfWeek(now, { locale: de });

  const thisWeekWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    const d = new Date(w.fields.datum);
    return d >= weekStart && d <= weekEnd && !w.fields.rest_day;
  });

  // Heute Ernährung
  const today = format(now, 'yyyy-MM-dd');
  const todayMeals = data.ernaehrung.filter(e => e.fields.datum === today);
  const todayKalorien = todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);
  const todayProtein = todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0);

  // Letztes Körpergewicht
  const sortedKoerperdaten = [...data.koerperdaten]
    .filter(k => k.fields.gewicht_kg)
    .sort((a, b) => new Date(b.fields.datum || 0).getTime() - new Date(a.fields.datum || 0).getTime());
  const latestWeight = sortedKoerperdaten[0];
  const previousWeight = sortedKoerperdaten[1];
  const weightChange = latestWeight && previousWeight
    ? (latestWeight.fields.gewicht_kg! - previousWeight.fields.gewicht_kg!)
    : null;

  // Top 5 Übungen (nach Anzahl Logs)
  const exerciseLogCounts: Record<string, number> = {};
  data.workoutLogs.forEach(log => {
    const uebungId = extractRecordId(log.fields.uebung);
    if (!uebungId) return;
    exerciseLogCounts[uebungId] = (exerciseLogCounts[uebungId] || 0) + 1;
  });
  const topExercises = Object.entries(exerciseLogCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const uebung = data.uebungen.find(u => u.record_id === id);
      return {
        name: uebung?.fields.name || 'Unbekannt',
        count,
        muskelgruppe: uebung?.fields.muskelgruppe
      };
    });

  // Letzte 7 Tage Workouts für Chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayWorkouts = data.workouts.filter(w => w.fields.datum === dateStr && !w.fields.rest_day);
    return {
      date: format(d, 'dd.MM', { locale: de }),
      count: dayWorkouts.length,
      dauer: dayWorkouts.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0)
    };
  });

  // Workout Typ Verteilung
  const workoutTypeDistribution = data.workouts
    .filter(w => !w.fields.rest_day && w.fields.typ)
    .reduce((acc, w) => {
      const typ = w.fields.typ!;
      acc[typ] = (acc[typ] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const workoutTypePieData = Object.entries(workoutTypeDistribution).map(([typ, count]) => ({
    name: WORKOUT_TYP_LABELS[typ] || typ,
    value: count
  }));

  // Muskelgruppen Verteilung (aus Workout Logs)
  const muscleGroupDistribution: Record<string, number> = {};
  data.workoutLogs.forEach(log => {
    const uebungId = extractRecordId(log.fields.uebung);
    if (!uebungId) return;
    const uebung = data.uebungen.find(u => u.record_id === uebungId);
    if (uebung?.fields.muskelgruppe) {
      const mg = uebung.fields.muskelgruppe;
      muscleGroupDistribution[mg] = (muscleGroupDistribution[mg] || 0) + 1;
    }
  });

  const muscleGroupBarData = Object.entries(muscleGroupDistribution)
    .map(([mg, count]) => ({
      name: MUSKELGRUPPEN_LABELS[mg] || mg,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Gewichtsverlauf (letzte 10 Einträge)
  const weightChartData = sortedKoerperdaten
    .slice(0, 10)
    .reverse()
    .map(k => ({
      date: format(new Date(k.fields.datum || 0), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg || 0,
      kfa: k.fields.kfa_geschaetzt || null
    }));

  // Ernährung letzte 7 Tage
  const nutritionLast7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const meals = data.ernaehrung.filter(e => e.fields.datum === dateStr);
    return {
      date: format(d, 'dd.MM', { locale: de }),
      kalorien: meals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: meals.reduce((sum, m) => sum + (m.fields.protein || 0), 0)
    };
  });

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness & Ernährungs-Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Deine Fortschritte auf einen Blick
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
              <DialogTitle>Neues Workout erfassen</DialogTitle>
              <DialogDescription>
                Trage dein Training ein um deine Fortschritte zu tracken.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="datum">Datum</Label>
                <Input
                  id="datum"
                  type="date"
                  value={newWorkout.datum}
                  onChange={e => setNewWorkout({ ...newWorkout, datum: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="typ">Trainingstyp</Label>
                <Select value={newWorkout.typ} onValueChange={v => setNewWorkout({ ...newWorkout, typ: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKOUT_TYP_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dauer">Dauer (Minuten)</Label>
                <Input
                  id="dauer"
                  type="number"
                  min="1"
                  value={newWorkout.dauer_minuten}
                  onChange={e => setNewWorkout({ ...newWorkout, dauer_minuten: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stimmung">Stimmung</Label>
                <Select value={newWorkout.stimmung} onValueChange={v => setNewWorkout({ ...newWorkout, stimmung: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rest_day"
                  checked={newWorkout.rest_day}
                  onCheckedChange={v => setNewWorkout({ ...newWorkout, rest_day: v as boolean })}
                />
                <Label htmlFor="rest_day" className="cursor-pointer">
                  Ruhetag (kein Training)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateWorkout} disabled={saving}>
                {saving ? 'Speichert...' : 'Workout erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Workouts diese Woche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            {activeGoal && (
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {activeGoal.fields.trainingstage_pro_woche || '?'} pro Woche
                {activeGoal.fields.trainingstage_pro_woche && (
                  <span className={thisWeekWorkouts.length >= activeGoal.fields.trainingstage_pro_woche ? 'text-green-600' : 'text-orange-600'}>
                    {' '}({thisWeekWorkouts.length >= activeGoal.fields.trainingstage_pro_woche ? '✓' : '•'})
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Kalorien heute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kalorien heute</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(todayKalorien)}</div>
            {activeGoal && activeGoal.fields.taeglich_kalorien && (
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {activeGoal.fields.taeglich_kalorien} kcal
                <span className={todayKalorien >= activeGoal.fields.taeglich_kalorien * 0.9 ? 'text-green-600' : 'text-orange-600'}>
                  {' '}({Math.round((todayKalorien / activeGoal.fields.taeglich_kalorien) * 100)}%)
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Protein heute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protein heute</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(todayProtein)}g</div>
            {activeGoal && activeGoal.fields.taeglich_protein && (
              <p className="text-xs text-muted-foreground mt-1">
                Ziel: {activeGoal.fields.taeglich_protein}g
                <span className={todayProtein >= activeGoal.fields.taeglich_protein * 0.9 ? 'text-green-600' : 'text-orange-600'}>
                  {' '}({Math.round((todayProtein / activeGoal.fields.taeglich_protein) * 100)}%)
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gewicht */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight ? `${latestWeight.fields.gewicht_kg}kg` : 'Keine Daten'}
            </div>
            {weightChange !== null && (
              <p className="text-xs flex items-center gap-1 mt-1">
                {weightChange > 0 ? (
                  <TrendingUp className="h-3 w-3 text-orange-600" />
                ) : weightChange < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                ) : null}
                <span className={weightChange > 0 ? 'text-orange-600' : weightChange < 0 ? 'text-green-600' : 'text-muted-foreground'}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Workout Aktivität letzte 7 Tage */}
        <Card>
          <CardHeader>
            <CardTitle>Workout-Aktivität (7 Tage)</CardTitle>
            <CardDescription>Anzahl und Dauer der Trainingseinheiten</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" name="Anzahl" />
                <Bar yAxisId="right" dataKey="dauer" fill="#06b6d4" name="Dauer (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ernährung letzte 7 Tage */}
        <Card>
          <CardHeader>
            <CardTitle>Ernährung (7 Tage)</CardTitle>
            <CardDescription>Kalorien und Protein Aufnahme</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={nutritionLast7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="kalorien" stroke="#f59e0b" strokeWidth={2} name="Kalorien" />
                <Line yAxisId="right" type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2} name="Protein (g)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gewichtsverlauf */}
        {weightChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gewichtsverlauf</CardTitle>
              <CardDescription>Letzte {weightChartData.length} Messungen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={['dataMin - 2', 'dataMax + 2']} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="gewicht" stroke="#8b5cf6" strokeWidth={2} name="Gewicht (kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="kfa" stroke="#06b6d4" strokeWidth={2} name="KFA (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Workout Typ Verteilung */}
        {workoutTypePieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workout-Typen</CardTitle>
              <CardDescription>Verteilung deiner Trainingstypen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workoutTypePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workoutTypePieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Muskelgruppen Training */}
        {muscleGroupBarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Muskelgruppen Training</CardTitle>
              <CardDescription>Anzahl Übungen pro Muskelgruppe</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={muscleGroupBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" name="Anzahl Sätze" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Übungen */}
        {topExercises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Übungen</CardTitle>
              <CardDescription>Deine am häufigsten trainierten Übungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topExercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{ex.name}</p>
                        {ex.muskelgruppe && (
                          <p className="text-xs text-muted-foreground">
                            {MUSKELGRUPPEN_LABELS[ex.muskelgruppe] || ex.muskelgruppe}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{ex.count} Sätze</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Aktives Ziel */}
      {activeGoal && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Aktives Ziel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {activeGoal.fields.taeglich_kalorien && (
                <div>
                  <p className="text-sm text-muted-foreground">Tägliche Kalorien</p>
                  <p className="text-lg font-semibold">{activeGoal.fields.taeglich_kalorien} kcal</p>
                </div>
              )}
              {activeGoal.fields.taeglich_protein && (
                <div>
                  <p className="text-sm text-muted-foreground">Tägliches Protein</p>
                  <p className="text-lg font-semibold">{activeGoal.fields.taeglich_protein}g</p>
                </div>
              )}
              {activeGoal.fields.trainingstage_pro_woche && (
                <div>
                  <p className="text-sm text-muted-foreground">Trainingstage/Woche</p>
                  <p className="text-lg font-semibold">{activeGoal.fields.trainingstage_pro_woche}</p>
                </div>
              )}
              {activeGoal.fields.schlaf_ziel_stunden && (
                <div>
                  <p className="text-sm text-muted-foreground">Schlafziel</p>
                  <p className="text-lg font-semibold">{activeGoal.fields.schlaf_ziel_stunden}h</p>
                </div>
              )}
            </div>
            {activeGoal.fields.notizen && (
              <p className="text-sm text-muted-foreground mt-4 border-t pt-3">
                {activeGoal.fields.notizen}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {data.workouts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Workouts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Starte deine Fitness-Reise mit deinem ersten Workout!
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Erstes Workout erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
