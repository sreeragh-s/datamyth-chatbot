import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

let cachedConnection: typeof mongoose | null = null;

export const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI as string, opts);
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error; 
  }
}; 