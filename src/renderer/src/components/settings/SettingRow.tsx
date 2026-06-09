import { SettingLabel } from '@/components/settings/SettingLabel'
import { Box, Flex } from '@/primitives'
import type { ReactNode } from 'react'

interface SettingRowProps {
  label: string
  description: string
  children: ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <Flex direction="row" align="center" justify="between" className="py-2">
      <SettingLabel label={label} description={description} />
      <Box className="shrink-0">{children}</Box>
    </Flex>
  )
}
