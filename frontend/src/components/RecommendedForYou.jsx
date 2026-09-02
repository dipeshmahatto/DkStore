/* eslint-disable react/prop-types */

import {
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  ShopContext,
} from "../context/ShopContext";

import Title from "./Title";
import ProductItem from "./ProductItem";

const RecommendedForYou = ({
  compact = false,
  refreshKey = "",
}) => {
  const {
    backendUrl,
    token,
  } = useContext(ShopContext);

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);

  const [source, setSource] = useState("popular");

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const limit = compact ? 4 : 10;

        const response = await axios.get(
          `${backendUrl}/api/recommendation/personalized?limit=${limit}`,
          {
            headers: token
              ? { token }
              : {},
          }
        );

        if (response.data.success) {
          setRecommendations(
            response.data.products || []
          );

          setSource(
            response.data.source || "popular"
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (backendUrl) {
      loadRecommendations();
    }
  }, [
    backendUrl,
    token,
    compact,
    refreshKey,
  ]);

  if (!recommendations.length) {
    return null;
  }

  if (compact) {
    return (
      <aside className="w-full xl:w-[280px] xl:flex-shrink-0 xl:border-l xl:pl-6">
        <div className="mb-5">
          <h2 className="text-lg font-medium uppercase">
            {source === "content-based"
              ? "Recommended For You"
              : "Popular Products"}
          </h2>

          <div className="w-12 h-[2px] bg-gray-700 mt-2"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {recommendations.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title
          text1={
            source === "content-based"
              ? "RECOMMENDED"
              : "POPULAR"
          }
          text2={
            source === "content-based"
              ? "FOR YOU"
              : "PRODUCTS"
          }
        />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          {source === "content-based"
            ? "Selected from the product features you view, add to cart, and purchase."
            : "Popular choices to help you start discovering products."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {recommendations.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            name={item.name}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendedForYou;