/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const PaymentResult = ({ provider, failed = false }) => {
  const location = useLocation();
  const started = useRef(false);
  const { backendUrl, token, navigate, setCartItems } =
    useContext(ShopContext);

  const [result, setResult] = useState({
    status: failed ? "failed" : "verifying",
    message: failed
      ? "The payment was cancelled or could not be completed."
      : "Please wait while DK Store verifies your payment.",
    transactionId: "",
  });

  useEffect(() => {
    if (failed || !token || started.current) return;

    started.current = true;

    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        let endpoint = "";
        let body = {};

        if (provider === "esewa") {
          endpoint = `${backendUrl}/api/order/esewa/verify`;
          body = { data: params.get("data") };
        } else {
          endpoint = `${backendUrl}/api/order/khalti/verify`;
          body = {
            pidx: params.get("pidx"),
            orderId: params.get("purchase_order_id"),
          };
        }

        const response = await axios.post(endpoint, body, {
          headers: { token },
        });

        if (!response.data.success) {
          setResult({
            status: "failed",
            message: response.data.message || "Payment verification failed.",
            transactionId: "",
          });
          return;
        }

        if (response.data.isBuyNow) {
          sessionStorage.removeItem("buyNowItem");
        } else {
          setCartItems({});
        }

        setResult({
          status: "success",
          message: response.data.message,
          transactionId: response.data.transactionId,
        });
      } catch (error) {
        console.log(error);
        setResult({
          status: "failed",
          message:
            error.response?.data?.message ||
            "The payment could not be verified. Please try again.",
          transactionId: "",
        });
      }
    };

    verifyPayment();
  }, [
    backendUrl,
    failed,
    location.search,
    provider,
    setCartItems,
    token,
  ]);

  const providerName = provider === "esewa" ? "eSewa" : "Khalti";
  const isVerifying = result.status === "verifying";
  const isSuccess = result.status === "success";

  return (
    <div className="border-t min-h-[70vh] flex items-center justify-center py-14">
      <div className="w-full max-w-md rounded-2xl border bg-white p-7 sm:p-10 text-center shadow-lg">
        {isVerifying && (
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        )}

        {!isVerifying && (
          <div
            className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full text-3xl text-white ${
              isSuccess ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {isSuccess ? "✓" : "×"}
          </div>
        )}

        <h1 className="text-2xl font-semibold">
          {isVerifying
            ? `Verifying ${providerName} Payment`
            : isSuccess
              ? "Payment Successful"
              : "Payment Not Completed"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          {result.message}
        </p>

        {result.transactionId && (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Transaction ID: <strong>{result.transactionId}</strong>
          </div>
        )}

        {!isVerifying && (
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="flex-1 rounded-md bg-black px-5 py-3 text-sm text-white"
            >
              MY ORDERS
            </button>

            {!isSuccess && (
              <button
                type="button"
                onClick={() => navigate("/place-order")}
                className="flex-1 rounded-md border border-black px-5 py-3 text-sm"
              >
                TRY AGAIN
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
