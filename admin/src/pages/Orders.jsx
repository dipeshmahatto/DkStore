import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { backendUrl, curreny } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

// Forward-only pipeline - must mirror backend/controllers/orderController.js
const STATUS_PIPELINE = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
];
const CANCELLED = "Cancelled";

const pipelineIndex = (status) =>
  STATUS_PIPELINE.findIndex(
    (step) => step.toLowerCase() === String(status || "").toLowerCase()
  );

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }
    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusHandler = async (event, orderId, currentStatus) => {
    const newStatus = event.target.value;

    // Optimistically update the UI
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order status updated");
      } else {
        toast.error(response.data.message || "Failed to update status");
        // Revert to the ACTUAL previous status, not a no-op
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? { ...order, status: currentStatus }
              : order
          )
        );
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      // Revert to the ACTUAL previous status, not a no-op
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: currentStatus } : order
        )
      );
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {orders.map((order, index) => {
          const isCancelled =
            order.status?.toLowerCase() === CANCELLED.toLowerCase();
          const isDelivered = order.status?.toLowerCase() === "delivered";
          const isTerminal = isCancelled || isDelivered;
          const currentIndex = pipelineIndex(order.status);

          return (
            <div
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
              key={index}
            >
              <img className="w-12" src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return (
                        <p className="py-0.5" key={index}>
                          {" "}
                          {item.name} x {item.quantity}{" "}
                          <span> {item.size} </span>{" "}
                        </p>
                      );
                    } else {
                      return (
                        <p className="py-0.5" key={index}>
                          {" "}
                          {item.name} x {item.quantity}{" "}
                          <span> {item.size}, </span>{" "}
                        </p>
                      );
                    }
                  })}
                </div>
                <p className="mt-3 mb-2 font-medium">
                  {" "}
                  {order.address.Name}{" "}
                </p>
                <div>
                  <p> {order.address.street + ","} </p>
                  <p>
                    {" "}
                    {order.address.city +
                      ", " +
                      order.address.state +
                      ", " +
                      order.address.country +
                      ", " +
                      order.address.zipcode}{" "}
                  </p>
                </div>
                <p>{order.address.phone}</p>
              </div>
              <div>
                <p className="text-sm sm:text-[15px]">
                  Items : {order.items.length}{" "}
                </p>
                <p className="mt-3">Method : {order.paymentMethod} </p>
                <p>Payment : {order.payment ? "Done" : "Pending"} </p>
                <p>Date : {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm sm:text-[15px]">
                {curreny}
                {order.amount}
              </p>

              {isTerminal ? (
                // Terminal states (Cancelled / Delivered) can't be changed further
                <div>
                  <p
                    className={`font-medium ${
                      isCancelled ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {order.status}
                  </p>
                  {isCancelled && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      This order is cancelled and cannot be changed
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <select
                    onChange={(event) =>
                      statusHandler(event, order._id, order.status)
                    }
                    value={order.status}
                  >
                    {STATUS_PIPELINE.map((step, stepIndex) => (
                      <option
                        key={step}
                        value={step}
                        // Only allow the current status (no-op) or a
                        // strictly forward step - never backward
                        disabled={stepIndex < currentIndex}
                      >
                        {step}
                      </option>
                    ))}
                    <option value={CANCELLED}>Cancel Order</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
