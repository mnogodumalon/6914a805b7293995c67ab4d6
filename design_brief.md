# Design Brief: Fitness & Ernahrungs-Tracker

## 1. App Analysis

### What This App Does
A comprehensive fitness and nutrition tracker that helps users log workouts, track meals, monitor body measurements, and work towards health goals. It connects six data sources: Exercises (Ubungen), Workouts, Workout Logs (individual sets), Goals (Ziele), Nutrition (Ernahrung), and Body Data (Korperdaten).

### Who Uses This
A fitness-conscious individual who trains regularly using a push/pull/legs or full-body split. They track their workouts, nutrition, and body composition to ensure progressive overload and calorie/protein targets. They want a quick overview of today's progress and recent trends without digging through spreadsheets.

### The ONE Thing Users Care About Most
"Am I on track today?" - Users want to instantly see whether they've hit their calorie and protein targets for the day, whether they've worked out, and how their body weight is trending. The daily nutrition progress versus their goal is the most actionable, time-sensitive metric.

### Primary Actions (IMPORTANT!)
1. **Log a meal** -> Primary Action Button (most frequent daily action, done 3-6x per day)
2. Start a workout / log a workout session
3. Record body measurements
4. Log a workout set (within a workout context)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The dashboard uses a warm, earthy color palette with a soft sand-toned background and a deep terracotta accent that evokes physical vitality and grounded discipline. Rather than the typical cold blue fitness app, this feels warm and motivating - like a well-worn training journal. The generous whitespace and bold typography hierarchy create a sense of calm focus, not information overload.

### Layout Strategy
The layout uses an asymmetric hero approach. On mobile, the hero is a large circular progress ring showing today's calorie progress vs. goal - it dominates the first viewport fold. On desktop, the left two-thirds contain the hero progress section and nutrition/workout charts, while the right third shows a compact activity feed of recent entries. Size variation is strong: the hero progress ring is visually 3x larger than secondary KPI cards. Secondary KPIs use compact inline badges rather than full cards, creating clear hierarchy without visual clutter.

