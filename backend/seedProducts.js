// One-time script to add Topwear, Footwear, Eyewear, and Handbag products
// into the DkStore database — using a DIFFERENT free API than DummyJSON:
// the "Free-Ecommerce-Products-Api" (free, no key required, hosted on
// GitHub Pages): https://kolzsticks.github.io/Free-Ecommerce-Products-Api/
//
// NOTE: This API only has ~10 real fashion items total (much smaller than
// DummyJSON), so this script adds a smaller batch. Run it alongside your
// existing DummyJSON-based scripts if you want more volume.
//
// Run with:  node seedFromFreeEcommerceApi.js
// (run this from inside the backend/ folder, same place as server.js)

import mongoose from "mongoose";
import dotenv from "dotenv";
import productModel from "./models/productModel.js";

dotenv.config();

const SOURCE_URL =
  "https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json";

// Figure out Men/Women from the product name/keywords.
// Falls back to alternating if no gender is detectable (e.g. "Unisex").
let alternateToggle = 0;
const detectCategory = (product) => {
  const text = `${product.name} ${(product.keywords || []).join(" ")}`.toLowerCase();
  if (text.includes("women")) return "Women";
  if (text.includes("men")) return "Men";
  alternateToggle++;
  return alternateToggle % 2 === 0 ? "Men" : "Women";
};

// Map this API's subCategory + name into your store's subCategory.
const mapSubCategory = (product) => {
  const text = `${product.name} ${(product.keywords || []).join(" ")}`.toLowerCase();

  if (product.subCategory === "Men's Clothing" || product.subCategory === "Women's Clothing") {
    return "Topwear";
  }
  if (product.subCategory === "Footwear") {
    return "Footwear";
  }
  if (product.subCategory === "Accessories") {
    if (text.includes("sunglasses")) return "Eyewear";
    if (text.includes("bag") || text.includes("handbag") || text.includes("tote")) {
      return "Handbag";
    }
  }
  return null; // not a subCategory we track (skip it)
};

const fetchProducts = async () => {
  const response = await fetch(SOURCE_URL);
  const data = await response.json();
  return data || [];
};

const seed = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`);
    console.log("DB Connected");

    console.log("Fetching products from Free-Ecommerce-Products-Api...");
    const allProducts = await fetchProducts();

    // Only take Fashion & Apparel items that map to a subCategory we track.
    const fashionProducts = allProducts.filter(
      (p) => p.category === "Fashion & Apparel" && mapSubCategory(p)
    );

    if (!fashionProducts.length) {
      console.log("No matching fashion products found - check your internet connection.");
      process.exit(1);
    }

    let baseDate = Date.now();

    const docs = fashionProducts.map((p, index) => {
      const subCategory = mapSubCategory(p);
      const isHandbag = subCategory === "Handbag";

      return {
        name: p.name,
        description: p.description,
        price: Math.round((p.priceCents / 100) * 80), // convert cents -> Rs., scaled up
        image: [p.image],
        category: isHandbag ? "Women" : detectCategory(p),
        subCategory,
        sizes: subCategory === "Eyewear" || subCategory === "Handbag" ? ["One Size"] : ["S", "M", "L", "XL", "XXL"],
        quantity: 20 + Math.floor(Math.random() * 30),
        bestseller: index < 2,
        date: baseDate++,
      };
    });

    await productModel.insertMany(docs);
    console.log(`\nInserted ${docs.length} products from Free-Ecommerce-Products-Api.`);

    const bySubCategory = docs.reduce((acc, d) => {
      acc[d.subCategory] = (acc[d.subCategory] || 0) + 1;
      return acc;
    }, {});
    console.log("Breakdown by subCategory:", bySubCategory);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();