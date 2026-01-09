# Design System Reference

## ⚠️ Remember: No Generic Defaults

This file provides tokens and options—not prescriptions. Choose based on the app's unique character.

---

## ⚠️ CSS Variable Format

**ALWAYS use full `hsl()` syntax in design_spec.json and index.css!**

```css
/* ✅ CORRECT - Full hsl() wrapper */
--background: hsl(220, 18%, 8%);
--primary: hsl(31, 97%, 58%);

/* ❌ WRONG - Space-separated values (old Tailwind format) */
--background: 220 18% 8%;
--primary: 31 97% 58%;

/* ❌ WRONG - OKLCH format (not compatible with our design system) */
--background: oklch(0.145 0 0);
```

The implementation agent MUST update `src/index.css` directly, replacing the default OKLCH values with HSL values from design_spec.json.

---

## Typography

### Font Loading (Google Fonts)
```tsx
// In index.html or via @import
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Options by Character

| App Character | Font Choices | Why |
|---------------|--------------|-----|
| Technical/Dev | JetBrains Mono, Fira Code, IBM Plex Mono | Monospace = precision |
| Data/Analytics | Space Grotesk, IBM Plex Sans, Geist | Clean, readable numbers |
| Editorial/Content | Playfair Display, Crimson Pro, Newsreader | Editorial authority |
| Modern/Startup | Bricolage Grotesque, Outfit, Syne | Contemporary edge |
| Luxury/Premium | Cormorant, Tenor Sans, Josefin Sans | Elegance, restraint |

### Size Scale (Use Extremes!)

| Purpose | Size | Weight | Example |
|---------|------|--------|---------|
| Hero KPI | 48-72px | 700-900 | Main number users care about |
| Section Title | 24-32px | 600-700 | Clear hierarchy |
| Card Title | 18-20px | 500-600 | Scannable |
| Body | 14-16px | 400 | Readable content |
| Labels/Meta | 11-13px | 400-500 | Supporting info |
| Micro | 10px | 500 | Badges, timestamps |

---

## Color Palettes

### Don't Use
❌ `#007bff` (Bootstrap blue)
❌ Purple gradients on white
❌ `#f5f5f5` gray backgrounds
❌ Generic Material Design colors

### Palette Strategies

**1. Monochrome + One Accent**
```css
--background: hsl(220 20% 10%);     /* Deep blue-gray */
--foreground: hsl(220 10% 90%);     /* Light gray */
--accent: hsl(150 80% 50%);         /* Vibrant green */
```

**2. Warm & Grounded**
```css
--background: hsl(30 20% 8%);       /* Warm dark */
--foreground: hsl(30 10% 90%);      /* Cream */
--accent: hsl(25 90% 55%);          /* Burnt orange */
```

**3. Cool & Professional**
```css
--background: hsl(210 30% 8%);      /* Navy */
--foreground: hsl(210 20% 95%);     /* Ice */
--accent: hsl(190 80% 50%);         /* Cyan */
```

**4. Nature-Inspired**
```css
--background: hsl(160 30% 6%);      /* Forest dark */
--foreground: hsl(60 20% 90%);      /* Warm white */
--accent: hsl(80 60% 50%);          /* Fresh green */
```

### Chart Colors (Semantic)
```typescript
// Adapt to your palette
const CHART_COLORS = {
  primary: "var(--accent)",
  secondary: "var(--muted-foreground)",
  positive: "hsl(142 70% 45%)",     // Success green
  negative: "hsl(0 70% 50%)",       // Error red
  warning: "hsl(38 90% 50%)",       // Warning amber
  neutral: "hsl(220 10% 50%)",      // Neutral gray
};
```

---

## Spacing

### Rhythm
Use consistent spacing multiples. Pick a base (4px or 8px) and stick to it.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight grouping |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section breaks |
| `space-8` | 32px | Major sections |
| `space-12` | 48px | Page sections |

### Mobile vs Desktop
```tsx
// Tighter on mobile, more breathing room on desktop
<div className="p-4 md:p-6 lg:p-8">
<div className="gap-3 md:gap-4 lg:gap-6">
```

---

## Backgrounds & Depth

### Gradient Backgrounds
```css
/* Subtle depth */
background: linear-gradient(
  180deg,
  hsl(220 20% 10%) 0%,
  hsl(220 25% 8%) 100%
);

/* Radial glow */
background: radial-gradient(
  ellipse at top,
  hsl(220 30% 15%) 0%,
  hsl(220 20% 8%) 70%
);
```

### Geometric Patterns
```css
/* Subtle grid */
background-image: 
  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
background-size: 20px 20px;

/* Dot pattern */
background-image: radial-gradient(
  circle,
  rgba(255,255,255,0.05) 1px,
  transparent 1px
);
background-size: 16px 16px;
```

### Layered Effects
```css
/* Glass effect */
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Motion

### Staggered Page Load (Wow Moment!)
```tsx
// Each card delays slightly more
{items.map((item, i) => (
  <Card 
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${i * 100}ms` }}
  />
))}
```

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}
```

### Micro-Interactions
```css
/* Hover lift */
.card-interactive {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

/* Button press */
.btn-press:active {
  transform: scale(0.98);
}
```

---

## Responsive Breakpoints

```
xs: < 640px    → Single column, stacked layout
sm: 640px      → Two columns possible
md: 768px      → Tablet layout
lg: 1024px     → Desktop layout
xl: 1280px     → Wide desktop
2xl: 1536px    → Ultra-wide
```

### Mobile-First Pattern
```tsx
<div className="
  grid 
  grid-cols-1      /* Mobile: 1 column */
  sm:grid-cols-2   /* Tablet: 2 columns */
  lg:grid-cols-4   /* Desktop: 4 columns */
  gap-3 
  md:gap-4
">
```
