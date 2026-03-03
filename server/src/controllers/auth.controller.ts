import { Request, Response } from "express";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import z from "zod";

export class AuthController {
  constructor(private userService: UserService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.me = this.me.bind(this);
    this.sendResetPasswordEmail = this.sendResetPasswordEmail.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  //1. Register User
  async register(req: Request, res: Response) {
    try {
      // validate request body
      const parsedData = CreateUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          errors: z.prettifyError(parsedData.error),
        });
      }
      const userData: CreateUserDTO = parsedData.data;
      const newUser = await this.userService.createUser(userData);
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  //2. Login
  async login(req: Request, res: Response) {
    try {
      const parsedData = LoginUserDTO.safeParse(req.body);

      if (!parsedData.success) {
        return res
          .status(400)
          .json({ success: false, errors: z.prettifyError(parsedData.error) });
      }

      const { token, existingUser } = await this.userService.login(
        parsedData.data,
      );
      return res.status(200).json({
        success: true,
        data: existingUser,
        token,
        message: "Login Success",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  //3. Get All users
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
        message: "Users fetched successfully",
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID not provided" });
      }
      let parsedData = UpdateUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(parsedData.error) });
      }
      if (req.file) {
        // if file is being uploaded
        parsedData.data.profilePicture = `/uploads/${req.file.filename}`;
      }
      const updatedUser = await this.userService.updateUser(
        userId,
        parsedData.data,
      );
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  //4. Who am I
  async me(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await this.userService.getUserById(userId);

      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async sendResetPasswordEmail(req: Request, res: Response) {
    try {
      const email = req.body.email;
      const user = await this.userService.sendResetPasswordEmail(email);
      return res.status(200).json({
        success: true,
        data: user,
        message: "If the email is registered, a reset link has been sent.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const { newPassword } = req.body;
      await this.userService.resetPassword(token, newPassword);
      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
