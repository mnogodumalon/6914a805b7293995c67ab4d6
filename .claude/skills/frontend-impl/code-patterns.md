# Code Patterns Reference

## Available Libraries

### shadcn/ui Components

All shadcn components are pre-installed in `/src/components/ui/`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// etc.
```

**To find specific components or examples, use shadcn MCP Tools:**
```
mcp_shadcn_search_items_in_registries(registries: ['@shadcn'], query: 'chart')
mcp_shadcn_view_items_in_registries(items: ['@shadcn/card'])
mcp_shadcn_get_item_examples_from_registries(registries: ['@shadcn'], query: 'card-demo')
```

### recharts (Charts)

Pre-installed! Use for visualizations:
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { AreaChart, Area } from 'recharts';
```

| Chart Type | Use Case |
|------------|----------|
| `LineChart` | Time series, trends |
| `BarChart` | Comparisons, categories |
| `PieChart` | Distributions, percentages |
| `AreaChart` | Cumulative trends |

See: https://recharts.org/

### lucide-react (Icons)

Pre-installed! Use appropriate icons:
```typescript
import { 
  TrendingUp, TrendingDown,  // Trends
  AlertCircle, CheckCircle,   // Status
  PlusCircle, MinusCircle,    // Actions
  Calendar, Clock,            // Time
  User, Users,                // People
  DollarSign, Euro,           // Money
  Activity, Heart,            // Health/Fitness
  Package, ShoppingCart,      // Inventory
} from 'lucide-react';
```

See: https://lucide.dev/

### date-fns (Date Formatting)

Pre-installed! Use for date formatting:
```typescript
import { format, parseISO, formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';

// Format for display
format(parseISO(record.createdat), 'dd.MM.yyyy', { locale: de });
// → "06.11.2025"

format(parseISO(record.createdat), 'PPP', { locale: de });
// → "6. November 2025"

// Relative time
formatDistance(parseISO(record.createdat), new Date(), { 
  addSuffix: true, 
  locale: de 
});
// → "vor 3 Tagen"

// For input type="date"
const inputValue = record.datum?.split('T')[0] || '';
// → "2025-11-06"
```

---

## TypeScript Patterns

### ⚠️ CRITICAL: Type-Only Imports

TypeScript's `verbatimModuleSyntax` requires explicit type imports:

```typescript
// ❌ WRONG - TypeScript error
import { Workout, Ernaehrung } from '@/types/app';

// ✅ CORRECT - Option 1 (preferred)
import type { Workout, Ernaehrung } from '@/types/app';

// ✅ CORRECT - Option 2
import { type Workout, type Ernaehrung } from '@/types/app';
```

---

## Data Fetching Pattern

```typescript
import { useState, useEffect } from 'react';
import type { Workout } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

function Dashboard() {
  const [data, setData] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await LivingAppsService.getWorkouts();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (data.length === 0) return <EmptyState />;

  return <DashboardContent data={data} />;
}
```

---

## Relationship Handling (applookup)

### Joining Data from Multiple Apps

```typescript
import type { Workout, Exercise } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

function useDashboardData() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    async function load() {
      const [w, e] = await Promise.all([
        LivingAppsService.getWorkouts(),
        LivingAppsService.getExercises(),
      ]);
      setWorkouts(w);
      setExercises(e);
    }
    load();
  }, []);

  // Create lookup map for exercises
  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach(ex => map.set(ex.record_id, ex));
    return map;
  }, [exercises]);

  // Enrich workouts with exercise data
  const enrichedWorkouts = useMemo(() => {
    return workouts.map(workout => {
      const exerciseId = extractRecordId(workout.fields.exercise);
      const exercise = exerciseId ? exerciseMap.get(exerciseId) : null;
      return { ...workout, exercise };
    });
  }, [workouts, exerciseMap]);

  return { enrichedWorkouts, loading, error };
}
```

### Grouping by Relationship

```typescript
// Group items by a related record
function groupByRelation<T extends { fields: { [key: string]: any } }>(
  items: T[],
  relationField: string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  items.forEach(item => {
    const relatedId = extractRecordId(item.fields[relationField]);
    if (!relatedId) return;  // ✅ Skip items without relation
    
    if (!groups.has(relatedId)) {
      groups.set(relatedId, []);
    }
    groups.get(relatedId)!.push(item);
  });
  
  return groups;
}

// Usage
const workoutsByExercise = groupByRelation(workouts, 'exercise');
```

---

## Form Handling Pattern

```typescript
import { useState } from 'react';
import type { WorkoutInput } from '@/types/app';
import { LivingAppsService, createRecordUrl, APP_IDS } from '@/services/livingAppsService';

function AddWorkoutForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<Partial<WorkoutInput>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Transform data for API
      const apiData = {
        ...formData,
        // Date format: YYYY-MM-DDTHH:MM (no seconds!)
        datum: formData.datum + 'T12:00',
        // applookup: full URL
        exercise: formData.exerciseId 
          ? createRecordUrl(APP_IDS.EXERCISES, formData.exerciseId)
          : null,
      };

      await LivingAppsService.createWorkout(apiData);
      onSuccess();
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## shadcn/ui Component Patterns

### Card with Stats

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StatCard({ title, value, icon: Icon }: StatProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
```

### ⚠️ Select Component - No Empty Strings!

```typescript
// ❌ WRONG - Runtime error!
<SelectItem value="">No selection</SelectItem>

// ✅ CORRECT - Use placeholder
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// ✅ CORRECT - Use special value for "none"
<Select value={value || "none"} onValueChange={v => setValue(v === "none" ? "" : v)}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">No selection</SelectItem>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Dialog for Actions

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function ActionDialog({ trigger, title, children }: DialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Chart Patterns (recharts)

### Basic Line Chart

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function TrendChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Data Aggregation for Charts

```typescript
// Group by date
function aggregateByDate<T extends { createdat: string }>(
  items: T[],
  valueExtractor: (item: T) => number
): Array<{ date: string; value: number }> {
  const groups = new Map<string, number>();
  
  items.forEach(item => {
    const date = item.createdat.split('T')[0];  // YYYY-MM-DD
    const current = groups.get(date) || 0;
    groups.set(date, current + valueExtractor(item));
  });
  
  return Array.from(groups.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

---

## Date Formatting (date-fns)

```typescript
import { format, parseISO, formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';

// Format for display
const formatted = format(parseISO(record.createdat), 'dd.MM.yyyy', { locale: de });
// → "06.11.2025"

// Relative time
const relative = formatDistance(parseISO(record.createdat), new Date(), { 
  addSuffix: true,
  locale: de 
});
// → "vor 3 Tagen"

// For input type="date"
const inputValue = record.datum?.split('T')[0] || '';
// → "2025-11-06"
```

---

## Utility Functions

### Safe Number Formatting

```typescript
function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE').format(value);
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value / 100);
}
```

### Calculate KPIs

```typescript
function calculateStats<T>(
  items: T[],
  valueExtractor: (item: T) => number | null | undefined
) {
  const values = items
    .map(valueExtractor)
    .filter((v): v is number => v != null);
  
  if (values.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  }
  
  return {
    sum: values.reduce((a, b) => a + b, 0),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}
```

