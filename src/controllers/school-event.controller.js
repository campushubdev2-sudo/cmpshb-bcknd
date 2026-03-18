// @ts-check
import asyncHandler from "express-async-handler";
import SchoolEventService from "../services/school-event.service.js";
import express from "express";

/** @typedef {express.Request & { user: { id: string } }} AuthenticatedRequest */

class SchoolEventController {
  createNewEvent = asyncHandler(async (request, response) => {
    const newEvent = await SchoolEventService.createSchoolEvent(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "School event created successfully",
      data: newEvent,
    });
  });

  getAllEvents = asyncHandler(async (request, response) => {
    const query = request.query;
    const actorId = /** @type {AuthenticatedRequest} */ (request).user?.id || null;
    const result = /** @type {any} */ (await SchoolEventService.getAllEvents(actorId, query));

    if (!query.paginate) {
      response.status(200).json({
        success: true,
        message: "School events fetched successfully",
        data: result.events,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "School events fetched successfully",
      data: result,
    });
    return;
  });

  getSchoolEventById = asyncHandler(async (request, response) => {
    // @ts-ignore
    const result = await SchoolEventService.getSchoolEventById(/** @type {AuthenticatedRequest} */ (request).user.id, request.params);

    response.status(200).json({
      success: true,
      message: "School event retrieved successfully",
      data: result,
    });
  });

  filterEvents = asyncHandler(async (request, response) => {
    // @ts-ignore
    const result = await SchoolEventService.filterEventsByDate(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      count: result.length,
      data: result,
    });
  });

  getStats = asyncHandler(async (request, response) => {
    const stats = await SchoolEventService.getEventStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Event statistics retrieved successfully",
      data: stats,
    });
  });

  getMonthlyStats = asyncHandler(async (request, response) => {
    const { year } = request.query;
    // @ts-ignore
    const result = await SchoolEventService.getMonthlyEventCount(/** @type {AuthenticatedRequest} */ (request).user.id, { year });

    response.status(200).json({
      success: true,
      message: "Monthly event statistics retrieved successfully",
      data: result,
    });
  });

  getVenueStats = asyncHandler(async (request, response) => {
    const venueStats = await SchoolEventService.getVenueStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Venue statistics retrieved successfully",
      count: venueStats.length,
      data: venueStats,
    });
  });

  getRecentlyCreatedEvents = asyncHandler(async (request, response) => {
    const { limit } = request.query;
    // @ts-ignore
    const result = await SchoolEventService.getRecentlyCreatedEvents(/** @type {AuthenticatedRequest} */ (request).user.id, { limit });

    response.status(200).json({
      success: true,
      message: "Recent events retrieved successfully",
      count: result.length,
      data: result,
    });
  });

  updateEvent = asyncHandler(async (request, response) => {
    const { id } = request.params;
    const updateData = request.body;

    const result = await SchoolEventService.updateEvent(/** @type {AuthenticatedRequest} */ (request).user.id, id, updateData);

    response.status(200).json({
      success: true,
      message: "School event updated successfully",
      data: result,
    });
  });

  deleteSchoolEvent = asyncHandler(async (request, response) => {
    const { id } = request.params;
    const result = await SchoolEventService.deleteSchoolEvent(/** @type {AuthenticatedRequest} */ (request).user.id, id);

    response.status(200).json({
      success: true,
      message: "School event deleted successfully",
      data: result,
    });
  });
}

export default new SchoolEventController();
