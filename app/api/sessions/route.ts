import { NextResponse } from "next/server";
import { Conversation } from "@/app/models/conversation";
import { connectDB } from '@/lib/mongodb';
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    // Ensure DB connection is established first
    await connectDB();

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // Add debug logs
    console.log("Checking for conversations...");
    const rawConversations = await Conversation.find({ channelId: channelId }).lean();
    console.log("Raw conversations found:", rawConversations);

    // Get unique sessions with their latest update time
    const sessions = await Conversation.aggregate([
      { $match: { channelId: channelId } },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $group: {
          _id: "$sessionId",
          sessionId: { $first: "$sessionId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          messages: { $first: "$messages" }  // Get all messages from the latest document
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 0,
          sessionId: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: {
            $filter: {
              input: "$messages",
              as: "message",
              cond: { $eq: ["$$message.role", "user"] }
            }
          }
        }
      },
      {
        $project: {
          sessionId: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: { $arrayElemAt: ["$lastMessage", -1] }  // Get the last user message
        }
      }
    ]);

    // Add some debug logging
    console.log("Channel ID:", channelId);
    console.log("Raw sessions:", sessions);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
