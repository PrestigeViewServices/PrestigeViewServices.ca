import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Snowflake,
  Sparkles,
  Users,
  UsersRound,
  Contact,
  ListChecks,
  Settings,
  Moon,
  Sun,
  MonitorSmartphone,
} from 'lucide-react'
import { useUi, type ScreenName } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from './ui'

const NAV: { screen: ScreenName; label: string; icon: typeof CalendarDays }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { screen: 'schedule', label: 'Schedule', icon: CalendarDays },
  { screen: 'planner', label: 'AI Planner', icon: Sparkles },
  { screen: 'snow', label: 'Snow Dispatch', icon: Snowflake },
  { screen: 'reports', label: 'Reports', icon: BarChart3 },
  { screen: 'workers', label: 'Workers', icon: Users },
  { screen: 'crews', label: 'Crews', icon: UsersRound },
  { screen: 'customers', label: 'Customers', icon: Contact },
  { screen: 'catalog', label: 'Services', icon: ListChecks },
  { screen: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { screen, navigate, theme, setTheme } = useUi()
  const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : MonitorSmartphone

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          PVS
        </div>
        <div>
          <div className="text-sm font-semibold leading-4">PVS Dispatch</div>
          <div className="text-[10px] text-muted-foreground">Prestige View Services</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map(({ screen: sc, label, icon: Icon }) => (
          <button
            key={sc}
            onClick={() => navigate(sc)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
              screen === sc
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-[10px] text-muted-foreground">v0.1.0 · Phase 5</span>
        <Button variant="ghost" size="icon" title={`Theme: ${theme}`} onClick={() => setTheme(nextTheme)}>
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
