"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl w-full">
        <Image
          src="/404.png"
          alt="Page not found"
          width={700}
          height={700}
          className="mx-auto mb-8 w-full"
          priority
        />
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </Button>
      </div>
    </div>
  )
}
