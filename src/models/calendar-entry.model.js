import { model, Schema } from "mongoose";

const CalendarEntrySchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolEvent",
      required: [true, "Event ID is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CalendarEntry = model("CalendarEntry", CalendarEntrySchema);

export default CalendarEntry;
