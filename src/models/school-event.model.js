import { Schema, model } from "mongoose";

const SchoolEventSchema = new Schema(
  {
    title: {
      type: String,
      required: [
        true,
        "[mongodb error] Event title is required – even a goldfish could come up with a name, try harder.",
      ],
      maxlength: [
        100,
        "[mongodb error] Title cannot exceed 100 characters – this isn’t a novel, keep it short.",
      ],
      trim: true,
    },
    objective: {
      type: String,
      maxlength: [
        2000,
        "[mongodb error] Objective cannot exceed 2000 characters – no one signed up for your life story.",
      ],
      trim: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: [
        true,
        "[mongodb error] Start date is required – apparently events don’t happen magically.",
      ],
    },
    endDate: {
      type: Date,
      required: [true, "[mongodb error] End date is required – plan your day, time traveler."],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message:
          "[mongodb error] End date cannot be earlier than start date – nice try bending time, Einstein.",
      },
    },
    startTime: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.allDay) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message:
          "[mongodb error] Invalid start time format. Please use HH:MM format – clocks exist, use them.",
      },
    },
    endTime: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.allDay) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message:
          "[mongodb error] End time must be in HH:mm format – this isn’t interpretive dance, read a clock.",
      },
    },
    venue: {
      type: String,
      required: [true, "[mongodb error] Venue is required – you planning a ghost event now?"],
      maxlength: [
        150,
        "[mongodb error] Venue cannot exceed 150 characters – the location isn’t an encyclopedia entry.",
      ],
      trim: true,
    },
    organizedBy: {
      type: String,
      required: [
        true,
        "[mongodb error] Organizer is required – are you organizing or just guessing?",
      ],
      enum: ["admin", "department"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SchoolEvent = model("SchoolEvent", SchoolEventSchema);

export default SchoolEvent;
