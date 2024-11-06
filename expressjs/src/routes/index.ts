import { Router } from "express";
import authRoutes from "./auth";
import refreshRoutes from "./refresh";
import logoutRoutes from "./logout";
import csrfTokenRoutes from "./csrf-token";
import { Request, Response } from "express";

const rootRouter: Router = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use(logoutRoutes);
rootRouter.use(refreshRoutes);
rootRouter.use(csrfTokenRoutes);
rootRouter.post("/protected",  (req: Request, res: Response) => {
  res.status(200).send({
    success: true,
    user: req.user,
  });
});
export default rootRouter;
