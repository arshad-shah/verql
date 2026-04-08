import { Database, PenSquare, BarChart3, Puzzle, Settings } from 'lucide-react'
import { useUiStore, type ActivityPanel } from '@/stores/ui'

const topItems: { id: ActivityPanel; icon: typeof Database; label: string }[] = [
  { id: 'explorer', icon: Database, label: 'Explorer' },
  { id: 'query', icon: PenSquare, label: 'Saved Queries' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions' }
]

export function ActivityBar() {
  const { activePanel, sidebarVisible, setActivePanel } = useUiStore()

  const renderButton = (id: ActivityPanel, Icon: typeof Database, label: string) => {
    const isActive = activePanel === id && sidebarVisible
    return (
      <button
        key={id}
        onClick={() => setActivePanel(id)}
        title={label}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-text-muted hover:text-text-primary hover:bg-white/5'
        }`}
      >
        <Icon size={20} />
      </button>
    )
  }

  return (
    <div className="w-12 bg-bg-primary border-r border-border flex flex-col items-center pt-2 gap-1 shrink-0">
      {topItems.map(({ id, icon, label }) => renderButton(id, icon, label))}
      <div className="flex-1" />
      {renderButton('settings', Settings, 'Settings')}
    </div>
  )
}
