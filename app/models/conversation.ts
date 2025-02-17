import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  id: String,
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema); 