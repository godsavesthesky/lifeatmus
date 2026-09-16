import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/**
 * Memunculkan isinya sekali saat masuk viewport.
 *
 * Sengaja dipakai hemat — hanya pada dua atau tiga blok besar per halaman.
 * Kalau setiap bagian memakai efek ini, gerakannya berhenti berarti dan
 * halaman justru terasa lambat dibuka.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Kalau browser tidak mendukung IntersectionObserver, tampilkan saja.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect() // sekali muncul, selesai — tidak menghilang lagi saat digulir balik
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}