import express from "express";

import {
  placeOrder,
  initiateEsewaPayment,
  verifyEsewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  allOrders,
  userOrders,
  updateStatus,
} from "../controllers/orderController.js";

import {
  getUserOrder,
} from "../controllers/invoiceController.js";

import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// Admin routes
orderRouter.post(
  "/list",
  adminAuth,
  allOrders
);

orderRouter.post(
  "/status",
  adminAuth,
  updateStatus
);

// Cash on delivery
orderRouter.post(
  "/place",
  authUser,
  placeOrder
);

// eSewa UAT routes
orderRouter.post(
  "/esewa/initiate",
  authUser,
  initiateEsewaPayment
);

orderRouter.post(
  "/esewa/verify",
  authUser,
  verifyEsewaPayment
);

// Khalti sandbox routes
orderRouter.post(
  "/khalti/initiate",
  authUser,
  initiateKhaltiPayment
);

orderRouter.post(
  "/khalti/verify",
  authUser,
  verifyKhaltiPayment
);

// User order routes
orderRouter.post(
  "/userorders",
  authUser,
  userOrders
);

orderRouter.get(
  "/:orderId",
  authUser,
  getUserOrder
);

export default orderRouter;