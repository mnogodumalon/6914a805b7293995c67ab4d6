import { Target, Flame, Beef, Moon, Dumbbell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Ziele, Workouts } from '@/types/app';

interface Props {
  goals: Ziele[];
  workouts: Workouts[];
}

function RingProgress({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--muted)" strokeWidth="5" />
      <circle
        cx="30" cy="30" r={r} fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="30" y="34" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--foreground)" fontFamily="Outfit, sans-serif">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export default function GoalsProgress({ goals, workouts }: Props) {
  const activeGoal = goals.find(g => g.fields.status === 'aktiv');

  // Count training days this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const trainingsThisWeek = workouts.filter(w => {
    const d = w.fields.datum || '';
    return d >= weekStartStr && d <= todayStr && !w.fields.rest_day;
  }).length;

  const statusIcon = (status?: string) => {
    if (status === 'aktiv') return <Clock size={12} className="text-primary" />;
    if (status === 'erreicht') return <CheckCircle2 size={12} className="text-green-500" />;
    return <XCircle size={12} className="text-muted-foreground" />;
  };

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Target size={32} className="text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Keine Ziele definiert</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Erstelle Ziele im Ziele-Bereich</p>
      </div>
    );
  }

  if (!activeGoal) {
    return (
      <div className="space-y-2">
        {goals.slice(0, 3).map(g => (
          <div key={g.record_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            {statusIcon(g.fields.status)}
            <span className="text-xs text-muted-foreground capitalize">{g.fields.status}</span>
            {g.fields.taeglich_kalorien && (
              <span className="text-xs ml-auto">{g.fields.taeglich_kalorien} kcal</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const weekGoal = activeGoal.fields.trainingstage_pro_woche || 0;

  return (
    <div className="space-y-4">
      {/* Active goal stats */}
      <div className="grid grid-cols-2 gap-3">
        {activeGoal.fields.taeglich_kalorien != null && (
          <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm flex items-center gap-3">
            <div className="shrink-0">
              <RingProgress value={0} max={activeGoal.fields.taeglich_kalorien} color="oklch(0.68 0.19 52)" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Flame size={11} /> Ziel kcal</p>
              <p className="text-sm font-bold">{activeGoal.fields.taeglich_kalorien}</p>
            </div>
          </div>
        )}
        {activeGoal.fields.taeglich_protein != null && (
          <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm flex items-center gap-3">
            <div className="shrink-0">
              <RingProgress value={0} max={activeGoal.fields.taeglich_protein} color="oklch(0.52 0.18 148)" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Beef size={11} /> Protein</p>
              <p className="text-sm font-bold">{activeGoal.fields.taeglich_protein}g</p>
            </div>
          </div>
        )}
      </div>

      {/* Training week progress */}
      {weekGoal > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Dumbbell size={12} /> Trainingswochen-Ziel
            </span>
            <span className="text-xs font-bold text-foreground">{trainingsThisWeek} / {weekGoal} Tage</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: weekGoal }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full transition-all duration-500"
                style={{
                  background: i < trainingsThisWeek ? 'var(--gradient-primary)' : 'var(--muted)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sleep goal */}
      {activeGoal.fields.schlaf_ziel_stunden != null && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-xl border border-border/50 shadow-sm">
          <Moon size={16} className="text-indigo-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Schlafziel</p>
            <p className="text-sm font-bold">{activeGoal.fields.schlaf_ziel_stunden} Stunden</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {activeGoal.fields.notizen && (
        <p className="text-xs text-muted-foreground italic px-1">{activeGoal.fields.notizen}</p>
      )}
    </div>
  );
}
