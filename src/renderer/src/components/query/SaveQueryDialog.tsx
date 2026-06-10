import { Modal, Input, Button } from '@/primitives'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  open: boolean
  name: string
  onNameChange: (name: string) => void
  onClose: () => void
  onConfirm: () => void
}

/** First-time "save query" prompt — an in-app modal (Electron's renderer has
 *  no usable `window.prompt`). */
export function SaveQueryDialog({ open, name, onNameChange, onClose, onConfirm }: Props) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={(e) => { e.preventDefault(); onConfirm() }}
        className="p-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">{t('query.save.title')}</div>
          <div className="text-xs text-text-tertiary">
            {t('query.save.description')}
          </div>
        </div>
        <Input
          autoFocus
          value={name}
          onChange={onNameChange}
          placeholder={t('query.save.namePlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('query.save.cancel')}
          </Button>
          <Button type="submit" variant="solid" size="sm" disabled={!name.trim()}>
            {t('query.save.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
