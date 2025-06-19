"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Edit, Trash2, RefreshCw } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getStudents, createStudent, updateStudent, deleteStudent } from "@/lib/supabase/data-access"
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime"

export default function AdminStudentList() {
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    course: "",
    year: "",
    password: "",
  })
  const { toast } = useToast()

  // Fetch students
  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load students",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Set up real-time subscription for students
  useSupabaseRealtime({
    channel: "users",
    event: "*",
    schema: "public",
    table: "users",
    callback: (payload) => {
      if (payload.eventType === "INSERT") {
        // A new student was added
        const newStudent = payload.new
        if (newStudent.role === "student") {
          setStudents((prev) => [newStudent, ...prev])
        }
      } else if (payload.eventType === "UPDATE") {
        // A student was updated
        const updatedStudent = payload.new
        if (updatedStudent.role === "student") {
          setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)))
        }
      } else if (payload.eventType === "DELETE") {
        // A student was deleted
        const deletedStudent = payload.old
        if (deletedStudent.role === "student") {
          setStudents((prev) => prev.filter((s) => s.id !== deletedStudent.id))
        }
      }
    },
  })

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const resetForm = () => {
    setNewStudent({
      name: "",
      email: "",
      course: "",
      year: "",
      password: "",
    })
    setEditingStudent(null)
  }

  const handleOpenAddDialog = () => {
    resetForm()
    setOpen(true)
  }

  const handleOpenEditDialog = (student: any) => {
    setEditingStudent(student)
    setNewStudent({
      name: student.name,
      email: student.email,
      course: student.course,
      year: student.year,
      password: "", // Don't show password when editing
    })
    setOpen(true)
  }

  const handleAddStudent = async () => {
    try {
      if (editingStudent) {
        // Update existing student
        const updated = await updateStudent(editingStudent.id, {
          name: newStudent.name,
          email: newStudent.email,
          course: newStudent.course,
          year: newStudent.year,
        })

        if (updated) {
          toast({
            title: "Student updated",
            description: "The student has been updated successfully",
          })
        } else {
          throw new Error("Failed to update student")
        }
      } else {
        // Create new student
        const created = await createStudent(newStudent)

        if (created) {
          toast({
            title: "Student added",
            description: "The student has been added successfully",
          })
        } else {
          throw new Error("Failed to create student")
        }
      }

      setOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving student:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save student",
      })
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        const success = await deleteStudent(id)

        if (success) {
          toast({
            title: "Student deleted",
            description: "The student has been deleted successfully",
          })
        } else {
          throw new Error("Failed to delete student")
        }
      } catch (error) {
        console.error("Error deleting student:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete student",
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Student Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStudents} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenAddDialog} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
        <Input
          type="search"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <Button type="submit" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Course</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.course}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.year}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>
                      {student.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStudent(student.id)}
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
                <TableCell colSpan={6} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Make changes to the student's information here."
                : "Fill in the student's information to add them to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="col-span-3"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="col-span-3"
                placeholder="e.g. john.doe@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">
                Course <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course"
                value={newStudent.course}
                onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                className="col-span-3"
                placeholder="e.g. Computer Science"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newStudent.year}
                onValueChange={(value) => setNewStudent({ ...newStudent, year: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>{editingStudent ? "Save Changes" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
