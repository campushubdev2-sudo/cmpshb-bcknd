import { Schema, model } from "mongoose";

const SchoolEventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      maxlength: [150, "Venue cannot exceed 150 characters"],
      trim: true,
    },
    organizedBy: {
      type: String,
      required: [true, "Organizer is required"],
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
