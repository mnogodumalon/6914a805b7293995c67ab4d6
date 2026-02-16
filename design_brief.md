# Design Brief: Fitness & Ernahrungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking system. Users log workouts (with individual exercise sets), track meals and macros, record body measurements over time, and set personal goals for calories, protein, training frequency, and sleep. The system connects exercises to workouts via workout logs, enabling detailed strength progression tracking.

### Who Uses This
A fitness-conscious individual who trains regularly (likely 3-5x per week), tracks macros, and wants to see their progress over time. They care about consistency, progressive overload, and nutrition compliance. They open this dashboard daily - before or after the gym - to log and review.

### The ONE Thing Users Care About Most
**"How am I doing this week?"** - They want an instant snapshot of weekly training consistency and nutrition compliance against their goals. The hero should answer: "Am I on track with my training days and calories this week?"

### Primary Actions (IMPORTANT!)
1. **Workout loggen** - Primary Action Button (most frequent daily action)
2. **Mahlzeit hinzufugen** - Secondary quick action
3. **Korperdaten erfassen** - Weekly action
4. **Neues Ziel setzen** - Occasional

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a warm, sandy base with a deep forest green accent - evoking the grounded, earthy discipline of someone committed to their fitness journey. The color palette avoids the typical "gym bro" neon aesthetic and instead feels like a premium wellness journal. The warm cream background with olive-green accents creates a calm, focused environment that makes daily tracking feel like a mindful practice rather than a chore.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (2/3 width) containing the hero weekly progress ring and workout chart, and a narrower right column (1/3 width) for recent activity feed and quick actions. This creates natural visual flow: hero draws the eye, chart provides context, sidebar shows recent data for quick reference.

On mobile, the hero weekly progress takes the entire top fold with a large circular progress visualization, then sections stack vertically with clear typographic separation. Size variation is achieved through the hero being dramatically larger than secondary KPIs, which use compact inline rows rather than full cards.

### Unique Element
The weekly progress visualization: a bold, thick-stroked circular progress ring showing training days completed vs. goal, centered with the count in a large 56px bold weight. Around it, two smaller semi-circular gauges show calorie and protein compliance for today. This creates a "cockpit" feel - like a fitness command center - that's instantly readable and satisfying when goals are met.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit has geometric, rounded letterforms that feel modern and approachable - perfect for a fitness app that should feel motivating, not clinical. The weight range from 300 to 700 allows dramatic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 30% 97%)` | `--background` |
| Main text | `hsl(160 15% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(160 15% 15%)` | `--card-foreground` |
| Borders | `hsl(40 15% 88%)` | `--border` |
| Primary action (forest green) | `hsl(158 35% 30%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(158 30% 92%)` | `--accent` |
| Muted background | `hsl(40 15% 94%)` | `--muted` |
| Muted text | `hsl(160 5% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(145 50% 42%)` | (component use) |
| Error/negative | `hsl(0 65% 51%)` | `--destructive` |

### Why These Colors
The warm sandy background (`hsl(40 30% 97%)`) provides a subtle warmth that feels inviting versus clinical white. The deep forest green primary (`hsl(158 35% 30%)`) is authoritative and natural - it says "discipline" and "growth" without being aggressive. The accent is a very light tint of the primary, keeping cards and highlighted areas cohesive.

### Background Treatment
The page background uses a subtle warm off-white (`hsl(40 30% 97%)`) that creates gentle contrast against pure white cards. No gradient or pattern - the warmth of the base color provides enough visual distinction from the cards to create depth naturally.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport with a large circular progress ring (training days this week). Below it, today's nutrition is shown as compact inline progress bars. Then tabbed sections for Workouts, Ernahrung, Korperdaten, and management sections. A fixed bottom FAB for the primary action.

### What Users See (Top to Bottom)

**Header:**
- Left: App title "Fitness Tracker" in 600 weight, 20px
- Right: Small avatar circle (decorative) or settings icon

**Hero Section (The FIRST thing users see):**
- A large circular progress ring (200px diameter on mobile) showing training days completed this week vs goal
- Inside the ring: large number (48px, 700 weight) of completed days, small text "von X Tagen" below (14px, 300 weight)
- Below the ring: current week label "KW {number}" in muted text
- The ring uses primary color for filled portion, muted for track
- Below ring: two compact inline stat rows for today
  - "Kalorien heute: X / Y kcal" with mini progress bar
  - "Protein heute: X / Y g" with mini progress bar
