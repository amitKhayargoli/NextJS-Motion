import { ITaskRepository } from "../repositories/task.repository";
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskResponseDTO,
} from "../dtos/task.dto";

export class TaskService {
  constructor(private taskRepository: ITaskRepository) {}

  async createTask(dto: CreateTaskDTO): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      workspaceId: dto.workspaceId,
      assigneeId: dto.assigneeId,
    });

    return new TaskResponseDTO(task);
  }

  async getTaskById(taskId: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) throw new Error("Task not found");
    return new TaskResponseDTO(task);
  }

  async getWorkspaceTasks(workspaceId: string): Promise<TaskResponseDTO[]> {
    const tasks = await this.taskRepository.findByWorkspaceId(workspaceId);
    return TaskResponseDTO.fromArray(tasks);
  }

  async updateTask(dto: UpdateTaskDTO): Promise<TaskResponseDTO> {
    const exists = await this.taskRepository.exists(dto.taskId);
    if (!exists) throw new Error("Task not found");

    const task = await this.taskRepository.update(dto.taskId, {
      title: dto.title,
      description: dto.description,
      isCompleted: dto.isCompleted,
      priority: dto.priority,
      dueDate: dto.dueDate,
      assigneeId: dto.assigneeId,
    });

    return new TaskResponseDTO(task);
  }

  async deleteTask(taskId: string): Promise<void> {
    const exists = await this.taskRepository.exists(taskId);
    if (!exists) throw new Error("Task not found");
    await this.taskRepository.delete(taskId);
  }
}
