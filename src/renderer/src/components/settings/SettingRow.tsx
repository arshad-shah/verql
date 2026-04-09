import { Flex, Text } from '@/primitives'
import type { ReactNode } from 'react'

interface SettingRowProps {
  label: string
  description: string
  children: ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <Flex direction="row" align="center" justify="between" className="py-2">
      <div className="flex-1 min-w-0 mr-4">
        <Text size="sm" color="primary">{label}</Text>
        <Text size="xs" color="muted" className="mt-0.5">{description}</Text>
      </div>
      <div className="shrink-0">{children}</div>
    </Flex>
  )
}
