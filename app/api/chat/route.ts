import { google } from "@ai-sdk/google"
import { convertToCoreMessages, streamText, tool } from "ai"
import { z } from "zod"
import { connectDB } from '@/lib/mongodb';
import { Conversation } from '@/app/models/conversation';

export const maxDuration = 30
export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json()
    const { messages, channelId, accountId, sessionId } = body
    const currentDate = new Date();

    if (sessionId) {
      console.log('Session ID:', sessionId);
      try {
        // Ensure the message has a role field
        const messageToStore = messages[messages.length - 1];
        if (messageToStore && (messageToStore.role === 'user' || messageToStore.role === 'assistant')) {
          await Conversation.findOneAndUpdate(
            { sessionId },
            { 
              $push: { messages: messageToStore }, // Store the complete message object including role
              $setOnInsert: { createdAt: new Date() },
              $set: { updatedAt: new Date() }
            },
            { upsert: true }
          );
        }
      } catch (error) {
        console.error('Error storing message:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
      console.log('Message stored in MongoDB');
    }

    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + `\n\nCurrent date information is:\n ${currentDate} ` ,
        },
        ...convertToCoreMessages(messages),
      ],
      maxSteps: 3,
      tools: {
        getAnalytics: tool({
          description: "Fetch analytics data from google analytics (GA4)",
          parameters: z.object({
            type: z.enum(['GA4'])
              .default('GA4')
              .describe("The platform to fetch data from"),
            startDate: z.string()
              .default(`${currentDate}`)
              .describe("Start date in YYYY-MM-DD format"),
            endDate: z.string()
              .default(`${currentDate}`)
              .describe("End date in YYYY-MM-DD format"),
            startDate2: z.string()
              .default("2024-2-1")
              .describe("Compare start date (optional)")
              .optional(),
            endDate2: z.string()
              .default("2024-2-1")
              .describe("Compare end date (optional)")
              .optional(),
            metrics: z.array(z.string()).default([]).describe("Metrics to fetch"),
            dimensions: z.array(z.string()).default([]).describe("Dimensions to fetch").optional(),
          }).refine(
            (data) => {
              const start = new Date(data.startDate);
              const end = new Date(data.endDate);
              if (data.startDate2 && data.endDate2) {
                const start2 = new Date(data.startDate2);
                const end2 = new Date(data.endDate2);
                return start <= end && start2 <= end2;
              }
              return start <= end;
            },
            {
              message: "End dates must be more recent than or equal to start dates",
              path: ["endDate"],
            }
          ),
          execute: async ({ type, startDate, endDate, startDate2, endDate2, metrics, dimensions }) => {
            console.log('Analytics Tool Execution - Input Parameters:', JSON.stringify({
              type,
              account_id: accountId,
              startDate,
              endDate,
              channel_id: channelId,
              startDate2,
              endDate2,
              metrics,
              dimensions
            }));

            const response = await fetch('https://api.datamyth.com/api/chat/data2', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://console.datamyth.com'
              },
              body: JSON.stringify({
                type,
                account_id: accountId,
                startDate,
                endDate,
                channel_id: channelId,
                startDate2,
                endDate2,
                metrics,
                dimensions
              }),
            });
            
            console.log('Analytics API Response Status:', response.status);
            
            if (!response.ok) {
              console.error('Analytics API error:', response.statusText);
              return {
                error: true,
                message: `Failed to fetch analytics data: ${response.statusText}`
              };
            }

            try {
              const data = await response.json();
              console.log('Analytics API Response Data:', data);
              return data;
            } catch (error) {
              console.error('Error parsing analytics response:', error);
              return {
                error: true,
                message: 'Failed to parse analytics data'
              };
            }
          },
        }),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Add a new GET endpoint to fetch chat history
export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const channelId = searchParams.get('channelId');

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    const query = { sessionId };
    if (channelId) {
      Object.assign(query, { channelId });
    }

    const conversation = await Conversation.findOne(query);
    return new Response(JSON.stringify(conversation?.messages || []), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


const SYSTEM_PROMPT = `You are a helpful AI assistant for a SaaS app called Datamyth which is an analytics platform to track your user engagement from your websites and social media the.

You are given a question and you need to answer it based on the information provided in the context.



these are some other metrics and dimensions you can use to call the tool that is used for the analytics and use comparision only when user prompts you to do so and startdate2 and enddate2 are optional  based on requiremernt :
		

".

`

