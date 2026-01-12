# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking app that helps users monitor their workouts, nutrition intake, and body measurements over time. It connects exercise sessions (workouts) with detailed workout logs (sets, reps, weights), tracks daily meals with macro breakdowns, and records body measurements for progress tracking.

### Who Uses This
Dedicated fitness enthusiasts who are serious about tracking their progress. They want quick visibility into whether they're hitting their daily nutrition targets, staying consistent with their training schedule, and seeing their body composition change over time. They're likely German-speaking gym-goers who follow structured training programs (Push/Pull/Legs splits).

### The ONE Thing Users Care About Most
**"Am I on track today?"** - Users want to instantly see if they've hit their daily protein target, logged their workout, and stayed consistent this week. The primary concern is daily compliance with their fitness goals.

### Primary Actions
1. Check today's nutrition progress (calories & protein vs. goals)
2. See this week's workout consistency (workouts completed vs. target)
3. View recent body weight trend
4. Quick access to log new workout or meal

---

## 2. What Makes This Design Distinctive

The design evokes a premium fitness app like **Strong** or **MacroFactor** - not the cluttered, gamified look of generic fitness apps. A warm stone-gray background with a bold **coral/terracotta accent** creates an energetic yet grounded feel. The accent color appears only on progress elements (progress bars, today's stats) making goal achievement visually rewarding. Large, bold typography for numbers creates a "scoreboard" effect where hitting targets feels like winning.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, data-driven feel with distinctive character. Its geometric forms suit a fitness tracking app focused on numbers and progress, while remaining highly readable for metric displays.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(30 15% 97%)` | `--background` |
| Main text | `hsl(30 10% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(30 10% 15%)` | `--card-foreground` |
| Borders | `hsl(30 10% 90%)` | `--border` |
| Primary action | `hsl(12 76% 61%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(12 76% 61%)` | `--accent` |
| Muted background | `hsl(30 10% 94%)` | `--muted` |
| Muted text | `hsl(30 8% 46%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm off-white background (`hsl(30 15% 97%)`) avoids clinical coldness while maintaining a clean, premium feel. The coral/terracotta primary (`hsl(12 76% 61%)`) is energetic and motivating without being aggressive - it's the color of healthy skin, warmth, and vitality. This accent pops against the neutral base, making progress indicators and CTAs unmissable.

### Background Treatment
The page background uses a subtle warm off-white (`hsl(30 15% 97%)`) - not pure white. Cards are pure white (`hsl(0 0% 100%)`) to create gentle elevation without relying on heavy shadows. This layering creates depth through color rather than shadows.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### What Users See (Top to Bottom)

**Header:**
- App title "Fitness Tracker" on the left (20px, font-weight 600)
- Today's date on the right (14px, muted color)
- Simple, minimal, no icons in header

**Hero Section (The FIRST thing users see):**
A large **"Today's Progress"** card showing:
- **Protein progress ring** (120px diameter) showing percentage of daily protein goal hit
- Large number in center of ring: current protein grams
- Below ring: "von [goal]g Protein" in muted text
- This is the hero because protein intake is the #1 daily concern for fitness enthusiasts

**Section 2: Today's Macros**
A horizontal row of 3 compact stat cards:
- Calories: icon + large number + "kcal" + small progress bar
- Carbs: icon + large number + "g"
- Fett: icon + large number + "g"
Cards are white with subtle border, equal width

**Section 3: Weekly Workouts**
- Section title: "Diese Woche" (16px, semibold)
- Large number showing workouts completed this week (e.g., "4")
- Progress text: "von [goal] Trainings"
- Visual: 7 small circles for each day (Mon-Sun), filled if workout logged that day
- Tapping reveals this week's workout list

**Section 4: Body Weight Trend**
- Section title: "Gewicht" (16px, semibold)
- Large number: latest weight with "kg" suffix
- Small trend indicator: +/- vs last week
- Compact sparkline chart (last 14 days)
- Height: ~100px total

**Section 5: Recent Workouts**
- Section title: "Letzte Workouts" (16px, semibold)
- List of last 3 workouts as simple cards:
  - Workout type badge (Push, Pull, etc.)
  - Date
  - Duration in minutes
  - Mood indicator

**Bottom Navigation / Action:**
- Fixed bottom action button: "Workout starten" (coral/primary color)
- Full width with padding, 48px height
- This is the primary action - starting a new workout

### What is HIDDEN on Mobile
- Detailed body measurement history (only weight shown)
- Exercise library
- Full nutrition breakdown by meal
- Charts with long date ranges

### Touch Targets
- All tappable elements minimum 44px height
- Cards have generous padding (16px)
- The bottom CTA button is extra large for easy thumb access

---

## 5. Desktop Layout

### Overall Structure
Two-column layout with a 60/40 split. The left column contains the main metrics and charts, the right column shows lists and secondary information. Maximum content width of 1200px, centered on larger screens.

### Column Layout
- **Left column (60%)**: Hero protein ring (larger, 160px), Today's macros row, Weight chart (expanded to show 30 days), Weekly consistency visualization
- **Right column (40%)**: Recent workouts list (show 5 instead of 3), Quick actions card (Log Workout, Log Meal buttons), Active goals summary

### What Appears on Hover
- Workout cards: show full exercise list preview
- Chart data points: tooltip with exact value and date
- Macro cards: show percentage of daily goal

---

## 6. Components

### Hero KPI: Protein Progress Ring
The MOST important metric that users see first.

- **Title:** Protein heute
- **Data source:** Ernährung app (today's entries)
- **Calculation:** Sum of `protein` field for all records where `datum` = today
- **Display:** Large circular progress ring (SVG), 120px on mobile, 160px on desktop. Current value displayed as large bold number (48px) in center. Goal displayed below in muted text.
- **Context shown:** Progress toward daily goal (from Ziele app, `taeglich_protein` field)
- **Why this is the hero:** Protein intake is the single most tracked macro for muscle building. Users check this multiple times per day.

### Secondary KPIs

**Calories Today**
- Source: Ernährung (today's records)
- Calculation: Sum of `kalorien`
- Format: number with "kcal" suffix
- Display: Compact card with small progress bar underneath

**Carbs Today**
- Source: Ernährung (today's records)
- Calculation: Sum of `carbs`
- Format: number with "g" suffix
- Display: Compact stat card

**Fat Today**
- Source: Ernährung (today's records)
- Calculation: Sum of `fett`
- Format: number with "g" suffix
- Display: Compact stat card

**Workouts This Week**
- Source: Workouts (this week's records where `rest_day` !== true)
- Calculation: Count of records in current week
- Format: "X von Y"
- Display: Large number with day-of-week dots visualization

**Current Weight**
- Source: Köperdaten (latest by datum)
- Calculation: Latest `gewicht_kg` value
- Format: number with "kg" suffix, trend arrow
- Display: Large number with sparkline

### Chart: Weight Trend
- **Type:** Area chart with gradient fill (WHY: area charts show trend direction better than lines, the filled area creates visual weight showing progress)
- **Title:** Gewichtsverlauf
- **What question it answers:** "Is my weight trending in the right direction?"
- **Data source:** Köperdaten app
- **X-axis:** datum (formatted as "DD.MM" for German locale)
- **Y-axis:** gewicht_kg (kg)
- **Mobile simplification:** Show last 14 days only, minimal labels
- **Desktop:** Show last 30 days, more detailed axis labels

### Lists/Tables

**Recent Workouts List**
- Purpose: Quick reference to recent training history
- Source: Workouts app
- Fields shown: typ (as colored badge), datum (formatted), dauer_minuten, stimmung (as emoji or icon)
- Mobile style: Stacked cards with left color accent bar
- Desktop style: Same cards but in narrower column
- Sort: By datum descending
- Limit: 3 on mobile, 5 on desktop

### Primary Action Button
- **Label:** "Workout starten"
- **Action:** Opens workout logging flow (for now, placeholder alert)
- **Target:** Would navigate to workout creation
- **Mobile position:** Fixed at bottom of screen, full width
- **Desktop position:** In right sidebar, prominent button

---

## 7. Visual Details

### Border Radius
Rounded (8px) - soft enough to feel friendly, sharp enough to feel professional

### Shadows
Subtle - cards use `shadow-sm` only on hover, otherwise rely on white background against off-white page for elevation

### Spacing
Normal - 16px padding inside cards, 16px gap between cards, 24px section margins

### Animations
- **Page load:** Stagger fade-in for cards (each card 50ms delay)
- **Hover effects:** Cards lift slightly (translate-y -2px) with shadow increase
- **Tap feedback:** Quick scale down (0.98) on touch
- **Progress ring:** Animates from 0 to current value on load (1s ease-out)

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(30 15% 97%);
  --foreground: hsl(30 10% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(30 10% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(30 10% 15%);
  --primary: hsl(12 76% 61%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(30 10% 94%);
  --secondary-foreground: hsl(30 10% 25%);
  --muted: hsl(30 10% 94%);
  --muted-foreground: hsl(30 8% 46%);
  --accent: hsl(12 76% 61%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(30 10% 90%);
  --input: hsl(30 10% 90%);
  --ring: hsl(12 76% 61%);
  --chart-1: hsl(12 76% 61%);
  --chart-2: hsl(152 60% 42%);
  --chart-3: hsl(30 10% 60%);
  --chart-4: hsl(45 90% 55%);
  --chart-5: hsl(200 70% 50%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Space Grotesk)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (single column, hero ring first)
- [ ] Desktop layout matches Section 5 (two columns 60/40)
- [ ] Hero element (protein ring) is prominent as described
- [ ] Colors create the warm, energetic mood described in Section 2
- [ ] Bottom action button fixed on mobile
- [ ] Weekly workout dots visualization implemented
- [ ] Weight trend sparkline/chart implemented
- [ ] Recent workouts show type badge with appropriate color
- [ ] All data fetched from correct apps via LivingAppsService
- [ ] Date formatting uses German locale (DD.MM.YYYY)
- [ ] Loading states with skeleton components
- [ ] Empty states with helpful messaging
