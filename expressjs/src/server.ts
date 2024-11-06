import http from "http";
import cluster from "cluster";
import os from "os";
import { Server } from "socket.io";
import Logger from "./config/logger";
import { secret } from "./config/secret";
import app from "./app";
import prisma from "./libs/prisma";

// Get the number of CPUs
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  // Master process
  Logger.info(`Master process is running on PID: ${process.pid}`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    Logger.error(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
    );
    Logger.info("Starting a new worker");
    cluster.fork();
  });
} else {
  // Worker processes
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust this according to your CORS policy
      methods: ["GET", "POST"],
    },
  });

  // === Socket.IO Handling ===

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle custom events
    socket.on("message", (data) => {
      console.log("Message received:", data);
      // Echo the message back to the client
      socket.emit("message", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // === Main Server Initialization ===

  httpServer.listen(Number(secret.SERVER_PORT), secret.HOST, () => {
    Logger.info(
      `Worker ${process.pid} running server at http://${secret.HOST}:${secret.SERVER_PORT}/`
    );
  });
  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  });
}