- Why this is the hero: answers the #1 question "Am I on track this week?" instantly

**Section 2: Quick Stats Row**
- Horizontal scroll of 3 compact metric cards (no full cards, just borderless inline blocks):
  - "Workouts diese Woche" - count
  - "Durchschn. Dauer" - average workout duration in min
  - "Stimmung" - most common mood emoji/text
- 14px values, 12px labels, compact spacing

**Section 3: Tabs Section**
- Tab bar with: "Workouts" | "Ernahrung" | "Korper" | "Ubungen" | "Ziele"
- Each tab shows the respective app's data list with CRUD actions
- **Workouts tab (default):** List of recent workouts as compact cards - date, type badge, duration, mood. Each card tappable for detail view with edit/delete actions.
- **Ernahrung tab:** Today's meals grouped. Each meal row: type badge, description, kcal, protein. Add button per meal type.
- **Korper tab:** Body measurement timeline - latest entry prominent, then history list. Chart showing weight trend.
- **Ubungen tab:** Exercise library - grouped by muscle group. Each exercise shows name, equipment badge, difficulty badge.
- **Ziele tab:** Goals list with status badges (Aktiv/Erreicht/Verworfen). Active goals shown with progress indicators.

**Bottom Navigation / Action:**
- Fixed FAB (Floating Action Button) bottom-right, 56px, primary color, "+" icon
- Tapping opens a quick-action sheet: "Workout loggen", "Mahlzeit hinzufugen", "Korper messen", "Ubung erstellen", "Ziel setzen"

### Mobile-Specific Adaptations
- Progress ring slightly smaller (200px vs 240px desktop)
- Tab bar is horizontally scrollable for the 5 tabs
- Workout cards stack vertically as compact rows
- Charts use simplified axes with fewer tick marks
- All CRUD dialogs open as near-full-screen sheets on mobile

### Touch Targets
- All tappable items minimum 44px height
- FAB has 56px touch target with 16px padding from edge
- Tab triggers have generous horizontal padding
- Edit/delete actions are icon buttons (40px) within list items

### Interactive Elements
- Workout cards: tap to expand detail view showing all sets (workout logs)
- Nutrition entries: tap to see full macro breakdown
- Body data entries: tap to see all measurements for that date
- Progress ring: not interactive (decorative visualization)

---

## 5. Desktop Layout

### Overall Structure
Max-width container (1200px) centered. Two-column asymmetric layout:
- **Left column (65%):** Hero progress section (ring + today's nutrition), then workout volume chart, then tabbed data management
- **Right column (35%):** Quick action buttons, recent activity feed, goals overview

The eye goes: 1) Progress ring (top-left hero), 2) Today's nutrition bars (below ring), 3) Quick action buttons (top-right), 4) Chart (left middle), 5) Data tabs (left bottom), 6) Recent activity (right column).

### Section Layout

**Top area - Hero Bar (full width):**
- Left side: Progress ring (240px) with training days count
- Center: Two horizontal progress bars - today's calories and protein vs goals
- Right side: Quick action buttons stacked vertically - "Workout loggen" (primary, full width), "Mahlzeit erfassen" (outline), "Gewicht eintragen" (outline)

**Main content area (left 65%):**
- Workout volume/frequency chart (AreaChart showing last 4 weeks of workout duration by type)
- Below chart: Tabbed section for full CRUD management of all 6 apps
  - Tabs: Workouts | Ernahrung | Korperdaten | Ubungen | Ziele | Workout-Logs
  - Each tab shows a table/list view with inline edit/delete buttons and "New" button

**Supporting area (right 35%):**
- "Letzte Aktivitat" card - chronological feed of last 10 records across all apps, showing what was logged and when (relative time)
- "Aktive Ziele" card - shows active goals with progress indicators
- "Korper-Trend" mini chart - sparkline of weight over last 30 days

### What Appears on Hover
- Table rows: subtle background highlight + edit/delete icons appear
- Cards: slight shadow elevation
- Chart data points: tooltip with exact values
- Quick action buttons: slight scale up (1.02)

