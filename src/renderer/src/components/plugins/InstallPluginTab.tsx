import { useState, useCallback } from 'react'
import { Package, Upload } from 'lucide-react'
import { useToastStore } from '@/stores/toast'
import { Flex, Box, Text, Button, Spinner } from '@/primitives'
import { IPC_CHANNELS } from '@shared/ipc'

type InstallState = 'idle' | 'drag-over' | 'installing' | 'error'

export function InstallPluginTab() {
  const [state, setState] = useState<InstallState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const addToast = useToastStore((s) => s.addToast)

  const installFromPath = useCallback(async (filePath: string) => {
    setState('installing')
    setErrorMessage(null)
    try {
      const result = filePath.endsWith('.zip')
        ? await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_INSTALL_FROM_ZIP, filePath)
        : await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_INSTALL_FROM_PATH, filePath)
      if (result.success) {
        addToast({ type: 'success', title: 'Plugin installed', message: result.name ?? undefined })
      } else {
        setErrorMessage(result.error ?? 'Installation failed')
        setState('error')
        return
      }
    } catch (err) {
      setErrorMessage((err as Error).message)
      setState('error')
      return
    }
    setState('idle')
  }, [addToast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'installing' ? s : 'drag-over'))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'installing' ? s : 'idle'))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (state === 'installing') return
      const files = e.dataTransfer.files
      if (files.length === 0) return
      const file = files[0]
      const filePath = (file as File & { path?: string }).path
      if (!filePath) return
      installFromPath(filePath)
    },
    [state, installFromPath]
  )

  const handleBrowse = useCallback(async () => {
    if (state === 'installing') return
    const filePath = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_OPEN_INSTALL_DIALOG)
    if (!filePath) return
    installFromPath(filePath)
  }, [state, installFromPath])

  const isOver = state === 'drag-over'
  const isInstalling = state === 'installing'

  return (
    <Flex
      align="center"
      justify="center"
      className="h-full"
      style={{ background: 'var(--color-bg-primary)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box className="w-full max-w-md px-6">
        <Flex
          direction="column"
          align="center"
          gap="md"
          className="rounded-xl py-12 px-8 transition-colors duration-150"
          style={{
            border: `2px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
            background: isOver
              ? 'color-mix(in srgb, var(--color-accent) 5%, transparent)'
              : 'var(--color-bg-secondary)',
          }}
        >
          {isInstalling ? (
            <>
              <Spinner size="md" />
              <Text size="sm" color="muted">
                Installing plugin...
              </Text>
            </>
          ) : (
            <>
              <Box
                className="rounded-full p-4"
                style={{
                  background: isOver
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'var(--color-bg-tertiary)',
                }}
              >
                {isOver ? (
                  <Upload
                    size={32}
                    style={{ color: 'var(--color-accent)' }}
                  />
                ) : (
                  <Package
                    size={32}
                    style={{ color: 'var(--color-text-disabled)' }}
                  />
                )}
              </Box>
              <Flex direction="column" align="center" gap="xs">
                <Text size="sm" weight="semibold" color="primary">
                  Drop plugin here to install
                </Text>
                <Text size="xs" color="muted">
                  .zip archive or plugin folder
                </Text>
              </Flex>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBrowse}
                className="mt-2"
              >
                Browse Files...
              </Button>
            </>
          )}
        </Flex>

        {state === 'error' && errorMessage && (
          <Box
            className="mt-3 rounded-lg px-3 py-2 text-xs"
            style={{
              background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              color: 'var(--color-error)',
              border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
            }}
          >
            {errorMessage}
          </Box>
        )}
      </Box>
    </Flex>
  )
}
