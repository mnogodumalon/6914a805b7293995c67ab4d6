---
name: frontend-impl
description: |
  Activate this skill when:
  - Implementing Dashboard.tsx
  - Following design_spec.json
  - Writing React/TypeScript code
  - Integrating with Living Apps API
  
  ⚠️ BEFORE implementing, you MUST also read:
  - living-apps-api.md (URL format: /apps/ not /app/!, date formats)
  - code-patterns.md (Dialog forms, NOT external links!)
  
  ⚠️ MUST update index.css with theme colors (never inject styles via JS!)
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Frontend Implementation Skill

You are a React/TypeScript developer. Your job is to **implement exactly what design_spec.json specifies**.

## ⚠️ DO NOT Design - Only Implement

The design decisions are already made in `design_spec.json`. Your job is to:
1. Read the spec
2. Implement it exactly
3. Ensure it works

**DO NOT:**
- Change the color scheme
- Pick different fonts
- Rearrange the layout
- Add features not in the spec

---

## Process

### Step 1: Read the Spec

```bash
cat design_spec.json
```

Understand:
- What theme/colors to use
- What KPIs to show
- What charts to create
- What the primary action is

### Step 2: Read Existing Code

```bash
cat src/types/*.ts           # Available types
cat src/services/livingAppsService.ts  # Available methods
```

### Step 3: Implement Dashboard.tsx

Create `src/pages/Dashboard.tsx` following the spec exactly:

```typescript
// 1. Imports (always use 'import type' for types!)
import { useState, useEffect } from 'react';
import type { AppType1, AppType2 } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

// 2. Implement theme from design_spec.json
// 3. Implement KPIs from design_spec.json
// 4. Implement charts from design_spec.json
// 5. Implement primary action from design_spec.json
```

### Step 4: Update index.css with Theme

⚠️ **CRITICAL: Update `src/index.css` directly! NEVER inject styles via JavaScript!**

The project uses Tailwind CSS v4 with CSS variables. You MUST update `index.css` to apply the theme from design_spec.json:

```css
/* src/index.css */

/* 1. Google Fonts FIRST (before all other imports!) */
@import url('https://fonts.googleapis.com/css2?family={Font+Name}:wght@300;500;700&display=swap');

@import "tailwindcss";
@import "tw-animate-css";

/* ... existing @theme inline block ... */

/* 2. Update :root with theme colors from design_spec.json */
/* ALWAYS use hsl() format with the full hsl() wrapper! */
:root {
  --radius: 0.625rem;
  --background: hsl(220, 18%, 8%);      /* From design_spec.json */
  --foreground: hsl(0, 0%, 98%);
  --card: hsl(220, 16%, 12%);
  --card-foreground: hsl(0, 0%, 98%);
  --primary: hsl(31, 97%, 58%);         /* Accent color */
  --primary-foreground: hsl(220, 18%, 8%);
  --muted: hsl(220, 15%, 20%);
  --muted-foreground: hsl(220, 10%, 55%);
  --border: hsl(220, 15%, 18%);
  /* Add custom colors if needed */
  --positive: hsl(142, 71%, 45%);
  --negative: hsl(0, 72%, 55%);
}

/* 3. Body styles */
@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: 'Font Name', system-ui, sans-serif;
    /* Optional: gradient background */
    background: linear-gradient(135deg, hsl(220, 18%, 8%) 0%, hsl(220, 20%, 10%) 100%);
    background-attachment: fixed;
  }
}

/* 4. Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}
```

**⚠️ NEVER DO THIS:**
```typescript
// ❌ WRONG - Dynamic style injection doesn't work properly!
const styleElement = document.createElement('style');
styleElement.textContent = `...`;
document.head.appendChild(styleElement);
```

### Step 5: Build and Test

```bash
npm run build  # Must compile without errors
```

### Step 6: Deploy

```
Call mcp__deploy_tools__deploy_to_github
```

