const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);

