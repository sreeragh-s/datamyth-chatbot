"use client"

import { useEffect } from "react"
import { useChat, type UseChatOptions } from "ai/react"
import { Chat } from "@/components/ui/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


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
      sessionId: props.session
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
            messages: [message] // This will be the assistant's message
          }),
        });
      } catch (error) {
        console.error('Error storing assistant message:', error);
      }
    }
  })
  
  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat?sessionId=${props.session}`);
        console.log('Loading chat history for session:', props.session);
        if (response.ok) {
          const history = await response.json();
          if (history && history.length > 0) {
            setMessages(history);
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
    chatbotName: 'DataMyth - Buddy',
    avatarIcon: "https://www.datamyth.com/wp-content/uploads/2021/05/Header-Logo.png",
    defaultSuggestions: [
      { name: 'What is the Google Analytics?' },
      { name: 'What is Facebook ad insights?' },
  ]
  }
  
  const isDefaultHeader = defaultConfig.headerBgColor === 'default'
  const isDefaultWindow = defaultConfig.chatWindowColor === 'default'

  return (
    <div className={`w-full h-full rounded-md mx-auto z-20`}>
      <div
        className={`flex gap-4 rounded-t-md px-6 py-4 items-center border ${
          isDefaultHeader ? `border-b border-border` : 'border border-border'
        }`}
        style={{
          backgroundColor: isDefaultHeader ? 'white' : defaultConfig.headerBgColor,
        }}>
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

      <div
        className={`border-l border-r border-b border-border h-full w-full rounded-b-md mx-auto p-6 flex ${
          isDefaultWindow ? 'white' : ''
        }`}
        style={{ 
          backgroundColor: "white" 
        }}>
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
