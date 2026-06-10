import { FormField, FileContentInput, FilePathInput } from '@/primitives'
import { Select } from '@arshad-shah/cynosure-react/select'
import { Combobox } from '@arshad-shah/cynosure-react/combobox'
import { Input } from '@arshad-shah/cynosure-react/input'
import { NumberInput } from '@arshad-shah/cynosure-react/number-input'
import { useTranslation } from '@/i18n/I18nProvider'
import type { PluginField, AuthStatus } from './types'

interface Props {
  field: PluginField
  /** The raw value stored on the profile for this field (before defaulting). */
  value: unknown
  onChange: (value: unknown) => void
  authStatus: AuthStatus
  fetchableOptions: Record<string, string[]>
  className?: string
}

/** Renders a single driver-contributed connection field as the right input
 *  primitive for its `type` (select / password / number / file / file-path /
 *  text), including the "authenticate then pick" flow for fetchable selects. */
export function PluginFieldInput({ field, value: rawValue, onChange, authStatus, fetchableOptions, className }: Props) {
  const { t } = useTranslation()
  const value = rawValue ?? field.default ?? ''

  if (field.fetchable && field.type === 'select') {
    const options = fetchableOptions[field.key]
    const isAuthenticated = authStatus === 'authenticated' && options !== undefined

    if (isAuthenticated && options.length > 0) {
      return (
        <FormField label={field.label} className={className}>
          <Combobox
            size="lg"
            placeholder={t('connections.form.searchPlaceholder', { label: field.label.toLowerCase() })}
            value={String(value)}
            onValueChange={(v) => { if (v !== null) onChange(v) }}
            items={options.map(o => ({ value: o, label: o }))}
          />
        </FormField>
      )
    }

    return (
      <FormField label={field.label} className={className}>
        <Input
          value={String(value)}
          onChange={onChange}
          placeholder={authStatus === 'authenticated' ? t('connections.form.typeAValue') : t('connections.form.authenticateFirst')}
          disabled={authStatus !== 'authenticated'}
          size="lg"
        />
      </FormField>
    )
  }

  if (!field.fetchable && field.type === 'select' && field.options) {
    return (
      <FormField label={field.label} className={className}>
        <Select
          size="lg"
          value={String(value)}
          onValueChange={(v) => onChange(v)}
          items={field.options}
        />
      </FormField>
    )
  }

  if (field.type === 'password') {
    return (
      <FormField label={field.label} className={className}>
        <Input
          type="password"
          value={String(value)}
          onChange={onChange}
          size="lg"
        />
      </FormField>
    )
  }

  if (field.type === 'number') {
    return (
      <FormField label={field.label} className={className}>
        <NumberInput
          value={Number(value) || 0}
          formatOptions={{ useGrouping: false }}
          onChange={(v) => onChange(v)}
          size="lg"
        />
      </FormField>
    )
  }

  // A `file-path` field stores the chosen file's native path (e.g. the SQLite
  // database file or a private-key file the adapter reads itself). A plain
  // `file` field reads and stores the file's *contents* (e.g. an inline SSH key).
  if (field.type === 'file-path') {
    return (
      <FormField label={field.label} className={className}>
        <FilePathInput
          value={String(value)}
          onChange={(filePath) => onChange(filePath)}
          accept={field.accept}
          size="lg"
        />
      </FormField>
    )
  }

  if (field.type === 'file') {
    return (
      <FormField label={field.label} className={className}>
        <FileContentInput
          value={String(value)}
          onChange={(content) => onChange(content)}
          accept={field.accept ?? '.pem,.key'}
          size="lg"
        />
      </FormField>
    )
  }

  return (
    <FormField label={field.label} className={className}>
      <Input
        required={field.required}
        value={String(value)}
        onChange={onChange}
        size="lg"
      />
    </FormField>
  )
}
