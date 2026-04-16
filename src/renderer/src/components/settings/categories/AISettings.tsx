import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Input } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

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

      <SettingRow label="OpenAI API Key" description="Used when the active provider is OpenAI">
        <Input
          type="password"
          value={ai.openaiKey}
          onChange={(e) => setSetting('ai.openaiKey', e.target.value)}
          size="sm"
          className="w-72"
          placeholder="sk-..."
          autoComplete="off"
          spellCheck={false}
          aria-label="OpenAI API key"
        />
      </SettingRow>

      <SettingRow label="Anthropic API Key" description="Used when the active provider is Anthropic">
        <Input
          type="password"
          value={ai.anthropicKey}
          onChange={(e) => setSetting('ai.anthropicKey', e.target.value)}
          size="sm"
          className="w-72"
          placeholder="sk-ant-..."
          autoComplete="off"
          spellCheck={false}
          aria-label="Anthropic API key"
        />
      </SettingRow>

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
