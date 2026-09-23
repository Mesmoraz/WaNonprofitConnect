import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { MOCK } from './client'
import { keys } from './hooks'
import type { Listing, Message, Thread } from './types'

/**
 * Keeps the cache live over SignalR at /hubs/exchange (cookie-authenticated; the hub joins the caller's org group).
 * Mount once, inside the signed-in, confirmed part of the app. In mock mode there is no hub; mutations invalidate directly.
 */
/** `org` restarts the connection when you switch organization, so the hub puts you in the right group. */
export function useExchangeHub(enabled: boolean, org?: string) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!enabled || MOCK) return
    let stopped = false
    const conn: HubConnection = new HubConnectionBuilder()
      .withUrl('/hubs/exchange', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .build()

    conn.on('threadChanged', (t: Thread) => {
      qc.invalidateQueries({ queryKey: keys.threads })
      qc.invalidateQueries({ queryKey: keys.thread(t.id) })
      qc.invalidateQueries({ queryKey: keys.boardAll })
      qc.invalidateQueries({ queryKey: keys.map })
    })
    conn.on('messageAdded', (m: Message) => {
      qc.invalidateQueries({ queryKey: keys.thread(m.threadId) })
      qc.invalidateQueries({ queryKey: keys.threads })
    })
    conn.on('listingAdded', (_l: Listing) => {
      qc.invalidateQueries({ queryKey: keys.boardAll })
      qc.invalidateQueries({ queryKey: keys.map })
    })
    // Anything missed while disconnected is refetched.
    conn.onreconnected(() => { qc.invalidateQueries({ queryKey: keys.threads }); qc.invalidateQueries({ queryKey: keys.boardAll }) })

    const start = async () => {
      try { await conn.start() }
      catch { if (!stopped) setTimeout(start, 5000) }
    }
    // Start on the next tick, so a mount that is torn down at once (React's dev double-mount) never opens a connection.
    const first = setTimeout(start, 0)
    return () => { stopped = true; clearTimeout(first); conn.stop() }
  }, [enabled, org, qc])
}
