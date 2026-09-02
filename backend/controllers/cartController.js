import userModel from "../models/userModel.js";
import interactionModel from "../models/interactionModel.js";

// Add products to user cart
const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, size, quantity = 1 } = req.body;

    const amountToAdd = Math.max(Number(quantity) || 1, 1);

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({
        success: false,
        message: "User not found - please log in again",
      });
    }

    const cartData = userData.cartData || {};

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += amountToAdd;
      } else {
        cartData[itemId][size] = amountToAdd;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = amountToAdd;
    }

    await userModel.findByIdAndUpdate(userId, {
      cartData,
    });

    await interactionModel.findOneAndUpdate(
      {
        userId,
        productId: itemId,
      },
      {
        $inc: {
          cartCount: 1,
        },
        $set: {
          lastInteractionAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      success: true,
      message: "Added To Cart",
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({
        success: false,
        message: "User not found - please log in again",
      });
    }

    const cartData = userData.cartData || {};

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }

    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, {
      cartData,
    });

    res.json({
      success: true,
      message: "Cart Updated",
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    const userId = req.userId;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({
        success: false,
        message: "User not found - please log in again",
      });
    }

    const cartData = userData.cartData || {};

    res.json({
      success: true,
      cartData,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { addToCart, updateCart, getUserCart };
