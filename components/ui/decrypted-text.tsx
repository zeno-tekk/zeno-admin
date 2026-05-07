"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  sequential?: boolean
  revealDirection?: "start" | "end" | "center"
  useOriginalCharsOnly?: boolean
  characters?: string
  className?: string
  encryptedClassName?: string
  animateOn?: "hover" | "view" | "click"
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 8,
  sequential = true,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()",
  className = "",
  encryptedClassName = "text-primary/50",
  animateOn = "hover",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>())
  const containerRef = useRef<HTMLSpanElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasAnimatedRef = useRef(false)

  const availableChars = useMemo(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((c) => c !== " ")
      : characters.split("")
  }, [useOriginalCharsOnly, text, characters])

  const shuffleText = useCallback(
    (original: string, revealed: Set<number>) => {
      return original
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          if (revealed.has(i)) return original[i]
          return availableChars[Math.floor(Math.random() * availableChars.length)]
        })
        .join("")
    },
    [availableChars]
  )

  const getNextIndex = useCallback(
    (revealed: Set<number>) => {
      const len = text.length
      if (revealDirection === "start") return revealed.size
      if (revealDirection === "end") return len - 1 - revealed.size
      const middle = Math.floor(len / 2)
      const offset = Math.floor(revealed.size / 2)
      return revealed.size % 2 === 0 ? middle + offset : middle - offset - 1
    },
    [text.length, revealDirection]
  )

  const triggerDecrypt = useCallback(() => {
    if (isAnimating) return
    setRevealedIndices(new Set())
    setIsAnimating(true)
  }, [isAnimating])

  const resetText = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsAnimating(false)
    setRevealedIndices(new Set())
    setDisplayText(text)
  }, [text])

  useEffect(() => {
    if (!isAnimating) return

    let iteration = 0

    intervalRef.current = setInterval(() => {
      setRevealedIndices((prev) => {
        if (sequential) {
          if (prev.size >= text.length) {
            clearInterval(intervalRef.current!)
            setIsAnimating(false)
            setDisplayText(text)
            return prev
          }
          const next = new Set(prev)
          next.add(getNextIndex(prev))
          setDisplayText(shuffleText(text, next))
          return next
        } else {
          iteration++
          setDisplayText(shuffleText(text, prev))
          if (iteration >= maxIterations) {
            clearInterval(intervalRef.current!)
            setIsAnimating(false)
            setDisplayText(text)
          }
          return prev
        }
      })
    }, speed)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isAnimating, text, speed, maxIterations, sequential, shuffleText, getNextIndex])

  // View trigger
  useEffect(() => {
    if (animateOn !== "view") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true
          triggerDecrypt()
        }
      },
      { threshold: 0.1 }
    )
    const el = containerRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [animateOn, triggerDecrypt])

  const hoverProps =
    animateOn === "hover"
      ? { onMouseEnter: triggerDecrypt, onMouseLeave: resetText }
      : {}

  return (
    <span ref={containerRef} {...hoverProps} style={{ display: "inline-block", whiteSpace: "pre" }}>
      <span aria-hidden="true">
        {displayText.split("").map((char, i) => {
          const isRevealed = revealedIndices.has(i) || (!isAnimating && char === text[i])
          return (
            <span key={i} className={isRevealed ? className : encryptedClassName}
              style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>
              {char === " " ? "\u00A0" : char}
            </span>
          )
        })}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
