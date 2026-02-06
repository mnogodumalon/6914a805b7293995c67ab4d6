import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Workouts, WorkoutLogs, Ernaehrung, Koerperdaten, Ziele, Uebungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  Flame, Beef, Scale, Dumbbell, Plus, Clock, AlertCircle, RefreshCw,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================

const TODAY = new Date();
const TODAY_STR = format(TODAY, 'yyyy-MM-dd');
const WEEK_START = startOfWeek(TODAY, { weekStartsOn: 1 });
const WEEK_END = endOfWeek(TODAY, { weekStartsOn: 1 });

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function isThisWeek(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr.split('T')[0]);
    return isWithinInterval(d, { start: WEEK_START, end: WEEK_END });
  } catch {
    return false;
  }
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return dateStr.split('T')[0] === TODAY_STR;
}

function getDayIndex(dateStr: string): number {
  const d = parseISO(dateStr.split('T')[0]);
  const day = d.getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
}

const MOOD_MAP: Record<string, string> = {
  schlecht: '\u{1F629}',
  okay: '\u{1F610}',
  gut: '\u{1F60A}',
  brutal: '\u{1F525}',
};

const TYP_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
  ganzkoerper: 'Ganzkorper',
  oberkoerper: 'Oberkorper',
  unterkoerper: 'Unterkorper',
  cardio: 'Cardio',
  sonstiges: 'Sonstiges',
};

const MEAL_LABELS: Record<string, string> = {
  fruehstueck: 'Fruhstuck',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
};

function formatNum(val: number | null | undefined, decimals = 0): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

// ============================================================
// SEMICIRCULAR PROGRESS ARC
// ============================================================

