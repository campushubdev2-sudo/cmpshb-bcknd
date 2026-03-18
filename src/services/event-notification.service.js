// @ts-check
import EventNotificationRepository from "../repositories/event-notification.repositories.js";
import { eventNotificationIdSchema, updateEventNotificationSchema, getEventNotificationByIdSchema, getEventNotificationsSchema, eventIdSchema, createEventNotificationSchema, createBulkEventNotificationSchema } from "../validators/event-notification.validator.js";
import AppError from "../middlewares/error.middleware.js";
import SchoolEventRepository from "../repositories/school-event.repositories.js";
import UserRepository from "../repositories/user.repositories.js";
import SmsService from "./sms.service.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import mongoose from "mongoose";

class EventNotificationService {
  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/event-notification.validator.js").CreateEventNotificationBody} payload
   */
  async createEventNotification(actorId, payload) {
    const { error, value } = createEventNotificationSchema.validate(payload);
    if (error) {
      const errMessage = error.details[0].message.replace(/"/g, "");
      throw new AppError(errMessage, 400);
    }

    const { eventId, recipientId, message, status } = value;

    const eventExists = await SchoolEventRepository.findById(eventId);
    if (!eventExists) {
      throw new AppError("Event not found", 404);
    }

    // Validate that recipient exists and get user details
    const recipient = await UserRepository.findById(recipientId);
    if (!recipient) {
      throw new AppError("Recipient not found", 404);
    }

    // Create notification record first
    const notification = await EventNotificationRepository.create({ eventId, recipientId, message, status, sentAt: new Date() });

    try {
      await SmsService.sendSMS({
        to: recipient.phoneNumber,
        message,
      });

      await EventNotificationRepository.updateStatus(notification._id, "sent");
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);

      await EventNotificationRepository.updateStatus(notification._id, "failed");
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Notification",
    });

    return {
      id: notification._id,
      eventId: notification.eventId,
      recipientId: notification.recipientId,
      message: notification.message,
      status: notification.status,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/event-notification.validator.js").CreateBulkEventNotificationBody} payload
   */
  async createBulkEventNotifications(actorId, payload) {
    const { error, value } = createBulkEventNotificationSchema.validate(payload);
    if (error) {
      const errMessage = error.details[0].message.replace(/"/g, "");
      throw new AppError(errMessage, 400);
    }

    const { eventId, recipientIds, message, status } = value;

    const eventExists = await SchoolEventRepository.findById(eventId);
    if (!eventExists) {
      throw new AppError("Event not found", 404);
    }

    const uniqueRecipientIds = [...new Set(recipientIds)];
    const users = await UserRepository.findManyByIds(uniqueRecipientIds);

    if (users.length !== uniqueRecipientIds.length) {
      const foundIds = users.map((user) => user._id.toString());
      const missingIds = uniqueRecipientIds.filter((id) => !foundIds.includes(id));
      throw new AppError(`Some recipients not found: ${missingIds.join(", ")}`, 404);
    }

    const notificationsData = uniqueRecipientIds.map((recipientId) => ({ eventId, recipientId, message, status, sentAt: new Date() }));

    const existingNotifications = await EventNotificationRepository.findByEvent(eventId);
    const existingRecipientIds = existingNotifications.map((n) => n.recipientId.toString());
    const newNotificationsData = notificationsData.filter((notification) => !existingRecipientIds.includes(notification.recipientId.toString()));

    if (newNotificationsData.length === 0) {
      throw new AppError("All recipients already have notifications for this event", 409);
    }

    const createdNotifications = await EventNotificationRepository.createMany(newNotificationsData);

    try {
      // Filter users who should receive SMS (those in newNotificationsData)
      const newRecipientUsers = users.filter((user) => newNotificationsData.some((notification) => notification.recipientId.toString() === user._id.toString()));

      // Send SMS to each recipient
      for (const user of newRecipientUsers) {
        if (user.phoneNumber) {
          await SmsService.sendSMS({
            to: user.phoneNumber,
            message,
          });
        }
      }

      // Update notification status or log SMS delivery
      await EventNotificationRepository.updateManyStatus(
        createdNotifications.map((n) => n._id),
        "sent",
      );
    } catch (error) {
      console.error("Failed to send SMS notifications:", error);
    }

    const sanitizedNotifications = createdNotifications.map((notification) => ({
      id: notification._id,
      eventId: notification.eventId,
      recipientId: notification.recipientId,
      message: notification.message,
      status: notification.status,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Notifications (Bulk)",
    });

    return {
      totalRecipients: uniqueRecipientIds.length,
      skippedDuplicates: notificationsData.length - newNotificationsData.length,
      notificationsCreated: sanitizedNotifications.length,
      notifications: sanitizedNotifications,
    };
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/event-notification.validator.js").GetEventNotificationsQuery} queryParams
   */
  async getAllEventNotifications(actorId, queryParams) {
    // Validate query parameters
    const { error, value } = getEventNotificationsSchema.validate(queryParams);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400); // message: string, statusCode: number
    }

    const { eventId, recipientId, status, sortBy, order, fields, limit, page } = value;

    // Additional business logic validations
    if (fields) {
      const allowedFields = ["eventId", "recipientId", "message", "sentAt", "status", "createdAt", "updatedAt"];
      const requestedFields = fields.split(",").map((f) => f.trim());
      const invalidFields = requestedFields.filter((field) => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        throw new AppError(`Invalid field(s) requested: ${invalidFields.join(", ")}. Allowed fields: ${allowedFields.join(", ")}`, 400);
      }
    }

    // Call repository method
    const result = await EventNotificationRepository.findAllWithFilters({ eventId, recipientId, status, sortBy, order, fields, limit, page });

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Notifications",
    });

    // Return sanitized data
    return result;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {mongoose.Types.ObjectId | string | string[]} notificationId
   */
  async getEventNotificationById(actorId, notificationId) {
    // Validate notification ID
    const { error, value } = getEventNotificationByIdSchema.validate({
      id: notificationId,
    });

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400); // message: string, statusCode: number
    }

