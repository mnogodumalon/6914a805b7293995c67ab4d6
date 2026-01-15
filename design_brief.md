# Design Brief: Fitness & Ernaehrung Dashboard

## 1. App Analysis

### What This App Does
This app tracks training sessions, individual exercise sets, nutrition intake, body measurements, and personal goals. It is a daily fitness companion that helps users stay consistent with workouts and nutrition, and see how their body metrics respond over time.

### Who Uses This
A non-technical fitness enthusiast who wants quick confirmation that today is on track and a simple way to log meals without digging through forms.

### The ONE Thing Users Care About Most
"Bin ich heute im Plan?" Specifically: calories (and protein) consumed today compared to the daily goal.

### Primary Actions (IMPORTANT!)
1. Mahlzeit hinzufuegen -> Primary Action Button
2. Workout loggen
3. Koerperdaten eintragen

---

## 2. What Makes This Design Distinctive

### Visual Identity
A warm linen background with deep pine-green actions and copper accents creates a grounded, premium fitness feel. The interface is calm and minimal, but the hero metric uses a bold, circular progress ring that feels like a training gauge, giving the dashboard a signature visual cue.

### Layout Strategy
The layout is intentionally asymmetric: a large hero card dominates the left, while a stacked column of smaller KPI cards on the right creates rhythm and visual tension. The hero is emphasized by size, a subtle gradient, and a conic progress ring. Secondary elements are grouped into clear sections (progress, trends, recents) with generous spacing so they support the hero without competing for attention.

### Unique Element
The hero KPI includes a thick conic gradient ring with a centered percentage and a small macro chip row beneath it. This "energy ring" is the signature element that makes the dashboard feel custom-built rather than a generic grid of cards.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap`
- **Why this font:** It feels modern and energetic without being cold, and its sharp geometry matches fitness data while staying highly readable.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(36 33% 97%)` | `--background` |
| Main text | `hsl(24 16% 14%)` | `--foreground` |
| Card background | `hsl(40 40% 99%)` | `--card` |
| Card text | `hsl(24 16% 14%)` | `--card-foreground` |
| Borders | `hsl(30 18% 86%)` | `--border` |
| Primary action | `hsl(164 45% 24%)` | `--primary` |
| Text on primary | `hsl(40 50% 98%)` | `--primary-foreground` |
| Accent highlight | `hsl(18 70% 52%)` | `--accent` |
| Muted background | `hsl(36 20% 92%)` | `--muted` |
| Muted text | `hsl(24 10% 46%)` | `--muted-foreground` |
| Success/positive | `hsl(142 45% 40%)` | (component use) |
| Error/negative | `hsl(0 70% 52%)` | `--destructive` |

### Why These Colors
Warm neutrals keep the interface approachable and calm, while the deep pine primary feels strong and athletic. The copper accent is used sparingly for highlights and the hero ring, creating a memorable, premium detail.

### Background Treatment
A subtle, layered radial gradient on the page wrapper: warm copper glow in the top-right and a faint pine tint in the bottom-left. This adds depth without looking like a colored background.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The hero dominates the first viewport with a large calorie ring and big numbers. Secondary KPIs appear as a compact vertical stack under the hero. Lists follow in a single-column flow with generous spacing.

### What Users See (Top to Bottom)

**Header:**
- App title "Fitness & Ernaehrung" left
- Today date (dd.MM.yyyy) right
- No primary button in header (primary action is bottom-fixed)

**Hero Section (The FIRST thing users see):**
- Large card with "Kalorien heute" and the big number (48px), plus a conic ring on the right
- Progress ring fills based on goal percentage, center shows percentage
- Below the number: "Ziel: X kcal" and a row of 3 macro chips (Protein, Carbs, Fett)
- This card should take ~55-60% of the first viewport height

**Section 2: Wochen-Training**
- A compact stack of 3 mini cards:
  - Workouts diese Woche
  - Saetze diese Woche
  - Letztes Gewicht

**Section 3: Gewichtstrend**
- Short line chart card, reduced height (~180px)

**Section 4: Letzte Workouts**
- Simple list cards (max 3 items)

**Section 5: Letzte Mahlzeiten**
- Simple list cards (max 3 items)

**Section 6: Aktive Ziele**
- Short list of goal entries (max 2)

**Section 7: Uebungen Atlas**
- Compact list showing top muscle groups (max 4)

**Bottom Navigation / Action:**
- Fixed full-width primary button "Mahlzeit hinzufuegen" with 52px height

### Mobile-Specific Adaptations
- Lists are limited to 3 items (2 for goals) with a subtle "Mehr anzeigen" hint text (non-clickable)
- The hero card collapses macro chips into a single row

### Touch Targets
- Primary button height 52px
- List items minimum height 44px

### Interactive Elements (if applicable)
- Only the primary action is tappable; lists are read-only summaries

---

## 5. Desktop Layout

### Overall Structure
- 12-column grid with strong asymmetry
- Eye goes: hero (left) -> KPI stack (right) -> weight chart -> recent workouts -> meals/goals
- Visual interest comes from the oversized hero and a vertical stack of smaller cards on the right

### Section Layout
- **Top header:** Title + date on left, primary action button on right
- **Row 1:**
  - Hero KPI card spans 7 columns (left)
  - Right column (5 cols) stacked cards: Workouts diese Woche, Saetze diese Woche, Letztes Gewicht, Uebungen Katalog
