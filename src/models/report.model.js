import { Schema, model } from "mongoose";

const ReportSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitter ID is required"],
    },
    reportType: {
      type: String,
      enum: ["actionPlan", "bylaws", "financial", "proposal"],
      required: [true, "Report type is required"],
    },
    filePaths: [
      {
        type: String,
        maxlength: [255, "File path cannot exceed 255 characters"],
        required: false,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "n/a"],
      default: "pending",
      required: true,
    },
    submittedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Report = model("Report", ReportSchema);

export default Report;
