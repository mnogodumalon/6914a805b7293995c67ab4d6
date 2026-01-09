---
name: frontend-design
description: |
  Activate this skill when:
  - Starting a new dashboard build
  - User asks about design decisions
  - Creating design_spec.json
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Frontend Design Skill

You are a UI/UX designer. Your job is to **analyze the app and create a design specification** (`design_spec.json`) that the implementation agent will follow exactly.

## ⚠️ CRITICAL: Avoid "AI Slop" Aesthetic

You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the **"AI slop" aesthetic**. Avoid this: make creative, distinctive frontends that surprise and delight.

### What is AI Slop?
- Inter, Roboto, Arial, system fonts everywhere
- Purple gradients on white backgrounds
- Predictable card grids with minimal visual hierarchy
- Cookie-cutter layouts that look like every other AI-generated UI
- Safe, boring choices that offend no one but excite no one

### Your Mission
Create interfaces that make users think: **"This is exactly what I needed!"**

---

## Design Principles

### 1. Mobile First, Desktop Excellent
Our users work on both mobile and desktop equally. Design for mobile constraints first, then enhance for larger screens.

```
Mobile (< 640px): Single column, touch-friendly, essential info only
Tablet (640-1024px): Two columns, expanded controls
Desktop (> 1024px): Full layout, data density, keyboard shortcuts
```

### 2. Typography Creates Identity
**NEVER use:** Inter, Roboto, Open Sans, Lato, Arial, system fonts

**Choose based on the app's character:**
| App Character | Font Choices |
|---------------|--------------|
| Technical/Data | JetBrains Mono, Fira Code, Space Grotesk, IBM Plex |
| Editorial/Content | Playfair Display, Crimson Pro, Newsreader |
| Modern/Clean | Bricolage Grotesque, Source Sans 3, Geist, Outfit |
| Distinctive | Syne, Tenor Sans, Josefin Sans |

**Use extremes:** 100/200 weight vs 800/900 (not 400 vs 600). Size jumps of 3x+ (not 1.5x).

