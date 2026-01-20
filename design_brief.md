# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking app that helps users monitor their workouts, track meals, measure body progress, and stay accountable to their goals. It combines exercise logs, nutrition data, body measurements, and goal tracking into one cohesive system.

### Who Uses This
Fitness enthusiasts who are serious about tracking their progress - whether they're building muscle, losing weight, or maintaining a healthy lifestyle. These users work out 3-5+ times per week and want detailed insights into their training and nutrition patterns.

### The ONE Thing Users Care About Most
**Did I hit my training goal this week?** Users want immediate feedback on whether they're staying consistent with their workout schedule. This is the motivation checkpoint that keeps them accountable.

### Primary Actions (IMPORTANT!)
1. **Log a workout** → Primary Action Button (most frequent action - happens 3-5x per week)
2. Add a meal entry (happens daily)
3. Record body measurements (happens weekly)

This dashboard is NOT read-only - users must be able to quickly log their workouts and nutrition from the dashboard itself.

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a warm, energizing color palette with a soft cream background (hsl(35 40% 97%)) and bold terracotta accents (hsl(14 65% 55%)) that evoke strength, warmth, and sustained effort. Unlike typical fitness apps with aggressive neon colors or sterile clinical whites, this palette feels grounded and sustainable - like a long-term habit, not a crash diet. The Outfit font family adds a modern, athletic character without feeling overly sporty or aggressive.

### Layout Strategy
The layout uses **asymmetric emphasis** to create immediate visual hierarchy:
- The hero element (Weekly Training Streak) is emphasized through MASSIVE typography (72px on desktop, 56px on mobile) and generous whitespace - taking center stage
- Secondary metrics are displayed in compact horizontal rows, NOT in identical card boxes, creating visual contrast
- A large progress chart fills the width below the hero, creating a secondary focal point
- Size variation is dramatic: hero number is 3-4x larger than secondary metrics, creating unmistakable hierarchy
- Whitespace is used intentionally: tight grouping of related metrics, wide margins around hero

