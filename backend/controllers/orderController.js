import crypto from "crypto";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const DELIVERY_FEE = 100;

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

const clientUrl = () =>
  String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const esewaConfig = () => ({
  productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",

  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",

  paymentUrl:
    process.env.ESEWA_PAYMENT_URL ||
    "https://rc-epay.esewa.com.np/api/epay/main/v2/form",

  statusUrl:
    process.env.ESEWA_STATUS_URL ||
    "https://rc.esewa.com.np/api/epay/transaction/status/",
});

const khaltiConfig = () => ({
  secretKey: String(process.env.KHALTI_SECRET_KEY || "").trim(),

  apiUrl: String(
    process.env.KHALTI_API_URL || "https://dev.khalti.com/api/v2",
  ).replace(/\/$/, ""),
});

const validateAddress = (address) => {
  const requiredFields = ["Name", "street", "city", "phone"];

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
    subtotal,
    amount: subtotal + DELIVERY_FEE,
  };
};

const createOrder = async ({
  userId,
  requestedItems,
  address,
  paymentMethod,
  paymentMode,
  gatewayPaymentId = "",
  isBuyNow = false,
  clearCart = false,
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

    statusHistory: [
      {
        status: "Order Placed",
        date: now,
      },
    ],

    paymentMethod,
    payment: false,
    paymentStatus: "PENDING",
    paymentMode,
    gatewayPaymentId,
    isBuyNow,
    date: now,
  });

  if (clearCart) {
    await userModel.findByIdAndUpdate(userId, {
      cartData: {},
    });
  }

  return {
    order,
    subtotal: preparedOrder.subtotal,
  };
};

const completeOnlineOrder = async ({ order, transactionId }) => {
  if (!order.payment) {
    order.payment = true;
    order.paymentStatus = "PAID";

    order.transactionId = String(transactionId || "");

    order.paidAt = Date.now();

    await order.save();

    if (!order.isBuyNow) {
      await userModel.findByIdAndUpdate(order.userId, {
        cartData: {},
      });
    }
  }

  return order;
};

const formatAmount = (value) => {
  const number = Number(value);

  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const sameAmount = (first, second) =>
  Math.abs(
    Number(String(first).replace(/,/g, "")) -
      Number(String(second).replace(/,/g, "")),
  ) < 0.01;

const extractApiMessage = (data, fallback) => {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  const firstValue = Object.values(data)[0];

  if (Array.isArray(firstValue) && firstValue[0]) {
    return firstValue[0];
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return fallback;
};

const requestJson = async (url, options = {}, allowHttpError = false) => {
  const response = await fetch(url, options);

  const rawBody = await response.text();

  let data = {};

  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    data = {
      message: rawBody,
    };
  }

  if (!response.ok && !allowHttpError) {
    throw new Error(extractApiMessage(data, "Payment gateway request failed"));
  }

  return {
    response,
    data,
  };
};

const createEsewaSignature = (message, secretKey) =>
  crypto.createHmac("sha256", secretKey).update(message).digest("base64");

const secureStringEqual = (first, second) => {
  const firstBuffer = Buffer.from(String(first));

  const secondBuffer = Buffer.from(String(second));

  return (
    firstBuffer.length === secondBuffer.length &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer)
  );
};

const decodeEsewaResponse = (encodedData) => {
  const normalizedData = String(encodedData || "").replace(/ /g, "+");

  const decodedText = Buffer.from(normalizedData, "base64").toString("utf8");

  return JSON.parse(decodedText);
};

