# UI Patterns Reference

## ⚠️ These Are Patterns, Not Templates

Do NOT copy these verbatim. Adapt them to each app's unique needs.

---

## Responsive Layout Patterns

### Mobile-First Page Structure
```tsx
<div className="min-h-screen bg-background">
  {/* Header - sticky on mobile */}
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b p-4">
    <h1 className="text-xl font-bold">{appName}</h1>
  </header>

  {/* Main content - responsive padding */}
  <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Content here */}
  </main>

  {/* Mobile bottom navigation (if needed) */}
  <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t">
    {/* Tab icons */}
  </nav>
</div>
```

### Responsive Grid System
```tsx
// KPI cards - 1 on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

// Main + Sidebar - stacked on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>

// Full-width on mobile, constrained on desktop
<div className="w-full max-w-2xl mx-auto">
```

---

## State Patterns

### Loading State (With Motion!)
```tsx
function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

### Empty State (Make It Helpful!)
```tsx
function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon should match app's character */}
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-accent" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {/* Specific to this app's context */}
        No data yet
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        {/* Helpful guidance, not generic text */}
        Get started by adding your first item
      </p>
      
      <Button onClick={onAction}>
        Add First Item
      </Button>
    </div>
  );
}
```

### Error State (Actionable!)
```tsx
function ErrorState({ error, onRetry }: ErrorProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{error.message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## Touch-Friendly Patterns

### Mobile Touch Targets
```tsx
// Minimum 44x44px touch targets
<Button className="min-h-[44px] min-w-[44px]">

// Larger hit areas for important actions
<Button size="lg" className="w-full h-14 text-lg">
  Primary Action
</Button>

// Swipeable cards (consider for lists)
<div className="touch-pan-x overflow-x-auto snap-x">
  {items.map(item => (
    <div key={item.id} className="snap-start min-w-[280px]">
      <Card />
    </div>
  ))}
</div>
```

### Mobile-Optimized Forms
```tsx
<form className="space-y-4">
  {/* Full-width inputs on mobile */}
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input 
      id="name" 
      className="h-12 text-base" /* Larger for touch */
      autoComplete="name"
    />
  </div>

  {/* Stack buttons on mobile, inline on desktop */}
  <div className="flex flex-col sm:flex-row gap-2 pt-4">
    <Button type="submit" className="flex-1 h-12">Save</Button>
    <Button type="button" variant="outline" className="flex-1 h-12">Cancel</Button>
  </div>
</form>
```

---

## Dialog/Modal Patterns

### Mobile-First Dialog
```tsx
<Dialog>
  <DialogContent className="
    sm:max-w-md 
    /* Full screen on mobile */
    max-h-[100dvh] sm:max-h-[85vh]
    /* Bottom sheet on mobile */
    fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
    rounded-t-xl sm:rounded-lg
    /* Safe area for mobile */
    pb-safe
  ">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    
    <div className="overflow-y-auto flex-1">
      {/* Content */}
    </div>
    
    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button className="w-full sm:w-auto">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Data Visualization Patterns

### Responsive Charts
```tsx
<div className="h-[200px] sm:h-[300px] lg:h-[400px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis 
        dataKey="name" 
        tick={{ fontSize: 12 }}
        /* Hide some labels on mobile */
        interval={isMobile ? 2 : 0}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        /* Narrower on mobile */
        width={isMobile ? 40 : 60}
      />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="var(--accent)"
        strokeWidth={2}
        dot={!isMobile} /* Hide dots on mobile */
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

### KPI Display (Adapt to Context!)
```tsx
// This is a PATTERN - adapt the content and styling to your app
function KPIDisplay({ label, value, trend, icon: Icon }: KPIProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {value}
            </p>
            {trend && (
              <p className={cn(
                "text-xs sm:text-sm mt-1",
                trend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 sm:p-3 rounded-full bg-accent/10">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Animation Patterns

### Page Enter Animation
```css
/* Add to globals.css */
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

.animate-in {
  animation: fade-in-up 0.5s ease-out forwards;
}

/* Stagger children */
.stagger-1 { animation-delay: 100ms; }
.stagger-2 { animation-delay: 200ms; }
.stagger-3 { animation-delay: 300ms; }
```

### Usage for Wow Effect
```tsx
<main className="space-y-6">
  <h1 className="animate-in">Dashboard</h1>
  
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {kpis.map((kpi, i) => (
      <KPICard 
        key={kpi.id}
        {...kpi}
        className="animate-in"
        style={{ animationDelay: `${(i + 1) * 100}ms` }}
      />
    ))}
  </div>
  
  <Card className="animate-in stagger-3">
    {/* Main chart */}
  </Card>
</main>
```

---

## Remember

1. **Analyze the app first** - What does THIS user need?
2. **Mobile first** - Start with mobile constraints
3. **One distinctive choice** - Pick one memorable design element
4. **Motion creates moments** - Focus on page load and key interactions
5. **Test both devices** - Ensure it works well on phone AND desktop
