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

# PART 1: Implementation Process

## Step 1: Read the Spec

```bash
cat design_spec.json
```

Understand:
- What theme/colors to use
- What KPIs to show
- What charts to create
- What the primary action is

## Step 2: Read Existing Code

```bash
cat src/types/*.ts           # Available types
cat src/services/livingAppsService.ts  # Available methods
```

## Step 3: Implement Dashboard.tsx

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

## Step 4: Update index.css with Theme

⚠️ **CRITICAL: Update `src/index.css` directly! NEVER inject styles via JavaScript!**

```css
/* src/index.css */

/* 1. Google Fonts FIRST (before all other imports!) */
@import url('https://fonts.googleapis.com/css2?family={Font+Name}:wght@300;500;700&display=swap');

@import "tailwindcss";
@import "tw-animate-css";

/* 2. Update :root with theme colors from design_spec.json */
/* ALWAYS use hsl() format with the full hsl() wrapper! */
:root {
  --radius: 0.625rem;
  --background: hsl(220, 18%, 8%);
  --foreground: hsl(0, 0%, 98%);
  --card: hsl(220, 16%, 12%);
  --card-foreground: hsl(0, 0%, 98%);
  --primary: hsl(31, 97%, 58%);
  --primary-foreground: hsl(220, 18%, 8%);
  --muted: hsl(220, 15%, 20%);
  --muted-foreground: hsl(220, 10%, 55%);
  --border: hsl(220, 15%, 18%);
  --positive: hsl(142, 71%, 45%);
  --negative: hsl(0, 72%, 55%);
}

/* 3. Body styles */
@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: 'Font Name', system-ui, sans-serif;
    background: linear-gradient(135deg, hsl(220, 18%, 8%) 0%, hsl(220, 20%, 10%) 100%);
    background-attachment: fixed;
  }
}

/* 4. Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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
```

**⚠️ NEVER DO THIS:**
```typescript
// ❌ WRONG - Dynamic style injection doesn't work properly!
const styleElement = document.createElement('style');
styleElement.textContent = `...`;
document.head.appendChild(styleElement);
```

## Step 5: Build and Test

```bash
npm run build  # Must compile without errors
```

## Step 6: Deploy

```
Call mcp__deploy_tools__deploy_to_github
```

---

# PART 2: Living Apps API Rules

## ⚠️ App URLs (For Links/Navigation)

| Purpose | URL Format |
|---------|------------|
| App Form (for users) | `https://my.living-apps.de/apps/{app_id}` |
| REST API | `https://my.living-apps.de/rest/apps/{app_id}` |

```typescript
// ❌ WRONG - /app/ (singular) doesn't exist!
href="https://my.living-apps.de/app/6914a7e7b773d677cf3838c1"

// ✅ CORRECT - /apps/ (plural)
href="https://my.living-apps.de/apps/6914a7e7b773d677cf3838c1"
```

## Date Formats

| Field Type | Format | Example |
|------------|--------|---------|
| `date/datetimeminute` | `YYYY-MM-DDTHH:MM` | `2025-11-06T12:00` |
| `date/date` | `YYYY-MM-DD` | `2025-11-06` |

```typescript
// ❌ WRONG - Seconds are NOT allowed!
const date = '2025-11-06T12:00:00';

// ✅ CORRECT
const dateForAPI = formData.datum + 'T12:00';  // YYYY-MM-DDTHH:MM
```

## applookup Fields

Always use `extractRecordId()`:

```typescript
import { extractRecordId } from '@/services/livingAppsService';

const recordId = extractRecordId(url);
if (!recordId) return;  // ✅ Always null-check!
```

## API Response Format

Living Apps returns **objects**, not arrays!

```typescript
// ✅ CORRECT - Use Object.entries() to preserve record_id
const items = Object.entries(response).map(([record_id, record]) => ({
  record_id,
  createdat: record.createdat,
  updatedat: record.updatedat,
  ...record.fields,
}));
```

---

# PART 3: Critical Implementation Rules

## 1. Type Imports
```typescript
// ❌ WRONG
import { Workout } from '@/types/app';

// ✅ CORRECT
import type { Workout } from '@/types/app';
```

