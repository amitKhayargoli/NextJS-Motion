// server/src/routes/rag.route.ts

import { Router } from "express";
import { RagController } from "../controllers/rag.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";

export class RagRoutes {
  private router: Router;

  constructor(private ragController: RagController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authorizedMiddleware);

    this.router.post("/rag/thread", (req, res) =>
      this.ragController.createThread(req, res),
    );

    this.router.get("/rag/thread", (req, res) =>
      this.ragController.listThreads(req, res),
    );

    this.router.get("/rag/thread/:id", (req, res) =>
      this.ragController.getThread(req, res),
    );

    this.router.put("/rag/thread/:id", (req, res) =>
      this.ragController.updateThread(req, res),
    );

    this.router.delete("/rag/thread/:id", (req, res) =>
      this.ragController.deleteThread(req, res),
    );

    this.router.post("/rag/chat", (req, res) =>
      this.ragController.chat(req, res),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
