// @ts-check
import EventNotification from "../models/event-notification.model.js";
import mongoose from "mongoose";

class EventNotificationRepository {
  /** @param {{ eventId: string, recipientId: string, message: string, status?: "sent" | "failed" | undefined, sentAt: Date }} notificationData */
  async create(notificationData) {
    return await EventNotification.create(notificationData);
  }

  /**
   * @returns {Promise<number>}
   */
  async count() {
    return await EventNotification.countDocuments();
  }

  /**
   * @param {string | null} status
   * @returns {Promise<number>}
   */
  async countByStatus(status = null) {
    const query = status ? { status } : {};
    return await EventNotification.countDocuments(query);
  }

  async getOverallStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const total = await EventNotification.countDocuments();
    const read = await EventNotification.countDocuments({ status: "read" });
    const sent = await EventNotification.countDocuments({ status: "sent" });
    const todayCount = await EventNotification.countDocuments({ sentAt: { $gte: today } });
    const hourlyDistribution = await EventNotification.aggregate([{ $match: { sentAt: { $gte: today } } }, { $group: { _id: { $hour: "$sentAt" }, count: { $sum: 1 } } }]);
    hourlyDistribution.sort((a, b) => a._id - b._id);
    return { total, read, sent, today: todayCount, readRate: total > 0 ? (read / total) * 100 : 0, hourlyDistribution };
  }

  /** @param {import("mongoose").Types.ObjectId | string} eventId */
  async getEventStats(eventId) {
    const stats = await EventNotification.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { eventId, total: 0, read: 0, sent: 0, readRate: 0 };

    stats.forEach(({ _id, count }) => {
      result.total += count;
      if (_id === "read") {
        result.read = count;
      }
      if (_id === "sent") {
        result.sent = count;
      }
    });

    result.readRate = result.total > 0 ? (result.read / result.total) * 100 : 0;

    return result;
  }

  /**
   * @param {import("mongoose").Types.ObjectId} userId
   * @returns {Promise<{ userId: mongoose.Types.ObjectId, total: number, read: number, sent: number, readRate: number, recentNotifications: any[], dailyTrends: any[] }>}
   */
  async getUserStats(userId) {
    const [data] = await EventNotification.aggregate([
      { $match: { recipientId: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          statusSummary: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          recentActivity: [
            { $sort: { sentAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                eventId: 1,
                status: 1,
                sentAt: 1,
                message: { $substr: ["$message", 0, 50] },
              },
            },
          ],
          dailyTrends: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$sentAt" },
                },
                total: { $sum: 1 },
                read: {
                  $sum: { $cond: [{ $eq: ["$status", "read"] }, 1, 0] },
                },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    const result = {
      userId,
      total: 0,
      read: 0,
      sent: 0,
      readRate: 0,
      recentNotifications: data.recentActivity,
      dailyTrends: data.dailyTrends,
    };

    /** @type {{ _id: "read" | "sent" | "failed", count: number }[]} */
    const statusSummary = data.statusSummary;

    statusSummary.forEach(({ _id, count }) => {
      result.total += count;
      if (_id === "read") {
        result.read = count;
      }
      if (_id === "sent") {
        result.sent = count;
      }
    });

    result.readRate = result.total > 0 ? (result.read / result.total) * 100 : 0;

    return result;
  }

  /**
   * @param {number} days
   * @returns {Promise<Array<{ date: string, total: number, read: number, sent: number, readRate: number }>>}
   */
  async getTimeSeriesStats(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return EventNotification.aggregate([
      { $match: { sentAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$sentAt" },
          },
          total: { $sum: 1 },
          read: {
            $sum: { $cond: [{ $eq: ["$status", "read"] }, 1, 0] },
          },
          sent: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          total: 1,
          read: 1,
          sent: 1,
          readRate: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$read", "$total"] }, 100] }],
          },
        },
      },
    ]);
  }

  /**
   * @param {number} [limit=10]
   * @returns {Promise<Array<{ eventId: import("mongoose").Types.ObjectId, eventName: string | undefined, total: number, read: number, sent: number, readRate: number }>>}
   */
  async getTopEvents(limit = 10) {
    return EventNotification.aggregate([
      {
        $group: {
          _id: "$eventId",
          total: { $sum: 1 },
          read: {
            $sum: { $cond: [{ $eq: ["$status", "read"] }, 1, 0] },
          },
          sent: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "schoolevents",
          localField: "_id",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          eventId: "$_id",
          eventName: "$event.title",
          total: 1,
          read: 1,
          sent: 1,
          readRate: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$read", "$total"] }, 100] }],
          },
        },
      },
    ]);
  }

  /**
   * @returns {Promise<Array<{ month: string, total: number, readWithinHour: number, readWithinDay: number, hourReadRate: number, dayReadRate: number }>>}
   */
  async getDeliveryPerformance() {
    return EventNotification.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$sentAt" } },
          total: { $sum: 1 },
          readWithinHour: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "read"] },
                    {
                      $lte: [{ $subtract: ["$updatedAt", "$sentAt"] }, 3600000],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          readWithinDay: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "read"] },
                    {
                      $lte: [{ $subtract: ["$updatedAt", "$sentAt"] }, 86400000],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
      {
        $project: {
          month: "$_id",
          total: 1,
          readWithinHour: 1,
          readWithinDay: 1,
          hourReadRate: {
            $multiply: [{ $divide: ["$readWithinHour", "$total"] }, 100],
          },
          dayReadRate: {
            $multiply: [{ $divide: ["$readWithinDay", "$total"] }, 100],
          },
        },
      },
    ]);
  }

  /** @param {Array<{ eventId: string; recipientId: string; message: string;  status?: "sent" | "read"; sentAt: Date; }>} notificationsData */
  async createMany(notificationsData) {
    return await EventNotification.insertMany(notificationsData);
  }

  /**
   * @param {mongoose.Types.ObjectId | string} id
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async findById(id) {
    return await EventNotification.findById(id).populate("eventId", "title date venue").populate("recipientId", "username email role");
  }

  /**
   * @param {{ eventId?: mongoose.Types.ObjectId | string | undefined, recipientId?: mongoose.Types.ObjectId | string | undefined, status?: "sent" | "failed" | "read", sortBy?: string, order?: "asc" | "desc", fields?: string, limit?: number | string, page?: number | string }} queryParams
   * @returns {Promise<{ notifications: Array<import("mongoose").Document>, pagination: { total: number, page: number, limit: number, pages: number } }>}
   */
  async findAllWithFilters(queryParams) {
    const { eventId, recipientId, status, sortBy = "sentAt", order = "desc", fields, limit = 10, page = 1 } = queryParams;

    // Build filter object
    /** @type {Record<string, any>} */
    const filter = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }

    if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
      filter.recipientId = recipientId;
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    /** @type {Record<string, 1 | -1>} */
    const sort = {};
    sort[sortBy] = order === "desc" ? -1 : 1;

    // Build projection
    /** @type {Record<string, 1>} */
    const projection = fields
      ? fields.split(",").reduce((acc, field) => {
          acc[field.trim()] = 1;
          return acc;
        }, /** @type {Record<string, 1>} */ ({}))
      : {};

    const pageNum = Number(page);
    const limitNum = Number(limit);
    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    const notifications = await EventNotification.find(filter).select(projection).sort(sort).skip(skip).limit(limitNum).populate("eventId", "title date venue").populate("recipientId", "username email role");

    const total = await EventNotification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * @param {import("mongoose").Types.ObjectId} recipientId
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findByRecipient(recipientId) {
    return await EventNotification.find({ recipientId }).lean();
  }

  /** @param {string | mongoose.Types.ObjectId} eventId */
  async findByEvent(eventId) {
    return await EventNotification.find({ eventId }).populate("recipientId");
  }

  /**
   * @param {import("mongoose").Types.ObjectId | string} id
   * @param {{ message?: string, status?: "sent" | "failed"}} updateData
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async updateById(id, updateData) {
    return await EventNotification.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * @param {import("mongoose").Types.ObjectId} id
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async findByIdWithEvent(id) {
    return await EventNotification.findById(id).populate("eventId", "title date");
  }

  /**
   * @param {import("mongoose").Types.ObjectId} id
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async findByIdWithEventAndRecipient(id) {
    return await EventNotification.findById(id).populate("eventId", "title date venue").populate("recipientId", "username email role");
  }

  /**
   * @param {import("mongoose").Types.ObjectId | string} id
   * @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof EventNotification.schema>> | null>}
   */
  async deleteById(id) {
    return await EventNotification.findByIdAndDelete(id);
  }

  /**
   * @param {import("mongoose").Types.ObjectId} eventId
   * @param {import("mongoose").Types.ObjectId} recipientId
   * @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof EventNotification.schema>> | null>}
   */
  async findByEventAndRecipient(eventId, recipientId) {
    return await EventNotification.findOne({ eventId, recipientId });
  }

  /**
   * @param {import("mongoose").Types.ObjectId} id
   * @param {"sent" | "failed" | "read"} status
   * @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof EventNotification.schema>> | null>}
   */
  async updateStatus(id, status) {
    return await EventNotification.findByIdAndUpdate(id, { status }, { new: true });
  }

  /**
   * @param {import("mongoose").Types.ObjectId} id
   * @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof EventNotification.schema>> | null>}
   */
  async delete(id) {
    return await EventNotification.findByIdAndDelete(id);
  }

  /**
   * @param {import("mongoose").Types.ObjectId[]} ids
   * @param {"sent" | "failed" | "read"} status
   * @returns {Promise<import("mongoose").UpdateResult>}
   */
  async updateManyStatus(ids = [], status) {
    if (!ids.length) {
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      };
    }

    return await EventNotification.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status,
          sentAt: status === "sent" ? new Date() : {},
        },
      },
    );
  }
}

export default new EventNotificationRepository();
