import express from "express";
import { DIContainer } from "../../di/container";

export function createTestApp() {
  const app = express();
  app.use(express.json());

  const container = DIContainer.getInstance();
  app.use("/api/auth", container.getAuthRoutes().getRouter());

  return app;
}
