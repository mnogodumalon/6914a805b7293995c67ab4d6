# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
A comprehensive fitness and nutrition tracker for people who take their training seriously. It tracks workouts (type, duration, mood), individual exercise sets with weight and reps, nutrition with macros, body measurements over time, and personal fitness goals. This is a tool for someone committed to their fitness journey who wants to see progress and stay accountable.

### Who Uses This
Dedicated fitness enthusiasts in Germany who go to the gym regularly. They care about progressive overload, hitting their protein targets, and seeing measurable progress. They're not professional athletes, but they take their training seriously. Age likely 20-40, tracking workouts on their phone between sets or logging meals throughout the day.

### The ONE Thing Users Care About Most
**"Wie läuft meine Woche?"** - Am I on track with my training and nutrition this week? Users want instant validation that they're staying consistent. The weekly workout count vs. goal is the single most important metric.

### Primary Actions (IMPORTANT!)
1. **Workout starten** → Primary Action Button (most frequent - users need to quickly log a new workout session)
2. Mahlzeit hinzufügen (track meals throughout the day)
3. Gewicht loggen (weekly or bi-weekly check-in)

---

## 2. What Makes This Design Distinctive

### Visual Identity
A bold, high-energy design that feels like a premium fitness app, not a generic dashboard. The dark slate-blue primary color paired with an energetic amber accent creates a masculine, gym-focused aesthetic. The warm cream background softens the intensity while maintaining a clean, premium feel. This isn't a clinical health app—it's a training companion that matches the energy of someone pushing their limits.

### Layout Strategy
The hero KPI dominates the top with a massive progress ring showing weekly training progress—this is what users look for instantly. The layout uses a 65/35 split on desktop: the left column holds the hero and main chart (workout frequency), while a narrower right column shows today's nutrition summary and recent workouts as a vertical feed. This creates a clear "primary focus + supporting details" hierarchy rather than equal-weight panels.

On mobile, the hero takes nearly the full viewport height with the progress ring as the centerpiece. Everything else scrolls below in a single column, with nutrition shown as a compact macro bar rather than a full card.