    const { id } = value;

    // Call repository method to find notification by ID
    const notification = await EventNotificationRepository.findById(id);

    // Additional validation - check if notification exists
    if (!notification) {
      throw new AppError("Event notification not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Notification Details",
    });

    // Return sanitized data
    return notification;
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {{ id: string | string[], updateData: { message?: string, status?: "sent" | "failed" | "read"}}} payload
   */
  async updateEventNotification(actorId, payload) {
    const { error: idError, value: idValue } = eventNotificationIdSchema.validate({
      id: payload.id,
    });

    if (idError) {
      const message = idError.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { error, value } = updateEventNotificationSchema.validate(payload.updateData);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { message, status } = value;

    if (!message && !status) {
      throw new AppError("At least one field (message or status) is required for update", 400);
    }

    const existingNotification = await EventNotificationRepository.findById(idValue.id);
    if (!existingNotification) {
      throw new AppError("Event notification not found", 404);
    }

    const updateData = {};
    if (message) {
      updateData.message = message;
    }
    if (status) {
      updateData.status = status;
    }

    const updatedNotification = await EventNotificationRepository.updateById(idValue.id, updateData);
    // @ts-ignore
    const populatedNotification = await EventNotificationRepository.findByIdWithEventAndRecipient(updatedNotification._id);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Notification",
    });

    return populatedNotification;
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {{ id: string | string[] }} payload
   */
  async deleteEventNotification(actorId, payload) {
    const { error, value } = eventNotificationIdSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const existingNotification = await EventNotificationRepository.findById(id);
    if (!existingNotification) {
      throw new AppError("Event notification not found", 404);
    }

    const deletedNotification = /** @type {any} */ (await EventNotificationRepository).deleteById(id);

    const notificationData = {
      _id: deletedNotification._id,
      eventId: deletedNotification.eventId,
      recipientId: deletedNotification.recipientId,
      message: deletedNotification.message,
      status: deletedNotification.status,
      sentAt: deletedNotification.sentAt,
    };

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Notification",
    });

    return notificationData;
  }

  /** @param {mongoose.Types.ObjectId | string} actorId */
  async getOverallStats(actorId) {
    await AuditLogRepository.create({
      userId: actorId,
      action: "Overall Notification Statistics",
    });

    return await EventNotificationRepository.getOverallStats();
  }

  /**
   * @param {string | string[] | mongoose.Types.ObjectId | undefined} actorId
   * @param {string | string[] | mongoose.Types.ObjectId} eventId
   */
  async getEventStats(actorId, eventId) {
    const { error, value } = eventIdSchema.validate({ eventId });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const event = await EventNotificationRepository.findByEvent(value.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Notification Statistics",
    });

    return await EventNotificationRepository.getEventStats(value.eventId);
  }
}

export default new EventNotificationService();
