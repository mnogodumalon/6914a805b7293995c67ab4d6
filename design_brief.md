# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
A comprehensive fitness and nutrition tracking application that helps users monitor their workouts, log exercises with sets/reps/weight, track daily nutrition intake (calories, protein, carbs, fat), record body measurements over time, and set personal fitness goals. It's designed for people who take their fitness seriously and want data-driven insights into their progress.

### Who Uses This
Fitness enthusiasts who regularly go to the gym, track their workouts, and care about nutrition. They want to see their progress at a glance, understand trends, and quickly log new data. These users check their app multiple times daily - before workouts, after meals, and when weighing themselves.

### The ONE Thing Users Care About Most
**Weekly training consistency** - "Am I hitting my workout goal this week?" This is the fundamental question every fitness user asks. Everything else (nutrition, body metrics) supports this core goal.

### Primary Actions (IMPORTANT!)
1. **Log Workout** → Primary Action Button - This is what users do most: record that they trained today
2. Quick-add meal (secondary)
3. Record body weight (tertiary)

---

## 2. What Makes This Design Distinctive

### Visual Identity
A warm, energetic fitness aesthetic built on a soft cream background with **terracotta orange** as the primary accent. This creates a grounded, earthy feel that's motivating without being aggressive - perfect for sustainable fitness habits. The warmth of terracotta evokes energy and movement, while the cream base keeps things calm and readable. Subtle coral tints in secondary elements add depth without competing with the primary accent.

### Layout Strategy
**Asymmetric hero-focused layout.** The weekly training progress dominates the top third of the viewport with a large circular progress ring - this immediately answers "How am I doing this week?" Everything else supports this hero:
- On mobile: vertical stack with clear visual hierarchy through size variation
- On desktop: 2/3 + 1/3 split with hero and chart on the left, activity feed on the right

The hero uses **4x the visual weight** of secondary elements through size, color saturation, and whitespace isolation. Secondary KPIs are displayed as compact inline items (not full cards) to avoid visual competition.

