"use client"

import { cn } from "@/lib/utils"

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/40 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
    />
  )
}

export function FoundationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/5 p-8 flex flex-col gap-4 h-52">
      <div className="flex items-center gap-4">
        <Shimmer className="h-10 w-10 rounded-xl" />
        <Shimmer className="h-3 w-24 rounded-full" />
      </div>
      <Shimmer className="h-6 w-32 rounded-lg" />
      <Shimmer className="h-4 w-full rounded-lg" />
      <Shimmer className="h-4 w-4/5 rounded-lg" />
    </div>
  )
}

export function FeatureCardSkeleton() {
  return (
    <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden flex flex-col">
      <div className="p-6 sm:p-10 flex items-start gap-4">
        <Shimmer className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <Shimmer className="h-5 w-28 rounded-lg" />
          <Shimmer className="h-3 w-full rounded-full" />
          <Shimmer className="h-3 w-3/4 rounded-full" />
        </div>
      </div>
      <div className="mt-auto p-4 pt-0">
        <div className="rounded-3xl bg-muted/30 p-6 flex flex-col gap-2">
          <Shimmer className="h-3 w-3/4 rounded-full" />
          <Shimmer className="h-3 w-1/2 rounded-full" />
          <Shimmer className="h-3 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 flex flex-col gap-4 h-auto sm:h-52">
      <div className="flex items-start justify-between">
        <Shimmer className="h-12 w-12 rounded-2xl" />
        <Shimmer className="h-4 w-4 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Shimmer className="h-5 w-36 rounded-lg" />
        <Shimmer className="h-3 w-full rounded-full" />
        <Shimmer className="h-3 w-4/5 rounded-full" />
      </div>
    </div>
  )
}

// Blog card skeleton
export function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <Shimmer className="h-52 w-full rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <Shimmer className="h-3 w-20 rounded-full" />
        <Shimmer className="h-5 w-4/5 rounded-lg" />
        <Shimmer className="h-3 w-full rounded-full" />
        <Shimmer className="h-3 w-3/4 rounded-full" />
        <div className="flex items-center gap-3 pt-2">
          <Shimmer className="h-8 w-8 rounded-full" />
          <Shimmer className="h-3 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <Shimmer className="h-60 w-full rounded-none" />
      <div className="p-6 flex flex-col gap-3">
        <Shimmer className="h-5 w-2/3 rounded-lg" />
        <Shimmer className="h-3 w-full rounded-full" />
        <Shimmer className="h-3 w-4/5 rounded-full" />
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Services page card (tall image card)
export function ServicePageCardSkeleton() {
  return (
    <Shimmer className="h-120 w-full rounded-3xl" />
  )
}

// Contact info card skeleton
export function ContactCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/5 p-8 flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
        <Shimmer className="h-10 w-10 rounded-xl" />
        <Shimmer className="h-3 w-20 rounded-full" />
      </div>
      <Shimmer className="h-7 w-36 rounded-lg" />
      <Shimmer className="h-3 w-full rounded-full" />
      <Shimmer className="h-3 w-3/4 rounded-full" />
    </div>
  )
}

// FAQ accordion skeleton
export function FAQSkeleton() {
  return (
    <div className="rounded-4xl border border-border bg-muted/10 p-8 flex flex-col gap-3">
      <Shimmer className="h-5 w-3/4 rounded-lg" />
      <Shimmer className="h-3 w-1/2 rounded-full" />
    </div>
  )
}
