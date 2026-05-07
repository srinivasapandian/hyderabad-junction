import { useState, useEffect, useRef } from 'react'

export function useInView(options = { threshold: 0.15, triggerOnce: true }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (options.triggerOnce) observer.disconnect()
        }
      },
      { threshold: options.threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.triggerOnce])

  return [ref, inView]
}
