# Frontend Implementation Skill

## Context: Why This Skill Exists

You are equipped with a design specification created by a UX/UI specialist. Your job is to implement it faithfully while maintaining code quality and functionality.

This skill activates when building React dashboards for Living Apps. It provides:
1. How to use the design specification
2. Living Apps API specifics
3. Implementation patterns
4. Definition of done

## Your Task: Frontend Developer

Implement `src/pages/Dashboard.tsx` following the design specification in `design_spec.json` EXACTLY.

## Critical: Use Design Tokens

The design spec contains all aesthetic decisions. You MUST translate them to code.

### Step 1: Load Design Spec

```typescript
// Read design_spec.json at start
import designSpec from '@/design_spec.json';

// Use throughout implementation
const primaryColor = designSpec.colors.primary['500'];
const headingFont = designSpec.typography.fonts.heading.family;
```

### Step 2: Create CSS Custom Properties

In `src/index.css`, translate design tokens:

```css
@import url('{{design_spec.typography.fonts.heading.google_fonts_url}}');
@import url('{{design_spec.typography.fonts.body.google_fonts_url}}');

:root {
  /* Colors */
  --color-primary-50: {{design_spec.colors.primary['50']}};
  --color-primary-500: {{design_spec.colors.primary['500']}};
  --color-primary-700: {{design_spec.colors.primary['700']}};

  --color-accent-main: {{design_spec.colors.accent.main}};

  --color-bg: {{design_spec.colors.neutrals.bg}};
  --color-surface: {{design_spec.colors.neutrals.surface}};
  --color-border: {{design_spec.colors.neutrals.border}};

  --color-text-primary: {{design_spec.colors.neutrals.text.primary}};
  --color-text-secondary: {{design_spec.colors.neutrals.text.secondary}};

  /* Typography */
  --font-heading: {{design_spec.typography.fonts.heading.family}}, sans-serif;
  --font-body: {{design_spec.typography.fonts.body.family}}, sans-serif;
  --font-mono: {{design_spec.typography.fonts.mono.family}}, monospace;

  /* Spacing */
  --spacing-unit: {{design_spec.spacing.scale}};
  --container-max: {{design_spec.spacing.container.max_width}};
  --card-padding: {{design_spec.spacing.card_padding}};

  /* Components */
  --card-radius: {{design_spec.components.cards.border_radius}};
  --button-radius: {{design_spec.components.buttons.primary.radius}};
}

body {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  background: var(--color-bg);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

### Step 3: Implement Layout from `ux_strategy`

Follow the exact layout specified:

```typescript
// If design_spec.ux_strategy.hero_section.layout === "4_kpi_cards"
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {design_spec.ux_strategy.hero_section.metrics.map(metric => (
    <KPICard key={metric.id} {...metric} />
  ))}
</div>

// If design_spec.layout.structure.main_content.type === "2_column"
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Primary chart (60% width) */}
  </div>
  <div className="lg:col-span-1">
    {/* Supporting data (40% width) */}
  </div>
</div>
```

### Step 4: Implement Visualizations from Spec

```typescript
// For each visualization in design_spec.ux_strategy.visualizations:
<Card>
  <CardHeader>
    <CardTitle>{viz.title}</CardTitle>
  </CardHeader>
  <CardContent>
    {viz.type === 'area_chart' && (
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={designSpec.colors.primary['500']} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={designSpec.colors.primary['500']} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          stroke={designSpec.colors.primary['700']}
          fill="url(#colorFill)"
          animationDuration={designSpec.components.charts.animation.duration}
        />
      </AreaChart>
    )}
  </CardContent>
</Card>
```

### Step 5: Implement Motion from Spec

```css
/* In index.css - based on design_spec.motion.page_load */
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

.animate-fade-in-up {
  animation: fadeInUp {{design_spec.motion.page_load.duration}} {{design_spec.motion.page_load.easing}};
  animation-fill-mode: both;
}

