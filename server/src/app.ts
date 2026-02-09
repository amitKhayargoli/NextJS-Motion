import dotenv from "dotenv";
import morgan from "morgan";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import authRoutes from "./routes/auth.route";
import { DIContainer } from "./di/container";
import cookieParser from "cookie-parser";
import path from "node:path";
dotenv.config();

const app: Application = express();

// 1. Morgan logging
app.use(morgan("dev"));

// 2. CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());

// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

// Routes
export const container = DIContainer.getInstance();
app.use("/api/auth", authRoutes);
app.use("/api", container.getNoteRoutes().getRouter());
app.use("/api", container.getWorkspaceRoutes().getRouter());
app.use("/api", container.getAudioFileRoutes().getRouter());

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

export default app;
