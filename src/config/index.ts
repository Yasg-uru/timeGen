import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const config = {
  port: PORT,
  env: process.env.NODE_ENV || 'development'
};

export default config;