### Clickable/Interactive Areas
- Workout rows: click to expand inline and show workout logs (sets) for that workout
- Nutrition rows: click to edit inline
- Activity feed items: click to navigate to the relevant tab and highlight the record
- Body trend sparkline: click to switch to Korperdaten tab

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** "Trainingstage diese Woche"
- **Data source:** Workouts app - count records where datum is within current week AND rest_day is not true
- **Calculation:** Count of workouts this week (Mon-Sun) where rest_day !== true
- **Display:** Large circular progress ring (240px desktop, 200px mobile). Thick 10px stroke, rounded caps. Primary color for progress, muted for remaining track. Inside: large count number (56px, 700 weight), below it "von {goal} Tagen" (14px, 300 weight). Goal comes from Ziele app (trainingstage_pro_woche field of the active goal).
- **Context shown:** Progress as fraction against weekly training day goal
- **Why this is the hero:** The weekly training frequency is the #1 metric for consistency - the most important predictor of fitness progress

### Secondary KPIs

**Kalorien heute**
- Source: Ernahrung app, records where datum = today
- Calculation: Sum of kalorien field for today's entries
- Format: number with "kcal" suffix
- Display: Inline progress bar with "X / Y kcal" text. Y comes from Ziele (taeglich_kalorien). Bar fills proportionally.

**Protein heute**
- Source: Ernahrung app, records where datum = today
- Calculation: Sum of protein field for today's entries
- Format: number with "g" suffix
- Display: Inline progress bar with "X / Y g" text. Y comes from Ziele (taeglich_protein). Bar fills proportionally.

**Durchschnittliche Dauer**
- Source: Workouts app, records from this week
- Calculation: Average of dauer_minuten for this week's workouts (non-rest-day)
- Format: number with "min" suffix
- Display: Compact stat block, no card border

**Haufigste Stimmung**
- Source: Workouts app, records from this week
- Calculation: Mode of stimmung field values
- Format: Text label from lookup_data
- Display: Compact stat block with emoji indicator (Schlecht=meh, Okay=neutral, Gut=smile, Brutal=fire)

### Chart
- **Type:** AreaChart - WHY: shows volume over time as filled area, making training density visually obvious. The filled area communicates "accumulated effort" better than bars or lines.
- **Title:** "Trainingsvolumen (letzte 4 Wochen)"
- **What question it answers:** "Am I training consistently and how has my volume trended?"
- **Data source:** Workouts app (last 28 days)
- **X-axis:** Date (grouped by week, labeled as "KW {number}")
- **Y-axis:** Total training duration in minutes per week
- **Colors:** Primary color fill with 20% opacity, primary stroke
- **Mobile simplification:** Show only 4 data points (one per week), simplified axis labels

### Lists/Tables

**Workouts List (in Workouts tab)**
- Purpose: View and manage all workout sessions
- Source: Workouts app
- Fields shown in list: datum (formatted dd.MM.yyyy), typ (as Badge), dauer_minuten, stimmung, rest_day (as toggle icon)
- Fields shown in detail: All fields + related workout logs (sets)
- Mobile style: Compact cards with date, type badge, duration
- Desktop style: Table rows with all fields visible
- Sort: By datum descending (newest first)
- Limit: 20 most recent, with "load more" option

**Ernahrung List (in Ernahrung tab)**
- Purpose: Track daily meals and macros
- Source: Ernahrung app
- Fields shown in list: datum, mahlzeit_typ (Badge), beschreibung (truncated), kalorien, protein
- Desktop style: Table
- Mobile style: Grouped by date, compact meal rows
- Sort: By datum descending
- Limit: 20 most recent

**Korperdaten List (in Korper tab)**
- Purpose: Track body measurements over time
- Source: Koerperdaten app
- Fields shown in list: datum, gewicht_kg, kfa_geschaetzt, brustumfang, taillenumfang
- Fields shown in detail: All 8 measurement fields + notizen
- Desktop style: Table
- Mobile style: Cards showing date + key metrics
- Sort: By datum descending
- Limit: 15 most recent

**Ubungen List (in Ubungen tab)**
- Purpose: Manage exercise library
- Source: Uebungen app
- Fields shown: name, muskelgruppe (Badge), equipment (Badge), schwierigkeitsgrad (Badge)
- Desktop style: Table with badges
- Mobile style: List items with badges
- Sort: By name alphabetically
- Limit: All

**Ziele List (in Ziele tab)**
- Purpose: Manage personal fitness goals
- Source: Ziele app
- Fields shown: status (Badge), taeglich_kalorien, taeglich_protein, trainingstage_pro_woche, schlaf_ziel_stunden, notizen
- Desktop style: Cards
- Mobile style: Cards
- Sort: Active goals first, then by createdat descending

