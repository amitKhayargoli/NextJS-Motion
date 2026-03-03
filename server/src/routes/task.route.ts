import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";

export class TaskRoutes {
  private router: Router;

  constructor(private taskController: TaskController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authorizedMiddleware);

    // POST /tasks
    this.router.post("/tasks", (req, res) =>
      this.taskController.createTask(req, res),
    );

    // GET /tasks/:id
    this.router.get("/tasks/:id", (req, res) =>
      this.taskController.getTaskById(req, res),
    );

    // PUT /tasks/:id
    this.router.put("/tasks/:id", (req, res) =>
      this.taskController.updateTask(req, res),
    );

    // DELETE /tasks/:id
    this.router.delete("/tasks/:id", (req, res) =>
      this.taskController.deleteTask(req, res),
    );

    // GET /workspaces/:workspaceId/tasks
    this.router.get("/workspaces/:workspaceId/tasks", (req, res) =>
      this.taskController.getWorkspaceTasks(req, res),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
