import { ExternalLink, Play, Download, Rows3 } from 'lucide-react'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  canViewData: boolean
  onViewData: () => void
  onOpenInQueryTab: () => void
  /** The driver's noun for the object (table/collection/key), for the export label. */
  objectNoun: string
  /** Collapsed rows expose "copy sample query"; pass to show the Play action. */
  onCopySampleQuery?: () => void
  /** Expanded cards expose "export table"; pass to show the Download action. */
  onExportTable?: () => void
}

/** The hover-revealed quick actions shown on a table tree node — shared by the
 *  collapsed row and the expanded card, which differ only in the trailing
 *  action (copy-sample-query vs. export-table). */
export function TableHoverActions({ canViewData, onViewData, onOpenInQueryTab, objectNoun, onCopySampleQuery, onExportTable }: Props) {
  const { t } = useTranslation()
  return (
    <span
      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => e.stopPropagation()}
    >
      {canViewData && (
        <Tooltip content={t('explorer.tooltip.viewData')} side="top">
          <IconButton
            label={t('explorer.action.viewData')}
            variant="bare"
            className="h-5 w-5 inline-flex items-center justify-center"
            onClick={onViewData}
            icon={<Rows3 size={10} />}
          />
        </Tooltip>
      )}
      <Tooltip content={t('explorer.tooltip.openInNewTab')} side="top">
        <IconButton
          label={t('explorer.action.openInQueryTab')}
          variant="bare"
          className="h-5 w-5 inline-flex items-center justify-center"
          onClick={onOpenInQueryTab}
          icon={<ExternalLink size={10} />}
        />
      </Tooltip>
      {onCopySampleQuery && (
        <Tooltip content={t('explorer.tooltip.copySampleQuery')} side="top">
          <IconButton
            label={t('explorer.action.copySampleQuery')}
            variant="bare"
            className="h-5 w-5 inline-flex items-center justify-center"
            onClick={onCopySampleQuery}
            icon={<Play size={10} />}
          />
        </Tooltip>
      )}
      {onExportTable && (
        <Tooltip content={t('explorer.tooltip.exportTable', { object: objectNoun })} side="top">
          <IconButton
            label={t('explorer.action.exportTable', { object: objectNoun })}
            variant="bare"
            className="h-5 w-5 inline-flex items-center justify-center"
            onClick={onExportTable}
            icon={<Download size={10} />}
          />
        </Tooltip>
      )}
    </span>
  )
}
