import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ziele, Ernaehrung, Koerperdaten, WorkoutLogs, Uebungen } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Apple,
  Target,
  Calendar,
  Flame,
  Activity,
  Weight,
  Plus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Distinctive color palette (not generic purple gradients!)
const COLORS = {
  primary: '#FF6B35',      // Vibrant orange
  secondary: '#004E89',    // Deep blue
  accent: '#F7B801',       // Golden yellow
  success: '#06D6A0',      // Turquoise
  danger: '#EF476F',       // Pink-red
  chart: ['#FF6B35', '#004E89', '#F7B801', '#06D6A0', '#EF476F', '#8338EC']
};

interface DashboardData {
  workouts: Workouts[];
  ziele: Ziele[];
  ernaehrung: Ernaehrung[];
  koerperdaten: Koerperdaten[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    mahlzeit_typ: 'fruehstueck' as const,
    beschreibung: '',
    kalorien: '',
    protein: '',
    carbs: '',
    fett: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [workouts, ziele, ernaehrung, koerperdaten, workoutLogs, uebungen] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getZiele(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen()
      ]);
      setData({ workouts, ziele, ernaehrung, koerperdaten, workoutLogs, uebungen });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitMeal() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await LivingAppsService.createErnaehrungEntry({
        datum: today,
        mahlzeit_typ: formData.mahlzeit_typ,
        beschreibung: formData.beschreibung,
        kalorien: formData.kalorien ? Number(formData.kalorien) : undefined,
        protein: formData.protein ? Number(formData.protein) : undefined,
        carbs: formData.carbs ? Number(formData.carbs) : undefined,
        fett: formData.fett ? Number(formData.fett) : undefined
      });
      setDialogOpen(false);
      setFormData({
        mahlzeit_typ: 'fruehstueck',
        beschreibung: '',
        kalorien: '',
        protein: '',
        carbs: '',
        fett: ''
      });
      await loadData();
    } catch (err: any) {
      alert('Fehler: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-lg font-medium">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="max-w-md bg-slate-800 border-red-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <CardTitle className="text-red-400">Fehler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">{error || 'Daten konnten nicht geladen werden'}</p>
            <Button onClick={loadData} variant="outline" className="w-full">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { locale: de });
  const weekEnd = endOfWeek(new Date(), { locale: de });

  // Active goals
  const activeGoal = data.ziele.find(z => z.fields.status === 'aktiv');

  // Today's nutrition
  const todayMeals = data.ernaehrung.filter(e => e.fields.datum === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0);
  const todayProtein = todayMeals.reduce((sum, m) => sum + (m.fields.protein || 0), 0);

  // This week's workouts
  const weekWorkouts = data.workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day) return false;
    const workoutDate = parseISO(w.fields.datum);
    return workoutDate >= weekStart && workoutDate <= weekEnd;
  });

  // Latest body data
  const sortedBodyData = [...data.koerperdaten].sort((a, b) => {
    const dateA = a.fields.datum ? new Date(a.fields.datum).getTime() : 0;
    const dateB = b.fields.datum ? new Date(b.fields.datum).getTime() : 0;
    return dateB - dateA;
  });
  const latestBodyData = sortedBodyData[0];

  // Weight trend (last 30 days)
  const last30Days = data.koerperdaten
    .filter(k => k.fields.datum && k.fields.gewicht_kg)
    .sort((a, b) => new Date(a.fields.datum!).getTime() - new Date(b.fields.datum!).getTime())
    .slice(-30)
    .map(k => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg
    }));

  // Workout type distribution (last 30 days)
  const last30DaysWorkouts = data.workouts
    .filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false;
      const date = parseISO(w.fields.datum);
      return date >= subDays(new Date(), 30);
    });

  const workoutTypeDistribution = last30DaysWorkouts.reduce((acc, w) => {
    const typ = w.fields.typ || 'sonstiges';
    acc[typ] = (acc[typ] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workoutTypePieData = Object.entries(workoutTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Nutrition trend (last 7 days)
  const last7DaysNutrition = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const meals = data.ernaehrung.filter(e => e.fields.datum === date);
    return {
      date: format(subDays(new Date(), 6 - i), 'EEE', { locale: de }),
      kalorien: meals.reduce((sum, m) => sum + (m.fields.kalorien || 0), 0),
      protein: meals.reduce((sum, m) => sum + (m.fields.protein || 0), 0)
    };
  });

  // Muscle group training frequency
  const muscleGroupFrequency = data.workoutLogs.reduce((acc, log) => {
    const uebungUrl = log.fields.uebung;
    if (!uebungUrl) return acc;

    // Extract record ID from URL
    const uebungId = uebungUrl.split('/').pop();
    const uebung = data.uebungen.find(u => u.record_id === uebungId);

    if (uebung?.fields.muskelgruppe) {
      const gruppe = uebung.fields.muskelgruppe;
      acc[gruppe] = (acc[gruppe] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const muscleGroupBarData = Object.entries(muscleGroupFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      sätze: value
    }));

  // Calculate goal progress
  const calorieProgress = activeGoal?.fields.taeglich_kalorien
    ? (todayCalories / activeGoal.fields.taeglich_kalorien) * 100
    : 0;
  const proteinProgress = activeGoal?.fields.taeglich_protein
    ? (todayProtein / activeGoal.fields.taeglich_protein) * 100
    : 0;
  const weeklyWorkoutProgress = activeGoal?.fields.trainingstage_pro_woche
    ? (weekWorkouts.length / activeGoal.fields.trainingstage_pro_woche) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Header with geometric pattern overlay */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                Fitness Tracker
              </h1>
              <p className="text-orange-100 text-lg">
                {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 shadow-2xl font-bold">
                  <Plus className="w-5 h-5 mr-2" />
                  Mahlzeit hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Neue Mahlzeit</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Füge eine Mahlzeit für heute hinzu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="typ" className="text-slate-200">Mahlzeitentyp</Label>
                    <Select
                      value={formData.mahlzeit_typ}
                      onValueChange={(val) => setFormData({...formData, mahlzeit_typ: val as any})}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="fruehstueck">Frühstück</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                        <SelectItem value="mittagessen">Mittagessen</SelectItem>
                        <SelectItem value="abendessen">Abendessen</SelectItem>
                        <SelectItem value="pre_workout">Pre-Workout</SelectItem>
                        <SelectItem value="post_workout">Post-Workout</SelectItem>
                        <SelectItem value="sonstiges">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beschreibung" className="text-slate-200">Beschreibung</Label>
                    <Textarea
                      id="beschreibung"
                      value={formData.beschreibung}
                      onChange={(e) => setFormData({...formData, beschreibung: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="z.B. Haferflocken mit Banane"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kalorien" className="text-slate-200">Kalorien (kcal)</Label>
                      <Input
                        id="kalorien"
                        type="number"
                        value={formData.kalorien}
                        onChange={(e) => setFormData({...formData, kalorien: e.target.value})}
                        className="bg-slate-700 border-slate-600"
                        placeholder="450"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein" className="text-slate-200">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={formData.protein}
                        onChange={(e) => setFormData({...formData, protein: e.target.value})}
                        className="bg-slate-700 border-slate-600"
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbs" className="text-slate-200">Kohlenhydrate (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={formData.carbs}
                        onChange={(e) => setFormData({...formData, carbs: e.target.value})}
                        className="bg-slate-700 border-slate-600"
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fett" className="text-slate-200">Fett (g)</Label>
                      <Input
                        id="fett"
                        type="number"
                        value={formData.fett}
                        onChange={(e) => setFormData({...formData, fett: e.target.value})}
                        className="bg-slate-700 border-slate-600"
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSubmitMeal}
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    Mahlzeit speichern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Today's Goals - KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calories */}
          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg font-bold">Kalorien</CardTitle>
                <Flame className="w-6 h-6 text-orange-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{Math.round(todayCalories)}</span>
                  <span className="text-orange-200 text-xl">
                    / {activeGoal?.fields.taeglich_kalorien || '?'} kcal
                  </span>
                </div>
                {activeGoal && (
                  <div className="flex items-center gap-2">
                    {calorieProgress >= 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                    ) : calorieProgress >= 80 ? (
                      <TrendingUp className="w-5 h-5 text-yellow-300" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-orange-300" />
                    )}
                    <span className="text-white font-semibold">{Math.round(calorieProgress)}% erreicht</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Protein */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg font-bold">Protein</CardTitle>
                <Apple className="w-6 h-6 text-blue-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{Math.round(todayProtein)}</span>
                  <span className="text-blue-200 text-xl">
                    / {activeGoal?.fields.taeglich_protein || '?'} g
                  </span>
                </div>
                {activeGoal && (
                  <div className="flex items-center gap-2">
                    {proteinProgress >= 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                    ) : proteinProgress >= 80 ? (
                      <TrendingUp className="w-5 h-5 text-yellow-300" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-blue-300" />
                    )}
                    <span className="text-white font-semibold">{Math.round(proteinProgress)}% erreicht</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Workouts */}
          <Card className="bg-gradient-to-br from-yellow-600 to-yellow-700 border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg font-bold">Trainings diese Woche</CardTitle>
                <Dumbbell className="w-6 h-6 text-yellow-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{weekWorkouts.length}</span>
                  <span className="text-yellow-200 text-xl">
                    / {activeGoal?.fields.trainingstage_pro_woche || '?'} Tage
                  </span>
                </div>
                {activeGoal && (
                  <div className="flex items-center gap-2">
                    {weeklyWorkoutProgress >= 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                    ) : weeklyWorkoutProgress >= 50 ? (
                      <TrendingUp className="w-5 h-5 text-yellow-300" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-yellow-300" />
                    )}
                    <span className="text-white font-semibold">{Math.round(weeklyWorkoutProgress)}% erreicht</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Trend */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Weight className="w-5 h-5 text-orange-500" />
                Gewichtsverlauf (30 Tage)
              </CardTitle>
              <CardDescription className="text-slate-400">
                {latestBodyData ? `Aktuell: ${latestBodyData.fields.gewicht_kg} kg` : 'Keine Daten'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {last30Days.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={last30Days}>
                    <defs>
                      <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="gewicht" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorGewicht)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  Keine Körperdaten vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Trend (7 days) */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Ernährung (7 Tage)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Kalorien & Protein im Wochenverlauf
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={last7DaysNutrition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="kalorien" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="protein" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Muscle Group Training Frequency */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-green-500" />
                Trainierte Muskelgruppen
              </CardTitle>
              <CardDescription className="text-slate-400">
                Anzahl Sätze pro Muskelgruppe (alle Zeit)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {muscleGroupBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={muscleGroupBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Bar dataKey="sätze" fill={COLORS.success} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  Keine Workout-Logs vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout Type Distribution */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-500" />
                Trainingstypen (30 Tage)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Verteilung der Trainingseinheiten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workoutTypePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={workoutTypePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workoutTypePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  Keine Workouts in den letzten 30 Tagen
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Meals */}
        <Card className="bg-slate-800 border-slate-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Heutige Mahlzeiten
            </CardTitle>
            <CardDescription className="text-slate-400">
              {todayMeals.length} Mahlzeit{todayMeals.length !== 1 ? 'en' : ''} heute
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayMeals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.map((meal) => (
                  <div
                    key={meal.record_id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500">
                          {meal.fields.mahlzeit_typ?.replace('_', '-').toUpperCase()}
                        </Badge>
                        <span className="text-white font-semibold">
                          {meal.fields.beschreibung || 'Keine Beschreibung'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>{meal.fields.kalorien || 0} kcal</span>
                        <span>{meal.fields.protein || 0}g Protein</span>
                        <span>{meal.fields.carbs || 0}g Carbs</span>
                        <span>{meal.fields.fett || 0}g Fett</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Noch keine Mahlzeiten für heute</p>
                <p className="text-sm mt-1">Klicke auf "Mahlzeit hinzufügen" um zu starten</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Goal */}
        {activeGoal && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Aktives Ziel
                </CardTitle>
                <Badge className="bg-green-500 text-white">Aktiv</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Tägliche Kalorien</p>
                  <p className="text-2xl font-bold text-white">{activeGoal.fields.taeglich_kalorien} kcal</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Tägliches Protein</p>
                  <p className="text-2xl font-bold text-white">{activeGoal.fields.taeglich_protein} g</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Trainingstage/Woche</p>
                  <p className="text-2xl font-bold text-white">{activeGoal.fields.trainingstage_pro_woche}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Schlafziel</p>
                  <p className="text-2xl font-bold text-white">{activeGoal.fields.schlaf_ziel_stunden} h</p>
                </div>
              </div>
              {activeGoal.fields.notizen && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-slate-400 text-sm mb-1">Notizen</p>
                  <p className="text-white">{activeGoal.fields.notizen}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
