"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, Copy, Check } from "lucide-react"
import { toast } from "sonner"

type Step = "credentials" | "otp" | "done"

export default function PortalPage() {
  const [step, setStep] = useState<Step>("credentials")

  // Credentials form
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // OTP form
  const [otp, setOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Result
  const [adminPassword, setAdminPassword] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin-password/portal-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "Authentication failed")
        return
      }
      if (data.requiresOtp) {
        toast.info("A verification code has been sent to your email.")
        setStep("otp")
      } else {
        setAdminPassword(data.adminPassword)
        setShowModal(true)
        setStep("done")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyingOtp(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin-password/portal-access-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "Invalid or expired code")
        return
      }
      setAdminPassword(data.adminPassword)
      setShowModal(true)
      setStep("done")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(adminPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseModal = () => {
    setAdminPassword("")
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-primary">ZENO TEKK</span>
          </h1>
          <p className="text-muted-foreground">Admin Platform</p>
        </div>

        <Card className="p-8 border-border bg-card shadow-2xl">
          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Verify your identity</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your account credentials to continue.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full group" size="lg" disabled={submitting}>
                {submitting ? "Verifying..." : "Continue"}
                {!submitting && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtp} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-1">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{email}</span>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full group" size="lg" disabled={verifyingOtp}>
                {verifyingOtp ? "Verifying..." : "Verify Code"}
                {!verifyingOtp && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setOtp("") }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {step === "done" && !showModal && (
            <div className="text-center space-y-3 py-4">
              <p className="text-muted-foreground text-sm">The password has been dismissed.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Admin password reveal modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Admin Site Password</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Copy this password now. Once you close this dialog it will not be shown again.
            </p>

            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono break-all select-all">
                {adminPassword}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <Button variant="destructive" className="w-full" onClick={handleCloseModal}>
              I&apos;ve copied it — close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
