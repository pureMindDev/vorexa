const mongoose = require('mongoose');

const cvProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    summary: { type: String, default: '' },
    education: [
      {
        school: String,
        degree: String,
        fieldOfStudy: String,
        startYear: String,
        endYear: String,
      },
    ],
    experience: [
      {
        title: String,
        organization: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CVProfile', cvProfileSchema);
