import mongoose from "mongoose";
import z from "zod";

export const UserSchema = z.object({
  email: z.email().min(5),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
  profilePicture: z.string().url().optional(),
});

export type UserType = z.infer<typeof UserSchema>;
