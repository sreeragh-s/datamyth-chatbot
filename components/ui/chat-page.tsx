"use client";

import { useEffect, useState } from "react";
import { useChat, type UseChatOptions } from "ai/react";
import { Chat } from "@/components/ui/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatabaseIcon, History, PlusIcon } from "lucide-react";
import { Button } from "./button";
import { SessionHistory } from "./SessionHistory";
import { SessionHistoryChatPage } from "./session-history-chatpage";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SelectValue } from "@radix-ui/react-select";
import { SelectTrigger } from "./select";
import { SelectItem } from "@radix-ui/react-select";
import { Select } from "@radix-ui/react-select";
import { SelectContent } from "./select";
import { ChannelAccountSelector } from "@/components/channel-account-selector";

type ChatProps = {
  initialMessages?: UseChatOptions["initialMessages"];
  integrationData: any[];
};

export default function ChatBot(props: ChatProps) {
  const integrationData = props.integrationData;
  if (integrationData.length === 0) {
    return <div>No integration data found</div>;
  }

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [channelId, setChannelId] = useState(integrationData[0].channel_id);
  const [accountId, setAccountId] = useState(integrationData[0].account_id);
  const [session, setSession] = useState("cf_" + Math.random().toString(36).substr(2, 9));
  const [analyticsType, setAnalyticsType] = useState(integrationData[0].type);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    isLoading,
    setMessages,
  } = useChat({
    initialMessages: props.initialMessages,
    body: {
      channelId: channelId,
      accountId: accountId,
      sessionId: session,
      type: analyticsType,
    },
    onResponse: async (response) => {
      const userMessage = messages[messages.length - 1];
      if (userMessage && userMessage.role === "user") {
        await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: session,
            channelId: channelId,
            messages: [userMessage],
          }),
        });
      }
    },
    onFinish: async (message) => {
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: session,
            channelId: channelId,
            messages: [message],
          }),
        });
      } catch (error) {
        console.error("Error storing assistant message:", error);
      }
    },
  });

  const handleRefreshSession = () => {
    const newSessionId = "cf_" + Math.random().toString(36).substr(2, 9);
    // Clear the chat messages
    setMessages([]);
    // Post message to parent window to update session
    window.parent.postMessage(
      {
        type: "REFRESH_SESSION",
        sessionId: newSessionId,
      },
      "*"
    );
  };


  const handleSessionSelect = async (selectedSessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${selectedSessionId}`);
      if (response.ok) {
        const history = await response.json();
        if (history && history.length > 0) {
          console.log("Loading session messages:", history);
          setMessages(history);
        }
      }

      // Update localStorage and parent window
      window.parent.postMessage(
        {
          type: "REFRESH_SESSION",
          sessionId: selectedSessionId,
        },
        "*"
      );

      // Close the history panel
      setIsHistoryOpen(false);
    } catch (error) {
      console.error("Error loading session messages:", error);
    }
  };

  const handleSelectIntegration = (integration: any) => {
    const newSessionId = "cf_" + Math.random().toString(36).substr(2, 9);
    setSession(newSessionId);
    setChannelId(integration.channel_id);
    setAccountId(integration.account_id);
    setAnalyticsType(integration.type);
    setMessages([]);
  };
  



  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat?sessionId=${session}`);
        console.log("Loading chat history for session:", session);
        if (response.ok) {
          const history = await response.json();
          if (history && Array.isArray(history)) {
            console.log("Setting messages from history:", history);
            setMessages(
              history.filter(
                (msg) => msg.role === "user" || msg.role === "assistant"
              )
            );
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    loadChatHistory();
  }, [session, setMessages]);

  const defaultConfig = {
    headerBgColor: "default",
    chatWindowColor: "default",
    chatbotName: "Buddy",
    avatarIcon:
      "https://www.datamyth.com/wp-content/uploads/2021/05/Header-Logo.png",
    defaultSuggestions: [
      { name: "What is the Google Analytics?" },
      { name: "What is Facebook ad insights?" },
    ],
  };

  const isDefaultHeader = defaultConfig.headerBgColor === "default";
  const isDefaultWindow = defaultConfig.chatWindowColor === "default";

  return (
    <div className={`w-full h-full rounded-md mx-auto z-20 relative`}>
      <div
        className={`flex gap-4 rounded-t-md  items-center border justify-between ${
          isDefaultHeader ? `border-b border-border` : "border border-border"
        }`}
        style={{
          backgroundColor: isDefaultHeader
            ? "white"
            : defaultConfig.headerBgColor,
        }}
      >
        <div className="flex items-center gap-2">
          <ChannelAccountSelector 
            integrationData={integrationData}
            onSelectIntegration={handleSelectIntegration}
          />
        </div>
      </div>

      <div
        className={`border-l border-r border-b border-border h-full w-full rounded-b-md mx-auto  flex relative ${
          isDefaultWindow ? "white" : ""
        }`}
        style={{
          backgroundColor: "white",
        }}
      >
        <SessionHistoryChatPage
          onRefreshSession={handleRefreshSession}
          channelId={channelId}
          onSessionSelect={handleSessionSelect}
        />
        <Chat
        className="p-5"
          suggestions={defaultConfig.defaultSuggestions.map(
            (suggestion) => suggestion.name
          )}
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
  );
}
