"use client";

import { useEffect, useState } from "react";
import ChatBot from "@/components/ui/chat-page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseIcon } from "lucide-react";
import { MessageCircle, X } from "lucide-react";

export default function ChatPageFrame() {
  const [integrationData, setIntegrationData] = useState<any[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Add origin verification

      console.log("Received message event:", event.data);

      if (event.data?.type === "INTEGRATION_DATA") {
        try {
          const data = event.data.integrationData;
          console.log("Processing integration data:", data);
          setIntegrationData(data);
        } catch (error) {
          console.error("Error processing integration data:", error);
        }
      }

      if (event.data?.type === "TEST_MESSAGE") {
        console.log("Test message received:", event.data.text);
      }
    };

    window.addEventListener("message", handleMessage);

    // Signal to parent that frame is ready
    window.parent.postMessage({ type: "FRAME_READY" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  console.log(integrationData);
;
  return (
    <div className="bg-transparent fixed w-full h-full">
      <ChatBot integrationData={integrationData} />
    </div>
  );
}