## 2. extractRecordId Always Has Null Check
```typescript
const id = extractRecordId(record.fields.relation);
if (!id) return;  // ✅ Always check!
```

## 3. Dates Without Seconds
```typescript
const dateForAPI = formData.date + 'T12:00';  // No seconds!
```

## 4. Select Never Has Empty Value
```typescript
// ❌ WRONG - Runtime error!
<SelectItem value="">None</SelectItem>

// ✅ CORRECT
<SelectItem value="none">None</SelectItem>
```

---

# PART 4: Primary Action Button

## ⚠️ NEVER use external links for add_record actions!

```typescript
// ❌ WRONG - Opens external tab, data entry outside dashboard
<a href="https://my.living-apps.de/apps/..." target="_blank">
  Add Item
</a>

// ✅ CORRECT - Dialog with form, uses LivingAppsService
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger asChild>
    <Button>Add Item</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit">Save</Button>
    </form>
  </DialogContent>
</Dialog>
```

### Form submission uses the service:
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);
  
  try {
    await LivingAppsService.createWorkout({
      datum: formData.datum,
      typ: formData.typ,
      dauer_minuten: formData.dauer ? parseInt(formData.dauer) : undefined,
    });
    
    // Reload data
    const updated = await LivingAppsService.getWorkouts();
    setWorkouts(updated);
    
    // Close dialog
    setDialogOpen(false);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setSubmitting(false);
  }
}
```

---

# PART 5: Code Patterns

## Available Libraries

### shadcn/ui Components
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
```

### recharts (Charts)
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { AreaChart, Area } from 'recharts';
```

### lucide-react (Icons)
```typescript
import { 
  TrendingUp, TrendingDown, Plus, Loader2,
  Dumbbell, Flame, Scale, Calendar,
} from 'lucide-react';
```

### date-fns
```typescript
import { format, parseISO, isToday, startOfWeek, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

format(parseISO(record.createdat), 'dd.MM.yyyy', { locale: de });
// → "06.11.2025"
```

---

## Data Fetching Pattern

```typescript
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

  if (loading) return <div>Lädt...</div>;
  if (error) return <div>Fehler: {error.message}</div>;
  if (data.length === 0) return <div>Keine Daten</div>;

  return <DashboardContent data={data} />;
}
```

---

## Dialog for Forms

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

function ActionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Eintrag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : 'Speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Chart Pattern

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<div className="h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={chartData}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="hsl(31, 97%, 58%)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(31, 97%, 58%)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
      <XAxis dataKey="date" stroke="hsl(220, 15%, 40%)" />
      <YAxis stroke="hsl(220, 15%, 40%)" />
      <Tooltip />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="hsl(31, 97%, 58%)" 
        fill="url(#colorValue)" 
      />
    </AreaChart>
  </ResponsiveContainer>
</div>
```

---

# PART 6: Checklists

## Implementation Checklist

Before completing:

- [ ] **index.css updated** with theme colors from design_spec.json (NOT dynamic injection!)
- [ ] Font import added at TOP of index.css (before other @imports)
- [ ] CSS variables use full `hsl()` syntax (not OKLCH or space-separated)
- [ ] Colors match design_spec.json exactly
- [ ] All KPIs from spec implemented
- [ ] Chart matches spec (type, data source)
- [ ] **Primary action uses Dialog with form** (NOT external link!)
- [ ] Animations added to index.css (fadeInUp, hover-lift, etc.)
- [ ] Mobile responsive
- [ ] `npm run build` passes
- [ ] No console errors

## Definition of Done

The dashboard is complete when:

1. ✅ **User experience excellent**: Intuitive, clear, professional
2. ✅ **Action button uses Dialog with form** (NOT external link!)
3. ✅ All KPIs/Stats calculated correctly
4. ✅ Loading state works
5. ✅ Error handling implemented
6. ✅ Empty state implemented
7. ✅ Responsive design (Mobile + Desktop)
8. ✅ No TypeScript errors (`npm run build`)
9. ✅ No console errors in browser
10. ✅ Business logic correct
11. ✅ Living Apps API rules followed (dates, applookup, response)
