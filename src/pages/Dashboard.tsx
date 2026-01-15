import { useCallback, useEffect, useMemo, useState } from "react"
import {
  format,
  isSameWeek,
  parseISO,
} from "date-fns"
import { de } from "date-fns/locale"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Flame,
  Salad,
  Scale,
  Target,
} from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Toaster, toast } from "sonner"

import type {
  Ernaehrung,
  Koerperdaten,
  Uebungen,
  WorkoutLogs,
  Workouts,
  Ziele,
} from "@/types/app"
import {
  LivingAppsService,
  extractRecordId,
} from "@/services/livingAppsService"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const MEAL_TYPE_LABELS: Record<string, string> = {
  fruehstueck: "Fruehstueck",
  snack: "Snack",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  pre_workout: "Pre-Workout",
  post_workout: "Post-Workout",
  sonstiges: "Sonstiges",
}

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  beine: "Beine",
  ganzkoerper: "Ganzkoerper",
  oberkoerper: "Oberkoerper",
  unterkoerper: "Unterkoerper",
  cardio: "Cardio",
  sonstiges: "Sonstiges",
}

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  brust: "Brust",
  ruecken: "Ruecken",
  beine: "Beine",
  schultern: "Schultern",
  bizeps: "Bizeps",
  trizeps: "Trizeps",
  bauch: "Bauch",
  ganzkoerper: "Ganzkoerper",
}

const GOAL_STATUS_LABELS: Record<string, string> = {
  aktiv: "Aktiv",
  erreicht: "Erreicht",
  verworfen: "Verworfen",
}

type DashboardData = {
  uebungen: Uebungen[]
  workouts: Workouts[]
  workoutLogs: WorkoutLogs[]
  ziele: Ziele[]
  ernaehrung: Ernaehrung[]
  koerperdaten: Koerperdaten[]
}

type MealFormState = {
  datum: string
  mahlzeit_typ: Ernaehrung["fields"]["mahlzeit_typ"] | "none"
  beschreibung: string
  kalorien: string
  protein: string
  carbs: string
  fett: string
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])

  return matches
}

function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value == null) return "-"
  return new Intl.NumberFormat("de-DE", options).format(value)
}

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getRecordDateValue(datum?: string | null, createdAt?: string | null) {
  return datum ?? createdAt ?? null
}

