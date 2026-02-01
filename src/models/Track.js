const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Track", TrackSchema);

