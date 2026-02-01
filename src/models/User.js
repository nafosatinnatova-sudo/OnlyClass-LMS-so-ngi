const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema(
  {
    videosWatched: { type: Number, default: 0 },
    testsAvg: { type: Number, default: 0 },
    guidesDownloaded: { type: Number, default: 0 },
    ratingPlace: { type: Number, default: null }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    age: { type: Number, default: null, min: 5, max: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: null, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student", index: true },
    blocked: { type: Boolean, default: false, index: true },
    stats: { type: StatsSchema, default: () => ({}) },
    refreshTokenHash: { type: String, default: null },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);

