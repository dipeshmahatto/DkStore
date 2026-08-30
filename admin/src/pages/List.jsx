import React, { useEffect, useState } from "react";
import { backendUrl, curreny } from "../App";
import { toast } from "react-toastify";
import axios from "axios";

// A star icon drawn inline (no extra asset file needed).
// Filled + gold when the product is marked as a bestseller, outline + grey otherwise.
const StarIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill={filled ? "#f5a623" : "none"}
    stroke={filled ? "#f5a623" : "#9ca3af"}
    strokeWidth="1.5"
  >
    <path
      d="M12 2l2.9 6.26 6.9.6-5.2 4.53 1.57 6.77L12 16.9l-6.17 3.26L7.4 13.4 2.2 8.86l6.9-.6L12 2z"
      strokeLinejoin="round"
    />
  </svg>
);

const List = ({ token }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/update-quantity",
        { id, quantity: Number(newQuantity) },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Quantity updated");
        setList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const updatePrice = async (id, newPrice) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/update-price",
        { id, price: Number(newPrice) },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Price updated");
        setList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, price: newPrice } : item
          )
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const toggleBestseller = async (id, currentValue) => {
    const newValue = !currentValue;

    // Optimistic update
    setList((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, bestseller: newValue } : item
      )
    );

    try {
      const response = await axios.post(
        backendUrl + "/api/product/update-bestseller",
        { id, bestseller: newValue },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(
          newValue ? "Marked as bestseller" : "Removed from bestsellers"
        );
      } else {
        toast.error(response.data.message);
        // Revert on failure
        setList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, bestseller: currentValue } : item
          )
        );
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      // Revert on failure
      setList((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, bestseller: currentValue } : item
        )
      );
    }
  };

  const updateSubCategory = async (id, newSubCategory) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/update-subcategory",
        { id, subCategory: newSubCategory },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Sub-category updated");
        setList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, subCategory: newSubCategory } : item
          )
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const updateCategory = async (id, newCategory) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/update-category",
        { id, category: newCategory },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Category updated");
        setList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, category: newCategory } : item
          )
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <p className="mb-2">All Product List</p>
      <div className="flex flex-col gap-2">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[0.4fr_1fr_3fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b className="text-center">S.No.</b>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Sub Category</b>
          <b>Price</b>
          <b>Quantity</b>
          <b className="text-center">Bestseller</b>
          <b className="text-center">Action</b>
        </div>

        {/* Table Rows */}
        {list.map((item, index) => (
          <div
            className="grid grid-cols-[0.4fr_1fr_3fr_1fr] md:grid-cols-[0.4fr_1fr_3fr_1fr_1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[0.4fr_1fr_3fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm"
            key={index}
          >
            <p className="text-center">{index + 1}</p>
            <img className="w-12" src={item.image[0]} alt="" />
            <p>{item.name}</p>

            {/* Editable Category */}
            <select
              value={item.category}
              onChange={(e) => updateCategory(item._id, e.target.value)}
              className="px-1 py-0.5 border text-sm"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>

            {/* Editable Sub Category */}
            <select
              value={item.subCategory}
              onChange={(e) => updateSubCategory(item._id, e.target.value)}
              className="px-1 py-0.5 border text-sm"
            >
              <option value="Topwear">Topwear</option>
              <option value="Bottomwear">Bottomwear</option>
              <option value="Winterwear">Winterwear</option>
              <option value="Footwear">Footwear</option>
              <option value="Eyewear">Eyewear</option>
              <option value="Handbag">Handbag</option>
            </select>

            {/* Editable Price */}
            <div className="flex items-center gap-1">
              <span>{curreny}</span>
              <input
                type="number"
                min="0"
                value={item.price}
                onChange={(e) =>
                  setList((prev) =>
                    prev.map((prod) =>
                      prod._id === item._id
                        ? { ...prod, price: e.target.value }
                        : prod
                    )
                  )
                }
                onBlur={(e) => updatePrice(item._id, e.target.value)}
                className="w-16 px-1 py-0.5 border text-center"
              />
            </div>

            {/* Editable Quantity */}
            <input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(e) =>
                setList((prev) =>
                  prev.map((prod) =>
                    prod._id === item._id
                      ? { ...prod, quantity: e.target.value }
                      : prod
                  )
                )
              }
              onBlur={(e) => updateQuantity(item._id, e.target.value)}
              className="w-16 px-1 py-0.5 border text-center"
            />

            {/* Editable Bestseller toggle */}
            <button
              type="button"
              onClick={() => toggleBestseller(item._id, item.bestseller)}
              className="flex justify-center items-center cursor-pointer"
              title={
                item.bestseller
                  ? "Remove from bestsellers"
                  : "Mark as bestseller"
              }
            >
              <StarIcon filled={!!item.bestseller} />
            </button>

            <p
              onClick={() => removeProduct(item._id)}
              className="text-right md:text-center sm:text-center cursor-pointer text-lg"
            >
              X
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default List;