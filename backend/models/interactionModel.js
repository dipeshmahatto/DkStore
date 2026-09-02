import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    viewCount: { type: Number, default: 0 },
    cartCount: { type: Number, default: 0 },
    lastInteractionAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

interactionSchema.index({ userId: 1, productId: 1 }, { unique: true });

const interactionModel =
  mongoose.models.interaction ||
  mongoose.model("interaction", interactionSchema);

export default interactionModel;