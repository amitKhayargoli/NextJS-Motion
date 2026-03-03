import { createMockPrisma, MockPrismaClient } from "../mockPrisma";
import { TaskRepository } from "src/repositories/task.repository";

describe("TaskRepository", () => {
  let mockPrisma: MockPrismaClient;
  let repo: TaskRepository;

  const now = new Date("2025-01-15");

  const mockPrismaTask = {
    id: "task-1",
    title: "Test Task",
    description: "A test task",
    isCompleted: false,
    priority: "HIGH",
    status: "TODO",
    dueDate: new Date("2025-02-01"),
    createdAt: now,
    updatedAt: now,
    workspaceId: "ws-1",
    assigneeId: "user-1",
  };

  const expectedITask = {
    id: "task-1",
    title: "Test Task",
    description: "A test task",
    isCompleted: false,
    priority: "HIGH",
    status: "TODO",
    dueDate: new Date("2025-02-01"),
    createdAt: now,
    updatedAt: now,
    workspaceId: "ws-1",
    assigneeId: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    repo = new TaskRepository(mockPrisma as any);
  });

  describe("create", () => {
    it("should create a task and return mapped ITask", async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      const result = await repo.create({
        title: "Test Task",
        description: "A test task",
        priority: "HIGH",
        dueDate: new Date("2025-02-01"),
        workspaceId: "ws-1",
        assigneeId: "user-1",
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Test Task",
          description: "A test task",
          priority: "HIGH",
          dueDate: new Date("2025-02-01"),
          workspaceId: "ws-1",
          assigneeId: "user-1",
        },
      });
      expect(result).toEqual(expectedITask);
    });

    it("should create a task with minimal data", async () => {
      const minimalTask = {
        ...mockPrismaTask,
        description: undefined,
        priority: undefined,
        dueDate: undefined,
        assigneeId: undefined,
      };
      mockPrisma.task.create.mockResolvedValue(minimalTask);

      const result = await repo.create({
        title: "Minimal Task",
        workspaceId: "ws-1",
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Minimal Task",
          description: undefined,
          priority: undefined,
          dueDate: undefined,
          workspaceId: "ws-1",
          assigneeId: undefined,
        },
      });
      expect(result.id).toBe("task-1");
    });
  });

  describe("findById", () => {
    it("should return mapped ITask when task is found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockPrismaTask);

      const result = await repo.findById("task-1");

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
      expect(result).toEqual(expectedITask);
    });

    it("should return null when task is not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await repo.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByWorkspaceId", () => {
    it("should return tasks ordered by createdAt desc", async () => {
      const tasks = [
        mockPrismaTask,
        { ...mockPrismaTask, id: "task-2", title: "Second" },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await repo.findByWorkspaceId("ws-1");

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("task-1");
      expect(result[1].id).toBe("task-2");
    });

    it("should return empty array when no tasks exist", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await repo.findByWorkspaceId("ws-empty");

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update only defined fields", async () => {
      const updatedTask = { ...mockPrismaTask, title: "Updated" };
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await repo.update("task-1", { title: "Updated" });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { title: "Updated" },
      });
      expect(result.title).toBe("Updated");
    });

    it("should set status to DONE when isCompleted is true", async () => {
      const completedTask = {
        ...mockPrismaTask,
        isCompleted: true,
        status: "DONE",
      };
      mockPrisma.task.update.mockResolvedValue(completedTask);

      await repo.update("task-1", { isCompleted: true });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { isCompleted: true, status: "DONE" },
      });
    });

    it("should set status to TODO when isCompleted is false", async () => {
      const uncompletedTask = {
        ...mockPrismaTask,
        isCompleted: false,
        status: "TODO",
      };
      mockPrisma.task.update.mockResolvedValue(uncompletedTask);

      await repo.update("task-1", { isCompleted: false });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { isCompleted: false, status: "TODO" },
      });
    });

    it("should handle multiple fields at once", async () => {
      const updatedTask = { ...mockPrismaTask, title: "New", priority: "LOW" };
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      await repo.update("task-1", {
        title: "New",
        priority: "LOW",
        description: "desc",
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { title: "New", priority: "LOW", description: "desc" },
      });
    });

    it("should not include undefined fields in update data", async () => {
      mockPrisma.task.update.mockResolvedValue(mockPrismaTask);

      await repo.update("task-1", {});

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {},
      });
    });
  });

  describe("delete", () => {
    it("should delete a task by id", async () => {
      mockPrisma.task.delete.mockResolvedValue(mockPrismaTask);

      await repo.delete("task-1");

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
    });

    it("should propagate errors from prisma", async () => {
      mockPrisma.task.delete.mockRejectedValue(new Error("Not found"));

      await expect(repo.delete("non-existent")).rejects.toThrow("Not found");
    });
  });

  describe("exists", () => {
    it("should return true when task exists", async () => {
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await repo.exists("task-1");

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when task does not exist", async () => {
      mockPrisma.task.count.mockResolvedValue(0);

      const result = await repo.exists("non-existent");

      expect(result).toBe(false);
    });
  });
});
