"use client"

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  distance?: number
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  const {
    threshold = 0.3,
    delay = 0,
    duration = 0.6,
    direction = 'up',
    distance = 20
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !isRevealed) {
          setIsRevealed(true)
        }
      },
      { threshold }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, isRevealed])

  const getStyles = () => {
    const baseStyles = {
      transition: `all ${duration}s ease-out`,
      transitionDelay: `${delay}s`,
      opacity: isRevealed ? 1 : 0,
    }

    switch (direction) {
      case 'up':
        return {
          ...baseStyles,
          transform: isRevealed ? 'translateY(0)' : `translateY(${distance}px)`,
        }
      case 'down':
        return {
          ...baseStyles,
          transform: isRevealed ? 'translateY(0)' : `translateY(-${distance}px)`,
        }
      case 'left':
        return {
          ...baseStyles,
          transform: isRevealed ? 'translateX(0)' : `translateX(${distance}px)`,
        }
      case 'right':
        return {
          ...baseStyles,
          transform: isRevealed ? 'translateX(0)' : `translateX(-${distance}px)`,
        }
      case 'fade':
      default:
        return baseStyles
    }
  }

  return {
    ref: elementRef,
    style: getStyles(),
    isRevealed
  }
}
