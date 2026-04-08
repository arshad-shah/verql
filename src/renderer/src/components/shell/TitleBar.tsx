import { Flex, Text } from '@/primitives'

export function TitleBar() {
  return (
    <Flex
      align="center"
      className="drag-region h-10 bg-bg-primary px-4 border-b border-border shrink-0"
    >
      <Text size="sm" color="muted" className="ml-20 no-drag">dbstudio</Text>
    </Flex>
  )
}
