import { Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { CreateTaskDTO, UpdateTaskDTO } from "../dtos/task.dto";

export class TaskController {
  constructor(private taskService: TaskService) {}

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const assigneeId = (req as any).user?.id;

      if (!assigneeId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const dto = new CreateTaskDTO({
        ...req.body,
        assigneeId,
      });
      const task = await this.taskService.createTask(dto);

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.taskService.getTaskById(req.params.id);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getWorkspaceTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.taskService.getWorkspaceTasks(
        req.params.workspaceId,
      );
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const dto = new UpdateTaskDTO(req.params.id, req.body);
      const task = await this.taskService.updateTask(dto);

      res.status(200).json({ success: true, data: task });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      await this.taskService.deleteTask(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message === "Task not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      if (
        error.message.includes("is required") ||
        error.message === "Request body is empty"
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "An unknown error occurred" });
    }
  }
}
