// @ts-check
import asyncHandler from "express-async-handler";
import CalendarEntryService from "../services/calendar-entry.service.js";

/** @typedef {import('express').Request & { user: { id: string } }} AuthenticatedRequest */

class CalendarEntryController {
  createCalendarEntry = asyncHandler(async (request, response) => {
    const result = await CalendarEntryService.createCalendarEntry(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "Calendar entry created successfully",
      data: {
        calendarEntry: result.calendarEntry,
        event: result.event,
      },
    });
  });

  getAll = asyncHandler(async (request, response) => {
    const result = await CalendarEntryService.getCalendarEntries(/** @type {AuthenticatedRequest} */ (request).user?.id || null, request.query);

    response.status(200).json({
      success: true,
      message: "Calendar entries retrieved successfully",
      data: result.items,
      meta: result.meta,
    });
  });

  getCalendarEntryById = asyncHandler(async (request, response) => {
    const result = await CalendarEntryService.getCalendarEntryById(/** @type {AuthenticatedRequest} */ (request).user?.id || null, request.params.id);

    response.status(200).json({
      success: true,
      message: "Calendar entry retrieved successfully",
      data: result,
    });
  });

  updateCalendarEntry = asyncHandler(async (request, response) => {
    const { id } = request.params;
    const result = await CalendarEntryService.updateCalendarEntry(/** @type {AuthenticatedRequest} */ (request).user.id, id, request.body);

    response.status(200).json({
      success: true,
      message: "Calendar entry updated successfully",
      data: result,
    });
  });

  deleteCalendarEntry = asyncHandler(async (request, response) => {
    const result = await CalendarEntryService.deleteCalendarEntry(/** @type {AuthenticatedRequest} */ (request).user.id, {
      id: request.params.id,
    });

    response.status(200).json({
      success: true,
      message: "Calendar entry deleted successfully",
      data: result,
    });
  });

  getCalendarStats = asyncHandler(async (request, response) => {
    const data = await CalendarEntryService.getStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Calendar statistics retrieved successfully",
      result: data,
    });
  });
}

export default new CalendarEntryController();
