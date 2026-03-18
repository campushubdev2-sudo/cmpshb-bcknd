// @ts-check
import Officer from "../models/officer.model.js";
import OrganizationRepository from "./organization.repositories.js";
import mongoose from "mongoose";

class OfficerRepository {
  async create(data) {
    return Officer.create(data);
  }

  async findByUserAndOrg(userId, orgId) {
    return Officer.findOne({ userId, orgId }).lean();
  }

  /**
   * @param {string | mongoose.Types.ObjectId}
   * @returns {Promise<Object|null>}
   */
  async findOneAndDelete(id) {
    return await Officer.findOneAndDelete({ _id: id })
      .populate({
        path: "userId",
        select: "username email role",
      })
      .populate({
        path: "orgId",
        select: "orgName description",
      })
      .lean();
  }

  async findAll({ filter, sort, skip, limit }) {
    const query = Officer.find(filter).populate("userId", "username email role").populate("orgId", "orgName").lean();

    if (sort) {
      query.sort(sort);
    }
    if (skip !== undefined) {
      query.skip(skip);
    }
    if (limit !== undefined) {
      query.limit(limit);
    }

    const [items, total] = await Promise.all([query.exec(), Officer.countDocuments(filter)]);

    return { items, total };
  }

  /** @param {mongoose.Types.ObjectId | string | string[]} id */
  async findById(id) {
    return Officer.findById(id).populate("userId", "username email role").populate("orgId", "orgName description").lean();
  }

  async deleteOfficerById(id) {
    return await Officer.findByIdAndDelete(id);
  }

  async updateById(id, updateData) {
    return await Officer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("userId")
      .populate("orgId")
      .lean();
  }

  /** @param {string} userId */
  async isUserIdExists(userId) {
    return await Officer.findOne({ userId }).lean();
  }

  /** @param {string} orgId */
  async isOrgIdExists(orgId) {
    return await Officer.findOne({ orgId }).lean();
  }

  /** @param {string} id */
  async checkOfficerExists(id) {
    return await Officer.findById(id).lean();
  }

  async getTotalOfficersCount() {
    return await Officer.countDocuments();
  }

  /** @param {string} orgId */
  async getOfficerCountByOrgId(orgId) {
    return await Officer.countDocuments({ orgId });
  }

  async getOfficersCountByOrganization() {
    return await Officer.aggregate([
      {
        $group: {
          _id: "$orgId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "_id",
          foreignField: "_id",
          as: "organization",
        },
      },
      {
        $unwind: "$organization",
      },
      {
        $project: {
          organizationId: "$_id",
          organizationName: "$organization.orgName",
          officerCount: "$count",
          _id: 0,
        },
      },
      {
        $sort: { officerCount: -1 },
      },
    ]);
  }

  async getOfficersByPosition() {
    return await Officer.aggregate([
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          position: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  async getActiveOfficersCount() {
    return await Officer.countDocuments({
      endTerm: { $gte: new Date() },
    });
  }

  async getInactiveOfficersCount() {
    return await Officer.countDocuments({
      endTerm: { $lt: new Date() },
    });
  }

  async getOfficersByTimePeriod(period = "month") {
    let groupFormat;

    switch (period) {
      case "year":
        groupFormat = { $year: "$createdAt" };
        break;
      case "quarter":
        groupFormat = {
          year: { $year: "$createdAt" },
          quarter: {
            $ceil: { $divide: [{ $month: "$createdAt" }, 3] },
          },
        };
        break;
      case "month":
      default:
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
    }

    return await Officer.aggregate([
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1 },
      },
    ]);
  }

  async getOfficersWithUserDetails() {
    return await Officer.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "organizations",
          localField: "orgId",
          foreignField: "_id",
          as: "organization",
        },
      },
      {
        $unwind: "$organization",
      },
      {
        $project: {
          position: 1,
          startTerm: 1,
          endTerm: 1,
          username: "$user.username",
          email: "$user.email",
          userRole: "$user.role",
          organizationName: "$organization.orgName",
        },
      },
    ]);
  }

  async getTermDurationStats() {
    return await Officer.aggregate([
      {
        $addFields: {
          termDurationDays: {
            $divide: [
              { $subtract: ["$endTerm", "$startTerm"] },
              1000 * 60 * 60 * 24, // Convert milliseconds to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$termDurationDays" },
          minDuration: { $min: "$termDurationDays" },
          maxDuration: { $max: "$termDurationDays" },
          totalOfficers: { $sum: 1 },
        },
      },
    ]);
  }

  async getOfficersNearTermEnd(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await Officer.find({
      endTerm: {
        $gte: new Date(),
        $lte: futureDate,
      },
    })
      .populate("userId", "username email")
      .populate("orgId", "orgName")
      .sort({ endTerm: 1 })
      .lean();
  }

  /** @param {string} orgId */
  async getActiveOfficersCountByOrgId(orgId) {
    return await Officer.countDocuments({
      orgId,
      endTerm: { $gte: new Date() },
    });
  }

  /** @param {string} orgId */
  async getOfficersByPositionInOrg(orgId) {
    return await Officer.aggregate([
      {
        $match: { orgId: mongoose.Types.ObjectId.createFromHexString(orgId) },
      },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          position: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  /** @param {string|string[]} orgId */
  async getOrganizationOfficerStats(orgId) {
    const organization = await OrganizationRepository.findById(orgId);
    if (!organization) {
      return null;
    }

    const [totalOfficers, activeOfficers, byPosition] = await Promise.all([
      Officer.countDocuments({ orgId }),

      // Count active officers (endTerm in future)
      Officer.countDocuments({
        orgId,
        endTerm: { $gte: new Date() },
      }),

      // Group officers by position
      Officer.aggregate([
        {
          $match: { orgId: mongoose.Types.ObjectId.createFromHexString(orgId) },
        },
        {
          $group: {
            _id: "$position",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            position: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    return {
      organization,
      statistics: {
        totalOfficers,
        activeOfficers,
        inactiveOfficers: totalOfficers - activeOfficers,
        positions: byPosition,
      },
    };
  }
}

export default new OfficerRepository();