function ProgressArc({
  current,
  goal,
  size = 200,
}: {
  current: number;
  goal: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Semicircle from 180° to 0° (bottom-left to bottom-right, going up and over)
  const startAngle = 150;
  const endAngle = 30;
  const totalAngle = 360 - (startAngle - endAngle); // 240 degrees

  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const progressAngle = totalAngle * progress;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const trackStart = polarToCartesian(startAngle);
  const trackEnd = polarToCartesian(endAngle);
  const trackLargeArc = totalAngle > 180 ? 1 : 0;
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${trackLargeArc} 1 ${trackEnd.x} ${trackEnd.y}`;

  const fillEndAngle = startAngle - progressAngle;
  const fillEnd = polarToCartesian(fillEndAngle < 0 ? fillEndAngle + 360 : fillEndAngle);
  const fillLargeArc = progressAngle > 180 ? 1 : 0;
  const fillPath =
    progress > 0
      ? `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${fillLargeArc} 1 ${fillEnd.x} ${fillEnd.y}`
      : '';

  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;

    function animate(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setAnimProgress(eased * progress);
      if (t < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const animAngle = totalAngle * animProgress;
  const animEndAngle = startAngle - animAngle;
  const animEnd = polarToCartesian(animEndAngle < 0 ? animEndAngle + 360 : animEndAngle);
  const animLargeArc = animAngle > 180 ? 1 : 0;
  const animPath =
    animProgress > 0
      ? `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${animLargeArc} 1 ${animEnd.x} ${animEnd.y}`
      : '';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="hsl(35 20% 92%)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Progress fill */}
      <path
        d={animPath || fillPath}
        fill="none"
        stroke="hsl(16 65% 50%)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-[Outfit]" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-[65] space-y-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[280px] rounded-xl" />
          </div>
          <div className="flex-[35] space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ERROR STATE
// ============================================================

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{error.message}</p>
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================
// WORKOUT LOG DIALOG
// ============================================================

function WorkoutDetailDialog({
  workout,
  logs,
  uebungen,
  open,
  onOpenChange,
}: {
  workout: Workouts;
  logs: WorkoutLogs[];
  uebungen: Uebungen[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const uebungMap = useMemo(() => {
    const m = new Map<string, Uebungen>();
    uebungen.forEach((u) => m.set(u.record_id, u));
    return m;
  }, [uebungen]);

  const workoutLogs = useMemo(() => {
    return logs
      .filter((l) => {
        const wId = extractRecordId(l.fields.workout);
        return wId === workout.record_id;
      })
      .sort((a, b) => (a.fields.satz_nummer ?? 0) - (b.fields.satz_nummer ?? 0));
  }, [logs, workout.record_id]);

  // Group logs by exercise
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; sets: WorkoutLogs[] }>();
    workoutLogs.forEach((log) => {
      const uId = extractRecordId(log.fields.uebung);
      if (!uId) return;
      const key = uId;
      if (!map.has(key)) {
        const ue = uebungMap.get(uId);
        map.set(key, { name: ue?.fields.name ?? 'Unbekannt', sets: [] });
      }
      map.get(key)!.sets.push(log);
    });
    return Array.from(map.values());
  }, [workoutLogs, uebungMap]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Workout Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            {workout.fields.typ && (
              <Badge variant="secondary">{TYP_LABELS[workout.fields.typ] ?? workout.fields.typ}</Badge>
            )}
            {workout.fields.datum && (
              <span className="text-sm text-muted-foreground">
                {format(parseISO(workout.fields.datum.split('T')[0]), 'PPP', { locale: de })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {workout.fields.dauer_minuten != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {workout.fields.dauer_minuten} Min
              </span>
            )}
            {workout.fields.stimmung && (
              <span>{MOOD_MAP[workout.fields.stimmung] ?? workout.fields.stimmung}</span>
            )}
          </div>
        </div>

        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Ubungsdetails fur dieses Workout vorhanden.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group, i) => (
              <div key={i}>
                <h4 className="font-semibold text-sm mb-2">{group.name}</h4>
                <div className="space-y-1">
                  {group.sets.map((s) => (
                    <div
                      key={s.record_id}
                      className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50"
                    >
                      <span className="text-muted-foreground">Satz {s.fields.satz_nummer ?? '-'}</span>
                      <span className="font-medium">
                        {s.fields.gewicht != null ? `${formatNum(s.fields.gewicht, 1)} kg` : '-'}{' '}
                        x {s.fields.wiederholungen ?? '-'}
                      </span>
                      {s.fields.rpe && (
                        <Badge variant="outline" className="text-xs ml-2">
                          RPE {s.fields.rpe.replace('rpe_', '')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ADD WORKOUT DIALOG
// ============================================================

function AddWorkoutDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [datum, setDatum] = useState(TODAY_STR);
  const [typ, setTyp] = useState('push');
  const [dauer, setDauer] = useState('');
  const [stimmung, setStimmung] = useState('gut');
  const [restDay, setRestDay] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await LivingAppsService.createWorkout({
        datum,
        typ: restDay ? undefined : (typ as Workouts['fields']['typ']),
        dauer_minuten: restDay ? undefined : (dauer ? Number(dauer) : undefined),
        stimmung: restDay ? undefined : (stimmung as Workouts['fields']['stimmung']),
        rest_day: restDay || undefined,
      });
      onSuccess();
      onOpenChange(false);
      // Reset
      setDatum(TODAY_STR);
      setTyp('push');
      setDauer('');
      setStimmung('gut');
      setRestDay(false);
    } catch (err) {
      console.error('Failed to create workout:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Workout loggen
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wo-datum">Datum</Label>
            <Input
              id="wo-datum"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="rest-day"
              checked={restDay}
              onCheckedChange={(v) => setRestDay(v === true)}
            />
            <Label htmlFor="rest-day" className="text-sm">
              Ruhetag
            </Label>
          </div>

          {!restDay && (
            <>
              <div className="space-y-2">
                <Label>Trainingstyp</Label>
                <Select value={typ} onValueChange={setTyp}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYP_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wo-dauer">Dauer (Minuten)</Label>
                <Input
                  id="wo-dauer"
                  type="number"
                  placeholder="z.B. 60"
                  value={dauer}
                  onChange={(e) => setDauer(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Stimmung</Label>
                <Select value={stimmung} onValueChange={setStimmung}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schlecht">{MOOD_MAP.schlecht} Schlecht</SelectItem>
                    <SelectItem value="okay">{MOOD_MAP.okay} Okay</SelectItem>
                    <SelectItem value="gut">{MOOD_MAP.gut} Gut</SelectItem>
                    <SelectItem value="brutal">{MOOD_MAP.brutal} Brutal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Speichern...' : 'Workout speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ADD MEAL DIALOG
// ============================================================

function AddMealDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [datum, setDatum] = useState(TODAY_STR);
  const [typ, setTyp] = useState('mittagessen');
  const [beschreibung, setBeschreibung] = useState('');
  const [kalorien, setKalorien] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fett, setFett] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await LivingAppsService.createErnaehrungEntry({
        datum,
        mahlzeit_typ: typ as Ernaehrung['fields']['mahlzeit_typ'],
        beschreibung: beschreibung || undefined,
        kalorien: kalorien ? Number(kalorien) : undefined,
        protein: protein ? Number(protein) : undefined,
        carbs: carbs ? Number(carbs) : undefined,
        fett: fett ? Number(fett) : undefined,
      });
      onSuccess();
      onOpenChange(false);
      setBeschreibung('');
      setKalorien('');
      setProtein('');
      setCarbs('');
      setFett('');
    } catch (err) {
      console.error('Failed to create meal:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Mahlzeit hinzufugen
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-datum">Datum</Label>
            <Input id="meal-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Mahlzeitentyp</Label>
            <Select value={typ} onValueChange={setTyp}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEAL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-desc">Beschreibung</Label>
            <Textarea
              id="meal-desc"
              placeholder="Was hast du gegessen?"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meal-kcal">Kalorien (kcal)</Label>
              <Input
                id="meal-kcal"
                type="number"
                placeholder="0"
                value={kalorien}
                onChange={(e) => setKalorien(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-protein">Protein (g)</Label>
              <Input
                id="meal-protein"
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-carbs">Carbs (g)</Label>
              <Input
                id="meal-carbs"
                type="number"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-fett">Fett (g)</Label>
              <Input
                id="meal-fett"
                type="number"
                placeholder="0"
                value={fett}
                onChange={(e) => setFett(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Speichern...' : 'Mahlzeit speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ADD WEIGHT DIALOG
// ============================================================

function AddWeightDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [datum, setDatum] = useState(TODAY_STR);
  const [gewicht, setGewicht] = useState('');
  const [kfa, setKfa] = useState('');
  const [notizen, setNotizen] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gewicht) return;
    setSubmitting(true);
    try {
      await LivingAppsService.createKoerperdatenEntry({
        datum,
        gewicht_kg: Number(gewicht),
        kfa_geschaetzt: kfa ? Number(kfa) : undefined,
        notizen: notizen || undefined,
      });
      onSuccess();
      onOpenChange(false);
      setGewicht('');
      setKfa('');
      setNotizen('');
    } catch (err) {
      console.error('Failed to create weight entry:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Gewicht erfassen
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="w-datum">Datum</Label>
            <Input id="w-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-gewicht">Gewicht (kg)</Label>
            <Input
              id="w-gewicht"
              type="number"
              step="0.1"
              placeholder="z.B. 80.5"
              value={gewicht}
              onChange={(e) => setGewicht(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-kfa">Korperfettanteil % (optional)</Label>
            <Input
              id="w-kfa"
              type="number"
              step="0.1"
              placeholder="z.B. 15"
              value={kfa}
              onChange={(e) => setKfa(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-notizen">Notizen (optional)</Label>
            <Textarea
              id="w-notizen"
              placeholder="z.B. Morgens nuchtern"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !gewicht}>
            {submitting ? 'Speichern...' : 'Gewicht speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function Dashboard() {
  // --- Data State ---
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [uebungen, setUebungen] = useState<Uebungen[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // --- Dialog State ---
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workouts | null>(null);
  const [showAllMeals, setShowAllMeals] = useState(false);

  // --- Stagger animation ---
  const [visibleSections, setVisibleSections] = useState(0);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [w, wl, e, k, z, u] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getKoerperdaten(),
        LivingAppsService.getZiele(),
        LivingAppsService.getUebungen(),
      ]);
      setWorkouts(w);
      setWorkoutLogs(wl);
      setErnaehrung(e);
      setKoerperdaten(k);
      setZiele(z);
      setUebungen(u);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stagger animation
  useEffect(() => {
    if (!loading && !error) {
      const timers = [
        setTimeout(() => setVisibleSections(1), 100),
        setTimeout(() => setVisibleSections(2), 300),
        setTimeout(() => setVisibleSections(3), 500),
        setTimeout(() => setVisibleSections(4), 700),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [loading, error]);

  // --- Computed Data ---
  const activeGoal = useMemo(() => {
    return ziele.find((z) => z.fields.status === 'aktiv') ?? null;
  }, [ziele]);

  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche ?? 4;

  const weekWorkouts = useMemo(() => {
    return workouts.filter(
      (w) => isThisWeek(w.fields.datum) && !w.fields.rest_day
    );
  }, [workouts]);

  const todayMeals = useMemo(() => {
    return ernaehrung
      .filter((e) => isToday(e.fields.datum))
      .sort((a, b) => a.createdat.localeCompare(b.createdat));
  }, [ernaehrung]);

  const todayCalories = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.fields.kalorien ?? 0), 0);
  }, [todayMeals]);

  const todayProtein = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.fields.protein ?? 0), 0);
  }, [todayMeals]);

  const todayCarbs = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.fields.carbs ?? 0), 0);
  }, [todayMeals]);

  const todayFett = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.fields.fett ?? 0), 0);
  }, [todayMeals]);

  const sortedBody = useMemo(() => {
    return [...koerperdaten]
      .filter((k) => k.fields.datum && k.fields.gewicht_kg != null)
      .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''));
  }, [koerperdaten]);

  const latestWeight = sortedBody.length > 0 ? sortedBody[sortedBody.length - 1] : null;
  const prevWeight = sortedBody.length > 1 ? sortedBody[sortedBody.length - 2] : null;
  const weightDiff =
    latestWeight?.fields.gewicht_kg != null && prevWeight?.fields.gewicht_kg != null
      ? latestWeight.fields.gewicht_kg - prevWeight.fields.gewicht_kg
      : null;

  // Chart data: weekly training volume
  const weekVolumeData = useMemo(() => {
    // Build a map: dayIndex -> total volume
    const dayVolumes = new Array(7).fill(0);

    // Map workouts by record_id
    const workoutDateMap = new Map<string, string>();
    workouts.forEach((w) => {
      if (w.fields.datum && isThisWeek(w.fields.datum)) {
        workoutDateMap.set(w.record_id, w.fields.datum);
      }
    });

    workoutLogs.forEach((log) => {
      const wId = extractRecordId(log.fields.workout);
      if (!wId) return;
      const wDate = workoutDateMap.get(wId);
      if (!wDate) return;
      const dayIdx = getDayIndex(wDate);
      const vol = (log.fields.gewicht ?? 0) * (log.fields.wiederholungen ?? 0);
      dayVolumes[dayIdx] += vol;
    });

    return DAY_LABELS.map((label, i) => ({
      name: label,
      volume: Math.round(dayVolumes[i]),
    }));
  }, [workouts, workoutLogs]);

  // Body weight trend data (last 30 days)
  const weightTrendData = useMemo(() => {
    const thirtyDaysAgo = subDays(TODAY, 30);
    return sortedBody
      .filter((k) => {
        if (!k.fields.datum) return false;
        try {
          return parseISO(k.fields.datum) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      })
      .map((k) => ({
        date: k.fields.datum ? format(parseISO(k.fields.datum), 'dd.MM') : '',
        weight: k.fields.gewicht_kg ?? 0,
      }));
  }, [sortedBody]);

  // Recent workouts (non-rest, sorted desc)
  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .filter((w) => !w.fields.rest_day && w.fields.datum)
      .sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? ''));
  }, [workouts]);

  // --- Handlers ---
  const handleRefresh = useCallback(() => {
    setVisibleSections(0);
    fetchData();
  }, [fetchData]);

  // --- Render ---
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={handleRefresh} />;

  const sectionClass = (level: number) =>
    `transition-all duration-500 ${
      visibleSections >= level ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`;

  const calorieGoal = activeGoal?.fields.taeglich_kalorien;
  const proteinGoal = activeGoal?.fields.taeglich_protein;

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* ====== HEADER ====== */}
      <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border ${sectionClass(1)}`}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
              Fitness Tracker
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-light">
              {format(TODAY, 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMealDialogOpen(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Mahlzeit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeightDialogOpen(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Gewicht
              </Button>
              <Button size="sm" onClick={() => setWorkoutDialogOpen(true)} className="gap-1.5">
                <Dumbbell className="h-4 w-4" />
                Workout loggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 pb-28 md:pb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ====== LEFT COLUMN (65%) ====== */}
          <div className="lg:flex-[65] space-y-6">
            {/* --- HERO: Weekly Progress --- */}
            <div className={sectionClass(1)}>
              <Card className="shadow-sm border-0 bg-card">
                <CardContent className="flex flex-col items-center py-8 md:py-10">
                  <div className="relative">
                    <ProgressArc
                      current={weekWorkouts.length}
                      goal={weeklyGoal}
                      size={200}
                    />
                    {/* Number overlay - centered in the arc */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 20 }}>
                      <span
                        className="font-bold text-primary leading-none"
                        style={{ fontSize: 56 }}
                      >
                        {weekWorkouts.length}
                      </span>
                      <span className="text-sm font-light text-muted-foreground mt-1">
                        von {weeklyGoal} Trainings
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-2">
                    Diese Woche
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* --- CHART: Weekly Volume --- */}
            <div className={sectionClass(2)}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Trainingsvolumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekVolumeData} barCategoryGap="20%">
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: 'hsl(20 5% 45%)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(20 5% 45%)' }}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                          className="hidden md:block"
                          hide={typeof window !== 'undefined' && window.innerWidth < 768}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(30 15% 90%)',
                            borderRadius: 8,
                            fontFamily: 'Outfit',
                            fontSize: 13,
                          }}
                          formatter={(value: number) => [`${formatNum(value)} kg`, 'Volumen']}
                          cursor={{ fill: 'hsl(35 20% 95%)' }}
                        />
                        <Bar
                          dataKey="volume"
                          fill="hsl(16 65% 50%)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- TODAY'S NUTRITION --- */}
            <div className={sectionClass(3)}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Heutige Ernahrung</CardTitle>
                    <span className="text-sm text-muted-foreground font-medium">
                      {formatNum(todayCalories)} kcal
                      {calorieGoal ? ` / ${formatNum(calorieGoal)} kcal` : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Macro bar */}
                  {todayCalories > 0 && (
                    <div className="mb-4">
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                        {todayProtein > 0 && (
                          <div
                            className="h-full"
                            style={{
                              width: `${((todayProtein * 4) / (todayCalories || 1)) * 100}%`,
                              backgroundColor: 'hsl(16 65% 50%)',
                            }}
                          />
                        )}
                        {todayCarbs > 0 && (
                          <div
                            className="h-full"
                            style={{
                              width: `${((todayCarbs * 4) / (todayCalories || 1)) * 100}%`,
                              backgroundColor: 'hsl(35 60% 55%)',
                            }}
                          />
                        )}
                        {todayFett > 0 && (
                          <div
                            className="h-full"
                            style={{
                              width: `${((todayFett * 9) / (todayCalories || 1)) * 100}%`,
                              backgroundColor: 'hsl(200 50% 50%)',
                            }}
                          />
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(16 65% 50%)' }} />
                          Protein {formatNum(todayProtein)}g
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(35 60% 55%)' }} />
                          Carbs {formatNum(todayCarbs)}g
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(200 50% 50%)' }} />
                          Fett {formatNum(todayFett)}g
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meal list */}
                  {todayMeals.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-2">Noch keine Mahlzeiten heute</p>
                      <Button variant="outline" size="sm" onClick={() => setMealDialogOpen(true)} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Mahlzeit hinzufugen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {/* Desktop: table-style */}
                      <div className="hidden md:block">
                        <div className="grid grid-cols-[100px_1fr_80px_70px_70px_70px] gap-2 text-xs font-medium text-muted-foreground border-b pb-2 mb-1">
                          <span>Typ</span>
                          <span>Beschreibung</span>
                          <span className="text-right">Kalorien</span>
                          <span className="text-right">Protein</span>
                          <span className="text-right">Carbs</span>
                          <span className="text-right">Fett</span>
                        </div>
                        {todayMeals.map((meal) => (
                          <div
                            key={meal.record_id}
                            className="grid grid-cols-[100px_1fr_80px_70px_70px_70px] gap-2 py-2 text-sm border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <span>
                              <Badge variant="secondary" className="text-xs font-normal">
                                {MEAL_LABELS[meal.fields.mahlzeit_typ ?? ''] ?? meal.fields.mahlzeit_typ ?? '-'}
                              </Badge>
                            </span>
                            <span className="truncate text-muted-foreground">{meal.fields.beschreibung || '-'}</span>
                            <span className="text-right font-medium">{formatNum(meal.fields.kalorien)}</span>
                            <span className="text-right text-muted-foreground">{formatNum(meal.fields.protein)}g</span>
                            <span className="text-right text-muted-foreground">{formatNum(meal.fields.carbs)}g</span>
                            <span className="text-right text-muted-foreground">{formatNum(meal.fields.fett)}g</span>
                          </div>
                        ))}
                      </div>

                      {/* Mobile: simple list */}
                      <div className="md:hidden">
                        {(showAllMeals ? todayMeals : todayMeals.slice(0, 5)).map((meal) => (
                          <div
                            key={meal.record_id}
                            className="flex items-center justify-between py-2.5 border-b border-border/50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                {MEAL_LABELS[meal.fields.mahlzeit_typ ?? ''] ?? '-'}
                              </Badge>
                              <span className="text-sm truncate text-muted-foreground">
                                {meal.fields.beschreibung || ''}
                              </span>
                            </div>
                            <span className="text-sm font-medium shrink-0 ml-2">
                              {formatNum(meal.fields.kalorien)} kcal
                            </span>
                          </div>
                        ))}
                        {todayMeals.length > 5 && !showAllMeals && (
                          <button
                            onClick={() => setShowAllMeals(true)}
                            className="text-sm text-primary font-medium mt-2 hover:underline"
                          >
                            Alle anzeigen ({todayMeals.length})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ====== RIGHT COLUMN (35%) ====== */}
          <div className="lg:flex-[35] space-y-4">
            {/* --- Quick Stats --- */}
            <div className={`space-y-4 ${sectionClass(2)}`}>
              {/* Today's Calories */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-light text-muted-foreground">Heute Kalorien</p>
                        <p className="text-xl font-bold">{formatNum(todayCalories)} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                      </div>
                    </div>
                    {calorieGoal && calorieGoal > 0 && (
                      <div className="w-12 h-12">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke="hsl(35 20% 92%)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke="hsl(16 65% 50%)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.min(todayCalories / calorieGoal, 1) * 94.2} 94.2`}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Protein */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Beef className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-light text-muted-foreground">Heute Protein</p>
                      <p className="text-xl font-bold">{formatNum(todayProtein)} <span className="text-sm font-normal text-muted-foreground">g</span></p>
                      {proteinGoal && proteinGoal > 0 && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min((todayProtein / proteinGoal) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Weight */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-light text-muted-foreground">Gewicht</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">
                          {latestWeight ? formatNum(latestWeight.fields.gewicht_kg, 1) : '-'}{' '}
                          <span className="text-sm font-normal text-muted-foreground">kg</span>
                        </p>
                        {weightDiff != null && weightDiff !== 0 && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${weightDiff < 0 ? 'text-green-600' : 'text-orange-600'}`}
                          >
                            {weightDiff > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-0.5" />
                            )}
                            {weightDiff > 0 ? '+' : ''}
                            {formatNum(weightDiff, 1)} kg
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- Mobile: Quick Stats Pills (visible only < lg) --- */}
            <div className={`lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 ${sectionClass(2)}`}>
              <div className="snap-start shrink-0 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold whitespace-nowrap">{formatNum(todayCalories)} kcal</span>
              </div>
              <div className="snap-start shrink-0 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Beef className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold whitespace-nowrap">{formatNum(todayProtein)}g Protein</span>
              </div>
              <div className="snap-start shrink-0 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Scale className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold whitespace-nowrap">
                  {latestWeight ? `${formatNum(latestWeight.fields.gewicht_kg, 1)} kg` : '- kg'}
                </span>
              </div>
            </div>

            {/* --- Recent Workouts --- */}
            <div className={sectionClass(3)}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Letzte Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentWorkouts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-2">Noch keine Workouts</p>
                      <Button variant="outline" size="sm" onClick={() => setWorkoutDialogOpen(true)} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Erstes Workout loggen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentWorkouts.slice(0, typeof window !== 'undefined' && window.innerWidth < 1024 ? 3 : 5).map((w) => (
                        <div
                          key={w.record_id}
                          onClick={() => setSelectedWorkout(w)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="secondary" className="text-xs font-normal shrink-0">
                              {TYP_LABELS[w.fields.typ ?? ''] ?? w.fields.typ ?? '-'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {w.fields.datum
                                ? format(parseISO(w.fields.datum.split('T')[0]), 'dd.MM.yy')
                                : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {w.fields.dauer_minuten != null && (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {w.fields.dauer_minuten}m
                              </span>
                            )}
                            <span>{MOOD_MAP[w.fields.stimmung ?? ''] ?? ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* --- Body Weight Trend --- */}
            <div className={sectionClass(4)}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Gewichtsverlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  {weightTrendData.length < 2 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-2">Mindestens 2 Messungen nötig</p>
                      <Button variant="outline" size="sm" onClick={() => setWeightDialogOpen(true)} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Gewicht erfassen
                      </Button>
                    </div>
                  ) : (
                    <div className="h-[120px] md:h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightTrendData}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(16 65% 50%)" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="hsl(16 65% 50%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(20 5% 45%)' }}
                            axisLine={false}
                            tickLine={false}
                            className="hidden md:block"
                            hide={typeof window !== 'undefined' && window.innerWidth < 768}
                          />
                          <YAxis
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tick={{ fontSize: 10, fill: 'hsl(20 5% 45%)' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                            className="hidden md:block"
                            hide={typeof window !== 'undefined' && window.innerWidth < 768}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(0 0% 100%)',
                              border: '1px solid hsl(30 15% 90%)',
                              borderRadius: 8,
                              fontFamily: 'Outfit',
                              fontSize: 13,
                            }}
                            formatter={(value: number) => [`${formatNum(value, 1)} kg`, 'Gewicht']}
                          />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="hsl(16 65% 50%)"
                            strokeWidth={2}
                            fill="url(#weightGradient)"
                            dot={false}
                            activeDot={{ r: 4, fill: 'hsl(16 65% 50%)' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* ====== MOBILE BOTTOM ACTION BAR ====== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-30">
        <Button
          onClick={() => setWorkoutDialogOpen(true)}
          className="w-full h-12 rounded-xl text-base font-semibold gap-2"
        >
          <Dumbbell className="h-5 w-5" />
          Workout loggen
        </Button>
        <div className="flex justify-center gap-6 mt-2">
          <button
            onClick={() => setMealDialogOpen(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Mahlzeit +
          </button>
          <button
            onClick={() => setWeightDialogOpen(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Gewicht +
          </button>
        </div>
      </div>

      {/* ====== DIALOGS ====== */}
      <AddWorkoutDialog
        open={workoutDialogOpen}
        onOpenChange={setWorkoutDialogOpen}
        onSuccess={handleRefresh}
      />
      <AddMealDialog
        open={mealDialogOpen}
        onOpenChange={setMealDialogOpen}
        onSuccess={handleRefresh}
      />
      <AddWeightDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        onSuccess={handleRefresh}
      />
      {selectedWorkout && (
        <WorkoutDetailDialog
          workout={selectedWorkout}
          logs={workoutLogs}
          uebungen={uebungen}
          open={!!selectedWorkout}
          onOpenChange={(open) => {
            if (!open) setSelectedWorkout(null);
          }}
        />
      )}
    </div>
  );
}
