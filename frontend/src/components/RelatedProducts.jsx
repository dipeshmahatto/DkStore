import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Tiltle from "../components/Title";
import ProductItem from "../components/ProductItem";

const RelatedProducts = ({ currentProduct }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  // Create tags from product name + category
  const generateTags = (product) => {
    if (!product) return [];
    const nameWords = product.name?.toLowerCase().split(" ") || [];
    const categoryTags = [
      product.category?.toLowerCase(),
      product.subCategory?.toLowerCase(),
    ];
    const tags = [...nameWords, ...categoryTags];
    return Array.from(new Set(tags.filter(Boolean)));
  };

  // Tag similarity score
  const getTagMatchScore = (tags1, tags2) => {
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    return [...set1].filter((tag) => set2.has(tag)).length;
  };

  useEffect(() => {
    if (!products?.length || !currentProduct) return;

    const currentTags = generateTags(currentProduct);

    // Filter products based on matching category/subcategory and tag similarity
    const matches = products
      .filter((item) => item._id !== currentProduct._id) 
      .map((item) => {
        const tags = generateTags(item);
        const tagScore = getTagMatchScore(currentTags, tags);
        return { product: item, score: tagScore };
      })
      .filter((entry) => entry.score > 0) 
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) 
      .map((entry) => entry.product);

    setRelated(matches);
  }, [products, currentProduct]);

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Tiltle text1={"RELATED"} text2={"PRODUCTS"} />
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
