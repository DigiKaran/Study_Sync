"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Megaphone } from "lucide-react"
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime"
import { useAuth } from "@/lib/context/auth-context"
import { markNotificationAsRead } from "@/lib/supabase/data-access"
import type { Notification } from "@/lib/types"

export default function NoticePopup() {
  const [open, setOpen] = useState(false)
  const [currentNotice, setCurrentNotice] = useState<Notification | null>(null)
  const [noticeQueue, setNoticeQueue] = useState<Notification[]>([])
  const { user } = useAuth()

  // Process the next notice in the queue
  const processNextNotice = () => {
    if (noticeQueue.length > 0) {
      const nextNotice = noticeQueue[0]
      setCurrentNotice(nextNotice)
      setOpen(true)
      setNoticeQueue((prev) => prev.slice(1))
    }
  }

  // Handle closing the current notice
  const handleCloseNotice = async () => {
    if (currentNotice) {
      // Mark the notification as read
      await markNotificationAsRead(currentNotice.id)
      setOpen(false)
      setCurrentNotice(null)

      // Process the next notice after a short delay
      setTimeout(() => {
        processNextNotice()
      }, 500)
    }
  }

  // Set up real-time subscription for notifications
  useSupabaseRealtime({
    channel: "notifications",
    event: "INSERT",
    schema: "public",
    table: "notifications",
    filter: user?.id ? `user_id=eq.${user.id} and type=eq.notice` : undefined,
    callback: (payload) => {
      if (payload.eventType === "INSERT") {
        const newNotification = payload.new as Notification

        // Only process notice notifications
        if (newNotification.type === "notice") {
          // If no notice is currently showing, show this one
          if (!currentNotice && !open) {
            setCurrentNotice(newNotification)
            setOpen(true)
          } else {
            // Otherwise add to queue
            setNoticeQueue((prev) => [...prev, newNotification])
          }
        }
      }
    },
  })

  // When the dialog closes, process the next notice if available
  useEffect(() => {
    if (!open && !currentNotice && noticeQueue.length > 0) {
      processNextNotice()
    }
  }, [open, currentNotice, noticeQueue])

  // Get priority badge
  const getPriorityBadge = () => {
    if (!currentNotice) return null

    // Extract priority from the title if it contains it
    const isHighPriority =
      currentNotice.title.toLowerCase().includes("high") ||
      currentNotice.message.toLowerCase().includes("high priority")

    if (isHighPriority) {
      return <Badge variant="destructive">High Priority</Badge>
    }

    return <Badge variant="default">Notice</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {currentNotice?.title.replace("NOTICE: ", "")}
            </div>
            {getPriorityBadge()}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="whitespace-pre-line">{currentNotice?.message}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCloseNotice}>Acknowledge</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