const verifyEsewaResponseSignature = (payload, secretKey) => {
  const signedFields = String(payload.signed_field_names || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  if (!signedFields.length || !payload.signature) {
    return false;
  }

  const message = signedFields
    .map((field) => `${field}=${payload[field]}`)
    .join(",");

  const expectedSignature = createEsewaSignature(message, secretKey);

  return secureStringEqual(expectedSignature, payload.signature);
};

const generateEsewaTransactionUuid = () => {
  const timestamp = Date.now();

  const random = crypto.randomBytes(4).toString("hex");

  return `DK-${timestamp}-${random}`;
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

    const { order } = await createOrder({
      userId,
      requestedItems: items,
      address,
      paymentMethod: "COD",
      paymentMode: "COD",
      isBuyNow: Boolean(isBuyNow),
      clearCart: !isBuyNow,
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const initiateEsewaPayment = async (req, res) => {
  try {
    const userId = req.userId;

    const { items, address, isBuyNow } = req.body;

    const config = esewaConfig();

    const transactionUuid = generateEsewaTransactionUuid();

    const { order, subtotal } = await createOrder({
      userId,
      requestedItems: items,
      address,
      paymentMethod: "eSewa",
      paymentMode: "SANDBOX",

      gatewayPaymentId: transactionUuid,

      isBuyNow: Boolean(isBuyNow),
    });

    const totalAmount = formatAmount(order.amount);

    const signatureMessage =
      `total_amount=${totalAmount},` +
      `transaction_uuid=${transactionUuid},` +
      `product_code=${config.productCode}`;

    res.json({
      success: true,
      paymentUrl: config.paymentUrl,

      formData: {
        amount: formatAmount(subtotal),
        tax_amount: "0",
        total_amount: totalAmount,

        transaction_uuid: transactionUuid,

        product_code: config.productCode,

        product_service_charge: "0",

        product_delivery_charge: formatAmount(DELIVERY_FEE),

        success_url: `${clientUrl()}/payment/esewa/success`,

        failure_url: `${clientUrl()}/payment/esewa/failure`,

        signed_field_names: "total_amount,transaction_uuid,product_code",

        signature: createEsewaSignature(signatureMessage, config.secretKey),
      },
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyEsewaPayment = async (req, res) => {
  try {
    const { data: encodedData } = req.body;

    const config = esewaConfig();

    if (!encodedData) {
      return res.json({
        success: false,
        message: "Missing eSewa response",
      });
    }

    const paymentResponse = decodeEsewaResponse(encodedData);

    if (!verifyEsewaResponseSignature(paymentResponse, config.secretKey)) {
      return res.json({
        success: false,
        message: "The eSewa response signature is invalid",
      });
    }

    if (
      paymentResponse.status !== "COMPLETE" ||
      paymentResponse.product_code !== config.productCode
    ) {
      return res.json({
        success: false,
        message: "eSewa payment is not complete",
      });
    }

    const order = await orderModel.findOne({
      userId: req.userId,
      paymentMethod: "eSewa",

      gatewayPaymentId: paymentResponse.transaction_uuid,
    });

    if (!order) {
      return res.json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (!sameAmount(paymentResponse.total_amount, order.amount)) {
      return res.json({
        success: false,
        message: "eSewa payment amount mismatch",
      });
    }

    const statusUrl = new URL(config.statusUrl);

    statusUrl.searchParams.set("product_code", config.productCode);

    statusUrl.searchParams.set("total_amount", formatAmount(order.amount));

    statusUrl.searchParams.set(
      "transaction_uuid",
      paymentResponse.transaction_uuid,
    );

    const { data: statusResponse } = await requestJson(statusUrl.toString());

    if (
      statusResponse.status !== "COMPLETE" ||
      statusResponse.transaction_uuid !== paymentResponse.transaction_uuid ||
      !sameAmount(statusResponse.total_amount, order.amount)
    ) {
      return res.json({
        success: false,
        message: "eSewa could not verify this payment",
      });
    }

    await completeOnlineOrder({
      order,

      transactionId: statusResponse.ref_id || paymentResponse.transaction_code,
    });

    res.json({
      success: true,

      message: "eSewa payment verified successfully",

      orderId: order._id,

      transactionId: order.transactionId,

      isBuyNow: order.isBuyNow,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const initiateKhaltiPayment = async (req, res) => {
  try {
    const userId = req.userId;

    const { items, address, isBuyNow } = req.body;

    const config = khaltiConfig();

    if (!config.secretKey) {
      return res.json({
        success: false,

        message: "Add KHALTI_SECRET_KEY to the backend .env file",
      });
    }

    const { order } = await createOrder({
      userId,
      requestedItems: items,
      address,
      paymentMethod: "Khalti",
      paymentMode: "SANDBOX",
      isBuyNow: Boolean(isBuyNow),
    });

    try {
      const { data } = await requestJson(
        `${config.apiUrl}/epayment/initiate/`,
        {
          method: "POST",

          headers: {
            Authorization: `Key ${config.secretKey}`,

            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            return_url: `${clientUrl()}/payment/khalti/callback`,

            website_url: clientUrl(),

            amount: Math.round(order.amount * 100),

            purchase_order_id: String(order._id),

            purchase_order_name: `DK Store Order ${order._id}`,
          }),
        },
      );

      if (!data.pidx || !data.payment_url) {
        throw new Error("Khalti did not return a payment URL");
      }

      order.gatewayPaymentId = data.pidx;

      await order.save();

      res.json({
        success: true,
        orderId: order._id,

        paymentUrl: data.payment_url,

        expiresAt: data.expires_at,
      });
    } catch (gatewayError) {
      order.paymentStatus = "FAILED";

      await order.save();

      throw gatewayError;
    }
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, orderId } = req.body;

    const config = khaltiConfig();

    if (!config.secretKey) {
      return res.json({
        success: false,

        message: "Add KHALTI_SECRET_KEY to the backend .env file",
      });
    }

    if (!pidx || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.json({
        success: false,
        message: "Invalid Khalti callback",
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.userId,
      paymentMethod: "Khalti",
    });

    if (!order || order.gatewayPaymentId !== pidx) {
      return res.json({
        success: false,
        message: "Khalti order not found",
      });
    }

    const { response, data } = await requestJson(
      `${config.apiUrl}/epayment/lookup/`,
      {
        method: "POST",

        headers: {
          Authorization: `Key ${config.secretKey}`,

          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          pidx,
        }),
      },
      true,
    );

    if (data.status !== "Completed") {
      if (["Expired", "User canceled"].includes(data.status)) {
        order.paymentStatus = "FAILED";

        await order.save();
      } else if (data.status === "Refunded") {
        order.paymentStatus = "REFUNDED";

        await order.save();
      }

      return res.json({
        success: false,

        message:
          data.status ||
          extractApiMessage(
            data,
            `Khalti verification failed (${response.status})`,
          ),
      });
    }

    if (Number(data.total_amount) !== Math.round(order.amount * 100)) {
      return res.json({
        success: false,
        message: "Khalti payment amount mismatch",
      });
    }

    await completeOnlineOrder({
      order,
      transactionId: data.transaction_id,
    });

    res.json({
      success: true,

      message: "Khalti payment verified successfully",

      orderId: order._id,

      transactionId: order.transactionId,

      isBuyNow: order.isBuyNow,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({
      date: -1,
    });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({
        userId: req.userId,
      })
      .sort({
        date: -1,
      });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
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

    if (!isCancelling && order.paymentMethod !== "COD" && !order.payment) {
      return res.json({
        success: false,

        message: "Online payment must be verified before processing this order",
      });
    }

    if (isCancelling) {
      if (previousLower === "delivered") {
        return res.json({
          success: false,

          message: "A delivered order cannot be cancelled",
        });
      }

      if (order.paymentMethod !== "COD" && order.payment) {
        return res.json({
          success: false,

          message:
            "A paid online order requires a gateway refund before cancellation",
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
      order.paymentStatus = "PAID";
      order.paidAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,

      message: "Order status updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  placeOrder,
  initiateEsewaPayment,
  verifyEsewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  allOrders,
  userOrders,
  updateStatus,
};
