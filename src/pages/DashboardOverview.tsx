import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Workouts, WorkoutLogs, Uebungen, Ernaehrung, Ziele, Koerperdaten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import TodayWorkoutPanel from '@/components/TodayWorkoutPanel';
import NutritionRings from '@/components/NutritionRings';
import BodyWeightChart from '@/components/BodyWeightChart';
import WeeklyActivity from '@/components/WeeklyActivity';

interface AppData {
  workouts: Workouts[];
  workoutLogs: WorkoutLogs[];
  uebungen: Uebungen[];
  ernaehrung: Ernaehrung[];
  ziele: Ziele[];
  koerperdaten: Koerperdaten[];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [workouts, workoutLogs, uebungen, ernaehrung, ziele, koerperdaten] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getWorkoutLogs(),
          LivingAppsService.getUebungen(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getZiele(),
          LivingAppsService.getKoerperdaten(),
        ]);
        setData({ workouts, workoutLogs, uebungen, ernaehrung, ziele, koerperdaten });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle size={16} />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-10">
      {/* Main workspace: workout + nutrition side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero: Today's Workout — takes 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <TodayWorkoutPanel
            workouts={data.workouts}
            workoutLogs={data.workoutLogs}
            uebungen={data.uebungen}
            onWorkoutsChange={w => setData(d => d ? { ...d, workouts: w } : d)}
            onLogsChange={l => setData(d => d ? { ...d, workoutLogs: l } : d)}
          />
        </div>

        {/* Sidebar: Nutrition */}
        <div>
          <NutritionRings
            ernaehrung={data.ernaehrung}
            ziele={data.ziele}
            onErnaehrungChange={e => setData(d => d ? { ...d, ernaehrung: e } : d)}
          />
        </div>
      </div>

      {/* Second row: Activity heatmap + Body weight chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyActivity workouts={data.workouts} />
        <BodyWeightChart koerperdaten={data.koerperdaten} />
      </div>
    </div>
  );
}
