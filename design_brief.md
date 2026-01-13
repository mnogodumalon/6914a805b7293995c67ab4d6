# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking app that allows users to log workouts, track individual exercises with sets/reps/weights, monitor daily nutrition (calories, macros), record body measurements over time, and set personal fitness goals. It's designed for people who take their fitness seriously and want data-driven insights into their progress.

### Who Uses This
The typical user is someone actively working out 3-5 times per week, tracking their protein intake, and measuring progress through body composition changes. They're motivated, data-aware, and want to see tangible progress. They open the app daily—usually in the morning to plan or in the evening after a workout.

### The ONE Thing Users Care About Most
**"Did I train this week, and am I on track with my goals?"** Users want instant confirmation that they're staying consistent. The weekly workout count vs. their goal is the most emotionally important metric.

### Primary Actions (IMPORTANT!)
1. **Log a workout** → Primary Action Button (most frequent action)
2. Log a meal (nutrition tracking)
3. Record body measurements (less frequent, weekly)

---

## 2. What Makes This Design Distinctive

### Visual Identity
This design uses a warm, earthy palette with a sand/cream background and a bold terracotta accent—evoking the grounded, physical nature of strength training. The typography (Outfit) is athletic yet approachable, with extreme weight contrasts creating a sense of energy and movement. The overall feeling is "premium fitness journal" rather than clinical health app.

