import { Schema, model } from "mongoose";

const OrganizationSchema = new Schema(
  {
    orgName: {
      type: String,
      required: [true, "Organization name is required"],
      unique: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    adviserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Adviser is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Organization = model("Organization", OrganizationSchema);

export default Organization;