.animate-delay-1 { animation-delay: {{design_spec.motion.page_load.stagger_increment}}; }
.animate-delay-2 { animation-delay: calc({{design_spec.motion.page_load.stagger_increment}} * 2); }
.animate-delay-3 { animation-delay: calc({{design_spec.motion.page_load.stagger_increment}} * 3); }
```

```typescript
// Apply animations in Dashboard
<div className="space-y-6">
  <div className="animate-fade-in-up animate-delay-1">
    {/* Hero section */}
  </div>
  <div className="animate-fade-in-up animate-delay-2">
    {/* Main chart */}
  </div>
  <div className="animate-fade-in-up animate-delay-3">
    {/* Supporting visualizations */}
  </div>
</div>
```

## Living Apps API Integration

### TypeScript & Services Already Exist

**⚠️ CRITICAL: DO NOT create these files yourself!**

Already available:
- `src/types/*.ts` - TypeScript interfaces for all apps
- `src/services/livingAppsService.ts` - Full CRUD service

```typescript
// Just import and use:
import type { Workout, Ernaehrung, Ziel } from '@/types/gym';
import { LivingAppsService } from '@/services/livingAppsService';

// Then call methods:
const workouts = await LivingAppsService.getWorkouts();
const ernaehrung = await LivingAppsService.getErnaehrung();
```

### Date Format Handling

**Living Apps expects specific formats:**

```typescript
// For date/datetimeminute fields (YYYY-MM-DDTHH:MM - NO SECONDS!)
const dateForAPI = formData.datum + 'T12:00';  // ✅ Correct
const dateForAPI = formData.datum + 'T12:00:00';  // ❌ Wrong

// For date/date fields (YYYY-MM-DD)
const dateForAPI = formData.datum;  // ✅ Correct

// When displaying API dates in <input type="date">:
const dateForInput = apiData.datum.split('T')[0];  // Extract YYYY-MM-DD
```

### applookup URL References

**CRITICAL: Always use helper functions!**

```typescript
// ❌ WRONG - Manual extraction:
const parts = url.split('/');
const recordId = parts[parts.length - 1];

// ✅ RIGHT - Use extractRecordId():
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';

const recordId = extractRecordId(log.fields.uebung);
if (!recordId) return;  // Null-safe!

// When creating/updating records:
const data = {
  kategorie: createRecordUrl('690cae764701a533c09cd881', selectedKategorieId)
  // Creates: 'https://my.living-apps.de/rest/apps/{appId}/records/{recordId}'
};
```

**Why?**
- `extractRecordId()` uses regex for robust extraction
- Handles null/undefined gracefully
- Manual extraction fails with query params or different URL formats

### API Response Transformation

**Living Apps returns Objects, not Arrays:**

```typescript
// ❌ WRONG - Loses record_id:
const kategorien = Object.values(data);

// ✅ RIGHT - Preserves record_id:
return Object.entries(data).map(([record_id, record]: [string, any]) => ({
  record_id,  // ← Essential for React keys and updates!
  createdat: record.createdat,
  updatedat: record.updatedat,
  fields: record.fields,
}));
```

### Select Component - No Empty Strings!

**Radix UI (shadcn/ui) forbids empty string values:**

```typescript
// ❌ WRONG - Runtime error:
<Select value={formData.lieferant}>
  <SelectItem value="">Keine Auswahl</SelectItem>
  <SelectItem value="option1">Option 1</SelectItem>
</Select>

// ✅ RIGHT - Use placeholder for optional fields:
<Select value={formData.lieferant}>
  <SelectTrigger>
    <SelectValue placeholder="Auswählen (optional)" />
  </SelectTrigger>
  <SelectContent>
    {/* No "Keine Auswahl" item needed */}
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>

// ✅ ALTERNATIVE - Use special value:
<Select value={formData.lieferant || "none"}>
  <SelectItem value="none">Keine Auswahl</SelectItem>
  <SelectItem value="option1">Option 1</SelectItem>
</Select>
```

### Type-Only Imports (verbatimModuleSyntax)

```typescript
// ❌ WRONG:
import { Kategorie, Ausgabe } from '@/types/finance';

