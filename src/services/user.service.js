// @ts-check
import AppError from "../middlewares/error.middleware.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import AuthService from "./auth.service.js";
import mongoose from "mongoose";
import { createUserSchema, queryUsersSchema, updateUserSchema, userIdParamSchema } from "../validators/user.validator.js";
import UserRepository from "../repositories/user.repositories.js";

class UserService {
  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/user.validator.js").CreateUserBody} payload
   */
  async createUser(actorId, payload) {
    const { error, value } = createUserSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { username, email, password, role, phoneNumber } = value;
    const userByUsername = await UserRepository.findByUsername(username);
    const userByEmail = await UserRepository.findByEmail(email);

    if (userByUsername) {
      throw new AppError("Username already exists", 409);
    }

    if (userByEmail) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const user = await UserRepository.create({
      username,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
    });

    // @ts-ignore
    delete user.password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;

    await AuditLogRepository.create({
      userId: actorId,
      action: "Create User",
    });

    return user;
  }

  /**
   * @param {string | mongoose.Types.ObjectId} actorId
   * @param {import("../validators/user.validator.js").QueryUsers} query
   */
  async getUsers(actorId, query) {
    const { error, value } = queryUsersSchema.validate(query);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { page, limit, email, username, role, phoneNumber } = value;
    const filters = {};

    if (email) {
      filters.email = new RegExp(email, "i");
    }
    if (username) {
      filters.username = new RegExp(username, "i");
    }
    if (role) {
      filters.role = role;
    }
    if (phoneNumber) {
      filters.phoneNumber = phoneNumber;
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Users",
    });

    if (value.paginate) {
      return UserRepository.findAll({ page, limit, filters });
    } else {
      return UserRepository.findAllNoPagination({ filters });
    }
  }

  /**
   * @param {mongoose.Types.ObjectId | string | string[]} userId
   * @param {mongoose.Types.ObjectId | string} actorId
   */
  async getUserById(userId, actorId) {
    const { error } = userIdParamSchema.validate({ id: userId });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View User Details",
    });

    return user;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {mongoose.Types.ObjectId | string | string[]} id
   * @param {import("../validators/user.validator.js").UpdateUserBody} payload
   */
  async updateUser(actorId, id, payload) {
    const { error: idError } = userIdParamSchema.validate({ id });
    if (idError) {
      const message = idError.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { error, value } = updateUserSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    if (existingUser.role === "admin" && value.role && value.role !== "admin") {
      const adminCount = await UserRepository.countByRole("admin");
      if (adminCount === 1) {
        throw new AppError("Cannot update the last admin", 403);
      }
    }

    if (value.password) {
      value.password = await AuthService.hashPassword(value.password);
    }

    const updatedUser = await UserRepository.updateById(id, value);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update User",
    });

    return updatedUser;
  }

  /**
   * @param {mongoose.Types.ObjectId | string} actorId
   * @param {mongoose.Types.ObjectId | string | string[]} id
   */
  async deleteUser(actorId, id) {
    const { error } = userIdParamSchema.validate({ id });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "admin") {
      const adminCount = await UserRepository.countByRole("admin");
      if (adminCount === 1) {
        throw new AppError("Cannot delete the last admin", 403);
      }
    }

    await UserRepository.deleteById(id);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete User",
    });

    return true;
  }

  /** @param {mongoose.Types.ObjectId | string} actorId */
  async getDashboardStats(actorId) {
    const [totalUsers, byRole] = await Promise.all([UserRepository.getTotalUsers(), UserRepository.getOverviewStats()]);

    await AuditLogRepository.create({
      userId: actorId,
      action: "User Statistics Overview",
    });

    const usersByRole = byRole.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    const response = {
      totalUsers,
      usersByRole,
    };

    return response;
  }
}

export default new UserService();
