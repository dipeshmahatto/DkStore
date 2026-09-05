import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import axios from "axios";

import {
  ShopContext,
} from "../context/ShopContext";

const Invoice = () => {
  const { orderId } = useParams();

  const {
    backendUrl,
    token,
    currency,
    navigate,
  } = useContext(ShopContext);

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadInvoice = async () => {
      if (!token) return;

      try {
        setLoading(true);

        const response = await axios.get(
          `${backendUrl}/api/order/${orderId}`,
          {
            headers: {
              token,
            },
          }
        );

        if (!response.data.success) {
          setError(
            response.data.message
          );

          return;
        }

        setOrder(
          response.data.order
        );
      } catch (requestError) {
        console.log(requestError);

        setError(
          requestError.response?.data
            ?.message ||
            "Invoice could not be loaded"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [
    backendUrl,
    orderId,
    token,
  ]);

  const subtotal = useMemo(() => {
    if (!order) return 0;

    return order.items.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          Number(item.quantity),
      0
    );
  }, [order]);

  if (loading) {
    return (
      <div className="border-t min-h-[60vh] grid place-items-center">
        <p className="text-gray-500">
          Loading invoice...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="border-t min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <p className="text-red-600">
            {error ||
              "Invoice not found"}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/orders")
            }
            className="mt-5 rounded bg-black px-6 py-3 text-sm text-white"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const deliveryFee = Math.max(
    0,
    Number(order.amount) - subtotal
  );

  const invoiceNumber =
    `DK-${String(order._id)
      .slice(-8)
      .toUpperCase()}`;

  const paymentLabel =
    order.payment
      ? "Paid"
      : "Cash on Delivery";

  return (
    <div className="border-t py-10 sm:py-14">
      <div className="no-print mx-auto mb-5 flex max-w-4xl justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            navigate("/orders")
          }
          className="rounded border border-gray-300 px-5 py-2.5 text-sm"
        >
          Back to Orders
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="rounded bg-black px-7 py-2.5 text-sm text-white"
        >
          Print Invoice
        </button>
      </div>

      <section
        id="printable-invoice"
        className="mx-auto max-w-4xl border bg-white p-6 text-gray-800 shadow-sm sm:p-10"
      >
        <header className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-black">
              DK STORE
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Order Invoice
            </p>
          </div>

          <div className="text-sm sm:text-right">
            <p className="text-lg font-semibold text-black">
              INVOICE
            </p>

            <p className="mt-1">
              Invoice:{" "}
              {invoiceNumber}
            </p>

            <p>
              Order ID: {order._id}
            </p>

            <p>
              Date:{" "}
              {new Date(
                order.date
              ).toLocaleString()}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b py-7 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Delivery Details
            </h2>

            <p className="font-semibold text-black">
              {order.address.Name}
            </p>

            <p className="mt-1">
              {order.address.phone}
            </p>

            <p>
              {order.address.street}
            </p>

            <p>
              {order.address.city}
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Payment Details
            </h2>

            <p>
              Method:{" "}
              <strong>
                {order.paymentMethod}
              </strong>
            </p>

            <p>
              Payment:{" "}
              <strong>
                {paymentLabel}
              </strong>
            </p>

            <p>
              Order status:{" "}
              <strong>
                {order.status}
              </strong>
            </p>

            {order.paymentMode ===
              "SANDBOX" && (
              <p className="text-gray-500">
                Environment: Sandbox
              </p>
            )}

            {order.transactionId && (
              <p className="mt-1 break-all">
                Transaction ID:{" "}
                <strong>
                  {
                    order.transactionId
                  }
                </strong>
              </p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto py-7">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 pr-3">
                  Product
                </th>

                <th className="px-3 py-3">
                  Size
                </th>

                <th className="px-3 py-3 text-center">
                  Quantity
                </th>

                <th className="px-3 py-3 text-right">
                  Unit Price
                </th>

                <th className="py-3 pl-3 text-right">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {order.items.map(
                (item, index) => (
                  <tr
                    key={`${item._id}-${item.size}-${index}`}
                    className="border-b"
                  >
                    <td className="py-4 pr-3 font-medium text-black">
                      {item.name}
                    </td>

                    <td className="px-3 py-4">
                      {item.size}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.quantity}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {currency}
                      {Number(
                        item.price
                      ).toFixed(2)}
                    </td>

                    <td className="py-4 pl-3 text-right">
                      {currency}
                      {(
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity
                        )
                      ).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-sm border-t pt-4 text-sm">
          <div className="flex justify-between py-1.5">
            <span>
              Subtotal
            </span>

            <span>
              {currency}
              {subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span>
              Delivery charge
            </span>

            <span>
              {currency}
              {deliveryFee.toFixed(2)}
            </span>
          </div>

          <div className="mt-2 flex justify-between border-t-2 border-black py-3 text-lg font-bold text-black">
            <span>
              Grand Total
            </span>

            <span>
              {currency}
              {Number(
                order.amount
              ).toFixed(2)}
            </span>
          </div>
        </div>

        <footer className="mt-10 border-t pt-5 text-center text-xs text-gray-500">
          <p>
            Thank you for shopping
            with DK Store.
          </p>

          <p className="mt-1">
            This invoice was generated
            electronically and does not
            require a signature.
          </p>
        </footer>
      </section>
    </div>
  );
};

export default Invoice;