---
name: frontend-impl
description: |
  Activate this skill when:
  - Implementing Dashboard.tsx
  - Following design_spec.json
  - Writing React/TypeScript code
  - Integrating with Living Apps API
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Frontend Implementation Skill

You are a React/TypeScript developer. Your job is to **implement exactly what design_spec.json specifies**.

## ⚠️ DO NOT Design - Only Implement

The design decisions are already made in `design_spec.json`. Your job is to:
1. Read the spec
2. Implement it exactly
3. Ensure it works

**DO NOT:**
- Change the color scheme
- Pick different fonts
- Rearrange the layout
- Add features not in the spec

---

## Process

### Step 1: Read the Spec

```bash
cat design_spec.json
```

Understand:
- What theme/colors to use
- What KPIs to show
- What charts to create
- What the primary action is

### Step 2: Read Existing Code

```bash
cat src/types/*.ts           # Available types
cat src/services/livingAppsService.ts  # Available methods
```

### Step 3: Implement Dashboard.tsx

Create `src/pages/Dashboard.tsx` following the spec exactly:

```typescript
// 1. Imports (always use 'import type' for types!)
import { useState, useEffect } from 'react';
import type { AppType1, AppType2 } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

// 2. Implement theme from design_spec.json
// 3. Implement KPIs from design_spec.json
// 4. Implement charts from design_spec.json
// 5. Implement primary action from design_spec.json
```

### Step 4: Apply Theme to CSS Variables (CRITICAL!)

shadcn/ui components use **Tailwind CSS variables** for colors. These are defined in `src/index.css`. If you don't update them, components like `<Card>` will use **default colors** that don't match your design!

#### How the CSS Variable System Works

```
design_spec.json → src/index.css → Tailwind classes → shadcn components
    (your design)     (CSS variables)   (bg-card, text-foreground)   (Card, Button, etc.)
```

shadcn components use classes like `bg-card`, `text-foreground`, `border-border`. These classes read from CSS variables like `--card`, `--foreground`, `--border`. If you don't set these variables, the components use defaults that may not match your design.

#### Step 4a: Determine Light or Dark Mode

Look at `design_spec.json → theme.mode`:
- If `"dark"`: Add `class="dark"` to `<html>` in `index.html`
- If `"light"`: Remove `class="dark"` (or leave default)

```html
<!-- index.html -->
<html lang="de" class="dark">  <!-- Add 'dark' for dark themes! -->
```

#### Step 4b: Update CSS Variables in `src/index.css`

Map the design_spec colors to the CSS variables. The structure in `src/index.css`:

```css
:root {
  /* Light mode defaults - used when NO .dark class */
}

.dark {
  /* Dark mode - used when <html class="dark"> */
}
```

**Color Mapping Table:**

| design_spec.json path | CSS Variable | Used by |
|----------------------|--------------|---------|
| `theme.colors.background` | `--background` | `bg-background`, body |
| `theme.colors.foreground` | `--foreground` | `text-foreground`, body text |
| `theme.colors.card` | `--card` | `<Card>` background |
| `theme.colors.foreground` | `--card-foreground` | Text inside cards |
| `theme.colors.primary` | `--primary` | `<Button>` default |
| `theme.colors.accent` | `--accent` | Accent elements |
| `theme.colors.muted` | `--muted` | Muted backgrounds |
| `theme.colors.border` | `--border` | All borders |
| `theme.colors.positive` | `--chart-2` | Success/positive in charts |
| `theme.colors.negative` | `--destructive` | Error/negative |

#### Step 4c: Example - Applying a Dark Theme

If design_spec.json says:
```json
{
  "theme": {
    "mode": "dark",
    "colors": {
      "background": "hsl(215 28% 7%)",
      "foreground": "hsl(215 10% 92%)",
      "card": "hsl(215 25% 12%)",
      "primary": "hsl(25 95% 53%)",
      "accent": "hsl(173 80% 45%)",
      "muted": "hsl(215 15% 20%)",
      "border": "hsl(215 20% 18%)"
    }
  }
}
```

Then update `src/index.css`:

