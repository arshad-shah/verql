import { Flex, Text, Switch } from '@/primitives'

/** A compact toggle row: label on the left, switch on the right. */
export function ToggleRow({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Flex direction="row" align="center" justify="between" gap="md" className="min-h-8">
      <Text size="sm" color="secondary">{label}</Text>
      <Switch label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Flex>
  )
}