- **Row 2:**
  - Gewichtstrend chart spans 7 columns (left)
  - Letzte Workouts list spans 5 columns (right)
- **Row 3:**
  - Letzte Mahlzeiten list spans 7 columns (left)
  - Aktive Ziele list spans 5 columns (right)

### What Appears on Hover
- Cards lift slightly with a softer shadow
- List rows get a subtle background tint

### Clickable/Interactive Areas (if applicable)
- Only the primary action button opens a dialog form

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Kalorien heute
- **Data source:** Ernaehrung + Ziele
- **Calculation:** Sum of today's Ernaehrung.kalorien compared to daily goal from the latest Ziele record with status "aktiv" (fallback to latest record if none active)
- **Display:** Large number (48px), conic progress ring on the right with centered percentage, and a macro chip row (Protein/Carbs/Fett)
- **Context shown:** "Ziel: X kcal" and protein progress "Protein: Y / Ziel"
- **Why this is the hero:** It answers the user's daily question immediately: are they on track with nutrition today?

### Secondary KPIs

**Workouts diese Woche**
- Source: Workouts
- Calculation: Count of workouts in the current week (exclude rest_day=true)
- Format: number
- Display: Small card with subtext "Ziel: X Tage" from Ziele.trainingstage_pro_woche

**Saetze diese Woche**
- Source: Workout-Logs + Workouts
- Calculation: Count of workout_logs whose related workout date is in the current week
- Format: number
- Display: Small card

**Letztes Gewicht**
- Source: Koerperdaten
- Calculation: Latest gewicht_kg by datum; show delta vs previous entry
- Format: number with "kg"
- Display: Small card with delta text

**Uebungen Katalog**
- Source: Uebungen
- Calculation: Count of exercises + top muscle group by frequency
- Format: number
- Display: Small card with secondary line "Top: [Muskelgruppe]"

### Chart
- **Type:** Line chart (weight trend) because it best shows gradual changes over time
- **Title:** Gewichtstrend
- **What question it answers:** Is body weight trending up, down, or stable?
- **Data source:** Koerperdaten
- **X-axis:** datum (formatted dd.MM)
- **Y-axis:** gewicht_kg
- **Mobile simplification:** Fewer ticks, shorter height

### Lists/Tables

**Letzte Workouts**
- Purpose: Quick recall of recent sessions and exercise focus
- Source: Workouts + Workout-Logs + Uebungen
- Fields shown: date, training type, duration (min), total sets, top 2 exercise names
- Mobile style: simple list cards
- Desktop style: compact list inside card
- Sort: by datum desc (fallback createdat)
- Limit: 5 desktop, 3 mobile

**Letzte Mahlzeiten**
- Purpose: Verify nutrition logging and calorie intake
- Source: Ernaehrung
- Fields shown: date, meal type, calories, protein
- Mobile style: simple list cards
- Desktop style: compact list inside card
- Sort: by datum desc
- Limit: 5 desktop, 3 mobile

**Aktive Ziele**
- Purpose: Keep goals visible and actionable
- Source: Ziele
- Fields shown: status, taeglich_kalorien, taeglich_protein, trainingstage_pro_woche, schlaf_ziel_stunden, notizen (truncated)
- Mobile style: compact list
- Desktop style: list in card
- Sort: aktiv first, then newest
- Limit: 3 desktop, 2 mobile

**Uebungen Atlas**
- Purpose: Show exercise balance across muscle groups
- Source: Uebungen
- Fields shown: muscle group name + count (top 4)
- Mobile style: compact list with tiny bars
- Desktop style: same list
- Sort: count desc
- Limit: 4

**Empty + Error States**
- Empty lists/cards use the dashed Empty component with a short, helpful sentence (no extra buttons)
- Global error state uses a destructive alert with a single "Neu laden" retry button

### Primary Action Button (REQUIRED!)

- **Label:** Mahlzeit hinzufuegen
- **Action:** add_record
- **Target app:** Ernaehrung
- **What data:** datum, mahlzeit_typ, beschreibung, kalorien, protein, carbs, fett
- **Mobile position:** bottom_fixed
- **Desktop position:** header
- **Why this action:** Nutrition logging happens multiple times a day and drives the hero KPI

---

## 7. Visual Details

### Border Radius
rounded (10px)

### Shadows
subtle, soft shadow for cards; slightly stronger on hover

### Spacing
spacious (24px between sections, 16px inside cards)

### Animations
- **Page load:** staggered fade-up for cards (150ms stagger)
- **Hover effects:** card lifts + shadow increases
- **Tap feedback:** primary button scales to 0.98

### Feedback
- Success actions show a small toast in the top-right with the primary color accent

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(36 33% 97%);
  --foreground: hsl(24 16% 14%);
  --card: hsl(40 40% 99%);
  --card-foreground: hsl(24 16% 14%);
  --popover: hsl(40 40% 99%);
  --popover-foreground: hsl(24 16% 14%);
  --primary: hsl(164 45% 24%);
  --primary-foreground: hsl(40 50% 98%);
  --secondary: hsl(36 24% 94%);
  --secondary-foreground: hsl(24 16% 18%);
  --muted: hsl(36 20% 92%);
  --muted-foreground: hsl(24 10% 46%);
  --accent: hsl(18 70% 52%);
  --accent-foreground: hsl(40 50% 98%);
  --destructive: hsl(0 70% 52%);
  --border: hsl(30 18% 86%);
  --input: hsl(30 18% 86%);
  --ring: hsl(18 70% 52%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
