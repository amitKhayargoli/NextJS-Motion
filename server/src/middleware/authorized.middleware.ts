import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../dtos/errors/http-error";
import { JWT_SECRET } from "../config";
import { UserRepository } from "../repositories/user.repository";
import { PrismaClient, Role, User } from "@generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userRole?: Role;
    }
  }
}
// Adding user info to req object

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
export const authorizedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new HttpError(401, "Unauthorized Token Malformed");
    const token = authHeader.split(" ")[1]; // "Bearer <token>" [1] -> token
    if (!token) throw new HttpError(401, "Unauthorized Token Missing");
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    if (!decoded || !decoded._id)
      throw new HttpError(401, "Unauthorized Token Invalid");

    const user = await userRepository.getUserById(decoded._id);
    if (!user) throw new HttpError(401, "Unauthorized! User Not Found");

    req.user = user; // attach user info to req object
    return next();
  } catch (error: Error | any) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
