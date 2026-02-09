import { CreateUserDTO, LoginUserDTO, UserResponseDTO } from "../dtos/user.dto";
import { HttpError } from "../dtos/errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { email } from "zod";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

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
}
