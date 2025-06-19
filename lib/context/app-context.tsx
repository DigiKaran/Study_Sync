"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { SharedDataProvider } from "@/lib/context/shared-data-context"

interface AppContextType {
  selectedDate: Date
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { user } = useAuth()

  return (
    <AppContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
      }}
    >
      <SharedDataProvider>{children}</SharedDataProvider>
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
