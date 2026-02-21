import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Utensils } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Ernaehrung, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  ernaehrung: Ernaehrung[];
  ziele: Ziele[];
  onErnaehrungChange: (e: Ernaehrung[]) => void;
}

const MAHLZEIT_LABELS: Record<string, string> = {
  fruehstueck: 'Frühstück', snack: 'Snack', mittagessen: 'Mittagessen',
  abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges'
};

const MAHLZEIT_EMOJI: Record<string, string> = {
  fruehstueck: '🌅', snack: '🍎', mittagessen: '🍽️',
  abendessen: '🌙', pre_workout: '⚡', post_workout: '💪', sonstiges: '🥄'
};

function Ring({ value, max, color, label, unit }: {
  value: number; max: number; color: string; label: string; unit: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const data = [
    { v: pct },
    { v: 1 - pct },
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={36}
              startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}>
              <Cell fill={color} />
              <Cell fill="var(--muted)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-700 text-foreground">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-600 text-foreground">{value}<span className="text-muted-foreground font-400">{unit}</span></p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {max > 0 && <p className="text-[10px] text-muted-foreground">/ {max}{unit}</p>}
      </div>
    </div>
  );
}

export default function NutritionRings({ ernaehrung, ziele, onErnaehrungChange }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMeals = ernaehrung.filter(e => e.fields.datum === today);
  const activeGoal = ziele.find(z => z.fields.status === 'aktiv');

  const totals = todayMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (m.fields.kalorien ?? 0),
      protein: acc.protein + (m.fields.protein ?? 0),
      carbs: acc.carbs + (m.fields.carbs ?? 0),
      fett: acc.fett + (m.fields.fett ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fett: 0 }
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mahlzeit_typ: 'mittagessen', beschreibung: '',
    kalorien: '', protein: '', carbs: '', fett: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      await LivingAppsService.createErnaehrungEntry({
        datum: today,
        mahlzeit_typ: form.mahlzeit_typ as Ernaehrung['fields']['mahlzeit_typ'],
        beschreibung: form.beschreibung || undefined,
        kalorien: form.kalorien ? Number(form.kalorien) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fett: form.fett ? Number(form.fett) : undefined,
      });
      const updated = await LivingAppsService.getErnaehrung();
      onErnaehrungChange(updated);
      setShowForm(false);
      setForm({ mahlzeit_typ: 'mittagessen', beschreibung: '', kalorien: '', protein: '', carbs: '', fett: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Heute</p>
          <h2 className="text-2xl font-800 text-foreground mt-0.5">Ernährung</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}
          variant="outline" className="gap-1.5 border-primary text-primary hover:bg-accent">
          <Plus size={14} /> Mahlzeit
        </Button>
      </div>

      {/* Macro rings */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex justify-around">
          <Ring value={Math.round(totals.kcal)} max={activeGoal?.fields.taeglich_kalorien ?? 0}
            color="oklch(0.62 0.21 38)" label="Kalorien" unit=" kcal" />
          <Ring value={Math.round(totals.protein)} max={activeGoal?.fields.taeglich_protein ?? 0}
            color="oklch(0.55 0.18 155)" label="Protein" unit="g" />
          <Ring value={Math.round(totals.carbs)} max={0}
            color="oklch(0.58 0.16 264)" label="Carbs" unit="g" />
          <Ring value={Math.round(totals.fett)} max={0}
            color="oklch(0.65 0.19 300)" label="Fett" unit="g" />
        </div>
      </div>

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {todayMeals.map(meal => (
            <div key={meal.record_id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{MAHLZEIT_EMOJI[meal.fields.mahlzeit_typ ?? 'sonstiges']}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-600 text-foreground truncate">
                  {meal.fields.beschreibung || MAHLZEIT_LABELS[meal.fields.mahlzeit_typ ?? 'sonstiges']}
                </p>
                <p className="text-xs text-muted-foreground">
                  {MAHLZEIT_LABELS[meal.fields.mahlzeit_typ ?? 'sonstiges']}
                </p>
              </div>
              <div className="text-right shrink-0">
                {meal.fields.kalorien && (
                  <p className="text-sm font-700 text-primary">{meal.fields.kalorien} kcal</p>
                )}
                {meal.fields.protein && (
                  <p className="text-xs text-muted-foreground">{meal.fields.protein}g P</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {todayMeals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Utensils size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Mahlzeiten eingetragen.</p>
        </div>
      )}

      {/* Add Meal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mahlzeit eintragen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Mahlzeitentyp</Label>
              <Select value={form.mahlzeit_typ} onValueChange={v => setForm(f => ({ ...f, mahlzeit_typ: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAHLZEIT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{MAHLZEIT_EMOJI[k]} {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschreibung (optional)</Label>
              <Input className="mt-1.5" placeholder="z.B. Hähnchenbrust mit Reis"
                value={form.beschreibung}
                onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kalorien (kcal)</Label>
                <Input type="number" className="mt-1.5" placeholder="500"
                  value={form.kalorien}
                  onChange={e => setForm(f => ({ ...f, kalorien: e.target.value }))} />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input type="number" className="mt-1.5" placeholder="40"
                  value={form.protein}
                  onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input type="number" className="mt-1.5" placeholder="60"
                  value={form.carbs}
                  onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
              </div>
              <div>
                <Label>Fett (g)</Label>
                <Input type="number" className="mt-1.5" placeholder="15"
                  value={form.fett}
                  onChange={e => setForm(f => ({ ...f, fett: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full bg-primary text-primary-foreground">
              {saving ? 'Wird gespeichert...' : 'Mahlzeit speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
