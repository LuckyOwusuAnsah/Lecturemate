import mongoose from "mongoose";

const privateMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The course context that connects the educator and student, if any.
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    message: {
      type: String,
      required: [true, "Message cannot be empty."],
      trim: true,
      maxlength: [2000, "Message cannot be more than 2000 characters."],
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Fast lookup of the full thread between two specific users.
privateMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
privateMessageSchema.index({ recipient: 1, createdAt: -1 });

const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);
export default PrivateMessage;
