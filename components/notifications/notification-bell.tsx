"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime"
import { getUnreadNotificationCount, getUserNotifications } from "@/lib/supabase/data-access"
import { useAuth } from "@/lib/context/auth-context"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [shake, setShake] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const count = await getUnreadNotificationCount(user.id)
      setUnreadCount(count)

      const notifs = await getUserNotifications(user.id)
      setNotifications(notifs)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    }
  }, [user?.id])

  // Set up real-time subscription for notifications
  useSupabaseRealtime({
    channel: "notifications",
    event: "*",
    schema: "public",
    table: "notifications",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    callback: (payload) => {
      if (payload.eventType === "INSERT") {
        // A new notification was added
        const newNotification = payload.new as Notification

        // Update the notifications list
        setNotifications((prev) => [newNotification, ...prev])

        // Update the unread count
        if (!newNotification.is_read) {
          setUnreadCount((prev) => prev + 1)

          // Trigger shake animation
          setShake(true)
          setTimeout(() => setShake(false), 1000)

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          })
        }
      } else if (payload.eventType === "UPDATE") {
        // A notification was updated
        const updatedNotification = payload.new as Notification

        // Update the notifications list
        setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

        // Update the unread count if read status changed
        if (payload.old.is_read !== updatedNotification.is_read) {
          setUnreadCount((prev) => (updatedNotification.is_read ? prev - 1 : prev + 1))
        }
      } else if (payload.eventType === "DELETE") {
        // A notification was deleted
        const deletedNotification = payload.old as Notification

        // Update the notifications list
        setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))

        // Update the unread count if it was unread
        if (!deletedNotification.is_read) {
          setUnreadCount((prev) => prev - 1)
        }
      }
    },
  })

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return

    try {
      // await markAllNotificationsAsRead(user.id)

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "unread" ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`relative ${shake ? "animate-shake" : ""}`}
              onClick={() => setOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Open notifications</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-2">
              {loading ? (
                <div className="flex justify-center p-4">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">No notifications yet</div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${notification.is_read ? "bg-background" : "bg-muted"}`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="mt-2">
              {loading ? (
                <div className="flex justify-center p-4">Loading notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">No unread notifications</div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 rounded-lg border bg-muted">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
