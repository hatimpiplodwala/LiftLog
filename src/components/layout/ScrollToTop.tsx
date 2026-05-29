import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Reset scroll position on route change so pages don't open mid-scroll.
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
