import { useMemo } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { Koerperdaten } from '@/types/app';
import { TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react';

interface Props {
  koerperdaten: Koerperdaten[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-700 text-foreground text-sm">{payload[0].value} kg</p>
    </div>
  );
}

export default function BodyWeightChart({ koerperdaten }: Props) {
  const sorted = useMemo(() => {
    return [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''))
      .slice(-30);
  }, [koerperdaten]);

  const chartData = useMemo(() => {
    return sorted.map(k => ({
      date: k.fields.datum!,
      label: format(parseISO(k.fields.datum!), 'd. MMM', { locale: de }),
      weight: k.fields.gewicht_kg!,
      kfa: k.fields.kfa_geschaetzt,
    }));
  }, [sorted]);

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const diff = latest && previous && latest.fields.gewicht_kg && previous.fields.gewicht_kg
    ? latest.fields.gewicht_kg - previous.fields.gewicht_kg
    : null;

  const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) - 1 : 0;
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) + 1 : 100;

  if (koerperdaten.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-3 text-center">
        <Scale size={24} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Noch keine Körperdaten eingetragen.</p>
        <p className="text-xs text-muted-foreground">Trage dein Gewicht unter Körperdaten ein.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-4 border-b border-border">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Verlauf (30 Tage)</p>
          <h3 className="text-lg font-700 text-foreground mt-0.5">Körpergewicht</h3>
        </div>
        {latest?.fields.gewicht_kg && (
          <div className="text-right">
            <p className="text-2xl font-800 text-foreground">{latest.fields.gewicht_kg}<span className="text-sm font-400 text-muted-foreground"> kg</span></p>
            {diff !== null && (
              <div className={`flex items-center gap-1 justify-end text-xs font-600 ${
                diff < 0 ? 'text-green-600' : diff > 0 ? 'text-orange-500' : 'text-muted-foreground'
              }`}>
                {diff < 0 ? <TrendingDown size={12} /> : diff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)} kg</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.62 0.21 38)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="oklch(0.62 0.21 38)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[minWeight, maxWeight]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="weight" stroke="oklch(0.62 0.21 38)"
              strokeWidth={2.5} fill="url(#weightGrad)" dot={chartData.length < 10}
              activeDot={{ r: 4, fill: 'oklch(0.62 0.21 38)', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Body measurements summary */}
      {latest && (
        <div className="px-5 pb-4 grid grid-cols-3 gap-3">
          {latest.fields.kfa_geschaetzt && (
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">KFA</p>
              <p className="font-700 text-foreground">{latest.fields.kfa_geschaetzt}%</p>
            </div>
          )}
          {latest.fields.taillenumfang && (
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Taille</p>
              <p className="font-700 text-foreground">{latest.fields.taillenumfang} cm</p>
            </div>
          )}
          {latest.fields.armumfang && (
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Arm</p>
              <p className="font-700 text-foreground">{latest.fields.armumfang} cm</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
