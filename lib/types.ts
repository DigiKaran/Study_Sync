export interface Task {
  id: string
  title: string
  category: string
  deadline: string
  completed: boolean
  createdAt: string
  user_id?: string
}

export interface TimeTableEntry {
  id: string
  day: string
  subject: string
  startTime: string
  endTime: string
  location: string
  professor: string
  class_id?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  last_login?: string
  approved_at?: string | null
  denied_at?: string | null
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_id?: string
  scheduled_for?: string
  is_read: boolean
  created_at: string
  archived_at?: string | null
  // Removed fields that don't exist in the database:
  // sender_id?: string | null
  // sender_name?: string | null
  // priority?: "low" | "medium" | "high"
  // action_url?: string | null
}

export interface NotificationSettings {
  id: string
  user_id: string
  enable_email: boolean
  enable_browser: boolean
  enable_task_reminders: boolean
  enable_class_reminders: boolean
  reminder_time_minutes: number
  created_at: string
  updated_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  priority: "low" | "medium" | "high"
  created_at: string
  created_by: string
  expires_at?: string | null
  is_active: boolean
  updated_at?: string | null
}
