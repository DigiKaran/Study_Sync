"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Clock, MapPin, User, Download, Plus, Edit2, Trash2, RefreshCw, Filter, Search, X } from "lucide-react"
import { createTimeTableEntry, updateTimeTableEntry, deleteTimeTableEntry } from "@/lib/supabase/data-access"
import { useSharedData } from "@/lib/context/shared-data-context"
import TimeTableUpload from "./timetable-upload"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminTimeTable() {
  const [courses, setCourses] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    professor: "",
    room: "",
  })
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("manage")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Use the shared data context directly
  const {
    timeTable,
    allTimeTable,
    isLoadingTimeTable,
    refreshTimeTable,
    syncTimeTableToStudents,
    lastSyncTime,
    timetablePage,
    setTimetablePage,
    totalTimetablePages,
    timetableFilter,
    setTimetableFilter,
    uploadTimeTable,
  } = useSharedData()

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Transform timetable entries to courses format
  useEffect(() => {
    if (timeTable && Array.isArray(timeTable)) {
      const transformedCourses = timeTable.map((entry: any) => ({
        id: entry.id,
        code: entry.subject.substring(0, 6), // Generate a code from the subject
        name: entry.subject,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        professor: entry.professor,
        room: entry.location,
      }))

      setCourses(transformedCourses)
    }
  }, [timeTable])

  const resetForm = () => {
    setNewCourse({
      code: "",
      name: "",
      day: "Monday",
      startTime: "09:00",
      endTime: "10:30",
      professor: "",
      room: "",
    })
    setEditingCourse(null)
  }

  const handleOpenAddDialog = () => {
    resetForm()
    setOpen(true)
  }

  const validateForm = () => {
    if (!newCourse.code || newCourse.code.trim() === "") {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a course code",
      })
      return false
    }

    if (!newCourse.name || newCourse.name.trim() === "") {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a course name",
      })
      return false
    }

    if (!newCourse.day) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a day",
      })
      return false
    }

    if (!newCourse.startTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a start time",
      })
      return false
    }

    if (!newCourse.endTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter an end time",
      })
      return false
    }

    // Validate that end time is after start time
    const startParts = newCourse.startTime.split(":").map(Number)
    const endParts = newCourse.endTime.split(":").map(Number)

    const startMinutes = startParts[0] * 60 + startParts[1]
    const endMinutes = endParts[0] * 60 + endParts[1]

    if (endMinutes <= startMinutes) {
      toast({
        variant: "destructive",
        title: "Invalid time",
        description: "End time must be after start time",
      })
      return false
    }

    return true
  }

  const handleAddCourse = async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (editingCourse) {
        // Update existing entry
        const updatedEntry = await updateTimeTableEntry(editingCourse.id, {
          subject: newCourse.name,
          day: newCourse.day,
          startTime: newCourse.startTime,
          endTime: newCourse.endTime,
          professor: newCourse.professor,
          location: newCourse.room,
        })

        if (updatedEntry) {
          toast({
            title: "Course updated",
            description: `${newCourse.code} has been updated successfully`,
          })

          // Refresh timetable data
          await refreshTimeTable(true)
        }
      } else {
        // Create new entry
        const newEntry = await createTimeTableEntry({
          subject: newCourse.name,
          day: newCourse.day,
          startTime: newCourse.startTime,
          endTime: newCourse.endTime,
          professor: newCourse.professor || "N/A",
          location: newCourse.room || "N/A",
        })

        if (newEntry) {
          toast({
            title: "Course added",
            description: `${newCourse.code} has been added to the timetable`,
          })

          // Refresh timetable data
          await refreshTimeTable(true)
        }
      }

      setOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving course:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save course",
      })
    }
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
    setNewCourse({
      code: course.code,
      name: course.name,
      day: course.day,
      startTime: course.startTime,
      endTime: course.endTime,
      professor: course.professor,
      room: course.room,
    })
    setOpen(true)
  }

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        const success = await deleteTimeTableEntry(id)

        if (success) {
          toast({
            title: "Course deleted",
            description: "The course has been removed from the timetable",
          })

          // Refresh timetable data
          await refreshTimeTable(true)
        }
      } catch (error) {
        console.error("Error deleting course:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete course",
        })
      }
    }
  }

  // Function to export timetable as CSV
  const exportTimetable = () => {
    const headers = ["Course Code", "Course Name", "Day", "Start Time", "End Time", "Professor", "Room"]

    const csvContent = [
      headers.join(","),
      ...allTimeTable.map((entry) =>
        [
          entry.subject.substring(0, 6),
          `"${entry.subject}"`, // Wrap in quotes to handle commas in names
          entry.day,
          entry.startTime,
          entry.endTime,
          `"${entry.professor}"`,
          `"${entry.location}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "timetable.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Timetable exported",
      description: "The timetable has been exported as a CSV file",
    })
  }

  // Handle search
  const handleSearch = () => {
    setTimetableFilter((prev) => ({
      ...prev,
      subject: searchTerm,
    }))
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    setTimetableFilter((prev) => ({
      ...prev,
      subject: undefined,
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setTimetableFilter({})
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h2 className="text-xl font-bold">Time Table Management</h2>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
                <DialogDescription>
                  {editingCourse
                    ? "Update the details of the course below."
                    : "Fill in the details to add a new course to the timetable."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Course Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Course Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. Introduction to Computer Science"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="day" className="text-right">
                    Day <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newCourse.day} onValueChange={(value) => setNewCourse({ ...newCourse, day: value })}>
                    <SelectTrigger id="day" className="col-span-3">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Start Time <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      value={newCourse.startTime}
                      onChange={(e) => setNewCourse({ ...newCourse, startTime: e.target.value })}
                      className="flex-1"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    End Time <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      value={newCourse.endTime}
                      onChange={(e) => setNewCourse({ ...newCourse, endTime: e.target.value })}
                      className="flex-1"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="professor" className="text-right">
                    Professor
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="professor"
                      value={newCourse.professor}
                      onChange={(e) => setNewCourse({ ...newCourse, professor: e.target.value })}
                      className="flex-1"
                      placeholder="e.g. Dr. Smith"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="room" className="text-right">
                    Room
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="room"
                      value={newCourse.room}
                      onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                      className="flex-1"
                      placeholder="e.g. Room 101"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex space-x-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>{editingCourse ? "Save Changes" : "Add Course"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={syncTimeTableToStudents} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync to Students
          </Button>
          <Button variant="secondary" onClick={exportTimetable} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {lastSyncTime && (
        <div className="text-sm text-muted-foreground">Last synced: {lastSyncTime.toLocaleString()}</div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Courses</TabsTrigger>
          <TabsTrigger value="upload">Upload Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-primary/10" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {totalTimetablePages > 0
                  ? `Showing ${courses.length} of ${allTimeTable.length} courses`
                  : "No courses found"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refreshTimeTable(true)} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoadingTimeTable ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 p-4 border rounded-md bg-muted/20 mb-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="icon" variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
                {searchTerm && (
                  <Button onClick={clearSearch} size="icon" variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select
                value={timetableFilter.day || ""}
                onValueChange={(value) => setTimetableFilter((prev) => ({ ...prev, day: value || undefined }))}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {isLoadingTimeTable ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="hidden md:table-cell">Day</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">Professor</TableHead>
                    <TableHead className="hidden md:table-cell">Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="hidden md:table-cell">Day</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">Professor</TableHead>
                    <TableHead className="hidden md:table-cell">Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{course.day}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {course.startTime} - {course.endTime}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{course.professor}</TableCell>
                        <TableCell className="hidden md:table-cell">{course.room}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCourse(course)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCourse(course.id)}
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
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Clock className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p>No courses found.</p>
                          <Button variant="link" onClick={handleOpenAddDialog} className="mt-1">
                            Add your first course
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalTimetablePages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setTimetablePage(Math.max(1, timetablePage - 1))}
                      className={timetablePage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {[...Array(totalTimetablePages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink onClick={() => setTimetablePage(i + 1)} isActive={timetablePage === i + 1}>
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setTimetablePage(Math.min(totalTimetablePages, timetablePage + 1))}
                      className={timetablePage === totalTimetablePages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
        <TabsContent value="upload" className="border rounded-lg p-4">
          <TimeTableUpload />
        </TabsContent>
      </Tabs>
    </div>
  )
}