### Unique Element
The **weekly training progress ring** with a thick 12px stroke, rounded caps, and a subtle glow effect on the filled portion. The number in the center shows "3/5" style progress (workouts done / goal). This gamified element makes hitting the weekly goal feel like an achievement, not just data.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, modern feel that suits data-heavy fitness tracking. Its geometric shapes feel sporty and precise without being cold. The wide range of weights allows for dramatic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 30% 96%)` | `--background` |
| Main text | `hsl(222 30% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(222 30% 18%)` | `--card-foreground` |
| Borders | `hsl(40 20% 88%)` | `--border` |
| Primary action | `hsl(222 47% 31%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(36 95% 52%)` | `--accent` |
| Muted background | `hsl(40 20% 93%)` | `--muted` |
| Muted text | `hsl(222 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The slate-blue primary (`hsl(222 47% 31%)`) feels strong, focused, and masculine—like a quality gym brand. The amber accent (`hsl(36 95% 52%)`) adds energy and highlights achievements without being aggressive. The warm cream background (`hsl(40 30% 96%)`) prevents the clinical white-lab feel while keeping everything readable.

### Background Treatment
A subtle warm cream (#F7F5F0) rather than pure white. This creates a softer, more inviting feel. Cards are pure white to pop slightly from the background, creating gentle depth without heavy shadows.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
Mobile is hero-dominant: the progress ring takes center stage, filling most of the first viewport. This answers the user's primary question ("Am I on track this week?") before they scroll at all. Below, information is condensed: nutrition is a simple horizontal macro bar, recent workouts are a minimal list. Visual interest comes from the dramatic size difference between the hero and supporting elements.

### What Users See (Top to Bottom)

**Header:**
Simple header with "Fitness Tracker" title on the left, current date on the right. No hamburger menu—this is a single-screen dashboard.

**Hero Section (The FIRST thing users see):**
A large progress ring (200px diameter) centered on screen showing weekly workout completion. Inside the ring: large number showing completed workouts, small text showing goal (e.g., "3" in 48px bold, "/5 Workouts" in 14px below). Below the ring: text "Diese Woche" and the current week's date range. The ring uses the amber accent color for the filled portion with a subtle glow, gray for the remaining. This section takes approximately 55% of viewport height, making the progress feel heroic and important.

**Section 2: Heute - Quick Stats Row**
A horizontal row of 3 compact stat pills showing today's status:
- Workout done today? (checkmark or X icon + "Training")
- Calories consumed / goal
- Protein consumed / goal

These are inline, not cards—just text with icons. ~60px height total.

**Section 3: Makros Heute (Nutrition Bar)**
A slim horizontal stacked bar showing today's macros visually (protein in primary blue, carbs in amber, fat in muted gray). Below: three small numbers "P: 120g | K: 180g | F: 65g". Total height ~80px. Tapping opens nutrition detail modal.

**Section 4: Letzte Workouts**
A simple list of the 3 most recent workouts. Each item shows:
- Workout type badge (Push, Pull, Beine, etc.)
- Date
- Duration + mood emoji
Compact rows, ~56px each. No cards, just subtle separators.

**Bottom Navigation / Action:**
Fixed bottom button: "Workout starten" in primary blue, full width with comfortable padding. This is always visible and accessible with thumb.

### What is HIDDEN on Mobile
- Workout frequency chart (takes too much space, hero ring tells the story)
- Body measurement trends
- Detailed exercise logs
- Goal settings

### Touch Targets
All buttons minimum 48px height. The progress ring itself is not tappable. The nutrition bar is tappable (reveals detail modal). Recent workout items are tappable (shows workout detail).

### Interactive Elements
- **Nutrition bar:** Tap to open modal showing full meal breakdown for today
- **Workout list items:** Tap to show workout detail (exercises, sets, weights)

---

## 5. Desktop Layout

### Overall Structure
A 65/35 left-heavy split that puts the hero progress ring and weekly chart on the left (the "story"), with supporting details stacked vertically on the right (the "feed"). The eye flows: hero ring → chart → right column top to bottom. Asymmetry creates clear priority.

### Column Layout
- **Left column (65%):** Hero progress ring (centered, larger than mobile), below it the workout frequency area chart showing the last 8 weeks
- **Right column (35%):** Stacked vertically: Today's nutrition card (with macro breakdown), then Recent Workouts list (last 5)

### Layout Diagram (ASCII)
```
┌─────────────────────────────────────────┐  ┌──────────────────────┐
│                                         │  │  HEUTE               │
│         ╭─────────────╮                 │  │  Kalorien: 1840/2200 │
│         │             │                 │  │  Protein:  128/150g  │
│         │   3 / 5     │    HERO         │  │  ────────────────    │
│         │  Workouts   │   (65%)         │  │  Frühstück  480kcal  │
│         │             │                 │  │  Mittagessen 620kcal │
│         ╰─────────────╯                 │  │  Snack      180kcal  │
│          Diese Woche                    │  └──────────────────────┘
│                                         │  ┌──────────────────────┐
├─────────────────────────────────────────┤  │  LETZTE WORKOUTS     │
│                                         │  │  ────────────────    │
│   ▁▂▃▅▆▄▃▅  Workout-Frequenz            │  │  Push  Mo 13.01  65m │
│   (Area chart - last 8 weeks)           │  │  Pull  Sa 11.01  55m │
│                                         │  │  Beine Fr 10.01  70m │
│                                         │  │  Push  Mi 08.01  60m │
└─────────────────────────────────────────┘  │  Pull  Mo 06.01  58m │
                                             └──────────────────────┘
```

### What Appears on Hover
- **Chart data points:** Show exact workout count for that week
- **Workout list items:** Subtle background highlight, reveal "Details →" text
- **Nutrition meals:** Show full macro breakdown tooltip

### Clickable/Interactive Areas
- **Workout list items:** Click to expand inline showing exercises and sets
- **"Workout starten" button:** Opens new workout form modal
- **Today's nutrition card:** Click to add new meal

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Wochenfortschritt
- **Data source:** Workouts app (filtered to current week, excluding rest_day)
- **Calculation:** Count of workouts where `datum` is in current week AND `rest_day` !== true
- **Display:** Large circular progress ring (240px desktop, 200px mobile) with workout count in center. Number in 48px bold, "/X Workouts" in 16px regular below. Week label "Diese Woche" and date range below ring.
- **Context shown:** Progress toward weekly goal (from Ziele app `trainingstage_pro_woche`)
- **Why this is the hero:** Consistency is everything in fitness. Users need instant reinforcement that they're on track this week.

### Secondary KPIs

**Kalorien heute**
- Source: Ernährung app (filtered to today)
- Calculation: Sum of `kalorien` field for today's date
- Format: "1840 / 2200 kcal" (vs goal from Ziele)
- Display: Progress bar with number

**Protein heute**
- Source: Ernährung app (filtered to today)
- Calculation: Sum of `protein` field for today's date
- Format: "128 / 150g" (vs goal from Ziele)
- Display: Progress bar with number

### Chart
- **Type:** Area chart - shows trend smoothly, filled area creates visual weight
- **Title:** Workout-Frequenz
- **What question it answers:** "Am I training consistently over time, or are there dips?"
- **Data source:** Workouts app
- **X-axis:** Week (last 8 weeks), labeled as "KW 2", "KW 3", etc.
- **Y-axis:** Number of workouts (0-7 range)
- **Mobile simplification:** Hidden on mobile - the hero ring tells the story sufficiently

### Lists/Tables

**Heutige Mahlzeiten**
- Purpose: Quick overview of what's been logged today
- Source: Ernährung app (filtered to today)
- Fields shown: mahlzeit_typ, beschreibung (truncated), kalorien
- Mobile style: Compact list items
- Desktop style: Card with list inside
- Sort: By createdat ascending
- Limit: All meals today

**Letzte Workouts**
- Purpose: Context on recent training, confirm what was done
- Source: Workouts app
- Fields shown: typ (as badge), datum, dauer_minuten, stimmung (as emoji)
- Mobile style: Minimal list with separators
- Desktop style: Table-like rows in a card
- Sort: By datum descending
- Limit: 3 on mobile, 5 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Workout starten"
- **Action:** add_record
- **Target app:** Workouts
- **What data:** Opens form with: datum (auto-filled today), typ (select), dauer_minuten (number input), stimmung (select), rest_day (checkbox)
- **Mobile position:** bottom_fixed (sticky footer button)
- **Desktop position:** header (top right, prominent button)
- **Why this action:** Logging a workout is the most frequent action. Users do this every training day. It needs to be one tap away.

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, friendly)
- Buttons: 8px (slightly less than cards)
- Badges: 16px (pill-shaped)
- Progress ring: circular (50%)

### Shadows
Subtle: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` on cards. No heavy drop shadows. Cards differentiate from background through white color, not shadow.

### Spacing
- Page padding: 24px mobile, 32px desktop
- Card padding: 20px mobile, 24px desktop
- Between cards: 16px mobile, 24px desktop
- Inside lists: 12px between items

### Animations
- **Page load:** Staggered fade-in, cards appear sequentially with 50ms delay
- **Hover effects:** Cards lift slightly (translateY -2px) with transition. Buttons darken.
- **Tap feedback:** Scale down to 0.98 briefly on buttons
- **Progress ring:** Animates from 0 to current progress on load (1s duration, ease-out)

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(40 30% 96%);
  --foreground: hsl(222 30% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222 30% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222 30% 18%);
  --primary: hsl(222 47% 31%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 20% 93%);
  --secondary-foreground: hsl(222 30% 18%);
  --muted: hsl(40 20% 93%);
  --muted-foreground: hsl(222 15% 50%);
  --accent: hsl(36 95% 52%);
  --accent-foreground: hsl(222 30% 18%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(40 20% 88%);
  --input: hsl(40 20% 88%);
  --ring: hsl(222 47% 31%);
  --radius: 0.75rem;
}
```

Additional custom properties for this design:

```css
:root {
  --success: hsl(152 55% 42%);
  --chart-primary: hsl(222 47% 31%);
  --chart-accent: hsl(36 95% 52%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Space Grotesk font loaded from Google Fonts URL
- [ ] All CSS variables copied exactly to index.css
- [ ] Mobile layout shows hero ring prominently, nutrition as compact bar
- [ ] Desktop layout uses 65/35 split with hero left, feed right
- [ ] Hero progress ring is 200px mobile, 240px desktop with 12px stroke
- [ ] Accent color (amber) used for progress ring fill with subtle glow
- [ ] "Workout starten" button is fixed at bottom on mobile
- [ ] Staggered fade-in animation on page load
- [ ] Workouts filtered to current week, excluding rest days
- [ ] Nutrition totals calculated for today only
