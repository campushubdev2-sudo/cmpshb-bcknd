// @ts-check
import { Schema, model } from "mongoose";
import { ACTION_TYPES } from "../constants/action-types.js";
 

const AuditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    action: {
      type: String,
      required: [true, "Action description is required"],
      enum: {
        values: ACTION_TYPES,
        message: "Invalid audit action type",
      },
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog = model("AuditLog", AuditLogSchema);

export default AuditLog;
