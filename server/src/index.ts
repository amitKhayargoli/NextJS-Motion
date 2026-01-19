import dotenv from "dotenv";
import morgan from "morgan";
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import authRoutes from "./routes/auth.route";
import cors from "cors";

dotenv.config();

console.log(process.env.PORT);

const app: Application = express();
app.use(morgan("dev"));
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps/Dio)
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

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`For Emulator, use: http://10.0.2.2:${PORT}`);
  });
}

startServer();