function getMealDefault(todayKey: string): MealFormState {
  return {
    datum: todayKey,
    mahlzeit_typ: "none",
    beschreibung: "",
    kalorien: "",
    protein: "",
    carbs: "",
    fett: "",
  }
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardList className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent />
    </Empty>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="hidden h-10 w-44 md:block" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="gap-4 py-4 lg:col-span-7">
          <CardHeader className="px-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40" />
          </CardHeader>
          <CardContent className="px-4">
            <Skeleton className="h-44 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:col-span-5">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-7" />
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-5" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-7" />
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-5" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    uebungen: [],
    workouts: [],
    workoutLogs: [],
    ziele: [],
    ernaehrung: [],
    koerperdaten: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [mealDialogOpen, setMealDialogOpen] = useState(false)
  const [mealSubmitting, setMealSubmitting] = useState(false)
  const [mealError, setMealError] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 767px)")

  const todayKey = format(new Date(), "yyyy-MM-dd")
  const todayLabel = format(new Date(), "dd.MM.yyyy", { locale: de })

  const [mealForm, setMealForm] = useState<MealFormState>(() =>
    getMealDefault(todayKey)
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [uebungen, workouts, workoutLogs, ziele, ernaehrung, koerperdaten] =
        await Promise.all([
          LivingAppsService.getUebungen(),
          LivingAppsService.getWorkouts(),
          LivingAppsService.getWorkoutLogs(),
          LivingAppsService.getZiele(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
        ])
      setData({
        uebungen,
        workouts,
        workoutLogs,
        ziele,
        ernaehrung,
        koerperdaten,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unbekannter Fehler"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const goalsSorted = useMemo(() => {
    const goals = [...data.ziele]
    return goals.sort((a, b) => {
      const statusRank = (status?: Ziele["fields"]["status"]) => {
        if (status === "aktiv") return 0
        if (status === "erreicht") return 1
        return 2
      }
      const rankDiff = statusRank(a.fields.status) - statusRank(b.fields.status)
      if (rankDiff !== 0) return rankDiff
      const dateA = parseDate(getRecordDateValue(a.createdat, a.updatedat))
      const dateB = parseDate(getRecordDateValue(b.createdat, b.updatedat))
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0)
    })
  }, [data.ziele])

  const activeGoal = goalsSorted.find((goal) => goal.fields.status === "aktiv")
  const goalRecord = activeGoal ?? goalsSorted[0] ?? null

  const todayMeals = useMemo(() => {
    return data.ernaehrung.filter((meal) => meal.fields.datum === todayKey)
  }, [data.ernaehrung, todayKey])

  const todayTotals = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => {
        acc.kalorien += meal.fields.kalorien ?? 0
        acc.protein += meal.fields.protein ?? 0
        acc.carbs += meal.fields.carbs ?? 0
        acc.fett += meal.fields.fett ?? 0
        return acc
      },
      { kalorien: 0, protein: 0, carbs: 0, fett: 0 }
    )
  }, [todayMeals])

  const calorieGoal = goalRecord?.fields.taeglich_kalorien ?? null
  const proteinGoal = goalRecord?.fields.taeglich_protein ?? null
  const trainingGoal = goalRecord?.fields.trainingstage_pro_woche ?? null

  const calorieProgress = calorieGoal ? todayTotals.kalorien / calorieGoal : 0
  const calorieProgressClamped = Math.min(Math.max(calorieProgress, 0), 1)

  const workoutsThisWeek = useMemo(() => {
    return data.workouts.filter((workout) => {
      const dateValue = getRecordDateValue(workout.fields.datum, workout.createdat)
      const parsed = parseDate(dateValue)
      if (!parsed) return false
      if (workout.fields.rest_day) return false
      return isSameWeek(parsed, new Date(), { weekStartsOn: 1 })
    })
  }, [data.workouts])

  const workoutsById = useMemo(() => {
    const map = new Map<string, Workouts>()
    data.workouts.forEach((workout) => {
      map.set(workout.record_id, workout)
    })
    return map
  }, [data.workouts])

  const logsByWorkoutId = useMemo(() => {
    const map = new Map<string, WorkoutLogs[]>()
    data.workoutLogs.forEach((log) => {
      const workoutId = extractRecordId(log.fields.workout)
      if (!workoutId) return
      if (!map.has(workoutId)) map.set(workoutId, [])
      map.get(workoutId)?.push(log)
    })
    return map
  }, [data.workoutLogs])

  const setsThisWeek = useMemo(() => {
    return data.workoutLogs.filter((log) => {
      const workoutId = extractRecordId(log.fields.workout)
      if (!workoutId) return false
      const workout = workoutsById.get(workoutId)
      if (!workout) return false
      const dateValue = getRecordDateValue(workout.fields.datum, workout.createdat)
      const parsed = parseDate(dateValue)
      if (!parsed) return false
      return isSameWeek(parsed, new Date(), { weekStartsOn: 1 })
    }).length
  }, [data.workoutLogs, workoutsById])

  const exerciseById = useMemo(() => {
    const map = new Map<string, Uebungen>()
    data.uebungen.forEach((exercise) => {
      map.set(exercise.record_id, exercise)
    })
    return map
  }, [data.uebungen])

  const weightEntries = useMemo(() => {
    return data.koerperdaten
      .filter((entry) => entry.fields.gewicht_kg != null)
      .map((entry) => {
        const dateValue = getRecordDateValue(entry.fields.datum, entry.createdat)
        return {
          entry,
          dateValue,
          date: parseDate(dateValue),
        }
      })
      .filter((entry) => entry.date)
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  }, [data.koerperdaten])

  const latestWeight = weightEntries[0]?.entry ?? null
  const previousWeight = weightEntries[1]?.entry ?? null
  const weightDelta =
    latestWeight?.fields.gewicht_kg != null &&
    previousWeight?.fields.gewicht_kg != null
      ? latestWeight.fields.gewicht_kg - previousWeight.fields.gewicht_kg
      : null

  const weightChartData = useMemo(() => {
    return weightEntries
      .slice()
      .reverse()
      .map((entry) => {
        const dateLabel = entry.date
          ? format(entry.date, "dd.MM", { locale: de })
          : "-"
        return {
          date: dateLabel,
          weight: entry.entry.fields.gewicht_kg ?? 0,
        }
      })
  }, [weightEntries])

  const uebungenStats = useMemo(() => {
    const counts = new Map<string, number>()
    data.uebungen.forEach((exercise) => {
      const group = exercise.fields.muskelgruppe
      if (!group) return
      counts.set(group, (counts.get(group) ?? 0) + 1)
    })
    const sorted = Array.from(counts.entries())
      .map(([group, count]) => ({
        group,
        label: MUSCLE_GROUP_LABELS[group] ?? "Unbekannt",
        count,
      }))
      .sort((a, b) => b.count - a.count)
    return sorted
  }, [data.uebungen])

  const topMuscleGroup = uebungenStats[0]?.label ?? "-"
  const maxMuscleCount = uebungenStats[0]?.count ?? 1

  const workoutList = useMemo(() => {
    return [...data.workouts]
      .sort((a, b) => {
        const dateA = parseDate(getRecordDateValue(a.fields.datum, a.createdat))
        const dateB = parseDate(getRecordDateValue(b.fields.datum, b.createdat))
        return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0)
      })
      .map((workout) => {
        const dateValue = getRecordDateValue(workout.fields.datum, workout.createdat)
        const dateLabel = dateValue
          ? format(parseISO(dateValue), "dd.MM.yyyy", { locale: de })
          : "-"
        const logs = logsByWorkoutId.get(workout.record_id) ?? []
        const exerciseCounts = new Map<string, number>()
        logs.forEach((log) => {
          const exerciseId = extractRecordId(log.fields.uebung)
          if (!exerciseId) return
          exerciseCounts.set(exerciseId, (exerciseCounts.get(exerciseId) ?? 0) + 1)
        })
        const topExercises = Array.from(exerciseCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([exerciseId]) =>
            exerciseById.get(exerciseId)?.fields.name ?? "Unbekannt"
          )
        return {
          id: workout.record_id,
          dateLabel,
          typeLabel:
            WORKOUT_TYPE_LABELS[workout.fields.typ ?? "sonstiges"] ?? "Sonstiges",
          duration: workout.fields.dauer_minuten ?? null,
          sets: logs.length,
          topExercises,
        }
      })
  }, [data.workouts, exerciseById, logsByWorkoutId])

  const mealList = useMemo(() => {
    return [...data.ernaehrung]
      .sort((a, b) => {
        const dateA = parseDate(getRecordDateValue(a.fields.datum, a.createdat))
        const dateB = parseDate(getRecordDateValue(b.fields.datum, b.createdat))
        return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0)
      })
      .map((meal) => {
        const dateLabel = meal.fields.datum
          ? format(parseISO(meal.fields.datum), "dd.MM.yyyy", { locale: de })
          : "-"
        const mealType = meal.fields.mahlzeit_typ
        return {
          id: meal.record_id,
          dateLabel,
          typeLabel: mealType ? MEAL_TYPE_LABELS[mealType] ?? "Sonstiges" : "-",
          kalorien: meal.fields.kalorien ?? null,
          protein: meal.fields.protein ?? null,
        }
      })
  }, [data.ernaehrung])

  const workoutLimit = isMobile ? 3 : 5
  const mealLimit = isMobile ? 3 : 5
  const goalsLimit = isMobile ? 2 : 3

  const workoutSlice = workoutList.slice(0, workoutLimit)
  const mealSlice = mealList.slice(0, mealLimit)
  const goalsSlice = goalsSorted.slice(0, goalsLimit)
  const muscleSlice = uebungenStats.slice(0, 4)

  const backgroundStyle = {
    backgroundImage:
      "radial-gradient(800px circle at 85% -10%, hsla(18, 70%, 52%, 0.16), transparent 60%), radial-gradient(700px circle at -10% 110%, hsla(164, 45%, 24%, 0.12), transparent 65%)",
  }

  const handleMealSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMealError(null)
    setMealSubmitting(true)

    const parseOptionalNumber = (value: string) => {
      if (!value.trim()) return undefined
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }

    const payload: Ernaehrung["fields"] = {
      datum: mealForm.datum,
      mahlzeit_typ: mealForm.mahlzeit_typ === "none" ? undefined : mealForm.mahlzeit_typ,
      beschreibung: mealForm.beschreibung.trim() || undefined,
      kalorien: parseOptionalNumber(mealForm.kalorien),
      protein: parseOptionalNumber(mealForm.protein),
      carbs: parseOptionalNumber(mealForm.carbs),
      fett: parseOptionalNumber(mealForm.fett),
    }

    try {
      await LivingAppsService.createErnaehrungEntry(payload)
      toast.success("Mahlzeit gespeichert")
      setMealDialogOpen(false)
      setMealForm(getMealDefault(todayKey))
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Speichern fehlgeschlagen"
      setMealError(message)
      toast.error("Speichern fehlgeschlagen")
    } finally {
      setMealSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10" style={backgroundStyle}>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10" style={backgroundStyle}>
        <Alert variant="destructive" className="max-w-3xl">
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span>{error.message}</span>
            <Button variant="outline" onClick={loadData}>
              Neu laden
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <Toaster position="top-right" richColors />
      <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Fitness & Ernaehrung
              </h1>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {todayLabel}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground md:hidden">
                {todayLabel}
              </span>
              <DialogTrigger asChild>
                <Button className="hidden items-center gap-2 transition-transform active:scale-[0.98] md:inline-flex">
                  <Salad className="size-4" />
                  Mahlzeit hinzufuegen
                </Button>
              </DialogTrigger>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Card
              className="relative min-h-[52vh] gap-4 overflow-hidden py-4 shadow-sm transition-shadow hover:shadow-md md:min-h-[320px] lg:col-span-7 animate-in fade-in slide-in-from-bottom-2 duration-700"
              style={{ animationDelay: "0ms" }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(18,70%,52%,0.14),transparent_55%)]" />
              <CardHeader className="relative px-4">
                <CardTitle className="text-sm text-muted-foreground">
                  Kalorien heute
                </CardTitle>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-semibold">
                    {formatNumber(todayTotals.kalorien)}
                  </span>
                  <span className="text-sm text-muted-foreground">kcal</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ziel: {formatNumber(calorieGoal)} kcal
                </p>
              </CardHeader>
              <CardContent className="relative px-4">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                        Protein: {formatNumber(todayTotals.protein)}g
                        {proteinGoal ? ` / ${formatNumber(proteinGoal)}g` : ""}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                        Carbs: {formatNumber(todayTotals.carbs)}g
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                        Fett: {formatNumber(todayTotals.fett)}g
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flame className="size-4 text-muted-foreground" />
                      {goalRecord?.fields.status
                        ? `Status: ${GOAL_STATUS_LABELS[goalRecord.fields.status]}`
                        : "Kein aktives Ziel"}
                    </div>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <div className="relative h-32 w-32">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(var(--accent) 0deg ${
                            calorieProgressClamped * 360
                          }deg, var(--muted) ${
                            calorieProgressClamped * 360
                          }deg 360deg)`,
                        }}
                      />
                      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card">
                        <span className="text-2xl font-semibold">
                          {Math.round(calorieProgressClamped * 100)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          erreicht
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:col-span-5">
              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "150ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Workouts diese Woche
                  </CardTitle>
                  <Dumbbell className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-semibold">
                    {formatNumber(workoutsThisWeek.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ziel: {formatNumber(trainingGoal)} Tage
                  </p>
                </CardContent>
              </Card>

              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "300ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Saetze diese Woche
                  </CardTitle>
                  <Activity className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-semibold">
                    {formatNumber(setsThisWeek)}
                  </div>
                  <p className="text-xs text-muted-foreground">Workout-Logs</p>
                </CardContent>
              </Card>

              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "450ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Letztes Gewicht
                  </CardTitle>
                  <Scale className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-semibold">
                    {latestWeight?.fields.gewicht_kg != null
                      ? `${formatNumber(latestWeight.fields.gewicht_kg, {
                          maximumFractionDigits: 1,
                        })} kg`
                      : "-"}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    {weightDelta == null ? (
                      "Keine Vorwerte"
                    ) : weightDelta >= 0 ? (
                      <>
                        <ArrowUpRight className="size-3" />
                        +{formatNumber(weightDelta, { maximumFractionDigits: 1 })} kg
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="size-3" />
                        {formatNumber(weightDelta, { maximumFractionDigits: 1 })} kg
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "600ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Uebungen Katalog
                  </CardTitle>
                  <Target className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-semibold">
                    {formatNumber(data.uebungen.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">Top: {topMuscleGroup}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Card
              className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md lg:col-span-7 animate-in fade-in slide-in-from-bottom-2 duration-700"
              style={{ animationDelay: "0ms" }}
            >
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <div>
                  <CardTitle className="text-base">Gewichtstrend</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Verlauf der letzten Eintraege
                  </p>
                </div>
                <CalendarDays className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                {weightChartData.length === 0 ? (
                  <EmptyState
                    title="Noch keine Koerperdaten"
                    description="Fuer einen Trend brauchst du mindestens einen Eintrag."
                  />
                ) : (
                  <div className="h-[220px] md:h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                          }}
                          labelStyle={{ color: "var(--muted-foreground)" }}
                          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md lg:col-span-5 animate-in fade-in slide-in-from-bottom-2 duration-700"
              style={{ animationDelay: "150ms" }}
            >
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <div>
                  <CardTitle className="text-base">Letzte Workouts</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fokus und Saetze pro Session
                  </p>
                </div>
                <Dumbbell className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                {workoutSlice.length === 0 ? (
                  <EmptyState
                    title="Noch keine Workouts"
                    description="Sobald du ein Workout loggst, erscheint es hier."
                  />
                ) : (
                  <div className="space-y-3">
                    {workoutSlice.map((workout) => (
                      <div
                        key={workout.id}
                        className="min-h-[44px] rounded-lg border border-border px-3 py-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{workout.typeLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {workout.dateLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{formatNumber(workout.duration)} min</span>
                          <span>•</span>
                          <span>{formatNumber(workout.sets)} Saetze</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {workout.topExercises.length === 0 ? (
                            <span className="text-muted-foreground">
                              Keine Uebungen verknuepft
                            </span>
                          ) : (
                            workout.topExercises.map((name) => (
                              <span
                                key={name}
                                className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground"
                              >
                                {name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                    {data.workouts.length > workoutLimit && (
                      <p className="text-xs text-muted-foreground md:hidden">
                        Mehr anzeigen
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Card
              className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md lg:col-span-7 animate-in fade-in slide-in-from-bottom-2 duration-700"
              style={{ animationDelay: "0ms" }}
            >
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <div>
                  <CardTitle className="text-base">Letzte Mahlzeiten</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Kalorien und Protein im Blick
                  </p>
                </div>
                <Salad className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                {mealSlice.length === 0 ? (
                  <EmptyState
                    title="Noch keine Mahlzeiten"
                    description="Fange mit der ersten Mahlzeit an, um dein Tagesziel zu sehen."
                  />
                ) : (
                  <div className="space-y-3">
                    {mealSlice.map((meal) => (
                      <div
                        key={meal.id}
                        className="min-h-[44px] rounded-lg border border-border px-3 py-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{meal.typeLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {meal.dateLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{formatNumber(meal.kalorien)} kcal</span>
                          <span>•</span>
                          <span>{formatNumber(meal.protein)} g Protein</span>
                        </div>
                      </div>
                    ))}
                    {data.ernaehrung.length > mealLimit && (
                      <p className="text-xs text-muted-foreground md:hidden">
                        Mehr anzeigen
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:col-span-5">
              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "150ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4">
                  <div>
                    <CardTitle className="text-base">Aktive Ziele</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tagesziele und Status
                    </p>
                  </div>
                  <Target className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  {goalsSlice.length === 0 ? (
                    <EmptyState
                      title="Noch keine Ziele"
                      description="Lege Ziele an, um Fortschritte zu sehen."
                    />
                  ) : (
                    <div className="space-y-3">
                      {goalsSlice.map((goal) => (
                        <div
                          key={goal.record_id}
                          className="min-h-[44px] rounded-lg border border-border px-3 py-3"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Ziel</span>
                            {goal.fields.status ? (
                              <Badge variant="secondary">
                                {GOAL_STATUS_LABELS[goal.fields.status]}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                            <span>
                              Kalorien: {formatNumber(goal.fields.taeglich_kalorien)}
                            </span>
                            <span>
                              Protein: {formatNumber(goal.fields.taeglich_protein)} g
                            </span>
                            <span>
                              Trainingstage: {formatNumber(goal.fields.trainingstage_pro_woche)}
                            </span>
                            <span>
                              Schlafziel: {formatNumber(goal.fields.schlaf_ziel_stunden)} h
                            </span>
                            {goal.fields.notizen ? (
                              <span className="text-muted-foreground">
                                Notiz: {goal.fields.notizen.slice(0, 60)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {data.ziele.length > goalsLimit && (
                        <p className="text-xs text-muted-foreground md:hidden">
                          Mehr anzeigen
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                className="gap-4 py-4 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700"
                style={{ animationDelay: "300ms" }}
              >
                <CardHeader className="flex flex-row items-center justify-between px-4">
                  <div>
                    <CardTitle className="text-base">Uebungen Atlas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Muskelgruppen im Fokus
                    </p>
                  </div>
                  <ClipboardList className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  {muscleSlice.length === 0 ? (
                    <EmptyState
                      title="Noch keine Uebungen"
                      description="Erstelle Uebungen, um die Verteilung zu sehen."
                    />
                  ) : (
                    <div className="space-y-3">
                      {muscleSlice.map((group) => (
                        <div key={group.group} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{group.label}</span>
                            <span className="text-muted-foreground">
                              {formatNumber(group.count)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-accent"
                              style={{ width: `${(group.count / maxMuscleCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogTrigger asChild>
            <Button className="fixed bottom-4 left-4 right-4 flex h-[52px] items-center justify-center gap-2 md:hidden transition-transform active:scale-[0.98]">
              <Salad className="size-4" />
              Mahlzeit hinzufuegen
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mahlzeit hinzufuegen</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleMealSubmit}>
            <div className="space-y-2">
              <Label htmlFor="meal-date">Datum</Label>
              <Input
                id="meal-date"
                type="date"
                value={mealForm.datum}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    datum: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Mahlzeitentyp</Label>
              <Select
                value={mealForm.mahlzeit_typ ?? "none"}
                onValueChange={(value) =>
                  setMealForm((prev) => ({
                    ...prev,
                    mahlzeit_typ: value as MealFormState["mahlzeit_typ"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswaehlen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Auswahl</SelectItem>
                  {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-desc">Beschreibung</Label>
              <Textarea
                id="meal-desc"
                value={mealForm.beschreibung}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    beschreibung: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meal-calories">Kalorien (kcal)</Label>
                <Input
                  id="meal-calories"
                  type="number"
                  inputMode="decimal"
                  value={mealForm.kalorien}
                  onChange={(event) =>
                    setMealForm((prev) => ({
                      ...prev,
                      kalorien: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-protein">Protein (g)</Label>
                <Input
                  id="meal-protein"
                  type="number"
                  inputMode="decimal"
                  value={mealForm.protein}
                  onChange={(event) =>
                    setMealForm((prev) => ({
                      ...prev,
                      protein: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-carbs">Carbs (g)</Label>
                <Input
                  id="meal-carbs"
                  type="number"
                  inputMode="decimal"
                  value={mealForm.carbs}
                  onChange={(event) =>
                    setMealForm((prev) => ({
                      ...prev,
                      carbs: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-fat">Fett (g)</Label>
                <Input
                  id="meal-fat"
                  type="number"
                  inputMode="decimal"
                  value={mealForm.fett}
                  onChange={(event) =>
                    setMealForm((prev) => ({
                      ...prev,
                      fett: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {mealError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {mealError}
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={mealSubmitting}>
                {mealSubmitting ? "Speichern..." : "Mahlzeit speichern"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
