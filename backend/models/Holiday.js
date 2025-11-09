import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 256,
    },
    type: {
      type: String,
      enum: ["WEEKEND", "CUSTOM"],
      default: "CUSTOM",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// `date` already has `unique: true` in the schema definition above.
// Avoid declaring the same index twice which causes a Mongoose duplicate index warning.
// HolidaySchema.index({ date: 1 }, { unique: true });

export default mongoose.model("Holiday", HolidaySchema);