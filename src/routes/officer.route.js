// @ts-check
import { Router } from "express";
import OfficerController from "../controllers/officer.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

const officerRouter = Router();

officerRouter.use(createRateLimiter({ limit: 60, windowMs: 60000 }));

officerRouter.get("/meta/positions", authenticate, OfficerController.getAllOfficerPositions);
officerRouter.post("/", authenticate, authorize("admin"), OfficerController.createOfficer);
officerRouter.get("/", authenticate, authorize("admin", "officer", "adviser"), OfficerController.getOfficers);
officerRouter.get("/stats/overview", authenticate, authorize("admin", "officer"), OfficerController.getOfficerStats);
officerRouter.get("/stats/period", authenticate, authorize("admin"), OfficerController.getOfficersByPeriod);
officerRouter.get("/stats/detailed", authenticate, authorize("admin"), OfficerController.getOfficersDetailed);
officerRouter.get("/stats/near-term-end", authenticate, authorize("admin"), OfficerController.getOfficersNearTermEnd);
officerRouter.get("/stats/organization/:orgId", authenticate, authorize("admin"), OfficerController.getOrganizationOfficerStats);
officerRouter.get("/:id", authenticate, authorize("admin", "officer"), OfficerController.getOfficerById);
officerRouter.put("/:id", authenticate, authorize("admin", "adviser"), OfficerController.updateOfficer);
officerRouter.delete("/:id", authenticate, authorize("admin", "adviser"), OfficerController.deleteOfficer);
export default officerRouter;
