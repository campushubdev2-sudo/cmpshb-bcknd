// @ts-check
import asyncHandler from "express-async-handler";
import OfficerService from "../services/officer.service.js";
import { JPCS_OFFICER_POSITIONS, YWAV_OFFICER_POSITIONS, SSLG_OFFICER_POSITIONS, ELEM_OFFICER_POSITIONS, COLLEGE_OF_TEACHER_OFFICER_POSITIONS, MODERN_YOUNG_EDUCATORS_OFFICER_POSITIONS, BSCRIM_OFFICER_POSITIONS, SUPREME_STUDENT_COUNCIL_OFFICER_POSITIONS, JUNIOR_PHILIPPINE_BSA_OFFICER_POSITIONS, BSHM_OFFICER_POSITIONS, BSBA_OFFICER_POSITIONS } from "../constants/officer-positions.js";

/** @typedef {import('express').Request & { user: { id: string } }} AuthenticatedRequest */
/** @typedef {{ positionValue: string, positionLabel: string }} OfficerPositionDTO */

class OfficerController {
  createOfficer = asyncHandler(async (request, response) => {
    const officer = await OfficerService.createOfficer(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "Officer created successfully",
      data: officer,
    });
  });

  getOfficers = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOfficers(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: "Officers retrieved successfully",
      data: result,
    });
  });

  getOfficerById = asyncHandler(async (request, response) => {
    // @ts-ignore
    const officer = await OfficerService.getOfficerById(/** @type {AuthenticatedRequest} */ (request).user.id, request.params);

    response.status(200).json({
      success: true,
      message: "Officer retrieved successfully",
      data: officer,
    });
  });

  updateOfficer = asyncHandler(async (request, response) => {
    const { id } = request.params;
    const result = await OfficerService.updateOfficer(/** @type {AuthenticatedRequest} */ (request).user.id, id, request.body);

    response.status(200).json({
      success: true,
      message: "Officer updated successfully",
      data: result,
    });
  });

  deleteOfficer = asyncHandler(async (request, response) => {
    // @ts-ignore
    const result = await OfficerService.deleteOfficerById(/** @type {AuthenticatedRequest} */ (request).user.id, request.params);

    response.status(200).json({
      success: true,
      message: "Officer deleted successfully",
      data: result,
    });
  });

  getOfficerStats = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOfficerStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Officer statistics retrieved successfully",
      data: result,
    });
  });

  getOfficersByPeriod = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOfficersByPeriod(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: `Officer statistics by ${result.period} retrieved successfully`,
      data: result.data,
    });
  });

  getOfficersDetailed = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOfficersDetailed(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "Detailed officers information retrieved successfully",
      count: result.length,
      data: result,
    });
  });

  getOfficersNearTermEnd = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOfficersNearTermEnd(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: `Officers with term ending within ${result.days} days retrieved successfully`,
      data: result,
    });
  });

  getOrganizationOfficerStats = asyncHandler(async (request, response) => {
    const result = await OfficerService.getOrganizationOfficerStats(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.orgId);

    response.status(200).json({
      success: true,
      message: "Organization officer statistics retrieved successfully",
      data: result,
    });
  });

  getAllOfficerPositions = asyncHandler(async (_request, response) => {
    const ALL_POSITIONS = [...BSBA_OFFICER_POSITIONS, ...BSHM_OFFICER_POSITIONS, ...JUNIOR_PHILIPPINE_BSA_OFFICER_POSITIONS, ...SUPREME_STUDENT_COUNCIL_OFFICER_POSITIONS, ...BSCRIM_OFFICER_POSITIONS, ...MODERN_YOUNG_EDUCATORS_OFFICER_POSITIONS, ...COLLEGE_OF_TEACHER_OFFICER_POSITIONS, ...ELEM_OFFICER_POSITIONS, ...SSLG_OFFICER_POSITIONS, ...YWAV_OFFICER_POSITIONS, ...JPCS_OFFICER_POSITIONS];

    /** @type {OfficerPositionDTO[]} */
    const data = Array.from(new Set(ALL_POSITIONS)).map((position) => ({
      positionValue: position,
      positionLabel: position,
    }));

    response.status(200).json({
      success: true,
      message: "Officer positions retrieved successfully",
      data,
    });
  });
}

export default new OfficerController();
