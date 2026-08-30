import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import Reviews from "../components/Reviews";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, backendUrl, navigate } =
    useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [ratingSummary, setRatingSummary] = useState({
    averageRating: 0,
    totalCount: 0,
  });

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id == productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };
  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  useEffect(() => {
    const fetchRatingSummary = async () => {
      try {
        const response = await axios.post(`${backendUrl}/api/review/list`, {
          productId,
        });
        if (response.data.success) {
          setRatingSummary(response.data.summary);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (productId) {
      fetchRatingSummary();
    }
  }, [productId, activeTab]);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Product image */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>
        {/* -------Product information */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <img
                key={star}
                src={
                  star <= Math.round(ratingSummary.averageRating)
                    ? assets.star_icon
                    : assets.star_dull_icon
                }
                alt=""
                className="w-3.5"
              />
            ))}
            <p
              className="pl-2 cursor-pointer hover:underline"
              onClick={() => setActiveTab("reviews")}
            >
              ({ratingSummary.totalCount})
            </p>
          </div>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>

          {/* Quantity Available */}
          <p className="mt-2 text-sm font-medium">
            Quantity Available:{" "}
            <span
              className={
                productData.quantity > 0 ? "text-green-600" : "text-red-600"
              }
            >
              {productData.quantity > 0
                ? `${productData.quantity} in stock`
                : "Out of stock"}
            </span>
          </p>

          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${
                    item === size ? "border-orange-500" : ""
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {/* Quantity Selector */}
          <div className="flex flex-col gap-2 my-4">
            <p>Select Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
                className="border px-3 py-1"
              >
                -
              </button>
              <span className="px-3">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((prev) =>
                    prev < productData.quantity ? prev + 1 : prev
                  )
                }
                className="border px-3 py-1"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {productData.quantity} available in stock
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const stock = Number(productData.quantity) || 0;

                if (stock <= 0) {
                  toast.error("This product is out of stock");
                  return;
                }

                if (!size) {
                  toast.error("Please select a size before adding to cart");
                  return;
                }

                addToCart(productData._id, size, quantity);
                toast.success("Product added to cart!");
              }}
              className={`px-8 py-3 text-sm rounded ${
                productData.quantity <= 0
                  ? "bg-gray-400 text-gray-700"
                  : "bg-black text-white active:bg-gray-700"
              }`}
            >
              {productData.quantity <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
            </button>

            <button
              onClick={() => {
                const stock = Number(productData.quantity) || 0;

                if (stock <= 0) {
                  toast.error("This product is out of stock");
                  return;
                }

                if (!size) {
                  toast.error("Please select a size before buying");
                  return;
                }

                // Skip the cart entirely - go straight to checkout with
                // just this one item, leaving the existing cart untouched.
                const buyNowData = {
                  ...productData,
                  size,
                  quantity,
                };

                // Persist to sessionStorage too, so a page refresh on the
                // checkout page doesn't lose this (router state alone
                // does not survive a hard refresh).
                sessionStorage.setItem(
                  "buyNowItem",
                  JSON.stringify(buyNowData)
                );

                navigate("/place-order", {
                  state: { buyNowItem: buyNowData },
                });
              }}
              disabled={productData.quantity <= 0}
              className={`px-8 py-3 text-sm rounded border ${
                productData.quantity <= 0
                  ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-black border-black hover:bg-black hover:text-white transition"
              }`}
            >
              BUY NOW
            </button>
          </div>

          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>
      <div className="mt-20">
        <div className="flex">
          <b
            onClick={() => setActiveTab("description")}
            className={`border px-5 py-3 text-sm cursor-pointer ${
              activeTab === "description" ? "" : "font-normal text-gray-500"
            }`}
          >
            Description
          </b>
          <p
            onClick={() => setActiveTab("reviews")}
            className="border px-5 py-3 text-sm cursor-pointer"
            style={
              activeTab === "reviews"
                ? { fontWeight: 500, color: "black" }
                : {}
            }
          >
            Reviews
          </p>
        </div>
        {activeTab === "description" ? (
          <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
            <p>
              An Ecommerce website is an online platform that facilitates the
              buying and selling of products or services over the internet.
              It serves as a virtual marketplace where businesses and
              individuals can showcase their products, interact with
              customers, and conduct transactions without the need for a
              physical presence. E-commerce websites have gained immense
              popularity due to their convenience, accessibility, and the
              global reach they offer.
            </p>
            <p>
              E-commerce websites typically display products or services
              along with detailed descriptions, images, prices, and any
              available variations (e.g. sizes, colors). Each product
              usually has its own dedicated page with relevant information.
            </p>
          </div>
        ) : (
          <Reviews productId={productData._id} />
        )}
      </div>
      <RelatedProducts
        currentProduct={productData} // the product currently being viewed
      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;