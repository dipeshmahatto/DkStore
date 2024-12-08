import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
// COD
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

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
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({success:true, message:"Order Placed"})
  } catch (error) {
    console.log(error);
    res.json({success:false, message:error.message})
    
  }
};
const placeOrderKhalti = async (req, res) => {};
const placeOrderEsewa = async (req, res) => {};

const allOrders = async (req, res) => {};

const userOrders = async (req, res) => {};

const updateStatus = async (req, res) => {};

export {
  placeOrder,
  placeOrderEsewa,
  placeOrderKhalti,
  allOrders,
  userOrders,
  updateStatus,
};
