import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 80   // pixels naar beneden voor refresh
const MAX_PULL  = 120  // maximale trek-afstand

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY]     = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY  = useRef(0)
  const pulling = useRef(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function canPull() {
      // Alleen pull-to-refresh als pagina bovenaan staat
      return window.scrollY === 0
    }

    function onTouchStart(e) {
      if (!canPull() || refreshing) return
      startY.current  = e.touches[0].clientY
      pulling.current = false
    }

    function onTouchMove(e) {
      if (refreshing) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 10 && canPull()) {
        pulling.current = true
        e.preventDefault()
        const clamped = Math.min(dy * 0.5, MAX_PULL)
        setPullY(clamped)
      }
    }

    function onTouchEnd() {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setPullY(60)
        onRefresh().finally(() => {
          setRefreshing(false)
          setPullY(0)
        })
      } else {
        setPullY(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [refreshing, pullY, onRefresh])

  const progress = Math.min(pullY / THRESHOLD, 1)
  const showIndicator = pullY > 8 || refreshing

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Indicator */}
      {showIndicator && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: pullY || 60,
          zIndex: 50, pointerEvents: 'none',
          transition: pulling.current ? 'none' : 'height 0.3s ease',
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${0.4 + progress * 0.6}) rotate(${progress * 180}deg)`,
            transition: pulling.current ? 'none' : 'transform 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {refreshing
              ? <div style={{
                  width: 18, height: 18,
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              : <span style={{ color: 'white', fontSize: 16, lineHeight: 1 }}>↓</span>
            }
          </div>
        </div>
      )}

      {/* Content — geen transform zodat position:fixed children correct blijven */}
      <div style={{ paddingTop: pullY, transition: pulling.current ? 'none' : 'padding-top 0.3s ease' }}>
        {children}
      </div>
    </div>
  )
}
