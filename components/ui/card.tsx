import * as React from 'react'

import { cn } from '@/lib/utils'
import { BorderGlow } from './border-glow'

interface CardProps extends React.ComponentProps<'div'> {
  glow?: boolean
  glowProps?: {
    edgeSensitivity?: number
    glowColor?: string
    backgroundColor?: string | 'transparent'
    borderColor?: string
    borderRadius?: number
    glowRadius?: number
    glowIntensity?: number
    coneSpread?: number
    animated?: boolean
    colors?: string[]
    fillOpacity?: number
  }
}

function Card({ className, glow = false, glowProps, ...props }: CardProps) {
  if (glow) {
    return (
      <BorderGlow
        className="h-full"
        borderRadius={24}
        glowIntensity={0.8}
        edgeSensitivity={30}
        glowColor="91 111 232"
        colors={['#5b6fe8', '#7d8df0', '#c8d1ff']}
        {...glowProps}
      >
        <div
          data-slot="card"
          className={cn(
            'text-card-foreground flex h-full flex-col gap-6 rounded-[inherit] border border-transparent bg-transparent py-6 shadow-none',
            className,
          )}
          {...props}
        />
      </BorderGlow>
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
