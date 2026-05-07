"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import styles from "./plasma.module.css"

type PlasmaDirection = "forward" | "reverse" | "pingpong"

interface PlasmaProps {
  color?: string
  speed?: number
  direction?: PlasmaDirection
  scale?: number
  opacity?: number
  mouseInteractive?: boolean
  className?: string
}

const FALLBACK_RGB = "255 107 53"

function hexToRgb(hex: string) {
  const sanitized = hex.trim()
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(sanitized)

  if (!result) {
    return FALLBACK_RGB
  }

  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

export default function Plasma({
  color = "#ff6b35",
  speed = 0.6,
  direction = "forward",
  scale = 1.1,
  opacity = 0.8,
  mouseInteractive = true,
  className,
}: PlasmaProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = containerRef.current

    if (!element || !mouseInteractive) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2

      element.style.setProperty("--pointer-x", `${x}px`)
      element.style.setProperty("--pointer-y", `${y}px`)
    }

    const handleMouseLeave = () => {
      element.style.setProperty("--pointer-x", "0px")
      element.style.setProperty("--pointer-y", "0px")
    }

    element.addEventListener("mousemove", handleMouseMove)
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("mousemove", handleMouseMove)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [mouseInteractive])

  const normalizedSpeed = Math.max(speed, 0.2)
  const animationDirection =
    direction === "reverse" ? "reverse" : direction === "pingpong" ? "alternate" : "normal"

  const style = {
    "--plasma-rgb": hexToRgb(color),
    "--plasma-scale": String(scale),
    "--plasma-opacity": String(opacity),
    "--plasma-duration-a": `${22 / normalizedSpeed}s`,
    "--plasma-duration-b": `${28 / normalizedSpeed}s`,
    "--plasma-duration-c": `${18 / normalizedSpeed}s`,
    "--plasma-direction": animationDirection,
    "--pointer-x": "0px",
    "--pointer-y": "0px",
  } as React.CSSProperties

  return (
    <div ref={containerRef} className={cn(styles.plasma, className)} style={style}>
      <div className={styles.glow} />
      <div className={styles.orbOne + " " + styles.orb} />
      <div className={styles.orbTwo + " " + styles.orb} />
      <div className={styles.orbThree + " " + styles.orb} />
      <div className={styles.grid} />
      <div className={styles.noise} />
      <div className={styles.vignette} />
    </div>
  )
}