### Unique Element
The hero section features a thick (10px stroke) circular progress ring for daily calories with the current count displayed as an oversized number in the center, and a smaller concentric ring for protein. The ring uses a gradient from the primary terracotta to a warm gold as it fills, creating an almost game-like "fill the ring" motivation similar to Apple Watch activity rings. When the goal is met, a subtle pulse animation celebrates the achievement.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit is a geometric sans-serif with soft, rounded terminals that feel approachable and athletic without being generic. It has excellent weight range for creating bold hierarchy (300 light for labels, 700 bold for hero numbers).

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 30% 96%)` | `--background` |
| Main text | `hsl(20 10% 15%)` | `--foreground` |
| Card background | `hsl(36 33% 99%)` | `--card` |
| Card text | `hsl(20 10% 15%)` | `--card-foreground` |
| Borders | `hsl(30 15% 88%)` | `--border` |
| Primary action (terracotta) | `hsl(14 70% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight (warm gold) | `hsl(40 60% 50%)` | `--accent` |
| Muted background | `hsl(35 20% 93%)` | `--muted` |
| Muted text | `hsl(20 5% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(150 50% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The warm sand background (hsl 35 30% 96%) creates an organic, earthy base that feels different from standard white fitness apps. Terracotta primary (hsl 14 70% 50%) conveys physical energy and warmth. The warm gold accent (hsl 40 60% 50%) works as a complementary highlight for goals and achievements. Together they create a palette that feels grounded, motivating, and distinctly non-corporate.

### Background Treatment
The page background is a warm off-white sand tone (hsl 35 30% 96%). Cards sit on a near-white surface (hsl 36 33% 99%) providing subtle elevation through contrast alone, reinforced by very soft shadows. No gradients on the background - the warmth comes from the undertone.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero (daily calorie/protein progress ring) dominates the entire first viewport. Below it, secondary KPIs are arranged as compact horizontal badges in a single scrollable row. Charts and lists stack vertically below. Visual hierarchy is extreme: the progress ring is huge (240px), numbers are 48px bold, while secondary metrics are 14px.

### What Users See (Top to Bottom)

**Header:**
Compact header with "Fitness Tracker" title (left, 20px semibold) and a "+" FAB-style primary action button (right, terracotta circle, 44px). No navigation bar - this is a single-page dashboard.

**Hero Section (The FIRST thing users see):**
Takes ~55% of the first viewport. A large circular SVG progress ring (240px diameter, 10px stroke) centered horizontally. Outer ring = calories progress (terracotta gradient fill). Inner smaller ring (160px, 6px stroke) = protein progress (warm gold fill). Center shows:
- Today's calorie count in 48px font-weight-700
- "/ {goal} kcal" in 16px font-weight-300 muted text
- Below the ring: protein count "XXg / XXg Protein" in 16px font-weight-500

Why this is the hero: Users check calorie progress multiple times per day. Making it the dominant visual means they can glance and know instantly where they stand.

**Section 2: Quick Stats Row**
A horizontal scrollable row of 4 compact stat badges (not cards):
1. Workouts this week: count / goal (e.g., "4 / 5")
2. Avg workout duration this week
3. Current weight (latest Korperdaten entry)
4. Weight trend (delta from previous entry, with up/down arrow)

Each badge: muted background pill, 14px text, icon left. Horizontal scroll on mobile if needed.

**Section 3: Weekly Training Chart**
Bar chart (recharts) showing workouts per day for the current week (Mon-Sun). Bars colored by workout type (terracotta for strength, gold for cardio). Height ~200px. Title "Diese Woche" in 16px semibold.

**Section 4: Recent Meals Today**
List of today's meals, each as a compact row:
- Meal type badge (Fruhstuck, Mittagessen, etc.) left
- Description text center
- Calories + protein right-aligned
- Tap to expand/edit

Title "Heute gegessen" with a small "+" button to add meal.

**Section 5: Body Progress**
A mini line chart (recharts) showing weight trend over last 30 days. Height ~160px. Below it, latest body measurements as a compact grid (2 columns): Brust, Taille, Hufte, Arm, Bein. Title "Korperfortschritt".

**Section 6: Goals Overview**
Active goals displayed as compact progress cards. Each shows goal name, current vs target, progress bar. Title "Aktive Ziele".

**Bottom Navigation / Action:**
Fixed bottom: Primary action button "Mahlzeit erfassen" (terracotta, full-width, 52px height, sticky at bottom). This is the #1 action users perform.

### Mobile-Specific Adaptations
- Hero ring scaled to 240px (fits comfortably on 375px wide screens with padding)
- Quick stats row is horizontally scrollable
- Charts are simplified with fewer labels
- Meal list items are swipeable (left = edit, right = delete)
- All sections stack vertically with 24px gaps

### Touch Targets
- All buttons minimum 44px tap target
- Meal list items 56px height minimum
- FAB button 44x44px
- Bottom action button full-width, 52px height

### Interactive Elements
- Tap meal item -> edit dialog opens (pre-filled)
- Tap body progress chart -> full Korperdaten list view
- Tap workout bar in chart -> shows that day's workout details
- Tap goal card -> edit goal dialog

---

## 5. Desktop Layout

### Overall Structure
Two-column layout: 65% left / 35% right, max-width 1400px centered. The left column contains the hero and primary content. The right column contains secondary feeds and management.

Eye flow: Hero ring (top-left) -> Quick stats (below hero) -> Weekly chart (left, below stats) -> Recent activity (right column, top) -> Body progress (right column, middle) -> Goals (right column, bottom).

Visual interest comes from the asymmetric split, the dominant hero ring versus compact right-side cards, and typography size jumps (48px hero -> 14px badge -> 20px section headers).

### Section Layout

**Top Row (full width):**
Left: Hero progress ring (320px diameter on desktop) with calorie/protein rings and today's macros summary beside the ring (not just below). The ring sits left, and to its right are stacked: today's calories breakdown by meal type (small horizontal stacked bar), protein/carbs/fat split (3 inline numbers), and the primary action button "Mahlzeit erfassen".

Right sidebar top: Quick Stats as a 2x2 grid of compact stat cards (workouts this week, avg duration, current weight, weight delta).

**Left Column (below hero):**
- Weekly Training Chart (bar chart, full left-column width, ~280px height)
- Below chart: Recent Workout Logs table (last 5 workouts with type, duration, mood, date)

**Right Column:**
- Today's Meals list (compact, with inline edit/delete icons visible on hover)
- Body Progress mini chart + latest measurements grid
- Active Goals list with progress bars

### What Appears on Hover
- Meal items: edit (pencil) and delete (trash) icons appear on the right
- Workout rows: full details tooltip showing exercises performed
- Stat cards: subtle shadow elevation + pointer cursor where clickable
- Goal cards: edit icon appears

### Clickable/Interactive Areas
- Hero ring area: not clickable (it's informational)
- Each meal row: click to open edit dialog
- Workout log rows: click to see full exercise breakdown for that session
- Body progress chart: click to open full Korperdaten management view
- Goal cards: click to edit goal
- All "+" buttons: open create dialogs for respective apps

---

## 6. Components

### Hero KPI
- **Title:** Tagesfortschritt (hidden - the ring IS the title)
- **Data source:** Ernaehrung (filtered to today's date) + Ziele (active goal for calories/protein)
- **Calculation:** Sum of all kalorien and protein from today's Ernaehrung entries. Compare against active Ziele taeglich_kalorien and taeglich_protein.
- **Display:** Double concentric SVG progress rings. Outer ring = calorie progress (0-100% of goal). Inner ring = protein progress. Center number = current calories in 48px bold. Below: protein in 16px.
- **Context shown:** Percentage of daily goal completed, absolute numbers shown. Ring fills clockwise from top.
- **Why this is the hero:** Calorie tracking is checked 3-6x daily. Making it the instant visual answer to "Am I on track?" reduces friction to zero.

### Secondary KPIs

**Workouts diese Woche**
- Source: Workouts (filtered to current week, excluding rest_day=true)
- Calculation: Count of workouts this week / trainingstage_pro_woche from active Ziele
- Format: "X / Y" count
- Display: Compact badge with Dumbbell icon, muted background pill

**Durchschnittliche Dauer**
- Source: Workouts (filtered to current week, excluding rest_day)
- Calculation: Average of dauer_minuten
- Format: "XX min" number
- Display: Compact badge with Clock icon

**Aktuelles Gewicht**
- Source: Koerperdaten (latest entry by datum)
- Calculation: Latest gewicht_kg value
- Format: "XX.X kg" number with one decimal
- Display: Compact badge with Scale icon

**Gewichtstrend**
- Source: Koerperdaten (latest 2 entries by datum)
- Calculation: Delta between latest and previous gewicht_kg
- Format: "+/-X.X kg" with trend arrow
- Display: Compact badge, green for loss / red for gain (or vice versa based on user goal), TrendingDown/TrendingUp icon

### Chart: Weekly Training Overview
- **Type:** Bar chart - because it shows discrete daily counts/durations clearly and allows comparing days at a glance
- **Title:** "Diese Woche"
- **What question it answers:** "How consistent is my training this week? Am I hitting my weekly goal?"
- **Data source:** Workouts (current week)
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Duration in minutes (or count if no duration)
- **Colors:** Terracotta bars for workout days, muted/empty for rest days. If rest_day=true, show a small gray marker.
- **Mobile simplification:** Smaller bar width, abbreviated day labels (M, D, M, D, F, S, S), reduced Y-axis ticks

### Chart: Body Weight Trend
- **Type:** Area chart with line - smooth area fill shows the trend direction naturally, line gives precision
- **Title:** "Gewichtsverlauf"
- **What question it answers:** "Is my weight going in the right direction over time?"
- **Data source:** Koerperdaten (last 30 days, sorted by datum)
- **X-axis:** Date (dd.MM format)
- **Y-axis:** Weight in kg
- **Colors:** Terracotta line, terracotta-with-10%-opacity fill
- **Mobile simplification:** Fewer X-axis labels, smaller height (160px vs 220px desktop)

### Lists/Tables

**Heute gegessen (Today's Meals)**
- Purpose: See what you've eaten today at a glance, quickly add/edit meals
- Source: Ernaehrung (filtered to today's datum)
- Fields shown: mahlzeit_typ (as badge), beschreibung, kalorien, protein
- Mobile style: Compact list rows with swipe actions
- Desktop style: Clean list with hover-reveal edit/delete icons
- Sort: By mahlzeit_typ order (Fruhstuck, Snack, Mittagessen, Abendessen, etc.)
- Limit: All of today's entries (no limit)

**Letzte Workouts (Recent Workouts)**
- Purpose: Review recent training sessions
- Source: Workouts (most recent, excluding rest_day=true)
- Fields shown: datum, typ, dauer_minuten, stimmung
- Mobile style: Cards with date, type badge, duration, mood emoji
- Desktop style: Compact table rows
- Sort: By datum descending
- Limit: 5 most recent

### Primary Action Button (REQUIRED!)
- **Label:** "Mahlzeit erfassen"
- **Action:** add_record
- **Target app:** Ernaehrung
- **What data:** datum (default: today), mahlzeit_typ (select), beschreibung (textarea), kalorien (number), protein (number), carbs (number), fett (number)
- **Mobile position:** bottom_fixed (full-width sticky button at bottom of screen)
- **Desktop position:** header (within the hero section, to the right of the rings)
- **Why this action:** Logging meals is the most frequent action (3-6x daily) and directly feeds the hero KPI. Making it one tap away maximizes tracking consistency.

### CRUD Operations Per App (REQUIRED!)

**Ubungen (Exercises) CRUD Operations**
- **Create:** "+" button in an Ubungen management section (accessible from a "Ubungen verwalten" link in the settings/menu area or from workout log creation). Dialog with fields: name (text, required), muskelgruppe (select from lookup_data), equipment (select), schwierigkeitsgrad (select).
- **Read:** Displayed as a searchable list when selecting an exercise during workout log creation. Also accessible from a dedicated management view. Fields in list: name, muskelgruppe badge, equipment badge.
- **Update:** Pencil icon on each exercise row -> same dialog as create, pre-filled.
- **Delete:** Trash icon -> confirmation dialog "Ubung '{name}' wirklich loschen?"

**Workouts CRUD Operations**
- **Create:** "Workout starten" button (secondary action in header or within the weekly chart section). Dialog with fields: datum (date, default today), typ (select), dauer_minuten (number), stimmung (select), rest_day (checkbox).
- **Read:** Recent workouts list/table showing datum, typ, dauer_minuten, stimmung. Click row for detail dialog showing all fields + related workout logs.
- **Update:** Click workout row -> detail view -> Edit button -> same dialog as create, pre-filled.
- **Delete:** Trash icon in detail view -> "Workout vom {datum} wirklich loschen?"

**Workout-Logs CRUD Operations**
- **Create:** "Satz hinzufugen" button within a workout detail view or standalone. Dialog with: workout (select from recent workouts), uebung (select from Ubungen), satz_nummer (number), gewicht (number in kg), wiederholungen (number), rpe (select).
- **Read:** Shown within workout detail view, grouped by exercise. Fields: uebung name, satz_nummer, gewicht, wiederholungen, rpe.
- **Update:** Pencil icon on each log row -> same dialog, pre-filled.
- **Delete:** Trash icon -> "Satz {satz_nummer} wirklich loschen?"

**Ziele (Goals) CRUD Operations**
- **Create:** "Neues Ziel" button in Goals section. Dialog: taeglich_kalorien (number), taeglich_protein (number), trainingstage_pro_woche (number), schlaf_ziel_stunden (number), status (select: aktiv/erreicht/verworfen), notizen (textarea).
- **Read:** Goals section shows active goals with progress indicators. Click for full detail.
- **Update:** Click goal -> edit dialog pre-filled with current values.
- **Delete:** Trash icon -> "Ziel wirklich loschen?"

**Ernaehrung (Nutrition) CRUD Operations**
- **Create:** Primary action button "Mahlzeit erfassen". Dialog: datum (date, default today), mahlzeit_typ (select), beschreibung (textarea), kalorien (number), protein (number), carbs (number), fett (number).
- **Read:** Today's meals list. Click to see full details. Filter by date to see other days.
- **Update:** Click meal row (mobile: tap) -> edit dialog pre-filled.
- **Delete:** Desktop: hover delete icon. Mobile: swipe or tap delete in edit view. -> "Mahlzeit wirklich loschen?"

**Korperdaten (Body Data) CRUD Operations**
- **Create:** "Messung erfassen" button in body progress section. Dialog: datum (date, default today), gewicht_kg (number), kfa_geschaetzt (number %), brustumfang (number cm), taillenumfang (number cm), hueftumfang (number cm), armumfang (number cm), beinumfang (number cm), notizen (textarea).
- **Read:** Weight chart + latest measurements grid. Click chart area for full history list.
- **Update:** Click measurement entry -> edit dialog pre-filled.
- **Delete:** Trash icon in detail view -> "Messung vom {datum} wirklich loschen?"

---

## 7. Visual Details

### Border Radius
Rounded (10px) - matches the --radius variable of 0.625rem. Cards and buttons have comfortable rounding. Progress ring is perfectly circular. Badges use pill shape (999px).

### Shadows
Subtle - Cards use `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover, cards elevate to `shadow-md`. The hero section has no shadow (it's a feature area, not a card). Dialogs use `shadow-lg`.

### Spacing
Spacious - 24px between sections on mobile, 32px on desktop. 16px internal padding on cards. 12px between compact list items. The hero section has 32px top padding to breathe.

### Animations
- **Page load:** Stagger fade-in (sections appear sequentially with 100ms delay, opacity 0->1 + translateY 10px->0, duration 400ms)
- **Hover effects:** Cards: shadow elevation transition (200ms). Buttons: slight scale(1.02) on hover. List items: background-color transition to muted.
- **Tap feedback:** Buttons: scale(0.98) on active press. List items: brief bg-muted flash.
- **Progress ring:** On load, the ring fills with a smooth animation from 0% to current value over 800ms with ease-out.

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(35 30% 96%);
  --foreground: hsl(20 10% 15%);
  --card: hsl(36 33% 99%);
  --card-foreground: hsl(20 10% 15%);
  --popover: hsl(36 33% 99%);
  --popover-foreground: hsl(20 10% 15%);
  --primary: hsl(14 70% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 20% 93%);
  --secondary-foreground: hsl(20 10% 15%);
  --muted: hsl(35 20% 93%);
  --muted-foreground: hsl(20 5% 45%);
  --accent: hsl(40 60% 50%);
  --accent-foreground: hsl(20 10% 15%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(30 15% 88%);
  --input: hsl(30 15% 88%);
  --ring: hsl(14 70% 50%);
  --chart-1: hsl(14 70% 50%);
  --chart-2: hsl(40 60% 50%);
  --chart-3: hsl(150 50% 40%);
  --chart-4: hsl(20 40% 60%);
  --chart-5: hsl(35 50% 70%);
  --radius: 0.625rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font "Outfit" loaded from URL above
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4 (hero ring dominant, bottom fixed action)
- [ ] Desktop layout matches Section 5 (65/35 split, hero left, activity right)
- [ ] Hero progress ring is prominent with dual rings (calories + protein)
- [ ] Colors create the warm, earthy mood described in Section 2
- [ ] CRUD patterns are consistent across all 6 apps
- [ ] Delete confirmations are in place for every app
- [ ] Primary action "Mahlzeit erfassen" works end-to-end
- [ ] Weekly training bar chart displays correctly
- [ ] Body weight area chart displays correctly
- [ ] Today's meals list shows real data filtered by today's date
- [ ] Quick stats show computed values from real data
- [ ] All 6 apps have full CRUD (Create, Read, Update, Delete)
- [ ] Toast feedback on every create/update/delete operation
- [ ] Loading skeletons for every data fetch
- [ ] Empty states with helpful guidance
- [ ] Error states with retry option
