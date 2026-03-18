// @ts-check
import AuditLog from "../models/audit-log.model.js";
import mongoose from "mongoose";

class AuditLogRepository {
  async findAll({ filter = {}, sort = "-createdAt", fields = "" }) {
    const query = AuditLog.find(filter);
    const populatedQuery = query.populate("userId", "username email role");
    const sortedQuery = populatedQuery.sort(sort);
    const selectedQuery = sortedQuery.select(fields);
    const results = await selectedQuery.lean();
    return results;
  }

  /** @param {{ userId?: string | mongoose.Types.ObjectId | string[], action: string}} data */
  async create(data) {
    const doc = await AuditLog.create(data);
    return doc.toObject();
  }

  async deleteAll() {
    const result = await AuditLog.deleteMany({});
    return result;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} id
   * @param {{ populate?: string[]}} options
   */
  async findById(id, { populate = [] } = {}) {
    const query = AuditLog.findById(id);
    query.populate(populate);
    const auditLog = await query.lean();
    return auditLog;
  }

  /**@param {mongoose.Types.ObjectId | string} id */
  async deleteById(id) {
    const query = AuditLog.findByIdAndDelete(id);
    const deletedAuditLog = await query.lean();
    return deletedAuditLog;
  }
}

export default new AuditLogRepository();
