// @ts-check
import asyncHandler from "express-async-handler";
import EventNotificationService from "../services/event-notification.service.js";
import express from "express";

/** @typedef {express.Request & { user: { id: string } }} AuthenticatedRequest */

class EventNotificationController {
  createNotification = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.createEventNotification(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "Event notification created successfully",
      data: result,
    });
  });

  createBulkNotifications = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.createBulkEventNotifications(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: `Bulk event notifications created successfully. ${result.notificationsCreated} notifications sent, ${result.skippedDuplicates} duplicates skipped.`,
      data: result,
    });
  });

  getAllEventNotifications = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.getAllEventNotifications(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: "Event notifications retrieved successfully",
      data: result.notifications,
      meta: {
        pagination: result.pagination,
      },
    });
  });

  getEventNotificationById = asyncHandler(async (request, response) => {
    const notificationId = request.params.id;
    const result = await EventNotificationService.getEventNotificationById(/** @type {AuthenticatedRequest} */ (request).user.id, notificationId);

    response.status(200).json({
      success: true,
      message: "Event notification retrieved successfully",
      data: result,
    });
  });

  updateEventNotification = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.updateEventNotification(/** @type {AuthenticatedRequest} */ (request).user.id, {
      id: request.params.id,
      updateData: request.body,
    });

    response.status(200).json({
      statusCode: 200,
      success: true,
      message: "Event notification updated successfully",
      data: result,
    });
  });

  deleteEventNotification = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.deleteEventNotification(/** @type {AuthenticatedRequest} */ (request).user.id, {
      id: request.params.id,
    });

    response.status(200).json({
      statusCode: 200,
      success: true,
      message: "Event notification deleted successfully",
      data: result,
    });
  });

  getOverallStats = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.getOverallStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Overall event notification stats retrieved successfully",
      data: result,
    });
  });

  getEventStats = asyncHandler(async (request, response) => {
    const result = await EventNotificationService.getEventStats(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id);

    response.status(200).json({
      success: true,
      message: "Event notification stats retrieved successfully",
      data: result,
    });
  });
}

export default new EventNotificationController();
