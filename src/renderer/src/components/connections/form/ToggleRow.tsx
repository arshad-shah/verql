import { Flex, Text } from '@/primitives'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'

/** A compact toggle row: label on the left, switch on the right. */
export function ToggleRow({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Flex direction="row" align="center" justify="between" gap="md" className="min-h-8">
      <Text size="sm" color="secondary">{label}</Text>
      <Switch size="lg" checked={checked} onCheckedChange={(checked) => onChange(checked)}>
        <VisuallyHidden>{label}</VisuallyHidden>
      </Switch>
    </Flex>
  )
}
