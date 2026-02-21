import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Koerperdaten } from '@/types/app';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  koerperdaten: Koerperdaten[];
  loading: boolean;
}

interface ChartPoint {
  date: string;
  dateLabel: string;
  gewicht?: number;
  kfa?: number;
}

export default function BodyMetricsChart({ koerperdaten, loading }: Props) {
  const chartData = useMemo<ChartPoint[]>(() => {
    return koerperdaten
      .filter(k => k.fields.datum)
      .sort((a, b) => (a.fields.datum! > b.fields.datum! ? 1 : -1))
      .slice(-12)
      .map(k => ({
        date: k.fields.datum!,
        dateLabel: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
        gewicht: k.fields.gewicht_kg,
        kfa: k.fields.kfa_geschaetzt,
      }));
  }, [koerperdaten]);

  const latest = koerperdaten
    .filter(k => k.fields.datum)
    .sort((a, b) => (a.fields.datum! > b.fields.datum! ? -1 : 1))[0];

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (koerperdaten.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Körperdaten vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Latest snapshot */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          {latest.fields.gewicht_kg != null && (
            <div className="bg-accent/60 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Gewicht</p>
              <p className="text-lg font-bold text-foreground">{latest.fields.gewicht_kg}<span className="text-xs font-normal ml-0.5">kg</span></p>
            </div>
          )}
          {latest.fields.kfa_geschaetzt != null && (
            <div className="bg-accent/60 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">KFA</p>
              <p className="text-lg font-bold text-foreground">{latest.fields.kfa_geschaetzt}<span className="text-xs font-normal ml-0.5">%</span></p>
            </div>
          )}
          {latest.fields.taillenumfang != null && (
            <div className="bg-accent/60 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Taille</p>
              <p className="text-lg font-bold text-foreground">{latest.fields.taillenumfang}<span className="text-xs font-normal ml-0.5">cm</span></p>
            </div>
          )}
        </div>
      )}

      {/* Weight trend chart */}
      {chartData.filter(d => d.gewicht != null).length >= 2 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Gewichtsverlauf</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'Outfit, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'Outfit, sans-serif' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'Outfit, sans-serif',
                }}
                formatter={(val: number) => [`${val} kg`, 'Gewicht']}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="gewicht"
                stroke="oklch(0.52 0.18 148)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'oklch(0.52 0.18 148)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* KFA trend */}
      {chartData.filter(d => d.kfa != null).length >= 2 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">KFA-Verlauf</p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'Outfit, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'Outfit, sans-serif' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'Outfit, sans-serif',
                }}
                formatter={(val: number) => [`${val}%`, 'KFA']}
              />
              <Line
                type="monotone"
                dataKey="kfa"
                stroke="oklch(0.62 0.19 300)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'oklch(0.62 0.19 300)', strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