### Unique Element
**The training progress ring** - A thick 12px stroke circular progress indicator with rounded caps, filled with a gradient from terracotta to coral. The center displays the fraction "3/5" in large bold typography with "Trainings diese Woche" as muted subtext. A subtle drop shadow gives it depth, making it feel almost physical - like a medal you're earning.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit has a friendly, rounded character that feels approachable for fitness apps while maintaining excellent readability. Its geometric base gives it a modern, clean feel, and the weight range allows for strong typographic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 40% 97%)` | `--background` |
| Main text | `hsl(20 15% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(20 15% 15%)` | `--card-foreground` |
| Borders | `hsl(30 20% 90%)` | `--border` |
| Primary action (terracotta) | `hsl(16 70% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight (coral) | `hsl(12 80% 62%)` | `--accent` |
| Muted background | `hsl(35 25% 93%)` | `--muted` |
| Muted text | `hsl(20 10% 45%)` | `--muted-foreground` |
| Success/positive (green) | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The terracotta-coral palette creates warmth and energy - feelings that motivate fitness activity. The cream background (not pure white) reduces eye strain for an app that users check frequently throughout the day. The earthy tones feel grounded and sustainable, avoiding the aggressive "gym bro" aesthetic of neon colors.

### Background Treatment
Subtle warm off-white (`hsl(35 40% 97%)`) - not pure white. This slight cream tint creates warmth and reduces harsh contrast with the terracotta accents. No gradients or textures on the main background to keep focus on content.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Hero-dominant single column. The progress ring takes ~35% of the first viewport, creating immediate visual impact. Below that, compact inline stats prevent the "grid of identical cards" look. Size variation is dramatic: hero text is 48px, secondary KPIs are 20px.

### What Users See (Top to Bottom)

**Header:**
- Title "Fitness Tracker" left-aligned, semi-bold 600 weight
- Primary action button "Workout starten" on the right as a filled terracotta button with plus icon
- Height: 56px with comfortable padding

**Hero Section (The FIRST thing users see):**
- Large circular progress ring (180px diameter) centered
- 12px stroke width, terracotta gradient fill, rounded caps
- Inside center: Large "3/5" (48px bold) with "Trainings diese Woche" below (14px muted)
- Below ring: "Ziel: 5x pro Woche" in small muted text
- Generous whitespace: 24px padding above and below
- Why this is the hero: Training consistency is THE metric fitness users obsess over. Every workout logged brings satisfaction.

**Section 2: Today's Snapshot**
- Horizontal scroll row of 3 compact stat items (not cards!)
- Each stat: icon + number + label, inline layout
- Stats shown: Kalorien heute (from Ernährung), Protein heute (g), Letztes Gewicht (kg from Körperdaten)
- Background: subtle muted pill shapes, not full card borders
- This creates contrast with the hero through compactness

**Section 3: Letzte Aktivitäten**
- Section title "Letzte Aktivitäten" with small "Alle" link
- List of last 5 combined activities (workouts + meals) sorted by date
- Each item: Date badge, activity type icon, brief description
- Compact vertical list, not cards - just subtle bottom borders
- Shows what was done recently to maintain accountability

**Section 4: Gewichtsverlauf (mini chart)**
- Small area chart (150px height) showing last 14 days of weight
- Minimal axis labels, terracotta fill with gradient fade
- "Gewichtsverlauf" title above
- Tapping opens detail view (stretch goal - basic display first)

**Bottom Navigation / Action:**
- Floating action button (FAB) bottom-right: "+" icon in terracotta
- 56px diameter, subtle shadow
- Opens quick-add menu (workout, meal, weight)

### What is HIDDEN on Mobile
- Detailed workout logs breakdown (accessible via tap)
- Body measurement details beyond weight
- Historical charts beyond 14 days
- Nutrition macro breakdown chart

### Touch Targets
- All interactive elements minimum 44px touch target
- FAB: 56px diameter
- List items: full width tap area, minimum 48px height

### Interactive Elements (if applicable)
- Activity list items tap to show detail modal
- Progress ring tap to see weekly workout list
- Weight chart tap to see full history

---

## 5. Desktop Layout

### Overall Structure
**2-column asymmetric layout: 65% left (main content) + 35% right (activity feed)**

Left column contains the hero and data visualizations. Right column is a continuous activity stream. This creates clear visual hierarchy while using horizontal space meaningfully.

Eye flow: Hero (top-left) → Stats row → Charts → Activity feed (right column)

### Section Layout

**Top area (full width across both columns):**
- Header bar with "Fitness & Ernährungs-Tracker" title and "Workout starten" button
- Subtle bottom border, height 64px

**Left column (65%):**

*Hero row:*
- Progress ring (220px diameter) on the left
- Next to it: stacked secondary KPIs as compact text blocks (not cards)
- KPIs: "Trainings: 3/5 diese Woche", "Ø Dauer: 52 min", "Stimmung: Meist gut"

*Charts section (below hero):*
- Two side-by-side cards at 50% each
- Left card: "Gewichtsverlauf" line chart (last 30 days)
- Right card: "Kalorien diese Woche" bar chart (7 days)

*Macro breakdown (below charts):*
- Single wide card showing today's nutrition: calories, protein, carbs, fat as horizontal progress bars against goals

**Right column (35%):**
- Sticky header "Letzte Aktivitäten"
- Scrollable activity feed showing last 10 activities
- Each activity: timestamp, type badge, description
- "Mehr laden" button at bottom

### What Appears on Hover
- Activity items: subtle background highlight, cursor pointer
- Chart data points: tooltip with exact value
- KPI values: subtle underline indicating clickable

### Clickable/Interactive Areas (if applicable)
- Progress ring → opens weekly workouts detail
- Activity items → opens full record detail in modal
- Chart segments → shows detailed view for that time period

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Trainings diese Woche
- **Data source:** Workouts app (filtered for current week, excluding rest_day=true)
- **Calculation:** Count of workouts this week / goal from Ziele (trainingstage_pro_woche)
- **Display:** Circular progress ring with fraction in center. Ring fills proportionally (3/5 = 60% filled). Large 48px bold number, 14px muted subtitle.
- **Context shown:** Goal progress (e.g., "3 von 5 Trainings"), small text showing streak or consistency
- **Why this is the hero:** Weekly training consistency is the #1 metric fitness users track. It answers "Am I on track?" instantly.

### Secondary KPIs

**Kalorien heute**
- Source: Ernährung (filtered for today's date)
- Calculation: Sum of kalorien field for today
- Format: number with "kcal" suffix
- Display: Compact inline stat with flame icon

**Protein heute**
- Source: Ernährung (filtered for today's date)
- Calculation: Sum of protein field for today
- Format: number with "g" suffix
- Display: Compact inline stat with protein icon

**Aktuelles Gewicht**
- Source: Körperdaten (latest entry by datum)
- Calculation: Latest gewicht_kg value
- Format: number with "kg" suffix, one decimal
- Display: Compact inline stat with scale icon

**Durchschnittliche Dauer**
- Source: Workouts (this week, excluding rest days)
- Calculation: Average of dauer_minuten
- Format: number with "min" suffix
- Display: Text only, shown near hero on desktop

### Chart (if applicable)

**Gewichtsverlauf**
- **Type:** Area chart - shows trend smoothly, the filled area emphasizes direction of change
- **Title:** Gewichtsverlauf
- **What question it answers:** "Is my weight trending in the right direction?"
- **Data source:** Körperdaten app
- **X-axis:** datum field, formatted as "DD.MM", last 14 days on mobile, 30 days on desktop
- **Y-axis:** gewicht_kg, auto-scaled with 2kg padding
- **Mobile simplification:** 14 days only, smaller height (150px), minimal labels

**Kalorien diese Woche (Desktop only)**
- **Type:** Bar chart - good for comparing discrete daily values
- **Title:** Kalorien diese Woche
- **What question it answers:** "How consistent is my eating this week?"
- **Data source:** Ernährung app, grouped by datum
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Sum of kalorien per day
- **Mobile simplification:** Not shown on mobile

### Lists/Tables (if applicable)

**Letzte Aktivitäten**
- Purpose: Shows recent activity to maintain accountability and quick reference
- Source: Combined from Workouts (typ, datum, dauer_minuten) + Ernährung (mahlzeit_typ, datum, kalorien)
- Fields shown: Date (relative, e.g., "Heute", "Gestern"), Activity type badge, Brief description
- Mobile style: Simple list with subtle dividers
- Desktop style: Card-based list in right column
- Sort: By datum descending (newest first)
- Limit: 5 on mobile, 10 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** Workout starten
- **Action:** add_record
- **Target app:** Workouts
- **What data:** Dialog with fields:
  - datum (date picker, default today)
  - typ (select from lookup: Push, Pull, Beine, etc.)
  - dauer_minuten (number input)
  - stimmung (select: Schlecht, Okay, Gut, Brutal)
  - rest_day (checkbox for rest days)
- **Mobile position:** Header (compact button) + FAB bottom-right for quick access
- **Desktop position:** Header right side
- **Why this action:** Logging workouts is THE most frequent action. Users want to record immediately after training while details are fresh.

---

## 7. Visual Details

### Border Radius
Rounded (8px) - friendly but not childish. Cards use 12px for slight emphasis.

### Shadows
Subtle - cards have `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover, elevate to `shadow-md`. The FAB has more pronounced shadow for depth.

