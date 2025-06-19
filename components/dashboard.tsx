"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import TaskList from "@/components/task-list"
import TimeTable from "@/components/time-table"
import UploadTimeTable from "@/components/upload-time-table"
import type { Task, TimeTableEntry } from "@/lib/types"
import { initialTasks, initialTimeTable } from "@/lib/data"
import DashboardHeader from "@/components/dashboard-header"
import DashboardSummary from "@/components/dashboard-summary"
import { ModeToggle } from "@/components/mode-toggle"

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeTable, setTimeTable] = useState<TimeTableEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    const savedTimeTable = localStorage.getItem("timeTable")

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      setTasks(initialTasks)
    }

    if (savedTimeTable) {
      setTimeTable(JSON.parse(savedTimeTable))
    } else {
      setTimeTable(initialTimeTable)
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("timeTable", JSON.stringify(timeTable))
  }, [timeTable])

  // Filter tasks for the selected date
  const tasksForSelectedDate = tasks.filter((task) => {
    const taskDate = new Date(task.deadline)
    return taskDate.toDateString() === selectedDate.toDateString()
  })

  // Filter timetable entries for the selected date
  const timeTableForSelectedDate = timeTable.filter((entry) => {
    const day = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    return entry.day.toLowerCase() === day
  })

  // Calculate completion percentage
  const completedTasks = tasks.filter((task) => task.completed).length
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <DashboardHeader />
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      <DashboardSummary
        tasks={tasks}
        timeTable={timeTable}
        selectedDate={selectedDate}
        completionPercentage={completionPercentage}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="timetable">Time Table</TabsTrigger>
              <TabsTrigger value="upload">Upload Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="border rounded-lg p-4">
              <TaskList tasks={tasks} setTasks={setTasks} selectedDate={selectedDate} />
            </TabsContent>
            <TabsContent value="timetable" className="border rounded-lg p-4">
              <TimeTable timeTable={timeTable} setTimeTable={setTimeTable} selectedDate={selectedDate} />
            </TabsContent>
            <TabsContent value="upload" className="border rounded-lg p-4">
              <UploadTimeTable setTimeTable={setTimeTable} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Calendar</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="font-medium">
              Selected Day:{" "}
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>

            {tasksForSelectedDate.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tasks Due:</h4>
                <ul className="list-disc list-inside">
                  {tasksForSelectedDate.map((task) => (
                    <li key={task.id} className={task.completed ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {timeTableForSelectedDate.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Classes:</h4>
                <ul className="list-disc list-inside">
                  {timeTableForSelectedDate.map((entry) => (
                    <li key={entry.id}>
                      {entry.subject} ({entry.startTime} - {entry.endTime})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tasksForSelectedDate.length === 0 && timeTableForSelectedDate.length === 0 && (
              <p className="text-muted-foreground">No tasks or classes scheduled for this day.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
