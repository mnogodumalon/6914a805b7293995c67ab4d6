# Design Brief: Fitness & Ernahrungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking system for people who train regularly and want to monitor their progress across workouts, nutrition, and body measurements. It spans 6 interconnected data apps: Exercises (Ubungen), Workouts, Workout Logs, Goals (Ziele), Nutrition (Ernahrung), and Body Data (Korperdaten). Users log workouts with detailed set/rep/weight data, track daily meals with macros, and record body measurements over time -- all tied to personal goals.

### Who Uses This
A fitness-enthusiastic person who goes to the gym regularly, tracks their meals, and cares about measurable progress. They open this dashboard daily -- before the gym to check what they did last time, after meals to log food, and weekly to see body composition trends. They are NOT a developer; they want a quick glance at "Am I on track?" and fast data entry.

### The ONE Thing Users Care About Most
**"Am I hitting my weekly training goal?"** -- The number of workouts completed this week compared to their goal is the single most important metric. Everything else supports this: Are they eating right? Is their body changing? But the training consistency is the anchor.

### Primary Actions (IMPORTANT!)
1. **Workout loggen** --> Primary Action Button (most frequent daily action)
2. Mahlzeit hinzufugen (log a meal)
3. Gewicht erfassen (record body weight)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The dashboard uses a warm, athletic aesthetic with a subtle terracotta/copper accent against a soft cream canvas. It avoids the cold, clinical look of most fitness apps. Instead, it feels grounded and motivating -- like a premium training journal, not a hospital chart. The warmth of the color palette mirrors the heat of a workout, creating an emotional connection to the content.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (2/3 width) holding the hero element and main chart, and a narrower right column (1/3 width) with quick stats, recent activity, and body data. This creates a natural F-pattern reading flow.

On mobile, the hero KPI dominates the first viewport fold as a large, breathing element with generous whitespace. Secondary stats are compact horizontal pills below it, not full cards. The chart is simplified to a sparkline. This makes the phone experience feel native, not squeezed.

**Visual interest comes from:**
- A large, bold hero number (56px) with a circular progress indicator around it
- Extreme typography weight contrast (300 for labels, 700 for values)
- Inline badge-style stats instead of uniform cards for secondary KPIs
- A subtle warm gradient on the page background (cream to slightly warmer cream)