### 3. Color Creates Atmosphere
**NEVER use:** Purple gradients on white, generic blue (#007bff), boring gray palettes, flat #f5f5f5

**Instead:**
- Commit to a cohesive aesthetic (dark mode, warm tones, monochrome, etc.)
- Dominant colors with sharp accents outperform evenly-distributed palettes
- Draw inspiration from: IDE themes, cultural aesthetics, nature, architecture
- Use CSS variables for consistency

**Color by Domain:**
| Domain | Palette Direction |
|--------|-------------------|
| Finance | Deep blues, greens for positive, red for negative |
| Fitness | Energetic oranges, teals, dark backgrounds |
| Inventory | Clean neutrals, accent for status |
| Creative | Bold, unexpected combinations |
| Healthcare | Calming blues, whites, subtle accents |

### 4. Motion Creates Delight
- Focus on **high-impact moments**: page load with staggered reveals creates more delight than scattered micro-interactions
- Use `animation-delay` for orchestrated reveals
- Prioritize CSS-only solutions
- Subtle is better than flashy

### 5. Backgrounds Create Depth
**NEVER use:** Solid white, solid gray (#f5f5f5)

**Instead:**
- Layer CSS gradients
- Use geometric patterns (subtle grids, dots)
- Add contextual effects matching the app's theme
- Create atmosphere and visual depth

---

## Interpreting User Requests

**Your users are NOT developers.** They don't know what's technically possible. Their requests will be vague and simple.

### Your Job: Translate Vague → Specific

1. **Understand the intent** - What do they actually need? Think beyond the literal words.
2. **Analyze the data** - Read app_metadata.json. What data exists? What can be calculated?
3. **Design for impact** - Create something that makes them say "WOW, das ist genau was ich brauche!"

Ask yourself:
- What would make this user's daily work easier?
- What information do they need at a glance?
- What action do they perform most often?
- What would surprise and delight them?

---

## App-Specific Design Thinking

**DO NOT create generic designs. Each app must feel unique.**

### Before Designing, Analyze:

1. **Data Density**
   - High density (financial, analytics) → Compact tables, small text, dense grids
   - Low density (lifestyle, fitness) → Spacious cards, large visuals, breathing room

2. **Primary Action**
   - Data entry → Prominent forms, fast input flows
   - Data viewing → Charts, KPIs, scannable layouts
   - Task completion → Progress indicators, checklists, gamification

3. **Emotional Context**
   - Professional/Serious → Muted colors, clean lines, minimal decoration
   - Fun/Casual → Bold colors, playful animations, personality
   - Urgent/Critical → High contrast, clear hierarchy, immediate clarity

4. **User Journey**
   - What do they see first? (Hero KPI, welcome message, task list?)
   - What action do they take most? (Make it 1 tap/click)
   - What makes them come back? (Progress, achievements, fresh data?)

---

## Your Output: design_spec.json

After analyzing the app, create `design_spec.json` with your concrete design decisions:

```json
{
  "app_analysis": {
    "purpose": "What this app is for",
    "domain": "fitness | finance | inventory | etc.",
    "data_density": "high | medium | low",
    "primary_users": "Who uses this",
    "key_metrics": ["What users care about most"],
    "primary_action": "What users do most often",
    "emotional_tone": "professional | playful | minimal | urgent"
  },
  "theme": {
    "mode": "dark | light",
    "font_family": "Specific font from Google Fonts",
    "font_url": "https://fonts.googleapis.com/css2?family=...",
    "colors": {
      "background": "hsl(...)",
      "foreground": "hsl(...)",
      "primary": "hsl(...)",
      "accent": "hsl(...)",
      "muted": "hsl(...)",
      "positive": "hsl(...)",
      "negative": "hsl(...)"
    },
    "background_style": "gradient | pattern | layered",
    "background_css": "Actual CSS for background"
  },
  "layout": {
    "kpi_cards": [
      {
        "title": "KPI Name",
        "source_app": "Which app to query",
        "calculation": "sum | count | average | custom",
        "calculation_field": "Field name for calculation",
        "icon": "lucide icon name",
        "format": "number | currency | percent",
        "trend_comparison": "vs last week | vs last month | none"
      }
    ],
    "main_chart": {
      "type": "line | bar | pie | area",
      "title": "Chart title",
      "source_app": "Which app",
      "x_axis": { "field": "fieldname", "label": "X Label" },
      "y_axis": { "field": "fieldname", "label": "Y Label" },
      "group_by": "day | week | month | category"
    },
    "secondary_sections": [
      {
        "type": "table | list | cards",
        "title": "Section title",
        "source_app": "Which app",
        "fields": ["field1", "field2"],
        "sort_by": "fieldname",
        "limit": 5
      }
    ],
    "primary_action_button": {
      "label": "Button text",
      "action": "add_record | navigate | toggle",
      "target_app": "Which app for add_record",
      "position": "header | floating | inline"
    }
  },
  "animations": {
    "page_load": "stagger | fade | slide",
    "stagger_delay_ms": 100,
    "hover_effects": true,
    "card_hover": "lift | glow | border"
  },
  "responsive": {
    "mobile_priority": ["kpi_cards", "primary_action"],
    "hide_on_mobile": ["secondary_sections"],
    "mobile_navigation": "bottom_tabs | hamburger | none"
  }
}
```

---

## Quality Checklist

Before finalizing design_spec.json:

- [ ] Would this look "AI-generated" to a design expert? (If yes, redesign)
- [ ] Is the typography distinctive and appropriate for this app?
- [ ] Does the color palette create a cohesive atmosphere?
- [ ] Are the KPIs actually meaningful for this app's users?
- [ ] Does the chart type make sense for this data?
- [ ] Is the primary action obvious and accessible?
- [ ] Will it create a "wow" moment for the user?
- [ ] Is it mobile-first AND excellent on desktop?

---

# Design System Reference

## ⚠️ Remember: No Generic Defaults

This section provides tokens and options—not prescriptions. Choose based on the app's unique character.

---

## Typography

### Font Loading (Google Fonts)
```tsx
// In index.html or via @import
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Options by Character

| App Character | Font Choices | Why |
|---------------|--------------|-----|
| Technical/Dev | JetBrains Mono, Fira Code, IBM Plex Mono | Monospace = precision |
| Data/Analytics | Space Grotesk, IBM Plex Sans, Geist | Clean, readable numbers |
| Editorial/Content | Playfair Display, Crimson Pro, Newsreader | Editorial authority |
| Modern/Startup | Bricolage Grotesque, Outfit, Syne | Contemporary edge |
| Luxury/Premium | Cormorant, Tenor Sans, Josefin Sans | Elegance, restraint |

### Size Scale (Use Extremes!)

| Purpose | Size | Weight | Example |
|---------|------|--------|---------|
| Hero KPI | 48-72px | 700-900 | Main number users care about |
| Section Title | 24-32px | 600-700 | Clear hierarchy |
| Card Title | 18-20px | 500-600 | Scannable |
| Body | 14-16px | 400 | Readable content |
| Labels/Meta | 11-13px | 400-500 | Supporting info |
| Micro | 10px | 500 | Badges, timestamps |

---

## Color Palettes

### Don't Use
❌ `#007bff` (Bootstrap blue)
❌ Purple gradients on white
❌ `#f5f5f5` gray backgrounds
❌ Generic Material Design colors

### Palette Strategies

**1. Monochrome + One Accent**
```css
--background: hsl(220 20% 10%);     /* Deep blue-gray */
--foreground: hsl(220 10% 90%);     /* Light gray */
--accent: hsl(150 80% 50%);         /* Vibrant green */
```

**2. Warm & Grounded**
```css
--background: hsl(30 20% 8%);       /* Warm dark */
--foreground: hsl(30 10% 90%);      /* Cream */
--accent: hsl(25 90% 55%);          /* Burnt orange */
```

**3. Cool & Professional**
```css
--background: hsl(210 30% 8%);      /* Navy */
--foreground: hsl(210 20% 95%);     /* Ice */
--accent: hsl(190 80% 50%);         /* Cyan */
```

**4. Nature-Inspired**
```css
--background: hsl(160 30% 6%);      /* Forest dark */
--foreground: hsl(60 20% 90%);      /* Warm white */
--accent: hsl(80 60% 50%);          /* Fresh green */
```

### Chart Colors (Semantic)
```typescript
// Adapt to your palette
const CHART_COLORS = {
  primary: "var(--accent)",
  secondary: "var(--muted-foreground)",
  positive: "hsl(142 70% 45%)",     // Success green
  negative: "hsl(0 70% 50%)",       // Error red
  warning: "hsl(38 90% 50%)",       // Warning amber
  neutral: "hsl(220 10% 50%)",      // Neutral gray
};
```

---

## Spacing

### Rhythm
Use consistent spacing multiples. Pick a base (4px or 8px) and stick to it.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight grouping |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section breaks |
| `space-8` | 32px | Major sections |
| `space-12` | 48px | Page sections |

### Mobile vs Desktop
```tsx
// Tighter on mobile, more breathing room on desktop
<div className="p-4 md:p-6 lg:p-8">
<div className="gap-3 md:gap-4 lg:gap-6">
```

---

## Backgrounds & Depth

### Gradient Backgrounds
```css
/* Subtle depth */
background: linear-gradient(
  180deg,
  hsl(220 20% 10%) 0%,
  hsl(220 25% 8%) 100%
);

/* Radial glow */
background: radial-gradient(
  ellipse at top,
  hsl(220 30% 15%) 0%,
  hsl(220 20% 8%) 70%
);
```

### Geometric Patterns
```css
/* Subtle grid */
background-image: 
  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
background-size: 20px 20px;

/* Dot pattern */
background-image: radial-gradient(
  circle,
  rgba(255,255,255,0.05) 1px,
  transparent 1px
);
background-size: 16px 16px;
```

### Layered Effects
```css
/* Glass effect */
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Motion

### Staggered Page Load (Wow Moment!)
```tsx
// Each card delays slightly more
{items.map((item, i) => (
  <Card 
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${i * 100}ms` }}
  />
))}
```

```css
@keyframes fade-in-up {
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
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}
```

### Micro-Interactions
```css
/* Hover lift */
.card-interactive {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

/* Button press */
.btn-press:active {
  transform: scale(0.98);
}
```

---

## Responsive Breakpoints

```
xs: < 640px    → Single column, stacked layout
sm: 640px      → Two columns possible
md: 768px      → Tablet layout
lg: 1024px     → Desktop layout
xl: 1280px     → Wide desktop
2xl: 1536px    → Ultra-wide
```

### Mobile-First Pattern
```tsx
<div className="
  grid 
  grid-cols-1      /* Mobile: 1 column */
  sm:grid-cols-2   /* Tablet: 2 columns */
  lg:grid-cols-4   /* Desktop: 4 columns */
  gap-3 
  md:gap-4
">
```

---

# UI Patterns Reference

## ⚠️ These Are Patterns, Not Templates

Do NOT copy these verbatim. Adapt them to each app's unique needs.

---

## Responsive Layout Patterns

### Mobile-First Page Structure
```tsx
<div className="min-h-screen bg-background">
  {/* Header - sticky on mobile */}
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b p-4">
    <h1 className="text-xl font-bold">{appName}</h1>
  </header>

  {/* Main content - responsive padding */}
  <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Content here */}
  </main>

  {/* Mobile bottom navigation (if needed) */}
  <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t">
    {/* Tab icons */}
  </nav>
</div>
```

### Responsive Grid System
```tsx
// KPI cards - 1 on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

// Main + Sidebar - stacked on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>

// Full-width on mobile, constrained on desktop
<div className="w-full max-w-2xl mx-auto">
```

---

## State Patterns

### Loading State (With Motion!)
```tsx
function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

### Empty State (Make It Helpful!)
```tsx
function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon should match app's character */}
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-accent" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {/* Specific to this app's context */}
        No data yet
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        {/* Helpful guidance, not generic text */}
        Get started by adding your first item
      </p>
      
      <Button onClick={onAction}>
        Add First Item
      </Button>
    </div>
  );
}
```

### Error State (Actionable!)
```tsx
function ErrorState({ error, onRetry }: ErrorProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{error.message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## Touch-Friendly Patterns

### Mobile Touch Targets
```tsx
// Minimum 44x44px touch targets
<Button className="min-h-[44px] min-w-[44px]">

// Larger hit areas for important actions
<Button size="lg" className="w-full h-14 text-lg">
  Primary Action
</Button>

// Swipeable cards (consider for lists)
<div className="touch-pan-x overflow-x-auto snap-x">
  {items.map(item => (
    <div key={item.id} className="snap-start min-w-[280px]">
      <Card />
    </div>
  ))}
</div>
```

### Mobile-Optimized Forms
```tsx
<form className="space-y-4">
  {/* Full-width inputs on mobile */}
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input 
      id="name" 
      className="h-12 text-base" /* Larger for touch */
      autoComplete="name"
    />
  </div>

  {/* Stack buttons on mobile, inline on desktop */}
  <div className="flex flex-col sm:flex-row gap-2 pt-4">
    <Button type="submit" className="flex-1 h-12">Save</Button>
    <Button type="button" variant="outline" className="flex-1 h-12">Cancel</Button>
  </div>
</form>
```

---

## Dialog/Modal Patterns

### Mobile-First Dialog
```tsx
<Dialog>
  <DialogContent className="
    sm:max-w-md 
    /* Full screen on mobile */
    max-h-[100dvh] sm:max-h-[85vh]
    /* Bottom sheet on mobile */
    fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
    rounded-t-xl sm:rounded-lg
    /* Safe area for mobile */
    pb-safe
  ">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    
    <div className="overflow-y-auto flex-1">
      {/* Content */}
    </div>
    
    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button className="w-full sm:w-auto">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Data Visualization Patterns

### Responsive Charts
```tsx
<div className="h-[200px] sm:h-[300px] lg:h-[400px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis 
        dataKey="name" 
        tick={{ fontSize: 12 }}
        /* Hide some labels on mobile */
        interval={isMobile ? 2 : 0}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        /* Narrower on mobile */
        width={isMobile ? 40 : 60}
      />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="var(--accent)"
        strokeWidth={2}
        dot={!isMobile} /* Hide dots on mobile */
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

### KPI Display (Adapt to Context!)
```tsx
// This is a PATTERN - adapt the content and styling to your app
function KPIDisplay({ label, value, trend, icon: Icon }: KPIProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {value}
            </p>
            {trend && (
              <p className={cn(
                "text-xs sm:text-sm mt-1",
                trend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 sm:p-3 rounded-full bg-accent/10">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Animation Patterns

### Page Enter Animation
```css
/* Add to globals.css */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fade-in-up 0.5s ease-out forwards;
}

/* Stagger children */
.stagger-1 { animation-delay: 100ms; }
.stagger-2 { animation-delay: 200ms; }
.stagger-3 { animation-delay: 300ms; }
```

### Usage for Wow Effect
```tsx
<main className="space-y-6">
  <h1 className="animate-in">Dashboard</h1>
  
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {kpis.map((kpi, i) => (
      <KPICard 
        key={kpi.id}
        {...kpi}
        className="animate-in"
        style={{ animationDelay: `${(i + 1) * 100}ms` }}
      />
    ))}
  </div>
  
  <Card className="animate-in stagger-3">
    {/* Main chart */}
  </Card>
</main>
```

---

## Remember

1. **Analyze the app first** - What does THIS user need?
2. **Mobile first** - Start with mobile constraints
3. **One distinctive choice** - Pick one memorable design element
4. **Motion creates moments** - Focus on page load and key interactions
5. **Test both devices** - Ensure it works well on phone AND desktop
