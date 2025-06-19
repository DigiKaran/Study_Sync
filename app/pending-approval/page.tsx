"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/context/auth-context"

export default function PendingApprovalPage() {
  const router = useRouter()
  const { user, isPendingApproval, isLoading, logout } = useAuth()

  useEffect(() => {
    // If user is already approved, redirect to dashboard
    if (!isLoading && user && !isPendingApproval) {
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard/student")
      }
    }
  }, [user, isPendingApproval, isLoading, router])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold">StudySync</span>
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Account Pending Approval</CardTitle>
            <CardDescription className="text-center">
              Your account is currently pending administrator approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">What happens next?</p>
                <p className="text-sm text-amber-700 mt-1">
                  An administrator will review your account request. Once approved, you'll be able to access the system.
                  This process usually takes 1-2 business days.
                </p>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              You'll be automatically redirected to the dashboard once your account is approved. You can also try
              logging in again later.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              Back to Login
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              If you have any questions, please contact support.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
