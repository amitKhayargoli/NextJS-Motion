import { Application } from "express";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import app, { container } from "./app";

// Start server
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await container.closeConnections();
  process.exit(0);
});
function express(): Application {
  throw new Error("Function not implemented.");
}
