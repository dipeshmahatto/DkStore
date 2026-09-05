import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  items: {
    type: Array,
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  address: {
    type: Object,
    required: true,
  },

  status: {
    type: String,
    required: true,
    default: "Order Placed",
  },

  statusHistory: {
    type: [
      {
        status: {
          type: String,
          required: true,
        },

        date: {
          type: Number,
          required: true,
        },
      },
    ],

    default: () => [
      {
        status: "Order Placed",
        date: Date.now(),
      },
    ],
  },

  paymentMethod: {
    type: String,
    required: true,
  },

  payment: {
    type: Boolean,
    required: true,
    default: false,
  },

  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
    default: "PENDING",
  },

  paymentMode: {
    type: String,
    enum: ["COD", "SANDBOX", "SIMULATED"],
    default: "COD",
  },

  gatewayPaymentId: {
    type: String,
    default: "",
    index: true,
  },

  transactionId: {
    type: String,
    default: "",
  },

  paymentAccount: {
    type: String,
    default: "",
  },

  paidAt: {
    type: Number,
    default: null,
  },

  isBuyNow: {
    type: Boolean,
    default: false,
  },

  date: {
    type: Number,
    required: true,
  },
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
