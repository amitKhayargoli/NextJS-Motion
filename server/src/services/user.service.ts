import { CreateUserDTO, LoginUserDTO, UserResponseDTO } from "../dtos/user.dto";
import { HttpError } from "../errors/htttp-error";
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
      throw new HttpError("Email already in use", 403);
    }

    const usernameExists = await userRepository.getUserByUsername(
      data.username
    );
    if (usernameExists) {
      throw new HttpError("Username already in use", 403);
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
      throw new HttpError("User not found", 404);
    }

    const isPasswordValid = await bcryptjs.compare(
      data.password,
      existingUser.passwordHash
    );

    if (!isPasswordValid) {
      throw new HttpError("Invalid Credentials", 400);
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
      throw new HttpError("No users found", 404);
    }
    return users as UserResponseDTO[];
  }
}
