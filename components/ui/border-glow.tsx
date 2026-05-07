'use client'

import React, { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import styles from './border-glow.module.css'

interface BorderGlowProps {
  children: React.ReactNode
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
  className?: string
}

function parseColorTriplet(color: string) {
  const values = color.match(/[\d.]+/g)?.slice(0, 3).map(Number.parseFloat)

  if (!values || values.length < 3 || values.some((value) => Number.isNaN(value))) {
    return { r: 91, g: 111, b: 232 }
  }

  return {
    r: values[0],
    g: values[1],
    b: values[2],
  }
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { r, g, b } = parseColorTriplet(glowColor)
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  const vars: Record<string, string> = {}

  for (let index = 0; index < opacities.length; index += 1) {
    vars[`--glow-color${keys[index]}`] = `rgb(${r} ${g} ${b} / ${Math.min(opacities[index] * intensity, 100) / 100})`
  }

  return vars
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
]
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {}

  for (let index = 0; index < 7; index += 1) {
    const color = colors[Math.min(COLOR_MAP[index], colors.length - 1)]
    vars[GRADIENT_KEYS[index]] = `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${color} 0px, transparent 50%)`
  }

  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`

  return vars
}

function easeOutCubic(x: number) {
  return 1 - (1 - x) ** 3
}

function easeInCubic(x: number) {
  return x ** 3
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number
  end?: number
  duration?: number
  delay?: number
  ease?: (value: number) => number
  onUpdate: (value: number) => void
  onEnd?: () => void
}) {
  const startTime = performance.now() + delay

  const tick = () => {
    const elapsed = performance.now() - startTime
    const progress = Math.min(Math.max(elapsed / duration, 0), 1)
    onUpdate(start + (end - start) * ease(progress))

    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      onEnd?.()
    }
  }

  window.setTimeout(() => requestAnimationFrame(tick), delay)
}

export const BorderGlow = React.forwardRef<HTMLDivElement, BorderGlowProps>(
  (
    {
      children,
      className = '',
      edgeSensitivity = 30,
      glowColor = '91 111 232',
      backgroundColor = '#060010',
      borderColor,
      borderRadius = 28,
      glowRadius = 40,
      glowIntensity = 1,
      coneSpread = 25,
      animated = false,
      colors = ['#c084fc', '#f472b6', '#38bdf8'],
      fillOpacity = 0.5,
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement | null>(null)

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node

        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref],
    )

    const getCenterOfElement = useCallback((element: HTMLDivElement) => {
      const { width, height } = element.getBoundingClientRect()
      return [width / 2, height / 2]
    }, [])

    const getEdgeProximity = useCallback(
      (element: HTMLDivElement, x: number, y: number) => {
        const [cx, cy] = getCenterOfElement(element)
        const dx = x - cx
        const dy = y - cy
        let kx = Number.POSITIVE_INFINITY
        let ky = Number.POSITIVE_INFINITY

        if (dx !== 0) {
          kx = cx / Math.abs(dx)
        }

        if (dy !== 0) {
          ky = cy / Math.abs(dy)
        }

        return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
      },
      [getCenterOfElement],
    )

    const getCursorAngle = useCallback(
      (element: HTMLDivElement, x: number, y: number) => {
        const [cx, cy] = getCenterOfElement(element)
        const dx = x - cx
        const dy = y - cy

        if (dx === 0 && dy === 0) {
          return 0
        }

        const radians = Math.atan2(dy, dx)
        let degrees = radians * (180 / Math.PI) + 90

        if (degrees < 0) {
          degrees += 360
        }

        return degrees
      },
      [getCenterOfElement],
    )

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const card = cardRef.current

        if (!card) {
          return
        }

        const rect = card.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const edge = getEdgeProximity(card, x, y)
        const angle = getCursorAngle(card, x, y)

        card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`)
        card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
      },
      [getCursorAngle, getEdgeProximity],
    )

    useEffect(() => {
      if (!animated || !cardRef.current) {
        return
      }

      const card = cardRef.current
      const angleStart = 110
      const angleEnd = 465

      card.classList.add(styles.sweepActive)
      card.style.setProperty('--cursor-angle', `${angleStart}deg`)

      animateValue({
        duration: 500,
        onUpdate: (value) => {
          card.style.setProperty('--edge-proximity', value.toFixed(3))
        },
      })

      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: (value) => {
          const angle = (angleEnd - angleStart) * (value / 100) + angleStart
          card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
        },
      })

      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: (value) => {
          const angle = (angleEnd - angleStart) * (value / 100) + angleStart
          card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
        },
      })

      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (value) => {
          card.style.setProperty('--edge-proximity', value.toFixed(3))
        },
        onEnd: () => {
          card.classList.remove(styles.sweepActive)
        },
      })
    }, [animated])

    const style = {
      '--card-bg': backgroundColor,
      '--card-border': borderColor ?? 'rgb(255 255 255 / 0.14)',
      '--edge-sensitivity': edgeSensitivity,
      '--border-radius': `${borderRadius}px`,
      '--glow-padding': `${glowRadius}px`,
      '--cone-spread': coneSpread,
      '--fill-opacity': fillOpacity,
      ...buildGlowVars(glowColor, glowIntensity),
      ...buildGradientVars(colors),
    } as React.CSSProperties

    return (
      <div
        ref={setRefs}
        onPointerMove={handlePointerMove}
        className={cn(styles.borderGlowCard, className)}
        style={style}
      >
        <span className={styles.edgeLight} />
        <div className={styles.borderGlowInner}>{children}</div>
      </div>
    )
  },
)

BorderGlow.displayName = 'BorderGlow'
