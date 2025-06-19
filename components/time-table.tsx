"use client"
import { useState, useEffect } from "react"
import { Clock, MapPin, User, RefreshCw, Filter, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSharedData } from "@/lib/context/shared-data-context"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface TimeTableProps {
  selectedDate: Date
}

export default function TimeTable({ selectedDate }: TimeTableProps) {
  const {
    timeTable,
    isLoadingTimeTable,
    refreshTimeTable,
    lastSyncTime,
    timetablePage,
    setTimetablePage,
    totalTimetablePages,
    timetableFilter,
    setTimetableFilter,
  } = useSharedData()

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Get current day
  const currentDay = selectedDate.toLocaleDateString("en-US", { weekday: "long" })

  // State for search
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Apply day filter based on selected date
  useEffect(() => {
    setTimetableFilter((prev) => ({
      ...prev,
      day: currentDay,
    }))
  }, [currentDay, setTimetableFilter])

  // Handle search
  const handleSearch = () => {
    setTimetableFilter((prev) => ({
      ...prev,
      subject: searchTerm,
    }))
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    setTimetableFilter((prev) => ({
      ...prev,
      subject: undefined,
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setTimetableFilter({})
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Class Schedule</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-primary/10")}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => refreshTimeTable(true)} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isLoadingTimeTable && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {lastSyncTime && (
        <div className="text-sm text-muted-foreground">Last updated: {lastSyncTime.toLocaleString()}</div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-2 p-4 border rounded-md bg-muted/20">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search by subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="icon" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
            {searchTerm && (
              <Button onClick={clearSearch} size="icon" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select
            value={timetableFilter.day || ""}
            onValueChange={(value) => setTimetableFilter((prev) => ({ ...prev, day: value || undefined }))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {isLoadingTimeTable ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="space-y-2">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-3 bg-card rounded-md border">
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {timeTable.length > 0 ? (
            <div className="space-y-6">
              {/* Group by day is handled by the filter now */}
              <div className={cn("border rounded-lg p-4")}>
                <h3 className="font-bold mb-2 flex items-center">
                  {timetableFilter.day || "All Days"}
                  {timetableFilter.day === currentDay && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h3>

                <div className="space-y-2">
                  {timeTable.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-card rounded-md border">
                      <div>
                        <div className="font-medium">{entry.subject}</div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {entry.startTime} - {entry.endTime}
                          {entry.location !== "N/A" && (
                            <>
                              <span className="mx-1">•</span>
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {entry.location}
                            </>
                          )}
                        </div>
                        {entry.professor !== "N/A" && (
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            Prof. {entry.professor}
                          </div>
                        )}
                      </div>
                      {!timetableFilter.day && (
                        <div className="text-xs font-medium bg-muted px-2 py-1 rounded">{entry.day}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalTimetablePages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setTimetablePage(Math.max(1, timetablePage - 1))}
                        className={cn(timetablePage === 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>

                    {[...Array(totalTimetablePages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => setTimetablePage(i + 1)} isActive={timetablePage === i + 1}>
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setTimetablePage(Math.min(totalTimetablePages, timetablePage + 1))}
                        className={cn(timetablePage === totalTimetablePages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed rounded-md">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p>No classes found for {timetableFilter.day || "any day"}.</p>
                {timetableFilter.subject && <p className="mt-1">Try removing your search filters.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
