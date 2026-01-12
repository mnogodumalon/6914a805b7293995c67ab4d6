# Design Brief: Fitness & Ernährungs-Tracker

## 1. App Analysis

### What This App Does
This is a comprehensive fitness and nutrition tracking app designed for German-speaking gym enthusiasts. It combines workout logging (exercises, sets, reps, weight), nutrition tracking (calories, macros), body measurements, and personal goals into a unified dashboard. The user can track their progress across multiple dimensions: training consistency, nutritional intake vs goals, and body composition changes over time.

### Who Uses This
Dedicated fitness enthusiasts who take their training seriously. They track their workouts religiously, care about their macros, and want to see their progress visualized. They're likely following a structured program (Push/Pull/Legs, Full Body, etc.) and want accountability. They open this app daily - after workouts to log sets, throughout the day to track meals, and periodically to check body measurements.

### The ONE Thing Users Care About Most
**"Am I on track this week?"** - Users want an immediate visual confirmation that they're meeting their training and nutrition goals. This means: workouts completed this week vs target, and today's calories/protein vs daily goal.

### Primary Actions
1. **See today's nutrition status** - How much have I eaten? Am I hitting my protein goal?
2. **Check weekly training progress** - How many workouts this week? Am I consistent?
3. **Log a new workout or meal** - Quick access to add entries
4. **Review recent workouts** - What exercises did I do? What weights?
5. **Track body weight trend** - Am I gaining/losing as planned?

---

## 2. What Makes This Design Distinctive

This design uses a **warm, earthy color palette with a deep olive-green accent** that evokes nature, health, and sustainable fitness habits - moving away from the aggressive reds and electric blues common in fitness apps. The warm cream background creates a calm, inviting space rather than the clinical white of most trackers. Typography uses **Outfit** - a geometric sans-serif that feels athletic and modern without being aggressive. The key distinctive element is the **circular progress ring** for the hero metric that pulses with energy, making daily goal tracking feel motivating rather than punitive.

---

## 3. Theme & Colors

