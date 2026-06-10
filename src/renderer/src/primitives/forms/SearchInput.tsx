import { forwardRef } from 'react'
import { SearchInput as CynSearchInput } from '@arshad-shah/cynosure-react/search-input'

export interface SearchInputProps {
  value?: string
  defaultValue?: string
  /** Called with the next query string on every change. */
  onChange?: (value: string) => void
  /** Debounced query callback — fires `debounceMs` after typing stops. */
  onSearch?: (query: string) => void
  /** Fires on Enter. */
  onSubmit?: (query: string) => void
  /** Debounce delay for `onSearch`. @default 200 */
  debounceMs?: number
  disabled?: boolean
  placeholder?: string
  /** @default "md" */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  id?: string
  'aria-label'?: string
}

/** Cynosure's SearchInput exposes only sm/md/lg; fold the wider in-house scale in. */
const SIZE_MAP = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' } as const

/**
 * Search-shaped input — a props-based wrapper over Cynosure's `SearchInput`
 * (search icon, built-in clear button, debounced `onSearch`, Enter-to-submit).
 * The only adaptation is folding the in-house `xs`/`xl` sizes onto Cynosure's
 * `sm`/`lg`. `onChange` is value-based and the clear button fires `onChange('')`,
 * so callers no longer need a separate clear handler.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { size = 'md', ...rest },
  ref
) {
  return <CynSearchInput ref={ref} size={SIZE_MAP[size]} {...rest} />
})

SearchInput.displayName = 'SearchInput'
