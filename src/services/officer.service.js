// @ts-check
import OfficerRepository from "../repositories/officer.repositories.js";
import { createOfficerSchema, getOfficersSchema, getOfficerByIdSchema, updateOfficerSchema, deleteOfficerSchema, getOfficersNearTermEndSchema, getOfficersStatsByPeriodSchema } from "../validators/officer.validator.js";
import AppError from "../middlewares/error.middleware.js";
import UserRepository from "../repositories/user.repositories.js";
import OrganizationRepository from "../repositories/organization.repositories.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import mongoose from "mongoose";

class OfficerService {
  /**
   * @param {string} actorId
   * @param {import("../validators/officer.validator.js").CreateOfficerBody} payload
   */
  async createOfficer(actorId, payload) {
    const { error, value } = createOfficerSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { userId, orgId, position, startTerm, endTerm } = value;

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const organization = await OrganizationRepository.findById(orgId);
    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    const existingOfficer = await OfficerRepository.findByUserAndOrg(userId, orgId);

    if (existingOfficer) {
      throw new AppError("User is already an officer of this organization", 409);
    }

    const officer = await OfficerRepository.create({
      userId,
      orgId,
      position,
      startTerm,
      endTerm,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Officer",
    });

    return officer;
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/officer.validator.js").OfficerIdParam} payload
   */
  async deleteOfficerById(actorId, payload) {
    const { error, value } = deleteOfficerSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    // Atomic: find and delete in one operation
    const officer = await OfficerRepository.findOneAndDelete({ _id: id });

    if (!officer) {
      throw new AppError("Officer not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Officer",
    });

    return officer;
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/officer.validator.js").GetOfficersQuery} query
   */
  async getOfficers(actorId, query) {
    const { error, value } = getOfficersSchema.validate(query);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");

      throw new AppError(message, 400);
    }

    const { orgId, userId, position, page, limit, sortBy, order } = value;

    const filter = {};
    if (orgId) {
      filter.orgId = orgId;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (position) {
      filter.position = position;
    }

    // @ts-ignore
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };
    // @ts-ignore
    const skip = (page - 1) * limit;

    const { items, total } = await OfficerRepository.findAll({
      filter,
      sort,
      skip,
      limit,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Officers",
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        // @ts-ignore
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * @param {string} actorId
   * @param {string | string[]} params
   */
  async getOfficerById(actorId, params) {
    const { error, value } = getOfficerByIdSchema.validate(params);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const officer = await OfficerRepository.findById(id);
    if (!officer) {
      throw new AppError("Officer not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Officer Details",
    });

    return officer;
  }

  /**
   * @param {string} actorId
   * @param {string | mongoose.Types.ObjectId | string[]} id
   * @param {import("../validators/officer.validator.js").UpdateOfficerBody} payload
   */
  async updateOfficer(actorId, id, payload) {
    const { error, value } = updateOfficerSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const existingOfficer = await OfficerRepository.findById(id);
    if (!existingOfficer) {
      throw new AppError("Officer not found", 404);
    }

    if (value.userId && value.userId !== existingOfficer.userId.toString()) {
      throw new AppError("User ID cannot be updated", 400);
    }

    if (value.orgId && value.orgId !== existingOfficer.orgId.toString()) {
      throw new AppError("Organization ID cannot be updated", 400);
    }

    if (value.startTerm && value.startTerm > existingOfficer.startTerm) {
      throw new AppError("Cannot set start term after it has already begun", 400);
    }

    if (value.endTerm && value.endTerm < existingOfficer.endTerm) {
      throw new AppError("Cannot shorten end term past the existing date", 400);
    }

    const startTermToCompare = value.startTerm || existingOfficer.startTerm;
    if (value.endTerm && value.endTerm <= startTermToCompare) {
      throw new AppError("End term must be after start term", 400);
    }

    const updatedOfficer = await OfficerRepository.updateById(id, value);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Officer",
    });

    return updatedOfficer;
  }

  /** @param {string} actorId */
  async getOfficerStats(actorId) {
    const [totalOfficers, activeOfficers, inactiveOfficers, byOrganization, byPosition, termStats] = await Promise.all([OfficerRepository.getTotalOfficersCount(), OfficerRepository.getActiveOfficersCount(), OfficerRepository.getInactiveOfficersCount(), OfficerRepository.getOfficersCountByOrganization(), OfficerRepository.getOfficersByPosition(), OfficerRepository.getTermDurationStats()]);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Officer Statistics Overview",
    });

    return {
      summary: { totalOfficers, activeOfficers, inactiveOfficers },
      distribution: { byOrganization, byPosition },
      termDuration: termStats[0] || {},
    };
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/officer.validator.js").OfficersStatsQuery} payload
   */
  async getOfficersByPeriod(actorId, payload) {
    const { error, value } = getOfficersStatsByPeriodSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { period } = value;
    const result = await OfficerRepository.getOfficersByTimePeriod(period);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Officer Statistics by Period",
    });

    return {
      period,
      data: result,
    };
  }

  /** @param {string} actorId */
  async getOfficersDetailed(actorId) {
    await AuditLogRepository.create({
      userId: actorId,
      action: "Detailed Officer Statistics",
    });

    return await OfficerRepository.getOfficersWithUserDetails();
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/officer.validator.js").OfficersNearTermEndQuery} payload
   */
  async getOfficersNearTermEnd(actorId, payload) {
    const { error, value } = getOfficersNearTermEndSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { days } = value;
    const result = await OfficerRepository.getOfficersNearTermEnd(days);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Officers Near Term End",
    });

    return { days, count: result.length, officers: result };
  }

  /**
   * @param {string} actorId
   * @param {string | string[]} orgId
   */
  async getOrganizationOfficerStats(actorId, orgId) {
    const { error, value } = getOfficerByIdSchema.validate({ id: orgId });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;
    const result = await OfficerRepository.getOrganizationOfficerStats(id);
    if (!result) {
      throw new AppError("Organization not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Officer Statistics by Organization",
    });

    return {
      organization: {
        id: orgId,
        name: result.organization.orgName,
      },
      statistics: result.statistics,
    };
  }
}

export default new OfficerService();
