import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Apple,
  Target,
  Dumbbell,
  Calendar,
  Flame,
  Scale,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, WorkoutLogs, Uebungen } from '@/types/app';
import { format, subDays, startOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Lookup-Labels
const MAHLZEIT_LABELS = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges'
};

const WORKOUT_TYP_LABELS = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges'
};

const STIMMUNG_LABELS = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  ziele: Ziele[];
  koerperdaten: Koerperdaten[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state für Workout-Dialog
  const [workoutForm, setWorkoutForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as Workouts['fields']['typ'],
    dauer_minuten: 60,
    stimmung: 'gut' as Workouts['fields']['stimmung'],
    rest_day: false
  });

  // Daten laden
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workouts, ernaehrung, ziele, koerperdaten, workoutLogs, uebungen] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getZiele(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen()
      ]);

      setData({ workouts, ernaehrung, ziele, koerperdaten, workoutLogs, uebungen });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWorkout = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      await LivingAppsService.createWorkout({
        datum: workoutForm.datum,
        typ: workoutForm.typ,
        dauer_minuten: workoutForm.dauer_minuten,
        stimmung: workoutForm.stimmung,
        rest_day: workoutForm.rest_day
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setSubmitSuccess(false);
        loadData(); // Daten neu laden
      }, 1500);

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Keine Daten verfügbar'}
            <Button onClick={loadData} variant="outline" size="sm" className="mt-4 w-full">
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Berechnungen für KPIs
  const today = format(new Date(), 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
  const thisWeekStart = startOfWeek(new Date(), { locale: de });

  // Aktive Ziele
  const activeGoals = data.ziele.filter(z => z.fields.status === 'aktiv')[0] || null;

  // Heutige Ernährung
  const todayNutrition = data.ernaehrung.filter(e => e.fields.datum === today);
  const todayCalories = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const todayProtein = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
  const todayCarbs = todayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
  const todayFat = todayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

  // Workouts diese Woche
  const thisWeekWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    try {
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: thisWeekStart, end: new Date() });
    } catch {
      return false;
    }
  }).filter(w => !w.fields.rest_day);

  // Aktuelles Gewicht
  const sortedWeights = [...data.koerperdaten]
    .filter(k => k.fields.gewicht_kg)
    .sort((a, b) => new Date(b.fields.datum || '').getTime() - new Date(a.fields.datum || '').getTime());
  const currentWeight = sortedWeights[0]?.fields.gewicht_kg || null;
  const previousWeight = sortedWeights[1]?.fields.gewicht_kg || null;
  const weightChange = currentWeight && previousWeight ? currentWeight - previousWeight : null;

  // Chart Data: Kalorien Trend (letzte 7 Tage)
  const caloriesTrendData = last7Days.reverse().map(date => {
    const dayData = data.ernaehrung.filter(e => e.fields.datum === date);
    const calories = dayData.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    return {
      datum: format(parseISO(date), 'EEE', { locale: de }),
      kalorien: Math.round(calories),
      ziel: activeGoals?.fields.taeglich_kalorien || 0
    };
  });

  // Chart Data: Gewichtsverlauf (letzte 10 Einträge)
  const weightTrendData = sortedWeights.slice(0, 10).reverse().map(k => ({
    datum: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
    gewicht: k.fields.gewicht_kg || 0
  }));

  // Chart Data: Makronährstoff-Verteilung heute
  const macroData = [
    { name: 'Protein', value: todayProtein, color: CHART_COLORS[0] },
    { name: 'Kohlenhydrate', value: todayCarbs, color: CHART_COLORS[1] },
    { name: 'Fett', value: todayFat, color: CHART_COLORS[2] }
  ].filter(m => m.value > 0);

  // Chart Data: Workout-Typen Verteilung (letzte 30 Tage)
  const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const recentWorkouts = data.workouts.filter(w => w.fields.datum && w.fields.datum >= last30Days && !w.fields.rest_day);
  const workoutTypeDistribution = Object.entries(
    recentWorkouts.reduce((acc, w) => {
      const typ = w.fields.typ || 'sonstiges';
      acc[typ] = (acc[typ] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([typ, count]) => ({
    typ: WORKOUT_TYP_LABELS[typ as keyof typeof WORKOUT_TYP_LABELS] || typ,
    anzahl: count
  }));

  // Statistik: Meistgenutzte Übungen
  const exerciseUsage = data.workoutLogs.reduce((acc, log) => {
    const uebungUrl = log.fields.uebung;
    if (!uebungUrl) return acc;

    // URL parsen um ID zu extrahieren (verwende extractRecordId Helper)
    const uebungId = extractRecordId(uebungUrl);
    if (!uebungId) return acc;

    acc[uebungId] = (acc[uebungId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topExercises = Object.entries(exerciseUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([uebungId, count]) => {
      const uebung = data.uebungen.find(u => u.record_id === uebungId);
      return {
        name: uebung?.fields.name || 'Unbekannt',
        count,
        muskelgruppe: uebung?.fields.muskelgruppe
      };
    });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Fitness & Ernährungs-Tracker</h1>
            <p className="text-muted-foreground mt-2">
              {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </p>
          </div>

          {/* Hauptaktion: Workout erfassen */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Workout erfassen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Neues Workout erfassen</DialogTitle>
                <DialogDescription>
                  Trage dein heutiges Training ein
                </DialogDescription>
              </DialogHeader>

              {submitSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Workout erfolgreich gespeichert!</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="datum">Datum</Label>
                      <Input
                        id="datum"
                        type="date"
                        value={workoutForm.datum}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, datum: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="typ">Trainingstyp</Label>
                      <Select
                        value={workoutForm.typ}
                        onValueChange={(value) => setWorkoutForm({ ...workoutForm, typ: value as Workouts['fields']['typ'] })}
                      >
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
                        value={workoutForm.dauer_minuten}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, dauer_minuten: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="stimmung">Stimmung</Label>
                      <Select
                        value={workoutForm.stimmung}
                        onValueChange={(value) => setWorkoutForm({ ...workoutForm, stimmung: value as Workouts['fields']['stimmung'] })}
                      >
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

                    <div className="flex items-center gap-2">
                      <input
                        id="rest_day"
                        type="checkbox"
                        checked={workoutForm.rest_day}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, rest_day: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="rest_day" className="cursor-pointer">Ruhetag</Label>
                    </div>
                  </div>

                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleSubmitWorkout} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Speichert...
                        </>
                      ) : (
                        'Speichern'
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Workouts diese Woche */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trainingseinheiten
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{thisWeekWorkouts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeGoals?.fields.trainingstage_pro_woche
                  ? `Ziel: ${activeGoals.fields.trainingstage_pro_woche}/Woche`
                  : 'Diese Woche'}
              </p>
              {activeGoals?.fields.trainingstage_pro_woche && (
                <div className="mt-2">
                  {thisWeekWorkouts.length >= activeGoals.fields.trainingstage_pro_woche ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Ziel erreicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {activeGoals.fields.trainingstage_pro_woche - thisWeekWorkouts.length} fehlen
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kalorien heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kalorien heute
              </CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(todayCalories)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeGoals?.fields.taeglich_kalorien
                  ? `Ziel: ${activeGoals.fields.taeglich_kalorien} kcal`
                  : 'kcal'}
              </p>
              {activeGoals?.fields.taeglich_kalorien && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {todayCalories >= activeGoals.fields.taeglich_kalorien ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">
                        +{Math.round(todayCalories - activeGoals.fields.taeglich_kalorien)} kcal
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-500">
                        {Math.round(activeGoals.fields.taeglich_kalorien - todayCalories)} fehlen
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Protein heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Protein heute
              </CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(todayProtein)}g</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeGoals?.fields.taeglich_protein
                  ? `Ziel: ${activeGoals.fields.taeglich_protein}g`
                  : 'Protein'}
              </p>
              {activeGoals?.fields.taeglich_protein && (
                <div className="mt-2">
                  {todayProtein >= activeGoals.fields.taeglich_protein ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Ziel erreicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {Math.round(activeGoals.fields.taeglich_protein - todayProtein)}g fehlen
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aktuelles Gewicht */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktuelles Gewicht
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currentWeight ? `${currentWeight.toFixed(1)} kg` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sortedWeights[0]?.fields.datum
                  ? format(parseISO(sortedWeights[0].fields.datum), 'dd.MM.yyyy', { locale: de })
                  : 'Kein Datum'}
              </p>
              {weightChange !== null && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {weightChange > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-500">+{weightChange.toFixed(1)} kg</span>
                    </>
                  ) : weightChange < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">{weightChange.toFixed(1)} kg</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Keine Änderung</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Kalorien Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Kalorien-Trend (7 Tage)</CardTitle>
              <CardDescription>Tägliche Kalorienaufnahme im Vergleich zum Ziel</CardDescription>
            </CardHeader>
            <CardContent>
              {caloriesTrendData.every(d => d.kalorien === 0) ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Ernährungsdaten für die letzten 7 Tage
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={caloriesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="kalorien" stroke={CHART_COLORS[0]} strokeWidth={2} name="Kalorien" />
                    {activeGoals?.fields.taeglich_kalorien && (
                      <Line type="monotone" dataKey="ziel" stroke={CHART_COLORS[3]} strokeDasharray="5 5" name="Ziel" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gewichtsverlauf */}
          <Card>
            <CardHeader>
              <CardTitle>Gewichtsverlauf</CardTitle>
              <CardDescription>Entwicklung deines Körpergewichts</CardDescription>
            </CardHeader>
            <CardContent>
              {weightTrendData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Gewichtsdaten vorhanden
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gewicht" stroke={CHART_COLORS[1]} strokeWidth={2} name="Gewicht (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Makronährstoff-Verteilung */}
          <Card>
            <CardHeader>
              <CardTitle>Makronährstoffe heute</CardTitle>
              <CardDescription>Verteilung von Protein, Kohlenhydraten und Fett</CardDescription>
            </CardHeader>
            <CardContent>
              {macroData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Noch keine Mahlzeiten heute erfasst
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}g`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout-Typen Verteilung */}
          <Card>
            <CardHeader>
              <CardTitle>Workout-Typen (30 Tage)</CardTitle>
              <CardDescription>Verteilung deiner Trainingseinheiten</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutTypeDistribution.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Workouts in den letzten 30 Tagen
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workoutTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="typ" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="anzahl" fill={CHART_COLORS[4]} name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Aktive Ziele */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Aktive Ziele
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeGoals ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kalorien/Tag</p>
                      <p className="text-2xl font-bold">{activeGoals.fields.taeglich_kalorien || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protein/Tag</p>
                      <p className="text-2xl font-bold">{activeGoals.fields.taeglich_protein ? `${activeGoals.fields.taeglich_protein}g` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Training/Woche</p>
                      <p className="text-2xl font-bold">{activeGoals.fields.trainingstage_pro_woche || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Schlaf/Nacht</p>
                      <p className="text-2xl font-bold">{activeGoals.fields.schlaf_ziel_stunden ? `${activeGoals.fields.schlaf_ziel_stunden}h` : 'N/A'}</p>
                    </div>
                  </div>
                  {activeGoals.fields.notizen && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Notizen:</p>
                      <p className="text-sm">{activeGoals.fields.notizen}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Keine aktiven Ziele definiert</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Übungen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Top 5 Übungen
              </CardTitle>
              <CardDescription>Deine am häufigsten durchgeführten Übungen</CardDescription>
            </CardHeader>
            <CardContent>
              {topExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Noch keine Übungen protokolliert</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topExercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          {exercise.muskelgruppe && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {exercise.muskelgruppe}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">{exercise.count}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>Fitness & Ernährungs-Tracker Dashboard</p>
          <p className="mt-1">Daten werden in Echtzeit von Living Apps synchronisiert</p>
        </div>
      </div>
    </div>
  );
}
