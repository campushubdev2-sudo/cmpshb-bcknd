// @ts-check
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import EventNotificationController from "../controllers/event-notification.controller.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

const eventNotificationRouter = Router();
eventNotificationRouter.use(createRateLimiter({ limit: 60, windowMs: 60000 }));

eventNotificationRouter.get("/stats/overall", authenticate, authorize("admin"), EventNotificationController.getOverallStats);
eventNotificationRouter.post("/bulk", authenticate, authorize("admin"), EventNotificationController.createBulkNotifications);
eventNotificationRouter.get("/stats/event/:id", authenticate, authorize("admin"), EventNotificationController.getEventStats);
eventNotificationRouter.get("/", authenticate, authorize("admin", "officer", "adviser"), EventNotificationController.getAllEventNotifications);
eventNotificationRouter.post("/", authenticate, authorize("admin"), EventNotificationController.createNotification);
eventNotificationRouter.get("/:id", authenticate, authorize("admin", "officer", "adviser"), EventNotificationController.getEventNotificationById);
eventNotificationRouter.put("/:id", authenticate, authorize("admin", "adviser"), EventNotificationController.updateEventNotification);
eventNotificationRouter.delete("/:id", authenticate, authorize("admin", "adviser"), EventNotificationController.deleteEventNotification);

export default eventNotificationRouter;
