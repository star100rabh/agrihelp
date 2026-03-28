const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    farmerName: {
      type: String,
      required: true,
      trim: true,
    },
    callType: {
      type: String,
      enum: ['outbound', 'follow_up'],
      default: 'outbound',
    },
    status: {
      type: String,
      enum: ['completed', 'no_answer', 'failed', 'scheduled'],
      default: 'completed',
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    nextAction: {
      type: String,
      default: '',
      trim: true,
    },
    applicationNumber: {
      type: String,
      default: '',
      trim: true,
    },
    callAt: {
      type: Date,
      default: Date.now,
    },
    durationSeconds: {
      type: Number,
      default: 90,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CallLog', callLogSchema);