// ✅ RIGHT:
import type { Kategorie, Ausgabe } from '@/types/finance';
// or
import { type Kategorie, type Ausgabe } from '@/types/finance';
```

## Implementation Checklist

Before considering the dashboard complete:

### Design Fidelity
- [ ] All CSS custom properties from design_spec created
- [ ] Specified fonts loaded from Google Fonts
- [ ] Color palette matches design_spec exactly (no arbitrary colors)
- [ ] Layout matches ux_strategy specification
- [ ] Visualizations use specified types and colors
- [ ] Motion/animations implemented as specified
- [ ] Component styles (cards, buttons) match design_spec

### Functionality
- [ ] All KPIs calculate correctly
- [ ] Charts display real data from Living Apps API
- [ ] Primary action button opens dialog/modal
- [ ] Forms validate and submit correctly
- [ ] Error states handled gracefully
- [ ] Loading states show skeleton screens

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Living Apps API patterns followed (dates, applookup, responses)
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Accessibility: keyboard navigation, ARIA labels, color contrast

### Living Apps Integration
- [ ] Uses existing types from src/types/
- [ ] Uses LivingAppsService methods (no direct fetch calls)
- [ ] Date formats correct (YYYY-MM-DDTHH:MM for datetimeminute)
- [ ] applookup URLs use createRecordUrl() and extractRecordId()
- [ ] Select components have no empty string values
- [ ] API responses transformed with Object.entries()

## Example Implementation Structure

```typescript
import { useState, useEffect } from 'react';
import type { Workout, Ernaehrung } from '@/types/fitness';
import { LivingAppsService } from '@/services/livingAppsService';
import designSpec from '@/design_spec.json';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await LivingAppsService.getWorkouts();
      setWorkouts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Calculate KPIs based on design_spec.ux_strategy.hero_section.metrics
  const totalWorkouts = workouts.length;
  const thisWeekWorkouts = workouts.filter(/* ... */);

  if (loading) {
    return <DashboardSkeleton />;  // From design_spec.motion.loading
  }

  return (
    <div className="min-h-screen" style={{ background: designSpec.backgrounds.main.value }}>
      {/* Hero Section - from design_spec.ux_strategy.hero_section */}
      <section
        className="py-12 px-6"
        style={{ background: designSpec.backgrounds.hero.value }}
      >
        <div className="container mx-auto" style={{ maxWidth: designSpec.spacing.container.max_width }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            {designSpec.ux_strategy.hero_section.metrics.map((metric, i) => (
              <Card key={metric.id} className={`animate-delay-${i + 1}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: designSpec.colors.primary['500'] }} />
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold font-heading">
                    {/* Calculate metric value */}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - from design_spec.layout.structure.main_content */}
      <section className="py-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 animate-fade-in-up animate-delay-2">
              {/* Primary visualization - from design_spec.ux_strategy.visualizations[0] */}
              <Card>
                <CardHeader>
                  <CardTitle>{designSpec.ux_strategy.visualizations[0].title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData}>
                      {/* Style from design_spec.ux_strategy.visualizations[0].styling */}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 animate-fade-in-up animate-delay-3">
              {/* Supporting visualization */}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action - from design_spec.ux_strategy.actions.primary */}
      <Button
        className="fixed bottom-8 right-8"
        size="lg"
        style={{
          background: designSpec.colors.primary['500'],
          borderRadius: designSpec.components.buttons.primary.radius
        }}
        onClick={() => setDialogOpen(true)}
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        {designSpec.ux_strategy.actions.primary.label}
      </Button>
    </div>
  );
}
```

## Final Validation

Before calling `deploy_to_github` tool:

```bash
# 1. Build succeeds
npm run build

# 2. No TypeScript errors
npx tsc --noEmit

# 3. Visual inspection
# - Fonts match design_spec
# - Colors match design_spec
# - Layout matches design_spec
# - Animations work
```

## Remember

You are implementing someone else's design. Your job is faithful execution, not creative interpretation.

**If design_spec says:**
- "Use IBM Plex Sans" → Use it exactly
- "4-column grid" → Build it exactly
- "Area chart with gradient fill" → Implement it exactly

**Quality = Fidelity to design_spec + Code quality + Functionality**
