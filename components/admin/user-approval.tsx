"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getAllUsers, updateUser } from "@/lib/supabase/data-access"
import type { User } from "@/lib/types"

export default function UserApproval() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers as User[])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleApprove = async (userId: string) => {
    try {
      const updatedUser = await updateUser(userId, {
        approved_at: new Date().toISOString(),
      })

      if (updatedUser) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, approved_at: new Date().toISOString() } : user)))

        toast({
          title: "User approved",
          description: "The user can now access the system",
        })
      }
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user",
      })
    }
  }

  const handleDeny = async (userId: string) => {
    if (confirm("Are you sure you want to deny this user? This will remove them from the pending list.")) {
      try {
        // Since we don't have a denied_at column, we'll just set approved_at to null
        // In a real app, you might want to add a denied_at column or a status field
        const success = await updateUser(userId, {
          approved_at: null,
        })

        if (success) {
          // Remove the user from the list
          setUsers(users.filter((user) => user.id !== userId))

          toast({
            title: "User denied",
            description: "The user has been denied access to the system",
          })
        }
      } catch (error) {
        console.error("Error denying user:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to deny user",
        })
      }
    }
  }

  // Filter users based on approval status
  const pendingUsers = users.filter((user) => !user.approved_at)
  const approvedUsers = users.filter((user) => user.approved_at)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">User Approval</h2>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Approval ({pendingUsers.length})
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length > 0 ? (
                pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(user.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeny(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No pending users
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Approved Users ({approvedUsers.length})
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedUsers.length > 0 ? (
                approvedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.approved_at!).toLocaleDateString()}</TableCell>
                    <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No approved users
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
