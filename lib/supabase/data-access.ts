import { createClient } from "@supabase/supabase-js"
import type { Task, TimeTableEntry, User } from "@/lib/types"
import { initialTasks, initialTimeTable } from "@/lib/data"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User functions
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching users:", error)
    return []
  }
}

export async function getPendingUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .is("approved_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending users:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching pending users:", error)
    // Return empty array instead of propagating the error
    return []
  }
}

export async function getUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching users:", error)
    return []
  }
}

export async function getUserById(id: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching user:", error)
    return null
  }
}

export async function getUserByEmail(email: string) {
  try {
    if (!email) return null

    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      // PGRST116 is the error code for no rows returned
      if (error.code === "PGRST116") {
        return null
      }
      console.error("Error fetching user by email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching user by email:", error)
    return null
  }
}

export async function createUser(user: Omit<User, "id">) {
  try {
    const { data, error } = await supabase.from("users").insert([user]).select()

    if (error) {
      console.error("Error creating user:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating user:", error)
    return null
  }
}

export async function updateUser(id: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select()

    if (error) {
      console.error("Error updating user:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception updating user:", error)
    return null
  }
}

export async function deleteUser(id: string) {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting user:", error)
    return false
  }
}

// Task functions
export async function getTasks(userId: string) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tasks:", error)
      // Return initial data as fallback
      return initialTasks
    }

    return data
  } catch (error) {
    console.error("Exception fetching tasks:", error)
    // Return initial data as fallback
    return initialTasks
  }
}

