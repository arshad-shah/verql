import { useEffect, useState } from 'react'
import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Input } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

type Provider = 'openai' | 'anthropic'

function ApiKeyField({ provider, label, description, placeholder }: {
  provider: Provider
  label: string
  description: string
  placeholder: string
}) {
  const [hasKey, setHasKey] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.electronAPI.invoke('ai:keys:has', provider).then(setHasKey).catch(() => {})
  }, [provider])

  const save = async () => {
    setSaving(true)
    try {
      await window.electronAPI.invoke('ai:keys:set', provider, draft)
      setHasKey(Boolean(draft))
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    await window.electronAPI.invoke('ai:keys:set', provider, '')
    setHasKey(false)
    setDraft('')
  }

  return (
    <SettingRow label={label} description={description}>
      <Flex gap="xs" align="center">
        <Input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          size="sm"
          className="w-72"
          placeholder={hasKey ? '••••••••  (saved)' : placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label={`${label} input`}
        />
        <Button size="sm" onClick={save} disabled={!draft || saving}>
          {hasKey ? 'Replace' : 'Save'}
        </Button>
        {hasKey && (
          <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
        )}
      </Flex>
    </SettingRow>
  )
}

export function AISettings() {
  const ai = useSettingsStore((s) => s.settings.ai ?? { openaiKey: '', anthropicKey: '', ollamaEndpoint: '' })
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>AI</Heading>
        <Text size="xs" color="muted" className="mt-1">Provider credentials and endpoints for AI Assistant</Text>
      </div>

      <ApiKeyField
        provider="openai"
        label="OpenAI API Key"
        description="Stored encrypted in the OS keyring. Used when the active provider is OpenAI."
        placeholder="sk-..."
      />

      <ApiKeyField
        provider="anthropic"
        label="Anthropic API Key"
        description="Stored encrypted in the OS keyring. Used when the active provider is Anthropic."
        placeholder="sk-ant-..."
      />

      <Divider />

      <SettingRow label="Ollama Endpoint" description="Base URL for local Ollama API">
        <Input
          value={ai.ollamaEndpoint}
          onChange={(e) => setSetting('ai.ollamaEndpoint', e.target.value)}
          size="sm"
          className="w-72"
          placeholder="http://localhost:11434"
          aria-label="Ollama endpoint"
        />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('ai')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
