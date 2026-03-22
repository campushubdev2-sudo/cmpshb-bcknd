// @ts-check
import AppError from "../middlewares/error.middleware.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import { buildFilterFromQuery } from "../utils/build-filter.js";
import { filteredUpdateSchema, deleteSchoolEventSchema, updateEventSchema, getRecentlyCreatedEventsSchema, getMonthlyStatsSchema, filterEventsSchema, createSchoolEventSchema, getAllSchoolEventsSchema, getSchoolEventByIdSchema } from "../validators/school-event.validator.js";
import mongoose from "mongoose";
import SchoolEventRepository from "../repositories/school-event.repositories.js";

class SchoolEventService {
  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {import("../validators/school-event.validator.js").CreateSchoolEventBody} payload
   */
  async createSchoolEvent(actorId, payload) {
    const { error, value } = createSchoolEventSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { title, objective, startDate, endDate, startTime, endTime, venue, organizedBy, allDay } = value;

    const now = new Date();
    if (new Date(startDate) < now) {
      throw new AppError("Event date cannot be in the past", 400);
    }

    if (!allDay && startDate === endDate && startTime && endTime) {
      if (endTime < startTime) {
        throw new AppError("End time cannot be earlier than start time", 400);
      }
    }

    const event = await SchoolEventRepository.create({
      title,
      objective,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      organizedBy,
      allDay,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Event",
    });

    return event;
  }

  /**
   * @param {mongoose.Types.ObjectId | string | null} actorId
   * @param {import("../validators/school-event.validator.js").GetAllSchoolEventsQuery} payload
   */
  async getAllEvents(actorId, payload) {
    const { error, value } = getAllSchoolEventsSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }
    const filter = buildFilterFromQuery(value);
    let result;

    if (value.paginate) {
      result = await SchoolEventRepository.findAll({ filter, options: value });
    } else {
      result = await SchoolEventRepository.findAllUnpaginated({ filter, options: value });
    }

    if (actorId) {
      await AuditLogRepository.create({
        userId: actorId,
        action: "View Events",
      });
    }

    return result;
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/school-event.validator.js").EventIdParams} payload
   */
  async getSchoolEventById(actorId, payload) {
    const { error, value } = getSchoolEventByIdSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const event = await SchoolEventRepository.findById(id);

    if (!event) {
      throw new AppError("School event not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Event Details",
    });

    return event;
  }

  /**
   * @param {mongoose.Types.ObjectId} actorId
   * @param {import("../validators/school-event.validator.js").FilterEventsQuery} payload
   */
  async filterEventsByDate(actorId, payload) {
    const { error, value } = filterEventsSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { startDate, endDate } = value;

    // Validate date range logic
    if (new Date(endDate) < new Date(startDate)) {
      throw new AppError("End date cannot be earlier than start date", 400);
    }

    const events = await SchoolEventRepository.findByDateRange(startDate, endDate);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Filter Events by Date Range",
    });

    return events;
  }

  /** @param {mongoose.Types.ObjectId | string} actorId */
  async getEventStats(actorId) {
    const stats = await SchoolEventRepository.getEventStats();

    await AuditLogRepository.create({
      userId: actorId,
      action: "Event Statistics Overview",
    });

    return stats;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {import("../validators/school-event.validator.js").GetMonthlyStatsQuery} payload
   */
  async getMonthlyEventCount(actorId, payload) {
    const { error, value } = getMonthlyStatsSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { year } = value;
    const monthlyStats = await SchoolEventRepository.getMonthlyEventCount(year);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const formattedStats = months.map((month) => {
      const monthData = monthlyStats.find((stat) => stat.month === month);

      const monthName = new Date(2000, month - 1).toLocaleString("default", {
        month: "long",
      });

      return {
        month,
        monthName,
        count: monthData ? monthData.count : 0,
        events: monthData ? monthData.events : [],
      };
    });

    await AuditLogRepository.create({ userId: actorId, action: "Monthly Event Statistics" });

    return { year, monthlyStats: formattedStats };
  }

  /** @param {mongoose.Types.ObjectId | string} actorId */
  async getVenueStats(actorId) {
    const venueStats = await SchoolEventRepository.getVenueStats();

    await AuditLogRepository.create({
      userId: actorId,
      action: "Event Statistics by Venue",
    });

    return venueStats;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {import("../validators/school-event.validator.js").GetRecentEventsQuery} payload
   */
  async getRecentlyCreatedEvents(actorId, payload) {
    const { error, value } = getRecentlyCreatedEventsSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { limit } = value;
    const recentEvents = await SchoolEventRepository.getRecentlyCreatedEvents(limit);

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Recent Events",
    });

    return recentEvents;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {mongoose.Types.ObjectId | string | string[]} id
   * @param {import("../validators/school-event.validator.js").UpdateSchoolEventBody} payload
   * @param {{ restrictFields?: boolean, allowPastDates?: boolean }} options
   */
  async updateEvent(actorId, id, payload, options = {}) {
    const { restrictFields = true, allowPastDates = true } = options;

    if (restrictFields) {
      const allowedUpdates = ["title", "objective", "startDate", "endDate", "startTime", "endTime", "venue", "organizedBy", "allDay"];
      const payloadKeys = Object.keys(payload);

      const invalidFields = payloadKeys.filter((key) => !allowedUpdates.includes(key));

      if (invalidFields.length > 0) {
        throw new AppError(`The following fields cannot be updated: ${invalidFields.join(", ")}`, 400);
      }

      if (payloadKeys.length === 0) {
        throw new AppError("At least one field must be provided for update", 400);
      }
    }

    const { error, value } = restrictFields ? filteredUpdateSchema.validate(payload) : updateEventSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const existingEvent = await SchoolEventRepository.findById(id);
    if (!existingEvent) {
      throw new AppError("School event not found", 404);
    }

    const merged = {
      title: value.title ?? existingEvent.title,
      objective: value.objective ?? existingEvent.objective,
      startDate: value.startDate ?? existingEvent.startDate,
      endDate: value.endDate ?? existingEvent.endDate,
      startTime: value.startTime ?? existingEvent.startTime,
      endTime: value.endTime ?? existingEvent.endTime,
      venue: value.venue ?? existingEvent.venue,
      organizedBy: value.organizedBy ?? existingEvent.organizedBy,
      allDay: value.allDay ?? existingEvent.allDay,
    };

    const now = new Date();

    if (!allowPastDates) {
      if (new Date(merged.startDate) < now) {
        throw new AppError("Event start date cannot be in the past", 400);
      }
    }

    if (new Date(merged.endDate) < new Date(merged.startDate)) {
      throw new AppError("End date cannot be earlier than start date", 400);
    }

    if (!merged.allDay && merged.startDate === merged.endDate) {
      if (merged.startTime && merged.endTime && merged.endTime < merged.startTime) {
        throw new AppError("End time cannot be earlier than start time", 400);
      }
    }

    const updatedEvent = await SchoolEventRepository.updateById(id, value);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Event",
    });

    return updatedEvent;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {string | string[] | mongoose.Types.ObjectId} id
   */
  async deleteSchoolEvent(actorId, id) {
    const { error, value } = deleteSchoolEventSchema.validate({ id });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id: eventId } = value;

    const existingEvent = await SchoolEventRepository.findById(eventId);
    if (!existingEvent) {
      throw new AppError("School event not found", 404);
    }

    const deletedEvent = await SchoolEventRepository.deleteById(eventId);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Event",
    });

    return deletedEvent;
  }
}

export default new SchoolEventService();
