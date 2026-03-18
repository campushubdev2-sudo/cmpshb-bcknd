// @ts-check
import User from "../models/user.model.js";
import mongoose from "mongoose";

class UserRepository {
  /** @param {string} identifier */
  async findByIdentifier(identifier) {
    const query = { $or: [{ email: identifier }, { username: identifier }] };
    const projection = "+password";
    return User.findOne(query).select(projection).lean();
  }

  /** @param {string} username */
  async findByUsername(username) {
    const query = User.findOne({ username });
    const user = await query.lean();
    return user;
  }

  /**
   * @param {string} email
   * @param {{ select?: string, lean?: boolean }} options
   */
  async findByEmail(email, options = {}) {
    const query = { email: email };
    const useLean = options.lean !== undefined ? options.lean : true;
    const selection = options.select || "";
    const dbQuery = User.findOne(query).select(selection).lean(useLean);
    return dbQuery;
  }

  /** @param {mongoose.Types.ObjectId | string | string[]} id */
  findById(id) {
    return User.findById(id);
  }

  /** @param {{ username: string, password: string, email: string, role: string, phoneNumber?: string }} data */
  async create(data) {
    const userDocument = await User.create(data);
    const userObject = userDocument.toObject();
    return userObject;
  }

  /** @param {string} role */
  async countByRole(role) {
    const query = { role };
    const count = await User.countDocuments(query);
    return count;
  }

  /**
   * @param {string | mongoose.Types.ObjectId | string[]} id
   * @param {{ username?: string, email?: string, password?: string, role?: string, phoneNumber?: string }} data
   */
  updateById(id, data) {
    const filter = { _id: id };
    const options = { new: true, runValidators: true };
    return User.findOneAndUpdate(filter, data, options);
  }

  /** @param {mongoose.Types.ObjectId | string | string[]} id */
  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  getTotalUsers() {
    return User.countDocuments();
  }

  async getOverviewStats() {
    const pipeline = [
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ];
    const result = await User.aggregate(pipeline);
    return result;
  }

  /** @param {{ page?: number, limit?: number, filters?: Record<string, any> }} data */
  async findAll({ page, limit, filters }) {
    // @ts-ignore
    const skip = (page - 1) * limit;
    // @ts-ignore
    const dataQuery = User.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 });
    const countQuery = User.countDocuments(filters);
    const [data, total] = await Promise.all([dataQuery, countQuery]);
    return { data, total };
  }

  /** @param {{ filters?: Record<string, any> }} params */
  async findAllNoPagination({ filters = {} } = {}) {
    const data = await User.find(filters).sort({ createdAt: -1 });

    return { data, total: data.length };
  }

  /** @param {string | string[] | mongoose.Types.ObjectId[]} ids */
  async findManyByIds(ids) {
    const users = await User.find({
      _id: { $in: ids },
    });

    return users;
  }
}

export default new UserRepository();
