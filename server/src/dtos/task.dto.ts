import { ITask } from "../types/task.type";

export class CreateTaskDTO {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  workspaceId: string;
  assigneeId?: string;

  constructor(data: any) {
    if (!data) throw new Error("Request body is empty");
    if (!data.title) throw new Error("title is required");
    if (!data.workspaceId) throw new Error("workspaceId is required");

    this.title = data.title;
    this.description = data.description;
    this.priority = data.priority;
    this.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    this.workspaceId = data.workspaceId;
    this.assigneeId = data.assigneeId;
  }
}

export class UpdateTaskDTO {
  taskId: string;
  title?: string;
  description?: string;
  isCompleted?: boolean;
  priority?: string;
  dueDate?: Date | null;
  assigneeId?: string | null;

  constructor(taskId: string, data: any) {
    this.taskId = taskId;
    this.title = data.title;
    this.description = data.description;
    this.isCompleted = data.isCompleted;
    this.priority = data.priority;
    this.dueDate =
      data.dueDate !== undefined
        ? data.dueDate
          ? new Date(data.dueDate)
          : null
        : undefined;
    this.assigneeId = data.assigneeId;
  }
}

export class TaskResponseDTO {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(task: ITask) {
    this.id = task.id;
    this.workspaceId = task.workspaceId;
    this.title = task.title;
    this.description = task.description;
    this.isCompleted = task.isCompleted;
    this.priority = task.priority;
    this.dueDate =
      task.dueDate instanceof Date
        ? task.dueDate.toISOString()
        : (task.dueDate ?? null);
    this.createdAt =
      task.createdAt instanceof Date
        ? task.createdAt.toISOString()
        : task.createdAt;
    this.updatedAt =
      task.updatedAt instanceof Date
        ? task.updatedAt.toISOString()
        : task.updatedAt;
  }

  static fromArray(tasks: ITask[]): TaskResponseDTO[] {
    return tasks.map((task) => new TaskResponseDTO(task));
  }
}