### Unique Element
The hero workout streak number features a **subtle radial gradient backdrop** (from soft peach to transparent) that creates a gentle glow effect behind the number, making it feel like the sun rising on your progress. The number itself uses an ultra-bold weight (800) with tight letter-spacing (-0.02em), giving it a strong, confident presence. Below the streak, a thin progress bar with rounded ends shows the week's completion, using the terracotta accent color.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Outfit has a modern, geometric structure with athletic energy. Its rounded forms feel approachable and friendly, while maintaining excellent readability. The wide weight range (300-800) allows for dramatic hierarchy in the hero section.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 40% 97%)` | `--background` |
| Main text | `hsl(25 20% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(25 20% 18%)` | `--card-foreground` |
| Borders | `hsl(30 20% 88%)` | `--border` |
| Primary action | `hsl(14 65% 55%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(14 65% 55%)` | `--accent` |
| Muted background | `hsl(30 25% 93%)` | `--muted` |
| Muted text | `hsl(25 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(140 55% 45%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The warm cream background (instead of pure white) creates a softer, more inviting environment that reduces eye strain during daily check-ins. The terracotta accent color is energizing without being aggressive - it's the color of clay, earth, and sustained effort. This palette says "sustainable habits" rather than "crash diet intensity."

### Background Treatment
The page background uses a **subtle radial gradient** from the cream color `hsl(35 40% 97%)` at the center to a slightly darker `hsl(35 35% 95%)` at the edges. This creates gentle depth and prevents the flat, lifeless look of pure white backgrounds. The gradient is barely perceptible but adds warmth.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
Mobile prioritizes the hero workout streak, making it absolutely dominant - it should feel like a celebration when users open the app. Visual hierarchy is created through extreme size variation: the hero number is HUGE (56px), while secondary stats are compact (14px labels, 24px numbers). This creates unmistakable importance.

### What Users See (Top to Bottom)

**Header:**
- App title "Fitness Tracker" in medium weight (600), 20px
- Right side: Simple icon button for settings (secondary, muted)
- Background: transparent/matches page background
- Height: 60px with bottom padding

**Hero Section (The FIRST thing users see):**
**Weekly Training Streak**
- Takes up 45% of viewport height (roughly 300-350px on typical phone)
- Contains:
  - Small label "Diese Woche" in muted color, 14px, weight 500
  - MASSIVE number "4" in 56px, weight 800, with tight letter-spacing (-0.02em)
  - Secondary text "von 5 Trainings" in 16px, weight 500, muted
  - Horizontal progress bar: 8px height, rounded ends, terracotta fill showing 4/5 progress
  - Subtle radial gradient backdrop (peach to transparent) behind the number
- Generous padding: 40px vertical, 24px horizontal
- Background: white card with subtle shadow
- Why this is the hero: Workout consistency is the #1 predictor of fitness success. Users need immediate visual feedback on whether they're on track.

**Section 2: Quick Stats**
Compact horizontal row (NOT individual cards) showing:
- Kalorien heute: [number] kcal
- Protein heute: [number]g
- Letztes Gewicht: [number] kg
Each stat is displayed inline with small label (12px muted) and larger number (20px bold)
Background: single white card containing all three stats
Height: 80px
Padding: 16px

**Section 3: Wochenübersicht Chart**
- Title: "Trainingsminuten diese Woche" (16px, weight 600)
- Bar chart showing daily workout duration
- Height: 240px
- Background: white card
- Mobile simplification: Shows 7 days, labels abbreviated to "M T W T F S S"

**Section 4: Recent Activity**
- Title: "Letzte Workouts" (16px, weight 600)
- List of last 3 workouts as simple cards:
  - Date + workout type
  - Duration + mood emoji
  - Tap to see workout details
- Each card: 72px height, 12px margin between

**Bottom Navigation / Action:**
Large fixed button at bottom:
- Label: "Workout starten"
- Height: 56px
- Background: terracotta (--primary)
- Position: Fixed at bottom with safe area padding
- Border radius: 12px (slightly inset from edges with 16px margin)

### Mobile-Specific Adaptations
All content flows vertically in a single column. Secondary metrics are grouped into compact rows rather than individual cards to save vertical space. The chart is simplified to show just the essential data without hover tooltips. Nothing is hidden - all functionality is accessible but optimized for vertical scrolling.

### Touch Targets
All interactive elements (buttons, cards) are minimum 44px height. The primary action button is 56px for comfortable thumb reach. Cards have 12px spacing between them to prevent mis-taps.

### Interactive Elements
Workout cards in "Recent Activity" are tappable - when tapped, they could expand to show the full workout log with exercises, sets, and reps. This drill-down is useful because the summary card only shows high-level info (date, type, duration) but users may want to review specific exercises.

---

## 5. Desktop Layout

### Overall Structure
The desktop layout uses a **two-column asymmetric grid**:
- Left column: 65% width - contains hero, chart, and recent workouts
- Right column: 35% width - contains quick stats, goals, and nutrition summary

The eye flows: Hero (top-left) → Chart (center-left) → Quick stats sidebar (right) → Recent activity (bottom-left)

Visual interest comes from the dramatic size difference between the hero section and everything else, plus the asymmetric column split.

### Section Layout

**Top Left (Hero): Weekly Training Streak**
- Takes full width of left column
- Height: 280px
- Contains same hero content as mobile but with larger typography:
  - Number: 72px, weight 800
  - More dramatic radial gradient backdrop
  - Progress bar: 10px height

**Top Right (Sidebar): Quick Stats & Goals**
- Stacked cards showing:
  1. Today's nutrition (Kalorien, Protein against daily goals)
  2. Active goals (from Ziele app)
  3. Latest body weight trend (small sparkline)
- Each card: white background, 16px padding
- 16px gap between cards

**Middle Left: Wochenübersicht Chart**
- Full width of left column
- Height: 320px
- Shows 7-day training minutes as bar chart
- Hover reveals exact minutes + workout type

**Bottom Left: Recent Workouts**
- Table format (not cards) showing last 7 workouts
- Columns: Date, Type, Duration, Mood, Exercises count
- Row hover: subtle background change
- Click row: opens workout detail view

**Right Column: Nutrition Log**
- Recent meals (last 5)
- Compact list format
- Shows meal type + calories + protein

### What Appears on Hover
- Chart bars: Tooltip showing exact minutes, workout type, and mood
- Workout table rows: Slight background color change (--muted), cursor pointer
- Primary action button: Slight scale transform (1.02x) and deeper shadow

### Clickable/Interactive Areas
- Workout table rows: Click to open a detail view showing all exercises, sets, reps, and weights for that specific workout
- Quick stats cards: Click "Kalorien heute" to open today's nutrition breakdown by meal
- Chart bars: Click a day to jump to that day's workout details

This interactivity is useful because the dashboard shows summaries, but users often need to review or edit specific entries.

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Weekly Training Streak
- **Data source:** Workouts app
- **Calculation:** Count workouts in current week (Monday-Sunday) where rest_day is false
- **Display:** Massive number (72px desktop, 56px mobile, weight 800) showing workout count, with denominator text "von X Trainings" where X comes from the active Ziele record's trainingstage_pro_woche field
- **Context shown:** Horizontal progress bar below showing completion percentage (e.g., 4/5 = 80%), plus small label "Diese Woche" above
- **Why this is the hero:** Consistency is the foundation of fitness progress. Users need immediate visual confirmation that they're staying on track with their weekly goal. This single number answers "Am I doing what I said I'd do?"

### Secondary KPIs

**Kalorien heute**
- Source: Ernaehrung app
- Calculation: Sum of kalorien field for all records where datum equals today
- Format: number with "kcal" suffix
- Display: Inline in Quick Stats row (mobile) or card (desktop), shows "X / Y kcal" where Y is from active Ziele taeglich_kalorien

**Protein heute**
- Source: Ernaehrung app
- Calculation: Sum of protein field for all records where datum equals today
- Format: number with "g" suffix
- Display: Inline in Quick Stats row, shows "X / Y g" where Y is from active Ziele taeglich_protein

**Aktuelles Gewicht**
- Source: Koerperdaten app
- Calculation: Latest gewicht_kg value (most recent datum)
- Format: number with "kg" suffix, 1 decimal place
- Display: Inline in Quick Stats row, includes small trend indicator (up/down arrow) comparing to previous week

### Chart

**Trainingsminuten diese Woche**
- **Type:** Bar chart - shows discrete workout sessions per day, makes it easy to spot rest days
- **Title:** "Trainingsminuten diese Woche"
- **What question it answers:** "How much am I actually training each day?" - helps users see patterns and identify inconsistencies
- **Data source:** Workouts app
- **X-axis:** Days of current week (Monday-Sunday), labeled as "Mo, Di, Mi, Do, Fr, Sa, So"
- **Y-axis:** Duration in minutes (dauer_minuten field), labeled "Minuten"
- **Mobile simplification:** Abbreviated day labels (M, D, M, D, F, S, S), smaller font sizes, no hover tooltips

### Lists/Tables

**Recent Workouts (Desktop)**
- Purpose: Quick access to review or edit recent training sessions
- Source: Workouts app
- Fields shown: datum (formatted as "DD.MM"), typ, dauer_minuten, stimmung (as emoji: schlecht=😞, okay=😐, gut=😊, brutal=🔥)
- Mobile style: Card list (3 most recent)
- Desktop style: Table (7 most recent)
- Sort: By datum descending (newest first)
- Limit: 7 on desktop, 3 on mobile

**Letzte Mahlzeiten (Desktop Sidebar)**
- Purpose: Quick glance at today's nutrition entries
- Source: Ernaehrung app
- Fields shown: mahlzeit_typ (icon), beschreibung (truncated to 30 chars), kalorien
- Mobile style: Hidden (nutrition summary shown in quick stats instead)
- Desktop style: Compact list
- Sort: By datum + creation time descending
- Limit: 5 most recent from today

### Primary Action Button (REQUIRED!)

This is the most important interactive element - users log workouts 3-5x per week!

- **Label:** "Workout starten"
- **Action:** add_record
- **Target app:** Workouts (app_id: 6914a7e7b773d677cf3838c1)
- **What data:** Form with fields:
  - datum (auto-filled to today, date picker)
  - typ (dropdown: Push, Pull, Beine, Ganzkörper, etc.)
  - dauer_minuten (number input, placeholder "z.B. 60")
  - stimmung (emoji selector: Schlecht, Okay, Gut, Brutal)
  - rest_day (checkbox, default false)
- **Mobile position:** bottom_fixed (floating 16px from bottom edge, spans width minus 32px margin)
- **Desktop position:** header (top-right corner next to settings icon)
- **Why this action:** Logging workouts is the most frequent user action (happens every training day). Making it one tap away removes friction and encourages consistency. The form is simple enough to fill out in 10 seconds right after finishing a workout.

---

## 7. Visual Details

### Border Radius
- Cards and buttons: 12px (rounded, modern but not pill-shaped)
- Small elements (badges, chips): 6px
- Progress bars: 99px (fully rounded ends)

### Shadows
Subtle, elevated style:
- Cards at rest: `0 1px 3px rgba(0, 0, 0, 0.08)`
- Cards on hover: `0 4px 12px rgba(0, 0, 0, 0.12)`
- Primary button: `0 2px 8px rgba(220, 90, 60, 0.25)` (colored shadow matching button)

### Spacing
Normal to spacious:
- Section gaps: 32px (mobile), 40px (desktop)
- Card padding: 20px (mobile), 24px (desktop)
- Hero padding: 40px vertical (mobile), 48px (desktop)
- Text line height: 1.5 for body text, 1.2 for headings

### Animations
- **Page load:** Subtle stagger - hero fades in first (100ms), then stats (200ms delay), then chart (300ms delay)
- **Hover effects:**
  - Buttons: Scale 1.02x transform + shadow increase (150ms ease-out)
  - Cards/rows: Background color shift to --muted (100ms ease)
- **Tap feedback:** Brief scale down to 0.98x on touch (80ms), then spring back

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(35 40% 97%);
  --foreground: hsl(25 20% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(25 20% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(25 20% 18%);
  --primary: hsl(14 65% 55%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(30 25% 93%);
  --secondary-foreground: hsl(25 20% 18%);
  --muted: hsl(30 25% 93%);
  --muted-foreground: hsl(25 15% 50%);
  --accent: hsl(14 65% 55%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(30 20% 88%);
  --input: hsl(30 20% 88%);
  --ring: hsl(14 65% 55%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL: `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap`
- [ ] All CSS variables copied exactly as shown in Section 8
- [ ] Mobile layout: Hero dominates first viewport, stats are compact rows, button is fixed at bottom
- [ ] Desktop layout: Asymmetric two-column (65/35 split), hero in top-left
- [ ] Hero number is MASSIVE: 72px desktop, 56px mobile, weight 800
- [ ] Radial gradient backdrop behind hero number (peach glow effect)
- [ ] Progress bar has rounded ends and uses terracotta accent color
- [ ] Primary action button "Workout starten" is prominent and creates workout records via Living Apps API
- [ ] Colors create warm, energizing, sustainable mood (cream background + terracotta accents)
- [ ] Chart shows training minutes for current week (7 days)
- [ ] Recent workouts show mood as emoji, not text
