// @ts-check
import asyncHandler from "express-async-handler";
import OrganizationService from "../services/organization.service.js";

/** @typedef {import('express').Request & { user: { id: string } }} AuthenticatedRequest */

class OrganizationController {
  createOrganization = asyncHandler(async (request, response) => {
    const result = await OrganizationService.createOrganization(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: result,
    });
  });

  getOrganizations = asyncHandler(async (request, response) => {
    const result = await OrganizationService.getAllOrganizations(/** @type {AuthenticatedRequest} */ (request).user?.id, request.query);

    response.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      data: result.organizations,
      meta: result.pagination,
    });
  });

  getOrganization = asyncHandler(async (request, response) => {
    const result = await OrganizationService.getOrganization(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id);

    response.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: result,
    });
  });

  updateOrganization = asyncHandler(async (request, response) => {
    const result = await OrganizationService.updateOrganization(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id, request.body);

    response.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: result,
    });
  });

  deleteOrganization = asyncHandler(async (request, response) => {
    await OrganizationService.deleteOrganization(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id);

    response.status(200).json({
      success: true,
      message: "Organization deleted successfully",
      data: null,
    });
  });

  getStats = asyncHandler(async (request, response) => {
    const result = await OrganizationService.getGeneralStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: result,
    });
  });
}

export default new OrganizationController();