```css
.dark {
  --background: hsl(215 28% 7%);
  --foreground: hsl(215 10% 92%);
  
  --card: hsl(215 25% 12%);
  --card-foreground: hsl(215 10% 92%);
  
  --popover: hsl(215 25% 12%);
  --popover-foreground: hsl(215 10% 92%);
  
  --primary: hsl(25 95% 53%);
  --primary-foreground: hsl(215 28% 7%);
  
  --accent: hsl(173 80% 45%);
  --accent-foreground: hsl(215 28% 7%);
  
  --muted: hsl(215 15% 20%);
  --muted-foreground: hsl(215 10% 70%);
  
  --border: hsl(215 20% 18%);
  --input: hsl(215 20% 18%);
  --ring: hsl(173 80% 45%);
}
```

And update `index.html`:
```html
<html lang="de" class="dark">
```

#### ⚠️ CRITICAL: CSS Color Format

The CSS variables **MUST use complete color functions**, not raw values!

**❌ WRONG - Raw values break Tailwind:**
```css
.dark {
  --background: 220 25% 6%;        /* ❌ Just numbers - NOT a valid CSS color! */
  --card: 220 20% 10%;             /* ❌ Browser ignores this, uses fallback! */
}
```

**✅ CORRECT - Complete color functions:**
```css
.dark {
  --background: hsl(220 25% 6%);   /* ✓ Complete hsl() function */
  --card: hsl(220 20% 10%);        /* ✓ Tailwind can use this */
}
```

**Why raw values fail:**
- Tailwind reads `var(--background)` directly for `bg-background`
- If `--background` is `220 25% 6%` (just numbers), it's NOT a valid CSS color
- Browser ignores invalid colors → falls back to white/transparent
- Result: Light backgrounds with dark text = invisible!

**Always copy the FULL hsl() or oklch() function from design_spec.json, including the function name!**

#### Why This Matters

Without this step:
- `<Card>` uses default background (light/white)
- Text colors (from design_spec) are for dark backgrounds
- Result: **Light text on light cards = invisible!**

With this step:
- All shadcn components automatically use your theme colors
- Consistent look across all UI elements
- No need to add inline styles everywhere

### Step 5: Add Font from Spec

In `index.html`, add the font URL from design_spec.json:
```html
<link href="{font_url from spec}" rel="stylesheet">
```

### Step 6: Build and Test

```bash
npm run build  # Must compile without errors
```

### Step 7: Deploy

```
Call mcp__deploy_tools__deploy_to_github
```

---

## Critical Implementation Rules

### 1. Type Imports
```typescript
// ❌ WRONG
import { Workout } from '@/types/app';

// ✅ CORRECT
import type { Workout } from '@/types/app';
```

### 2. extractRecordId Always Has Null Check
```typescript
const id = extractRecordId(record.fields.relation);
if (!id) return;  // ✅ Always check!
```

### 3. Dates Without Seconds
```typescript
// For API: YYYY-MM-DDTHH:MM (no seconds!)
const dateForAPI = formData.date + 'T12:00';
```

### 4. Select Never Has Empty Value
```typescript
// ❌ WRONG
<SelectItem value="">None</SelectItem>

// ✅ CORRECT
<SelectItem value="none">None</SelectItem>
```

---

## Implementation Checklist

Before completing:

- [ ] `index.html` has correct `class="dark"` or no class (based on theme.mode)
- [ ] `src/index.css` CSS variables updated to match design_spec.json colors
- [ ] Font loaded from design_spec.json font_url in `index.html`
- [ ] All KPIs from spec implemented
- [ ] Chart matches spec (type, data source)
- [ ] Primary action implemented
- [ ] Animations match spec (stagger, hover)
- [ ] Mobile responsive
- [ ] `npm run build` passes
- [ ] No console errors

---

## Definition of Done

The dashboard is complete when:

