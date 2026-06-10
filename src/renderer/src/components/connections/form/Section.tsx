import type { ReactNode } from 'react'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Text } from '@arshad-shah/cynosure-react/text'

/** A titled card that groups related connection-form fields together. */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Box className="border border-border-subtle rounded-lg bg-bg-secondary overflow-hidden">
      <Box className="px-4 py-3 border-b border-border-subtle flex flex-col">
        <Text size="sm" weight="semibold">{title}</Text>
        {description && <Text size="xs" color="fg.subtle" className="mt-0.5">{description}</Text>}
      </Box>
      <Box className="p-4">{children}</Box>
    </Box>
  )
}
