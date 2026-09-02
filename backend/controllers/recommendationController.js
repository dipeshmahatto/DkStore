import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import interactionModel from "../models/interactionModel.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const words = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

const priceBand = (price) => {
  const amount = Number(price) || 0;

  if (amount < 1000) return "under_1000";
  if (amount < 2000) return "1000_1999";
  if (amount < 3500) return "2000_3499";
  if (amount < 5000) return "3500_4999";

  return "5000_plus";
};

const addFeature = (vector, key, weight) => {
  if (!key) return;

  vector[key] = (vector[key] || 0) + weight;
};

const buildProductVector = (product) => {
  const vector = {};

  addFeature(vector, `category:${normalize(product.category)}`, 5);
  addFeature(vector, `subcategory:${normalize(product.subCategory)}`, 4);
  addFeature(vector, `price:${priceBand(product.price)}`, 1.5);

  [...new Set(words(product.name))].forEach((word) => {
    addFeature(vector, `name:${word}`, 2.5);
  });

  [...new Set(words(product.description))].forEach((word) => {
    addFeature(vector, `description:${word}`, 1);
  });

  (product.sizes || []).forEach((size) => {
    addFeature(vector, `size:${normalize(size)}`, 0.25);
  });

  return vector;
};

const addWeightedVector = (target, source, weight) => {
  Object.entries(source).forEach(([feature, value]) => {
    target[feature] = (target[feature] || 0) + value * weight;
  });
};

const cosineSimilarity = (first, second) => {
  const firstKeys = Object.keys(first);

  if (!firstKeys.length || !Object.keys(second).length) {
    return 0;
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  firstKeys.forEach((key) => {
    dotProduct += first[key] * (second[key] || 0);
    firstMagnitude += first[key] ** 2;
  });

  Object.values(second).forEach((value) => {
    secondMagnitude += value ** 2;
  });

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
};

const getPopularProducts = (products, limit) =>
  [...products]
    .filter((product) => Number(product.quantity) > 0)
    .sort(
      (first, second) =>
        Number(second.bestseller) - Number(first.bestseller) ||
        Number(second.date) - Number(first.date),
    )
    .slice(0, limit);

const readUserId = (req) => {
  const token = req.headers.token;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
};

const trackInteraction = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!["view", "cart"].includes(type)) {
      return res.json({
        success: false,
        message: "Invalid interaction type",
      });
    }

    const productExists = await productModel.exists({
      _id: productId,
    });

    if (!productExists) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    const counter = type === "view" ? "viewCount" : "cartCount";

    await interactionModel.findOneAndUpdate(
      { userId, productId },
      {
        $inc: { [counter]: 1 },
        $set: { lastInteractionAt: new Date() },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      success: true,
      message: "Interaction recorded",
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const personalizedRecommendations = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

    const products = await productModel.find({});
    const userId = readUserId(req);

    if (!userId) {
      return res.json({
        success: true,
        source: "popular",
        products: getPopularProducts(products, limit),
      });
    }

    const [interactions, orders] = await Promise.all([
      interactionModel.find({ userId }).lean(),

      orderModel
        .find({
          userId: String(userId),
          status: { $ne: "Cancelled" },
        })
        .lean(),
    ]);

    const preferenceWeights = new Map();

    interactions.forEach((interaction) => {
      const productId = String(interaction.productId);

      const interactionScore =
        Number(interaction.viewCount || 0) * 1 +
        Number(interaction.cartCount || 0) * 3;

      preferenceWeights.set(
        productId,
        (preferenceWeights.get(productId) || 0) + interactionScore,
      );
    });

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const productId = String(item.productId || item._id || item.id || "");

        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return;
        }

        const purchaseWeight = Math.max(Number(item.quantity) || 1, 1) * 5;

        preferenceWeights.set(
          productId,
          (preferenceWeights.get(productId) || 0) + purchaseWeight,
        );
      });
    });

    if (preferenceWeights.size === 0) {
      return res.json({
        success: true,
        source: "popular",
        products: getPopularProducts(products, limit),
      });
    }

    const productVectors = new Map();

    products.forEach((product) => {
      productVectors.set(String(product._id), buildProductVector(product));
    });

    const userProfile = {};

    preferenceWeights.forEach((weight, productId) => {
      const productVector = productVectors.get(productId);

      if (productVector) {
        addWeightedVector(userProfile, productVector, weight);
      }
    });

    const interactedIds = new Set(preferenceWeights.keys());

    const rankedProducts = products
      .filter(
        (product) =>
          Number(product.quantity) > 0 &&
          !interactedIds.has(String(product._id)),
      )
      .map((product) => ({
        product,
        score: cosineSimilarity(
          userProfile,
          productVectors.get(String(product._id)),
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort(
        (first, second) =>
          second.score - first.score ||
          Number(second.product.bestseller) -
            Number(first.product.bestseller) ||
          Number(second.product.date) - Number(first.product.date),
      )
      .slice(0, limit)
      .map(({ product, score }) => ({
        ...product.toObject(),
        similarityScore: Number(score.toFixed(4)),
      }));

    res.json({
      success: true,
      source: rankedProducts.length ? "content-based" : "popular",
      products: rankedProducts.length
        ? rankedProducts
        : getPopularProducts(products, limit),
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const similarProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const products = await productModel.find({});

    const currentProduct = products.find(
      (product) => String(product._id) === String(productId),
    );

    if (!currentProduct) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    const currentVector = buildProductVector(currentProduct);

    const rankedProducts = products
      .filter(
        (product) =>
          String(product._id) !== String(productId) &&
          Number(product.quantity) > 0,
      )
      .map((product) => ({
        product,
        score: cosineSimilarity(currentVector, buildProductVector(product)),
      }))
      .filter((entry) => entry.score > 0)
      .sort(
        (first, second) =>
          second.score - first.score ||
          Number(second.product.date) - Number(first.product.date),
      )
      .slice(0, limit)
      .map(({ product, score }) => ({
        ...product.toObject(),
        similarityScore: Number(score.toFixed(4)),
      }));

    res.json({
      success: true,
      products: rankedProducts,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { trackInteraction, personalizedRecommendations, similarProducts };
