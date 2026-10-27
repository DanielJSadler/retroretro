import { useEffect, useRef, type RefObject } from 'react'

export interface NoteSize { width: number; height: number }

// Measure layout pixels, so canvas zoom never changes the shared dimensions.
export function useNoteSize(ref: RefObject<HTMLElement | null>, onSizeChange?: (size: NoteSize) => void) {
  const callback = useRef(onSizeChange)
  useEffect(() => { callback.current = onSizeChange }, [onSizeChange])
  const enabled = !!onSizeChange

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    let previous = ''
    const measure = () => {
      const size = { width: element.offsetWidth, height: element.offsetHeight }
      const key = `${size.width}:${size.height}`
      if (!size.width || !size.height || previous === key) return
      previous = key
      clearTimeout(timeout)
      timeout = setTimeout(() => callback.current?.(size), 200)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => { clearTimeout(timeout); observer.disconnect() }
  }, [ref, enabled])
}