### Unique Element
The hero section features a **thick semicircular progress arc** (SVG) showing weekly workout progress. The arc uses an 8px stroke with rounded caps, filled with the primary terracotta color against a muted track. When the goal is met, the arc completes with a subtle pulse animation. This turns the weekly goal into something almost game-like and viscerally satisfying.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **Weights:** 300, 400, 500, 600, 700
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit is geometric and modern with a friendly softness that suits fitness apps. Its wide range of weights enables strong hierarchy (300 for subtle labels, 700 for hero numbers). It has enough personality to feel designed without being distracting.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 30% 97%)` | `--background` |
| Main text | `hsl(20 10% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(20 10% 15%)` | `--card-foreground` |
| Borders | `hsl(30 15% 90%)` | `--border` |
| Primary action (terracotta) | `hsl(16 65% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(35 40% 93%)` | `--accent` |
| Muted background | `hsl(35 20% 95%)` | `--muted` |
| Muted text | `hsl(20 5% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(152 45% 42%)` | (component use) |
| Error/negative | `hsl(0 65% 52%)` | `--destructive` |

### Why These Colors
The warm cream background (`hsl(35 30% 97%)`) avoids sterile white and creates a welcoming canvas. The terracotta primary (`hsl(16 65% 50%)`) is energetic without being aggressive -- it recalls the warmth of physical effort and earthy vitality. The muted tones keep everything calm and readable, while the terracotta pops on buttons and progress indicators to draw the eye to actions and achievements.

### Background Treatment
The page background is a flat warm cream (`hsl(35 30% 97%)`). Cards sit on pure white to create subtle depth without needing shadows. The contrast between cream canvas and white cards provides natural visual separation.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport, taking roughly 55% of visible screen height. It's a single, bold number inside a semicircular progress arc -- nothing competes with it. Below, secondary stats are rendered as compact inline pills in a horizontal scrollable row, NOT as full cards. This keeps the phone feeling spacious, not cramped.

### What Users See (Top to Bottom)

**Header:**
A simple top bar with "Fitness Tracker" in Outfit 500 weight, 18px, left-aligned. On the right, a small avatar circle or date display showing today's date in "Do, 6. Feb" format. No hamburger menu, no complex nav.

**Hero Section (The FIRST thing users see):**
- A large semicircular progress arc (SVG, 200px wide) centered horizontally
- Inside the arc: the number of workouts this week in 56px Outfit 700 weight, terracotta color
- Below the number: "von X Trainings" in 14px Outfit 300 weight, muted text
- Below the arc: "Diese Woche" label in 12px Outfit 400 uppercase tracking-wide, muted
- The arc track is `hsl(35 20% 92%)`, the filled portion is the primary terracotta
- Generous padding: 32px top, 24px bottom
- Why hero: This answers "Am I on track this week?" in under 1 second

**Section 2: Quick Stats Row**
- Horizontal scrollable row of 3 compact stat pills (not cards):
  - "Heute: X kcal" (today's total calories from Ernahrung)
  - "Protein: Xg" (today's total protein from Ernahrung)
  - "Gewicht: X.X kg" (latest from Korperdaten)
- Each pill: rounded-full background of `--muted`, 14px text, icon on left (Flame, Beef, Scale icons from lucide), value in 600 weight
- Horizontal scroll with snap, gap-3

**Section 3: Weekly Training Chart**
- Title: "Trainingsvolumen" in 16px Outfit 600
- A simple bar chart (recharts BarChart) showing the last 7 days
- X-axis: abbreviated day names (Mo, Di, Mi, Do, Fr, Sa, So)
- Y-axis: total volume (sets x reps x weight) per day, calculated from WorkoutLogs
- Days without workouts show as empty (no bar)
- Bars use primary terracotta color, rounded top corners
- Height: 180px
- Simplified: no grid lines, minimal axis labels

**Section 4: Heutige Ernahrung (Today's Nutrition)**
- Title: "Heutige Ernahrung" in 16px Outfit 600
- A stacked horizontal progress bar showing macros (protein/carbs/fat) as proportions
- Below: list of today's meals as simple rows:
  - Left: meal type badge (Fruhstuck, Mittagessen, etc.) in small text
  - Right: calories in 500 weight
  - Each row has a subtle bottom border
- Max 5 items shown, "Alle anzeigen" link if more

**Section 5: Letzte Workouts (Recent Workouts)**
- Title: "Letzte Workouts" in 16px Outfit 600
- List of 3 most recent workouts as compact cards:
  - Top: workout type badge + date
  - Bottom: duration + mood emoji
  - Tap to see workout details (logs for that workout)
- Muted background cards, rounded-lg

**Section 6: Korpergewicht Trend**
- Title: "Gewichtsverlauf" in 16px Outfit 600
- Sparkline (recharts AreaChart, 120px height) showing last 30 days of weight
- Below: latest weight in large text, change from first measurement as +/- badge

**Bottom Navigation / Action:**
- Fixed bottom button bar: Primary "Workout loggen" button, full width with 16px horizontal margin, terracotta background, white text, 48px height, rounded-xl
- Below the button: two smaller text links side by side: "Mahlzeit +" and "Gewicht +"

### Mobile-Specific Adaptations
- Hero arc is 200px wide (centered), not the full 300px from desktop
- Chart simplified: no Y-axis labels on mobile, just bars
- Nutrition list truncated to 5 items max
- Recent workouts limited to 3

### Touch Targets
- All interactive elements minimum 44px touch target
- Bottom action button 48px height
- Stat pills 40px height
- List items 48px minimum height

### Interactive Elements
- Tapping a recent workout opens a sheet/dialog showing that workout's exercise logs (sets, reps, weight per exercise)
- "Alle anzeigen" on nutrition opens full list of today's meals

---

## 5. Desktop Layout

### Overall Structure
A 2-column asymmetric layout within a max-width container (1200px, centered):
- **Left column (65%):** Hero section + Chart + Nutrition
- **Right column (35%):** Quick stats stacked vertically + Recent Workouts + Body Weight trend

The eye goes: Hero (top-left, largest) -> Quick stats (top-right) -> Chart (below hero) -> Recent workouts (right column mid) -> Nutrition details (left column bottom).

### Section Layout

**Top Area (spans full width):**
- Header bar: "Fitness & Ernahrungs-Tracker" in Outfit 600 24px on the left
- Right side: Today's date formatted as "Donnerstag, 6. Februar 2026"
- Primary action button "Workout loggen" in the header, terracotta, next to date
- Two secondary buttons: "Mahlzeit +" and "Gewicht +" as outline variants

**Left Column (65%):**
- **Hero KPI:** Weekly workout progress with the semicircular arc, 300px wide
  - Number at 64px Outfit 700 weight
  - Subtitle and week label below
  - Card with extra padding (40px) and no visible border -- just white on cream
- **Training Volume Chart:** Full bar chart with Y-axis labels visible, 280px height
  - Shows last 7 days with day abbreviations
  - Tooltip on hover showing exact volume per day
- **Today's Nutrition:** Full meal list (no truncation), with macro progress bar
  - Horizontal stacked bar for calories/protein/carbs/fett targets vs actual
  - Table-style meal list with columns: Time, Type, Description, Kcal, Protein

**Right Column (35%):**
- **Quick Stats Stack:** 3 stat cards stacked vertically
  - Today's Calories (with circular progress vs goal if goal exists)
  - Today's Protein (with progress bar vs goal)
  - Current Weight (latest, with trend arrow)
- **Recent Workouts:** Last 5 workouts as compact list items
  - Hover: shadow lifts, cursor pointer
  - Click: opens dialog with full workout log details
- **Body Weight Trend:** Area chart, 200px height, last 30 days
  - Shows weight line with gradient fill below
  - Latest value highlighted as dot

### What Appears on Hover
- Chart bars: tooltip with exact volume and exercise breakdown
- Recent workout items: subtle shadow elevation + background change
- Stat cards: slight scale(1.02) transform
- Meal rows: background highlight

### Clickable/Interactive Areas
- Recent workout items: click opens dialog showing full workout log (exercise name, sets, reps, weight)
- "Workout loggen" button: opens dialog with workout creation form
- "Mahlzeit +" button: opens dialog with meal creation form
- "Gewicht +" button: opens dialog with quick weight entry form

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** "Trainings diese Woche"
- **Data source:** Workouts app -- count workouts where `datum` falls in the current week (Monday to Sunday) and `rest_day` is not true
- **Calculation:** Count of non-rest-day workouts this week. Goal comes from Ziele app (active goal's `trainingstage_pro_woche`). If no active goal, default to 4.
- **Display:** Large number (56px mobile / 64px desktop, Outfit 700, terracotta color) centered inside a semicircular SVG progress arc. The arc shows progress toward the weekly goal (e.g., 3/5 = 60% filled). Track color is muted, fill is primary terracotta.
- **Context shown:** "von X Trainings" below the number shows the goal. The arc visually communicates progress without needing to read text.
- **Why this is the hero:** Training consistency is the #1 driver of fitness results. Users need instant visual feedback on whether they're keeping up this week.

### Secondary KPIs

**Today's Calories**
- Source: Ernahrung -- sum `kalorien` where `datum` = today
- Calculation: Sum of all meal calories today
- Format: number with "kcal" suffix
- Display: Card on desktop, pill on mobile. Shows circular progress ring if calorie goal exists (from Ziele `taeglich_kalorien`).

**Today's Protein**
- Source: Ernahrung -- sum `protein` where `datum` = today
- Calculation: Sum of all meal protein today
- Format: number with "g" suffix
- Display: Card on desktop, pill on mobile. Shows progress bar if protein goal exists (from Ziele `taeglich_protein`).

**Current Weight**
- Source: Korperdaten -- latest entry by `datum`
- Calculation: Most recent `gewicht_kg` value
- Format: number with 1 decimal, "kg" suffix
- Display: Card on desktop, pill on mobile. Shows trend arrow (up/down) comparing to previous entry.

### Chart: Weekly Training Volume

- **Type:** BarChart -- bars are the most intuitive way to show "how much did I do each day" since each day is a discrete unit
- **Title:** "Trainingsvolumen"
- **What question it answers:** "How intense were my workouts this week?" -- helps users see training distribution across the week
- **Data source:** WorkoutLogs joined with Workouts (to get the workout date)
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So), current week Mon-Sun
- **Y-axis:** Total volume per day = sum of (gewicht * wiederholungen) for all logs of workouts on that day. Label: "Volumen (kg)"
- **Bar color:** Primary terracotta with rounded top corners (radius 4px)
- **Mobile simplification:** Hide Y-axis labels, reduce height to 180px, thinner bars

### Chart: Body Weight Trend

- **Type:** AreaChart -- the area fill creates a sense of continuity and makes the trend visually prominent
- **Title:** "Gewichtsverlauf"
- **What question it answers:** "Is my weight going in the right direction over time?"
- **Data source:** Korperdaten, sorted by `datum`
- **X-axis:** Date, last 30 days, formatted as "DD.MM"
- **Y-axis:** Weight in kg
- **Line color:** Primary terracotta, area fill with 20% opacity gradient
- **Mobile simplification:** Sparkline style -- no axes, just the line and area, 120px height

### Lists/Tables

**Today's Meals (Heutige Ernahrung)**
- Purpose: Users need to see what they've eaten today and track macro distribution
- Source: Ernahrung where `datum` = today
- Fields shown: mahlzeit_typ (as badge), beschreibung, kalorien, protein
- Mobile style: Simple list with badge + calories per row
- Desktop style: Table with columns: Typ, Beschreibung, Kalorien, Protein, Carbs, Fett
- Sort: By createdat ascending (chronological)
- Limit: Mobile 5 (with "Alle anzeigen"), Desktop unlimited

**Recent Workouts (Letzte Workouts)**
- Purpose: Quick reference to what was trained recently, enables drill-down to see exact sets/reps
- Source: Workouts sorted by `datum` descending, excluding rest days
- Fields shown: datum (formatted), typ (as badge), dauer_minuten, stimmung (as emoji)
- Mobile style: Compact cards with badge + date + duration
- Desktop style: List items with hover effect
- Sort: By datum descending
- Limit: Mobile 3, Desktop 5
- Drill-down: Click opens dialog showing WorkoutLogs for that workout, joined with Ubungen to show exercise names

### Primary Action Button (REQUIRED!)

- **Label:** "Workout loggen"
- **Action:** add_record
- **Target app:** Workouts (and optionally WorkoutLogs for exercises)
- **What data:** The form contains:
  - Datum (date input, defaults to today)
  - Trainingstyp (select: Push, Pull, Beine, Ganzkorper, Oberkorper, Unterkorper, Cardio, Sonstiges)
  - Dauer in Minuten (number input)
  - Stimmung (select: Schlecht, Okay, Gut, Brutal)
  - Ruhetag toggle (checkbox -- if checked, just logs a rest day)
- **Mobile position:** bottom_fixed (full-width button pinned to bottom of screen)
- **Desktop position:** header (in the top bar, next to the date)
- **Why this action:** Logging workouts is the single most frequent action. Users do this every day after training. Making it one tap away removes friction and increases consistency.

### Secondary Actions

**Mahlzeit hinzufugen**
- Target: Ernahrung
- Form fields: Datum (default today), Mahlzeitentyp (select), Beschreibung (text), Kalorien (number), Protein (number), Carbs (number), Fett (number)
- Position: Bottom bar secondary link on mobile, outline button in header on desktop

**Gewicht erfassen**
- Target: Korperdaten
- Form fields: Datum (default today), Gewicht kg (number), KFA geschatzt % (number, optional), Notizen (textarea, optional)
- Position: Bottom bar secondary link on mobile, outline button in header on desktop

---

## 7. Visual Details

### Border Radius
Rounded (8px) -- `--radius: 0.5rem`. Cards use rounded-xl (12px) for a softer, more modern feel. Buttons use rounded-xl. Pills use rounded-full. The mix of radii creates subtle visual variety.

### Shadows
Subtle -- Cards have `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover, cards lift to `shadow-md`. No heavy drop shadows anywhere. The cream-to-white card contrast already provides visual separation, so shadows are minimal accents.

### Spacing
Spacious -- 24px gap between major sections, 16px gap within sections, 32px page padding on desktop, 16px on mobile. The hero section gets extra breathing room: 40px padding top and bottom. This spaciousness is intentional -- it communicates quality and lets the content breathe.

### Animations
- **Page load:** Stagger fade-in. Hero appears first (opacity 0 to 1, 300ms), then secondary stats (400ms delay), then charts (600ms delay). Subtle translateY(8px) to translateY(0) accompaniment.
- **Hover effects:** Cards: translateY(-2px) + shadow-md transition 200ms. Buttons: slight brightness increase. List items: background-color fade to muted.
- **Tap feedback:** Active state scales to 0.98 for 100ms on buttons and tappable elements.
- **Progress arc:** On load, the arc animates from 0% to current progress over 800ms with ease-out timing.

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(35 30% 97%);
  --foreground: hsl(20 10% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(20 10% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(20 10% 15%);
  --primary: hsl(16 65% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 20% 95%);
  --secondary-foreground: hsl(20 10% 25%);
  --muted: hsl(35 20% 95%);
  --muted-foreground: hsl(20 5% 45%);
  --accent: hsl(35 40% 93%);
  --accent-foreground: hsl(20 10% 20%);
  --destructive: hsl(0 65% 52%);
  --border: hsl(30 15% 90%);
  --input: hsl(30 15% 90%);
  --ring: hsl(16 65% 50%);
  --chart-1: hsl(16 65% 50%);
  --chart-2: hsl(152 45% 42%);
  --chart-3: hsl(35 60% 55%);
  --chart-4: hsl(200 50% 50%);
  --chart-5: hsl(280 40% 55%);
  --sidebar: hsl(35 25% 96%);
  --sidebar-foreground: hsl(20 10% 15%);
  --sidebar-primary: hsl(16 65% 50%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(35 40% 93%);
  --sidebar-accent-foreground: hsl(20 10% 20%);
  --sidebar-border: hsl(30 15% 90%);
  --sidebar-ring: hsl(16 65% 50%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Outfit, weights 300-700)
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4 -- hero arc, stat pills, simplified charts
- [ ] Desktop layout matches Section 5 -- 65/35 column split, header actions
- [ ] Hero element is prominent as described -- semicircular arc with large number
- [ ] Colors create the mood described in Section 2 -- warm, grounded, athletic
- [ ] Primary action "Workout loggen" works with full form dialog
- [ ] Secondary actions "Mahlzeit +" and "Gewicht +" work with form dialogs
- [ ] All 6 data apps are represented in the dashboard
- [ ] All states handled: loading (skeleton), empty (helpful message), error (retry)
- [ ] Stagger animations on page load
- [ ] Progress arc animates on load
