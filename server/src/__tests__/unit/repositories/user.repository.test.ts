import { createMockPrisma, MockPrismaClient } from "../mockPrisma";
import { UserRepository } from "src/repositories/user.repository";

describe("UserRepository", () => {
  let mockPrisma: MockPrismaClient;
  let repo: UserRepository;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    passwordHash: "hashed-password",
    profilePicture: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    repo = new UserRepository(mockPrisma as any);
  });

  describe("createUser", () => {
    it("should create a user with passwordHash field", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await repo.createUser({
        email: "test@example.com",
        username: "testuser",
        passwordHash: "hashed-password",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          username: "testuser",
          passwordHash: "hashed-password",
        },
      });
      expect(result).toEqual(mockUser);
    });

    it("should fall back to password field when passwordHash is missing", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await repo.createUser({
        email: "test@example.com",
        username: "testuser",
        password: "hashed-password",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          username: "testuser",
          passwordHash: "hashed-password",
        },
      });
    });

    it("should throw if email is missing", async () => {
      await expect(
        repo.createUser({ username: "testuser", password: "pass" }),
      ).rejects.toThrow("Missing required fields");
    });

    it("should throw if username is missing", async () => {
      await expect(
        repo.createUser({ email: "test@example.com", password: "pass" }),
      ).rejects.toThrow("Missing required fields");
    });

    it("should throw if both password and passwordHash are missing", async () => {
      await expect(
        repo.createUser({ email: "test@example.com", username: "testuser" }),
      ).rejects.toThrow("Missing required fields");
    });
  });

  describe("getUserById", () => {
    it("should return a user when found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.getUserById("user-1");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.getUserById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return a user when found by email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.getUserByEmail("test@example.com");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when email is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.getUserByEmail("missing@example.com");

      expect(result).toBeNull();
    });
  });

  describe("getUserByUsername", () => {
    it("should return a user when found by username", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repo.getUserByUsername("testuser");

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when username is not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.getUserByUsername("unknown");

      expect(result).toBeNull();
    });
  });

  describe("getAllUsers", () => {
    it("should return all users without passwordHash", async () => {
      const usersWithoutHash = [
        { id: "user-1", email: "a@b.com", username: "a", profilePicture: null },
        {
          id: "user-2",
          email: "c@d.com",
          username: "b",
          profilePicture: "pic.png",
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(usersWithoutHash);

      const result = await repo.getAllUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          username: true,
          profilePicture: true,
        },
      });
      expect(result).toEqual(usersWithoutHash);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no users exist", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await repo.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe("updateUser", () => {
    it("should update user data", async () => {
      const updatedUser = { ...mockUser, username: "newname" };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repo.updateUser("user-1", {
        username: "newname",
      } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { username: "newname" },
      });
      expect(result).toEqual(updatedUser);
    });

    it("should skip email update when email is same as existing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repo.updateUser("user-1", { email: "test@example.com" } as any);

      // email should be removed from updateData since it matches existing
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {},
      });
    });

    it("should update email when it differs from existing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, email: "new@example.com" };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await repo.updateUser("user-1", { email: "new@example.com" } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { email: "new@example.com" },
      });
    });

    it("should not check existing user when email is not in updateData", async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repo.updateUser("user-1", { username: "updated" } as any);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should return true on successful deletion", async () => {
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await repo.deleteUser("user-1");

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when deletion fails", async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error("Not found"));

      const result = await repo.deleteUser("non-existent");

      expect(result).toBe(false);
    });
  });
});
