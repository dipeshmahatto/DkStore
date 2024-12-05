import userModel from "../models/userModel";
//add products to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const uesrData = await userModel.findById(userId);
    let cartData = await uesrData.cartData;

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({success:false, message:error.message})
  }
};
const updateCart = async (req, res) => {};
const getUserCart = async (req, res) => {};

export { addToCart, updateCart, getUserCart };
