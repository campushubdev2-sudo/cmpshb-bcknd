import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
      validate: {
        validator(value) {
          return value.length > 0 && value.trim().length > 0;
        },
        message: "Username cannot be empty",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [60, "Invalid password length"],
      maxlength: [255, "Password cannot exceed 255 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "adviser", "officer", "student"],
      required: [true, "Role is required"],
      lowercase: true,
      default: "student",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      length: 13,
      validate: {
        validator: (value) => /^\+[1-9]\d{1,14}$/.test(value),
        message: "Phone number must be in E.164 format (e.g., +639123456789)",
      },
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true, versionKey: false },
);

const User = model("User", UserSchema);
export default User;
