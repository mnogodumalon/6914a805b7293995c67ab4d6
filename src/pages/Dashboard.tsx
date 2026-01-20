import { useState, useEffect } from 'react'
import type { Workouts, WorkoutLogs, Uebungen, Ziele, Ernaehrung, Koerperdaten } from '@/types/app'
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { Activity, TrendingUp, TrendingDown, Utensils, Weight, Target } from 'lucide-react'

// Theme colors from design spec
const COLORS = {
  primary: 'hsl(217, 91%, 60%)',
  accent: 'hsl(142, 71%, 45%)',
  purple: 'hsl(271, 76%, 53%)',
  orange: 'hsl(25, 95%, 53%)',
}

const CHART_COLORS = [COLORS.primary, COLORS.accent, COLORS.purple, COLORS.orange]

interface DashboardState {
  workouts: Workouts[]
  workoutLogs: WorkoutLogs[]
  uebungen: Uebungen[]
  ziele: Ziele[]
  ernaehrung: Ernaehrung[]
  koerperdaten: Koerperdaten[]
  loading: boolean
}

type DateRangeType = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time'
type WorkoutTypeFilter = 'all' | 'push' | 'pull' | 'beine' | 'ganzkoerper' | 'oberkoerper' | 'unterkoerper' | 'cardio'

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    workouts: [],
    workoutLogs: [],
    uebungen: [],
    ziele: [],
    ernaehrung: [],
    koerperdaten: [],
    loading: true,
  })

  const [dateRange, setDateRange] = useState<DateRangeType>('last_30_days')
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<WorkoutTypeFilter>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        setState(prev => ({ ...prev, loading: true }))

        const [workouts, workoutLogs, uebungen, ziele, ernaehrung, koerperdaten] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getWorkoutLogs(),
          LivingAppsService.getUebungen(),
          LivingAppsService.getZiele(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
        ])

        setState({
          workouts,
          workoutLogs,
          uebungen,
          ziele,
          ernaehrung,
          koerperdaten,
          loading: false,
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [])

  // Helper: Get date range
  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'last_7_days':
        return { start: subDays(now, 7), end: now }
      case 'last_30_days':
        return { start: subDays(now, 30), end: now }
      case 'last_90_days':
        return { start: subDays(now, 90), end: now }
      case 'all_time':
        return { start: new Date(2000, 0, 1), end: now }
    }
  }

  const { start: rangeStart, end: rangeEnd } = getDateRange()

  // Filter workouts by date range and type
  const filteredWorkouts = state.workouts.filter(w => {
    if (!w.fields.datum) return false
    const date = parseISO(w.fields.datum)
    const inRange = isWithinInterval(date, { start: rangeStart, end: rangeEnd })
    const matchesType = workoutTypeFilter === 'all' || w.fields.typ === workoutTypeFilter
    return inRange && matchesType
  })

  // KPI 1: Workouts This Week
  const weekStart = startOfWeek(new Date(), { locale: de })
  const weekEnd = endOfWeek(new Date(), { locale: de })
  const workoutsThisWeek = state.workouts.filter(w => {
    if (!w.fields.datum || w.fields.rest_day === true) return false
    const date = parseISO(w.fields.datum)
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  }).length

  // KPI 2: Weekly Training Goal Progress
  const activeGoal = state.ziele.find(z => z.fields.status === 'aktiv')
  const weeklyGoal = activeGoal?.fields.trainingstage_pro_woche ?? 0
  const goalProgress = weeklyGoal > 0 ? Math.round((workoutsThisWeek / weeklyGoal) * 100) : 0

  // KPI 3: Average Daily Calories (last 7 days)
  const last7Days = subDays(new Date(), 7)
  const recentNutrition = state.ernaehrung.filter(e => {
    if (!e.fields.datum) return false
    const date = parseISO(e.fields.datum)
    return isWithinInterval(date, { start: last7Days, end: new Date() })
  })

  const totalCalories = recentNutrition.reduce((sum, e) => sum + (e.fields.kalorien ?? 0), 0)
  const avgCalories = recentNutrition.length > 0 ? Math.round(totalCalories / 7) : 0

  // KPI 4: Average Daily Protein (last 7 days)
  const totalProtein = recentNutrition.reduce((sum, e) => sum + (e.fields.protein ?? 0), 0)
  const avgProtein = recentNutrition.length > 0 ? Math.round(totalProtein / 7) : 0

  // KPI 5: Current Weight
  const sortedBodyData = [...state.koerperdaten]
    .filter(k => k.fields.datum && k.fields.gewicht_kg)
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!)
      const dateB = parseISO(b.fields.datum!)
      return dateB.getTime() - dateA.getTime()
    })

  const currentWeight = sortedBodyData[0]?.fields.gewicht_kg ?? null

  // KPI 6: Weight Change (30 days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const weightThirtyDaysAgo = sortedBodyData.find(k => {
    if (!k.fields.datum) return false
    const date = parseISO(k.fields.datum)
    return date <= thirtyDaysAgo
  })?.fields.gewicht_kg ?? null

  const weightChange = currentWeight && weightThirtyDaysAgo
    ? Number((currentWeight - weightThirtyDaysAgo).toFixed(1))
    : null

  // KPI 7: Total Volume This Week
  const workoutIdsThisWeek = state.workouts
    .filter(w => {
      if (!w.fields.datum || w.fields.rest_day === true) return false
      const date = parseISO(w.fields.datum)
      return isWithinInterval(date, { start: weekStart, end: weekEnd })
    })
    .map(w => w.record_id)

  const totalVolumeThisWeek = state.workoutLogs
    .filter(log => {
      const workoutId = extractRecordId(log.fields.workout)
      return workoutId && workoutIdsThisWeek.includes(workoutId)
    })
    .reduce((sum, log) => {
      const weight = log.fields.gewicht ?? 0
      const reps = log.fields.wiederholungen ?? 0
      return sum + (weight * reps)
    }, 0)

  // Chart Data: Weight Progress (30 days)
  const weightData = [...state.koerperdaten]
    .filter(k => {
      if (!k.fields.datum || !k.fields.gewicht_kg) return false
      const date = parseISO(k.fields.datum)
      return isWithinInterval(date, { start: rangeStart, end: rangeEnd })
    })
    .sort((a, b) => parseISO(a.fields.datum!).getTime() - parseISO(b.fields.datum!).getTime())
    .map(k => ({
      date: k.fields.datum!,
      gewicht: k.fields.gewicht_kg!,
    }))

  // Chart Data: Training Volume by Week
  const volumeByWeek = state.workoutLogs
    .map(log => {
      const workoutId = extractRecordId(log.fields.workout)
      if (!workoutId) return null

      const workout = state.workouts.find(w => w.record_id === workoutId)
      if (!workout?.fields.datum) return null

      const matchesType = workoutTypeFilter === 'all' || workout.fields.typ === workoutTypeFilter
      if (!matchesType) return null

      const date = parseISO(workout.fields.datum)
      if (!isWithinInterval(date, { start: rangeStart, end: rangeEnd })) return null

      const volume = (log.fields.gewicht ?? 0) * (log.fields.wiederholungen ?? 0)
      const weekKey = format(startOfWeek(date, { locale: de }), 'yyyy-MM-dd')

      return { weekKey, volume }
    })
    .filter((item): item is { weekKey: string; volume: number } => item !== null)
    .reduce((acc, { weekKey, volume }) => {
      acc[weekKey] = (acc[weekKey] ?? 0) + volume
      return acc
    }, {} as Record<string, number>)

  const volumeData = Object.entries(volumeByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, volume]) => ({
      week: format(parseISO(week), 'dd.MM', { locale: de }),
      volume: Math.round(volume),
    }))

  // Chart Data: Nutrition (last 14 days)
  const last14Days = subDays(new Date(), 14)
  const nutritionData = state.ernaehrung
    .filter(e => {
      if (!e.fields.datum) return false
      const date = parseISO(e.fields.datum)
      return isWithinInterval(date, { start: last14Days, end: new Date() })
    })
    .reduce((acc, e) => {
      const date = e.fields.datum!
      if (!acc[date]) {
        acc[date] = { date, kalorien: 0, protein: 0 }
      }
      acc[date].kalorien += e.fields.kalorien ?? 0
      acc[date].protein += e.fields.protein ?? 0
      return acc
    }, {} as Record<string, { date: string; kalorien: number; protein: number }>)

  const nutritionChartData = Object.values(nutritionData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      kalorien: Math.round(d.kalorien),
      protein: Math.round(d.protein),
    }))

  // Chart Data: Training by Type
  const workoutsByType = filteredWorkouts
    .filter(w => !w.fields.rest_day)
    .reduce((acc, w) => {
      const type = w.fields.typ ?? 'sonstiges'
      acc[type] = (acc[type] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

  const workoutTypeData = Object.entries(workoutsByType)
    .map(([typ, count]) => ({
      typ: typ.charAt(0).toUpperCase() + typ.slice(1),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Chart Data: Muscle Group Distribution
  const muscleGroupCounts = state.workoutLogs
    .map(log => {
      const uebungId = extractRecordId(log.fields.uebung)
      if (!uebungId) return null

      const uebung = state.uebungen.find(u => u.record_id === uebungId)
      return uebung?.fields.muskelgruppe ?? null
    })
    .filter((mg): mg is NonNullable<typeof mg> => mg !== null)
    .reduce((acc, mg) => {
      if (mg) {
        acc[mg] = (acc[mg] ?? 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

  const muscleGroupData = Object.entries(muscleGroupCounts)
    .map(([muskelgruppe, count]) => ({
      name: muskelgruppe.charAt(0).toUpperCase() + muskelgruppe.slice(1),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)

  // Chart Data: Body Measurements
  const measurementsData = [...state.koerperdaten]
    .filter(k => {
      if (!k.fields.datum) return false
      const date = parseISO(k.fields.datum)
      return isWithinInterval(date, { start: rangeStart, end: rangeEnd })
    })
    .sort((a, b) => parseISO(a.fields.datum!).getTime() - parseISO(b.fields.datum!).getTime())
    .map(k => ({
      date: k.fields.datum!,
      brustumfang: k.fields.brustumfang ?? null,
      armumfang: k.fields.armumfang ?? null,
      taillenumfang: k.fields.taillenumfang ?? null,
    }))
    .filter(m => m.brustumfang || m.armumfang || m.taillenumfang)

  // Latest Body Fat Percentage
  const latestBodyFat = sortedBodyData[0]?.fields.kfa_geschaetzt ?? null

  // Recent Workouts Table Data
  const recentWorkouts = [...state.workouts]
    .filter(w => w.fields.datum)
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!)
      const dateB = parseISO(b.fields.datum!)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 10)

  // Lookup labels
  const stimmungLabels: Record<string, string> = {
    schlecht: 'Schlecht',
    okay: 'Okay',
    gut: 'Gut',
    brutal: 'Brutal',
  }

  const statusLabels: Record<string, string> = {
    aktiv: 'Aktiv',
    erreicht: 'Erreicht',
    verworfen: 'Verworfen',
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fitness & Ernährungs-Tracker</h1>
        <p className="text-muted-foreground">Dein Fortschritt auf einen Blick</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Zeitraum</label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Letzte 7 Tage</SelectItem>
              <SelectItem value="last_30_days">Letzte 30 Tage</SelectItem>
              <SelectItem value="last_90_days">Letzte 90 Tage</SelectItem>
              <SelectItem value="all_time">Gesamte Zeit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Trainingstyp</label>
          <Select value={workoutTypeFilter} onValueChange={(v) => setWorkoutTypeFilter(v as WorkoutTypeFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="pull">Pull</SelectItem>
              <SelectItem value="beine">Beine</SelectItem>
              <SelectItem value="ganzkoerper">Ganzkörper</SelectItem>
              <SelectItem value="oberkoerper">Oberkörper</SelectItem>
              <SelectItem value="unterkoerper">Unterkörper</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Übersicht - Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts diese Woche</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {goalProgress}% vom Wochenziel ({weeklyGoal} Trainings)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Kalorien (7 Tage)</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCalories}</div>
            <p className="text-xs text-muted-foreground">
              Ziel: {activeGoal?.fields.taeglich_kalorien ?? '-'} kcal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Protein (7 Tage)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProtein}g</div>
            <p className="text-xs text-muted-foreground">
              Ziel: {activeGoal?.fields.taeglich_protein ?? '-'}g
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuelles Gewicht</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentWeight ? `${currentWeight.toFixed(1)}kg` : '-'}
            </div>
            {weightChange !== null && (
              <p className="text-xs flex items-center gap-1">
                {weightChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="text-orange-500">+{weightChange}kg</span>
                  </>
                ) : weightChange < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{weightChange}kg</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Keine Änderung</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fortschritt Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Fortschritt</h2>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Weight Progress Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Gewichtsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(parseISO(date), 'dd.MM', { locale: de })}
                    />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      labelFormatter={(date) => format(parseISO(date), 'dd.MM.yyyy', { locale: de })}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Gewicht']}
                    />
                    <Line
                      type="monotone"
                      dataKey="gewicht"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Gewichtsdaten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Training Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trainingsvolumen (Wochen)</CardTitle>
            </CardHeader>
            <CardContent>
              {volumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volumen']} />
                    <Bar dataKey="volume" fill={COLORS.accent} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Volumendaten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ernährung (14 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={nutritionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(parseISO(date), 'dd.MM', { locale: de })}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      labelFormatter={(date) => format(parseISO(date), 'dd.MM.yyyy', { locale: de })}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="kalorien"
                      stroke={COLORS.primary}
                      name="Kalorien"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="protein"
                      stroke={COLORS.accent}
                      name="Protein (g)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Ernährungsdaten verfügbar</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Training Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Training</h2>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Training by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Training nach Typ</CardTitle>
            </CardHeader>
            <CardContent>
              {workoutTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workoutTypeData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="typ" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Trainingsdaten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Muscle Group Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Muskelgruppen-Verteilung</CardTitle>
            </CardHeader>
            <CardContent>
              {muscleGroupData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={muscleGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {muscleGroupData.map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Übungsdaten verfügbar</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Workouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Stimmung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentWorkouts.map((workout) => (
                    <TableRow key={workout.record_id}>
                      <TableCell>
                        {workout.fields.datum
                          ? format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {workout.fields.typ
                          ? workout.fields.typ.charAt(0).toUpperCase() + workout.fields.typ.slice(1)
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {workout.fields.dauer_minuten ? `${workout.fields.dauer_minuten} min` : '-'}
                      </TableCell>
                      <TableCell>
                        {workout.fields.stimmung ? (
                          <Badge variant={
                            workout.fields.stimmung === 'brutal' ? 'default' :
                            workout.fields.stimmung === 'gut' ? 'secondary' :
                            'outline'
                          }>
                            {stimmungLabels[workout.fields.stimmung]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Keine Workouts verfügbar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Körperdaten Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Körperdaten</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Body Measurements Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Körpermaße</CardTitle>
            </CardHeader>
            <CardContent>
              {measurementsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={measurementsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(parseISO(date), 'dd.MM', { locale: de })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(parseISO(date as string), 'dd.MM.yyyy', { locale: de })}
                      formatter={(value) => {
                        const numValue = Number(value)
                        return !isNaN(numValue) ? `${numValue} cm` : '-'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="brustumfang"
                      stroke={CHART_COLORS[0]}
                      name="Brust"
                      strokeWidth={2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="armumfang"
                      stroke={CHART_COLORS[1]}
                      name="Arm"
                      strokeWidth={2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="taillenumfang"
                      stroke={CHART_COLORS[2]}
                      name="Taille"
                      strokeWidth={2}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Keine Körpermaßdaten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Body Fat Percentage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Körperfettanteil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                {latestBodyFat ? `${latestBodyFat.toFixed(1)}%` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {sortedBodyData[0]?.fields.datum
                  ? `Stand: ${format(parseISO(sortedBodyData[0].fields.datum), 'dd.MM.yyyy', { locale: de })}`
                  : 'Keine Daten'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ziele Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Ziele</h2>

        <Card>
          <CardHeader>
            <CardTitle>Aktive Ziele</CardTitle>
          </CardHeader>
          <CardContent>
            {state.ziele.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kalorien/Tag</TableHead>
                    <TableHead>Protein/Tag</TableHead>
                    <TableHead>Trainingstage/Woche</TableHead>
                    <TableHead>Schlafziel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.ziele.map((ziel) => (
                    <TableRow key={ziel.record_id}>
                      <TableCell>
                        {ziel.fields.taeglich_kalorien ? `${ziel.fields.taeglich_kalorien} kcal` : '-'}
                      </TableCell>
                      <TableCell>
                        {ziel.fields.taeglich_protein ? `${ziel.fields.taeglich_protein}g` : '-'}
                      </TableCell>
                      <TableCell>
                        {ziel.fields.trainingstage_pro_woche ?? '-'}
                      </TableCell>
                      <TableCell>
                        {ziel.fields.schlaf_ziel_stunden ? `${ziel.fields.schlaf_ziel_stunden}h` : '-'}
                      </TableCell>
                      <TableCell>
                        {ziel.fields.status ? (
                          <Badge variant={
                            ziel.fields.status === 'aktiv' ? 'default' :
                            ziel.fields.status === 'erreicht' ? 'secondary' :
                            'outline'
                          }>
                            {statusLabels[ziel.fields.status]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Keine Ziele definiert</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Weitere Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Gesamtvolumen diese Woche</p>
              <p className="text-2xl font-bold">{totalVolumeThisWeek.toLocaleString()} kg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erfasste Übungen</p>
              <p className="text-2xl font-bold">{state.uebungen.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erfasste Workouts</p>
              <p className="text-2xl font-bold">{state.workouts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
