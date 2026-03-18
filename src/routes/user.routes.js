// @ts-check
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import UserController from "../controllers/user.controller.js";
import { Router } from "express";

const userRouter = Router();

userRouter.use(authenticate, createRateLimiter({ limit: 100, windowMs: 60000 }));

userRouter.post("/", authorize("admin"), UserController.createUser);
userRouter.get("/", authorize("admin", "adviser", "officer"), UserController.getUsers);
userRouter.get("/:id", authorize("admin"), UserController.getUserById);
userRouter.put("/:id", authorize("admin"), UserController.updateUser);
userRouter.delete("/:id", authorize("admin"), UserController.deleteUser);
userRouter.get("/stats/overview", authorize("admin", "officer"), UserController.getUserStats);

export default userRouter;
