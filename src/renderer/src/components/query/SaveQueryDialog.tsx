import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@arshad-shah/cynosure-react/dialog'
import { Input } from '@arshad-shah/cynosure-react/input'
import { Button } from '@arshad-shah/cynosure-react/button'
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false}>
        <form
          onSubmit={(e) => { e.preventDefault(); onConfirm() }}
          className="flex flex-col gap-3"
        >
          <DialogHeader>
            <DialogTitle>{t('query.save.title')}</DialogTitle>
            <DialogDescription>{t('query.save.description')}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={onNameChange}
            placeholder={t('query.save.namePlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" colorScheme="neutral" size="sm" onClick={onClose}>
              {t('query.save.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              {t('query.save.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
