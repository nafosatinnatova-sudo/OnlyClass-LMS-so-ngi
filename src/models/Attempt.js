const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: [Number], required: true },
    saved: { type: Boolean, default: false, index: true },
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    scorePercent: { type: Number, required: true }
  },
  { timestamps: true }
);

AttemptSchema.index({ testId: 1, userId: 1, saved: 1 });

module.exports = mongoose.model("Attempt", AttemptSchema);

