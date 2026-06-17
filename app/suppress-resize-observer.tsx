'use client'

import { useEffect } from 'react'

export function SuppressResizeObserver() {
  useEffect(() => {
    // Suppress the ResizeObserver error that commonly occurs with Wistia video players
    const resizeObserverErrHandler = (e: ErrorEvent) => {
      if (
        e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded'
      ) {
        e.stopImmediatePropagation()
        return false
      }
    }

    window.addEventListener('error', resizeObserverErrHandler)

    return () => {
      window.removeEventListener('error', resizeObserverErrHandler)
    }
  }, [])

  return null
}
