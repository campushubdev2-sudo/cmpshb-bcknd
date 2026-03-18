// @ts-check
import CalendarEntryRepository from "../repositories/calendar-entry.repositories.js";
import { createCalendarEntrySchema, getCalendarEntryByIdSchema, getCalendarEntriesSchema, updateCalendarEntrySchema, deleteCalendarEntrySchema } from "../validators/calendar-entry.validator.js";
import AppError from "../middlewares/error.middleware.js";
import SchoolEventRepository from "../repositories/school-event.repositories.js";
import UserRepository from "../repositories/user.repositories.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import mongoose from "mongoose";

class CalendarEntryService {
  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/calendar-entry.validator.js").CreateCalendarEntryBody} payload
   */
  async createCalendarEntry(actorId, payload) {
    const { error, value } = createCalendarEntrySchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { eventId, createdBy } = value;

    const user = await UserRepository.findById(createdBy);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const event = await SchoolEventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const existingEntry = await CalendarEntryRepository.findByUserAndEvent(createdBy, eventId);
    if (existingEntry) {
      throw new AppError("Calendar entry already exists for this event", 409);
    }

    await CalendarEntryRepository.create({ eventId, createdBy });

    // Get the populated entry for response
    const populatedEntry = await CalendarEntryRepository.findByUserAndEvent(createdBy, eventId);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Calendar Entry",
    });

    return { calendarEntry: populatedEntry, event };
  }

  /**
   * @param {string | mongoose.Types.ObjectId | null} actorId
   * @param {import("../validators/calendar-entry.validator.js").GetCalendarEntriesQuery} payload
   */
  async getCalendarEntries(actorId, payload) {
    const { error, value } = getCalendarEntriesSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { page = 1, limit = 10, sortBy = "createdAt", order, eventId, createdBy } = value;

    const query = {};
    if (eventId) {
      query.eventId = eventId;
    }
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const [items, total] = await Promise.all([CalendarEntryRepository.findAll(query, { page, limit, sortBy, order: order === "asc" ? 1 : -1, populate: [{ path: "eventId" }, { path: "createdBy", select: "username role email" }] }), CalendarEntryRepository.count(query)]);

    if (actorId) {
      await AuditLogRepository.create({
        userId: actorId,
        action: "View Calendar Entries",
      });
    }

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * @param {string | mongoose.Types.ObjectId | null} actorId
   * @param {string | mongoose.Types.ObjectId | string[]} id
   */
  async getCalendarEntryById(actorId, id) {
    const { error, value } = getCalendarEntryByIdSchema.validate({ id });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id: validatedId } = value;
    const entry = await CalendarEntryRepository.findById(validatedId);
    if (!entry) {
      throw new AppError("Calendar entry not found", 404);
    }

    if (actorId) {
      await AuditLogRepository.create({
        userId: actorId,
        action: "View Calendar Entry Details",
      });
    }

    return entry;
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {string | mongoose.Types.ObjectId | string[]} id
   * @param {import("../validators/calendar-entry.validator.js").UpdateCalendarEntryBody} payload
   */
  async updateCalendarEntry(actorId, id, payload) {
    const { error, value } = updateCalendarEntrySchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { eventId, createdBy } = value;

    const existingCalendarEntry = await CalendarEntryRepository.findById(id);
    if (!existingCalendarEntry) {
      throw new AppError("Calendar entry not found", 404);
    }

    const eventExists = await SchoolEventRepository.findById(eventId);
    if (!eventExists) {
      throw new AppError("School event not found", 404);
    }

    const userExists = await UserRepository.findById(createdBy);
    if (!userExists) {
      throw new AppError("User not found", 404);
    }

    const existingEntryWithEvent = await CalendarEntryRepository.findByUserAndEvent(createdBy, eventId);
    if (existingEntryWithEvent && existingEntryWithEvent._id.toString() !== id) {
      throw new AppError("Event already exists in another calendar entry", 409);
    }

    const updatedCalendarEntry = await CalendarEntryRepository.updateById(id, { eventId, createdBy });

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Calendar Entry",
    });

    return updatedCalendarEntry;
  }

  /**
   *
   * @param {string} actorId
   * @param {{ id: string | string[]}} payload
   * @returns {Promise<import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, any> | null>}
   */
  async deleteCalendarEntry(actorId, payload) {
    const { error, value } = deleteCalendarEntrySchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const existingEntry = await CalendarEntryRepository.findById(id);
    if (!existingEntry) {
      throw new AppError("Calendar entry not found", 404);
    }

    const deletedEntry = await CalendarEntryRepository.deleteById(id);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Calendar Entry",
    });

    return deletedEntry;
  }

  /**
   * @param {string} actorId
   */
  async getStats(actorId) {
    await AuditLogRepository.create({
      userId: actorId,
      action: "Calendar Statistics Overview",
    });

    return {
      total: await CalendarEntryRepository.count({}),
      byUser: await CalendarEntryRepository.countByUser(),
      byEvent: await CalendarEntryRepository.countByEvent(),
      overTime: await CalendarEntryRepository.countOverTime(),
    };
  }
}

export default new CalendarEntryService();
