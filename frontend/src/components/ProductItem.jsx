/* eslint-disable react/prop-types */

import { useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { ShopContext } from "../context/ShopContext";

const ProductItem = ({ id, image, name, price }) => {
  const { currency, backendUrl, token } = useContext(ShopContext);

  const recordProductView = () => {
    if (!token) {
      return;
    }

    axios
      .post(
        `${backendUrl}/api/recommendation/track`,
        {
          productId: id,
          type: "view",
        },
        {
          headers: {
            token,
          },
        },
      )
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Link
      className="text-gray-700 cursor-pointer"
      to={`/product/${id}`}
      onClick={recordProductView}
    >
      <div className="overflow-hidden">
        <img
          className="hover:scale-110 transition ease-in-out"
          src={image[0]}
          alt={name}
        />
      </div>

      <p className="pt-3 pb-1 text-sm">{name}</p>

      <p className="text-sm font-medium">
        {currency}
        {price}
      </p>
    </Link>
  );
};

export default ProductItem;
