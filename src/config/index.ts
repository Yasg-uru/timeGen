import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const config = {
  port: PORT,
  env: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

export default config;

