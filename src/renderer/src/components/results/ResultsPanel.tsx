import { useState } from 'react'
import { ResultsGrid } from './ResultsGrid'
import { ResultsStatusBar } from './ResultsStatusBar'
import { ChartPanel } from '@/components/charts/ChartPanel'
import { QueryPlanView } from '@/components/query-plan/QueryPlanView'
import { Table2, BarChart3, GitBranch } from 'lucide-react'
import type { QueryResult } from '@shared/types'
import { Flex, Button, Text } from '@/primitives'

type ResultTab = 'grid' | 'chart' | 'plan'

interface Props {
  results: QueryResult
}

export function ResultsPanel({ results }: Props) {
  const [activeTab, setActiveTab] = useState<ResultTab>('grid')

  const tabs: { id: ResultTab; label: string; icon: typeof Table2 }[] = [
    { id: 'grid', label: 'Grid', icon: Table2 },
    { id: 'chart', label: 'Chart', icon: BarChart3 },
    { id: 'plan', label: 'Plan', icon: GitBranch }
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Flex direction="row" align="center" gap="xs" className="px-3 py-1 border-b border-border bg-bg-secondary shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="xs"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 ${
              activeTab === id ? 'text-text-primary bg-white/10' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon size={12} /> {label}
          </Button>
        ))}
      </Flex>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'grid' && (
          <>
            <ResultsGrid results={results} />
            <ResultsStatusBar results={results} />
          </>
        )}
        {activeTab === 'chart' && <ChartPanel results={results} />}
        {activeTab === 'plan' && <QueryPlanView results={results} />}
      </div>
    </div>
  )
}
