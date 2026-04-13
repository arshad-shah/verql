import { FileText, GitFork, Plug, Table2, Puzzle, Package, type LucideIcon } from 'lucide-react'
import type { Tab } from '@shared/types'

interface TabIconConfig {
  icon: LucideIcon
  className: string
}

const tabIconMap: Record<Tab['type'], TabIconConfig> = {
  query: { icon: FileText, className: 'text-blue-400' },
  'er-diagram': { icon: GitFork, className: 'text-purple-400' },
  'connection-form': { icon: Plug, className: 'text-yellow-400' },
  table: { icon: Table2, className: 'text-sky-400' },
  'plugin-detail': { icon: Puzzle, className: 'text-emerald-400' },
  'install-plugin': { icon: Package, className: 'text-orange-400' },
}

export function getTabIcon(type: Tab['type']): TabIconConfig {
  return tabIconMap[type]
}
