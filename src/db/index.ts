import mongoose from 'mongoose';
import { logger } from '../utils/logger';
// const MONGO_URI = 'mongodb+srv://yashpawar12122004:KaeUSgv4Letln7rX@crushsphere-location-se.zu98e.mongodb.net/?retryWrites=true&w=majority&appName=crushsphere-location-service';
const MONGO_URI = "mongodb+srv://yash26it074_db_user:eG6vYfetY2IszUD0@cluster0.j3qnxhy.mongodb.net/?appName=Cluster0";
export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error', err);
    process.exit(1);
  }
}

export default connectDB;
