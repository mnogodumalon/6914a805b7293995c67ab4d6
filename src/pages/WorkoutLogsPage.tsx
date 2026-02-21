import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { WorkoutLogs, Workouts, Uebungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { WorkoutLogsDialog } from '@/components/dialogs/WorkoutLogsDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';

export default function WorkoutLogsPage() {
  const [records, setRecords] = useState<WorkoutLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkoutLogs | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutLogs | null>(null);
  const [workoutsList, setWorkoutsList] = useState<Workouts[]>([]);
  const [uebungenList, setUebungenList] = useState<Uebungen[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, workoutsData, uebungenData] = await Promise.all([
        LivingAppsService.getWorkoutLogs(),
        LivingAppsService.getWorkouts(),
        LivingAppsService.getUebungen(),
      ]);
      setRecords(mainData);
      setWorkoutsList(workoutsData);
      setUebungenList(uebungenData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: WorkoutLogs['fields']) {
    await LivingAppsService.createWorkoutLog(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: WorkoutLogs['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateWorkoutLog(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteWorkoutLog(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getWorkoutsDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return workoutsList.find(r => r.record_id === id)?.fields.datum ?? '—';
  }

  function getUebungenDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return uebungenList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v =>
      String(v ?? '').toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Workout-Logs"
      subtitle={`${records.length} Workout-Logs im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Workout-Logs suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workout</TableHead>
              <TableHead>Übung</TableHead>
              <TableHead>Satznummer</TableHead>
              <TableHead>Gewicht (kg)</TableHead>
              <TableHead>Wiederholungen</TableHead>
              <TableHead>RPE / Gefühl</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getWorkoutsDisplayName(record.fields.workout)}</TableCell>
                <TableCell>{getUebungenDisplayName(record.fields.uebung)}</TableCell>
                <TableCell>{record.fields.satz_nummer ?? '—'}</TableCell>
                <TableCell>{record.fields.gewicht ?? '—'}</TableCell>
                <TableCell>{record.fields.wiederholungen ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{record.fields.rpe ?? '—'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Workout-Logs. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <WorkoutLogsDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        workoutsList={workoutsList}
        uebungenList={uebungenList}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Workout-Logs löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}