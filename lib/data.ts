import type { Task, TimeTableEntry } from "./types"

export const taskCategories = [
  { value: "assignment", label: "Assignment", color: "bg-blue-500" },
  { value: "exam", label: "Exam", color: "bg-red-500" },
  { value: "lecture", label: "Lecture", color: "bg-green-500" },
  { value: "project", label: "Project", color: "bg-purple-500" },
  { value: "reading", label: "Reading", color: "bg-yellow-500" },
  { value: "personal", label: "Personal", color: "bg-gray-500" },
]

export const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete Math Assignment",
    category: "assignment",
    deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Study for Physics Exam",
    category: "exam",
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Read Chapter 5 of History Textbook",
    category: "reading",
    deadline: new Date().toISOString(),
    completed: true,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: "4",
    title: "Group Project Meeting",
    category: "project",
    deadline: new Date().toISOString(),
    completed: false,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
]

export const initialTimeTable: TimeTableEntry[] = [
  {
    id: "1",
    day: "Monday",
    subject: "Mathematics",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 101",
    professor: "Dr. Johnson",
  },
  {
    id: "2",
    day: "Monday",
    subject: "Physics",
    startTime: "11:00",
    endTime: "12:30",
    location: "Science Building",
    professor: "Dr. Smith",
  },
  {
    id: "3",
    day: "Tuesday",
    subject: "Computer Science",
    startTime: "14:00",
    endTime: "15:30",
    location: "Tech Lab",
    professor: "Prof. Williams",
  },
  {
    id: "4",
    day: "Wednesday",
    subject: "Mathematics",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 101",
    professor: "Dr. Johnson",
  },
  {
    id: "5",
    day: "Thursday",
    subject: "History",
    startTime: "13:00",
    endTime: "14:30",
    location: "Humanities Building",
    professor: "Dr. Davis",
  },
  {
    id: "6",
    day: "Friday",
    subject: "Physics",
    startTime: "11:00",
    endTime: "12:30",
    location: "Science Building",
    professor: "Dr. Smith",
  },
]
