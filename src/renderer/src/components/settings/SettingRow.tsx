import { SettingLabel } from '@/components/settings/SettingLabel'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Flex } from '@arshad-shah/cynosure-react/flex'
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
