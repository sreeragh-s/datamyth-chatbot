"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "./scroll-area"
import { Button } from "./button"
import { formatDistanceToNow } from "date-fns"

interface Session {
  sessionId: string
  createdAt: string
  updatedAt: string
  lastMessage?: {
    role: "user"
    content: string
  }
}


interface SessionHistoryProps {
  channelId: string
  onSessionSelect: (sessionId: string) => void
  isOpen: boolean
  onClose: () => void
}

export function SessionHistory({ channelId, onSessionSelect, isOpen, onClose }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  console.log("sessions", sessions)
  
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/sessions?channelId=${channelId}`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchSessions()
    }
  }, [channelId, isOpen])

  if (!isOpen) return null

  return (
    <div className="absolute -left-[250px] w-64 -ml-100 h-[682px] bg-white border border-gray-200 -top-[82px] z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-20 text-gray-500">
              Loading...
            </div>
          ) : (
            sessions.map((session) => (
              <Button
                key={session.sessionId}
                variant="ghost"
                className="w-full justify-start mb-2" 
                onClick={() => onSessionSelect(session.sessionId)}
              >
                <div className="flex flex-col items-start my-2">
                  <span className="text-sm truncate">
                    {(session.lastMessage?.content?.slice(0, 50)) || 'New Session'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 