---

## Critical Implementation Rules

### 1. Type Imports
```typescript
// ❌ WRONG
import { Workout } from '@/types/app';

// ✅ CORRECT
import type { Workout } from '@/types/app';
```

### 2. extractRecordId Always Has Null Check
```typescript
const id = extractRecordId(record.fields.relation);
if (!id) return;  // ✅ Always check!
```

### 3. Dates Without Seconds
```typescript
// For API: YYYY-MM-DDTHH:MM (no seconds!)
const dateForAPI = formData.date + 'T12:00';
```

### 4. Select Never Has Empty Value
```typescript
// ❌ WRONG
<SelectItem value="">None</SelectItem>

// ✅ CORRECT
<SelectItem value="none">None</SelectItem>
```

---

## Implementation Checklist

Before completing:

- [ ] **index.css updated** with theme colors from design_spec.json (NOT dynamic injection!)
- [ ] Font import added at TOP of index.css (before other @imports)
- [ ] CSS variables use full `hsl()` syntax (not OKLCH or space-separated)
- [ ] Colors match design_spec.json exactly
- [ ] All KPIs from spec implemented
- [ ] Chart matches spec (type, data source)
- [ ] Primary action button uses correct URL format (`/apps/` not `/app/`)
- [ ] Animations added to index.css (fadeInUp, hover-lift, etc.)
- [ ] Mobile responsive
- [ ] `npm run build` passes
- [ ] No console errors

---

## Definition of Done

The dashboard is complete when:

1. ✅ **User experience excellent**: Intuitive, clear, professional
2. ✅ **Action button uses Dialog with form** (NOT external link!)
3. ✅ All KPIs/Stats calculated correctly
4. ✅ Loading state works (Skeleton, not empty page)
5. ✅ Error handling implemented (friendly messages)
6. ✅ Empty state implemented (helpful placeholders)
7. ✅ Responsive design (Mobile + Desktop)
8. ✅ No TypeScript errors (`npm run build`)
9. ✅ No console errors in browser
10. ✅ Business logic correct
11. ✅ Living Apps API rules followed (dates, applookup, response)

---

## ⚠️ Primary Action Button Implementation

**NEVER use external links for add_record actions!**

```typescript
// ❌ WRONG - Opens external tab, data entry outside dashboard
<a href="https://my.living-apps.de/apps/..." target="_blank">
  Add Item
</a>

// ✅ CORRECT - Dialog with form, uses LivingAppsService
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger asChild>
    <Button>Add Item</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit">Save</Button>
    </form>
  </DialogContent>
</Dialog>

// Form submission uses the service:
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  await LivingAppsService.createWorkout(formData);
  // Reload data and close dialog
}

---

## UX Details - Don't Forget!

### Loading States
```typescript
if (loading) {
  return <LoadingState />;  // Use Skeleton, not spinner
}
```

### Empty States
```typescript
if (data.length === 0) {
  return (
    <EmptyState 
      title="No data yet"
      description="Get started by adding your first item"
      action={<Button>Add First Item</Button>}
    />
  );
}
```

### Error States
```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button variant="outline" onClick={retry}>Try Again</Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Success Feedback
```typescript
// Use toast for success messages
import { toast } from '@/components/ui/use-toast';

toast({
  title: "Success!",
  description: "Item saved successfully.",
});
```

### Hover States
```typescript
// Cards should have hover feedback
<Card className="hover:shadow-md transition-shadow cursor-pointer">
```

---

## ⚠️ REQUIRED READING - Read These Files NOW!

Before implementing Dashboard.tsx, you **MUST** read these files in the same directory:

1. **`living-apps-api.md`** - URL formats (/apps/ not /app/!), date formats, API rules
2. **`code-patterns.md`** - Dialog patterns, form handling, Chart examples

**Failure to read these files will result in:**
- Wrong URL format (external links instead of dialogs)
- Date format errors
- Broken API calls