1. ✅ **User experience excellent**: Intuitive, clear, professional
2. ✅ **Action button for main action works** (with Dialog/Modal)
3. ✅ All KPIs/Stats calculated correctly
4. ✅ Loading state works (Skeleton, not empty page)
5. ✅ Error handling implemented (friendly messages)
6. ✅ Empty state implemented (helpful placeholders)
7. ✅ Responsive design (Mobile + Desktop)
8. ✅ No TypeScript errors (`npm run build`)
9. ✅ No console errors in browser
10. ✅ Business logic correct
11. ✅ Living Apps API rules followed (dates, applookup, response)

---

## UX Details - Don't Forget!

### Loading States
```typescript
if (loading) {
  return <LoadingState />;  // Use Skeleton, not spinner
}
```

### Empty States
```typescript
if (data.length === 0) {
  return (
    <EmptyState 
      title="No data yet"
      description="Get started by adding your first item"
      action={<Button>Add First Item</Button>}
    />
  );
}
```

### Error States
```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button variant="outline" onClick={retry}>Try Again</Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Success Feedback
```typescript
// Use toast for success messages
import { toast } from '@/components/ui/use-toast';

toast({
  title: "Success!",
  description: "Item saved successfully.",
});
```

### Hover States
```typescript
// Cards should have hover feedback
<Card className="hover:shadow-md transition-shadow cursor-pointer">
```

---

# Living Apps API Reference

## ⚠️ Critical API Rules

These rules are **non-negotiable**. Breaking them causes runtime errors.

---

## 1. Date Formats

Living Apps has strict date format requirements:

| Field Type | Format | Example |
|------------|--------|---------|
| `date/datetimeminute` | `YYYY-MM-DDTHH:MM` | `2025-11-06T12:00` |
| `date/date` | `YYYY-MM-DD` | `2025-11-06` |

### ❌ WRONG
```typescript
// Seconds are NOT allowed for datetimeminute!
const date = '2025-11-06T12:00:00';  // ❌ Will fail
```

### ✅ CORRECT
```typescript
// For date/datetimeminute fields
const dateForAPI = formData.datum + 'T12:00';  // ✅ YYYY-MM-DDTHH:MM

// For date/date fields
const dateForAPI = formData.datum;  // ✅ YYYY-MM-DD

// Display in <input type="date">
const dateForInput = apiData.datum?.split('T')[0];  // Extract YYYY-MM-DD
```

---

## 2. applookup Fields

`applookup/select` fields store **full URLs** to related records.

### URL Format
```
https://my.living-apps.de/rest/apps/{app_id}/records/{record_id}
```

### ⚠️ CRITICAL: Always use extractRecordId()

```typescript
// ❌ NEVER do this manually
const parts = url.split('/');
const id = parts[parts.length - 1];  // ❌ Fragile!

// ✅ ALWAYS use the helper function
import { extractRecordId } from '@/services/livingAppsService';

const recordId = extractRecordId(url);
if (!recordId) return;  // ✅ Always null-check!
```

### extractRecordId() Implementation
```typescript
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extracts last 24 hex characters (Living Apps Record IDs)
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}
```

### Creating applookup Values
```typescript
import { createRecordUrl, APP_IDS } from '@/services/livingAppsService';

// When creating/updating records with applookup fields
const data = {
  kategorie: createRecordUrl(APP_IDS.KATEGORIEN, selectedKategorieId),
};

// createRecordUrl returns:
// 'https://my.living-apps.de/rest/apps/{app_id}/records/{record_id}'
```

### applookup Can Be Null!
```typescript
// ❌ WRONG - Will crash if field is null
workoutLogs.forEach((log) => {
  const id = extractRecordId(log.fields.uebung);
  data[id] = log;  // ❌ Crashes if id is null
});

