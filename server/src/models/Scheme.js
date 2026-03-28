const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    summary: { type: String, required: true },
    benefit: { type: String, required: true },
    priorityWeight: { type: Number, default: 50 },
    requiredDocuments: [{ type: String }],
    applyLinks: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    cscGuidance: { type: String, default: '' },
    estimatedChargeInr: { type: Number, default: 0 },
    deadline: { type: String, default: 'Check official portal' },
    isActive: { type: Boolean, default: true },
    minLandArea: { type: Number, default: 0 },
    maxLandArea: { type: Number, default: null },
    minIncome: { type: Number, default: 0 },
    maxIncome: { type: Number, default: null },
    allowedLocations: [{ type: String }],
    allowedCastes: [{ type: String }],
    cropTags: [{ type: String }],
    targetPhoneType: [{ type: String, enum: ['smartphone', 'keypad'] }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);
