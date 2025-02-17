"use client"

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
  } = useChat({
    initialMessages: props.initialMessages,
    body: {
      channelId: "61cd6644714a91c5fddd500b",
      accountId: "421612556",
    }
  })
  
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
