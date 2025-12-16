import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, Uebungen, WorkoutLogs } from '@/types/app';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Apple,
  Scale,
  Target,
  Calendar,
  Activity,
  Plus,
  Loader2,
} from 'lucide-react';
import { format, subDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

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

  // Form States für Quick-Add Workout Dialog
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: '',
    dauer_minuten: '',
    stimmung: '',
    rest_day: false,
  });

  // Daten laden
  const loadData = async () => {
    try {
      setLoading(true);
      const [workouts, ernaehrung, koerperdaten, ziele, uebungen, workoutLogs] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getWorkoutLogs(),
      ]);

      setData({ workouts, ernaehrung, koerperdaten, ziele, uebungen, workoutLogs });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick-Add Workout Handler
  const handleQuickAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createWorkout({
        datum: formData.datum,
        typ: formData.typ || undefined,
        dauer_minuten: formData.dauer_minuten ? Number(formData.dauer_minuten) : undefined,
        stimmung: formData.stimmung || undefined,
        rest_day: formData.rest_day,
      });

      // Dialog schließen und Daten neu laden
      setDialogOpen(false);
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: '',
        dauer_minuten: '',
        stimmung: '',
        rest_day: false,
      });
      await loadData();
    } catch (err) {
      alert('Fehler beim Erstellen des Workouts: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Lade Dashboard-Daten...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Fehler</CardTitle>
            <CardDescription>Beim Laden der Daten ist ein Fehler aufgetreten.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error || 'Keine Daten verfügbar'}</p>
            <Button onClick={loadData} variant="outline">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === BERECHNUNGEN ===
  const heute = format(new Date(), 'yyyy-MM-dd');
  const letzten7Tage = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const letzten30Tage = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  // Aktives Ziel (neuestes)
  const aktivesZiel = data.ziele.sort(
    (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
  )[0];

  // Workouts diese Woche
  const dieseWoche = data.workouts.filter((w) => {
    if (!w.fields.datum) return false;
    const datum = parseISO(w.fields.datum);
    const start = startOfWeek(new Date(), { locale: de });
    const end = endOfWeek(new Date(), { locale: de });
    return datum >= start && datum <= end;
  });

  const workoutsDieseWoche = dieseWoche.filter((w) => !w.fields.rest_day).length;
  const ruhetageDieseWoche = dieseWoche.filter((w) => w.fields.rest_day).length;

  // Trainingszeit letzte 7 Tage
  const trainingszeit7Tage = data.workouts
    .filter((w) => w.fields.datum && w.fields.datum >= letzten7Tage && !w.fields.rest_day)
    .reduce((sum, w) => sum + (w.fields.dauer_minuten || 0), 0);

  // Ernährung heute
  const ernaehrungHeute = data.ernaehrung.filter((e) => e.fields.datum === heute);
  const kalorienHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const proteinHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.protein || 0), 0);
  const carbsHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.carbs || 0), 0);
  const fettHeute = ernaehrungHeute.reduce((sum, e) => sum + (e.fields.fett || 0), 0);

  // Fortschritt zu Zielen
  const kalorienFortschritt = aktivesZiel?.fields.taeglich_kalorien
    ? (kalorienHeute / aktivesZiel.fields.taeglich_kalorien) * 100
    : 0;
  const proteinFortschritt = aktivesZiel?.fields.taeglich_protein
    ? (proteinHeute / aktivesZiel.fields.taeglich_protein) * 100
    : 0;
  const trainingstageZiel = aktivesZiel?.fields.trainingstage_pro_woche || 0;
  const trainingstageProgress = trainingstageZiel > 0 ? (workoutsDieseWoche / trainingstageZiel) * 100 : 0;

  // Körpergewicht (letzter Eintrag)
  const letzteKoerperdaten = data.koerperdaten.sort(
    (a, b) => new Date(b.fields.datum || 0).getTime() - new Date(a.fields.datum || 0).getTime()
  )[0];

  // Gewichtstrend (letzte 30 Tage)
  const gewichtsVerlauf = data.koerperdaten
    .filter((k) => k.fields.datum && k.fields.datum >= letzten30Tage)
    .sort((a, b) => new Date(a.fields.datum || 0).getTime() - new Date(b.fields.datum || 0).getTime())
    .map((k) => ({
      datum: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
      gewicht: k.fields.gewicht_kg || 0,
    }));

  // Trainingstypen Verteilung (letzte 30 Tage)
  const workoutsLetzter30Tage = data.workouts.filter(
    (w) => w.fields.datum && w.fields.datum >= letzten30Tage && !w.fields.rest_day
  );
  const typVerteilung = workoutsLetzter30Tage.reduce((acc, w) => {
    const typ = w.fields.typ || 'Unbekannt';
    acc[typ] = (acc[typ] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typChartData = Object.entries(typVerteilung).map(([name, value]) => ({
    name,
    value,
  }));

  // Kalorien Trend (letzte 7 Tage)
  const kalorienTrend = Array.from({ length: 7 }, (_, i) => {
    const datum = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const tagEintraege = data.ernaehrung.filter((e) => e.fields.datum === datum);
    const kalorien = tagEintraege.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
    return {
      datum: format(parseISO(datum), 'dd.MM', { locale: de }),
      kalorien,
      ziel: aktivesZiel?.fields.taeglich_kalorien || 0,
    };
  });

  // Makronährstoffe heute (für Pie Chart)
  const makrosHeute = [
    { name: 'Protein', value: proteinHeute * 4, gramm: proteinHeute },
    { name: 'Kohlenhydrate', value: carbsHeute * 4, gramm: carbsHeute },
    { name: 'Fett', value: fettHeute * 9, gramm: fettHeute },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Top Übungen (nach Anzahl Logs)
  const uebungCounts = data.workoutLogs.reduce((acc, log) => {
    const uebungId = extractRecordId(log.fields.uebung);
    if (!uebungId) return acc;
    acc[uebungId] = (acc[uebungId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUebungen = Object.entries(uebungCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const uebung = data.uebungen.find((u) => u.record_id === id);
      return {
        name: uebung?.fields.name || 'Unbekannt',
        count,
      };
    });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fitness & Ernährungs-Tracker</h1>
            <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}</p>
          </div>

          {/* Quick Action Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Workout hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neues Workout hinzufügen</DialogTitle>
                <DialogDescription>Erfasse schnell dein heutiges Training</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuickAddWorkout} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={formData.datum}
                    onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typ">Trainingstyp</Label>
                  <Select value={formData.typ} onValueChange={(value) => setFormData({ ...formData, typ: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="krafttraining">Krafttraining</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="stretching">Stretching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dauer">Dauer (Minuten)</Label>
                  <Input
                    id="dauer"
                    type="number"
                    value={formData.dauer_minuten}
                    onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
                    placeholder="z.B. 60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stimmung">Stimmung</Label>
                  <Select
                    value={formData.stimmung}
                    onValueChange={(value) => setFormData({ ...formData, stimmung: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wie fühlst du dich?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Ausgezeichnet</SelectItem>
                      <SelectItem value="good">Gut</SelectItem>
                      <SelectItem value="okay">Okay</SelectItem>
                      <SelectItem value="tired">Müde</SelectItem>
                      <SelectItem value="exhausted">Erschöpft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="rest_day"
                    type="checkbox"
                    checked={formData.rest_day}
                    onChange={(e) => setFormData({ ...formData, rest_day: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="rest_day" className="cursor-pointer">
                    Ruhetag
                  </Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichern...
                      </>
                    ) : (
                      'Speichern'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Workouts diese Woche */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
              <Dumbbell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workoutsDieseWoche}</div>
              <div className="flex items-center gap-2 mt-1">
                {trainingstageZiel > 0 && (
                  <>
                    <div className="text-xs text-gray-600">Ziel: {trainingstageZiel}</div>
                    {workoutsDieseWoche >= trainingstageZiel ? (
                      <Badge variant="default" className="text-xs bg-green-600">
                        Erreicht!
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {trainingstageZiel - workoutsDieseWoche} übrig
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {ruhetageDieseWoche > 0 && (
                <p className="text-xs text-gray-500 mt-2">{ruhetageDieseWoche} Ruhetag(e)</p>
              )}
            </CardContent>
          </Card>

          {/* Kalorien heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalorien heute</CardTitle>
              <Apple className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(kalorienHeute)}</div>
              {aktivesZiel?.fields.taeglich_kalorien && (
                <>
                  <div className="text-xs text-gray-600 mt-1">
                    von {aktivesZiel.fields.taeglich_kalorien} kcal
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        kalorienFortschritt >= 100 ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(kalorienFortschritt, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.round(kalorienFortschritt)}%</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Protein heute */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein heute</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(proteinHeute)}g</div>
              {aktivesZiel?.fields.taeglich_protein && (
                <>
                  <div className="text-xs text-gray-600 mt-1">von {aktivesZiel.fields.taeglich_protein}g</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        proteinFortschritt >= 100 ? 'bg-green-600' : 'bg-orange-600'
                      }`}
                      style={{ width: `${Math.min(proteinFortschritt, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.round(proteinFortschritt)}%</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Aktuelles Gewicht */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {letzteKoerperdaten?.fields.gewicht_kg?.toFixed(1) || '--'} kg
              </div>
              {letzteKoerperdaten?.fields.datum && (
                <p className="text-xs text-gray-600 mt-1">
                  {format(parseISO(letzteKoerperdaten.fields.datum), 'dd.MM.yyyy', { locale: de })}
                </p>
              )}
              {letzteKoerperdaten?.fields.kfa_geschaetzt && (
                <p className="text-xs text-gray-500 mt-1">KFA: {letzteKoerperdaten.fields.kfa_geschaetzt}%</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="ernaehrung" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ernaehrung">Ernährung</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="koerper">Körper</TabsTrigger>
          </TabsList>

          {/* Ernährungs-Tab */}
          <TabsContent value="ernaehrung" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Kalorien Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Kalorien Trend (7 Tage)</CardTitle>
                  <CardDescription>Deine tägliche Kalorienaufnahme vs. Ziel</CardDescription>
                </CardHeader>
                <CardContent>
                  {kalorienTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={kalorienTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="datum" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="kalorien" stroke="#3b82f6" name="Kalorien" strokeWidth={2} />
                        {aktivesZiel?.fields.taeglich_kalorien && (
                          <Line type="monotone" dataKey="ziel" stroke="#10b981" name="Ziel" strokeDasharray="5 5" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Apple className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Keine Ernährungsdaten der letzten 7 Tage</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Makronährstoffe heute */}
              <Card>
                <CardHeader>
                  <CardTitle>Makronährstoffe heute</CardTitle>
                  <CardDescription>Verteilung in Kalorien</CardDescription>
                </CardHeader>
                <CardContent>
                  {kalorienHeute > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={makrosHeute}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {makrosHeute.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${Math.round(value)} kcal`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-semibold text-blue-600">{Math.round(proteinHeute)}g</div>
                          <div className="text-gray-600">Protein</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{Math.round(carbsHeute)}g</div>
                          <div className="text-gray-600">Carbs</div>
                        </div>
                        <div>
                          <div className="font-semibold text-orange-600">{Math.round(fettHeute)}g</div>
                          <div className="text-gray-600">Fett</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Noch keine Mahlzeiten heute erfasst</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training-Tab */}
          <TabsContent value="training" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Trainingstypen Verteilung */}
              <Card>
                <CardHeader>
                  <CardTitle>Trainingstypen (30 Tage)</CardTitle>
                  <CardDescription>Welche Trainingsarten hast du gemacht?</CardDescription>
                </CardHeader>
                <CardContent>
                  {typChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={typChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Anzahl" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Dumbbell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Keine Workouts der letzten 30 Tage</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Übungen */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Übungen</CardTitle>
                  <CardDescription>Deine meistgemachten Übungen</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUebungen.length > 0 ? (
                    <div className="space-y-3">
                      {topUebungen.map((uebung, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{uebung.name}</div>
                              <div className="text-sm text-gray-600">{uebung.count} Sätze</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Noch keine Workout-Logs erfasst</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trainingsstatistiken */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Trainingsstatistiken</CardTitle>
                  <CardDescription>Deine Trainingsdaten im Überblick</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{data.workouts.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Gesamt Workouts</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{Math.round(trainingszeit7Tage)}</div>
                      <div className="text-sm text-gray-600 mt-1">Min. (7 Tage)</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{data.uebungen.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Übungen verfügbar</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{data.workoutLogs.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Gesamt Logs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Körper-Tab */}
          <TabsContent value="koerper" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gewichtsverlauf */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
                  <CardDescription>Deine Gewichtsentwicklung im letzten Monat</CardDescription>
                </CardHeader>
                <CardContent>
                  {gewichtsVerlauf.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={gewichtsVerlauf}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="datum" />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="gewicht" stroke="#8b5cf6" name="Gewicht (kg)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Scale className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Keine Körperdaten der letzten 30 Tage</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Aktuelle Körpermaße */}
              <Card>
                <CardHeader>
                  <CardTitle>Aktuelle Körpermaße</CardTitle>
                  <CardDescription>
                    {letzteKoerperdaten?.fields.datum
                      ? format(parseISO(letzteKoerperdaten.fields.datum), 'dd.MM.yyyy', { locale: de })
                      : 'Keine Daten'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {letzteKoerperdaten ? (
                    <div className="space-y-3">
                      {letzteKoerperdaten.fields.brustumfang && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brust:</span>
                          <span className="font-semibold">{letzteKoerperdaten.fields.brustumfang} cm</span>
                        </div>
                      )}
                      {letzteKoerperdaten.fields.taillenumfang && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taille:</span>
                          <span className="font-semibold">{letzteKoerperdaten.fields.taillenumfang} cm</span>
                        </div>
                      )}
                      {letzteKoerperdaten.fields.hueftumfang && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hüfte:</span>
                          <span className="font-semibold">{letzteKoerperdaten.fields.hueftumfang} cm</span>
                        </div>
                      )}
                      {letzteKoerperdaten.fields.armumfang && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Arm:</span>
                          <span className="font-semibold">{letzteKoerperdaten.fields.armumfang} cm</span>
                        </div>
                      )}
                      {letzteKoerperdaten.fields.beinumfang && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bein:</span>
                          <span className="font-semibold">{letzteKoerperdaten.fields.beinumfang} cm</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <p>Noch keine Körperdaten erfasst</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ziele */}
              <Card>
                <CardHeader>
                  <CardTitle>Aktive Ziele</CardTitle>
                  <CardDescription>Deine aktuellen Fitness- und Ernährungsziele</CardDescription>
                </CardHeader>
                <CardContent>
                  {aktivesZiel ? (
                    <div className="space-y-3">
                      {aktivesZiel.fields.taeglich_kalorien && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Kalorien/Tag:</span>
                          <span className="font-semibold">{aktivesZiel.fields.taeglich_kalorien} kcal</span>
                        </div>
                      )}
                      {aktivesZiel.fields.taeglich_protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Protein/Tag:</span>
                          <span className="font-semibold">{aktivesZiel.fields.taeglich_protein}g</span>
                        </div>
                      )}
                      {aktivesZiel.fields.trainingstage_pro_woche && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Training/Woche:</span>
                          <span className="font-semibold">{aktivesZiel.fields.trainingstage_pro_woche}x</span>
                        </div>
                      )}
                      {aktivesZiel.fields.schlaf_ziel_stunden && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Schlaf/Nacht:</span>
                          <span className="font-semibold">{aktivesZiel.fields.schlaf_ziel_stunden}h</span>
                        </div>
                      )}
                      {aktivesZiel.fields.status && (
                        <div className="mt-4 pt-4 border-t">
                          <Badge className="w-full justify-center">{aktivesZiel.fields.status}</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Noch keine Ziele definiert</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
