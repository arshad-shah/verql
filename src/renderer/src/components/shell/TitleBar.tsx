import { Database } from 'lucide-react'
import { Flex, Text, Badge } from '@/primitives'

const isDev = import.meta.env.DEV

export function TitleBar() {
  return (
    <Flex
      align="center"
      className="drag-region h-10 bg-bg-primary px-4 border-b border-border shrink-0"
    >
      <Flex align="center" gap="sm" className="ml-20 no-drag">
        <Database size={14} className="text-accent" />
        <Text size="sm" weight="semibold" color="primary">dbstudio</Text>
        {isDev && (
          <Badge variant="warning" size="sm" className="text-[9px] leading-none">DEV</Badge>
        )}
      </Flex>
    </Flex>
  )
}
