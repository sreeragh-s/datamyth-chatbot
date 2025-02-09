'use client'
import { usePromptTransformer } from "@/hooks/use-prompt-transformer";

export default function YourComponent() {
    const transformedPrompt = usePromptTransformer();
  
    return (
      <div>
        <pre>{transformedPrompt}</pre>
      </div>
    );
  }