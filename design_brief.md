# Design Brief: Fitness & Ernaehrungs-Tracker

## 1. App Analysis

### What This App Does
A personal fitness and nutrition tracker that lets users log workouts, track exercises with sets/reps/weight, record meals with macros, monitor body measurements over time, and set goals for calories, protein, training frequency, and sleep. It bridges the gap between a workout log, a food diary, and a body composition tracker.

### Who Uses This
Fitness enthusiasts who train regularly (3-5x/week), track their nutrition, and want to see their progress. They open this dashboard before/after workouts and during meals. They think in terms of "Did I hit my protein today?" and "Am I getting stronger?"

### The ONE Thing Users Care About Most
**Today's progress** - "How am I doing today?" They want to see at a glance: today's calories vs goal, today's protein vs goal, and whether they've trained today. The hero element is a daily progress snapshot.

### Primary Actions (IMPORTANT!)
1. **Workout loggen** - Primary Action Button (most frequent action)
2. Mahlzeit erfassen (log a meal)
3. Gewicht eintragen (record body weight)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a warm sand-toned base with a bold teal accent, creating a grounded, calm aesthetic that feels like a premium fitness journal. The warmth avoids the cold clinical feel of typical fitness apps, while the teal provides energetic contrast for interactive elements and progress indicators. It feels like opening a high-end wellness app, not a spreadsheet.

### Layout Strategy
- The hero is an asymmetric "daily snapshot" card that takes up significant visual real estate at the top, showing today's calorie and protein progress as two side-by-side radial progress indicators
- Below the hero, secondary KPIs use varied sizing - the workout streak counter is larger than the body weight trend, creating visual rhythm
- Desktop uses a 2/3 + 1/3 split: main content left, recent activity feed right
- Sections are grouped by user mental model: "Today" (top), "This Week" (middle), "Trends" (bottom)

