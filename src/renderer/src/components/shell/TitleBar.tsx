import { Flex, Text, Badge } from '@/primitives'
import { NovaMark } from '@/components/brand/NovaMark'

const isDev = import.meta.env.DEV

export function TitleBar() {
  return (
    <Flex
      align="center"
      className="drag-region h-10 bg-bg-primary px-4 border-b border-border shrink-0"
    >
      <Flex align="center" gap="sm" className="ml-20 no-drag">
        <NovaMark size={16} className="text-accent" />
        <Text size="sm" weight="semibold" color="primary" className="tracking-wide">Nova</Text>
        {isDev && (
          <Badge variant="warning" size="sm" className="text-[9px] leading-none">DEV</Badge>
        )}
      </Flex>
    </Flex>
  )
}
