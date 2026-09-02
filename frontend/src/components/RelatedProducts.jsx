/* eslint-disable react/prop-types */

import { useContext, useEffect, useState } from "react";

import axios from "axios";

import { ShopContext } from "../context/ShopContext";

import Title from "./Title";
import ProductItem from "./ProductItem";

const RelatedProducts = ({ currentProduct }) => {
  const { backendUrl } = useContext(ShopContext);

  const [related, setRelated] = useState([]);

  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/recommendation/similar/${currentProduct._id}?limit=5`,
        );

        if (response.data.success) {
          setRelated(response.data.products || []);
        }
      } catch (error) {
        console.log(error);
        setRelated([]);
      }
    };

    if (backendUrl && currentProduct?._id) {
      loadSimilarProducts();
    }
  }, [backendUrl, currentProduct?._id]);

  if (!related.length) {
    return null;
  }

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1="RELATED" text2="PRODUCTS" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {related.map((item) => (
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

export default RelatedProducts;
