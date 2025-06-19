"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { getTimeTableEntries, bulkCreateTimeTableEntries, deleteAllTimeTableEntries } from "@/lib/supabase/data-access"
import type { TimeTableEntry } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

interface TimeTableCache {
  data: TimeTableEntry[]
  timestamp: number
}

// In-memory cache
let timeTableCache: TimeTableCache | null = null

export function useTimetable(pageSize = 20) {
  const [timeTable, setTimeTable] = useState<TimeTableEntry[]>([])
  const [filteredTimeTable, setFilteredTimeTable] = useState<TimeTableEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [filter, setFilter] = useState<{ day?: string; subject?: string }>({})
  const { user } = useAuth()
  const { toast } = useToast()

  // Function to check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!timeTableCache) return false
    const now = Date.now()
    return now - timeTableCache.timestamp < CACHE_DURATION
  }, [])

  // Function to fetch timetable data with pagination
  const fetchTimeTable = useCallback(
    async (forceRefresh = false) => {
      try {
        setIsLoading(true)
        setError(null)

        // Use cache if valid and not forcing refresh
        if (!forceRefresh && isCacheValid()) {
          const cachedData = timeTableCache!.data
          setTimeTable(cachedData)
          setTotalPages(Math.ceil(cachedData.length / pageSize))

          // Apply filters to cached data
          applyFilters(cachedData)
          setIsLoading(false)
          return cachedData
        }

        const entries = await getTimeTableEntries()

        if (entries && Array.isArray(entries)) {
          // Sort entries by day and start time for consistency
          const sortedEntries = [...entries].sort((a, b) => {
            const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
            if (dayDiff !== 0) return dayDiff

            // If same day, sort by start time
            return a.startTime.localeCompare(b.startTime)
          })

          // Update cache
          timeTableCache = {
            data: sortedEntries,
            timestamp: Date.now(),
          }

          setTimeTable(sortedEntries)
          setTotalPages(Math.ceil(sortedEntries.length / pageSize))

          // Apply filters to new data
          applyFilters(sortedEntries)

          // Update last sync time
          const storedSyncTime = localStorage.getItem("lastTimeTableSync")
          if (storedSyncTime) {
            setLastSyncTime(new Date(storedSyncTime))
          }
        }
      } catch (error) {
        console.error("Error fetching timetable:", error)
        setError("Failed to load timetable data. Please try again later.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load timetable data",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [pageSize, isCacheValid, toast],
  )

  // Apply filters to the timetable data
  const applyFilters = useCallback(
    (data: TimeTableEntry[]) => {
      let filtered = [...data]

      if (filter.day) {
        filtered = filtered.filter((entry) => entry.day.toLowerCase() === filter.day!.toLowerCase())
      }

      if (filter.subject) {
        filtered = filtered.filter((entry) => entry.subject.toLowerCase().includes(filter.subject!.toLowerCase()))
      }

      setFilteredTimeTable(filtered)
      setTotalPages(Math.ceil(filtered.length / pageSize))
      setPage(1) // Reset to first page when filters change
    },
    [filter, pageSize],
  )

  // Effect to apply filters when filter or timetable changes
  useEffect(() => {
    if (timeTable.length > 0) {
      applyFilters(timeTable)
    }
  }, [filter, timeTable, applyFilters])

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchTimeTable()
    }
  }, [user, fetchTimeTable])

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredTimeTable.slice(startIndex, endIndex)
  }, [filteredTimeTable, page, pageSize])

  // Function to sync timetable to students
  const syncTimeTableToStudents = useCallback(async () => {
    try {
      // In a real app, this would update a flag in the database
      // or trigger a server-side event to notify students of changes

      // Update last sync time
      const now = new Date()
      localStorage.setItem("lastTimeTableSync", now.toISOString())
      setLastSyncTime(now)

      // Invalidate cache to force refresh for students
      timeTableCache = null

      toast({
        title: "Timetable synced",
        description: "The timetable has been synced and is now available to all students",
      })

      return true
    } catch (error) {
      console.error("Error syncing timetable:", error)
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "There was an error syncing the timetable",
      })
      return false
    }
  }, [toast])

  // Function to upload timetable data
  const uploadTimeTable = useCallback(
    async (entries: Omit<TimeTableEntry, "id">[], replace = false) => {
      try {
        setIsLoading(true)

        if (replace) {
          // Delete existing entries
          await deleteAllTimeTableEntries()
        }

        // Add new entries
        await bulkCreateTimeTableEntries(entries)

        // Invalidate cache
        timeTableCache = null

        // Refresh data
        await fetchTimeTable(true)

        toast({
          title: replace ? "Timetable replaced" : "Timetable merged",
          description: `${replace ? "Uploaded" : "Added"} ${entries.length} entries to ${replace ? "replace" : "merge with"} your timetable`,
        })

        return true
      } catch (error) {
        console.error("Error uploading timetable:", error)
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error uploading the timetable",
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTimeTable, toast],
  )

  return {
    timeTable: paginatedData,
    allTimeTable: timeTable,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    lastSyncTime,
    filter,
    setFilter,
    refreshTimeTable: (forceRefresh = false) => fetchTimeTable(forceRefresh),
    syncTimeTableToStudents,
    uploadTimeTable,
    clearFilters: () => setFilter({}),
  }
}
