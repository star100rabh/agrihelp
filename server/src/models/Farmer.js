const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true, trim: true, unique: true },
    aadharNo: { type: String, default: '' },
    landAreaHectare: { type: Number, required: true },
    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      pincode: { type: String, default: '' },
    },
    caste: { type: String, required: true, trim: true },
    crops: [{ type: String, trim: true }],
    annualIncome: { type: Number, required: true },
    previousSchemes: [{ type: String, trim: true }],
    phoneType: {
      type: String,
      enum: ['smartphone', 'keypad'],
      required: true,
    },
    smartphoneProficiency: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'low',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Farmer', farmerSchema);
