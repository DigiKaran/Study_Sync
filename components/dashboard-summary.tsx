"use client"
import { CalendarClock, CheckCircle2, Clock, ListTodo, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useSharedData } from "@/lib/context/shared-data-context"

interface DashboardSummaryProps {
  selectedDate: Date
}

export default function DashboardSummary({ selectedDate }: DashboardSummaryProps) {
  const { tasks, isLoadingTasks, refreshTasks, timeTable, isLoadingTimeTable, refreshTimeTable } = useSharedData()

  // Calculate completion percentage
  const completedTasks = tasks.filter((task) => task.completed).length
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  // Get today's tasks
  const today = new Date()
  const todayString = today.toDateString()

  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline)
    return taskDate.toDateString() === todayString
  })

  // Get today's classes
  const day = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const todaysClasses = timeTable.filter((entry) => entry.day.toLowerCase() === day)

  // Get next class
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const upcomingClasses = todaysClasses
    .filter((entry) => {
      const [startHour, startMinute] = entry.startTime.split(":").map(Number)
      return startHour > currentHour || (startHour === currentHour && startMinute > currentMinute)
    })
    .sort((a, b) => {
      const [aHour, aMinute] = a.startTime.split(":").map(Number)
      const [bHour, bMinute] = b.startTime.split(":").map(Number)

      if (aHour !== bHour) return aHour - bHour
      return aMinute - bMinute
    })

  const nextClass = upcomingClasses.length > 0 ? upcomingClasses[0] : null

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshTimeTable(true)])
  }

  const isLoading = isLoadingTasks || isLoadingTimeTable

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard Summary</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ListTodo className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Total Tasks</h3>
              </div>
              <span className="text-2xl font-bold">{tasks.length}</span>
            </div>
            <div className="mt-2">
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Today's Tasks</h3>
              </div>
              <span className="text-2xl font-bold">{todaysTasks.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {todaysTasks.filter((t) => t.completed).length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Today's Classes</h3>
              </div>
              <span className="text-2xl font-bold">{todaysClasses.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{day.charAt(0).toUpperCase() + day.slice(1)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Next Class</h3>
              </div>
            </div>
            {nextClass ? (
              <div className="mt-2">
                <p className="font-medium">{nextClass.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {nextClass.startTime} - {nextClass.endTime} • {nextClass.location}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No more classes today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
