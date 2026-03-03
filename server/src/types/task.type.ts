import { TaskStatus } from "../generated/prisma/client";

export interface ITask {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  assigneeId?: string | null;
}

export interface ICreateTaskData {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  workspaceId: string;
  assigneeId?: string;
}

export interface IUpdateTaskData {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  priority?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

export interface ITaskFilters {
  workspaceId: string;
  assigneeId?: string;
  isCompleted?: boolean;
  priority?: string;
  status?: TaskStatus;
}
