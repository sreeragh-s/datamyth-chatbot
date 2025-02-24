import { google } from "@ai-sdk/google"
import { convertToCoreMessages, streamText } from "ai"
import { connectDB } from '@/lib/mongodb'
import { getAnalyticsTool } from './tools/analytics'
import { storeMessages, getConversation } from './db/conversation'
import { GA4_PROMPT } from './prompts/GA4-prompt'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json()
    const { messages, channelId, accountId, sessionId, type } = body
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

    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        {
          role: "system",
          content: type === 'GA4' ? GA4_PROMPT : ''
        },
        ...convertToCoreMessages(messages),
      ],
      maxSteps: 3,
      tools: {
        getAnalytics: getAnalyticsTool(accountId, channelId, currentDate),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const channelId = searchParams.get('channelId');

    if (!sessionId || !channelId) {
      return new Response('Session ID and channel ID are required', { status: 400 });
    }

    const messages = await getConversation(sessionId, channelId);
    console.log('Returning messages:', messages); // Debug log
    
    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}