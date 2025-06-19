"use client"
import { Check, Clock, Calendar, BookOpen, Bell, Info, Trash2 } from "lucide-react"
import type React from "react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { archiveNotification } from "@/lib/supabase/data-access"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NotificationListProps {
  notifications: any[]
  onMarkAsRead: (id: string) => void
  onClose: () => void
  isLoading?: boolean
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onClose,
  isLoading = false,
  setNotifications,
}: NotificationListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task":
        return <Check className="h-5 w-5 text-green-500" />
      case "reminder":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "event":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "class":
        return <BookOpen className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === "task") {
      router.push("/dashboard/student?tab=tasks")
    } else if (notification.type === "class") {
      router.push("/dashboard/student?tab=timetable")
    } else if (notification.type === "event") {
      router.push("/dashboard/student")
    }

    onClose()
  }

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click handler

    try {
      setDeletingIds((prev) => new Set(prev).add(id))

      // Archive instead of delete
      const result = await archiveNotification(id)

      if (result) {
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== id))

        toast({
          title: "Notification removed",
          description: "The notification has been archived",
        })
      }
    } catch (error) {
      console.error("Error archiving notification:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove notification",
      })
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[400px] pr-4">
      {notifications.length > 0 ? (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group rounded-md",
                !notification.is_read && "bg-muted/20",
                deletingIds.has(notification.id) && "opacity-50 pointer-events-none",
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3">
                <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", !notification.is_read && "font-semibold")}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>

                  {/* Sender information if available */}
                  {notification.sender_name && (
                    <p className="text-xs text-muted-foreground mt-1">From: {notification.sender_name}</p>
                  )}
                </div>
              </div>

              {/* Delete button that appears on hover */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      disabled={deletingIds.has(notification.id)}
                    >
                      {deletingIds.has(notification.id) ? (
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete notification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </ScrollArea>
  )
}
