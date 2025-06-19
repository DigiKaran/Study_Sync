"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, RefreshCw, AlertCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import { getActiveNotices } from "@/lib/supabase/data-access"
import { useToast } from "@/components/ui/use-toast"
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime"
import type { Notice } from "@/lib/types"

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // Fetch notices
  const fetchNotices = async () => {
    setIsLoading(true)
    try {
      const data = await getActiveNotices()
      setNotices(data as Notice[])
    } catch (error) {
      console.error("Error fetching notices:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notices",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  // Set up real-time subscription for notices
  useSupabaseRealtime({
    channel: "notices",
    event: "*",
    schema: "public",
    table: "notices",
    callback: (payload) => {
      if (payload.eventType === "INSERT") {
        // A new notice was added
        const newNotice = payload.new as Notice

        // Only add if it's active
        if (newNotice.is_active) {
          setNotices((prev) => [newNotice, ...prev])
        }
      } else if (payload.eventType === "UPDATE") {
        // A notice was updated
        const updatedNotice = payload.new as Notice

        setNotices((prev) => {
          // If notice became inactive, remove it
          if (!updatedNotice.is_active) {
            return prev.filter((n) => n.id !== updatedNotice.id)
          }

          // Otherwise update it
          return prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n))
        })
      } else if (payload.eventType === "DELETE") {
        // A notice was deleted
        const deletedNotice = payload.old as Notice
        setNotices((prev) => prev.filter((n) => n.id !== deletedNotice.id))
      }
    },
  })

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>
      case "medium":
        return <Badge variant="default">Medium Priority</Badge>
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>
      default:
        return <Badge variant="outline">Unknown Priority</Badge>
    }
  }

  // Filter notices based on active tab
  const filteredNotices = activeTab === "high" ? notices.filter((notice) => notice.priority === "high") : notices

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Notices & Announcements
        </h2>
        <Button variant="outline" onClick={fetchNotices} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Notices</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <Card key={notice.id} className={notice.priority === "high" ? "border-destructive/50" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{notice.title}</CardTitle>
                      {getPriorityBadge(notice.priority)}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Posted on {format(new Date(notice.created_at), "PPP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No notices available</h3>
              <p className="text-muted-foreground mt-1">There are currently no active notices or announcements.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="high" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            </div>
          ) : filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="border-destructive/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        {notice.title}
                      </CardTitle>
                      {getPriorityBadge(notice.priority)}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Posted on {format(new Date(notice.created_at), "PPP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No high priority notices</h3>
              <p className="text-muted-foreground mt-1">
                There are currently no high priority notices or announcements.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
