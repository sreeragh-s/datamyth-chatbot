import { google } from "@ai-sdk/google"
import { convertToCoreMessages, streamText } from "ai"
import { connectDB } from '@/lib/mongodb'
import { getAnalyticsTool } from './tools/analytics'
import { storeMessages, getConversation } from './db/conversation'
import { GA4_PROMPT } from './prompts/GA4-prompt'
import { GOOGLE_SEARCH_CONSOLE_PROMPT } from './prompts/Google-search-console'
import { NextResponse } from "next/server"
import { LINKEDIN_ADS_PROMPT } from "./prompts/LinkedIn-ads-prompt"
import { FACEBOOK_ADS_PROMPT } from "./prompts/Facebook-ads-prompt"
import { GOOGLE_ADS_PROMPT } from "./prompts/Google-ads-prompt"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json()
    const { messages, channelId, accountId, sessionId, type } = body
    console.log("body", body)
    const currentDate = new Date();

    console.log("currentDate", currentDate) 
    if (sessionId) {
      console.log('Session ID:', sessionId);  
      try {
        await storeMessages(messages, sessionId, channelId);
      } catch (error) {
        console.error('Error storing message:', error);
        throw error;
      }
    }

    const analyticsType = "Google Search Console"

    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        {
          role: "system",
          content: type === 'GA4' ? GA4_PROMPT : type === 'Google Search Console' ? GOOGLE_SEARCH_CONSOLE_PROMPT : type === 'Facebook Ads' ? FACEBOOK_ADS_PROMPT : type === 'Google Ads' ? GOOGLE_ADS_PROMPT : type === 'LinkedIn Ads' ? LINKEDIN_ADS_PROMPT : ''
        },
        ...convertToCoreMessages(messages),
      ],
      maxSteps: 3,
      tools: {
        getAnalytics: getAnalyticsTool(accountId, channelId, currentDate, analyticsType),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }
    console.log("Fetching chat history for session:", sessionId);
    
    const messages = await getConversation(sessionId);
    console.log("Retrieved messages:", messages);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}