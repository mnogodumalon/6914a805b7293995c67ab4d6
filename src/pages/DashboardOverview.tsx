import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, startOfWeek, endOfWeek, isToday, formatDistance, eachDayOfInterval, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { Dumbbell, Flame, Scale, Activity, Utensils, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app'
import { LivingAppsService } from '@/services/livingAppsService'

function ProgressRing({ value, max, size = 120, strokeWidth = 8, color = 'hsl(174 62% 38%)' }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const dashoffset = circumference * (1 - progress)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(35 20% 95%)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

export function DashboardOverview() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([])
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([])
  const [ziele, setZiele] = useState<Ziele[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [w, e, k, z] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
        ])
        setWorkouts(w)
        setErnaehrung(e)
        setKoerperdaten(k)
        setZiele(z)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fehler beim Laden'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeGoal = useMemo(() =>
    ziele.find(z => z.fields.status === 'aktiv'),
    [ziele]
  )

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const todayNutrition = useMemo(() => {
    const todayMeals = ernaehrung.filter(e => e.fields.datum === todayStr)
    return {
      kalorien: todayMeals.reduce((sum, m) => sum + (m.fields.kalorien ?? 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.fields.protein ?? 0), 0),
    }
  }, [ernaehrung, todayStr])

  const todayWorkout = useMemo(() =>
    workouts.find(w => w.fields.datum === todayStr && !w.fields.rest_day),
    [workouts, todayStr]
  )

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const workoutsThisWeek = useMemo(() =>
    workouts.filter(w => {
      if (!w.fields.datum || w.fields.rest_day) return false
      const d = parseISO(w.fields.datum)
      return d >= weekStart && d <= weekEnd
    }).length,
    [workouts, weekStart, weekEnd]
  )

  const latestWeight = useMemo(() => {
    const sorted = [...koerperdaten]
      .filter(k => k.fields.datum && k.fields.gewicht_kg)
      .sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? ''))
    return sorted[0]?.fields.gewicht_kg ?? null
  }, [koerperdaten])

  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = format(d, 'yyyy-MM-dd')
      const hasWorkout = workouts.some(w => w.fields.datum === ds && !w.fields.rest_day)
      const hasMeal = ernaehrung.some(e => e.fields.datum === ds)
      if (hasWorkout || hasMeal) {
        count++
      } else if (i > 0) {
        break
      }
    }
    return count
  }, [workouts, ernaehrung])

  const weeklyChartData = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map(day => {
      const ds = format(day, 'yyyy-MM-dd')
      const dayMeals = ernaehrung.filter(e => e.fields.datum === ds)
      const kcal = dayMeals.reduce((sum, m) => sum + (m.fields.kalorien ?? 0), 0)
      return {
        day: format(day, 'EEE', { locale: de }),
        kcal,
        isToday: isSameDay(day, new Date()),
      }
    })
  }, [ernaehrung, weekStart, weekEnd])

  const recentActivity = useMemo(() => {
    const items: Array<{ type: string; label: string; time: string; icon: 'workout' | 'meal' | 'body' }> = []

    workouts.slice(0, 10).forEach(w => {
      const typLabels: Record<string, string> = {
        push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
        oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
      }
      items.push({
        type: 'workout',
        label: `${typLabels[w.fields.typ ?? ''] ?? 'Workout'}${w.fields.dauer_minuten ? ` - ${w.fields.dauer_minuten} Min` : ''}`,
        time: w.createdat,
        icon: 'workout',
      })
    })

    ernaehrung.slice(0, 10).forEach(e => {
      const typLabels: Record<string, string> = {
        fruehstueck: 'Frühstück', snack: 'Snack', mittagessen: 'Mittagessen',
        abendessen: 'Abendessen', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', sonstiges: 'Sonstiges'
      }
      items.push({
        type: 'ernaehrung',
        label: `${typLabels[e.fields.mahlzeit_typ ?? ''] ?? 'Mahlzeit'}${e.fields.kalorien ? ` - ${e.fields.kalorien} kcal` : ''}`,
        time: e.createdat,
        icon: 'meal',
      })
    })

    koerperdaten.slice(0, 5).forEach(k => {
      items.push({
        type: 'koerperdaten',
        label: `Messung${k.fields.gewicht_kg ? ` - ${k.fields.gewicht_kg} kg` : ''}`,
        time: k.createdat,
        icon: 'body',
      })
    })

    return items
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8)
  }, [workouts, ernaehrung, koerperdaten])

  const iconMap = { workout: Dumbbell, meal: Utensils, body: User }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-16 flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-2">Fehler beim Laden der Daten</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Erneut versuchen</Button>
        </CardContent>
      </Card>
    )
  }

  const calorieGoal = activeGoal?.fields.taeglich_kalorien ?? 2000
  const proteinGoal = activeGoal?.fields.taeglich_protein ?? 150
  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche ?? 5

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fitness Tracker</h1>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {format(new Date(), 'dd. MMM', { locale: de })}
        </span>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Column */}
        <div className="flex-1 space-y-6 lg:max-w-[65%]">
          {/* Hero: Today's Progress */}
          <Card className="overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-primary to-[hsl(152_55%_42%)]" />
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Heute</p>
              <div className="flex items-center justify-center gap-8 mb-4">
                {/* Calories Ring */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => navigate('/ernaehrung')}
                >
                  <ProgressRing value={todayNutrition.kalorien} max={calorieGoal} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="text-2xl font-bold leading-none">
                      {new Intl.NumberFormat('de-DE').format(todayNutrition.kalorien)}
                    </span>
                    <span className="text-xs text-muted-foreground">kcal</span>
                  </div>
                </div>
                {/* Protein Ring */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => navigate('/ernaehrung')}
                >
                  <ProgressRing value={todayNutrition.protein} max={proteinGoal} color="hsl(152 55% 42%)" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold leading-none">{Math.round(todayNutrition.protein)}</span>
                    <span className="text-xs text-muted-foreground">g Protein</span>
                  </div>
                </div>
              </div>
              {/* Today's workout status */}
              <div
                className="text-center cursor-pointer hover:bg-muted/50 rounded-lg py-2 transition-colors"
                onClick={() => navigate('/training')}
              >
                {todayWorkout ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {({
                        push: 'Push', pull: 'Pull', beine: 'Beine', ganzkoerper: 'Ganzkörper',
                        oberkoerper: 'Oberkörper', unterkoerper: 'Unterkörper', cardio: 'Cardio', sonstiges: 'Sonstiges'
                      } as Record<string, string>)[todayWorkout.fields.typ ?? ''] ?? 'Workout'}
                      {todayWorkout.fields.dauer_minuten ? ` - ${todayWorkout.fields.dauer_minuten} Min` : ''}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Kein Training heute</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="flex items-center justify-around py-3 border-b border-border">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-semibold">{workoutsThisWeek}/{weeklyGoal}</span>
              </div>
              <span className="text-xs text-muted-foreground">Trainings/Woche</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-semibold">{latestWeight ? `${latestWeight} kg` : '-'}</span>
              </div>
              <span className="text-xs text-muted-foreground">Gewicht</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-semibold">{streak} Tage</span>
              </div>
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
          </div>

          {/* Weekly Calorie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Diese Woche - Kalorien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220 10% 50%)"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220 10% 50%)"
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(35 15% 90%)',
                        borderRadius: '8px',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`${new Intl.NumberFormat('de-DE').format(value)} kcal`, 'Kalorien']}
                    />
                    <ReferenceLine
                      y={calorieGoal}
                      stroke="hsl(220 10% 50%)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <Bar
                      dataKey="kcal"
                      fill="hsl(174 62% 38%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Durchschnitt: {new Intl.NumberFormat('de-DE').format(
                  Math.round(weeklyChartData.reduce((s, d) => s + d.kcal, 0) / Math.max(weeklyChartData.filter(d => d.kcal > 0).length, 1))
                )} kcal / Tag
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Desktop) / Below (Mobile) */}
        <div className="space-y-6 lg:w-[35%]">
          {/* Quick Actions (Desktop only) */}
          <Card className="hidden lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={() => navigate('/training')}>
                <Dumbbell className="h-4 w-4 mr-2" /> Workout loggen
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/ernaehrung')}>
                <Utensils className="h-4 w-4 mr-2" /> Mahlzeit erfassen
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/koerperdaten')}>
                <Scale className="h-4 w-4 mr-2" /> Gewicht eintragen
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Letzte Einträge</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Noch keine Einträge</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, i) => {
                    const Icon = iconMap[item.icon]
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.label}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistance(parseISO(item.time), new Date(), { addSuffix: true, locale: de })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          {activeGoal && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Aktive Ziele</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeGoal.fields.taeglich_kalorien && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Kalorien</span>
                      <span className="font-medium">{todayNutrition.kalorien} / {activeGoal.fields.taeglich_kalorien}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((todayNutrition.kalorien / activeGoal.fields.taeglich_kalorien) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {activeGoal.fields.taeglich_protein && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Protein</span>
                      <span className="font-medium">{Math.round(todayNutrition.protein)}g / {activeGoal.fields.taeglich_protein}g</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(152_55%_42%)] rounded-full transition-all"
                        style={{ width: `${Math.min((todayNutrition.protein / activeGoal.fields.taeglich_protein) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {activeGoal.fields.trainingstage_pro_woche && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Training/Woche</span>
                      <span className="font-medium">{workoutsThisWeek} / {activeGoal.fields.trainingstage_pro_woche}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-3 rounded-full transition-all"
                        style={{ width: `${Math.min((workoutsThisWeek / activeGoal.fields.trainingstage_pro_woche) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