**Workout-Logs List (in Workout-Logs tab)**
- Purpose: View/manage individual exercise sets
- Source: WorkoutLogs app
- Fields shown: workout (resolved to date), uebung (resolved to exercise name), satz_nummer, gewicht, wiederholungen, rpe
- Desktop style: Table
- Mobile style: Compact rows
- Sort: By createdat descending
- Limit: 30 most recent

### Primary Action Button (REQUIRED!)

- **Label:** "Workout loggen" (with Plus icon)
- **Action:** add_record
- **Target app:** Workouts
- **What data:** Form with: Datum (date, default today), Typ (select from lookup), Dauer (number, minutes), Stimmung (select from lookup), Ruhetag (checkbox)
- **Mobile position:** bottom_fixed (FAB, bottom-right corner, 56px round button with "+" icon). Tapping opens action sheet with multiple create options.
- **Desktop position:** header area (top-right of hero section), prominent primary button
- **Why this action:** Logging a workout is the most frequent daily action for fitness tracking users. It needs to be one tap away.

### CRUD Operations Per App (REQUIRED!)

**Ubungen CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Ubungen tab header
  - Form fields: name (text input), muskelgruppe (select: Brust/Rucken/Beine/Schultern/Bizeps/Trizeps/Bauch/Ganzkorper), equipment (select: Langhantel/Kurzhantel/Maschine/Kabelzug/Bodyweight/Kettlebell/Resistance Band/Sonstiges), schwierigkeitsgrad (select: Anfanger/Fortgeschritten/Experte)
  - Form style: Dialog/Modal
  - Required fields: name
  - Default values: none

- **Read (Anzeigen):**
  - List view: Table rows on desktop, list items on mobile
  - Detail view: Click row to see all fields in a dialog
  - Fields shown in list: name, muskelgruppe badge, equipment badge, schwierigkeitsgrad badge
  - Sort: Alphabetically by name
  - Filter: By muskelgruppe dropdown

- **Update (Bearbeiten):**
  - Trigger: Pencil icon button on row hover (desktop) or visible (mobile)
  - Edit style: Same dialog as Create, pre-filled with current values

- **Delete (Loschen):**
  - Trigger: Trash icon button on row
  - Confirmation: "Ubung '{name}' wirklich loschen?"

**Workouts CRUD Operations**

- **Create (Erstellen):**
  - Trigger: Primary "Workout loggen" button (hero area + FAB)
  - Form fields: datum (date, default today), typ (select from lookup), dauer_minuten (number), stimmung (select from lookup), rest_day (checkbox)
  - Form style: Dialog/Modal
  - Required fields: datum
  - Default values: datum = today

- **Read (Anzeigen):**
  - List view: Table on desktop, cards on mobile
  - Detail view: Expand inline to show associated workout logs
  - Fields shown in list: datum, typ badge, dauer_minuten, stimmung, rest_day
  - Sort: By datum descending
  - Filter: By typ dropdown

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on row
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Loschen):**
  - Trigger: Trash icon on row
  - Confirmation: "Workout vom {datum} wirklich loschen?"

**Workout-Logs CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Workout-Logs tab or from within a workout detail view
  - Form fields: workout (select from existing workouts, showing date+type), uebung (select from Ubungen, showing name), satz_nummer (number), gewicht (number, kg), wiederholungen (number), rpe (select 1-10)
  - Form style: Dialog/Modal
  - Required fields: workout, uebung, satz_nummer
  - Default values: satz_nummer = 1

- **Read (Anzeigen):**
  - List view: Table with resolved workout date and exercise name
  - Detail view: Dialog showing all fields with resolved references
  - Fields shown: workout date, exercise name, satz_nummer, gewicht kg, wiederholungen, rpe
  - Sort: By createdat descending

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on row
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Loschen):**
  - Trigger: Trash icon on row
  - Confirmation: "Satz {satz_nummer} wirklich loschen?"

**Ziele CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Ziele tab
  - Form fields: taeglich_kalorien (number), taeglich_protein (number), trainingstage_pro_woche (number), schlaf_ziel_stunden (number), status (select: Aktiv/Erreicht/Verworfen), notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: none (all optional, but at least one metric should be set)
  - Default values: status = "aktiv"

- **Read (Anzeigen):**
  - List view: Cards with progress indicators
  - Detail view: Dialog with all fields
  - Fields shown: All numeric goals with units, status badge, notizen preview
  - Sort: Active first, then by createdat

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on card
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Loschen):**
  - Trigger: Trash icon on card
  - Confirmation: "Ziel wirklich loschen?"

