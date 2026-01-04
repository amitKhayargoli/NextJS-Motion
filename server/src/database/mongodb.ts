import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}
