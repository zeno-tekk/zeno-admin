"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Eye, EyeOff, Mail, Lock, X, User, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signing, setSigning] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.replace("/admin")
    }
  }, [router])
  
  // States for admin verification modal
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(true)
  const [adminPassword, setAdminPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  
  // States for registration modal
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    const initAOS = async () => {
      if (typeof window !== "undefined") {
        const AOS = (await import("aos")).default
        AOS.init({
          duration: 1000,
          once: true,
          offset: 100,
        })
      }
    }
    initAOS()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigning(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem("token", data.token)
        router.push("/admin")
      } else {
        const err = await res.json()
        toast.error(err.message || "Login failed")
      }
    } catch (error) {
      toast.error("Login failed")
      console.error("Error logging in:", error)
    } finally {
      setSigning(false)
    }
  }

  const handleAdminVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (adminPassword === "admin") {
      toast.success("Admin verified successfully!")
      setShowAdminModal(false)
      setShowAccessModal(false)
      if (showAdminModal) {
        setShowRegisterModal(true)
      }
      setAdminPassword("")
    } else {
      toast.error("Incorrect admin password")
    }
    
    setVerifying(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required")
      return
    }
    
    if (!registerEmail.includes("@")) {
      toast.error("Please enter a valid email")
      return
    }
    
    setRegistering(true)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          firstName,
          lastName
        }),
      })

      if (res.ok) {
        toast.success("User registered successfully!")
        // Reset form
        setRegisterEmail("")
        setRegisterPassword("")
        setConfirmPassword("")
        setFirstName("")
        setLastName("")
        setShowRegisterModal(false)
      } else {
        const err = await res.json()
        toast.error(err.message || "Registration failed")
      }
    } catch (error) {
      toast.error("Registration failed")
      console.error("Error registering user:", error)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero Section with Login Form */}
      <section className="relative pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8" data-aos="fade-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                Sign in to <span className="text-primary">ZENO TEKK</span>
              </h1>
              <p className="text-muted-foreground text-pretty">
                Access your account via this authentication form.
              </p>
            </div>

            {/* Login Card */}
            <Card
              data-aos="fade-up"
              data-aos-delay="100"
              className="p-8 border-border bg-card shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="password"
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

                {/* Forgot Password */}
                <div className="flex justify-end -mt-2">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full group cursor-pointer" size="lg" disabled={signing}>
                  {signing ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Register Link */}
                <div className="pt-4 border-t border-border">
                  <p className="text-center text-sm text-muted-foreground">
                    Need an account?{" "}
                    <button
                      type="button"
                      onClick={() => setShowAdminModal(true)}
                      className="text-primary hover:underline font-medium cursor-pointer"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </form>
            </Card>

            {/* Additional Info */}
            <p className="text-center text-xs text-muted-foreground mt-6" data-aos="fade-up" data-aos-delay="200">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-lg">
          <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full p-6" data-aos="zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Admin Verification</h2>
              <button
                onClick={() => {
                  setShowAdminModal(false)
                  setAdminPassword("")
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdminVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Please enter the admin password to access user registration.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setShowAdminModal(false)
                    setAdminPassword("")
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 cursor-pointer" disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-lg">
          <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full p-6" data-aos="zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Admin Verification</h2>
            </div>
            
            <form onSubmit={handleAdminVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Please enter the admin password to access login page.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 cursor-pointer" disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" data-aos="zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Register New User
              </h2>
              <button
                onClick={() => {
                  setShowRegisterModal(false)
                  // Reset form
                  setRegisterEmail("")
                  setRegisterPassword("")
                  setConfirmPassword("")
                  setFirstName("")
                  setLastName("")
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setShowRegisterModal(false)
                    // Reset form
                    setRegisterEmail("")
                    setRegisterPassword("")
                    setConfirmPassword("")
                    setFirstName("")
                    setLastName("")
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 cursor-pointer" disabled={registering}>
                  {registering ? "Registering..." : "Register User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}