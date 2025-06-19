"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { getUserByEmail, createUser, updateUser } from "@/lib/supabase/data-access"
import { useToast } from "@/components/ui/use-toast"
import type { User } from "@/lib/types"
// Add this import at the top of the file
import { sendWelcomeNotification } from "@/lib/services/notification-service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isPendingApproval: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      setIsLoading(true)

      try {
        // First check localStorage for demo login
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
        const storedEmail = localStorage.getItem("userEmail")
        const storedRole = localStorage.getItem("userRole")

        if (isLoggedIn && storedEmail && storedRole) {
          // Get or create user profile for demo login
          const userProfile = await getUserByEmail(storedEmail)

          if (userProfile) {
            // Check if user is approved
            if (userProfile.approved_at || storedRole === "admin") {
              setUser(userProfile as User)
              setIsPendingApproval(false)

              // Update last login time
              await updateUser(userProfile.id, {
                last_login: new Date().toISOString(),
              })
            } else {
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          } else {
            // Create demo user if it doesn't exist
            const newUser = {
              email: storedEmail,
              name: storedRole === "admin" ? "Admin User" : "Student User",
              role: storedRole,
              created_at: new Date().toISOString(),
              approved_at: new Date().toISOString(), // Auto-approve demo accounts
            }

            const createdUser = await createUser(newUser)
            if (createdUser) {
              setUser(createdUser as User)
              setIsPendingApproval(false)
            }
          }

          setIsLoading(false)
          return
        }

        // Then check Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Get user profile from our database
          const userProfile = await getUserByEmail(session.user.email!)

          if (userProfile) {
            // Check if user is approved
            if (userProfile.approved_at || userProfile.role === "admin") {
              setUser(userProfile as User)
              setIsPendingApproval(false)

              // Update last login time
              await updateUser(userProfile.id, {
                last_login: new Date().toISOString(),
              })
            } else {
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          } else {
            // If user exists in auth but not in our database, create profile
            const newUser = {
              email: session.user.email!,
              name: session.user.user_metadata.name || "User",
              role: "student", // Default role
              created_at: new Date().toISOString(),
            }

            const createdUser = await createUser(newUser)
            if (createdUser) {
              // New users need approval
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
        // Handle the error gracefully
        setUser(null)
        setIsPendingApproval(false)
      }

      setIsLoading(false)
    }

    checkSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Get user profile from our database
        const userProfile = await getUserByEmail(session.user.email!)

        if (userProfile) {
          // Check if user is approved
          if (userProfile.approved_at || userProfile.role === "admin") {
            setUser(userProfile as User)
            setIsPendingApproval(false)

            // Update last login time
            await updateUser(userProfile.id, {
              last_login: new Date().toISOString(),
            })
          } else {
            setUser(null)
            setIsPendingApproval(true)
            router.push("/pending-approval")
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setIsPendingApproval(false)
        // Clear localStorage on sign out
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("userEmail")
        localStorage.removeItem("userRole")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // For demo purposes, allow login with demo accounts
      if ((email === "admin@example.com" || email === "student@example.com") && password === "password") {
        const role = email === "admin@example.com" ? "admin" : "student"

        // Set localStorage for demo login
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userRole", role)

        try {
          const userProfile = await getUserByEmail(email)

          if (!userProfile) {
            // Create demo user if it doesn't exist
            const newUser = {
              email,
              name: role === "admin" ? "Admin User" : "Student User",
              role,
              created_at: new Date().toISOString(),
              approved_at: new Date().toISOString(), // Auto-approve demo accounts
            }

            const createdUser = await createUser(newUser)
            if (createdUser) {
              setUser(createdUser as User)
              setIsPendingApproval(false)

              toast({
                title: "Login successful",
                description: `Welcome back, ${createdUser.name}!`,
              })

              router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/student")
            }
          } else {
            // Check if user is approved
            if (userProfile.approved_at || role === "admin") {
              setUser(userProfile as User)
              setIsPendingApproval(false)

              toast({
                title: "Login successful",
                description: `Welcome back, ${userProfile.name}!`,
              })

              router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/student")
            } else {
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          }
        } catch (err) {
          console.error("Error during demo login:", err)
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "An error occurred during login. Please try again.",
          })
        }

        setIsLoading(false)
        return
      }

      // Regular Supabase auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        try {
          // Get or create user profile
          const userProfile = await getUserByEmail(data.user.email!)

          // In the login function, after setting the user:
          if (userProfile) {
            // Check if user is approved
            if (userProfile.approved_at || userProfile.role === "admin") {
              setUser(userProfile as User)
              setIsPendingApproval(false)

              // Update last login time
              await updateUser(userProfile.id, {
                last_login: new Date().toISOString(),
              })

              // Send welcome notification if it's been more than a day since last login
              const lastLogin = userProfile.last_login ? new Date(userProfile.last_login) : null
              const oneDayAgo = new Date()
              oneDayAgo.setDate(oneDayAgo.getDate() - 1)

              if (!lastLogin || lastLogin < oneDayAgo) {
                try {
                  // Send welcome back notification
                  await sendWelcomeNotification(userProfile.id, userProfile.name)
                } catch (notificationError) {
                  console.error("Error sending welcome notification:", notificationError)
                  // Continue even if notification fails
                }
              }

              toast({
                title: "Login successful",
                description: `Welcome back, ${userProfile.name}!`,
              })

              // Redirect based on user role
              router.push(userProfile.role === "admin" ? "/dashboard/admin" : "/dashboard/student")
            } else {
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          } else {
            // Create new user profile if it doesn't exist
            const newUser = {
              email: data.user.email!,
              name: data.user.user_metadata.name || "User",
              role: "student", // Default role
              created_at: new Date().toISOString(),
            }

            const createdUser = await createUser(newUser)
            if (createdUser) {
              // New users need approval
              setUser(null)
              setIsPendingApproval(true)
              router.push("/pending-approval")
            }
          }
        } catch (profileError) {
          console.error("Error fetching/creating user profile:", profileError)
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "An error occurred while retrieving your profile. Please try again.",
          })
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "An error occurred during login",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the signup function to handle existing users
  const signup = async (name: string, email: string, password: string, role: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if user already exists
      const existingUser = await getUserByEmail(email)
      if (existingUser) {
        throw new Error("A user with this email already exists. Please use a different email or try logging in.")
      }

      // For demo purposes, create a local account
      if (email === "admin@example.com" || email === "student@example.com") {
        // Set localStorage for demo signup
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userRole", role)

        // Create user profile in our database
        const newUser = {
          email,
          name,
          role,
          created_at: new Date().toISOString(),
          approved_at: new Date().toISOString(), // Auto-approve demo accounts
        }

        const createdUser = await createUser(newUser)

        if (createdUser) {
          setUser(createdUser as User)
          setIsPendingApproval(false)

          toast({
            title: "Account created",
            description: "Your account has been created successfully",
          })

          // Redirect based on role
          router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/student")
        }

        setIsLoading(false)
        return
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // Create user profile in our database
      const newUser = {
        email,
        name,
        role,
        created_at: new Date().toISOString(),
        // Only auto-approve admins for demo purposes
        approved_at: role === "admin" ? new Date().toISOString() : null,
      }

      const createdUser = await createUser(newUser)

      if (createdUser) {
        if (role === "admin") {
          setUser(createdUser as User)
          setIsPendingApproval(false)

          toast({
            title: "Account created",
            description: "Your admin account has been created successfully",
          })

          router.push("/dashboard/admin")
        } else {
          setUser(null)
          setIsPendingApproval(true)

          toast({
            title: "Account created",
            description: "Your account has been created and is pending approval",
          })

          router.push("/pending-approval")
        }
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Clear localStorage
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userRole")

      // Sign out from Supabase
      await supabase.auth.signOut()

      setUser(null)
      setIsPendingApproval(false)

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })

      router.push("/login")
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, signup, logout, isPendingApproval }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
