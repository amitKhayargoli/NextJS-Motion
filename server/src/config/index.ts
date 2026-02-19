import dotenv from "dotenv";

dotenv.config();

export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT)
  : 3000;

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;

export const MONGODB_URI: string =
  process.env.MONGODB_URI || "mongodb://localhost:27017/defaultdb";

export const JWT_SECRET: string = process.env.JWT_secret || "merosecret";

// Application level constants, with fallbacks
// if .env variables are not set
