import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <GraduationCap className="h-16 w-16 text-primary" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight lg:text-5xl">StudySync</h1>
          <p className="mt-2 text-xl text-muted-foreground">Your College Task & Schedule Manager</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to StudySync</CardTitle>
            <CardDescription>Manage your college tasks and schedule efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              StudySync helps you stay organized with your college schedule, assignments, and exams. Upload your
              timetable, track your tasks, and never miss a deadline again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-medium">Task Management</h3>
            <p className="text-sm text-muted-foreground">Create, edit, and track your tasks</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-medium">Time Table</h3>
            <p className="text-sm text-muted-foreground">Manage your class schedule</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-medium">Smart Reminders</h3>
            <p className="text-sm text-muted-foreground">Never miss a deadline</p>
          </div>
        </div>
      </div>
    </main>
  )
}
