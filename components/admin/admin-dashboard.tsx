"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Users, BookOpen, Calendar, LogOut, Plus, Trash2, Edit2, RefreshCw, UserCheck } from "lucide-react"
import AdminStudentList from "@/components/admin/admin-student-list"
import AdminTimeTable from "@/components/admin/admin-time-table"
import UserApproval from "@/components/admin/user-approval"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/context/auth-context"
import { useSharedData } from "@/lib/context/shared-data-context"
import { getPendingUsers } from "@/lib/supabase/data-access"
// Add this import at the top of the file
import AdminNotices from "@/components/admin/admin-notices"

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const { refreshTasks, refreshTimeTable } = useSharedData()
  const [pendingUsersCount, setPendingUsersCount] = useState(0)

  // State for students dialog
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)

  // State for courses dialog
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false)

  // State for approval dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)

  // State for events
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "End of Semester Meeting",
      date: "2025-05-15",
      time: "14:00",
      location: "Main Hall",
      description: "Review of the semester and planning for the next one.",
    },
    {
      id: 2,
      title: "Faculty Development Workshop",
      date: "2025-05-10",
      time: "09:00",
      location: "Conference Room B",
      description: "Workshop on new teaching methodologies.",
    },
    {
      id: 3,
      title: "Student Orientation",
      date: "2025-05-20",
      time: "10:00",
      location: "Auditorium",
      description: "Orientation for new students joining in the summer semester.",
    },
  ])

  // State for events dialog
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false)

  // State for add/edit event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  })

  const fetchPendingUsersCount = async () => {
    try {
      const pendingUsers = await getPendingUsers()
      setPendingUsersCount(pendingUsers.length)
    } catch (error) {
      console.error("Error fetching pending users count:", error)
      // Set to 0 to avoid breaking the UI
      setPendingUsersCount(0)
    }
  }

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in and is an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/login")
      return
    }

    // Load events from localStorage if available
    const savedEvents = localStorage.getItem("adminEvents")
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }

    // Only fetch pending users if user is admin
    if (user.role === "admin") {
      fetchPendingUsersCount()

      // Set up interval to check for pending users
      const interval = setInterval(fetchPendingUsersCount, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [user, router])

  const handleLogout = async () => {
    await logout()
  }

  const resetEventForm = () => {
    setNewEvent({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
    })
    setEditingEvent(null)
  }

  const handleOpenAddEventDialog = () => {
    resetEventForm()
    setEventDialogOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
    })
    setEventDialogOpen(true)
  }

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      const updatedEvents = events.filter((event) => event.id !== id)
      setEvents(updatedEvents)
      localStorage.setItem("adminEvents", JSON.stringify(updatedEvents))

      toast({
        title: "Event deleted",
        description: "The event has been removed from the calendar",
      })
    }
  }

  const validateEventForm = () => {
    if (!newEvent.title || newEvent.title.trim() === "") {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter an event title",
      })
      return false
    }

    if (!newEvent.date) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a date",
      })
      return false
    }

    if (!newEvent.time) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a time",
      })
      return false
    }

    return true
  }

  const handleAddEvent = () => {
    if (!validateEventForm()) {
      return
    }

    let updatedEvents

    if (editingEvent) {
      updatedEvents = events.map((event) => (event.id === editingEvent.id ? { ...newEvent, id: event.id } : event))

      toast({
        title: "Event updated",
        description: `${newEvent.title} has been updated successfully`,
      })
    } else {
      const newId = Math.max(...events.map((e) => e.id), 0) + 1
      updatedEvents = [...events, { ...newEvent, id: newId }]

      toast({
        title: "Event added",
        description: `${newEvent.title} has been added to the calendar`,
      })
    }

    setEvents(updatedEvents)
    localStorage.setItem("adminEvents", JSON.stringify(updatedEvents))
    setEventDialogOpen(false)
    resetEventForm()
  }

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= today && eventDate <= nextWeek
    })
  }

  const handleRefreshData = async () => {
    await Promise.all([refreshTimeTable(true), refreshTasks(), fetchPendingUsersCount()])

    toast({
      title: "Data refreshed",
      description: "All data has been refreshed from the database",
    })
  }

  if (!isClient || !user) return null

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">StudySync Admin</h1>
            <p className="text-muted-foreground">Manage students and schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <ModeToggle />
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Dialog open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">25</div>
                <p className="text-xs text-muted-foreground">+2 from last week</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Student Management</DialogTitle>
              <DialogDescription>View and manage all students in the system.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <AdminStudentList />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={coursesDialogOpen} onOpenChange={setCoursesDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Current semester</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Course Management</DialogTitle>
              <DialogDescription>View and manage all active courses.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <AdminTimeTable />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getUpcomingEvents().length}</div>
                <p className="text-xs text-muted-foreground">In the next 7 days</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Event Management</DialogTitle>
              <DialogDescription>View and manage upcoming events.</DialogDescription>
            </DialogHeader>

            <div className="flex justify-between items-center my-4">
              <h3 className="text-lg font-semibold">All Events</h3>
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenAddEventDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                    <DialogDescription>
                      {editingEvent
                        ? "Update the details of the event below."
                        : "Fill in the details to add a new event to the calendar."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Event Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. Faculty Meeting"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">
                        Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="time" className="text-right">
                        Time <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. Conference Room A"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="col-span-3"
                        placeholder="Brief description of the event"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex space-x-2 justify-end">
                    <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent}>{editingEvent ? "Save Changes" : "Add Event"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length > 0 ? (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{event.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Calendar className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p>No events found.</p>
                          <Button variant="link" onClick={handleOpenAddEventDialog} className="mt-1">
                            Add your first event
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingUsersCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting your review</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>User Approval</DialogTitle>
              <DialogDescription>Review and approve new user registrations.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <UserApproval />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="w-full">
        // Find the TabsList component and update it to include "notices"
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="timetable">Time Table Management</TabsTrigger>
          <TabsTrigger value="approvals">User Approvals</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="border rounded-lg p-4">
          <AdminStudentList />
        </TabsContent>
        <TabsContent value="timetable" className="border rounded-lg p-4">
          <AdminTimeTable />
        </TabsContent>
        <TabsContent value="approvals" className="border rounded-lg p-4">
          <UserApproval />
        </TabsContent>
        // Add the TabsContent for notices after the other TabsContent components
        <TabsContent value="notices" className="border rounded-lg p-4">
          <AdminNotices />
        </TabsContent>
      </Tabs>
    </div>
  )
}
