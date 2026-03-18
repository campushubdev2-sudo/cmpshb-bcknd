// @ts-check
import OrganizationRepository from "../repositories/organization.repositories.js";
import UserRepository from "../repositories/user.repositories.js";
import { orgIdSchema, createOrganizationSchema, getOrganizationsSchema, updateOrganizationSchema } from "../validators/organization.validator.js";
import AppError from "../middlewares/error.middleware.js";
import { mapOrganization } from "../utils/helper.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";

class OrganizationService {
  /**
   * @param {string} actorId
   * @param {import("../validators/organization.validator.js").CreateOrganizationBody} payload
   */
  async createOrganization(actorId, payload) {
    const { error, value } = createOrganizationSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { orgName, adviserId } = value;

    // Check if organization name already exists
    const existingOrg = await OrganizationRepository.findByName(orgName);
    if (existingOrg) {
      throw new AppError("Organization name already exists", 409);
    }

    // Check if Adviser (User) exists
    const adviserExists = await UserRepository.findById(adviserId);
    if (!adviserExists) {
      throw new AppError("The assigned adviser does not exist", 404);
    }

    const created = await OrganizationRepository.create(value);
    const organization = await OrganizationRepository.findById(created._id);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create Organization",
    });

    return mapOrganization(organization);
  }

  /**
   * @param {string} actorId
   * @param {string|string[]} orgId
   */
  async getOrganization(actorId, orgId) {
    const { error, value } = orgIdSchema.validate({ orgId });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const organization = await OrganizationRepository.findById(value.orgId);

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Organization Details",
    });

    return mapOrganization(organization);
  }

  /**
   * @param {string} actorId
   * @param {string|string[]} id
   * @param {import("../validators/organization.validator.js").UpdateOrganizationBody} payload
   */
  async updateOrganization(actorId, id, payload) {
    const { error, value } = updateOrganizationSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const updatedOrg = await OrganizationRepository.updateById(id, value);
    if (!updatedOrg) {
      throw new AppError("Organization not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Organization",
    });

    return updatedOrg;
  }

  /**
   * @param {string} actorId
   * @param {string|string[]} id
   */
  async deleteOrganization(actorId, id) {
    const { error } = orgIdSchema.validate({ orgId: id });

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const deletedOrg = await OrganizationRepository.deleteById(id);
    if (!deletedOrg) {
      throw new AppError("Organization not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Organization",
    });

    return deletedOrg;
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/organization.validator.js").GetOrganizationsQuery} query
   */
  async getAllOrganizations(actorId, query) {
    const { error, value } = getOrganizationsSchema.validate(query);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { page, limit, sort, fields, ...filter } = value;
    const skip = (page - 1) * limit;

    const organizations = await OrganizationRepository.findAll({ filter, sort, skip, limit, fields: fields?.split(",").join(" ") });
    const total = await OrganizationRepository.count(filter);

    if (actorId) {
      await AuditLogRepository.create({
        userId: actorId,
        action: "View Organizations",
      });
    }

    return {
      organizations: organizations.map(mapOrganization),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /** @param {string} actorId  */
  async getGeneralStats(actorId) {
    const stats = await OrganizationRepository.getStats();
    const adviserStats = await OrganizationRepository.getAdviserStats();

    await AuditLogRepository.create({
      userId: actorId,
      action: "Organization Statistics Overview",
    });

    return {
      summary: stats[0] || { totalOrganizations: 0 },
      byAdviser: adviserStats,
    };
  }
}

export default new OrganizationService();
