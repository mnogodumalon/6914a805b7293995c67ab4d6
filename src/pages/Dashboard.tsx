import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Ziele, Koerperdaten, Uebungen, WorkoutLogs } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Dumbbell,
  Apple,
  Target,
  Activity,
  Calendar,
  Clock,
  Flame,
  Scale,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

// Konstanten für Lookup-Labels
const TRAININGSTYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

const STIMMUNG_LABELS: Record<string, string> = {
  schlecht: 'Schlecht',
  okay: 'Okay',
  gut: 'Gut',
  brutal: 'Brutal',
};

const MAHLZEIT_TYP_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
};

// Chart Colors
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new workout
  const [newWorkout, setNewWorkout] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as const,
    dauer_minuten: 60,
    stimmung: 'gut' as const,
    rest_day: false,
  });

  // Lade alle Daten
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);

      const [
        workoutsData,
        ernaehrungData,
        zieleData,
        koerperdatenData,
        uebungenData,
        workoutLogsData,
      ] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getZiele(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkoutLogs(),
      ]);

      setWorkouts(workoutsData);
      setErnaehrung(ernaehrungData);
      setZiele(zieleData);
      setKoerperdaten(koerperdatenData);
      setUebungen(uebungenData);
      setWorkoutLogs(workoutLogsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  // Handle form submission
  async function handleCreateWorkout() {
    try {
      setSubmitting(true);
      await LivingAppsService.createWorkout({
        datum: newWorkout.datum,
        typ: newWorkout.typ,
        dauer_minuten: newWorkout.dauer_minuten,
        stimmung: newWorkout.stimmung,
        rest_day: newWorkout.rest_day,
      });

      // Reload data
      await loadAllData();

      // Close dialog and reset form
      setDialogOpen(false);
      setNewWorkout({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: 60,
        stimmung: 'gut',
        rest_day: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Workouts');
    } finally {
      setSubmitting(false);
    }
  }

  // ============ BERECHNUNGEN ============

  // Aktives Ziel
  const aktivesZiel = ziele.find((z) => z.fields.status === 'aktiv');

  // Heutiges Datum
  const heute = format(new Date(), 'yyyy-MM-dd');

  // Workouts der letzten 7 Tage
  const letzteWoche = subDays(new Date(), 7);
  const workoutsLetzteWoche = workouts.filter((w) => {
    if (!w.fields.datum) return false;
    const datum = parseISO(w.fields.datum);
    return datum >= letzteWoche;
  });

  // Ernährung von heute
  const ernaehrungHeute = ernaehrung.filter((e) => e.fields.datum === heute);
  const kalorienHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const proteinHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  // Trainingstage diese Woche
  const wocheStart = startOfWeek(new Date(), { locale: de });
  const wocheEnde = endOfWeek(new Date(), { locale: de });
  const trainingstageWoche = workouts.filter((w) => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    const datum = parseISO(w.fields.datum);
    return isWithinInterval(datum, { start: wocheStart, end: wocheEnde });
  }).length;

  // Aktuelles Gewicht (neuester Eintrag)
  const sortedKoerperdaten = [...koerperdaten].sort((a, b) => {
    const dateA = a.fields.datum ? new Date(a.fields.datum).getTime() : 0;
    const dateB = b.fields.datum ? new Date(b.fields.datum).getTime() : 0;
    return dateB - dateA;
  });
  const aktuellesGewicht = sortedKoerperdaten[0]?.fields.gewicht_kg;
  const vorherigGewicht = sortedKoerperdaten[1]?.fields.gewicht_kg;
  const gewichtTrend =
    aktuellesGewicht && vorherigGewicht ? aktuellesGewicht - vorherigGewicht : null;

  // Gesamtdauer der Workouts letzte 7 Tage
  const gesamtDauer = workoutsLetzteWoche.reduce(
    (sum, w) => sum + (w.fields.dauer_minuten || 0),
    0
  );

  // Trainingstyp-Verteilung
  const typVerteilung: Record<string, number> = {};
  workouts.forEach((w) => {
    if (w.fields.typ && !w.fields.rest_day) {
      typVerteilung[w.fields.typ] = (typVerteilung[w.fields.typ] || 0) + 1;
    }
  });
  const typVerteilungData = Object.entries(typVerteilung).map(([typ, count]) => ({
    name: TRAININGSTYP_LABELS[typ] || typ,
    value: count,
  }));

  // Gewichtsverlauf letzte 30 Tage
  const letzter30Tage = subDays(new Date(), 30);
  const gewichtsverlauf = koerperdaten
    .filter((k) => {
      if (!k.fields.datum) return false;
      const datum = parseISO(k.fields.datum);
      return datum >= letzter30Tage;
    })
    .sort((a, b) => {
      const dateA = a.fields.datum ? new Date(a.fields.datum).getTime() : 0;
      const dateB = b.fields.datum ? new Date(b.fields.datum).getTime() : 0;
      return dateA - dateB;
    })
    .map((k) => ({
      datum: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
      gewicht: k.fields.gewicht_kg || 0,
    }));

  // Kalorien & Protein letzte 7 Tage
  const naehrwerteVerlauf = Array.from({ length: 7 }, (_, i) => {
    const datum = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const eintraege = ernaehrung.filter((e) => e.fields.datum === datum);
    return {
      datum: format(subDays(new Date(), 6 - i), 'dd.MM', { locale: de }),
      kalorien: eintraege.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0),
      protein: eintraege.reduce((sum, e) => sum + (e.fields.protein || 0), 0),
    };
  });

  // Top Übungen nach Volumen
  const uebungVolumen: Record<string, { name: string; volumen: number }> = {};
  workoutLogs.forEach((log) => {
    const uebungId = log.fields.uebung;
    if (!uebungId) return;

    // Extract record ID from URL
    const parts = uebungId.split('/');
    const recordId = parts[parts.length - 1];

    const uebung = uebungen.find((u) => u.record_id === recordId);
    if (!uebung) return;

    const volumen = (log.fields.gewicht || 0) * (log.fields.wiederholungen || 0);
    if (!uebungVolumen[recordId]) {
      uebungVolumen[recordId] = { name: uebung.fields.name || 'Unbekannt', volumen: 0 };
    }
    uebungVolumen[recordId].volumen += volumen;
  });

  const topUebungen = Object.values(uebungVolumen)
    .sort((a, b) => b.volumen - a.volumen)
    .slice(0, 5)
    .map((u) => ({
      name: u.name,
      volumen: Math.round(u.volumen),
    }));

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Fehler beim Laden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={loadAllData} variant="outline" className="w-full">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fitness & Ernährungs-Tracker</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <PlusCircle className="w-5 h-5" />
                Neues Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neues Workout erstellen</DialogTitle>
                <DialogDescription>
                  Füge ein neues Workout zu deinem Trainingsplan hinzu.
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
                    onValueChange={(value) =>
                      setNewWorkout({ ...newWorkout, typ: value as any })
                    }
                  >
                    <SelectTrigger id="typ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRAININGSTYP_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dauer">Dauer (Minuten)</Label>
                  <Input
                    id="dauer"
                    type="number"
                    min="1"
                    value={newWorkout.dauer_minuten}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, dauer_minuten: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stimmung">Stimmung</Label>
                  <Select
                    value={newWorkout.stimmung}
                    onValueChange={(value) =>
                      setNewWorkout({ ...newWorkout, stimmung: value as any })
                    }
                  >
                    <SelectTrigger id="stimmung">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rest_day"
                    checked={newWorkout.rest_day}
                    onCheckedChange={(checked) =>
                      setNewWorkout({ ...newWorkout, rest_day: checked === true })
                    }
                  />
                  <Label htmlFor="rest_day" className="cursor-pointer">
                    Ruhetag
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleCreateWorkout}
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Erstelle...' : 'Erstellen'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aktives Ziel */}
        {aktivesZiel && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Aktive Ziele
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {aktivesZiel.fields.taeglich_kalorien && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kalorien/Tag</p>
                    <p className="text-2xl font-bold">{aktivesZiel.fields.taeglich_kalorien}</p>
                  </div>
                )}
                {aktivesZiel.fields.taeglich_protein && (
                  <div>
                    <p className="text-sm text-muted-foreground">Protein/Tag</p>
                    <p className="text-2xl font-bold">{aktivesZiel.fields.taeglich_protein}g</p>
                  </div>
                )}
                {aktivesZiel.fields.trainingstage_pro_woche && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trainings/Woche</p>
                    <p className="text-2xl font-bold">{aktivesZiel.fields.trainingstage_pro_woche}</p>
                  </div>
                )}
                {aktivesZiel.fields.schlaf_ziel_stunden && (
                  <div>
                    <p className="text-sm text-muted-foreground">Schlaf/Nacht</p>
                    <p className="text-2xl font-bold">{aktivesZiel.fields.schlaf_ziel_stunden}h</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trainingstage diese Woche */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trainingstage (Woche)</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingstageWoche}</div>
              {aktivesZiel?.fields.trainingstage_pro_woche && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ziel: {aktivesZiel.fields.trainingstage_pro_woche}/Woche
                </p>
              )}
              {aktivesZiel?.fields.trainingstage_pro_woche && (
                <div className="flex items-center gap-1 mt-2">
                  {trainingstageWoche >= aktivesZiel.fields.trainingstage_pro_woche ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Ziel erreicht!</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-500">
                        Noch {aktivesZiel.fields.trainingstage_pro_woche - trainingstageWoche} Trainings
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kalorien heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalorien (Heute)</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(kalorienHeute)}</div>
              {aktivesZiel?.fields.taeglich_kalorien && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ziel: {aktivesZiel.fields.taeglich_kalorien} kcal
                </p>
              )}
              {aktivesZiel?.fields.taeglich_kalorien && (
                <div className="flex items-center gap-1 mt-2">
                  {Math.abs(kalorienHeute - aktivesZiel.fields.taeglich_kalorien) <= 100 ? (
                    <>
                      <Minus className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Im Zielbereich</span>
                    </>
                  ) : kalorienHeute > aktivesZiel.fields.taeglich_kalorien ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-500">
                        +{Math.round(kalorienHeute - aktivesZiel.fields.taeglich_kalorien)} kcal
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-500">
                        {Math.round(kalorienHeute - aktivesZiel.fields.taeglich_kalorien)} kcal
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Protein heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein (Heute)</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(proteinHeute)}g</div>
              {aktivesZiel?.fields.taeglich_protein && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ziel: {aktivesZiel.fields.taeglich_protein}g
                </p>
              )}
              {aktivesZiel?.fields.taeglich_protein && (
                <div className="flex items-center gap-1 mt-2">
                  {proteinHeute >= aktivesZiel.fields.taeglich_protein ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Ziel erreicht!</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-500">
                        Noch {Math.round(aktivesZiel.fields.taeglich_protein - proteinHeute)}g
                      </span>
                    </>
                  )}
                </div>
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
                {aktuellesGewicht ? `${aktuellesGewicht.toFixed(1)} kg` : 'Keine Daten'}
              </div>
              {gewichtTrend !== null && (
                <div className="flex items-center gap-1 mt-2">
                  {gewichtTrend > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-500">+{gewichtTrend.toFixed(1)} kg</span>
                    </>
                  ) : gewichtTrend < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">{gewichtTrend.toFixed(1)} kg</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Unverändert</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gewichtsverlauf */}
          <Card>
            <CardHeader>
              <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
              <CardDescription>Deine Körpergewicht-Entwicklung</CardDescription>
            </CardHeader>
            <CardContent>
              {gewichtsverlauf.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gewichtsverlauf}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gewicht"
                      name="Gewicht (kg)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Gewichtsdaten vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nährwerte Verlauf */}
          <Card>
            <CardHeader>
              <CardTitle>Ernährung (7 Tage)</CardTitle>
              <CardDescription>Kalorien & Protein Verlauf</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={naehrwerteVerlauf}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datum" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="kalorien"
                    name="Kalorien"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="protein"
                    name="Protein (g)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trainingstyp Verteilung */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingstyp-Verteilung</CardTitle>
              <CardDescription>Deine Workouts nach Typ</CardDescription>
            </CardHeader>
            <CardContent>
              {typVerteilungData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typVerteilungData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typVerteilungData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Trainings-Daten vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Übungen */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Übungen</CardTitle>
              <CardDescription>Nach Gesamtvolumen (kg × Wdh)</CardDescription>
            </CardHeader>
            <CardContent>
              {topUebungen.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topUebungen} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="volumen" name="Volumen" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Übungs-Logs vorhanden
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Letzte Workouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Letzte Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workouts
                  .filter((w) => !w.fields.rest_day)
                  .sort((a, b) => {
                    const dateA = a.fields.datum ? new Date(a.fields.datum).getTime() : 0;
                    const dateB = b.fields.datum ? new Date(b.fields.datum).getTime() : 0;
                    return dateB - dateA;
                  })
                  .slice(0, 5)
                  .map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {workout.fields.typ ? TRAININGSTYP_LABELS[workout.fields.typ] : 'N/A'}
                          </Badge>
                          {workout.fields.stimmung && (
                            <Badge
                              variant={
                                workout.fields.stimmung === 'brutal'
                                  ? 'default'
                                  : workout.fields.stimmung === 'gut'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {STIMMUNG_LABELS[workout.fields.stimmung]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workout.fields.datum
                            ? format(parseISO(workout.fields.datum), 'EEEE, dd. MMM', { locale: de })
                            : 'Kein Datum'}
                        </p>
                      </div>
                      {workout.fields.dauer_minuten && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{workout.fields.dauer_minuten} min</span>
                        </div>
                      )}
                    </div>
                  ))}
                {workouts.filter((w) => !w.fields.rest_day).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Noch keine Workouts vorhanden
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Heutige Mahlzeiten */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                Heutige Mahlzeiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ernaehrungHeute.length > 0 ? (
                  ernaehrungHeute.map((mahlzeit) => (
                    <div
                      key={mahlzeit.record_id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <Badge variant="outline">
                          {mahlzeit.fields.mahlzeit_typ
                            ? MAHLZEIT_TYP_LABELS[mahlzeit.fields.mahlzeit_typ]
                            : 'N/A'}
                        </Badge>
                        {mahlzeit.fields.beschreibung && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {mahlzeit.fields.beschreibung}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {mahlzeit.fields.kalorien && (
                          <p className="text-sm font-medium">{Math.round(mahlzeit.fields.kalorien)} kcal</p>
                        )}
                        {mahlzeit.fields.protein && (
                          <p className="text-xs text-muted-foreground">{Math.round(mahlzeit.fields.protein)}g Protein</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Noch keine Mahlzeiten heute eingetragen
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Zusammenfassung (Letzte 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Workouts</p>
                <p className="text-3xl font-bold mt-1">{workoutsLetzteWoche.length}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Trainingszeit</p>
                <p className="text-3xl font-bold mt-1">{Math.round(gesamtDauer / 60)}h</p>
                <p className="text-xs text-muted-foreground mt-1">{gesamtDauer} min</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Übungen verfügbar</p>
                <p className="text-3xl font-bold mt-1">{uebungen.length}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Workout-Logs</p>
                <p className="text-3xl font-bold mt-1">{workoutLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
