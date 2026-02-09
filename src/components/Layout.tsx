import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Utensils, User, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/', label: 'Übersicht', icon: Home },
  { path: '/training', label: 'Training', icon: Dumbbell },
  { path: '/ernaehrung', label: 'Ernährung', icon: Utensils },
  { path: '/koerperdaten', label: 'Körper', icon: User },
  { path: '/ziele', label: 'Ziele', icon: Target },
]

const SIDEBAR_ITEMS = [
  { path: '/', label: 'Übersicht', icon: Home },
  { path: '/training', label: 'Workouts', icon: Dumbbell },
  { path: '/workout-logs', label: 'Workout-Logs', icon: Dumbbell },
  { path: '/uebungen', label: 'Übungen', icon: Dumbbell },
  { path: '/ernaehrung', label: 'Ernährung', icon: Utensils },
  { path: '/koerperdaten', label: 'Körperdaten', icon: User },
  { path: '/ziele', label: 'Ziele', icon: Target },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar navigation */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="p-6 flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Fitness Tracker</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile: Bottom tab navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 px-3 text-[10px] font-medium transition-colors min-w-[56px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