### Spacing
Normal to spacious - 16px base unit. Cards have 20px padding. Sections separated by 32px. The hero has extra breathing room (40px vertical padding).

### Animations
- **Page load:** Stagger fade-in, hero first then secondary elements 100ms apart
- **Hover effects:** Cards lift slightly (translateY -2px), subtle shadow increase, 150ms transition
- **Tap feedback:** Scale down to 0.98 on active, immediate return
- **Progress ring:** Animate fill from 0 to current value over 800ms on load with ease-out

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(35 40% 97%);
  --foreground: hsl(20 15% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(20 15% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(20 15% 15%);
  --primary: hsl(16 70% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 25% 93%);
  --secondary-foreground: hsl(20 15% 15%);
  --muted: hsl(35 25% 93%);
  --muted-foreground: hsl(20 10% 45%);
  --accent: hsl(12 80% 62%);
  --accent-foreground: hsl(20 15% 15%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(30 20% 90%);
  --input: hsl(30 20% 90%);
  --ring: hsl(16 70% 50%);
  --radius: 0.5rem;
  --chart-1: hsl(16 70% 50%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(12 80% 62%);
  --chart-4: hsl(35 60% 60%);
  --chart-5: hsl(20 15% 30%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Outfit, NOT Inter/Roboto)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described (large progress ring)
- [ ] Colors create the mood described in Section 2 (warm terracotta)
- [ ] Primary action "Workout starten" works with dialog
- [ ] Activity list combines workouts and meals
- [ ] Charts display correctly (Gewichtsverlauf, Kalorien)
- [ ] All states handled: loading, empty, error
