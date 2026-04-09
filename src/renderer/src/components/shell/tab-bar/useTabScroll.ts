import { useRef, useState, useCallback, useEffect } from 'react'

export function useTabScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateOverflow()

    el.addEventListener('scroll', updateOverflow, { passive: true })

    const observer = new ResizeObserver(updateOverflow)
    observer.observe(el)

    // Also observe children changing (tabs added/removed)
    const mutation = new MutationObserver(updateOverflow)
    mutation.observe(el, { childList: true })

    return () => {
      el.removeEventListener('scroll', updateOverflow)
      observer.disconnect()
      mutation.disconnect()
    }
  }, [updateOverflow])

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }, [])

  const scrollIntoView = useCallback((tabId: string) => {
    const el = scrollRef.current
    if (!el) return
    const tabEl = el.querySelector(`[data-tab-id="${tabId}"]`)
    if (tabEl) {
      tabEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    const el = scrollRef.current
    if (!el) return
    // Convert vertical scroll to horizontal
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
  }, [])

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
    scrollIntoView,
    onWheel,
  }
}
