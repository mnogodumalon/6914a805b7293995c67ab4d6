import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele, WorkoutLogs, Uebungen } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Activity,
  Apple,
  Scale,
  Target,
  Calendar,
  Clock,
  Flame,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Lookup-Daten-Mappings aus den Metadaten
const LOOKUP_LABELS = {
  muskelgruppe: {
    brust: 'Brust',
    ruecken: 'Rücken',
    beine: 'Beine',
    schultern: 'Schultern',
    bizeps: 'Bizeps',
    trizeps: 'Trizeps',
    bauch: 'Bauch',
    ganzkoerper: 'Ganzkörper',
  },
  trainingstyp: {
    push: 'Push',
    pull: 'Pull',
    beine: 'Beine',
    ganzkoerper: 'Ganzkörper',
    oberkoerper: 'Oberkörper',
    unterkoerper: 'Unterkörper',
    cardio: 'Cardio',
    sonstiges: 'Sonstiges',
  },
  stimmung: {
    schlecht: 'Schlecht',
    okay: 'Okay',
    gut: 'Gut',
    brutal: 'Brutal',
  },
  mahlzeit_typ: {
    fruehstueck: 'Frühstück',
    snack: 'Snack',
    mittagessen: 'Mittagessen',
    abendessen: 'Abendessen',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
    sonstiges: 'Sonstiges',
  },
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State für alle Daten
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);

  // Dialog States für Quick Actions
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [ernaehrungDialogOpen, setErnaehrungDialogOpen] = useState(false);
  const [koerperDialogOpen, setKoerperDialogOpen] = useState(false);

  // Form States
  const [workoutForm, setWorkoutForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    typ: 'push' as const,
    dauer_minuten: '',
    stimmung: 'gut' as const,
    rest_day: false,
  });

  const [ernaehrungForm, setErnaehrungForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    mahlzeit_typ: 'mittagessen' as const,
    beschreibung: '',
    kalorien: '',
    protein: '',
    carbs: '',
    fett: '',
  });

  const [koerperForm, setKoerperForm] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    gewicht_kg: '',
    kfa_geschaetzt: '',
    notizen: '',
  });

  // Daten laden
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  // --- WORKOUT ERSTELLEN ---
  const handleCreateWorkout = async () => {
    try {
      await LivingAppsService.createWorkout({
        datum: workoutForm.datum,
        typ: workoutForm.typ,
        dauer_minuten: workoutForm.dauer_minuten ? Number(workoutForm.dauer_minuten) : undefined,
        stimmung: workoutForm.stimmung,
        rest_day: workoutForm.rest_day,
      });
      setWorkoutDialogOpen(false);
      setWorkoutForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        typ: 'push',
        dauer_minuten: '',
        stimmung: 'gut',
        rest_day: false,
      });
      await loadAllData();
    } catch (err) {
      alert('Fehler beim Erstellen des Workouts: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  // --- ERNÄHRUNG ERSTELLEN ---
  const handleCreateErnaehrung = async () => {
    try {
      await LivingAppsService.createErnaehrungEntry({
        datum: ernaehrungForm.datum,
        mahlzeit_typ: ernaehrungForm.mahlzeit_typ,
        beschreibung: ernaehrungForm.beschreibung || undefined,
        kalorien: ernaehrungForm.kalorien ? Number(ernaehrungForm.kalorien) : undefined,
        protein: ernaehrungForm.protein ? Number(ernaehrungForm.protein) : undefined,
        carbs: ernaehrungForm.carbs ? Number(ernaehrungForm.carbs) : undefined,
        fett: ernaehrungForm.fett ? Number(ernaehrungForm.fett) : undefined,
      });
      setErnaehrungDialogOpen(false);
      setErnaehrungForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        mahlzeit_typ: 'mittagessen',
        beschreibung: '',
        kalorien: '',
        protein: '',
        carbs: '',
        fett: '',
      });
      await loadAllData();
    } catch (err) {
      alert('Fehler beim Erstellen der Mahlzeit: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  // --- KÖRPERDATEN ERSTELLEN ---
  const handleCreateKoerperdaten = async () => {
    try {
      await LivingAppsService.createKoerperdatenEntry({
        datum: koerperForm.datum,
        gewicht_kg: koerperForm.gewicht_kg ? Number(koerperForm.gewicht_kg) : undefined,
        kfa_geschaetzt: koerperForm.kfa_geschaetzt ? Number(koerperForm.kfa_geschaetzt) : undefined,
        notizen: koerperForm.notizen || undefined,
      });
      setKoerperDialogOpen(false);
      setKoerperForm({
        datum: format(new Date(), 'yyyy-MM-dd'),
        gewicht_kg: '',
        kfa_geschaetzt: '',
        notizen: '',
      });
      await loadAllData();
    } catch (err) {
      alert('Fehler beim Erstellen der Körperdaten: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  // --- BERECHNUNGEN ---
  const today = format(new Date(), 'yyyy-MM-dd');
  const thisWeekStart = startOfWeek(new Date(), { locale: de });
  const thisWeekEnd = endOfWeek(new Date(), { locale: de });

  // Aktives Ziel (Status "aktiv")
  const activeGoal = ziele.find((z) => z.fields.status === 'aktiv');

  // Workouts diese Woche
  const workoutsThisWeek = workouts.filter((w) => {
    if (!w.fields.datum) return false;
    const date = parseISO(w.fields.datum);
    return isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd });
  });

  // Ernährung heute
  const ernaehrungToday = ernaehrung.filter((e) => e.fields.datum === today);
  const kalorienToday = ernaehrungToday.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const proteinToday = ernaehrungToday.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  // Aktuelles Gewicht (neuester Eintrag)
  const latestKoerperdaten = koerperdaten.sort((a, b) => {
    const dateA = a.fields.datum || '';
    const dateB = b.fields.datum || '';
    return dateB.localeCompare(dateA);
  })[0];

  // Gewichtsverlauf (letzte 30 Tage)
  const gewichtVerlauf = koerperdaten
    .filter((k) => k.fields.datum && k.fields.gewicht_kg)
    .sort((a, b) => (a.fields.datum || '').localeCompare(b.fields.datum || ''))
    .slice(-30)
    .map((k) => ({
      datum: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM', { locale: de }) : '',
      gewicht: k.fields.gewicht_kg,
      kfa: k.fields.kfa_geschaetzt,
    }));

  // Gewichts-Trend (Vergleich mit vor 7 Tagen)
  const gewichtVor7Tagen = koerperdaten
    .filter((k) => k.fields.datum && k.fields.gewicht_kg)
    .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
    .find((k) => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      return date < subDays(new Date(), 5); // ungefähr 7 Tage
    });
  const gewichtTrend =
    latestKoerperdaten && gewichtVor7Tagen
      ? (latestKoerperdaten.fields.gewicht_kg || 0) - (gewichtVor7Tagen.fields.gewicht_kg || 0)
      : null;

  // Trainingsfrequenz letzte 7 Tage
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const workoutsOnDay = workouts.filter((w) => w.fields.datum === dateStr && !w.fields.rest_day).length;
    return {
      datum: format(date, 'EE', { locale: de }),
      workouts: workoutsOnDay,
    };
  });

  // Trainingstyp-Verteilung (diese Woche)
  const trainingsTypen: Record<string, number> = {};
  workoutsThisWeek.forEach((w) => {
    const typ = w.fields.typ || 'sonstiges';
    trainingsTypen[typ] = (trainingsTypen[typ] || 0) + 1;
  });
  const trainingsTypenChart = Object.entries(trainingsTypen).map(([typ, count]) => ({
    name: LOOKUP_LABELS.trainingstyp[typ as keyof typeof LOOKUP_LABELS.trainingstyp] || typ,
    value: count,
  }));

  // Makro-Verteilung heute
  const makrosToday = {
    protein: proteinToday,
    carbs: ernaehrungToday.reduce((sum, e) => sum + (e.fields.carbs || 0), 0),
    fett: ernaehrungToday.reduce((sum, e) => sum + (e.fields.fett || 0), 0),
  };
  const makrosChart = [
    { name: 'Protein', value: makrosToday.protein, color: COLORS.success },
    { name: 'Kohlenhydrate', value: makrosToday.carbs, color: COLORS.primary },
    { name: 'Fett', value: makrosToday.fett, color: COLORS.warning },
  ].filter((m) => m.value > 0);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={loadAllData}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness & Ernährungs-Tracker</h1>
          <p className="text-muted-foreground">{format(new Date(), 'PPP', { locale: de })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Dumbbell className="w-4 h-4" />
                Workout hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Workout</DialogTitle>
                <DialogDescription>Erfasse dein heutiges Training</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="workout-datum">Datum</Label>
                  <Input
                    id="workout-datum"
                    type="date"
                    value={workoutForm.datum}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, datum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout-typ">Trainingstyp</Label>
                  <Select value={workoutForm.typ} onValueChange={(val) => setWorkoutForm({ ...workoutForm, typ: val as any })}>
                    <SelectTrigger id="workout-typ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOOKUP_LABELS.trainingstyp).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout-dauer">Dauer (Minuten)</Label>
                  <Input
                    id="workout-dauer"
                    type="number"
                    value={workoutForm.dauer_minuten}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, dauer_minuten: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout-stimmung">Stimmung</Label>
                  <Select value={workoutForm.stimmung} onValueChange={(val) => setWorkoutForm({ ...workoutForm, stimmung: val as any })}>
                    <SelectTrigger id="workout-stimmung">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOOKUP_LABELS.stimmung).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWorkoutDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateWorkout}>Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={ernaehrungDialogOpen} onOpenChange={setErnaehrungDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Apple className="w-4 h-4" />
                Mahlzeit hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Mahlzeit</DialogTitle>
                <DialogDescription>Erfasse deine Ernährung</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="ern-datum">Datum</Label>
                  <Input
                    id="ern-datum"
                    type="date"
                    value={ernaehrungForm.datum}
                    onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, datum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ern-typ">Mahlzeitentyp</Label>
                  <Select
                    value={ernaehrungForm.mahlzeit_typ}
                    onValueChange={(val) => setErnaehrungForm({ ...ernaehrungForm, mahlzeit_typ: val as any })}
                  >
                    <SelectTrigger id="ern-typ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOOKUP_LABELS.mahlzeit_typ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ern-beschreibung">Beschreibung</Label>
                  <Textarea
                    id="ern-beschreibung"
                    value={ernaehrungForm.beschreibung}
                    onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, beschreibung: e.target.value })}
                    placeholder="Was hast du gegessen?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ern-kalorien">Kalorien (kcal)</Label>
                    <Input
                      id="ern-kalorien"
                      type="number"
                      value={ernaehrungForm.kalorien}
                      onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, kalorien: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ern-protein">Protein (g)</Label>
                    <Input
                      id="ern-protein"
                      type="number"
                      value={ernaehrungForm.protein}
                      onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, protein: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ern-carbs">Kohlenhydrate (g)</Label>
                    <Input
                      id="ern-carbs"
                      type="number"
                      value={ernaehrungForm.carbs}
                      onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, carbs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ern-fett">Fett (g)</Label>
                    <Input
                      id="ern-fett"
                      type="number"
                      value={ernaehrungForm.fett}
                      onChange={(e) => setErnaehrungForm({ ...ernaehrungForm, fett: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setErnaehrungDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateErnaehrung}>Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={koerperDialogOpen} onOpenChange={setKoerperDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Scale className="w-4 h-4" />
                Körperdaten hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Körperdaten</DialogTitle>
                <DialogDescription>Erfasse deine aktuellen Messungen</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="koerper-datum">Datum</Label>
                  <Input
                    id="koerper-datum"
                    type="date"
                    value={koerperForm.datum}
                    onChange={(e) => setKoerperForm({ ...koerperForm, datum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="koerper-gewicht">Gewicht (kg)</Label>
                  <Input
                    id="koerper-gewicht"
                    type="number"
                    step="0.1"
                    value={koerperForm.gewicht_kg}
                    onChange={(e) => setKoerperForm({ ...koerperForm, gewicht_kg: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="koerper-kfa">Körperfettanteil (%)</Label>
                  <Input
                    id="koerper-kfa"
                    type="number"
                    step="0.1"
                    value={koerperForm.kfa_geschaetzt}
                    onChange={(e) => setKoerperForm({ ...koerperForm, kfa_geschaetzt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="koerper-notizen">Notizen</Label>
                  <Textarea
                    id="koerper-notizen"
                    value={koerperForm.notizen}
                    onChange={(e) => setKoerperForm({ ...koerperForm, notizen: e.target.value })}
                    placeholder="Wie fühlst du dich?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKoerperDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateKoerperdaten}>Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Aktives Ziel Banner */}
      {activeGoal && (
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Deine aktuellen Ziele
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeGoal.fields.taeglich_kalorien && (
                <div>
                  <p className="text-sm text-muted-foreground">Kalorien/Tag</p>
                  <p className="text-2xl font-bold">{activeGoal.fields.taeglich_kalorien} kcal</p>
                </div>
              )}
              {activeGoal.fields.taeglich_protein && (
                <div>
                  <p className="text-sm text-muted-foreground">Protein/Tag</p>
                  <p className="text-2xl font-bold">{activeGoal.fields.taeglich_protein} g</p>
                </div>
              )}
              {activeGoal.fields.trainingstage_pro_woche && (
                <div>
                  <p className="text-sm text-muted-foreground">Trainingstage/Woche</p>
                  <p className="text-2xl font-bold">{activeGoal.fields.trainingstage_pro_woche}</p>
                </div>
              )}
              {activeGoal.fields.schlaf_ziel_stunden && (
                <div>
                  <p className="text-sm text-muted-foreground">Schlaf (Std.)</p>
                  <p className="text-2xl font-bold">{activeGoal.fields.schlaf_ziel_stunden}h</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Workouts diese Woche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutsThisWeek.length}</div>
            {activeGoal?.fields.trainingstage_pro_woche && (
              <p className="text-xs text-muted-foreground">
                Ziel: {activeGoal.fields.trainingstage_pro_woche} / Woche
                {workoutsThisWeek.length >= activeGoal.fields.trainingstage_pro_woche && (
                  <CheckCircle2 className="inline w-3 h-3 ml-1 text-success" />
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Kalorien heute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kalorien heute</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(kalorienToday)} kcal</div>
            {activeGoal?.fields.taeglich_kalorien && (
              <p className="text-xs text-muted-foreground">
                {((kalorienToday / activeGoal.fields.taeglich_kalorien) * 100).toFixed(0)}% vom Ziel ({activeGoal.fields.taeglich_kalorien}{' '}
                kcal)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Protein heute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protein heute</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(proteinToday)} g</div>
            {activeGoal?.fields.taeglich_protein && (
              <p className="text-xs text-muted-foreground">
                {((proteinToday / activeGoal.fields.taeglich_protein) * 100).toFixed(0)}% vom Ziel ({activeGoal.fields.taeglich_protein} g)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Aktuelles Gewicht */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestKoerperdaten?.fields.gewicht_kg ? `${latestKoerperdaten.fields.gewicht_kg.toFixed(1)} kg` : 'N/A'}
            </div>
            {gewichtTrend !== null && (
              <p className="text-xs flex items-center gap-1">
                {gewichtTrend > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-danger" />
                    <span className="text-danger">+{gewichtTrend.toFixed(1)} kg</span>
                  </>
                ) : gewichtTrend < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-success" />
                    <span className="text-success">{gewichtTrend.toFixed(1)} kg</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Keine Veränderung</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gewichtsverlauf */}
        <Card>
          <CardHeader>
            <CardTitle>Gewichtsverlauf (30 Tage)</CardTitle>
            <CardDescription>Deine Gewichtsentwicklung im Überblick</CardDescription>
          </CardHeader>
          <CardContent>
            {gewichtVerlauf.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gewichtVerlauf}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datum" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gewicht" stroke={COLORS.primary} name="Gewicht (kg)" strokeWidth={2} />
                  {gewichtVerlauf.some((g) => g.kfa) && (
                    <Line type="monotone" dataKey="kfa" stroke={COLORS.warning} name="KFA (%)" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>Keine Daten vorhanden. Erfasse deine ersten Körperdaten!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainingsfrequenz letzte 7 Tage */}
        <Card>
          <CardHeader>
            <CardTitle>Trainingsfrequenz (7 Tage)</CardTitle>
            <CardDescription>Wie oft hast du trainiert?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="datum" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="workouts" fill={COLORS.success} name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trainingstyp-Verteilung */}
        {trainingsTypenChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trainingstypen (diese Woche)</CardTitle>
              <CardDescription>Verteilung deiner Trainingseinheiten</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={trainingsTypenChart} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill={COLORS.primary} dataKey="value">
                    {trainingsTypenChart.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Makro-Verteilung heute */}
        {makrosChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Makro-Verteilung (heute)</CardTitle>
              <CardDescription>Protein, Kohlenhydrate und Fett</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={makrosChart} cx="50%" cy="50%" labelLine={false} label outerRadius={80} dataKey="value">
                    {makrosChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Letzte Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Workouts</CardTitle>
          <CardDescription>Deine letzten 5 Trainingseinheiten</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts
                .sort((a, b) => (b.fields.datum || '').localeCompare(a.fields.datum || ''))
                .slice(0, 5)
                .map((workout) => (
                  <div key={workout.record_id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={workout.fields.rest_day ? 'secondary' : 'default'}>
                          {workout.fields.typ ? LOOKUP_LABELS.trainingstyp[workout.fields.typ] : 'N/A'}
                        </Badge>
                        {workout.fields.stimmung && (
                          <Badge variant="outline">{LOOKUP_LABELS.stimmung[workout.fields.stimmung]}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {workout.fields.datum ? format(parseISO(workout.fields.datum), 'PPP', { locale: de }) : 'Kein Datum'}
                      </p>
                    </div>
                    {workout.fields.dauer_minuten && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {workout.fields.dauer_minuten} min
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Dumbbell className="w-12 h-12 mb-4 opacity-50" />
              <p>Noch keine Workouts erfasst.</p>
              <Button className="mt-4" onClick={() => setWorkoutDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Erstes Workout hinzufügen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Letzte Mahlzeiten */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Mahlzeiten</CardTitle>
          <CardDescription>Deine letzten 5 erfassten Mahlzeiten</CardDescription>
        </CardHeader>
        <CardContent>
          {ernaehrung.length > 0 ? (
            <div className="space-y-4">
              {ernaehrung
                .sort((a, b) => (b.createdat || '').localeCompare(a.createdat || ''))
                .slice(0, 5)
                .map((mahlzeit) => (
                  <div key={mahlzeit.record_id} className="flex items-start justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge>{mahlzeit.fields.mahlzeit_typ ? LOOKUP_LABELS.mahlzeit_typ[mahlzeit.fields.mahlzeit_typ] : 'N/A'}</Badge>
                        {mahlzeit.fields.datum && (
                          <span className="text-sm text-muted-foreground">{format(parseISO(mahlzeit.fields.datum), 'PPP', { locale: de })}</span>
                        )}
                      </div>
                      {mahlzeit.fields.beschreibung && <p className="text-sm">{mahlzeit.fields.beschreibung}</p>}
                    </div>
                    <div className="text-right text-sm">
                      {mahlzeit.fields.kalorien && <p className="font-medium">{mahlzeit.fields.kalorien} kcal</p>}
                      {mahlzeit.fields.protein && <p className="text-muted-foreground">{mahlzeit.fields.protein}g Protein</p>}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Apple className="w-12 h-12 mb-4 opacity-50" />
              <p>Noch keine Mahlzeiten erfasst.</p>
              <Button className="mt-4" onClick={() => setErnaehrungDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Mahlzeit hinzufügen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
