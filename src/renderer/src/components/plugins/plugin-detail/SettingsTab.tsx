import { Card, Stack, EmptyState, Input, PasswordInput, NumberInput, Select } from '@/primitives'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import { SettingRow } from '@/components/settings/SettingRow'
import { useTranslation } from '@/i18n/I18nProvider'
import type { SettingSchema } from './types'

function PluginSettingControl({ setting, value, onChange }: {
  setting: SettingSchema
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (setting.type) {
    case 'boolean':
      return (
        <Switch size="lg"
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        >
          <VisuallyHidden>{setting.title}</VisuallyHidden>
        </Switch>
      )
    case 'password':
      return (
        <PasswordInput
          size="sm"
          className="w-64"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'number':
      return (
        <NumberInput
          size="sm"
          className="w-28"
          value={Number(value ?? setting.default ?? 0)}
          min={setting.min}
          max={setting.max}
          step={setting.step ?? 1}
          onChange={(v) => onChange(v)}
        />
      )
    case 'select':
      return (
        <Select
          size="sm"
          className="w-48"
          value={String(value ?? setting.default ?? '')}
          options={setting.options ?? []}
          onChange={(v) => onChange(v)}
        />
      )
    default:
      return (
        <Input
          size="sm"
          className="w-64"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

export function SettingsTab({ schema, values, onChange }: {
  schema: SettingSchema[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  const { t } = useTranslation()
  if (schema.length === 0) {
    return <EmptyState title={t('plugins.detail.settings.emptyTitle')} description={t('plugins.detail.settings.emptyDescription')} className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {schema.map((setting) => (
          <SettingRow
            key={setting.key}
            label={setting.title}
            description={setting.description ?? ''}
          >
            <PluginSettingControl
              setting={setting}
              value={values[setting.key]}
              onChange={(v) => onChange(setting.key, v)}
            />
          </SettingRow>
        ))}
      </Stack>
    </Card>
  )
}
