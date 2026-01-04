import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import authRoutes from "./routes/auth.route";
import cors from "cors";

dotenv.config();

console.log(process.env.PORT);

const app: Application = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend URL
    credentials: true,
  })
);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

async function startServer() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server on http:localhost:${PORT}`);
  });
}

startServer();