**Ernahrung CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Ernahrung tab header, or "Mahlzeit hinzufugen" quick action
  - Form fields: datum (date, default today), mahlzeit_typ (select: Fruhstuck/Snack/Mittagessen/Abendessen/Pre-Workout/Post-Workout/Sonstiges), beschreibung (textarea), kalorien (number), protein (number), carbs (number), fett (number)
  - Form style: Dialog/Modal
  - Required fields: datum, mahlzeit_typ
  - Default values: datum = today

- **Read (Anzeigen):**
  - List view: Table on desktop, grouped cards on mobile
  - Detail view: Dialog with full macro breakdown
  - Fields shown in list: datum, mahlzeit_typ badge, beschreibung truncated, kalorien, protein
  - Fields shown in detail: All fields including carbs and fett
  - Sort: By datum descending
  - Filter: By mahlzeit_typ dropdown

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on row
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Loschen):**
  - Trigger: Trash icon on row
  - Confirmation: "Mahlzeit '{beschreibung}' wirklich loschen?"

**Korperdaten CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Korper tab, or "Gewicht eintragen" quick action
  - Form fields: datum (date, default today), gewicht_kg (number), kfa_geschaetzt (number, %), brustumfang (number, cm), taillenumfang (number, cm), hueftumfang (number, cm), armumfang (number, cm), beinumfang (number, cm), notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: datum
  - Default values: datum = today

- **Read (Anzeigen):**
  - List view: Table on desktop, cards on mobile
  - Detail view: Dialog showing all measurements
  - Fields shown in list: datum, gewicht_kg, kfa_geschaetzt, brustumfang, taillenumfang
  - Fields shown in detail: All fields including hueftumfang, armumfang, beinumfang, notizen
  - Sort: By datum descending

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on row
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Loschen):**
  - Trigger: Trash icon on row
  - Confirmation: "Korperdaten vom {datum} wirklich loschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) - `--radius: 0.5rem`. Slightly rounded corners feel modern and approachable without being too playful.

### Shadows
Subtle - Cards use `shadow-sm` by default. On hover, cards elevate to `shadow-md`. The hero section has no shadow (relies on spacing and size for prominence). Dialogs use `shadow-lg`.

### Spacing
Spacious - Generous whitespace between sections (32px), comfortable padding within cards (20px). The hero section has extra vertical padding (40px) to breathe. Section titles have 24px margin-bottom.

### Animations
- **Page load:** Stagger fade-in for cards (each card fades in 100ms after the previous)
- **Hover effects:** Cards: translateY(-1px) + shadow-md transition 200ms. Buttons: scale(1.02) transition 150ms.
- **Tap feedback:** Active state scales down to 0.98 for 100ms on buttons and cards
- **Progress ring:** Animated fill on load - starts at 0 and fills to current value over 800ms with ease-out

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(40 30% 97%);
  --foreground: hsl(160 15% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(160 15% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(160 15% 15%);
  --primary: hsl(158 35% 30%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 20% 94%);
  --secondary-foreground: hsl(160 15% 25%);
  --muted: hsl(40 15% 94%);
  --muted-foreground: hsl(160 5% 50%);
  --accent: hsl(158 30% 92%);
  --accent-foreground: hsl(158 35% 20%);
  --destructive: hsl(0 65% 51%);
  --border: hsl(40 15% 88%);
  --input: hsl(40 15% 88%);
  --ring: hsl(158 35% 30%);
  --chart-1: hsl(158 35% 30%);
  --chart-2: hsl(145 50% 42%);
  --chart-3: hsl(40 70% 55%);
  --chart-4: hsl(200 60% 50%);
  --chart-5: hsl(280 45% 55%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Outfit, weights 300-700)
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4 (hero ring top, tabs below, FAB bottom-right)
- [ ] Desktop layout matches Section 5 (asymmetric 65/35 split)
- [ ] Hero element is prominent as described (circular progress ring)
- [ ] Colors create the warm, earthy mood described in Section 2
- [ ] CRUD patterns are consistent across all 6 apps
- [ ] Delete confirmations are in place for every app
- [ ] All 6 apps have full CRUD (Ubungen, Workouts, Workout-Logs, Ziele, Ernahrung, Korperdaten)
- [ ] Toast notifications via sonner for all CRUD operations
- [ ] Sonner Toaster component is included in the app
- [ ] Use `toast.success()` and `toast.error()` from sonner (NOT shadcn toast)
