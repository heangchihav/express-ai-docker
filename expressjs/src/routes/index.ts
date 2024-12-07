import { Router, Request, Response } from "express";
import authRoutes from "./auth";
import refreshRoutes from "./refresh";
import logoutRoutes from "./logout";
import csrfTokenRoutes from "./csrf-token";
import { secret } from "../config/secret";

const rootRouter: Router = Router();

// Health check endpoint
rootRouter.get("/healthcheck", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});

// Test FastAPI connection
rootRouter.get("/test-fastapi", async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${secret.fastApiUrl}/api/v1/health/secure`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': secret.fastApiKey || ''
      }
    });
    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status} - ${await response.text()}`);
    }
    const data = await response.json();
    res.status(200).json({ 
      status: "success", 
      fastapi_status: data,
      message: "Successfully connected to FastAPI"
    });
  } catch (error) {
    console.error("FastAPI connection test failed:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to connect to FastAPI service",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mount routes
rootRouter.use("/auth", authRoutes);
rootRouter.use(logoutRoutes);
rootRouter.use(refreshRoutes);
rootRouter.use(csrfTokenRoutes);

// Protected route example
rootRouter.post("/protected", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Access granted to protected route",
    user: req.user
  });
});

export default rootRouter;