// ✅ CORRECT - Defensive programming
workoutLogs.forEach((log) => {
  const id = extractRecordId(log.fields.uebung);
  if (!id) return;  // ✅ Skip if null
  if (!data[id]) data[id] = [];
  data[id].push(log);
});
```

---

## 3. API Response Format

Living Apps returns **objects**, not arrays!

### Response Structure
```typescript
// API returns:
{
  "690abc123...": {
    "createdat": "2025-11-06T10:00:00",
    "updatedat": null,
    "fields": {
      "name": "Item 1",
      "value": 100
    }
  },
  "690def456...": {
    "createdat": "2025-11-06T11:00:00",
    "updatedat": null,
    "fields": {
      "name": "Item 2",
      "value": 200
    }
  }
}
```

### ❌ WRONG Transformation
```typescript
// Loses record_id!
const items = Object.values(response);  // ❌ No record_id!
```

### ✅ CORRECT Transformation
```typescript
// Use Object.entries() to preserve record_id
const items = Object.entries(response).map(([record_id, record]) => ({
  record_id,  // ← From the key
  createdat: record.createdat,
  updatedat: record.updatedat,
  ...record.fields,
}));
```

### Why record_id Matters
- Required for React `key` prop
- Required for update/delete operations
- Required for applookup references

---

## 4. API Authentication

```typescript
const headers = {
  'X-API-Key': API_KEY,  // From environment
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

### Proxy vs Direct URL
```typescript
// For API calls (via proxy)
const API_BASE = '/api/rest';

// For applookup values (direct)
const APPLOOKUP_BASE = 'https://my.living-apps.de/rest';
```

---

## 5. CRUD Operations

### GET All Records
```typescript
GET /api/rest/apps/{app_id}/records
```

### GET Single Record
```typescript
GET /api/rest/apps/{app_id}/records/{record_id}
```

### CREATE Record
```typescript
POST /api/rest/apps/{app_id}/records
Content-Type: application/json

{
  "name": "New Item",
  "value": 100
}
```

### UPDATE Record
```typescript
PATCH /api/rest/apps/{app_id}/records/{record_id}
Content-Type: application/json

{
  "value": 150  // Only changed fields
}
```

### DELETE Record
```typescript
DELETE /api/rest/apps/{app_id}/records/{record_id}

// Note: DELETE also returns JSON, always call response.json()
```

---

## 6. Error Handling

```typescript
async function callAPI(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();  // Always parse JSON, even for DELETE
}
```

---

## 7. Metadata Structure

`app_metadata.json` contains the **complete, real metadata from Living Apps REST API**.

**IMPORTANT:**
- `controls` is an **OBJECT** (not array!)
- Each control has `identifier`, `label`, `type`, `subtype`, `fulltype`
- `lookup/select` has `lookup_data` with all options
- `applookup/select` has `lookup_app` URL to the linked app

```typescript
{
  "appgroup_id": "...",
  "appgroup_name": "My App Group",
  "apps": {
    "app_identifier": {
      "app_id": "...",
      "name": "App Display Name",
      "controls": {
        "control_identifier": {
          "identifier": "field_name",      // Use this as field key
          "label": "Field Label",          // Use this for UI display
          "type": "string",                // Base type
          "subtype": null,                 // or "select", "textarea", etc.
          "fulltype": "string/text",       // Combined: type/subtype
          "lookup_data": [                 // For lookup/select fields
            { "key": "option1", "value": "Option 1" },
            { "key": "option2", "value": "Option 2" }
          ],
          "lookup_app": "https://my.living-apps.de/rest/apps/{app_id}"  // For applookup
        }
      }
    }
  }
}
```

### Common Field Types
| fulltype | TypeScript | Notes |
|----------|------------|-------|
| `string/text` | `string` | Plain text |
| `string/textarea` | `string` | Multiline text |
| `number/number` | `number` | Numeric |
| `bool/bool` | `boolean` | True/false |
| `date/date` | `string` | YYYY-MM-DD |
| `date/datetimeminute` | `string` | YYYY-MM-DDTHH:MM (NO seconds!) |
| `lookup/select` | `string` | From predefined list (lookup_data) |
| `applookup/select` | `string \| null` | URL to another app's record |

### Using Metadata for UI
```typescript
// Use field labels for UI
const fieldLabel = metadata.apps.myapp.controls.myfield.label;

// Use lookup_data for Select options
const options = metadata.apps.myapp.controls.status.lookup_data;
// → [{ key: "active", value: "Active" }, { key: "done", value: "Done" }]
```

---

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
