import { PrismaClient, User } from "../generated/prisma/client";

const prisma = new PrismaClient();

export interface IUserRepository {
  createUser(userData: any): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getAllUsers(): Promise<Omit<User, "passwordHash">[]>;
  updateUser(id: string, updateData: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  async createUser(userData: any): Promise<User> {
    // Destructure whatever might be coming from the service
    const { email, username, password, passwordHash } = userData;
    const finalHash = passwordHash || password;

    if (!email || !username || !finalHash) {
      throw new Error("Missing required fields: email, username, or password");
    }

    return await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: finalHash,
      },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: { username },
    });
  }

  async getAllUsers(): Promise<Omit<User, "passwordHash">[]> {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        // Exclude passwordHash for security
      },
    });
  }

  async updateUser(
    id: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    if (updateData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      // If email is the same, don't update it
      if (existingUser?.email === updateData.email) {
        delete updateData.email;
      }
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
