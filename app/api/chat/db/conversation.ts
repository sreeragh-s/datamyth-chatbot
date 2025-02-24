import { Conversation } from '@/app/models/conversation';

export async function storeMessages(messages: any[], sessionId: string, channelId: string) {
  console.log("Storing messages:", messages);
  const messagesToStore = Array.isArray(messages) ? messages : [messages];
  
  for (const messageToStore of messagesToStore) {
    if (messageToStore && (messageToStore.role === 'user' || messageToStore.role === 'assistant')) {
      await Conversation.findOneAndUpdate(
        { sessionId, channelId },
        { 
          $push: { messages: messageToStore },
          $setOnInsert: { 
            createdAt: new Date(),
            channelId: channelId
          },
          $set: { 
            updatedAt: new Date()
          }
        },
        { 
          upsert: true,
          new: true
        }
      );
    }
  }

  const conversation = await Conversation.findOne({ sessionId, channelId });
  console.log('Current conversation state:', conversation);
  return conversation;
}

export async function getConversation(sessionId: string) {
  const query = { sessionId };
  const conversation = await Conversation.findOne(query)
  ;
  return conversation?.messages || [];
} 