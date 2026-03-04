import { PrismaClient, TaskStatus } from "../generated/prisma/client";
import {
  ITask,
  ICreateTaskData,
  IUpdateTaskData,
  ITaskFilters,
} from "../types/task.type";

export interface ITaskRepository {
  create(data: ICreateTaskData): Promise<ITask>;
  findById(id: string): Promise<ITask | null>;
  findByWorkspaceId(workspaceId: string): Promise<ITask[]>;
  update(id: string, data: IUpdateTaskData): Promise<ITask>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export class TaskRepository implements ITaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: ICreateTaskData): Promise<ITask> {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        workspaceId: data.workspaceId,
        assigneeId: data.assigneeId,
      },
    });

    return this.mapToITask(task);
  }

  async findById(id: string): Promise<ITask | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    return task ? this.mapToITask(task) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<ITask[]> {
    const tasks = await this.prisma.task.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((task: any) => this.mapToITask(task));
  }

  async update(id: string, data: IUpdateTaskData): Promise<ITask> {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      updateData.status = data.isCompleted ? TaskStatus.DONE : TaskStatus.TODO;
    }

    if (data.status !== undefined) updateData.status = data.status;

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    return this.mapToITask(task);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.task.count({ where: { id } });
    return count > 0;
  }

  private mapToITask(task: any): ITask {
    return {
      id: String(task.id),
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      workspaceId: task.workspaceId,
      assigneeId: task.assigneeId,
    };
  }
}
