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

---

# PART 1: Design Philosophy

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

# PART 2: CSS & Design System

## ⚠️ CSS Variable Format - CRITICAL!

**ALWAYS use full `hsl()` syntax in design_spec.json!**

```css
/* ✅ CORRECT - Full hsl() wrapper */
--background: hsl(220, 18%, 8%);
--primary: hsl(31, 97%, 58%);

/* ❌ WRONG - Space-separated values (old Tailwind format) */
--background: 220 18% 8%;
--primary: 31 97% 58%;

/* ❌ WRONG - OKLCH format (not compatible) */
--background: oklch(0.145 0 0);
```

The implementation agent MUST update `src/index.css` directly with HSL values.

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
--background: hsl(220, 20%, 10%);
--foreground: hsl(220, 10%, 90%);
--accent: hsl(150, 80%, 50%);
```

**2. Warm & Grounded**
```css
--background: hsl(30, 20%, 8%);
--foreground: hsl(30, 10%, 90%);
--accent: hsl(25, 90%, 55%);
```

**3. Cool & Professional**
```css
--background: hsl(210, 30%, 8%);
--foreground: hsl(210, 20%, 95%);
--accent: hsl(190, 80%, 50%);
```

---

## Typography Size Scale

| Purpose | Size | Weight | Example |
|---------|------|--------|---------|
| Hero KPI | 48-72px | 700-900 | Main number users care about |
| Section Title | 24-32px | 600-700 | Clear hierarchy |
| Card Title | 18-20px | 500-600 | Scannable |
| Body | 14-16px | 400 | Readable content |
| Labels/Meta | 11-13px | 400-500 | Supporting info |

---

## Responsive Breakpoints

```
xs: < 640px    → Single column, stacked layout
sm: 640px      → Two columns possible
md: 768px      → Tablet layout
lg: 1024px     → Desktop layout
xl: 1280px     → Wide desktop
```

---

# PART 3: UI Patterns

## Responsive Layout Patterns

### Mobile-First Page Structure
```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b p-4">
    <h1 className="text-xl font-bold">{appName}</h1>
  </header>
  <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Content here */}
  </main>
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
```

---

## Animation Patterns

### Staggered Page Load (Wow Moment!)
```tsx
{items.map((item, i) => (
  <Card 
    key={item.id}
    className="animate-fade-in"
    style={{ animationDelay: `${i * 100}ms` }}
  />
))}
```

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}
```

---

# PART 4: Your Output

## design_spec.json Structure

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
      "target_app": "app identifier from app_metadata.json",
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
- [ ] **All colors use full `hsl(...)` syntax** (not space-separated, not OKLCH)
- [ ] Are the KPIs actually meaningful for this app's users?
- [ ] Does the chart type make sense for this data?
- [ ] **Primary action target_app matches an app identifier from app_metadata.json**
- [ ] Is the primary action obvious and accessible?
- [ ] Will it create a "wow" moment for the user?
- [ ] Is it mobile-first AND excellent on desktop?
