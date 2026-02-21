import { useState, useEffect, useCallback } from 'react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity, Utensils, Target, Scale, TrendingUp } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, WorkoutLogs, Uebungen, Ernaehrung, Ziele, Koerperdaten } from '@/types/app';
import TodayWorkoutPanel from '@/components/TodayWorkoutPanel';
import TodayNutritionPanel from '@/components/TodayNutritionPanel';
import GoalsProgress from '@/components/GoalsProgress';
import BodyMetricsChart from '@/components/BodyMetricsChart';

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export default function DashboardOverview() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, wl, u, e, z, k] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getUebungen(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getZiele(),
        LivingAppsService.getKoerperdaten(),
      ]);
      setWorkouts(w);
      setWorkoutLogs(wl);
      setUebungen(u);
      setErnaehrung(e);
      setZiele(z);
      setKoerperdaten(k);
    } catch (err) {
      setError('Daten konnten nicht geladen werden. Bitte einloggen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const dateStr = toDateStr(selectedDate);
  const isToday = isSameDay(selectedDate, new Date());
  const activeGoal = ziele.find(z => z.fields.status === 'aktiv') || null;

  // Week summary: last 7 days workout presence
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const workoutDateSet = new Set(workouts.filter(w => !w.fields.rest_day).map(w => w.fields.datum));
  const restDaySet = new Set(workouts.filter(w => w.fields.rest_day).map(w => w.fields.datum));

  // Streak calc
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = toDateStr(subDays(new Date(), i));
    if (workoutDateSet.has(d)) streak++;
    else if (!restDaySet.has(d) && i > 0) break;
  }

  const todayMeals = ernaehrung.filter(e => e.fields.datum === dateStr);
  const totalKcalToday = todayMeals.reduce((s, m) => s + (m.fields.kalorien || 0), 0);
  const latestKoerper = koerperdaten
    .filter(k => k.fields.datum)
    .sort((a, b) => (a.fields.datum! > b.fields.datum! ? -1 : 1))[0];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 rounded-2xl bg-card border border-border shadow-sm max-w-sm">
          <Activity size={36} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Verbindungsfehler</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl tracking-tight text-foreground" style={{ fontWeight: 800 }}>
            {isToday ? 'Heute' : format(selectedDate, 'EEEE', { locale: de })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'var(--gradient-energy)', color: 'white' }}>
            <TrendingUp size={13} />
            {streak} Tage
          </div>
        )}
      </div>

      {/* Week mini calendar */}
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
          onClick={() => setSelectedDate(d => subDays(d, 7))}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex gap-1">
          {last7.map((day) => {
            const ds = toDateStr(day);
            const hasWorkout = workoutDateSet.has(ds);
            const isRest = restDaySet.has(ds);
            const isSelected = isSameDay(day, selectedDate);
            const isTod = isSameDay(day, new Date());
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(day)}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all text-xs font-medium ${
                  isSelected
                    ? 'text-primary-foreground shadow-sm'
                    : isTod
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
                style={isSelected ? { background: 'var(--gradient-primary)' } : {}}
              >
                <span className="text-[10px] uppercase">{format(day, 'EEE', { locale: de }).slice(0, 2)}</span>
                <span className="text-sm font-bold mt-0.5">{format(day, 'd')}</span>
                <div className="mt-1 w-1 h-1 rounded-full" style={{
                  background: hasWorkout
                    ? (isSelected ? 'white' : 'oklch(0.52 0.18 148)')
                    : isRest
                    ? 'oklch(0.68 0.19 52 / 0.6)'
                    : 'transparent',
                }} />
              </button>
            );
          })}
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
          onClick={() => setSelectedDate(d => addDays(d, 7))}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm text-center">
          <Activity size={18} className="mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{workouts.filter(w => !w.fields.rest_day).length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workouts</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm text-center">
          <Utensils size={18} className="mx-auto mb-1 text-orange-500" />
          <p className="text-lg font-bold">{totalKcalToday > 0 ? totalKcalToday : '—'}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal heute</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm text-center">
          <Scale size={18} className="mx-auto mb-1 text-indigo-500" />
          <p className="text-lg font-bold">
            {latestKoerper?.fields.gewicht_kg ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">kg</p>
        </div>
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Workout + Nutrition */}
        <div className="space-y-6">
          <section className="bg-card rounded-2xl p-4 border border-border/50" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <Activity size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Training</h2>
            </div>
            <TodayWorkoutPanel
              selectedDate={dateStr}
              workouts={workouts}
              workoutLogs={workoutLogs}
              uebungen={uebungen}
              loading={loading}
              onRefresh={refresh}
            />
          </section>

          <section className="bg-card rounded-2xl p-4 border border-border/50" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-energy)' }}>
                <Utensils size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Ernährung</h2>
            </div>
            <TodayNutritionPanel
              selectedDate={dateStr}
              ernaehrung={ernaehrung}
              activeGoal={activeGoal}
              loading={loading}
              onRefresh={refresh}
            />
          </section>
        </div>

        {/* Right: Goals + Body Metrics */}
        <div className="space-y-6">
          <section className="bg-card rounded-2xl p-4 border border-border/50" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500">
                <Target size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Ziele</h2>
              {activeGoal && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Aktiv</span>
              )}
            </div>
            <GoalsProgress goals={ziele} workouts={workouts} />
          </section>

          <section className="bg-card rounded-2xl p-4 border border-border/50" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500">
                <Scale size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Körperdaten</h2>
              {koerperdaten.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{koerperdaten.length} Messungen</span>
              )}
            </div>
            <BodyMetricsChart koerperdaten={koerperdaten} loading={loading} />
          </section>
        </div>
      </div>
    </div>
  );
}