### Unique Element
The daily macro progress uses two concentric semi-circle gauges (calories outer, protein inner) with smooth gradient fills from the warm sand to teal. When both goals are hit, a subtle checkmark appears. This creates an almost game-like "completion" feeling that motivates daily tracking.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit is a geometric sans-serif with rounded terminals that feels friendly and modern. Its wide weight range (300-700) enables strong typographic hierarchy. Perfect for fitness/health apps - approachable yet structured.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 30% 97%)` | `--background` |
| Main text | `hsl(220 20% 14%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 20% 14%)` | `--card-foreground` |
| Borders | `hsl(35 15% 90%)` | `--border` |
| Primary action (teal) | `hsl(174 62% 38%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(35 40% 92%)` | `--accent` |
| Muted background | `hsl(35 20% 95%)` | `--muted` |
| Muted text | `hsl(220 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm sand background (`hsl(35 30% 97%)`) gives the app a calm, earthy base that differentiates it from the typical cold-white fitness apps. The teal primary (`hsl(174 62% 38%)`) is energetic without being aggressive - it says "health and vitality." The combination feels like a premium wellness brand.

### Background Treatment
The page background is a warm off-white (`hsl(35 30% 97%)`). Cards sit on pure white for subtle elevation. No gradients on the background - the warmth of the base tone provides enough visual interest.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport with the daily progress gauges. Below, content flows vertically with clear section breaks. Size variation is key: the hero is visually dominant (large numbers, bold colors), while secondary stats are compact inline rows, not cards. This creates a clear scanning hierarchy.

### What Users See (Top to Bottom)

**Header:**
- Left: "Fitness Tracker" in 600 weight, 20px
- Right: Date badge showing today's date in "dd. MMM" format (e.g. "09. Feb"), muted background, rounded pill

**Hero Section (The FIRST thing users see):**
- Full-width card with warm teal gradient top edge (3px)
- Title: "Heute" (Today) in 14px muted text, uppercase tracking-wide
- Two large circular progress rings side by side (each ~120px diameter):
  - Left ring: Calories consumed / goal, large number in center (e.g. "1.450"), label "kcal" below
  - Right ring: Protein consumed / goal, large number in center (e.g. "98"), label "g Protein" below
- Below rings: workout status for today - either "Kein Training heute" in muted text, or "Push-Training - 65 Min" in bold with a checkmark icon
- Why hero: Users open the app to check "how am I doing today?" This answers it in 1 second.

**Section 2: Quick Stats Row**
- Horizontal row of 3 compact inline stats (NOT cards, just text with small icons):
  - Trainings diese Woche: "3/5" with dumbbell icon
  - Aktuelles Gewicht: "82.3 kg" with scale icon
  - Streak: "12 Tage" with flame icon
- Each stat: icon 16px muted, value 16px font-600, label 12px muted below
- Light bottom border separating from next section

**Section 3: Wochenübersicht (Weekly Overview)**
- Title: "Diese Woche" in 16px font-600
- Bar chart showing daily calories for the last 7 days
- Bars colored teal, goal line as dashed horizontal
- X-axis: Mo, Di, Mi, Do, Fr, Sa, So
- Chart height: 180px
- Below chart: simple text summary "Durchschnitt: 2.150 kcal / Tag"

**Section 4: Letzte Aktivitäten (Recent Activity)**
- Title: "Letzte Einträge" in 16px font-600
- List of last 5 entries across all apps (workouts, meals, body data)
- Each entry: icon (type-specific), description, time ago (e.g. "vor 2 Std.")
- Compact list items with 12px gap between

**Bottom Navigation:**
- Fixed bottom tab bar with 5 tabs:
  - Übersicht (Home icon) - active by default
  - Training (Dumbbell icon)
  - Ernährung (Apple/Utensils icon)
  - Körper (User icon)
  - Ziele (Target icon)

### Mobile-Specific Adaptations
- Progress rings scale to 100px on very small screens (< 375px)
- Bar chart simplifies to 3-letter day abbreviations
- Recent activity shows 4 items max on mobile
- All touch targets minimum 44px
- Bottom padding: pb-20 to account for fixed bottom nav

### Touch Targets
- Bottom nav items: full width of each tab area, 56px tall
- List items: full width, 48px min height
- Progress rings are tappable to navigate to Ernährung page

### Interactive Elements
- Tapping hero progress rings navigates to Ernährung page
- Tapping workout status navigates to Training page
- Tapping a recent activity item navigates to the relevant app page

---

## 5. Desktop Layout

### Overall Structure
Two-column layout: 65% main content (left) + 35% sidebar (right).
- Eye goes first to the hero (top-left), then quick stats, then weekly chart, then sidebar.
- The sidebar contains recent activity and quick action buttons, staying visible while scrolling.
- Left column has the analytical content, right column has the action-oriented content.

### Section Layout

**Top area (full width of main column):**
- Hero card: daily progress with the two circular gauges + today's workout status
- Quick stats row directly below hero (inline, not cards)

**Main content area (left 65%):**
- Weekly calorie bar chart in a card
- Below: Weekly training summary (which days trained, which type)

**Sidebar (right 35%, sticky):**
- Quick Actions card: 3 buttons stacked vertically:
  - "Workout loggen" (primary, teal)
  - "Mahlzeit erfassen" (outline)
  - "Gewicht eintragen" (outline)
- Recent Activity card: last 8 entries across all apps
- Active Goals card: summary of active goals with progress bars

### What Appears on Hover
- Cards get subtle shadow elevation (`shadow-md`) on hover
- Recent activity items get muted background on hover
- Quick action buttons: standard button hover states
- Chart bars show tooltip with exact value

### Clickable/Interactive Areas
- Hero progress rings: navigate to Ernährung page
- Workout status: navigate to Training page
- Recent activity items: navigate to relevant app page
- Quick action buttons: open respective create dialogs

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Heute (Today)
- **Data source:** Ernährung (for calories/protein today) + Workouts (for today's workout)
- **Calculation:** Sum all Ernährung entries where `datum` = today for kalorien and protein. Check Workouts for entry where `datum` = today.
- **Display:** Two circular progress rings side by side. Each ring shows consumed/goal as a percentage fill. Large number in center. Below: today's workout status text.
- **Context shown:** Progress toward daily calorie and protein goals (from Ziele app). Today's workout type and duration if exists.
- **Why this is the hero:** The daily snapshot answers the #1 question every fitness tracker user has: "How am I doing today?"

### Secondary KPIs

**Trainings diese Woche**
- Source: Workouts (filter this week, exclude rest_day=true)
- Calculation: Count of workouts this week / trainingstage_pro_woche from Ziele
- Format: "3/5" fraction
- Display: Inline stat with dumbbell icon, compact

**Aktuelles Gewicht**
- Source: Koerperdaten (latest entry by datum)
- Calculation: Latest gewicht_kg value
- Format: "82.3 kg" number with unit
- Display: Inline stat with scale icon, compact

**Streak**
- Source: Workouts + Ernährung (count consecutive days with at least one entry)
- Calculation: Count backwards from today, each day must have either a workout or nutrition entry
- Format: "12 Tage" number with unit
- Display: Inline stat with flame icon, compact

### Chart
- **Type:** Bar chart - bars are intuitive for daily discrete values, easy to compare day-to-day
- **Title:** Diese Woche - Kalorien
- **What question it answers:** "Am I consistently hitting my calorie target this week?"
- **Data source:** Ernährung (sum kalorien per day for last 7 days)
- **X-axis:** Day of week (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Kalorien (kcal)
- **Goal line:** Horizontal dashed line at taeglich_kalorien from Ziele
- **Mobile simplification:** Same chart, slightly shorter (180px vs 250px), smaller font

### Lists/Tables

**Letzte Einträge (Recent Activity)**
- Purpose: Quick overview of recent tracking activity across all apps
- Source: Workouts + Ernährung + Koerperdaten (combined, sorted by createdat)
- Fields shown: Type icon, description text, relative time
- Mobile style: compact list with left icon
- Desktop style: compact list in sidebar card
- Sort: By createdat descending
- Limit: 5 on mobile, 8 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Workout loggen"
- **Action:** add_record
- **Target app:** Workouts
- **What data:** datum (date, default today), typ (select from lookup_data), dauer_minuten (number), stimmung (select from lookup_data), rest_day (checkbox)
- **Mobile position:** The bottom nav has a Training tab that leads to the workouts page where the create button is prominent
- **Desktop position:** Sidebar quick actions card - top button, primary style
- **Why this action:** Logging workouts is the most frequent action. Users train 3-5x/week and want to record it immediately.

### CRUD Operations Per App (REQUIRED!)

**Übungen (Exercises) CRUD Operations**

- **Create:** "Neue Übung" button at top of Übungen page. Opens Dialog.
  - Form fields: name (text input, required), muskelgruppe (select: Brust/Rücken/Beine/Schultern/Bizeps/Trizeps/Bauch/Ganzkörper), equipment (select: Langhantel/Kurzhantel/Maschine/Kabelzug/Bodyweight/Kettlebell/Resistance Band/Sonstiges), schwierigkeitsgrad (select: Anfänger/Fortgeschritten/Experte)
  - Form style: Dialog
  - Required fields: name
  - Default values: none

- **Read:**
  - List view: Card grid (2 columns on desktop, 1 on mobile). Each card shows name (bold), muskelgruppe badge, equipment badge, difficulty badge.
  - Detail view: Click card opens detail Dialog showing all fields.
  - Sort: Alphabetical by name
  - Filter: By muskelgruppe (select filter at top)

- **Update:** Edit icon (pencil) on each card. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon on each card. Confirmation dialog: "Möchtest du die Übung '{name}' wirklich löschen?"

**Workouts CRUD Operations**

- **Create:** "Neues Workout" primary button at top of Workouts page. Opens Dialog.
  - Form fields: datum (date input, default today), typ (select from lookup_data), dauer_minuten (number input), stimmung (select from lookup_data), rest_day (checkbox)
  - Form style: Dialog
  - Required fields: datum
  - Default values: datum = today

- **Read:**
  - List view: Card list sorted by date (newest first). Each card shows: date (formatted), typ badge, duration, stimmung emoji/badge. Rest days shown with muted styling and "Ruhetag" label.
  - Detail view: Click card opens Dialog showing all fields + linked workout logs below.
  - Sort: By datum descending
  - Filter: By typ (select filter at top)

- **Update:** Edit icon in card header. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon in card header. Confirmation: "Workout vom {datum} wirklich löschen?"

**Workout-Logs CRUD Operations**

- **Create:** "Satz hinzufügen" button within the Workout-Logs page. Opens Dialog.
  - Form fields: workout (select from Workouts records), uebung (select from Übungen records), satz_nummer (number), gewicht (number, kg), wiederholungen (number), rpe (select 1-10)
  - Form style: Dialog
  - Required fields: workout, uebung, satz_nummer
  - Default values: satz_nummer auto-increments based on existing logs for the selected workout+exercise

- **Read:**
  - List view: Table grouped by workout date, then by exercise name. Columns: Übung, Satz, Gewicht, Wdh, RPE.
  - Detail view: Click row to open edit Dialog.
  - Sort: By workout date desc, then satz_nummer asc
  - Filter: By workout (select), by uebung (select)

- **Update:** Click row or edit icon. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon per row. Confirmation: "Satz {satz_nummer} von '{uebung}' löschen?"

**Ernährung (Nutrition) CRUD Operations**

- **Create:** "Mahlzeit erfassen" button at top of Ernährung page. Opens Dialog.
  - Form fields: datum (date, default today), mahlzeit_typ (select from lookup_data), beschreibung (textarea), kalorien (number), protein (number), carbs (number), fett (number)
  - Form style: Dialog
  - Required fields: datum, mahlzeit_typ
  - Default values: datum = today

- **Read:**
  - List view: Grouped by date (newest first). Each day shows total kcal/protein summary at top, then individual meals as list items with type badge, description, and macro numbers.
  - Detail view: Click meal opens Dialog with all fields.
  - Sort: By datum descending, then by mahlzeit_typ order
  - Filter: By date range, by mahlzeit_typ

- **Update:** Edit icon on each meal item. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon on each meal. Confirmation: "Mahlzeit '{beschreibung}' löschen?"

**Körperdaten (Body Data) CRUD Operations**

- **Create:** "Messung eintragen" button at top of Körperdaten page. Opens Dialog.
  - Form fields: datum (date, default today), gewicht_kg (number), kfa_geschaetzt (number, %), brustumfang (number, cm), taillenumfang (number, cm), hueftumfang (number, cm), armumfang (number, cm), beinumfang (number, cm), notizen (textarea)
  - Form style: Dialog
  - Required fields: datum, gewicht_kg
  - Default values: datum = today

- **Read:**
  - List view: Line chart showing gewicht_kg over time as hero element. Below: card list of measurements sorted by date desc. Each card shows date, weight, body fat %, and change from previous.
  - Detail view: Click card opens Dialog showing all measurements.
  - Sort: By datum descending

- **Update:** Edit icon on each card. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon on each card. Confirmation: "Messung vom {datum} löschen?"

**Ziele (Goals) CRUD Operations**

- **Create:** "Neues Ziel" button at top of Ziele page. Opens Dialog.
  - Form fields: taeglich_kalorien (number), taeglich_protein (number), trainingstage_pro_woche (number), schlaf_ziel_stunden (number), status (select: Aktiv/Erreicht/Verworfen), notizen (textarea)
  - Form style: Dialog
  - Required fields: none (all optional)
  - Default values: status = "aktiv"

- **Read:**
  - List view: Card list. Active goals highlighted with teal left border. Reached goals have success green. Discarded goals are muted.
  - Detail view: Click card opens Dialog showing all fields + progress indicators.
  - Sort: Active first, then by createdat desc

- **Update:** Edit icon on each card. Opens same Dialog as Create, pre-filled.
- **Delete:** Trash icon on each card. Confirmation: "Ziel wirklich löschen?"

---

## 7. Navigation (React Router)

### Navigation Structure

- **Navigation style:** Sidebar (desktop) + Bottom tabs (mobile)
- **Dashboard/Home route:** Landing page shows the "Heute" hero, quick stats, weekly chart, recent activity, and quick actions.

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard Overview | Hero daily progress, quick stats, weekly chart, recent activity |
| `/training` | Workouts | Full CRUD for Workouts app, list of all workouts |
| `/workout-logs` | Workout-Logs | Full CRUD for Workout-Logs, table of sets/reps |
| `/uebungen` | Übungen | Full CRUD for Exercises, card grid of all exercises |
| `/ernaehrung` | Ernährung | Full CRUD for Nutrition, daily meal logs |
| `/koerperdaten` | Körperdaten | Full CRUD for Body Data, weight chart + measurements |
| `/ziele` | Ziele | Full CRUD for Goals, goal cards with status |

### Navigation Design

**Desktop:**
- Fixed left sidebar, 240px wide
- Top: App title "Fitness Tracker" in 18px font-700, with a small dumbbell icon
- Nav items: icon + label, 14px font-500, vertical list with 4px gap
- Active item: teal background with white text, 8px border-radius
- Inactive: muted-foreground color, hover: muted background
- Sidebar background: white (card color), right border

**Mobile:**
- Fixed bottom tab bar, 60px height
- 5 tabs max: Übersicht, Training, Ernährung, Körper, Ziele
- Icons: 20px, label 10px below
- Active tab: teal color icon + label
- Inactive: muted-foreground
- "Workout-Logs" and "Übungen" are accessible via the Training page (sub-navigation or links within)
- Background: white, top border

### Active Route Indicator
- Desktop sidebar: Active item has `bg-primary text-primary-foreground` with rounded-lg
- Mobile bottom tabs: Active icon and label colored with `text-primary`, inactive is `text-muted-foreground`

### Dashboard Overview Page (/)
- Hero: Today's calorie + protein progress rings + today's workout status
- Quick stats row: Workouts this week, current weight, streak
- Weekly calorie bar chart
- Recent activity list (last 5-8 entries)
- Quick action buttons (desktop sidebar only)

---

## 8. Visual Details

### Border Radius
Rounded (8px) - `--radius: 0.5rem`. Cards, buttons, and badges all use rounded corners. Badges use pill shape (full rounding).

### Shadows
Subtle - Cards have `shadow-sm` by default, `shadow-md` on hover. No heavy drop shadows. The warm background provides enough visual separation.

### Spacing
Spacious - generous padding inside cards (p-5 on desktop, p-4 on mobile). Gap between sections: 24px. Gap between cards in grids: 16px. The breathing room makes the dashboard feel calm and organized.

### Animations
- **Page load:** Stagger fade-in for cards (each card fades in 50ms after the previous)
- **Page transitions:** Simple fade (200ms) when navigating between routes
- **Hover effects:** Cards lift with shadow-md transition (200ms ease). Buttons: standard shadcn hover.
- **Tap feedback:** Scale down 98% on press (active state)

---

## 9. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(35 30% 97%);
  --foreground: hsl(220 20% 14%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 20% 14%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 20% 14%);
  --primary: hsl(174 62% 38%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 20% 95%);
  --secondary-foreground: hsl(220 20% 14%);
  --muted: hsl(35 20% 95%);
  --muted-foreground: hsl(220 10% 50%);
  --accent: hsl(35 40% 92%);
  --accent-foreground: hsl(220 20% 14%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(35 15% 90%);
  --input: hsl(35 15% 90%);
  --ring: hsl(174 62% 38%);
  --chart-1: hsl(174 62% 38%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(35 80% 56%);
  --chart-4: hsl(220 60% 55%);
  --chart-5: hsl(280 55% 55%);
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(220 20% 14%);
  --sidebar-primary: hsl(174 62% 38%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(35 40% 92%);
  --sidebar-accent-foreground: hsl(220 20% 14%);
  --sidebar-border: hsl(35 15% 90%);
  --sidebar-ring: hsl(174 62% 38%);
}
```

---

## 10. Implementation Checklist

The implementer should verify:
- [ ] Font "Outfit" loaded from Google Fonts URL
- [ ] All CSS variables copied exactly from Section 9
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero daily progress rings are prominent
- [ ] Warm sand + teal color scheme creates the described mood
- [ ] React Router navigation with all 7 routes from Section 7
- [ ] Each app has its own page/route with full CRUD
- [ ] Navigation: desktop sidebar + mobile bottom tabs
- [ ] CRUD patterns consistent across all apps
- [ ] Delete confirmations in place
- [ ] Toast feedback on all CRUD operations
