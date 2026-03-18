// @ts-check
import CalendarEntry from "../models/calendar-entry.model.js";

class CalendarEntryRepository {
  /**
   * @param {{ eventId: string | import("mongoose").Types.ObjectId, createdBy: string | import("mongoose").Types.ObjectId }} payload
   * @returns {Promise<import("mongoose").Document>}
   */
  async create(payload) {
    return await CalendarEntry.create(payload);
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId} userId
   * @param {string | import("mongoose").Types.ObjectId} eventId
   * @returns {Promise<Record<string, any> | null>}
   */
  async findByUserAndEvent(userId, eventId) {
    const query = { createdBy: userId, eventId };
    const calendarEntry = await CalendarEntry.findOne(query).lean();
    return calendarEntry;
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId} userId
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findByUser(userId) {
    return await CalendarEntry.find({ createdBy: userId }).populate("eventId").lean();
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId | string[]} id
   * @returns {Promise<Record<string, any> | null>}
   */
  async findById(id) {
    return await CalendarEntry.findById(id).lean();
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId} eventId
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async findByEventId(eventId) {
    return await CalendarEntry.findOne({ eventId });
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId | string} id
   * @param {{ eventId?: string | import("mongoose").Types.ObjectId, createdBy?: string | import("mongoose").Types.ObjectId }} updateData
   * @returns {Promise<Record<string, any> | null>}
   */
  async updateById(id, updateData) {
    return await CalendarEntry.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("eventId")
      .populate("createdBy")
      .lean();
  }

  /**
   * @param {string | import("mongoose").Types.ObjectId} id
   * @returns {Promise<import("mongoose").Document | null>}
   */
  async deleteById(id) {
    return await CalendarEntry.findByIdAndDelete(id);
  }

  /**
   * @param {Record<string, any>} query
   * @param {{ page: number, limit: number, sortBy: string, order: 1 | -1, populate?: Array<string | import("mongoose").PopulateOptions> }} options
   * @returns {Promise<Array<import("mongoose").Document>>}
   */
  async findAll(query, options) {
    const { page, limit, sortBy, order, populate } = options;
    const skip = (page - 1) * limit;
    let queryBuilder = CalendarEntry.find(query);

    if (populate) {
      queryBuilder = queryBuilder.populate(populate);
    }

    return queryBuilder
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);
  }

  /**
   * @param {Record<string, any>} query
   * @returns {Promise<number>}
   */
  async count(query) {
    return CalendarEntry.countDocuments(query);
  }

  /**
   * @returns {Promise<Array<{ userId: import("mongoose").Types.ObjectId, username: string, total: number }>>}
   */
  countByUser() {
    return CalendarEntry.aggregate([
      { $group: { _id: "$createdBy", total: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          username: "$user.username",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  /**
   * @returns {Promise<Array<{ eventId: import("mongoose").Types.ObjectId, title: string, total: number }>>}
   */
  countByEvent() {
    return CalendarEntry.aggregate([
      { $group: { _id: "$eventId", total: { $sum: 1 } } },
      {
        $lookup: {
          from: "schoolevents",
          localField: "_id",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $project: {
          _id: 0,
          eventId: "$event._id",
          title: "$event.title",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  /**
   * @returns {Promise<Array<{ _id: { year: number, month: number }, total: number }>>}
   */
  countOverTime() {
    return CalendarEntry.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }
}

export default new CalendarEntryRepository();
