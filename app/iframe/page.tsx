"use client"

import { useEffect, useState } from "react"
import ChatBot from "@/components/ui/Chatbot"
import { MessageCircle, X } from "lucide-react" 

export default function ChatFrame() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState<string | null>(null)

  function postToParent(dimensions: { width: number, height: number }) {
    window.parent.postMessage(dimensions, "*")
  }

  useEffect(() => {
    postToParent({
      width: 100,
      height: 100,
    })
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "INIT") {
        setSessionId(event.data.sessionId)
        setType(event.data.type)
        setChannelId(event.data.channel_id)
        setAccountId(event.data.account_id)
        setAccountName(event.data.account_name)
        setPropertyName(event.data.property_name)
      }
    }
    
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    postToParent({
      width: isOpen ? 670 : 100,
      height: isOpen ? 800 : 100,
    })
  }, [isOpen])

  return (
    <div className="bg-transparent fixed bottom-4 right-4">
      {isOpen && (
        <div 
          className="absolute bottom-40 right-0 w-[600px] h-[600px] rounded-lg "
        >
 
      <div className="h-full">
            {sessionId && type && channelId && accountId && accountName && propertyName  && (
              <ChatBot 
                session={sessionId} 
                type={type} 
                channelId={channelId} 
                accountId={accountId} 
                accountName={accountName} 
                propertyName={propertyName}
              />
            )}
          </div>
      
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 bg-blue-500 text-white rounded-full shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 w-16 h-16 flex items-center justify-center`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}  
      </button>
    </div>
  )
}



