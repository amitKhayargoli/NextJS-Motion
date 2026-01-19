import { Request, Response } from "express";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import z, { success } from "zod";

let userService = new UserService();

export class AuthController {
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
      const newUser = await userService.createUser(userData);
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

      const { token, existingUser } = await userService.login(parsedData.data);
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

  //2. Get All users
  getAllUsers = async (req: Request, res: Response) => {
    try {
      const userService = new UserService();
      const users = await userService.getAllUsers();

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
  };
}
