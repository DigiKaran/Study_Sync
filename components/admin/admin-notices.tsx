"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  broadcastNoticeToAllUsers,
} from "@/lib/supabase/data-access"
import { AlertCircle, Bell, Calendar, Edit2, Megaphone, RefreshCw, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import type { Notice } from "@/lib/types"

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    is_active: true,
    expires_at: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch notices
  const fetchNotices = async () => {
    setIsLoading(true)
    try {
      const data = await getAllNotices()
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

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "medium",
      is_active: true,
      expires_at: "",
    })
  }

  // Open create dialog
  const handleOpenCreateDialog = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEditDialog = (notice: Notice) => {
    setSelectedNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      is_active: notice.is_active,
      expires_at: notice.expires_at || "",
    })
    setEditDialogOpen(true)
  }

  // Open confirm delete dialog
  const handleOpenConfirmDialog = (notice: Notice) => {
    setSelectedNotice(notice)
    setConfirmDialogOpen(true)
  }

  // Create notice
  const handleCreateNotice = async () => {
    if (!user) return

    try {
      // Validate form
      if (!formData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a title for the notice",
        })
        return
      }

      if (!formData.content.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter content for the notice",
        })
        return
      }

      const noticeData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        created_by: user.id,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      }

      const createdNotice = await createNotice(noticeData)

      if (createdNotice) {
        // Broadcast to all users if notice is active
        if (formData.is_active) {
          await broadcastNoticeToAllUsers({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            notice_id: createdNotice.id,
          })
        }

        toast({
          title: "Notice created",
          description: "The notice has been created and broadcast to all users",
        })

        // Refresh notices
        fetchNotices()
        setCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error creating notice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create notice",
      })
    }
  }

  // Update notice
  const handleUpdateNotice = async () => {
    if (!user || !selectedNotice) return

    try {
      // Validate form
      if (!formData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a title for the notice",
        })
        return
      }

      if (!formData.content.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter content for the notice",
        })
        return
      }

      const noticeData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      }

      const updatedNotice = await updateNotice(selectedNotice.id, noticeData)

      if (updatedNotice) {
        // If notice was inactive and is now active, broadcast it
        if (!selectedNotice.is_active && formData.is_active) {
          await broadcastNoticeToAllUsers({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            notice_id: selectedNotice.id,
          })
        }

        toast({
          title: "Notice updated",
          description: "The notice has been updated successfully",
        })

        // Refresh notices
        fetchNotices()
        setEditDialogOpen(false)
        setSelectedNotice(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error updating notice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notice",
      })
    }
  }

  // Delete notice
  const handleDeleteNotice = async () => {
    if (!selectedNotice) return

    try {
      const success = await deleteNotice(selectedNotice.id)

      if (success) {
        toast({
          title: "Notice deleted",
          description: "The notice has been deleted successfully",
        })

        // Refresh notices
        fetchNotices()
        setConfirmDialogOpen(false)
        setSelectedNotice(null)
      }
    } catch (error) {
      console.error("Error deleting notice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notice",
      })
    }
  }

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="default">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Notice Management
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotices} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenCreateDialog} className="gap-2">
            <Bell className="h-4 w-4" />
            Create Notice
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Notices</CardTitle>
          <CardDescription>
            Notices that are currently active and visible to students. These notices will trigger pop-up notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.filter((notice) => notice.is_active).length > 0 ? (
                    notices
                      .filter((notice) => notice.is_active)
                      .map((notice) => (
                        <TableRow key={notice.id}>
                          <TableCell className="font-medium">{notice.title}</TableCell>
                          <TableCell>{getPriorityBadge(notice.priority)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(notice.created_at), "PPP")}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(notice)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenConfirmDialog(notice)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Bell className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p>No active notices found.</p>
                          <Button variant="link" onClick={handleOpenCreateDialog} className="mt-1">
                            Create your first notice
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inactive Notices</CardTitle>
          <CardDescription>
            Notices that are currently inactive or have expired. These notices are not visible to students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.filter((notice) => !notice.is_active).length > 0 ? (
                    notices
                      .filter((notice) => !notice.is_active)
                      .map((notice) => (
                        <TableRow key={notice.id}>
                          <TableCell className="font-medium">{notice.title}</TableCell>
                          <TableCell>{getPriorityBadge(notice.priority)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(notice.created_at), "PPP")}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Inactive
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(notice)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenConfirmDialog(notice)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-muted-foreground">No inactive notices found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
            <DialogDescription>
              Create a new notice to broadcast to all students. Active notices will trigger pop-up notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="e.g. Important Announcement"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="col-span-3"
                placeholder="Enter the notice content here..."
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expires_at" className="text-right">
                Expires At
              </Label>
              <div className="col-span-3 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-sm text-muted-foreground">
                  {formData.is_active ? "Notice is active and will be broadcast to all students" : "Notice is inactive"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotice}>Create Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>
              Update the notice details. If you activate an inactive notice, it will be broadcast to all students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="e.g. Important Announcement"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-content" className="text-right">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="col-span-3"
                placeholder="Enter the notice content here..."
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-priority" className="text-right">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="edit-priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expires_at" className="text-right">
                Expires At
              </Label>
              <div className="col-span-3 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active" className="text-sm text-muted-foreground">
                  {formData.is_active ? "Notice is active and visible to students" : "Notice is inactive"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNotice}>Update Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Deleting this notice will remove it permanently from the system.</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
