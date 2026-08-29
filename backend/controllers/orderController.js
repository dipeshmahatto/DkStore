import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// The fixed forward-only pipeline every order moves through.
// "Cancelled" is a separate terminal state, reachable from any of these
// (except once the order is already Delivered), but never re-enterable.
const STATUS_PIPELINE = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
];
const CANCELLED = "Cancelled";

const pipelineIndex = (status) =>
  STATUS_PIPELINE.findIndex(
    (step) => step.toLowerCase() === String(status || "").toLowerCase()
  );

// COD
const placeOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.json({ success: false, message: "User not authorized" });
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      statusHistory: [{ status: "Order Placed", date: Date.now() }],
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const placeOrderKhalti = async (req, res) => {};
const placeOrderEsewa = async (req, res) => {};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const userOrders = async (req, res) => {
  try {
    const userId = req.userId; 
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const prevStatus = String(order.status || "");
    const newStatus = String(status || "");
    const prevLower = prevStatus.toLowerCase();
    const newLower = newStatus.toLowerCase();

    // No real change requested
    if (prevLower === newLower) {
      return res.json({ success: true, message: "Order status updated successfully" });
    }

    // A cancelled order is a terminal state - nothing can change it further
    if (prevLower === CANCELLED.toLowerCase()) {
      return res.json({
        success: false,
        message: "This order has already been cancelled and cannot be modified",
      });
    }

    const isCancelling = newLower === CANCELLED.toLowerCase();

    if (isCancelling) {
      // Can't cancel an order that has already been fully delivered
      if (prevLower === "delivered") {
        return res.json({
          success: false,
          message: "A delivered order cannot be cancelled",
        });
      }
    } else {
      // Normal pipeline move - must go strictly forward, never backward
      const prevIndex = pipelineIndex(prevStatus);
      const newIndex = pipelineIndex(newStatus);

      if (newIndex === -1) {
        return res.json({ success: false, message: "Invalid status" });
      }
      if (newIndex <= prevIndex) {
        return res.json({
          success: false,
          message:
            "Order status cannot be moved backward - it can only move forward through the pipeline",
        });
      }
    }

    // Only deduct stock the first time an order enters "Packing"
    if (newLower === "packing" && prevLower !== "packing") {
      for (const item of order.items) {
        const productId = item.productId || item._id || item.id;
        if (!productId) continue;

        const product = await productModel.findById(productId);
        if (product) {
          const oldQty = Number(product.quantity) || 0;
          const orderQty = Number(item.quantity) || 0;

          product.quantity = Math.max(oldQty - orderQty, 0);
          await product.save();
        }
      }
    }

    // If the order is being cancelled after stock was already deducted
    // (i.e. it had reached Packing or beyond), restore that stock.
    if (isCancelling) {
      const prevIndex = pipelineIndex(prevStatus);
      const packingIndex = pipelineIndex("Packing");
      const stockWasDeducted = prevIndex >= packingIndex;

      if (stockWasDeducted) {
        for (const item of order.items) {
          const productId = item.productId || item._id || item.id;
          if (!productId) continue;

          const product = await productModel.findById(productId);
          if (product) {
            const oldQty = Number(product.quantity) || 0;
            const orderQty = Number(item.quantity) || 0;
            product.quantity = oldQty + orderQty;
            await product.save();
          }
        }
      }
    }

    //  update the order status and log it in the timestamped history
    order.status = status;
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({ status, date: Date.now() });
    await order.save();

    res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderEsewa,
  placeOrderKhalti,
  allOrders,
  userOrders,
  updateStatus,
};
