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
  const [channelId, setChannelId] = useState(
    integrationData[0].channel_id
  );
  const [accountId, setAccountId] = useState(
    integrationData[0].account_id
  );
  const [session, setSession] = useState(integrationData[0].session_id);
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

  const handleSelectDatabase = (selectedDatabase: string) => {
    const selectedIntegration = integrationData.find(
      (integration) => integration.id === selectedDatabase
    );
    if (selectedIntegration) {
      setChannelId(selectedIntegration.channel_id);
      setAccountId(selectedIntegration.account_id);
      setSession(selectedIntegration.session_id);
      setAnalyticsType(selectedIntegration.type);
    }
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
        className={`flex gap-4 rounded-t-md px-6 py-4 items-center border justify-between ${
          isDefaultHeader ? `border-b border-border` : "border border-border"
        }`}
        style={{
          backgroundColor: isDefaultHeader
            ? "white"
            : defaultConfig.headerBgColor,
        }}
      >
        <div className="flex items-center gap-2">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Databases</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <Select defaultValue={integrationData[0].id}>
                    <SelectTrigger
                      onClick={() => {
                        console.log(integrationData);
                      }}
                      id="select-database"
                      className="relative gap-2 ps-9"
                      aria-label="Select database"
                    >
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 group-has-[select[disabled]]:opacity-50">
                        <DatabaseIcon size={16} aria-hidden="true" />
                      </div>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      {integrationData.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          { integration.account_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </BreadcrumbItem>

              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        {/* <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={handleHistoryClick}>  
            <History className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRefreshSession}>  
            <PlusIcon className="w-4 h-4" />
        </Button>
        </div> */}
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
          suggestions={defaultConfig.defaultSuggestions.map(
            (suggestion) => suggestion.name
          )}
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
  );
}
