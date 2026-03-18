// @ts-check
import Organization from "../models/organization.model.js";
import mongoose from "mongoose";

class OrganizationRepository {
  /** @param {{ orgName: string, description?: string, adviserId: string}} data */
  async create(data) {
    return await Organization.create(data);
  }

  /** @param {string} orgName */
  async findByName(orgName) {
    return await Organization.findOne({ orgName }).lean();
  }

  /** @param {string|mongoose.Types.ObjectId} id */
  async findById(id) {
    return await Organization.findById(id).populate("adviserId", "username").lean();
  }

  /**
   * @param {string|string[]} id
   * @param {{ orgName?: string; description?: string; adviserId?: string;  }} data
   */
  async updateById(id, data) {
    return await Organization.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /** @param {string|string[]} id  */
  async deleteById(id) {
    return await Organization.findByIdAndDelete(id);
  }

  // async findAll({ filter, sort, skip, limit, fields }) {
  //   const queryResult = await Organization.find(filter);
  //   const selectedFields = queryResult.select(fields);
  //   const sortedResults = selectedFields.sort(sort);
  //   const skippedResults = sortedResults.skip(skip);
  //   const limitedResults = skippedResults.limit(limit);
  //   const populatedResults = limitedResults.populate("adviserId", "username");
  //   return populatedResults.lean();
  // }
  /** @param {Object} options @param {Object} options.filter @param {string} options.sort @param {number} options.skip @param {number} options.limit @param {string} options.fields @returns {Promise<Object[]>} */
  async findAll({ filter, sort, skip, limit, fields }) {
    let query = Organization.find(filter);

    if (fields) {
      query = query.select(fields);
    }

    if (sort) {
      query = query.sort(sort);
    }

    if (skip) {
      query = query.skip(skip);
    }

    if (limit) {
      query = query.limit(limit);
    }

    query = query.populate("adviserId", "username");

    const queryResult = await query.lean(); // Use `.lean()` to get plain JavaScript objects instead of Mongoose Documents
    return queryResult;
  }

  /** @param {Object} filter @returns {Promise<number>} */
  async count(filter) {
    return await Organization.countDocuments(filter);
  }

  async getStats() {
    const aggregatedStats = await Organization.aggregate([
      {
        $group: {
          _id: null,
          totalOrganizations: { $sum: 1 },
          avgDescriptionLength: { $avg: { $strLenCP: "$description" } },
        },
      },

      { $project: { _id: 0 } },
    ]);

    return aggregatedStats;
  }

  async getAdviserStats() {
    const aggregatedStats = await Organization.aggregate([
      {
        $group: {
          _id: "$adviserId", // Group by adviserId
          managedOrgs: { $sum: 1 }, // Count the number of organizations managed by each adviser
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "adviserDetails",
        },
      },

      { $unwind: "$adviserDetails" },

      {
        $project: {
          _id: 0,
          adviserName: "$adviserDetails.username",
          managedOrgs: 1,
        },
      },
    ]);

    return aggregatedStats;
  }
}

export default new OrganizationRepository();
