import { useState } from 'react';
import { Plus, Trash2, Edit2, Utensils, Flame, Beef } from 'lucide-react';
import type { Ernaehrung, Ziele } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  selectedDate: string;
  ernaehrung: Ernaehrung[];
  activeGoal: Ziele | null;
  loading: boolean;
  onRefresh: () => void;
}

const MAHLZEIT_TYPES = {
  fruehstueck: 'Frühstück',
  snack: 'Snack',
  mittagessen: 'Mittagessen',
  abendessen: 'Abendessen',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  sonstiges: 'Sonstiges',
};

const MAHLZEIT_ORDER = ['fruehstueck', 'pre_workout', 'mittagessen', 'snack', 'post_workout', 'abendessen', 'sonstiges'];

export default function TodayNutritionPanel({ selectedDate, ernaehrung, activeGoal, loading, onRefresh }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Ernaehrung | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    mahlzeit_typ: 'mittagessen',
    beschreibung: '',
    kalorien: '',
    protein: '',
    carbs: '',
    fett: '',
  });

  const todayMeals = ernaehrung
    .filter(e => e.fields.datum === selectedDate)
    .sort((a, b) => MAHLZEIT_ORDER.indexOf(a.fields.mahlzeit_typ || 'sonstiges') - MAHLZEIT_ORDER.indexOf(b.fields.mahlzeit_typ || 'sonstiges'));

  const totalKcal = todayMeals.reduce((s, m) => s + (m.fields.kalorien || 0), 0);
  const totalProtein = todayMeals.reduce((s, m) => s + (m.fields.protein || 0), 0);
  const totalCarbs = todayMeals.reduce((s, m) => s + (m.fields.carbs || 0), 0);
  const totalFett = todayMeals.reduce((s, m) => s + (m.fields.fett || 0), 0);

  const goalKcal = activeGoal?.fields.taeglich_kalorien;
  const goalProtein = activeGoal?.fields.taeglich_protein;
  const kcalPct = goalKcal ? Math.min((totalKcal / goalKcal) * 100, 100) : null;
  const proteinPct = goalProtein ? Math.min((totalProtein / goalProtein) * 100, 100) : null;

  function openCreate() {
    setEditing(null);
    setForm({ mahlzeit_typ: 'mittagessen', beschreibung: '', kalorien: '', protein: '', carbs: '', fett: '' });
    setShowDialog(true);
  }

  function openEdit(entry: Ernaehrung) {
    setEditing(entry);
    setForm({
      mahlzeit_typ: entry.fields.mahlzeit_typ || 'mittagessen',
      beschreibung: entry.fields.beschreibung || '',
      kalorien: String(entry.fields.kalorien ?? ''),
      protein: String(entry.fields.protein ?? ''),
      carbs: String(entry.fields.carbs ?? ''),
      fett: String(entry.fields.fett ?? ''),
    });
    setShowDialog(true);
  }

  async function save() {
    setSaving(true);
    try {
      const fields: Ernaehrung['fields'] = {
        datum: selectedDate,
        mahlzeit_typ: form.mahlzeit_typ as Ernaehrung['fields']['mahlzeit_typ'],
        beschreibung: form.beschreibung || undefined,
        kalorien: form.kalorien ? Number(form.kalorien) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fett: form.fett ? Number(form.fett) : undefined,
      };
      if (editing) {
        await LivingAppsService.updateErnaehrungEntry(editing.record_id, fields);
      } else {
        await LivingAppsService.createErnaehrungEntry(fields);
      }
      setShowDialog(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await LivingAppsService.deleteErnaehrungEntry(id);
    onRefresh();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bars */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-semibold text-muted-foreground">Kalorien</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-foreground">{totalKcal}</span>
            {goalKcal && <span className="text-xs text-muted-foreground mb-0.5">/ {goalKcal} kcal</span>}
          </div>
          {kcalPct !== null && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${kcalPct}%`,
                  background: kcalPct >= 100 ? 'oklch(0.577 0.245 27.325)' : 'var(--gradient-energy)',
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Beef size={14} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Protein</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-foreground">{totalProtein}g</span>
            {goalProtein && <span className="text-xs text-muted-foreground mb-0.5">/ {goalProtein}g</span>}
          </div>
          {proteinPct !== null && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${proteinPct}%`,
                  background: 'var(--gradient-primary)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Makros mini summary */}
      {(totalCarbs > 0 || totalFett > 0) && (
        <div className="flex gap-3 text-xs text-muted-foreground px-1">
          <span>Carbs: <strong className="text-foreground">{totalCarbs}g</strong></span>
          <span>Fett: <strong className="text-foreground">{totalFett}g</strong></span>
        </div>
      )}

      {/* Meal list */}
      <div className="space-y-1.5">
        {todayMeals.map(meal => (
          <div key={meal.record_id} className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5 border border-border/50 shadow-sm group">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {MAHLZEIT_TYPES[meal.fields.mahlzeit_typ || 'sonstiges']}
                </span>
                {meal.fields.kalorien != null && (
                  <span className="text-xs font-medium text-orange-500">{meal.fields.kalorien} kcal</span>
                )}
                {meal.fields.protein != null && (
                  <span className="text-xs text-primary font-medium">{meal.fields.protein}g P</span>
                )}
              </div>
              {meal.fields.beschreibung && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{meal.fields.beschreibung}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" onClick={() => openEdit(meal)}>
                <Edit2 size={12} />
              </button>
              <button className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => remove(meal.record_id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed border-primary/40 text-primary hover:bg-accent hover:text-primary"
        onClick={openCreate}
      >
        <Plus size={14} className="mr-1" /> Mahlzeit hinzufügen
      </Button>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Mahlzeit bearbeiten' : 'Mahlzeit hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Mahlzeitentyp</Label>
              <Select value={form.mahlzeit_typ} onValueChange={v => setForm(f => ({ ...f, mahlzeit_typ: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAHLZEIT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Beschreibung</Label>
              <Input
                placeholder="z.B. Hähnchenbrust mit Reis"
                value={form.beschreibung}
                onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Kalorien (kcal)</Label>
                <Input type="number" placeholder="0" value={form.kalorien} onChange={e => setForm(f => ({ ...f, kalorien: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Protein (g)</Label>
                <Input type="number" placeholder="0" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Carbs (g)</Label>
                <Input type="number" placeholder="0" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fett (g)</Label>
                <Input type="number" placeholder="0" value={form.fett} onChange={e => setForm(f => ({ ...f, fett: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
