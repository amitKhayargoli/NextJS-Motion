import { TaskService } from "src/services/task.service";
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskResponseDTO,
} from "src/dtos/task.dto";

describe("TaskService", () => {
  let taskService: TaskService;
  let mockTaskRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByWorkspaceId: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const mockTask = {
    id: "task-1",
    workspaceId: "ws-1",
    title: "Test Task",
    description: "desc",
    isCompleted: false,
    priority: "HIGH",
    status: "TODO",
    dueDate: new Date("2025-12-31"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    assigneeId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTaskRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByWorkspaceId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    taskService = new TaskService(mockTaskRepository as any);
  });

  describe("createTask", () => {
    it("should create a task and return TaskResponseDTO", async () => {
      mockTaskRepository.create.mockResolvedValue(mockTask);

      const dto = new CreateTaskDTO({
        title: "Test Task",
        description: "desc",
        priority: "HIGH",
        dueDate: "2025-12-31",
        workspaceId: "ws-1",
      });

      const result = await taskService.createTask(dto);

      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate,
        workspaceId: dto.workspaceId,
        assigneeId: dto.assigneeId,
      });
      expect(result).toBeInstanceOf(TaskResponseDTO);
      expect(result.id).toBe("task-1");
      expect(result.title).toBe("Test Task");
    });
  });

  describe("getTaskById", () => {
    it("should return a TaskResponseDTO for an existing task", async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);

      const result = await taskService.getTaskById("task-1");

      expect(mockTaskRepository.findById).toHaveBeenCalledWith("task-1");
      expect(result).toBeInstanceOf(TaskResponseDTO);
      expect(result.id).toBe("task-1");
      expect(result.title).toBe("Test Task");
    });

    it("should throw 'Task not found' when task does not exist", async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getTaskById("nonexistent")).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("getWorkspaceTasks", () => {
    it("should return an array of TaskResponseDTOs", async () => {
      const tasks = [
        mockTask,
        { ...mockTask, id: "task-2", title: "Second Task" },
      ];
      mockTaskRepository.findByWorkspaceId.mockResolvedValue(tasks);

      const result = await taskService.getWorkspaceTasks("ws-1");

      expect(mockTaskRepository.findByWorkspaceId).toHaveBeenCalledWith("ws-1");
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TaskResponseDTO);
      expect(result[1].id).toBe("task-2");
    });

    it("should return an empty array when no tasks exist", async () => {
      mockTaskRepository.findByWorkspaceId.mockResolvedValue([]);

      const result = await taskService.getWorkspaceTasks("ws-1");

      expect(result).toEqual([]);
    });
  });

  describe("updateTask", () => {
    it("should update a task and return TaskResponseDTO", async () => {
      const updatedTask = { ...mockTask, title: "Updated Title" };
      mockTaskRepository.exists.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue(updatedTask);

      const dto = new UpdateTaskDTO("task-1", {
        title: "Updated Title",
        description: "desc",
      });

      const result = await taskService.updateTask(dto);

      expect(mockTaskRepository.exists).toHaveBeenCalledWith("task-1");
      expect(mockTaskRepository.update).toHaveBeenCalledWith("task-1", {
        title: dto.title,
        description: dto.description,
        isCompleted: dto.isCompleted,
        priority: dto.priority,
        dueDate: dto.dueDate,
        assigneeId: dto.assigneeId,
      });
      expect(result).toBeInstanceOf(TaskResponseDTO);
      expect(result.title).toBe("Updated Title");
    });

    it("should throw 'Task not found' if task does not exist", async () => {
      mockTaskRepository.exists.mockResolvedValue(false);

      const dto = new UpdateTaskDTO("nonexistent", { title: "X" });

      await expect(taskService.updateTask(dto)).rejects.toThrow(
        "Task not found",
      );
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("should delete a task successfully", async () => {
      mockTaskRepository.exists.mockResolvedValue(true);
      mockTaskRepository.delete.mockResolvedValue(undefined);

      await taskService.deleteTask("task-1");

      expect(mockTaskRepository.exists).toHaveBeenCalledWith("task-1");
      expect(mockTaskRepository.delete).toHaveBeenCalledWith("task-1");
    });

    it("should throw 'Task not found' if task does not exist", async () => {
      mockTaskRepository.exists.mockResolvedValue(false);

      await expect(taskService.deleteTask("nonexistent")).rejects.toThrow(
        "Task not found",
      );
      expect(mockTaskRepository.delete).not.toHaveBeenCalled();
    });
  });
});
