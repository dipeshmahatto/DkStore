import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const DELIVERY_FEE = 100;
const DEMO_OTP = "123456";

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
    (step) => step.toLowerCase() === String(status || "").toLowerCase(),
  );

const validateAddress = (address) => {
  const requiredFields = [
    "Name",
    "email",
    "street",
    "city",
    "state",
    "zipcode",
    "country",
    "phone",
  ];

  if (!address || typeof address !== "object") {
    return false;
  }

  return requiredFields.every(
    (field) => String(address[field] || "").trim() !== "",
  );
};

const prepareOrder = async (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw new Error("Your order does not contain any products");
  }

  const verifiedItems = [];
  let subtotal = 0;

  for (const requestedItem of requestedItems) {
    const productId =
      requestedItem.productId || requestedItem._id || requestedItem.id;

    const quantity = Number(requestedItem.quantity);
    const size = String(requestedItem.size || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("An invalid product was found in the order");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Product quantity must be at least 1");
    }

    const product = await productModel.findById(productId).lean();

    if (!product) {
      throw new Error("One of the selected products is no longer available");
    }

    if (Number(product.quantity) < quantity) {
      throw new Error(`${product.name} does not have enough stock`);
    }

    if (!size || !(product.sizes || []).includes(size)) {
      throw new Error(`Please select a valid size for ${product.name}`);
    }

    verifiedItems.push({
      ...product,
      size,
      quantity,
    });

    subtotal += Number(product.price) * quantity;
  }

  return {
    items: verifiedItems,
    amount: subtotal + DELIVERY_FEE,
  };
};

const generateTransactionId = (provider) => {
  const prefix = provider === "Khalti" ? "KHL" : "ESW";
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${time}-${random}`;
};

const maskMobileNumber = (mobile) =>
  `${mobile.slice(0, 2)}******${mobile.slice(-2)}`;

const saveOrder = async ({
  userId,
  requestedItems,
  address,
  paymentMethod,
  payment,
  paymentMode,
  transactionId = "",
  paymentAccount = "",
  paidAt = null,
  clearCart = true,
}) => {
  if (!validateAddress(address)) {
    throw new Error("Please complete all delivery information");
  }

  const preparedOrder = await prepareOrder(requestedItems);
  const now = Date.now();

  const order = await orderModel.create({
    userId,
    items: preparedOrder.items,
    amount: preparedOrder.amount,
    address,
    status: "Order Placed",
    statusHistory: [{ status: "Order Placed", date: now }],
    paymentMethod,
    payment,
    paymentMode,
    transactionId,
    paymentAccount,
    paidAt,
    date: now,
  });

  if (clearCart) {
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
  }

  return order;
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address, isBuyNow } = req.body;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authorized",
      });
    }

    const order = await saveOrder({
      userId,
      requestedItems: items,
      address,
      paymentMethod: "COD",
      payment: false,
      paymentMode: "COD",
      clearCart: !isBuyNow,
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeDummyOnlineOrder = async (req, res, provider) => {
  try {
    const userId = req.userId;
    const { items, address, dummyPayment, isBuyNow } = req.body;

    const mobile = String(dummyPayment?.mobile || "").trim();
    const secret = String(dummyPayment?.secret || "").trim();
    const otp = String(dummyPayment?.otp || "").trim();

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authorized",
      });
    }

    if (!/^(97|98)\d{8}$/.test(mobile)) {
      return res.json({
        success: false,
        message: "Enter a valid 10-digit Nepal mobile number",
      });
    }

    if (secret.length < 4) {
      return res.json({
        success: false,
        message:
          provider === "Khalti"
            ? "Enter a valid 4-digit or longer demo PIN"
            : "Enter a valid demo eSewa password",
      });
    }

    if (otp !== DEMO_OTP) {
      return res.json({
        success: false,
        message: "Incorrect demo OTP. Use 123456",
      });
    }

    const transactionId = generateTransactionId(provider);
    const paidAt = Date.now();

    const order = await saveOrder({
      userId,
      requestedItems: items,
      address,
      paymentMethod: provider,
      payment: true,
      paymentMode: "SIMULATED",
      transactionId,
      paymentAccount: maskMobileNumber(mobile),
      paidAt,
      clearCart: !isBuyNow,
    });

    res.json({
      success: true,
      message: `${provider} demo payment successful`,
      orderId: order._id,
      transactionId,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderKhalti = async (req, res) =>
  placeDummyOnlineOrder(req, res, "Khalti");

const placeOrderEsewa = async (req, res) =>
  placeDummyOnlineOrder(req, res, "eSewa");

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
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
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = String(order.status || "");
    const newStatus = String(status || "");
    const previousLower = previousStatus.toLowerCase();
    const newLower = newStatus.toLowerCase();

    if (previousLower === newLower) {
      return res.json({
        success: true,
        message: "Order status is already up to date",
      });
    }

    if (previousLower === CANCELLED.toLowerCase()) {
      return res.json({
        success: false,
        message: "A cancelled order cannot be modified",
      });
    }

    const isCancelling = newLower === CANCELLED.toLowerCase();

    if (isCancelling) {
      if (previousLower === "delivered") {
        return res.json({
          success: false,
          message: "A delivered order cannot be cancelled",
        });
      }
    } else {
      const previousIndex = pipelineIndex(previousStatus);
      const newIndex = pipelineIndex(newStatus);

      if (newIndex === -1) {
        return res.json({
          success: false,
          message: "Invalid status",
        });
      }

      if (newIndex <= previousIndex) {
        return res.json({
          success: false,
          message: "Order status can only move forward",
        });
      }
    }

    if (newLower === "packing" && previousLower !== "packing") {
      const stockChanges = [];

      for (const item of order.items) {
        const productId = item.productId || item._id || item.id;

        if (!productId) continue;

        const product = await productModel.findById(productId);

        if (!product) continue;

        const currentStock = Number(product.quantity) || 0;
        const orderedQuantity = Number(item.quantity) || 0;

        if (currentStock < orderedQuantity) {
          return res.json({
            success: false,
            message: `${product.name} does not have enough stock`,
          });
        }

        stockChanges.push({
          product,
          newQuantity: currentStock - orderedQuantity,
        });
      }

      for (const change of stockChanges) {
        change.product.quantity = change.newQuantity;
        await change.product.save();
      }
    }

    if (isCancelling) {
      const previousIndex = pipelineIndex(previousStatus);
      const packingIndex = pipelineIndex("Packing");

      if (previousIndex >= packingIndex) {
        for (const item of order.items) {
          const productId = item.productId || item._id || item.id;

          if (!productId) continue;

          const product = await productModel.findById(productId);

          if (!product) continue;

          product.quantity =
            (Number(product.quantity) || 0) + (Number(item.quantity) || 0);

          await product.save();
        }
      }
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      date: Date.now(),
    });

    if (newLower === "delivered" && order.paymentMethod === "COD") {
      order.payment = true;
      order.paidAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
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
