"use client"

import { useEffect, useState } from "react"
import { useChat, type UseChatOptions } from "ai/react"
import { Chat } from "@/components/ui/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { History, PlusIcon } from "lucide-react"
import { Button } from "./button"
import { SessionHistory } from "./SessionHistory"


type ChatProps = {
  initialMessages?: UseChatOptions["initialMessages"],
  session: string
  type: string
  channelId: string
  accountName: string
  propertyName: string
  accountId: string
}



export default function ChatBot(props: ChatProps ) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    isLoading,
    setMessages
  } = useChat({
    initialMessages: props.initialMessages,
    body: {
      channelId: props.channelId,
      accountId: props.accountId,
      sessionId: props.session,
      type: props.type
    },
    onResponse: async (response) => {
      // Store the user's message
      const userMessage = messages[messages.length - 1];
      if (userMessage && userMessage.role === 'user') {
        await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: props.session,
            channelId: props.channelId,
            messages: [userMessage]
          }),
        });
      }
    },
    onFinish: async (message) => {
      try {
        // Store the assistant's message
        await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: props.session,
            channelId: props.channelId,
            messages: [message]
          }),
        });
      } catch (error) {
        console.error('Error storing assistant message:', error);
      }
    }
  })
  

  const handleRefreshSession = () => {
    const newSessionId = 'cf_' + Math.random().toString(36).substr(2, 9);
    // Clear the chat messages
    setMessages([]);
    // Post message to parent window to update session
    window.parent.postMessage({
      type: "REFRESH_SESSION",
      sessionId: newSessionId
    }, "*");
  };

  const handleHistoryClick = () => {
    setIsHistoryOpen(!isHistoryOpen)
  }

  const handleSessionSelect = async (selectedSessionId: string) => {
    try {
      // Load messages for the selected session
      const response = await fetch(`/api/chat?sessionId=${selectedSessionId}`)
      if (response.ok) {
        const history = await response.json()
        if (history && history.length > 0) {
          console.log('Loading session messages:', history)
          setMessages(history)
        }
      }
      
      // Update localStorage and parent window
      window.parent.postMessage({
        type: "REFRESH_SESSION",
        sessionId: selectedSessionId
      }, "*")
      
      // Close the history panel
      setIsHistoryOpen(false)
    } catch (error) {
      console.error('Error loading session messages:', error)
    }
  }

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat?sessionId=${props.session}`);
        console.log('Loading chat history for session:', props.session);
        if (response.ok) {
          const history = await response.json();
          if (history && Array.isArray(history)) {
            console.log('Setting messages from history:', history);
            setMessages(history.filter(msg => msg.role === 'user' || msg.role === 'assistant'));
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [props.session, setMessages]);
  
  const defaultConfig = {
    headerBgColor: 'default',
    chatWindowColor: 'default',
    chatbotName: 'Buddy',
    avatarIcon: "https://www.datamyth.com/wp-content/uploads/2021/05/Header-Logo.png",
    defaultSuggestions: [
      { name: 'What is the Google Analytics?' },
      { name: 'What is Facebook ad insights?' },
  ]
  }
  
  const isDefaultHeader = defaultConfig.headerBgColor === 'default'
  const isDefaultWindow = defaultConfig.chatWindowColor === 'default'

  return (
    <div className={`w-full h-full rounded-md mx-auto z-20 relative`}>
      <div
        className={`flex gap-4 rounded-t-md px-6 py-4 items-center border justify-between ${
          isDefaultHeader ? `border-b border-border` : 'border border-border'
        }`}
        style={{
          backgroundColor: isDefaultHeader ? 'white' : defaultConfig.headerBgColor,
        }}>
          <div className="flex items-center gap-2">
        <div>
          <Avatar className="w-12 h-12">
            <AvatarImage 
              src={defaultConfig.avatarIcon} 
              alt={defaultConfig.chatbotName}
            />
            <AvatarFallback>{defaultConfig.chatbotName[0]}</AvatarFallback>
          </Avatar>
        </div>

        <h1 className="text-lg font-bold text-black">
          {defaultConfig.chatbotName}
        </h1>
        </div>
        <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={handleHistoryClick}>  
            <History className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRefreshSession}>  
            <PlusIcon className="w-4 h-4" />
        </Button>
        </div>
      </div>

      <div
        className={`border-l border-r border-b border-border h-full w-full rounded-b-md mx-auto p-6 flex relative ${
          isDefaultWindow ? 'white' : ''
        }`}
        style={{ 
          backgroundColor: "white" 
        }}>
          
          <SessionHistory 
            channelId={props.channelId}
            onSessionSelect={handleSessionSelect}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
          />
          <Chat
            suggestions={defaultConfig.defaultSuggestions.map((suggestion) => suggestion.name)}
            className="grow"
            messages={messages}
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            isGenerating={isLoading}
            stop={stop}
            append={append}
          />
      </div>
    </div>
  )
}
