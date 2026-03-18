// @ts-check
import asyncHandler from "express-async-handler";
import UserService from "../services/user.service.js";
import express from "express";

/** @typedef {express.Request & { user: { id: string } }} AuthenticatedRequest */

class UserController {
  createUser = asyncHandler(async (request, response) => {
    const newUser = await UserService.createUser(/** @type {AuthenticatedRequest} */ (request).user.id, request.body);

    response.status(201).json({
      success: true,
      message: "New user has been created",
      data: newUser,
    });
  });

  getUsers = asyncHandler(async (request, response) => {
    const result = await UserService.getUsers(/** @type {AuthenticatedRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      meta: {
        total: result.total,
        page: request.query.page ? Number(request.query.page) : 1,
        limit: request.query.limit ? Number(request.query.limit) : 10,
      },
      data: result.data,
    });
  });

  getUserById = asyncHandler(async (request, response) => {
    const user = await UserService.getUserById(request.params.id, /** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  });

  updateUser = asyncHandler(async (request, response) => {
    const updatedUser = await UserService.updateUser(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id, request.body);

    response.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  });

  deleteUser = asyncHandler(async (request, response) => {
    await UserService.deleteUser(/** @type {AuthenticatedRequest} */ (request).user.id, request.params.id);

    response.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  });

  getUserStats = asyncHandler(async (request, response) => {
    const stats = await UserService.getDashboardStats(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "User statistics retrieved successfully",
      data: stats,
    });
  });
}

export default new UserController();
