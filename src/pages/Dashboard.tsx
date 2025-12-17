import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Utensils, Scale, Target, PlusCircle, Dumbbell, AlertCircle, Flame, Clock, Heart, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardData {
  workouts: Workouts[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  ziele: Ziele[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
}

interface NewWorkoutForm {
  datum: string;
  typ: string;
  dauer_minuten: number;
  stimmung: string;
  rest_day: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newWorkout, setNewWorkout] = useState<NewWorkoutForm>({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: 60,
    stimmung: '',
    rest_day: false
  });

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workouts, ernaehrung, koerperdaten, ziele, workoutLogs, uebungen] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen()
      ]);

      setData({ workouts, ernaehrung, koerperdaten, ziele, workoutLogs, uebungen });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async () => {
    if (!newWorkout.typ || !newWorkout.stimmung) {
      alert('Bitte fülle alle Pflichtfelder aus!');
      return;
    }

    try {
      setSubmitting(true);
      await LivingAppsService.createWorkout({
        datum: newWorkout.datum,
        typ: newWorkout.typ,
        dauer_minuten: newWorkout.dauer_minuten,
        stimmung: newWorkout.stimmung,
        rest_day: newWorkout.rest_day
      });

      // Reload data and close dialog
      await loadData();
      setDialogOpen(false);

      // Reset form
      setNewWorkout({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: '',
        dauer_minuten: 60,
        stimmung: '',
        rest_day: false
      });
    } catch (err) {
      alert('Fehler beim Erstellen des Workouts: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
      console.error('Create workout error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Fehler beim Laden der Daten'}
          </AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // Calculate KPIs
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const todayStr = format(today, 'yyyy-MM-dd');

  // Workouts this week
  const workoutsThisWeek = data.workouts.filter(w => {
    if (!w.fields.datum) return false;
    const workoutDate = parseISO(w.fields.datum);
    return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
  });

  const totalWorkoutsThisWeek = workoutsThisWeek.length;
  const totalTrainingMinutes = workoutsThisWeek.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

  // Nutrition today
  const nutritionToday = data.ernaehrung.filter(e => e.fields.datum === todayStr);
  const totalCaloriesToday = nutritionToday.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const totalProteinToday = nutritionToday.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  // Latest body data
  const latestKoerperdaten = data.koerperdaten
    .filter(k => k.fields.gewicht_kg !== undefined)
    .sort((a, b) => {
      const dateA = a.fields.datum ? new Date(a.fields.datum).getTime() : 0;
      const dateB = b.fields.datum ? new Date(b.fields.datum).getTime() : 0;
      return dateB - dateA;
    })[0];

  const currentWeight = latestKoerperdaten?.fields.gewicht_kg || null;

  // Weight trend (last 30 days)
  const weightData = data.koerperdaten
    .filter(k => k.fields.gewicht_kg !== undefined && k.fields.datum)
    .sort((a, b) => {
      const dateA = new Date(a.fields.datum!).getTime();
      const dateB = new Date(b.fields.datum!).getTime();
      return dateA - dateB;
    })
    .slice(-30)
    .map(k => ({
      datum: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg
    }));

  // Weight change
  let weightChange = null;
  if (weightData.length >= 2) {
    const firstWeight = weightData[0].gewicht!;
    const lastWeight = weightData[weightData.length - 1].gewicht!;
    weightChange = lastWeight - firstWeight;
  }

  // Active goal
  const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv') || data.ziele[0];

  // Goal progress
  const goalProgress = activeGoal ? {
    kalorien: activeGoal.fields.taeglich_kalorien
      ? Math.round((totalCaloriesToday / activeGoal.fields.taeglich_kalorien) * 100)
      : 0,
    protein: activeGoal.fields.taeglich_protein
      ? Math.round((totalProteinToday / activeGoal.fields.taeglich_protein) * 100)
      : 0,
    trainingstage: activeGoal.fields.trainingstage_pro_woche
      ? Math.round((totalWorkoutsThisWeek / activeGoal.fields.trainingstage_pro_woche) * 100)
      : 0
  } : null;

  // Training frequency (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const workoutsOnDay = data.workouts.filter(w => w.fields.datum === dateStr);
    return {
      tag: format(date, 'EEE', { locale: de }),
      workouts: workoutsOnDay.length,
      minuten: workoutsOnDay.reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0)
    };
  });

  // Macros distribution today
  const macrosData = nutritionToday.length > 0 ? [
    { name: 'Protein', wert: nutritionToday.reduce((sum, e) => sum + (e.fields.protein || 0), 0), color: '#ef4444' },
    { name: 'Carbs', wert: nutritionToday.reduce((sum, e) => sum + (e.fields.carbs || 0), 0), color: '#3b82f6' },
    { name: 'Fett', wert: nutritionToday.reduce((sum, e) => sum + (e.fields.fett || 0), 0), color: '#eab308' }
  ].filter(m => m.wert > 0) : [];

  // Workout mood distribution (this week)
  const moodCounts: Record<string, number> = {};
  workoutsThisWeek.forEach(w => {
    if (w.fields.stimmung) {
      moodCounts[w.fields.stimmung] = (moodCounts[w.fields.stimmung] || 0) + 1;
    }
  });
  const moodData = Object.entries(moodCounts).map(([stimmung, count]) => ({
    stimmung,
    anzahl: count
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness Dashboard</h1>
          <p className="text-muted-foreground">
            {format(today, 'PPP', { locale: de })}
          </p>
        </div>

        {/* Quick Action Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Workout hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Neues Workout</DialogTitle>
              <DialogDescription>
                Erfasse dein heutiges Training
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
                <Label htmlFor="typ">Trainingstyp *</Label>
                <Select value={newWorkout.typ} onValueChange={(value) => setNewWorkout({ ...newWorkout, typ: value })}>
                  <SelectTrigger id="typ">
                    <SelectValue placeholder="Wähle einen Typ..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kraft">Kraft</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="stretching">Stretching</SelectItem>
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
                <Label htmlFor="stimmung">Stimmung *</Label>
                <Select value={newWorkout.stimmung} onValueChange={(value) => setNewWorkout({ ...newWorkout, stimmung: value })}>
                  <SelectTrigger id="stimmung">
                    <SelectValue placeholder="Wie war das Training?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent 🔥</SelectItem>
                    <SelectItem value="good">Gut 👍</SelectItem>
                    <SelectItem value="okay">Okay ✅</SelectItem>
                    <SelectItem value="tired">Müde 😴</SelectItem>
                    <SelectItem value="struggling">Schwer 😓</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rest_day"
                  type="checkbox"
                  checked={newWorkout.rest_day}
                  onChange={(e) => setNewWorkout({ ...newWorkout, rest_day: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="rest_day" className="cursor-pointer">
                  Ruhetag (Regeneration)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateWorkout} disabled={submitting}>
                {submitting ? 'Speichern...' : 'Workout speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Workouts this week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkoutsThisWeek}</div>
            {activeGoal?.fields.trainingstage_pro_woche && (
              <p className="text-xs text-muted-foreground">
                Ziel: {activeGoal.fields.trainingstage_pro_woche} / Woche
                {goalProgress && (
                  <Badge variant={goalProgress.trainingstage >= 100 ? "default" : "secondary"} className="ml-2">
                    {goalProgress.trainingstage}%
                  </Badge>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Training time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trainingszeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrainingMinutes} min</div>
            <p className="text-xs text-muted-foreground">
              Diese Woche ({Math.round(totalTrainingMinutes / 60 * 10) / 10} Stunden)
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
            <div className="text-2xl font-bold">{totalCaloriesToday} kcal</div>
            {activeGoal?.fields.taeglich_kalorien && (
              <p className="text-xs text-muted-foreground">
                Ziel: {activeGoal.fields.taeglich_kalorien} kcal
                {goalProgress && (
                  <Badge variant={goalProgress.kalorien >= 90 && goalProgress.kalorien <= 110 ? "default" : "secondary"} className="ml-2">
                    {goalProgress.kalorien}%
                  </Badge>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current weight */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentWeight ? `${currentWeight} kg` : '-'}
            </div>
            {weightChange !== null && (
              <div className="flex items-center text-xs">
                {weightChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">+{weightChange.toFixed(1)} kg</span>
                  </>
                ) : weightChange < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">{weightChange.toFixed(1)} kg</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Keine Änderung</span>
                )}
                <span className="text-muted-foreground ml-1">(30 Tage)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weight Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Gewichtsverlauf</CardTitle>
            <CardDescription>Letzte 30 Messungen</CardDescription>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datum" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gewicht" stroke="#8884d8" name="Gewicht (kg)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Scale className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Noch keine Körperdaten erfasst</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Trainingsfrequenz</CardTitle>
            <CardDescription>Letzte 7 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tag" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="minuten" fill="#10b981" name="Minuten" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Macros Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Makronährstoffe heute</CardTitle>
            <CardDescription>
              Protein: {totalProteinToday}g
              {activeGoal?.fields.taeglich_protein && ` / ${activeGoal.fields.taeglich_protein}g`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {macrosData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={macrosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="wert"
                  >
                    {macrosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Utensils className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Noch keine Mahlzeiten heute erfasst</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Mood */}
        <Card>
          <CardHeader>
            <CardTitle>Workout-Stimmung</CardTitle>
            <CardDescription>Diese Woche</CardDescription>
          </CardHeader>
          <CardContent>
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stimmung" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="anzahl" fill="#f59e0b" name="Anzahl" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Noch keine Workouts diese Woche</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Goal Card */}
      {activeGoal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aktives Ziel</CardTitle>
                <CardDescription>Deine aktuellen Fitness-Ziele</CardDescription>
              </div>
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {activeGoal.fields.taeglich_kalorien && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tägliche Kalorien</div>
                  <div className="text-2xl font-bold">{activeGoal.fields.taeglich_kalorien} kcal</div>
                  {goalProgress && (
                    <Badge variant={goalProgress.kalorien >= 90 && goalProgress.kalorien <= 110 ? "default" : "secondary"} className="mt-1">
                      {goalProgress.kalorien}% erreicht
                    </Badge>
                  )}
                </div>
              )}
              {activeGoal.fields.taeglich_protein && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tägliches Protein</div>
                  <div className="text-2xl font-bold">{activeGoal.fields.taeglich_protein} g</div>
                  {goalProgress && (
                    <Badge variant={goalProgress.protein >= 100 ? "default" : "secondary"} className="mt-1">
                      {goalProgress.protein}% erreicht
                    </Badge>
                  )}
                </div>
              )}
              {activeGoal.fields.trainingstage_pro_woche && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Trainingstage / Woche</div>
                  <div className="text-2xl font-bold">{activeGoal.fields.trainingstage_pro_woche}</div>
                  {goalProgress && (
                    <Badge variant={goalProgress.trainingstage >= 100 ? "default" : "secondary"} className="mt-1">
                      {goalProgress.trainingstage}% erreicht
                    </Badge>
                  )}
                </div>
              )}
              {activeGoal.fields.schlaf_ziel_stunden && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Schlafziel</div>
                  <div className="text-2xl font-bold">{activeGoal.fields.schlaf_ziel_stunden} h</div>
                </div>
              )}
            </div>
            {activeGoal.fields.notizen && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-1">Notizen</div>
                <p className="text-sm">{activeGoal.fields.notizen}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik-Übersicht</CardTitle>
          <CardDescription>Gesamtübersicht deiner Daten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.workouts.length}</div>
              <div className="text-xs text-muted-foreground">Workouts gesamt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.uebungen.length}</div>
              <div className="text-xs text-muted-foreground">Übungen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.workoutLogs.length}</div>
              <div className="text-xs text-muted-foreground">Workout-Logs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.ernaehrung.length}</div>
              <div className="text-xs text-muted-foreground">Mahlzeiten</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{data.koerperdaten.length}</div>
              <div className="text-xs text-muted-foreground">Körpermessungen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.ziele.length}</div>
              <div className="text-xs text-muted-foreground">Ziele</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
