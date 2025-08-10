import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);

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
            <img src={assets.star_icon} alt="" className="w-3.5" />
            <img src={assets.star_icon} alt="" className="w-3.5" />
            <img src={assets.star_icon} alt="" className="w-3.5" />
            <img src={assets.star_icon} alt="" className="w-3.5" />
            <img src={assets.star_dull_icon} alt="" className="w-3.5" />
            <p className="pl-2">(122)</p>
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

          <button
            disabled={
              productData.quantity <= 0 ||
              quantity > productData.quantity ||
              !size
            }
            onClick={() => {
              addToCart(productData._id, size, quantity);
              toast.success("Product added to cart!");
            }}
            className={`px-8 py-3 text-sm rounded ${
              productData.quantity <= 0 ||
              quantity > productData.quantity ||
              !size
                ? "bg-gray-400 cursor-not-allowed text-gray-700"
                : "bg-black text-white active:bg-gray-700"
            }`}
          >
            {productData.quantity <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
          </button>
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
          <b className="border px-5 py-3 text-sm">Description</b>
          <p className="border px-5 py-3 text-sm">Reviews</p>
        </div>
        <div className="flex flex-col gap-4 border px-6 py-6 texxt-sm text-gray-500">
          <p>
            An Ecommerce website is an onlinne platform that facilitates the
            buying and selling of products or services over the internet. It
            services as a vritual marketplace where business and individuals can
            showcase their products interact with customers and conduct
            transactions without the need for a physical presemce. E-commerce
            websites have gained immense popularity due to their convenience
            accessibility and the global reach they offer.
          </p>
          <p>
            E-commerce website typically display product or services along with
            detailed description, images, prices, and any available
            variations(eg. Sizes colors ). Each product usually has its own
            dedicated ppage with relavalent information
          </p>
        </div>
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
