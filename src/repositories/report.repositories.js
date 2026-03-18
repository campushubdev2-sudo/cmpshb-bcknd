// @ts-check
import Report from "../models/report.model.js";

class ReportRepository {
  /** @param {import("../validators/report.validator.js").CreateReportBody} reportData */
  async createReport(reportData) {
    return await Report.create(reportData);
  }

  /** @param {string} id */
  async findReportById(id) {
    const report = await Report.findById(id);
    const populatedOrg = await report.populate("orgId", "orgName description");
    const populatedSubmittedBy = await populatedOrg.populate("submittedBy", "username email role");
    return populatedSubmittedBy;
  }

  /** @param {{ filter?: Record<string, any>, page?: number, limit?: number, sort?: Record<string, 1 | -1>, populate?: any }} [options] @returns {Promise<{ count: number, reports: Array<Record<string, any>> }>} */
  async findAll({ filter = {}, page = 1, limit = 25, sort = { submittedDate: -1 }, populate = [] } = {}) {
    const normalizedPage = Math.max(1, Number(page));
    const normalizedLimit = Number(limit);
    const skip = (normalizedPage - 1) * normalizedLimit;
    const countPromise = Report.countDocuments(filter);
    const reportsPromise = Report.find(filter).sort(sort).skip(skip).limit(normalizedLimit).populate(populate).lean();
    const [count, reports] = await Promise.all([countPromise, reportsPromise]);

    return { count, reports };
  }

  /** @param {import('mongoose').Types.ObjectId | string | string[]} id @param {{ populate?: import('mongoose').PopulateOptions | Array<string | import('mongoose').PopulateOptions> }} [options] @returns {Promise<Record<string, any> | null>} */
  async findById(id, { populate = [] } = {}) {
    const query = Report.findById(id);
    query.populate(populate);
    query.lean();
    return query;
  }

  /** @param {string[]} ids */
  async findByIds(ids) {
    const reports = await Report.find({ _id: { $in: ids } });
    return reports;
  }

  /** @param {string[]} filePaths */
  async findByFilePaths(filePaths) {
    const reports = await Report.find({ filePaths: { $in: filePaths } });
    return reports;
  }

  /**
   * @param {string} reportId
   * @param {string} status
   */
  async updateStatusById(reportId, status) {
    const update = { status };
    const options = { new: true };
    const updatedReport = await Report.findByIdAndUpdate(reportId, update, options);
    return updatedReport;
  }

  /** @param {string} reportId */
  async deleteById(reportId) {
    const deletedReport = await Report.findByIdAndDelete(reportId);
    return deletedReport;
  }
}

export default new ReportRepository();
