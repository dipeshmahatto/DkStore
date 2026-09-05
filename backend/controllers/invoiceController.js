import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";

const getUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const isCancelled =
      String(order.status).toLowerCase() ===
      "cancelled";

    const isUnpaidOnlineOrder =
      order.paymentMethod !== "COD" &&
      !order.payment;

    if (
      isCancelled ||
      isUnpaidOnlineOrder
    ) {
      return res.json({
        success: false,
        message:
          "Invoice is available only for successful orders",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { getUserOrder };