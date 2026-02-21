import { useMemo } from 'react';
import { format, startOfWeek, addDays, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Workouts } from '@/types/app';

interface Props {
  workouts: Workouts[];
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const TYP_COLOR: Record<string, string> = {
  push: 'oklch(0.62 0.21 38)',
  pull: 'oklch(0.55 0.18 155)',
  beine: 'oklch(0.58 0.16 264)',
  ganzkoerper: 'oklch(0.65 0.19 300)',
  oberkoerper: 'oklch(0.72 0.16 55)',
  unterkoerper: 'oklch(0.60 0.14 200)',
  cardio: 'oklch(0.62 0.21 10)',
  sonstiges: 'oklch(0.55 0.05 240)',
};

const TYP_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
};

export default function WeeklyActivity({ workouts }: Props) {
  const today = new Date();
  const weeks = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(today, 5 - i), { weekStartsOn: 1 });
      return getWeekDays(weekStart);
    });
  }, []);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, Workouts>();
    workouts.forEach(w => {
      if (w.fields.datum) map.set(w.fields.datum, w);
    });
    return map;
  }, [workouts]);

  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekDays = getWeekDays(currentWeekStart);
  const currentWeekWorkouts = currentWeekDays.filter(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const w = workoutsByDate.get(dateStr);
    return w && !w.fields.rest_day;
  }).length;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">6 Wochen</p>
          <h3 className="text-lg font-700 text-foreground mt-0.5">Trainingsaktivität</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-800 text-primary">{currentWeekWorkouts}</p>
          <p className="text-xs text-muted-foreground">diese Woche</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1.5">
        {/* Day labels */}
        <div className="flex gap-1.5 pl-0">
          <div className="flex gap-1.5">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <div key={d} className="w-7 text-center text-[10px] text-muted-foreground font-500">{d}</div>
            ))}
          </div>
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const workout = workoutsByDate.get(dateStr);
              const isFuture = day > today;
              const isToday = dateStr === format(today, 'yyyy-MM-dd');
              const isRestDay = workout?.fields.rest_day;

              return (
                <div
                  key={di}
                  title={workout
                    ? `${format(day, 'd. MMM', { locale: de })}: ${TYP_LABELS[workout.fields.typ ?? 'sonstiges']}`
                    : format(day, 'd. MMM', { locale: de })}
                  className={`w-7 h-7 rounded-lg transition-all ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  style={{
                    backgroundColor: isFuture
                      ? 'var(--muted)'
                      : isRestDay
                        ? 'var(--muted)'
                        : workout
                          ? TYP_COLOR[workout.fields.typ ?? 'sonstiges']
                          : 'var(--border)',
                    opacity: isFuture ? 0.3 : isRestDay ? 0.5 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {Object.entries(TYP_LABELS).slice(0, 5).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: TYP_COLOR[k] }} />
            <span className="text-[10px] text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
