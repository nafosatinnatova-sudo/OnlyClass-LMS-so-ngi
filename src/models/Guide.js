const mongoose = require("mongoose");

const GuideSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pdfUrl: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    downloadCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guide", GuideSchema);

