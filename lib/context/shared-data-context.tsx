"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { useAuth } from "./auth-context"
import { getTasks } from "@/lib/supabase/data-access"
import type { Task, TimeTableEntry } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useTimetable } from "@/lib/hooks/use-timetable"

interface SharedDataContextType {
  tasks: Task[]
  isLoadingTasks: boolean
  refreshTasks: () => Promise<void>
  timeTable: TimeTableEntry[]
  allTimeTable: TimeTableEntry[]
  isLoadingTimeTable: boolean
  refreshTimeTable: (forceRefresh?: boolean) => Promise<void>
  syncTimeTableToStudents: () => Promise<boolean>
  uploadTimeTable: (entries: Omit<TimeTableEntry, "id">[], replace?: boolean) => Promise<boolean>
  timetableFilter: { day?: string; subject?: string }
  setTimetableFilter: React.Dispatch<React.SetStateAction<{ day?: string; subject?: string }>>
  timetablePage: number
  setTimetablePage: React.Dispatch<React.SetStateAction<number>>
  totalTimetablePages: number
  lastSyncTime: Date | null
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined)

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Initialize timetable hook once at the context level
  const {
    timeTable,
    allTimeTable,
    isLoading: isLoadingTimeTable,
    refreshTimeTable: refreshTimetableData,
    syncTimeTableToStudents,
    uploadTimeTable,
    filter: timetableFilter,
    setFilter: setTimetableFilter,
    page: timetablePage,
    setPage: setTimetablePage,
    totalPages: totalTimetablePages,
    lastSyncTime,
  } = useTimetable(10) // Show 10 entries per page

  // Function to refresh tasks data
  const refreshTasks = async () => {
    if (!user) return

    try {
      setIsLoadingTasks(true)
      const fetchedTasks = await getTasks(user.id)
      if (fetchedTasks && Array.isArray(fetchedTasks)) {
        setTasks(fetchedTasks as Task[])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks data",
      })
    } finally {
      setIsLoadingTasks(false)
    }
  }

  // Wrapper for refreshTimeTable to ensure it's called correctly
  const refreshTimeTable = async (forceRefresh = false) => {
    await refreshTimetableData(forceRefresh)
  }

  // Initial data load
  useEffect(() => {
    if (user) {
      refreshTasks()
      refreshTimeTable()
    }
  }, [user])

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      tasks,
      isLoadingTasks,
      refreshTasks,
      timeTable,
      allTimeTable,
      isLoadingTimeTable,
      refreshTimeTable,
      syncTimeTableToStudents,
      uploadTimeTable,
      timetableFilter,
      setTimetableFilter,
      timetablePage,
      setTimetablePage,
      totalTimetablePages,
      lastSyncTime,
    }),
    [
      tasks,
      isLoadingTasks,
      timeTable,
      allTimeTable,
      isLoadingTimeTable,
      timetableFilter,
      timetablePage,
      totalTimetablePages,
      lastSyncTime,
    ],
  )

  return <SharedDataContext.Provider value={contextValue}>{children}</SharedDataContext.Provider>
}

export function useSharedData() {
  const context = useContext(SharedDataContext)
  if (context === undefined) {
    throw new Error("useSharedData must be used within a SharedDataProvider")
  }
  return context
}
