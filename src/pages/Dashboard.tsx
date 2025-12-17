import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, WorkoutLogs, Uebungen } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Apple,
  Target,
  Weight,
  Dumbbell,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Lookup Data Mappings
const MUSKELGRUPPE_LABELS = {
  brust: 'Brust', ruecken: 'Rücken', beine: 'Beine', schultern: 'Schultern',
  bizeps: 'Bizeps', trizeps: 'Trizeps', bauch: 'Bauch', ganzkoerper: 'Ganzkörper'
};

const TRAININGSTYP_LABELS = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
};

const STIMMUNG_LABELS = {
  schlecht: 'Schlecht', okay: 'Okay', gut: 'Gut', brutal: 'Brutal'
};

const MAHLZEIT_LABELS = {
  fruehstueck: 'Frühstück', snack: 'Snack', mittagessen: 'Mittagessen',
  abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges'
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

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

  // Form state for new workout
  const [newWorkout, setNewWorkout] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as const,
    dauer_minuten: 60,
    stimmung: 'gut' as const,
    rest_day: false
  });

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

  const handleCreateWorkout = async () => {
    try {
      await LivingAppsService.createWorkout(newWorkout);
      setDialogOpen(false);
      await loadData();
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={loadData} className="w-full">Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Calculate statistics
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: de });
  const weekEnd = endOfWeek(today, { locale: de });

  // Active goal
  const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv');

  // This week's workouts
  const thisWeekWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    try {
      const workoutDate = parseISO(w.fields.datum);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  }).filter(w => !w.fields.rest_day);

  // Today's nutrition
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayNutrition = data.ernaehrung.filter(e => e.fields.datum === todayStr);

  const todayCalories = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const todayProtein = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
  const todayCarbs = todayNutrition.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
  const todayFett = todayNutrition.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

  // Latest body data
  const sortedBodyData = [...data.koerperdaten].sort((a, b) => {
    const dateA = a.fields.datum || '';
    const dateB = b.fields.datum || '';
    return dateB.localeCompare(dateA);
  });
  const latestBodyData = sortedBodyData[0];

  // Weight chart data (last 10 entries)
  const weightChartData = sortedBodyData.slice(0, 10).reverse().map(k => ({
    datum: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
    gewicht: k.fields.gewicht_kg || 0,
    kfa: k.fields.kfa_geschaetzt || 0
  }));

  // Weight trend
  const weightTrend = sortedBodyData.length >= 2
    ? (sortedBodyData[0].fields.gewicht_kg || 0) - (sortedBodyData[1].fields.gewicht_kg || 0)
    : 0;

  // Training types distribution (last 30 days)
  const last30DaysWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    try {
      const workoutDate = parseISO(w.fields.datum);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return workoutDate >= thirtyDaysAgo;
    } catch {
      return false;
    }
  });

  const trainingTypesData = Object.entries(
    last30DaysWorkouts.reduce((acc, w) => {
      const typ = w.fields.typ || 'sonstiges';
      acc[typ] = (acc[typ] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([typ, count]) => ({
    name: TRAININGSTYP_LABELS[typ as keyof typeof TRAININGSTYP_LABELS] || typ,
    value: count
  }));

  // Most trained muscle groups (via workout logs)
  const muscleGroupStats: Record<string, number> = {};
  data.workoutLogs.forEach(log => {
    const uebungId = extractRecordId(log.fields.uebung);
    if (!uebungId) return;

    const uebung = data.uebungen.find(u => u.record_id === uebungId);
    if (uebung?.fields.muskelgruppe) {
      const key = uebung.fields.muskelgruppe;
      muscleGroupStats[key] = (muscleGroupStats[key] || 0) + 1;
    }
  });

  const muscleGroupData = Object.entries(muscleGroupStats)
    .map(([gruppe, count]) => ({
      name: MUSKELGRUPPE_LABELS[gruppe as keyof typeof MUSKELGRUPPE_LABELS] || gruppe,
      anzahl: count
    }))
    .sort((a, b) => b.anzahl - a.anzahl)
    .slice(0, 5);

  // Calories chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'yyyy-MM-dd');
  });

  const caloriesChartData = last7Days.map(dateStr => {
    const dayNutrition = data.ernaehrung.filter(e => e.fields.datum === dateStr);
    const calories = dayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    const protein = dayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

    return {
      datum: format(parseISO(dateStr), 'EEE', { locale: de }),
      kalorien: calories,
      protein: protein,
      ziel: activeGoal?.fields.taeglich_kalorien || 0
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitness & Ernährungs-Tracker</h1>
          <p className="text-gray-500 mt-1">Dein persönliches Dashboard</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Neues Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neues Workout erstellen</DialogTitle>
              <DialogDescription>
                Erfasse ein neues Training in deinem Tracker
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="datum">Datum</Label>
                <Input
                  id="datum"
                  type="date"
                  value={newWorkout.datum}
                  onChange={(e) => setNewWorkout({ ...newWorkout, datum: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="typ">Trainingstyp</Label>
                <Select
                  value={newWorkout.typ}
                  onValueChange={(value) => setNewWorkout({ ...newWorkout, typ: value as typeof newWorkout.typ })}
                >
                  <SelectTrigger id="typ">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRAININGSTYP_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dauer">Dauer (Minuten)</Label>
                <Input
                  id="dauer"
                  type="number"
                  value={newWorkout.dauer_minuten}
                  onChange={(e) => setNewWorkout({ ...newWorkout, dauer_minuten: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stimmung">Stimmung nach dem Training</Label>
                <Select
                  value={newWorkout.stimmung}
                  onValueChange={(value) => setNewWorkout({ ...newWorkout, stimmung: value as typeof newWorkout.stimmung })}
                >
                  <SelectTrigger id="stimmung">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button onClick={handleCreateWorkout} className="flex-1">
                Workout erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This Week Workouts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              Diese Woche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeGoal?.fields.trainingstage_pro_woche
                    ? `Ziel: ${activeGoal.fields.trainingstage_pro_woche} Tage`
                    : 'Trainingseinheiten'
                  }
                </p>
              </div>
              {activeGoal?.fields.trainingstage_pro_woche && (
                <div className="text-right">
                  {thisWeekWorkouts.length >= activeGoal.fields.trainingstage_pro_woche ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Erreicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {activeGoal.fields.trainingstage_pro_woche - thisWeekWorkouts.length} noch
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today Calories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              Kalorien Heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">{todayCalories.toFixed(0)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeGoal?.fields.taeglich_kalorien
                    ? `Ziel: ${activeGoal.fields.taeglich_kalorien} kcal`
                    : 'kcal gegessen'
                  }
                </p>
              </div>
              {activeGoal?.fields.taeglich_kalorien && (
                <div className="text-right">
                  {todayCalories >= activeGoal.fields.taeglich_kalorien * 0.9 ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Erreicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {(activeGoal.fields.taeglich_kalorien - todayCalories).toFixed(0)} noch
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today Protein */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Apple className="h-4 w-4 text-green-600" />
              Protein Heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">{todayProtein.toFixed(0)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeGoal?.fields.taeglich_protein
                    ? `Ziel: ${activeGoal.fields.taeglich_protein}g`
                    : 'Gramm Protein'
                  }
                </p>
              </div>
              {activeGoal?.fields.taeglich_protein && (
                <div className="text-right">
                  {todayProtein >= activeGoal.fields.taeglich_protein * 0.9 ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Erreicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {(activeGoal.fields.taeglich_protein - todayProtein).toFixed(0)}g noch
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Weight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Weight className="h-4 w-4 text-purple-600" />
              Aktuelles Gewicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {latestBodyData?.fields.gewicht_kg?.toFixed(1) || '-'}
                  {latestBodyData?.fields.gewicht_kg && <span className="text-base font-normal text-gray-500 ml-1">kg</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {latestBodyData?.fields.datum
                    ? format(parseISO(latestBodyData.fields.datum), 'dd.MM.yyyy', { locale: de })
                    : 'Keine Daten'
                  }
                </p>
              </div>
              {weightTrend !== 0 && (
                <div className="flex items-center gap-1">
                  {weightTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${weightTrend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(weightTrend).toFixed(1)}kg
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Gewichtsverlauf
            </CardTitle>
            <CardDescription>Letzte 10 Messungen</CardDescription>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datum" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gewicht" stroke="#8b5cf6" strokeWidth={2} name="Gewicht (kg)" />
                  <Line type="monotone" dataKey="kfa" stroke="#f59e0b" strokeWidth={2} name="KFA (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Noch keine Körperdaten vorhanden
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calories Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600" />
              Kalorien & Protein (7 Tage)
            </CardTitle>
            <CardDescription>Deine Ernährung im Überblick</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={caloriesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="datum" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="kalorien" fill="#f59e0b" name="Kalorien" />
                <Bar dataKey="protein" fill="#10b981" name="Protein (g)" />
                {activeGoal?.fields.taeglich_kalorien && (
                  <Line type="monotone" dataKey="ziel" stroke="#ef4444" strokeDasharray="5 5" name="Kalorienziel" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              Trainingstypen (30 Tage)
            </CardTitle>
            <CardDescription>Verteilung deiner Workouts</CardDescription>
          </CardHeader>
          <CardContent>
            {trainingTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trainingTypesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trainingTypesData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Noch keine Workouts vorhanden
              </div>
            )}
          </CardContent>
        </Card>

        {/* Muscle Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Top 5 Muskelgruppen
            </CardTitle>
            <CardDescription>Am häufigsten trainiert</CardDescription>
          </CardHeader>
          <CardContent>
            {muscleGroupData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={muscleGroupData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="anzahl" fill="#10b981" name="Übungen" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Noch keine Workout-Logs vorhanden
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Goal & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Goal */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Aktives Ziel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeGoal ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kalorien/Tag</span>
                  <span className="font-semibold">{activeGoal.fields.taeglich_kalorien || '-'} kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Protein/Tag</span>
                  <span className="font-semibold">{activeGoal.fields.taeglich_protein || '-'}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Training/Woche</span>
                  <span className="font-semibold">{activeGoal.fields.trainingstage_pro_woche || '-'}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Schlafziel</span>
                  <span className="font-semibold">{activeGoal.fields.schlaf_ziel_stunden || '-'}h</span>
                </div>
                {activeGoal.fields.notizen && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">{activeGoal.fields.notizen}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Kein aktives Ziel gesetzt</p>
                <p className="text-xs mt-2">Setze dir ein Ziel in der Ziele-App</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Letzte Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.workouts.length > 0 ? (
              <div className="space-y-3">
                {[...data.workouts]
                  .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
                  .slice(0, 5)
                  .map((workout) => (
                    <div key={workout.record_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {workout.fields.rest_day ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Dumbbell className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {workout.fields.rest_day ? 'Ruhetag' : TRAININGSTYP_LABELS[workout.fields.typ || 'sonstiges']}
                          </div>
                          <div className="text-xs text-gray-500">
                            {workout.fields.datum ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de }) : 'Kein Datum'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!workout.fields.rest_day && workout.fields.dauer_minuten && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {workout.fields.dauer_minuten}min
                          </Badge>
                        )}
                        {workout.fields.stimmung && (
                          <Badge
                            variant={workout.fields.stimmung === 'brutal' ? 'default' : 'secondary'}
                            className={workout.fields.stimmung === 'brutal' ? 'bg-green-500' : ''}
                          >
                            {STIMMUNG_LABELS[workout.fields.stimmung]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Noch keine Workouts vorhanden</p>
                <p className="text-xs mt-2">Erstelle dein erstes Workout oben rechts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Nutrition Details */}
      {todayNutrition.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-green-600" />
              Heutige Ernährung im Detail
            </CardTitle>
            <CardDescription>
              {todayNutrition.length} Mahlzeiten erfasst |
              Makros: {todayProtein.toFixed(0)}g Protein, {todayCarbs.toFixed(0)}g Carbs, {todayFett.toFixed(0)}g Fett
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayNutrition.map((meal) => (
                <div key={meal.record_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">
                      {MAHLZEIT_LABELS[meal.fields.mahlzeit_typ || 'sonstiges']}
                    </Badge>
                    <span className="text-sm font-semibold text-orange-600">
                      {meal.fields.kalorien || 0} kcal
                    </span>
                  </div>
                  {meal.fields.beschreibung && (
                    <p className="text-sm text-gray-600 mb-2">{meal.fields.beschreibung}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <div>P: {meal.fields.protein || 0}g</div>
                    <div>C: {meal.fields.carbs || 0}g</div>
                    <div>F: {meal.fields.fett || 0}g</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.workouts.length}</div>
              <div className="text-xs text-gray-500">Gesamt Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.uebungen.length}</div>
              <div className="text-xs text-gray-500">Übungen erfasst</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.ernaehrung.length}</div>
              <div className="text-xs text-gray-500">Mahlzeiten geloggt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.workoutLogs.length}</div>
              <div className="text-xs text-gray-500">Workout-Logs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
