const mongoose = require("mongoose");

const timelineStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    dateLabel: { type: String, default: "TBD" },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    applicationNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "verification", "approved", "rejected", "disbursed"],
      default: "submitted",
    },
    submittedAt: { type: Date, default: Date.now },
    timeline: { type: [timelineStepSchema], default: [] },
    receiptUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
