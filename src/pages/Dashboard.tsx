import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, isToday, startOfDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Dumbbell, Flame, Beef, Scale, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Workouts, Ernaehrung, Koerperdaten, Ziele } from '@/types/app';

// Import Google Font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Apply theme styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  :root {
    --background: 220 18% 8%;
    --foreground: 0 0% 98%;
    --primary: 31 97% 58%;
    --accent: 178 65% 48%;
    --muted: 220 15% 20%;
    --positive: 142 71% 45%;
    --negative: 0 72% 55%;
    --card: 220 16% 12%;
    --card-foreground: 0 0% 98%;
    --border: 220 15% 18%;
  }

  body {
    font-family: 'Space Grotesk', -apple-system, sans-serif;
    background: linear-gradient(135deg, hsl(220, 18%, 8%) 0%, hsl(220, 20%, 10%) 50%, hsl(220, 18%, 8%) 100%);
    background-attachment: fixed;
    min-height: 100vh;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }

  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.3);
  }
`;
document.head.appendChild(styleElement);

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  delay: number;
}

function KPICard({ title, value, description, icon, trend, delay }: KPICardProps) {
  return (
    <Card
      className="hover-lift animate-fade-in border-border/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 text-positive" />
            ) : (
              <TrendingDown className="w-4 h-4 text-negative" />
            )}
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-positive' : 'text-negative'}`}>
              {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workouts[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [koerperdaten, setKoerperdaten] = useState<Koerperdaten[]>([]);
  const [ziele, setZiele] = useState<Ziele[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [workoutsData, ernaehrungData, koerperdatenData, zieleData] = await Promise.all([
          LivingAppsService.getWorkouts(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getKoerperdaten(),
          LivingAppsService.getZiele(),
        ]);

        setWorkouts(workoutsData);
        setErnaehrung(ernaehrungData);
        setKoerperdaten(koerperdatenData);
        setZiele(zieleData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate KPIs
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subDays(weekStart, 7);
  const lastWeekEnd = subDays(weekEnd, 7);

  const workoutsThisWeek = workouts.filter((w) => {
    if (!w.fields.datum) return false;
    const date = parseISO(w.fields.datum);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  }).length;

  const workoutsLastWeek = workouts.filter((w) => {
    if (!w.fields.datum) return false;
    const date = parseISO(w.fields.datum);
    return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
  }).length;

  const todayNutrition = ernaehrung.filter((e) => {
    if (!e.fields.datum) return false;
    return isToday(parseISO(e.fields.datum));
  });

  const caloriesTotal = todayNutrition.reduce((sum, e) => sum + (e.fields.kalorien || 0), 0);
  const proteinTotal = todayNutrition.reduce((sum, e) => sum + (e.fields.protein || 0), 0);

  const activeGoal = ziele.find((z) => z.fields.status === 'aktiv');
  const calorieGoal = activeGoal?.fields.taeglich_kalorien || 0;
  const proteinGoal = activeGoal?.fields.taeglich_protein || 0;

  const sortedBodyData = [...koerperdaten]
    .filter((k) => k.fields.datum && k.fields.gewicht_kg)
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!);
      const dateB = parseISO(b.fields.datum!);
      return dateB.getTime() - dateA.getTime();
    });

  const currentWeight = sortedBodyData[0]?.fields.gewicht_kg || 0;
  const previousWeight = sortedBodyData[1]?.fields.gewicht_kg || currentWeight;
  const weightChange = currentWeight - previousWeight;

  // Prepare chart data (last 30 days)
  const thirtyDaysAgo = subDays(now, 30);
  const chartData = sortedBodyData
    .filter((k) => {
      if (!k.fields.datum) return false;
      const date = parseISO(k.fields.datum);
      return date >= thirtyDaysAgo;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!);
      const dateB = parseISO(b.fields.datum!);
      return dateA.getTime() - dateB.getTime();
    })
    .map((k) => ({
      date: format(parseISO(k.fields.datum!), 'dd.MM', { locale: de }),
      gewicht: k.fields.gewicht_kg,
    }));

  // Recent workouts
  const recentWorkouts = [...workouts]
    .filter((w) => w.fields.datum)
    .sort((a, b) => {
      const dateA = parseISO(a.fields.datum!);
      const dateB = parseISO(b.fields.datum!);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Lookup data for display
  const workoutTypeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    beine: 'Beine',
    ganzkoerper: 'Ganzkörper',
    oberkoerper: 'Oberkörper',
    unterkoerper: 'Unterkörper',
    cardio: 'Cardio',
    sonstiges: 'Sonstiges',
  };

  const moodLabels: Record<string, string> = {
    schlecht: 'Schlecht',
    okay: 'Okay',
    gut: 'Gut',
    brutal: 'Brutal',
  };

  const moodColors: Record<string, string> = {
    schlecht: 'bg-negative',
    okay: 'bg-muted',
    gut: 'bg-positive',
    brutal: 'bg-primary',
  };

  const mealTypeLabels: Record<string, string> = {
    fruehstueck: 'Frühstück',
    snack: 'Snack',
    mittagessen: 'Mittagessen',
    abendessen: 'Abendessen',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
    sonstiges: 'Sonstiges',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground text-xl font-light">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Fitness Dashboard
          </h1>
          <p className="text-muted-foreground">
            {format(now, 'EEEE, dd. MMMM yyyy', { locale: de })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Workouts Diese Woche"
            value={workoutsThisWeek}
            description="Trainingseinheiten"
            icon={<Dumbbell className="w-5 h-5" />}
            trend={{
              value: workoutsThisWeek - workoutsLastWeek,
              isPositive: workoutsThisWeek >= workoutsLastWeek,
              label: 'vs letzte Woche',
            }}
            delay={0}
          />
          <KPICard
            title="Kalorien Heute"
            value={caloriesTotal}
            description="kcal aufgenommen"
            icon={<Flame className="w-5 h-5" />}
            trend={
              calorieGoal > 0
                ? {
                    value: Math.round(((caloriesTotal / calorieGoal) * 100) - 100),
                    isPositive: caloriesTotal >= calorieGoal * 0.9 && caloriesTotal <= calorieGoal * 1.1,
                    label: `von ${calorieGoal} Ziel`,
                  }
                : undefined
            }
            delay={80}
          />
          <KPICard
            title="Protein Heute"
            value={proteinTotal}
            description="g Protein"
            icon={<Beef className="w-5 h-5" />}
            trend={
              proteinGoal > 0
                ? {
                    value: Math.round(((proteinTotal / proteinGoal) * 100) - 100),
                    isPositive: proteinTotal >= proteinGoal,
                    label: `von ${proteinGoal}g Ziel`,
                  }
                : undefined
            }
            delay={160}
          />
          <KPICard
            title="Aktuelles Gewicht"
            value={currentWeight > 0 ? `${currentWeight.toFixed(1)}` : '-'}
            description="kg"
            icon={<Scale className="w-5 h-5" />}
            trend={
              sortedBodyData.length > 1
                ? {
                    value: parseFloat(weightChange.toFixed(1)),
                    isPositive: weightChange <= 0,
                    label: 'vs letzte Messung',
                  }
                : undefined
            }
            delay={240}
          />
        </div>

        {/* Weight Chart */}
        {chartData.length > 0 && (
          <Card className="hover-lift animate-fade-in border-border/50" style={{ animationDelay: '320ms' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Gewichtsverlauf (30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  gewicht: {
                    label: 'Gewicht (kg)',
                    color: 'hsl(31, 97%, 58%)',
                  },
                }}
                className="h-[300px] w-full"
              >
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGewicht" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(31, 97%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(31, 97%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(220, 15%, 40%)"
                    tick={{ fill: 'hsl(220, 15%, 60%)' }}
                  />
                  <YAxis
                    stroke="hsl(220, 15%, 40%)"
                    tick={{ fill: 'hsl(220, 15%, 60%)' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="gewicht"
                    stroke="hsl(31, 97%, 58%)"
                    strokeWidth={2}
                    fill="url(#colorGewicht)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <Card className="hover-lift animate-fade-in border-border/50" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Letzte Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Workouts erfasst.</p>
              ) : (
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.record_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {workout.fields.typ ? workoutTypeLabels[workout.fields.typ] : 'Workout'}
                          </span>
                          {workout.fields.stimmung && (
                            <Badge variant="outline" className={`${moodColors[workout.fields.stimmung]} border-none text-white text-xs`}>
                              {moodLabels[workout.fields.stimmung]}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {workout.fields.datum && format(parseISO(workout.fields.datum), 'dd.MM.yyyy', { locale: de })}
                          {workout.fields.dauer_minuten && ` • ${workout.fields.dauer_minuten} Min`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card className="hover-lift animate-fade-in border-border/50" style={{ animationDelay: '480ms' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Heutige Mahlzeiten</CardTitle>
            </CardHeader>
            <CardContent>
              {todayNutrition.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Mahlzeiten heute erfasst.</p>
              ) : (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Typ</TableHead>
                        <TableHead className="text-right">kcal</TableHead>
                        <TableHead className="text-right">Protein</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayNutrition.map((meal) => (
                        <TableRow key={meal.record_id}>
                          <TableCell className="font-medium">
                            {meal.fields.mahlzeit_typ ? mealTypeLabels[meal.fields.mahlzeit_typ] : '-'}
                          </TableCell>
                          <TableCell className="text-right">{meal.fields.kalorien || 0}</TableCell>
                          <TableCell className="text-right">{meal.fields.protein || 0}g</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/20">
                        <TableCell>Gesamt</TableCell>
                        <TableCell className="text-right">{caloriesTotal}</TableCell>
                        <TableCell className="text-right">{proteinTotal}g</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        {activeGoal && (
          <Card className="hover-lift animate-fade-in border-border/50" style={{ animationDelay: '560ms' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Aktives Ziel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeGoal.fields.taeglich_kalorien && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Tägliche Kalorien</div>
                    <div className="text-2xl font-bold text-foreground">{activeGoal.fields.taeglich_kalorien} kcal</div>
                  </div>
                )}
                {activeGoal.fields.taeglich_protein && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Tägliches Protein</div>
                    <div className="text-2xl font-bold text-foreground">{activeGoal.fields.taeglich_protein}g</div>
                  </div>
                )}
                {activeGoal.fields.trainingstage_pro_woche && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Trainingstage/Woche</div>
                    <div className="text-2xl font-bold text-foreground">{activeGoal.fields.trainingstage_pro_woche}</div>
                  </div>
                )}
                {activeGoal.fields.schlaf_ziel_stunden && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Schlafziel</div>
                    <div className="text-2xl font-bold text-foreground">{activeGoal.fields.schlaf_ziel_stunden}h</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Action Button */}
        <a
          href="https://my.living-apps.de/app/6914a7e7b773d677cf3838c1"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center gap-2 font-medium"
        >
          <Plus className="w-6 h-6" />
          <span className="hidden sm:inline">Workout Loggen</span>
        </a>
      </div>
    </div>
  );
}