### Font
- **Family:** Outfit
- **URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap`
- **Why this font:** Outfit is geometric and sporty, with excellent weight variation for creating hierarchy. Its rounded terminals feel approachable and healthy, not aggressive. Perfect for fitness without being cliché.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(30 10% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(30 10% 15%)` | `--card-foreground` |
| Borders | `hsl(45 15% 88%)` | `--border` |
| Primary action | `hsl(85 35% 35%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(85 40% 45%)` | `--accent` |
| Muted background | `hsl(45 20% 93%)` | `--muted` |
| Muted text | `hsl(30 5% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(145 50% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The **warm cream background** (slight yellow undertone) creates a grounded, natural feel that's easy on the eyes during frequent daily use. The **olive-green primary** is distinctive - most fitness apps use blue or red. Olive green suggests natural health, sustainable habits, and growth without the aggressive "beast mode" energy of typical gym apps. It's serious but approachable. The color scheme says "I care about my health holistically" rather than "I'm chasing PRs at any cost."

### Background Treatment
The page background is a warm cream `hsl(45 30% 97%)` - not pure white. This creates visual warmth and reduces the clinical feel. Cards float on this cream background with subtle shadows, creating depth without distraction.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### What Users See (Top to Bottom)

**Header:**
- Left: App title "Mein Fitness" in Outfit 600 weight, 20px
- Right: Current date (e.g., "So, 12. Jan") in muted text

**Hero Section (The FIRST thing users see):**
A large card containing two circular progress rings side by side:
- **Left ring:** Weekly training progress (e.g., "4/5 Workouts") - Shows workouts completed this week vs goal from Ziele
- **Right ring:** Today's protein progress (e.g., "124/150g") - Shows protein eaten today vs daily goal
- Rings are 100px diameter with 10px stroke width
- Primary color for filled portion, muted for track
- Below rings: Small text labels "Diese Woche" and "Heute Protein"
- **Why this is the hero:** These are the two metrics users check most - training consistency and daily protein. Showing both immediately answers "Am I on track?"

**Section 2: Heute's Nutrition Summary**
Horizontal card showing today's nutrition breakdown:
- Four metrics in a row: Kalorien | Protein | Carbs | Fett
- Large number (24px bold), small label below (12px muted)
- Calories show progress bar underneath (vs daily goal)
- Compact: ~80px tall total

**Section 3: Letzte Workouts**
- Section title: "Letzte Workouts" with count badge
- 3 most recent workout cards stacked vertically:
  - Each card shows: Date (left), Workout type badge (center), Duration (right)
  - Colored left border indicating workout type (Push=olive, Pull=teal, Beine=amber, etc.)
  - Tap to expand would show exercises (but not implemented in MVP)

**Section 4: Körper-Trend**
- Small sparkline chart (area chart) showing body weight over last 30 days
- Current weight displayed large (e.g., "78.5 kg")
- Small delta showing change (e.g., "↓ 0.8 kg" in last 30 days)
- ~120px tall

**Bottom Navigation / Action:**
- No fixed bottom nav (scroll is fine)
- Floating action button (FAB) in bottom-right corner
- Primary color, "+" icon
- On tap: Opens sheet with quick add options (Workout, Mahlzeit, Körperdaten)

### What is HIDDEN on Mobile
- Detailed workout logs (exercises, sets, reps) - too much detail for overview
- Body measurement history beyond weight - chart only shows weight
- Extended nutrition history - only today shown
- Goal editing interface - separate screen

### Touch Targets
- All interactive elements minimum 44x44px
- Cards have full-width tap area
- FAB is 56px diameter
- Progress rings are display only (not tappable)

---

## 5. Desktop Layout

### Overall Structure
Two-column layout with a maximum width of 1200px, centered. Generous padding (32px) creates breathing room.

### Column Layout
- **Left column (60%):** Hero metrics + Nutrition today + Recent workouts list
- **Right column (40%):** Body weight chart (taller) + Quick stats cards

### Header (Desktop)
- Full-width header bar
- Left: "Mein Fitness" title + current date
- Right: (future: settings icon, profile)

### What Appears on Hover
- Workout cards: Subtle elevation increase + border color intensifies
- Cards: Shadow deepens slightly
- FAB: Scale up 1.05x

### Desktop-Specific Elements
- Body weight chart is larger (240px height) with more data points visible
- Recent workouts shows 5 entries instead of 3
- Nutrition card shows weekly average alongside today's values

---

## 6. Components

### Hero KPI: Dual Progress Rings
The MOST important metric that users see first.

**Training Progress Ring (Left)**
- **Title:** "Diese Woche"
- **Data source:** Workouts app - count records where `datum` is within current week and `rest_day` is not true
- **Goal source:** Ziele app - `trainingstage_pro_woche` field from active goal
- **Calculation:** Count of workouts this week / weekly target
- **Display:** Circular progress ring, 100px diameter, 10px stroke
- **Color:** Primary (olive) for filled, muted for track
- **Center text:** "4/5" format - large current number, small /goal

**Protein Progress Ring (Right)**
- **Title:** "Heute Protein"
- **Data source:** Ernährung app - sum of `protein` where `datum` is today
- **Goal source:** Ziele app - `taeglich_protein` from active goal
- **Calculation:** Sum of today's protein / daily target
- **Display:** Same ring style as training
- **Color:** Accent (lighter olive) for filled

**Why this is the hero:** Users obsess over two things: "Did I train enough this week?" and "Did I hit my protein today?" Both questions answered instantly with visual rings.

### Secondary KPIs

**Today's Calories**
- Source: Ernährung (sum of `kalorien` where `datum` = today)
- Goal: Ziele `taeglich_kalorien`
- Format: Number with "kcal" suffix
- Display: Progress bar below number

**Today's Macros (Carbs, Fett)**
- Source: Ernährung (sum of respective fields where `datum` = today)
- Format: Number with "g" suffix
- Display: Inline in horizontal card, no progress bars (protein already shown in hero)

**Current Body Weight**
- Source: Köperdaten - most recent entry's `gewicht_kg`
- Format: Number with "kg" suffix, 1 decimal
- Display: Large number above sparkline chart

**Weight Change**
- Source: Compare most recent `gewicht_kg` to entry 30 days ago
- Format: Signed number with "kg" suffix (e.g., "-0.8 kg")
- Display: Small text, colored (green if loss, red if gain - assume weight loss goal)

### Chart: Body Weight Trend

- **Type:** Area chart with gradient fill - WHY: Area charts show trends clearly and the fill creates visual weight that draws the eye. Better than line alone for showing "progress over time."
- **Title:** "Gewichtsverlauf"
- **What question it answers:** "Is my weight trending in the right direction?"
- **Data source:** Köperdaten app - `datum` and `gewicht_kg` fields
- **X-axis:** Date, formatted "DD.MM" (German format)
- **Y-axis:** Weight in kg, auto-scaled with some padding
- **Color:** Primary color with 20% opacity fill
- **Mobile simplification:** Last 30 days, fewer X-axis labels (every 7 days)
- **Desktop:** Last 60 days, labels every 14 days

### Lists: Recent Workouts

**Section Name:** Letzte Workouts

- **Purpose:** Quick reference to recent training - what type, when, how long
- **Source:** Workouts app, sorted by `datum` descending
- **Fields shown:**
  - `datum` - formatted "dd.MM" (e.g., "12.01")
  - `typ` - displayed as badge with translated label
  - `dauer_minuten` - formatted as "X min"
  - `stimmung` - small emoji or icon indicator
- **Mobile style:** Compact cards with colored left border
- **Desktop style:** Same cards, slightly more spacing
- **Sort:** By `datum` descending
- **Limit:** Mobile: 3, Desktop: 5
- **Empty state:** "Noch keine Workouts - Zeit loszulegen!"

**Workout Type Colors (Left Border):**
- Push: `hsl(85 35% 35%)` (olive - primary)
- Pull: `hsl(175 40% 35%)` (teal)
- Beine: `hsl(35 60% 50%)` (amber)
- Ganzkörper: `hsl(260 40% 50%)` (purple)
- Cardio: `hsl(350 60% 50%)` (coral)
- Others: `hsl(30 5% 45%)` (muted)

**Stimmung Indicators:**
- schlecht: 😓
- okay: 😐
- gut: 😊
- brutal: 💪

### Primary Action Button (FAB)

- **Label:** "+" icon (no text)
- **Action:** Opens a bottom sheet with options: "Workout loggen", "Mahlzeit eintragen", "Körperdaten"
- **Target:** Each option would navigate to respective form (future implementation)
- **Mobile position:** Fixed bottom-right, 16px from edges
- **Desktop position:** Fixed bottom-right, 24px from edges
- **Size:** 56px diameter
- **Color:** Primary with white icon
- **Shadow:** Elevated (lg shadow)

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, friendly)
- Buttons: 8px
- Badges: 999px (pill)
- Progress bars: 999px (pill)
- FAB: 50% (circle)

### Shadows
Subtle but present - creates depth without heaviness:
- Cards: `0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)`
- Cards on hover: `0 2px 6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)`
- FAB: `0 4px 12px rgba(0,0,0,0.15)`

### Spacing
Normal to spacious - fitness dashboards need breathing room:
- Page padding: 16px mobile, 32px desktop
- Card padding: 16px mobile, 20px desktop
- Between cards: 12px mobile, 16px desktop
- Between sections: 24px mobile, 32px desktop

### Animations
- **Page load:** Cards fade in with subtle stagger (50ms delay between cards)
- **Hover effects:** 150ms ease-out transition on shadow and border color
- **Progress rings:** Animate from 0 to value on load (1s ease-out)
- **Chart:** Lines draw in from left (0.8s)
- **FAB hover:** Scale 1.05x with 150ms ease

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(45 30% 97%);
  --foreground: hsl(30 10% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(30 10% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(30 10% 15%);
  --primary: hsl(85 35% 35%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 93%);
  --secondary-foreground: hsl(30 10% 25%);
  --muted: hsl(45 20% 93%);
  --muted-foreground: hsl(30 5% 45%);
  --accent: hsl(85 40% 45%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(45 15% 88%);
  --input: hsl(45 15% 88%);
  --ring: hsl(85 35% 35%);
  --radius: 0.75rem;
}
```

---

## 9. Lookup Value Translations

For display purposes, translate these lookup keys:

**Workout Types (typ):**
- push → "Push"
- pull → "Pull"
- beine → "Beine"
- ganzkoerper → "Ganzkörper"
- oberkoerper → "Oberkörper"
- unterkoerper → "Unterkörper"
- cardio → "Cardio"
- sonstiges → "Sonstiges"

**Stimmung:**
- schlecht → "😓"
- okay → "😐"
- gut → "😊"
- brutal → "💪"

---

## 10. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Outfit)
- [ ] All CSS variables copied exactly to index.css
- [ ] Mobile layout matches Section 4 (vertical flow, hero rings prominent)
- [ ] Desktop layout matches Section 5 (two columns, 60/40 split)
- [ ] Hero element shows dual progress rings prominently
- [ ] Colors create warm, earthy mood described in Section 2
- [ ] Workout type badges use correct colors
- [ ] Body weight chart uses area fill with primary color
- [ ] FAB is fixed position with proper styling
- [ ] Empty states handled gracefully
- [ ] All data fetched from LivingAppsService
- [ ] Dates formatted in German format (DD.MM.YYYY)
- [ ] Numbers formatted appropriately (1 decimal for weight)
