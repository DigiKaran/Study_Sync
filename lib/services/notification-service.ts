import { createNotification, getUserNotifications } from "@/lib/supabase/data-access"
import type { TimeTableEntry, Task } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"

export async function scheduleClassReminders(userId: string, timeTableEntries: TimeTableEntry[]) {
  try {
    const today = new Date()
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" })

    // Get today's classes
    const todaysClasses = timeTableEntries.filter((entry) => entry.day.toLowerCase() === dayOfWeek.toLowerCase())

    // Schedule notifications for each class
    for (const classEntry of todaysClasses) {
      const [hours, minutes] = classEntry.startTime.split(":").map(Number)
      const classTime = new Date()
      classTime.setHours(hours, minutes, 0, 0)

      // Schedule notification 30 minutes before class
      const reminderTime = new Date(classTime)
      reminderTime.setMinutes(reminderTime.getMinutes() - 30)

      // Only schedule if the reminder time is in the future
      if (reminderTime > today) {
        await createNotification({
          user_id: userId,
          title: `Upcoming Class: ${classEntry.subject}`,
          message: `Your ${classEntry.subject} class starts in 30 minutes at ${classEntry.startTime} in ${classEntry.location}`,
          type: "class",
          related_id: classEntry.id,
          scheduled_for: reminderTime.toISOString(),
          is_read: false,
        })
      }
    }

    return true
  } catch (error) {
    console.error("Error scheduling class reminders:", error)
    return false
  }
}

export async function scheduleTaskReminders(userId: string, tasks: Task[]) {
  try {
    const today = new Date()

    // Get upcoming tasks due today or tomorrow
    const upcomingTasks = tasks.filter((task) => {
      if (task.completed) return false

      const dueDate = new Date(task.deadline)
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return diffDays >= 0 && diffDays <= 1
    })

    // Schedule notifications for each task
    for (const task of upcomingTasks) {
      const dueDate = new Date(task.deadline)
      const isToday = dueDate.toDateString() === today.toDateString()

      await createNotification({
        user_id: userId,
        title: `Task Due ${isToday ? "Today" : "Tomorrow"}: ${task.title}`,
        message: `Your task "${task.title}" is due ${isToday ? "today" : "tomorrow"}`,
        type: "task",
        related_id: task.id,
        scheduled_for: new Date().toISOString(), // Send immediately
        is_read: false,
      })
    }

    return true
  } catch (error) {
    console.error("Error scheduling task reminders:", error)
    return false
  }
}

export async function checkForDueNotifications(userId: string) {
  try {
    const now = new Date()
    const notifications = await getUserNotifications(userId)

    // Filter notifications that are scheduled and due
    const dueNotifications = notifications.filter((notification) => {
      if (!notification.scheduled_for) return false

      const scheduledTime = new Date(notification.scheduled_for)
      return scheduledTime <= now && !notification.is_read
    })

    return dueNotifications
  } catch (error) {
    console.error("Error checking for due notifications:", error)
    return []
  }
}

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  related_id?: string,
) {
  try {
    await createNotification({
      user_id: userId,
      title,
      message,
      type,
      related_id,
      scheduled_for: new Date().toISOString(),
      is_read: false,
    })

    return true
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}

// New function to send a welcome notification
export async function sendWelcomeNotification(userId: string, userName: string) {
  return sendNotification(
    userId,
    "Welcome to StudySync!",
    `Hello ${userName}, welcome to StudySync! We're excited to help you stay organized with your college schedule and tasks.`,
    "system",
  )
}

// New function to notify about upcoming deadlines
export async function notifyUpcomingDeadlines(userId: string) {
  try {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get tasks due today or tomorrow
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("deadline", today.toISOString())
      .lte("deadline", tomorrow.toISOString())

    if (tasks && tasks.length > 0) {
      await createNotification({
        user_id: userId,
        title: `${tasks.length} Upcoming Deadline${tasks.length > 1 ? "s" : ""}`,
        message: `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due in the next 24 hours.`,
        type: "reminder",
        scheduled_for: new Date().toISOString(),
        is_read: false,
      })
    }

    return true
  } catch (error) {
    console.error("Error notifying about upcoming deadlines:", error)
    return false
  }
}

// New function to send class completion notification
export async function sendClassCompletionNotification(userId: string, classEntry: TimeTableEntry) {
  return sendNotification(
    userId,
    `Class Completed: ${classEntry.subject}`,
    `Your ${classEntry.subject} class has ended. Don't forget to review your notes and complete any assignments.`,
    "class",
    classEntry.id,
  )
}

// New function to send task completion notification
export async function sendTaskCompletionNotification(userId: string, task: Task) {
  return sendNotification(
    userId,
    `Task Completed: ${task.title}`,
    `Congratulations! You've completed the task "${task.title}".`,
    "task",
    task.id,
  )
}

// New function to check for class start/end times and send notifications
export async function checkClassSchedule(userId: string, timeTableEntries: TimeTableEntry[]) {
  try {
    const now = new Date()
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Format current time as HH:MM for comparison
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

    // Get today's classes
    const todaysClasses = timeTableEntries.filter((entry) => entry.day.toLowerCase() === currentDay.toLowerCase())

    // Check for classes starting soon (within 5 minutes)
    for (const classEntry of todaysClasses) {
      // Check if class is starting within 5 minutes
      const [startHour, startMinute] = classEntry.startTime.split(":").map(Number)
      const startDate = new Date()
      startDate.setHours(startHour, startMinute, 0, 0)

      const timeDiff = (startDate.getTime() - now.getTime()) / (1000 * 60) // difference in minutes

      if (timeDiff > 0 && timeDiff <= 5) {
        // Class is starting in 5 minutes or less
        await createNotification({
          user_id: userId,
          title: `Class Starting Soon: ${classEntry.subject}`,
          message: `Your ${classEntry.subject} class starts in ${Math.ceil(timeDiff)} minute${Math.ceil(timeDiff) !== 1 ? "s" : ""} at ${classEntry.location}`,
          type: "class",
          related_id: classEntry.id,
          scheduled_for: new Date().toISOString(),
          is_read: false,
        })
      }

      // Check if class just ended
      const [endHour, endMinute] = classEntry.endTime.split(":").map(Number)
      const endDate = new Date()
      endDate.setHours(endHour, endMinute, 0, 0)

      const endTimeDiff = (now.getTime() - endDate.getTime()) / (1000 * 60) // difference in minutes

      if (endTimeDiff >= 0 && endTimeDiff <= 2) {
        // Class ended within the last 2 minutes
        await sendClassCompletionNotification(userId, classEntry)
      }
    }

    return true
  } catch (error) {
    console.error("Error checking class schedule:", error)
    return false
  }
}
