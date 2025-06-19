"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface SupabaseRealtimeOptions {
  channel?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  schema?: string
  table: string
  filter?: string
  callback: (payload: any) => void
}

export function useSupabaseRealtime({
  channel = "public_channel",
  event = "*",
  schema = "public",
  table,
  filter,
  callback,
}: SupabaseRealtimeOptions) {
  useEffect(() => {
    // Create a unique channel name
    const channelName = `${channel}_${table}${filter ? `_${filter}` : ""}`

    // Build the channel with filter if provided
    const channelBuilder = supabase.channel(channelName).on(
      "postgres_changes",
      {
        event,
        schema,
        table,
        ...(filter ? { filter } : {}),
      },
      callback,
    )

    // Subscribe to the channel
    const subscription = channelBuilder.subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, event, schema, table, filter, callback])

  return null
}
