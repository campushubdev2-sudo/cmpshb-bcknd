// @ts-check

import { Schema, model } from "mongoose";

const EventNotificationSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolEvent",
      required: [true, "Event ID is required"],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const EventNotification = model("EventNotification", EventNotificationSchema);

export default EventNotification;