### Layout Strategy
The hero is a large circular progress ring showing weekly workout completion—positioned in the left 65% of the desktop view with massive breathing room. This creates an immediate emotional hook ("I'm 4/5 this week!"). Secondary KPIs (today's calories, protein) stack vertically in a narrow right column, clearly supporting rather than competing. On mobile, the progress ring dominates the first viewport (60% height), with everything else scrolling below.

### Unique Element
The workout progress ring uses a thick 10px stroke with rounded caps and a subtle inner glow effect. When the goal is reached, the ring fills with a celebratory gradient. This gamification element makes hitting weekly goals feel rewarding—almost like filling an achievement in a game.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit has a friendly, rounded character that feels approachable yet sporty. The geometric construction gives it a modern edge while remaining highly readable. It works beautifully at large display sizes for KPIs and stays crisp at small sizes for data.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(38 35% 96%)` | `--background` |
| Main text | `hsl(25 20% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(25 20% 15%)` | `--card-foreground` |
| Borders | `hsl(35 20% 88%)` | `--border` |
| Primary action | `hsl(16 65% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(16 65% 50%)` | `--accent` |
| Muted background | `hsl(35 25% 92%)` | `--muted` |
| Muted text | `hsl(25 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The warm sand background (`hsl(38 35% 96%)`) creates a sense of earthiness and physical grounding—perfect for a fitness app. The terracotta primary (`hsl(16 65% 50%)`) is bold and energetic without being aggressive. It's reminiscent of gym chalk, rust-colored weights, and natural strength. The success green is used sparingly for positive metrics like goal completion.

### Background Treatment
The background uses a subtle warm off-white (`hsl(38 35% 96%)`) rather than pure white. This creates a softer, more inviting canvas that reduces eye strain during daily use. Cards appear to float gently against this warm base.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
Mobile is dominated by the weekly progress ring, which takes up 55% of the initial viewport. This creates an immediate emotional impact—users see their goal progress before anything else. Below, content is organized in compact horizontal strips and small cards rather than full-width blocks, creating visual variety and efficient use of space.

### What Users See (Top to Bottom)

**Header:**
- Simple title "Fitness Tracker" in medium weight
- Current date (e.g., "Mo, 13. Januar") right-aligned
- No hamburger menu—keep it clean

**Hero Section (The FIRST thing users see):**
- Circular progress ring showing workouts this week vs. goal
- Ring takes ~55% of viewport height
- Center shows large number: "4/5" in 56px bold
- Below ring: "Workouts diese Woche" label in muted text
- Subtle inner glow on the progress arc
- **Why this is the hero:** Weekly consistency is the #1 factor in fitness success. Users need instant emotional feedback.

**Section 2: Today's Snapshot (Compact Stats Row)**
- Horizontal row with 2 mini stat blocks side-by-side (not full cards)
- Left: Today's Calories (e.g., "1,450 / 2,200 kcal") with mini progress bar
- Right: Today's Protein (e.g., "95 / 150g") with mini progress bar
- These are NOT tappable—just glanceable info
- Height: ~80px total

**Section 3: Recent Workouts**
- Section title: "Letzte Workouts"
- List of 3-4 recent workouts as compact cards
- Each card shows: Date, Workout Type (e.g., "Push"), Duration (e.g., "58 min"), Mood emoji
- Tappable to see workout details
- Scrollable if more than viewport height

**Section 4: Quick Stats**
- Small horizontal scroll of 3 stat chips
- Current weight, Training streak, Avg workout duration
- Chips are 100px wide, scrollable

**Bottom Navigation / Action:**
- Fixed bottom button: "Workout starten" (primary color, full width minus padding)
- Button height: 56px, always visible
- This is the PRIMARY ACTION

### What is HIDDEN on Mobile
- Workout chart (too complex for small screens)
- Body measurement details (accessible via tapping stats)
- Nutrition breakdown by meal (just show totals)

### Touch Targets
- All tappable cards: minimum 48px height
- Bottom action button: 56px height
- Stat chips: 44px height

### Interactive Elements
- Recent workout cards: tap to see full workout log details
- Progress ring: tap to see weekly workout list
- Today's stats row: tap to go to nutrition detail view

---

## 5. Desktop Layout

### Overall Structure
A bold 65/35 left-heavy split. The left column contains the hero progress ring with ample whitespace, making it feel like the centerpiece of a fitness journal. The right column stacks secondary information vertically: today's nutrition, recent workouts, and a workout trend chart. The eye naturally flows: ring → nutrition → workouts → chart.

### Column Layout
- **Left column (65%):** Hero progress ring centered both vertically and horizontally within the column. Generous padding (80px+) creates breathing room. Below the ring: inline text showing today's date and a motivational streak counter.
- **Right column (35%):** Stacked cards—Today's Nutrition (compact), Recent Workouts list (scrollable max-height), Workout Trend mini-chart. Cards have subtle shadows and rounded corners.

### Layout Diagram (ASCII)
```
┌────────────────────────────────────┐  ┌──────────────────────┐
│                                    │  │  TODAY'S NUTRITION   │
│                                    │  │  Calories: 1450/2200 │
│          ╭──────────────╮          │  │  Protein: 95/150g    │
│          │              │          │  └──────────────────────┘
│          │    4 / 5     │          │  ┌──────────────────────┐
│          │   WORKOUTS   │          │  │  LETZTE WORKOUTS     │
│          │              │          │  │  ├─ Mo: Push (58min) │
│          ╰──────────────╯          │  │  ├─ Sa: Pull (62min) │
│                                    │  │  └─ Do: Beine (45min)│
│       Heute: Mo, 13. Januar        │  └──────────────────────┘
│       🔥 12 Tage Streak            │  ┌──────────────────────┐
│                                    │  │  TREND (7 TAGE)      │
│                                    │  │  [Mini Area Chart]   │
└────────────────────────────────────┘  └──────────────────────┘
                                        ┌──────────────────────┐
                                        │ + WORKOUT STARTEN    │
                                        └──────────────────────┘
```

### What Appears on Hover
- Workout cards: subtle lift effect (translateY -2px), show "Details →" text
- Progress ring segments: tooltip showing workout date/type
- Nutrition bars: exact numbers appear

### Clickable/Interactive Areas
- Progress ring: click to open modal with weekly workout list
- Each workout in "Letzte Workouts": click to see full exercise log
- "Workout starten" button: opens workout logging form
- Nutrition card: click to see full meal breakdown

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Workouts diese Woche
- **Data source:** `workouts` app
- **Calculation:** Count of workouts where `datum` is within current week (Monday-Sunday) AND `rest_day` is false
- **Display:** Large circular progress ring with thick stroke. Center shows fraction (e.g., "4/5"). Ring fills clockwise from top.
- **Context shown:** Progress toward weekly goal (from `ziele` app, `trainingstage_pro_woche` field). Ring shows percentage filled.
- **Why this is the hero:** Weekly training consistency is the single most important factor in fitness progress. Users need instant emotional feedback on whether they're on track.

### Secondary KPIs

**Today's Calories**
- Source: `ernaehrung` app
- Calculation: Sum of `kalorien` where `datum` = today
- Format: number with thousands separator, "kcal" suffix
- Display: Compact card with horizontal progress bar, current vs. goal (from `ziele.taeglich_kalorien`)

**Today's Protein**
- Source: `ernaehrung` app
- Calculation: Sum of `protein` where `datum` = today
- Format: number with "g" suffix
- Display: Compact card with horizontal progress bar, current vs. goal (from `ziele.taeglich_protein`)

**Current Weight**
- Source: `koerperdaten` app
- Calculation: Latest `gewicht_kg` value (most recent `datum`)
- Format: number with 1 decimal, "kg" suffix
- Display: Small stat chip on mobile, inline text on desktop

**Training Streak**
- Source: `workouts` app
- Calculation: Count consecutive days (going backwards from today) that have at least one workout OR are marked as intentional rest days
- Format: number with "Tage" suffix
- Display: Inline text with fire emoji 🔥

### Chart
- **Type:** Area chart - shows continuous progress flow, feels less clinical than bar chart
- **Title:** Workout-Trend (7 Tage)
- **What question it answers:** "Am I training consistently over time, or are there gaps?"
- **Data source:** `workouts` app
- **X-axis:** Last 7 days, formatted as weekday abbreviations (Mo, Di, Mi...)
- **Y-axis:** Workout duration in minutes (shows 0 for days without workouts)
- **Colors:** Terracotta fill with 30% opacity, terracotta stroke
- **Mobile simplification:** Hidden entirely on mobile—weekly ring provides enough trend info

### Lists/Tables

**Letzte Workouts**
- Purpose: Quick reference to recent training sessions, confirm logging worked
- Source: `workouts` app
- Fields shown: `datum` (formatted as weekday), `typ` (translated from lookup), `dauer_minuten`, `stimmung` (as emoji)
- Mobile style: Compact cards with horizontal layout
- Desktop style: Clean list with subtle separators
- Sort: By `datum` descending
- Limit: 5 most recent

### Primary Action Button (REQUIRED!)

- **Label:** "Workout starten"
- **Action:** add_record
- **Target app:** `workouts`
- **What data:** Form with fields: `datum` (default today), `typ` (select), `dauer_minuten` (number input), `stimmung` (select), `rest_day` (checkbox)
- **Mobile position:** bottom_fixed (sticky at bottom of viewport)
- **Desktop position:** sidebar (in right column, below other cards)
- **Why this action:** Logging workouts is THE core activity. Every gym session should be one tap away from being recorded. This drives the hero KPI.

---

## 7. Visual Details

### Border Radius
- Cards: 16px (rounded, friendly feel)
- Buttons: 12px (slightly less than cards)
- Chips/badges: 8px
- Progress bars: 4px (pill-like)

### Shadows
Subtle and warm:
- Cards: `0 2px 8px hsl(25 20% 15% / 0.06)`
- Elevated (hover): `0 4px 16px hsl(25 20% 15% / 0.1)`
- No harsh black shadows—keep it warm

### Spacing
- Page padding: 24px mobile, 48px desktop
- Card padding: 20px mobile, 24px desktop
- Between cards: 16px mobile, 20px desktop
- Between sections: 32px mobile, 40px desktop
- Hero section has extra breathing room: 40px below on mobile

### Animations
- **Page load:** Cards fade in with stagger (100ms delay each)
- **Hover effects:** Cards lift 2px with shadow increase, 150ms ease-out
- **Tap feedback:** Scale to 0.98 on press, 100ms
- **Progress ring:** Animates from 0 to current value on load, 800ms ease-out

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(38 35% 96%);
  --foreground: hsl(25 20% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(25 20% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(25 20% 15%);
  --primary: hsl(16 65% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 25% 92%);
  --secondary-foreground: hsl(25 20% 25%);
  --muted: hsl(35 25% 92%);
  --muted-foreground: hsl(25 10% 45%);
  --accent: hsl(16 65% 50%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(35 20% 88%);
  --input: hsl(35 20% 88%);
  --ring: hsl(16 65% 50%);
  --radius: 16px;
  --success: hsl(152 55% 40%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Outfit)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (hero ring dominant, bottom fixed button)
- [ ] Desktop layout matches Section 5 (65/35 split, ring on left)
- [ ] Hero progress ring is prominent as described (thick stroke, centered number)
- [ ] Colors create the warm, earthy mood described in Section 2
- [ ] Progress ring animates on load
- [ ] Workout cards are tappable/clickable
- [ ] Primary action button is always accessible
- [ ] Stimmung displays as emoji (schlecht=😫, okay=😐, gut=😊, brutal=💪)