export async function createTask(task: Omit<Task, "id"> & { user_id: string }) {
  try {
    const { data, error } = await supabase.from("tasks").insert([task]).select()

    if (error) {
      console.error("Error creating task:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating task:", error)
    return null
  }
}

export async function updateTask(id: string, updates: Partial<Task>) {
  try {
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select()

    if (error) {
      console.error("Error updating task:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception updating task:", error)
    return null
  }
}

export async function deleteTask(id: string) {
  try {
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) {
      console.error("Error deleting task:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting task:", error)
    return false
  }
}

// Timetable functions
export async function getTimeTableEntries(classId?: string) {
  try {
    let query = supabase.from("timetable_entries").select("*").order("day", { ascending: true })

    if (classId) {
      query = query.eq("class_id", classId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching timetable entries:", error)
      // Return initial data as fallback
      return initialTimeTable.map((entry) => ({
        id: entry.id,
        day: entry.day,
        subject: entry.subject,
        startTime: entry.startTime,
        endTime: entry.endTime,
        location: entry.location,
        professor: entry.professor,
      }))
    }

    // Convert snake_case to camelCase for our application
    return data.map((entry) => ({
      id: entry.id,
      day: entry.day,
      subject: entry.subject,
      startTime: entry.start_time,
      endTime: entry.end_time,
      location: entry.location,
      professor: entry.professor,
      class_id: entry.class_id,
    }))
  } catch (error) {
    console.error("Exception fetching timetable entries:", error)
    // Return initial data as fallback
    return initialTimeTable.map((entry) => ({
      id: entry.id,
      day: entry.day,
      subject: entry.subject,
      startTime: entry.startTime,
      endTime: entry.endTime,
      location: entry.location,
      professor: entry.professor,
    }))
  }
}

export async function createTimeTableEntry(entry: Omit<TimeTableEntry, "id"> & { class_id?: string }) {
  try {
    // Convert camelCase to snake_case for database columns
    const dbEntry = {
      day: entry.day,
      subject: entry.subject,
      start_time: entry.startTime, // Changed from startTime to start_time
      end_time: entry.endTime, // Changed from endTime to end_time
      location: entry.location,
      professor: entry.professor,
      class_id: entry.class_id,
    }

    const { data, error } = await supabase.from("timetable_entries").insert([dbEntry]).select()

    if (error) {
      console.error("Error creating timetable entry:", error)
      return null
    }

    // Convert the response back to camelCase for our application
    return {
      ...data[0],
      startTime: data[0].start_time,
      endTime: data[0].end_time,
    }
  } catch (error) {
    console.error("Exception creating timetable entry:", error)
    return null
  }
}

export async function updateTimeTableEntry(id: string, updates: Partial<TimeTableEntry>) {
  try {
    // Convert camelCase to snake_case for database columns
    const dbUpdates: any = {}

    if (updates.day) dbUpdates.day = updates.day
    if (updates.subject) dbUpdates.subject = updates.subject
    if (updates.startTime) dbUpdates.start_time = updates.startTime
    if (updates.endTime) dbUpdates.end_time = updates.endTime
    if (updates.location) dbUpdates.location = updates.location
    if (updates.professor) dbUpdates.professor = updates.professor

    const { data, error } = await supabase.from("timetable_entries").update(dbUpdates).eq("id", id).select()

    if (error) {
      console.error("Error updating timetable entry:", error)
      return null
    }

    // Convert the response back to camelCase for our application
    return {
      ...data[0],
      startTime: data[0].start_time,
      endTime: data[0].end_time,
    }
  } catch (error) {
    console.error("Exception updating timetable entry:", error)
    return null
  }
}

// Bulk operations for timetable
export async function bulkCreateTimeTableEntries(entries: Array<Omit<TimeTableEntry, "id"> & { class_id?: string }>) {
  try {
    // Convert each entry's camelCase to snake_case for database columns
    const dbEntries = entries.map((entry) => ({
      day: entry.day,
      subject: entry.subject,
      start_time: entry.startTime, // Changed from startTime to start_time
      end_time: entry.endTime, // Changed from endTime to end_time
      location: entry.location,
      professor: entry.professor,
      class_id: entry.class_id,
    }))

    const { data, error } = await supabase.from("timetable_entries").insert(dbEntries).select()

    if (error) {
      console.error("Error bulk creating timetable entries:", error)
      return null
    }

    // Convert the response back to camelCase for our application
    return data.map((entry) => ({
      ...entry,
      startTime: entry.start_time,
      endTime: entry.end_time,
    }))
  } catch (error) {
    console.error("Exception bulk creating timetable entries:", error)
    return null
  }
}

export async function deleteAllTimeTableEntries() {
  try {
    const { error } = await supabase.from("timetable_entries").delete().neq("id", "0") // Delete all entries

    if (error) {
      console.error("Error deleting all timetable entries:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting all timetable entries:", error)
    return false
  }
}

export async function deleteTimeTableEntry(id: string) {
  try {
    const { error } = await supabase.from("timetable_entries").delete().eq("id", id)

    if (error) {
      console.error("Error deleting timetable entry:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting timetable entry:", error)
    return false
  }
}

// Notification functions
export async function createNotification(notification: {
  user_id: string
  title: string
  message: string
  type: string
  related_id?: string
  scheduled_for?: string
  is_read: boolean
  // Removed fields that don't exist in the database:
  // sender_id?: string
  // sender_name?: string
  // priority?: "low" | "medium" | "high"
  // action_url?: string
}) {
  try {
    const { data, error } = await supabase.from("notifications").insert([notification]).select()

    if (error) {
      console.error("Error creating notification:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating notification:", error)
    return null
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string, archive = false) {
  try {
    const updates: any = { is_read: true }

    // If archiving, add archived_at timestamp
    if (archive) {
      updates.archived_at = new Date().toISOString()
    }

    const { error } = await supabase.from("notifications").update(updates).eq("user_id", userId).is("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception marking all notifications as read:", error)
    return false
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .is("archived_at", null) // Only count non-archived notifications

    if (error) {
      console.error("Error getting unread notification count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Exception getting unread notification count:", error)
    return 0
  }
}

// Get notifications for a user
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null) // Only get non-archived notifications
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notifications:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const { data, error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).select()

    if (error) {
      console.error("Error marking notification as read:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception marking notification as read:", error)
    return null
  }
}

// Archive a notification
export async function archiveNotification(id: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error archiving notification:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception archiving notification:", error)
    return null
  }
}

// Get archived notifications
export async function getArchivedNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .not("archived_at", "is", null) // Only get archived notifications
      .order("archived_at", { ascending: false })

    if (error) {
      console.error("Error fetching archived notifications:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching archived notifications:", error)
    return []
  }
}

// Get notification settings for a user
export async function getNotificationSettings(userId: string) {
  try {
    const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", userId).single()

    if (error) {
      // If no settings exist, create default settings
      if (error.code === "PGRST116") {
        const defaultSettings = {
          user_id: userId,
          enable_email: false,
          enable_browser: true,
          enable_task_reminders: true,
          enable_class_reminders: true,
          reminder_time_minutes: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: newSettings, error: createError } = await supabase
          .from("notification_settings")
          .insert([defaultSettings])
          .select()

        if (createError) {
          console.error("Error creating default notification settings:", createError)
          return defaultSettings
        }

        return newSettings[0]
      }

      console.error("Error fetching notification settings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching notification settings:", error)
    return null
  }
}

// Update notification settings for a user
export async function updateNotificationSettings(
  userId: string,
  settings: {
    enable_email?: boolean
    enable_browser?: boolean
    enable_task_reminders?: boolean
    enable_class_reminders?: boolean
    reminder_time_minutes?: number
  },
) {
  try {
    const updates = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("notification_settings").update(updates).eq("user_id", userId).select()

    if (error) {
      console.error("Error updating notification settings:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception updating notification settings:", error)
    return false
  }
}

// Event functions
export async function getEvents() {
  try {
    const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true })

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching events:", error)
    return []
  }
}

export async function createEvent(event: Omit<any, "id">) {
  try {
    const { data, error } = await supabase.from("events").insert([event]).select()

    if (error) {
      console.error("Error creating event:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating event:", error)
    return null
  }
}

export async function updateEvent(id: string, updates: Partial<any>) {
  try {
    const { data, error } = await supabase.from("events").update(updates).eq("id", id).select()

    if (error) {
      console.error("Error updating event:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception updating event:", error)
    return null
  }
}

export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase.from("events").delete().eq("id", id)

    if (error) {
      console.error("Error deleting event:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting event:", error)
    return false
  }
}

// Class functions
export async function getClasses() {
  try {
    const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching classes:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching classes:", error)
    return []
  }
}

export async function createClass(classData: { name: string; description?: string }) {
  try {
    const { data, error } = await supabase.from("classes").insert([classData]).select()

    if (error) {
      console.error("Error creating class:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating class:", error)
    return null
  }
}

// Notice functions
export async function getAllNotices() {
  try {
    const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notices:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching notices:", error)
    return []
  }
}

export async function getActiveNotices() {
  try {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching active notices:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching active notices:", error)
    return []
  }
}

export async function createNotice(notice: {
  title: string
  content: string
  priority: string
  created_by: string
  expires_at?: string
  is_active: boolean
}) {
  try {
    const { data, error } = await supabase
      .from("notices")
      .insert([{ ...notice, created_at: new Date().toISOString() }])
      .select()

    if (error) {
      console.error("Error creating notice:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating notice:", error)
    return null
  }
}

export async function updateNotice(id: string, updates: Partial<any>) {
  try {
    const { data, error } = await supabase
      .from("notices")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating notice:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception updating notice:", error)
    return null
  }
}

export async function deleteNotice(id: string) {
  try {
    const { error } = await supabase.from("notices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting notice:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting notice:", error)
    return false
  }
}

// Function to broadcast a notice to all users
export async function broadcastNoticeToAllUsers(notice: {
  title: string
  content: string
  priority: string
  notice_id: string
}) {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.from("users").select("id")

    if (usersError) {
      console.error("Error fetching users for notice broadcast:", usersError)
      return false
    }

    // Create notifications for each user
    const notifications = users.map((user) => ({
      user_id: user.id,
      title: `NOTICE: ${notice.title}`,
      message: notice.content,
      type: "notice",
      related_id: notice.notice_id,
      is_read: false,
      created_at: new Date().toISOString(),
    }))

    // Insert all notifications
    const { error: notificationError } = await supabase.from("notifications").insert(notifications)

    if (notificationError) {
      console.error("Error broadcasting notice notifications:", notificationError)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception broadcasting notice:", error)
    return false
  }
}

// Student functions
export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching students:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching students:", error)
    return []
  }
}

export async function createStudent(studentData: {
  name: string
  email: string
  course: string
  year: string
  password: string
}) {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: studentData.email,
      password: studentData.password,
      options: {
        data: {
          name: studentData.name,
        },
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return null
    }

    // Then create the user profile
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user?.id,
          name: studentData.name,
          email: studentData.email,
          role: "student",
          course: studentData.course,
          year: studentData.year,
          approved_at: new Date().toISOString(), // Auto-approve students created by admin
        },
      ])
      .select()

    if (error) {
      console.error("Error creating student:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception creating student:", error)
    return null
  }
}

export async function updateStudent(id: string, updates: {
  name?: string
  email?: string
  course?: string
  year?: string
  status?: "active" | "inactive"
}) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating student:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Exception updating student:", error)
    return null
  }
}

export async function deleteStudent(id: string) {
  try {
    // First delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return false
    }

    // Then delete the user profile
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting student:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception deleting student:", error)
    return false
  }
}
