import { CreateUserDTO, LoginUserDTO, UserResponseDTO } from "../dtos/user.dto";
import { HttpError } from "../dtos/errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { email } from "zod";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { sendEmail } from "../config/email";

const CLIENT_URL = process.env.CLIENT_URL as string;

let userRepository = new UserRepository();

export class UserService {
  async createUser(data: CreateUserDTO) {
    // Business logic
    const emailExists = await userRepository.getUserByEmail(data.email);

    if (emailExists) {
      throw new HttpError(403, "Email already in use");
    }

    const usernameExists = await userRepository.getUserByUsername(
      data.username,
    );
    if (usernameExists) {
      throw new HttpError(403, "Username already in use");
    }

    // hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    data.password = hashedPassword;

    // create user
    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async login(data: LoginUserDTO) {
    const existingUser = await userRepository.getUserByEmail(data.email);

    if (!existingUser) {
      throw new HttpError(404, "User not found");
    }

    const isPasswordValid = await bcryptjs.compare(
      data.password,
      existingUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new HttpError(400, "Invalid Credentials");
    }

    const payload = {
      _id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    return { token, existingUser };
  }

  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await userRepository.getAllUsers();
    if (!users) {
      throw new HttpError(404, "No users found");
    }
    return users as UserResponseDTO[];
  }

  async updateUser(
    id: string,
    updateData: Partial<UserResponseDTO>,
  ): Promise<UserResponseDTO> {
    const updatedUser = await userRepository.updateUser(id, updateData);
    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }
    return updatedUser as UserResponseDTO;
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const { passwordHash, ...safeUser } = user as any;

    return safeUser;
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;

    console.log("CLIENT_URL:", CLIENT_URL);
    console.log("RESET LINK:", resetLink);
    await sendEmail(user.email, "Password Reset", html);

    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { passwordHash: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
}
