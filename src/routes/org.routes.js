// @ts-check
import { Router } from "express";
import organizationController from "../controllers/organization.controller.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware.js";

const orgRouter = Router();
orgRouter.use(createRateLimiter({ limit: 60, windowMs: 60000 }));

orgRouter.post("/", authenticate, authorize("admin", "adviser"), organizationController.createOrganization);
orgRouter.get("/", optionalAuthenticate, authorize("admin", "officer", "adviser", "guest"), organizationController.getOrganizations);
orgRouter.get("/stats", authenticate, authorize("admin"), organizationController.getStats);
orgRouter.get("/:id", authenticate, authorize("admin", "officer", "adviser"), organizationController.getOrganization);
orgRouter.put("/:id", authenticate, authorize("admin"), organizationController.updateOrganization);
orgRouter.delete("/:id", authenticate, authorize("admin"), organizationController.deleteOrganization);
export default orgRouter;
