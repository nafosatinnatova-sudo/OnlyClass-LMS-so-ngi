const mongoose = require("mongoose");

const TeacherProfileSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    avatarUrl: { type: String, default: null, trim: true },
    headline: { type: String, required: true, trim: true },
    aboutShort: { type: String, required: true, trim: true, maxlength: 20 }
  },
  { timestamps: true }
);

TeacherProfileSchema.index({ trackId: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model("TeacherProfile", TeacherProfileSchema);

