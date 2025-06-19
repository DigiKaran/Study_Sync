"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, CalendarIcon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { taskCategories } from "@/lib/data"
import { useAuth } from "@/lib/context/auth-context"
import { createTask, updateTask, deleteTask } from "@/lib/supabase/data-access"
import { useToast } from "@/components/ui/use-toast"
import { useSharedData } from "@/lib/context/shared-data-context"

interface TaskListProps {
  selectedDate: Date
}

export default function TaskList({ selectedDate }: TaskListProps) {
  const [newTask, setNewTask] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState("assignment")
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date>(selectedDate)
  const [filterCategory, setFilterCategory] = useState<string | null>("all")
  const [showCompleted, setShowCompleted] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const { tasks, isLoading, refreshTasks } = useSharedData()

  // Update newTaskDeadline when selectedDate changes
  useEffect(() => {
    setNewTaskDeadline(selectedDate)
  }, [selectedDate])

  const handleAddTask = async () => {
    if (!user) return
    if (newTask.trim() === "") return

    const taskData = {
      user_id: user.id,
      title: newTask,
      category: newTaskCategory,
      deadline: newTaskDeadline.toISOString(),
      completed: false,
      created_at: new Date().toISOString(),
    }

    const createdTask = await createTask(taskData)

    if (createdTask) {
      // Refresh tasks after adding a new one
      await refreshTasks()

      setNewTask("")
      // Reset the category and deadline to default values
      setNewTaskCategory("assignment")
      setNewTaskDeadline(selectedDate)

      toast({
        title: "Task added",
        description: "Your task has been added successfully",
      })
    }
  }

  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const updatedTask = await updateTask(id, { completed: !task.completed })

    if (updatedTask) {
      // Refresh tasks after updating
      await refreshTasks()
    }
  }

  const handleDeleteTask = async (id: string) => {
    const success = await deleteTask(id)

    if (success) {
      // Refresh tasks after deleting
      await refreshTasks()

      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully",
      })
    }
  }

  // Filter tasks based on category and completion status
  const filteredTasks = tasks.filter((task) => {
    if (!showCompleted && task.completed) return false
    if (filterCategory !== "all" && task.category !== filterCategory) return false
    return true
  })

  // Get category color
  const getCategoryColor = (category: string) => {
    const categoryObj = taskCategories.find((c) => c.value === category)
    return categoryObj?.color || "bg-gray-500"
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask()
              }}
            />

            <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {taskCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${category.color} mr-2`}></div>
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[180px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(newTaskDeadline, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newTaskDeadline}
                  onSelect={(date) => date && setNewTaskDeadline(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterCategory || "all"} onValueChange={(value) => setFilterCategory(value || "all")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {taskCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${category.color} mr-2`}></div>
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={refreshTasks} className="gap-2 mr-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Checkbox
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={() => setShowCompleted(!showCompleted)}
              />
              <label htmlFor="show-completed" className="text-sm">
                Show completed
              </label>
            </div>
          </div>

          <div className="space-y-2">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    task.completed ? "bg-muted" : "",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(task.id)} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={cn("font-medium", task.completed ? "line-through text-muted-foreground" : "")}>
                          {task.title}
                        </p>
                        <Badge className={getCategoryColor(task.category)}>
                          {taskCategories.find((c) => c.value === task.category)?.label || task.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(task.deadline), "PPP")}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No tasks found. Add a new task to get started!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
