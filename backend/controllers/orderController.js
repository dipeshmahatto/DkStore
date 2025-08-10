import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
// COD
const placeOrder = async (req, res) => {
  try {
    // userId comes from auth middleware (req.userId)
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
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear cart after placing order
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
    const userId = req.userId; // comes from auth middleware
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

    const prevStatus = String(order.status || "").toLowerCase();
    const newStatus = String(status).toLowerCase();

    // Only deduct when going from NOT packing → packing
    if (newStatus === "packing" && prevStatus !== "packing") {
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

    // Now update the order status
    order.status = status;
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
