// @ts-check
import { Router } from "express";

import { authorize, authenticate, optionalAuthenticate } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import CalendarEntryController from "../controllers/calendar-entry.controller.js";

const calendarEntryRouter = Router();
calendarEntryRouter.use(createRateLimiter({ limit: 100, windowMs: 60000 }));

calendarEntryRouter.post("/", authenticate, authorize("admin", "adviser"), CalendarEntryController.createCalendarEntry);
calendarEntryRouter.get("/", optionalAuthenticate, authorize("admin", "student", "officer", "guest", "adviser "), CalendarEntryController.getAll);
calendarEntryRouter.get("/stats", authenticate, authorize("admin"), CalendarEntryController.getCalendarStats);
calendarEntryRouter.get("/:id", optionalAuthenticate, authorize("admin", "student", "guest", "officer"), CalendarEntryController.getCalendarEntryById);
calendarEntryRouter.put("/:id", authenticate, authorize("admin"), CalendarEntryController.updateCalendarEntry);
calendarEntryRouter.delete("/:id", authenticate, authorize("admin"), CalendarEntryController.deleteCalendarEntry);
export default calendarEntryRouter;
