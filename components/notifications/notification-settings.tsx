"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Clock, Save } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getNotificationSettings, updateNotificationSettings } from "@/lib/supabase/data-access"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NotificationSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    enableEmail: false,
    enableBrowser: true,
    enableTaskReminders: true,
    enableClassReminders: true,
    reminderTimeMinutes: 30,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const userSettings = await getNotificationSettings(user.id)

        if (userSettings) {
          setSettings({
            enableEmail: userSettings.enable_email,
            enableBrowser: userSettings.enable_browser,
            enableTaskReminders: userSettings.enable_task_reminders,
            enableClassReminders: userSettings.enable_class_reminders,
            reminderTimeMinutes: userSettings.reminder_time_minutes,
          })
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      const success = await updateNotificationSettings(user.id, {
        enable_email: settings.enableEmail,
        enable_browser: settings.enableBrowser,
        enable_task_reminders: settings.enableTaskReminders,
        enable_class_reminders: settings.enableClassReminders,
        reminder_time_minutes: settings.reminderTimeMinutes,
      })

      if (success) {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated",
        })
      }
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Customize how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-48 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>Customize how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Channels</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.enableEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, enableEmail: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
              </div>
              <Switch
                id="browser-notifications"
                checked={settings.enableBrowser}
                onCheckedChange={(checked) => setSettings({ ...settings, enableBrowser: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Types</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-reminders">Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminders about upcoming tasks and deadlines</p>
              </div>
              <Switch
                id="task-reminders"
                checked={settings.enableTaskReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, enableTaskReminders: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="class-reminders">Class Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminders about upcoming classes</p>
              </div>
              <Switch
                id="class-reminders"
                checked={settings.enableClassReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, enableClassReminders: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Reminder Timing</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <p className="text-sm text-muted-foreground">How far in advance to send reminders</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={settings.reminderTimeMinutes.toString()}
                  onValueChange={(value) => setSettings({ ...settings, reminderTimeMinutes: Number.parseInt(value) })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="ml-auto">
          {isSaving ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
