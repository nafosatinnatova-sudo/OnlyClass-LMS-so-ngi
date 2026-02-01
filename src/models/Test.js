const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: null, trim: true },
    text: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    timeoutSeconds: { type: Number, required: true, min: 1, max: 15 }
  },
  { _id: false }
);

const TestSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, default: null, trim: true },
    title: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true, lowercase: true },
    questions: { type: [QuestionSchema], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);

