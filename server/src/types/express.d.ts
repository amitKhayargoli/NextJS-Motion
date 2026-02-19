// src/types/express.d.ts
import { User, Note, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userRole?: Role;
      note?: Note;
    }
  }
}

export {};
