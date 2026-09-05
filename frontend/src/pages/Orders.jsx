import {
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import OrderTracker from "../components/OrderTracker";

const Orders = () => {
  const { backendUrl, token, currency } =
    useContext(ShopContext);

  const [orderData, setOrderData] = useState([]);
  const [expandedKey, setExpandedKey] =
    useState(null);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!token) return;

      try {
        const response = await axios.post(
          `${backendUrl}/api/order/userorders`,
          {},
          {
            headers: { token },
          }
        );

        if (response.data.success) {
          const items =
            response.data.orders.flatMap((order) =>
              order.items.map((item, itemIndex) => ({
                ...item,
                orderKey: `${order._id}-${itemIndex}`,
                orderId: order._id,
                status: order.status,
                statusHistory:
                  order.statusHistory || [],
                payment: order.payment,
                paymentMethod:
                  order.paymentMethod,
                paymentMode: order.paymentMode,
                transactionId:
                  order.transactionId,
                paymentAccount:
                  order.paymentAccount,
                paidAt: order.paidAt,
                orderAmount: order.amount,
                date: order.date,
              }))
            );

          setOrderData(items);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadOrderData();
  }, [backendUrl, token]);

  return (
    <div className="border-t pt-16 min-h-[70vh]">
      <div className="text-2xl mb-6">
        <Title text1="MY" text2="ORDERS" />
      </div>

      {!orderData.length && (
        <div className="border rounded-lg py-16 text-center text-gray-500">
          You have not placed any orders yet.
        </div>
      )}

      <div className="space-y-4">
        {orderData.map((item) => {
          const cancelled =
            item.status?.toLowerCase() ===
            "cancelled";

          const expanded =
            expandedKey === item.orderKey;

          return (
            <div
              key={item.orderKey}
              className="border rounded-lg overflow-hidden"
            >
              <div className="p-4 text-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-start gap-5 text-sm">
                  <img
                    className="w-20 h-24 object-cover rounded"
                    src={item.image?.[0]}
                    alt={item.name}
                  />

                  <div>
                    <p className="sm:text-base font-medium text-black">
                      {item.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                      <p>
                        {currency}
                        {item.price}
                      </p>

                      <p>
                        Quantity: {item.quantity}
                      </p>

                      <p>Size: {item.size}</p>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Order ID: {item.orderId}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Ordered:{" "}
                      {new Date(
                        item.date
                      ).toLocaleString()}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.payment
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.payment
                          ? "Paid"
                          : "Pay on delivery"}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {item.paymentMethod}

                        {item.paymentMode ===
                        "SIMULATED"
                          ? " · Demo"
                          : ""}
                      </span>
                    </div>

                    {item.transactionId && (
                      <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                        <p>
                          <strong>
                            Transaction:
                          </strong>{" "}
                          {item.transactionId}
                        </p>

                        <p className="mt-1">
                          <strong>
                            Account:
                          </strong>{" "}
                          {item.paymentAccount}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:w-[42%] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        cancelled
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    ></span>

                    <p
                      className={`text-sm ${
                        cancelled
                          ? "text-red-600 font-medium"
                          : ""
                      }`}
                    >
                      {item.status}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKey(
                        expanded
                          ? null
                          : item.orderKey
                      )
                    }
                    className="border px-4 py-2 text-sm font-medium rounded hover:bg-gray-50 transition"
                  >
                    {expanded
                      ? "Hide Tracking"
                      : "Track Order"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t bg-gray-50/60 p-4 md:p-6">
                  <OrderTracker
                    status={item.status}
                    statusHistory={
                      item.statusHistory
                    }
                  />
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