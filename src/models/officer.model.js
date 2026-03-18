import { Schema, model } from "mongoose";

const OfficerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      maxlength: [50, "Position cannot exceed 50 characters"],
      trim: true,
    },
    startTerm: {
      type: Date,
      required: [true, "Start term is required"],
    },
    endTerm: {
      type: Date,
      required: [true, "End term is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Officer = model("Officer", OfficerSchema);

export default Officer;
