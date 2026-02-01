const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoUrl: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    duration: { type: String, required: true, trim: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", default: null },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "Guide", default: null },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);

