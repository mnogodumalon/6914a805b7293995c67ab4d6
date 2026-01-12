# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking application that allows users to log workouts, track exercise sets with weights and reps, monitor daily nutrition intake (calories, protein, carbs, fat), record body measurements over time, and set fitness goals. It connects workout sessions to individual exercise logs, creating a complete training diary.

### Who Uses This
German-speaking fitness enthusiasts who want to track their gym progress and nutrition. They're likely intermediate to advanced gym-goers who care about progressive overload (tracking weights/reps), macro tracking, and body composition changes. They want quick logging during workouts and easy review of their progress.

### The ONE Thing Users Care About Most
**"Did I train today and am I hitting my goals?"** - Users want an instant overview of their current streak, today's workout status, and daily nutrition progress. The hero must answer: Have I worked out? Am I on track with my calories/protein?

### Primary Actions (IMPORTANT!)
1. **Log a Workout** → Primary Action Button (most frequent action)
2. Add a meal/nutrition entry
3. Record body measurements

---

## 2. What Makes This Design Distinctive

This design uses a **warm terracotta and sand palette** that feels grounded and earthy - perfect for a fitness app focused on sustainable habits rather than aggressive "gains bro" culture. The combination of soft cream backgrounds with bold terracotta accents creates an inviting, premium feel. The typography uses **Outfit**, a geometric sans-serif that feels modern and athletic without being harsh. Large, confident numbers for KPIs paired with generous whitespace give the dashboard a calm, focused energy that reduces cognitive load during busy gym sessions.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit has a sporty, geometric quality that suits fitness without feeling aggressive. Its rounded terminals add warmth, and the excellent weight range (300-700) allows for strong typographic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(35 30% 96%)` | `--background` |
| Main text | `hsl(20 15% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(20 15% 15%)` | `--card-foreground` |
| Borders | `hsl(30 15% 88%)` | `--border` |
| Primary action | `hsl(15 70% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(35 60% 92%)` | `--accent` |
| Muted background | `hsl(35 20% 93%)` | `--muted` |
| Muted text | `hsl(20 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(145 60% 40%)` | (component use) |
| Error/negative | `hsl(0 70% 55%)` | `--destructive` |

### Why These Colors
The warm sand background (`hsl(35 30% 96%)`) moves away from clinical white, creating a cozy, motivating environment. Terracotta primary (`hsl(15 70% 50%)`) is energetic but not aggressive - it suggests earth, strength, and warmth. The muted text uses warm grays that feel cohesive rather than cold.

### Background Treatment
The background is a subtle warm cream (`hsl(35 30% 96%)`) - not pure white. This creates depth and makes white cards "pop" without harsh contrast. No gradients or textures - the warmth of the color itself provides visual interest.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### What Users See (Top to Bottom)

**Header:**
- App title "Fitness Tracker" left-aligned, 18px semi-bold
- Current date right-aligned, muted text, 14px
- No hamburger menu - everything accessible via scroll

**Hero Section (The FIRST thing users see):**
A large "Today's Status" card spanning full width:
- **Workout Status**: Large icon (checkmark or X) with text "Heute trainiert" / "Noch kein Training"
- **Weekly Progress**: "3/5 Trainings diese Woche" with a simple progress bar
- Size: Card takes ~200px height, status icon 48px, main text 24px bold
- Why hero: Instantly answers "Am I on track?" - the #1 question users have

**Section 2: Nutrition Today**
Horizontal scrollable row of 4 compact metric cards:
- Kalorien (with circular progress ring, 100px width)
- Protein (with circular progress ring)
- Kohlenhydrate (simple number)
- Fett (simple number)
Each card: ~100px wide, shows value/goal format like "1850/2200"

**Section 3: Recent Workouts**
Simple list showing last 3 workouts:
- Each item: Date (bold) | Workout type | Duration | Mood emoji
- Tap to expand would show exercises (future feature)
- "Alle anzeigen" link at bottom

**Section 4: Body Progress (Compact)**
Single card showing:
- Current weight (large number)
- Change from last entry ("+0.5 kg" or "-0.5 kg" with color)
- Small sparkline of last 7 entries

**Bottom Action:**
Fixed bottom button bar (80px height, safe area padding):
- Primary CTA: "Workout starten" - full-width terracotta button
- This is the #1 action and must be instantly accessible

### What is HIDDEN on Mobile
- Detailed exercise breakdown per workout
- Full body measurement history
- Goals management (separate screen)
- Chart with full date range

### Touch Targets
- All tappable items minimum 44px height
- Buttons are 52px height with 16px horizontal padding
- Generous spacing (16px) between tappable cards

---

## 5. Desktop Layout

### Overall Structure
Two-column layout with 60/40 split:
- Left column (60%): Primary content - Today's status, nutrition, recent workouts
- Right column (40%): Secondary content - Body progress chart, quick stats

Max-width container of 1200px, centered with 32px padding.

### Column Layout

**Left column (60%):**
1. Hero card: Today's workout status + weekly progress (side by side on desktop)
2. Nutrition section: 4 metric cards in a row (not scrollable)
3. Recent workouts: Table view with columns (Date, Type, Duration, Exercises, Mood)

**Right column (40%):**
1. Body weight chart: Line chart showing last 30 days
2. Goals overview: Compact list of active goals with progress
3. Quick stats card: Total workouts this month, average duration, best workout

### What Appears on Hover
- Workout list rows highlight and show "Details ansehen" arrow
- Nutrition cards show "Mahlzeit hinzufügen" tooltip
- Chart data points show exact values

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Heute trainiert? (implicit in design)
- **Data source:** `workouts` app, filtered by today's date
- **Calculation:** Boolean check - does a workout exist for today?
- **Display:** Large status card with icon (checkmark in circle = trained, empty circle = not yet)
- **Context shown:** Weekly progress bar (X/Y workouts this week based on `ziele.trainingstage_pro_woche`)
- **Why this is the hero:** Fitness consistency is built through daily habits. Users need immediate validation that they've done (or need to do) their workout.

### Secondary KPIs

**Kalorien heute**
- Source: `ernaehrung` app, filtered by today
- Calculation: Sum of `kalorien` field for today's entries
- Format: number with " kcal" suffix
- Display: Card with circular progress ring (progress = current/goal from `ziele.taeglich_kalorien`)

**Protein heute**
- Source: `ernaehrung` app, filtered by today
- Calculation: Sum of `protein` field for today's entries
- Format: number with "g" suffix
- Display: Card with circular progress ring (progress = current/goal from `ziele.taeglich_protein`)

**Kohlenhydrate heute**
- Source: `ernaehrung` app, filtered by today
- Calculation: Sum of `carbs` field
- Format: number with "g" suffix
- Display: Simple number card, no progress ring

**Fett heute**
- Source: `ernaehrung` app, filtered by today
- Calculation: Sum of `fett` field
- Format: number with "g" suffix
- Display: Simple number card, no progress ring

**Aktuelles Gewicht**
- Source: `koerperdaten` app, latest entry by `datum`
- Calculation: Latest `gewicht_kg` value
- Format: number with " kg" suffix, 1 decimal
- Display: Large number with trend indicator (compare to previous entry)

### Chart
- **Type:** Area chart - smooth, filled area shows progress over time. Area charts feel less clinical than line charts and emphasize the journey.
- **Title:** Gewichtsverlauf
- **What question it answers:** "How is my weight trending?" - Users want to see if their nutrition and training is moving them toward their goals.
- **Data source:** `koerperdaten` app
- **X-axis:** `datum` field, formatted as "DD.MM" (German date format)
- **Y-axis:** `gewicht_kg` field, labeled "kg"
- **Mobile simplification:** Show only last 14 days instead of 30, smaller height (180px vs 280px)

### Lists/Tables

**Letzte Workouts**
- Purpose: Quick review of recent training activity, motivation through seeing past efforts
- Source: `workouts` app
- Fields shown: `datum` (formatted), `typ` (translated from lookup), `dauer_minuten`, `stimmung` (as emoji)
- Mobile style: Simple stacked cards with date prominent
- Desktop style: Horizontal table rows
- Sort: By `datum` descending
- Limit: 5 items

### Primary Action Button (REQUIRED!)

- **Label:** "Workout starten"
- **Action:** add_record
- **Target app:** `workouts` (app_id: 6914a7e7b773d677cf3838c1)
- **What data:** Form with fields:
  - `datum`: Pre-filled with today's date
  - `typ`: Dropdown select (Push, Pull, Beine, etc.)
  - `dauer_minuten`: Number input
  - `stimmung`: Mood select (Schlecht, Okay, Gut, Brutal)
- **Mobile position:** bottom_fixed - Always visible at bottom of screen
- **Desktop position:** header - Top right of the page
- **Why this action:** Logging a workout is the core action of this app. Users come here primarily to record their training. Making this one-tap accessible removes friction and encourages consistent logging.

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, friendly)
- Buttons: 10px (slightly less than cards)
- Input fields: 8px
- Progress rings: full circle
- Small badges/pills: 6px

### Shadows
Subtle, warm shadows:
- Cards: `0 1px 3px hsl(20 20% 10% / 0.04), 0 4px 12px hsl(20 20% 10% / 0.06)`
- Elevated elements (modals): `0 4px 24px hsl(20 20% 10% / 0.12)`
- No harsh black shadows - keep them warm and soft

### Spacing
Normal to spacious:
- Card padding: 20px (mobile), 24px (desktop)
- Section gaps: 24px (mobile), 32px (desktop)
- Within cards: 16px gaps between elements
- Page padding: 16px (mobile), 32px (desktop)

### Animations
- **Page load:** Subtle fade-in (200ms) with slight upward movement (8px)
- **Hover effects:** Cards lift slightly (translateY -2px) with shadow increase
- **Tap feedback:** Scale down to 0.98 briefly (100ms)
- **Progress rings:** Animate from 0 to value on load (600ms, ease-out)

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(35 30% 96%);
  --foreground: hsl(20 15% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(20 15% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(20 15% 15%);
  --primary: hsl(15 70% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(35 30% 93%);
  --secondary-foreground: hsl(20 15% 25%);
  --muted: hsl(35 20% 93%);
  --muted-foreground: hsl(20 10% 45%);
  --accent: hsl(35 60% 92%);
  --accent-foreground: hsl(20 15% 15%);
  --destructive: hsl(0 70% 55%);
  --border: hsl(30 15% 88%);
  --input: hsl(30 15% 88%);
  --ring: hsl(15 70% 50%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL: `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- [ ] Font applied: `font-family: 'Outfit', sans-serif`
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (single column, fixed bottom button)
- [ ] Desktop layout matches Section 5 (60/40 split)
- [ ] Hero element shows workout status prominently
- [ ] Nutrition cards show progress rings for calories and protein
- [ ] Terracotta primary color used for main CTA
- [ ] Warm sand background (not pure white)
- [ ] "Workout starten" button opens a form/modal
- [ ] Recent workouts list shows 5 items
- [ ] Body weight chart shows trend data

---

## 10. Data Fetching Summary

| Component | App | Fields | Filter/Sort |
|-----------|-----|--------|-------------|
| Hero | workouts | datum, typ, stimmung | datum = today |
| Weekly count | workouts | datum | datum >= Monday of current week |
| Nutrition KPIs | ernaehrung | kalorien, protein, carbs, fett, datum | datum = today |
| Nutrition goals | ziele | taeglich_kalorien, taeglich_protein, trainingstage_pro_woche, status | status = "aktiv" |
| Weight chart | koerperdaten | datum, gewicht_kg | Sort by datum DESC, limit 30 |
| Current weight | koerperdaten | gewicht_kg, datum | Latest entry |
| Recent workouts | workouts | All fields | Sort by datum DESC, limit 5 |

---

## 11. Mood Emoji Mapping

For `stimmung` field in workouts:
- `schlecht` → 😫
- `okay` → 😐
- `gut` → 😊
- `brutal` → 💪

---

## 12. Workout Type Translations

For display in the UI:
- `push` → "Push"
- `pull` → "Pull"
- `beine` → "Beine"
- `ganzkoerper` → "Ganzkörper"
- `oberkoerper` → "Oberkörper"
- `unterkoerper` → "Unterkörper"
- `cardio` → "Cardio"
- `sonstiges` → "Sonstiges"
