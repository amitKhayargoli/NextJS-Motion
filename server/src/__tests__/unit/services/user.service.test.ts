import { UserService } from "src/services/user.service";
import { HttpError } from "src/dtos/errors/http-error";

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-token"),
  verify: jest.fn(),
}));

jest.mock("src/config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "src/config/email";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: {
    createUser: jest.Mock;
    getUserByEmail: jest.Mock;
    getUserByUsername: jest.Mock;
    getUserById: jest.Mock;
    getAllUsers: jest.Mock;
    updateUser: jest.Mock;
    deleteUser: jest.Mock;
  };

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    passwordHash: "hashedPassword",
    profilePicture: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    userService = new UserService(mockUserRepository as any);
  });

  describe("createUser", () => {
    const createData = {
      email: "new@example.com",
      username: "newuser",
      password: "password123",
    };

    it("should create a user successfully", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(null);
      mockUserRepository.getUserByUsername.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(mockUser);

      const result = await userService.createUser(createData);

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        createData.email,
      );
      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith(
        createData.username,
      );
      expect(bcryptjs.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockUserRepository.createUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpError(403) if email already in use", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(createData)).rejects.toThrow(
        HttpError,
      );
      await expect(userService.createUser(createData)).rejects.toMatchObject({
        statusCode: 403,
        message: "Email already in use",
      });
    });

    it("should throw HttpError(403) if username already in use", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(null);
      mockUserRepository.getUserByUsername.mockResolvedValue(mockUser);

      await expect(userService.createUser(createData)).rejects.toThrow(
        HttpError,
      );
      await expect(userService.createUser(createData)).rejects.toMatchObject({
        statusCode: 403,
        message: "Username already in use",
      });
    });
  });

  describe("login", () => {
    const loginData = { email: "test@example.com", password: "password123" };

    it("should return token and user on successful login", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.login(loginData);

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        loginData.email,
      );
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.passwordHash,
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          _id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        expect.any(String),
        { expiresIn: "7d" },
      );
      expect(result).toEqual({ token: "mock-token", existingUser: mockUser });
    });

    it("should throw HttpError(404) if user not found", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(null);

      await expect(userService.login(loginData)).rejects.toThrow(HttpError);
      await expect(userService.login(loginData)).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });

    it("should throw HttpError(400) if password is invalid", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(userService.login(loginData)).rejects.toThrow(HttpError);
      await expect(userService.login(loginData)).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid Credentials",
      });
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const users = [
        { id: "1", email: "a@a.com", username: "a" },
        { id: "2", email: "b@b.com", username: "b" },
      ];
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      const result = await userService.getAllUsers();

      expect(mockUserRepository.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it("should throw HttpError(404) if no users found", async () => {
      mockUserRepository.getAllUsers.mockResolvedValue(null);

      await expect(userService.getAllUsers()).rejects.toThrow(HttpError);
      await expect(userService.getAllUsers()).rejects.toMatchObject({
        statusCode: 404,
        message: "No users found",
      });
    });
  });

  describe("updateUser", () => {
    it("should update a user successfully", async () => {
      const updateData = { username: "updated" };
      const updatedUser = { ...mockUser, username: "updated" };
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await userService.updateUser("user-1", updateData);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        "user-1",
        updateData,
      );
      expect(result).toEqual(updatedUser);
    });

    it("should throw HttpError(404) if user not found", async () => {
      mockUserRepository.updateUser.mockResolvedValue(null);

      await expect(userService.updateUser("bad-id", {})).rejects.toThrow(
        HttpError,
      );
      await expect(userService.updateUser("bad-id", {})).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });
  });

  describe("getUserById", () => {
    it("should return user without passwordHash", async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("user-1");

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith("user-1");
      expect(result).not.toHaveProperty("passwordHash");
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        profilePicture: mockUser.profilePicture,
      });
    });

    it("should throw HttpError(404) if user not found", async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);

      await expect(userService.getUserById("bad-id")).rejects.toThrow(
        HttpError,
      );
      await expect(userService.getUserById("bad-id")).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });
  });

  describe("sendResetPasswordEmail", () => {
    it("should send reset email successfully", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

      const result =
        await userService.sendResetPasswordEmail("test@example.com");

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        expect.any(String),
        { expiresIn: "1h" },
      );
      expect(sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        "Password Reset",
        expect.stringContaining("reset-password"),
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpError(400) if email is not provided", async () => {
      await expect(
        userService.sendResetPasswordEmail(undefined),
      ).rejects.toThrow(HttpError);
      await expect(
        userService.sendResetPasswordEmail(undefined),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Email is required",
      });
    });

    it("should throw HttpError(404) if user not found", async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(null);

      await expect(
        userService.sendResetPasswordEmail("nobody@example.com"),
      ).rejects.toThrow(HttpError);
      await expect(
        userService.sendResetPasswordEmail("nobody@example.com"),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: "user-1" });
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockUserRepository.updateUser.mockResolvedValue(mockUser);

      const result = await userService.resetPassword(
        "valid-token",
        "newpass123",
      );

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(String),
      );
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith("user-1");
      expect(bcryptjs.hash).toHaveBeenCalledWith("newpass123", 10);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith("user-1", {
        passwordHash: "hashedPassword",
      });
    });

    it("should throw HttpError(400) if token or password missing", async () => {
      await expect(
        userService.resetPassword(undefined, "pass"),
      ).rejects.toThrow(HttpError);
      await expect(
        userService.resetPassword("token", undefined),
      ).rejects.toThrow(HttpError);
      await expect(
        userService.resetPassword(undefined, undefined),
      ).rejects.toThrow(HttpError);
    });

    it("should throw HttpError(400) if token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid token");
      });

      await expect(
        userService.resetPassword("bad-token", "newpass"),
      ).rejects.toThrow(HttpError);
      await expect(
        userService.resetPassword("bad-token", "newpass"),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid or expired token",
      });
    });
  });
});
