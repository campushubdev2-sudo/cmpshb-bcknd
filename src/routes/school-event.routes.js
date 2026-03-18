// @ts-check
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import schoolEventController from "../controllers/school-event.controller.js";
import { Router } from "express";

const eventRouter = Router();

eventRouter.use(createRateLimiter({ limit: 100, windowMs: 60000 }));

eventRouter.post("/", authenticate, authorize("admin", "adviser"), schoolEventController.createNewEvent);
eventRouter.get("/", optionalAuthenticate, authorize("admin", "guest", "adviser", "officer"), schoolEventController.getAllEvents);
eventRouter.get("/filter/date-range", authenticate, authorize("admin", "adviser"), schoolEventController.filterEvents);
eventRouter.get("/stats", authenticate, authorize("admin", "officer", "adviser"), schoolEventController.getStats);
eventRouter.get("/stats/monthly", authenticate, authorize("admin", "adviser"), schoolEventController.getMonthlyStats);
eventRouter.get("/stats/venues", authenticate, authorize("admin", "adviser"), schoolEventController.getVenueStats);
eventRouter.get("/recently-created", authenticate, authorize("admin"), schoolEventController.getRecentlyCreatedEvents);
eventRouter.get("/:id", authenticate, authorize("admin", "adviser", "officer"), schoolEventController.getSchoolEventById);
eventRouter.put("/:id", authenticate, authorize("admin", "adviser"), schoolEventController.updateEvent);
eventRouter.delete("/:id", authenticate, authorize("admin", "adviser"), schoolEventController.deleteSchoolEvent);

export default eventRouter;
