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
      // The default gives up after about 42 seconds; a phone that sleeps for a minute would then never hear again.
      .withAutomaticReconnect({ nextRetryDelayInMilliseconds: r => Math.min(30000, 2000 * 2 ** Math.min(r.previousRetryCount, 4)) })
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
    // Anything missed while disconnected is refetched, including an open thread's messages.
    const catchUp = () => {
      for (const key of [keys.threads, ['thread'], keys.boardAll, keys.map]) qc.invalidateQueries({ queryKey: key })
    }
    conn.onreconnected(catchUp)

    let retry: ReturnType<typeof setTimeout> | undefined
    const start = async (again = false) => {
      try { await conn.start(); if (again) catchUp() }
      catch { if (!stopped) retry = setTimeout(() => start(again), 5000) }
    }
    // If the connection closes for good (the phone slept, the server restarted), start over.
    conn.onclose(() => { if (!stopped) retry = setTimeout(() => start(true), 5000) })
    // Start on the next tick, so a mount that is torn down at once (React's dev double-mount) never opens a connection.
    const first = setTimeout(() => start(), 0)
    return () => { stopped = true; clearTimeout(first); clearTimeout(retry); conn.stop() }
  }, [enabled, org, qc])
}
