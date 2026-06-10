import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import { Text } from '@arshad-shah/cynosure-react/text'

/** A compact toggle row: label on the left, switch on the right. */
export function ToggleRow({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Flex direction="row" align="center" justify="between" gap="md" className="min-h-8">
      <Text size="sm" color="fg.muted">{label}</Text>
      <Switch checked={checked} onCheckedChange={onChange} ><VisuallyHidden>{label}</VisuallyHidden></Switch>
    </Flex>
  )
}
