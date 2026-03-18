// @ts-check
import AppError from "../middlewares/error.middleware.js";
import SchoolEvent from "../models/school-event.model.js";
import mongoose from "mongoose";

class SchoolEventRepository {
  /** @param {import("../validators/school-event.validator.js").CreateSchoolEventBody} payload */
  async create(payload) {
    return await SchoolEvent.create(payload);
  }

  /** @param {{ filter: Record<string, any>, options: { page?: number, limit?: number, type?: "all" | "upcoming" | "past" } }} params */
  async findAll({ filter, options }) {
    const { page = 1, limit = 10, type = "all" } = options;
    const skip = (page - 1) * limit;
    const now = new Date().getTime();

    const dateFilter = filter.date ? { ...filter.date } : {};

    if (type === "upcoming") {
      dateFilter.$gte = dateFilter.$gte ? new Date(Math.max(dateFilter.$gte, now)) : now;
    } else if (type === "past") {
      dateFilter.$lt = dateFilter.$lt ? new Date(Math.min(dateFilter.$lt, now)) : now;
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    } else {
      delete filter.date;
    }

    const sortOption = type === "past" ? { date: -1 } : { date: 1 };
    // @ts-ignore
    const [events, total] = await Promise.all([SchoolEvent.find(filter).sort(sortOption).skip(skip).limit(limit).lean(), SchoolEvent.countDocuments(filter)]);
    const totalPages = Math.ceil(total / limit);

    if (total > 0 && page > totalPages) {
      throw new AppError(`Invalid page number. Maximum page is ${totalPages}.`, 400);
    }

    return {
      events,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * @param {{ filter: Record<string, any>, options?: { type?: "all" | "upcoming" | "past" } }} params
   */
  async findAllUnpaginated({ filter, options = {} }) {
    const { type = "all" } = options;
    const now = new Date().getTime();

    const dateFilter = filter.date ? { ...filter.date } : {};

    if (type === "upcoming") {
      dateFilter.$gte = dateFilter.$gte ? new Date(Math.max(dateFilter.$gte, now)) : now;
    } else if (type === "past") {
      dateFilter.$lt = dateFilter.$lt ? new Date(Math.min(dateFilter.$lt, now)) : now;
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    } else {
      delete filter.date;
    }

    const sortOption = type === "past" ? { date: -1 } : { date: 1 };
    // @ts-ignore
    return SchoolEvent.find(filter).sort(sortOption).lean();
  }

  /** @param {mongoose.Types.ObjectId | string | string[]} id */
  async findById(id) {
    return await SchoolEvent.findById(id).lean();
  }

  /** @param {mongoose.Types.ObjectId | string} id */
  async deleteById(id) {
    return await SchoolEvent.findByIdAndDelete(id);
  }

  /**
   * @param {mongoose.Types.ObjectId | string | string[]} id
   * @param {import("../validators/school-event.validator.js").UpdateSchoolEventBody} updateData
   */
  async updateById(id, updateData) {
    const eventId = id;
    const updates = updateData;
    const updateOperation = { $set: updates };
    const options = { new: true, runValidators: true };
    const updatedEvent = await SchoolEvent.findByIdAndUpdate(eventId, updateOperation, options).lean();
    return updatedEvent;
  }

  /**
   * @param {Date | string} startDate
   * @param {Date | string} endDate
   */
  async findByDateRange(startDate, endDate) {
    const from = new Date(startDate);
    const to = new Date(endDate);

    const filter = {
      date: {
        $gte: from,
        $lte: to,
      },
    };

    const query = SchoolEvent.find(filter).sort({ date: 1 });
    return query;
  }

  async getEventStats() {
    const now = new Date();
    const pipeline = [
      {
        // Group all documents into a single stats bucket
        $group: {
          _id: null,

          // Count total number of events
          totalEvents: { $sum: 1 },

          // Count upcoming events (date >= now)
          upcomingEvents: {
            $sum: { $cond: [{ $gte: ["$date", now] }, 1, 0] },
          },

          // Count past events (date < now)
          pastEvents: {
            $sum: { $cond: [{ $lt: ["$date", now] }, 1, 0] },
          },

          // Count events by organizer
          byAdmin: {
            $sum: { $cond: [{ $eq: ["$organizedBy", "admin"] }, 1, 0] },
          },
          byDepartment: {
            $sum: { $cond: [{ $eq: ["$organizedBy", "department"] }, 1, 0] },
          },

          // Determine overall date range
          firstEventDate: { $min: "$date" },
          lastEventDate: { $max: "$date" },
        },
      },
      {
        // Shape the final response
        $project: {
          _id: 0,
          totalEvents: 1,
          upcomingEvents: 1,
          pastEvents: 1,
          organizerBreakdown: {
            admin: "$byAdmin",
            department: "$byDepartment",
          },
          dateRange: {
            firstEvent: "$firstEventDate",
            lastEvent: "$lastEventDate",
          },
        },
      },
    ];
    const stats = await SchoolEvent.aggregate(pipeline);

    return (
      stats[0] || {
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        organizerBreakdown: { admin: 0, department: 0 },
        dateRange: { firstEvent: null, lastEvent: null },
      }
    );
  }

  /** @param {number | undefined} year */
  async getMonthlyEventCount(year) {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);

    const matchStage = {
      $match: {
        date: { $gte: startOfYear, $lte: endOfYear },
      },
    };

    const groupStage = {
      $group: {
        _id: { $month: "$date" },
        count: { $sum: 1 },
        events: {
          $push: { title: "$title", date: "$date", organizedBy: "$organizedBy" },
        },
      },
    };

    const sortStage = { $sort: { _id: 1 } };
    const projectStage = {
      $project: { month: "$_id", count: 1, events: 1, _id: 0 },
    };

    const pipeline = [matchStage, groupStage, sortStage, projectStage];
    // @ts-ignore
    const result = await SchoolEvent.aggregate(pipeline);
    return result;
  }

  async getVenueStats() {
    const now = new Date();

    const groupStage = {
      $group: {
        _id: "$venue",
        eventCount: { $sum: 1 },
        upcomingCount: {
          $sum: { $cond: [{ $gte: ["$date", now] }, 1, 0] },
        },
      },
    };

    const sortStage = { $sort: { eventCount: -1 } };

    const projectStage = {
      $project: {
        venue: "$_id",
        eventCount: 1,
        upcomingCount: 1,
        _id: 0,
      },
    };

    // @ts-ignore
    return await SchoolEvent.aggregate([groupStage, sortStage, projectStage]);
  }

  async getRecentlyCreatedEvents(limit = 5) {
    const maxResults = limit;
    const query = SchoolEvent.find();
    query.sort({ createdAt: -1 });
    query.limit(maxResults).select("title date venue organizedBy");
    return await query;
  }
}

export default new SchoolEventRepository();
