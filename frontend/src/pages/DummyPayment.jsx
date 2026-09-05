import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const readPendingPayment = (locationState) => {
  if (
    locationState?.method &&
    locationState?.orderData
  ) {
    return locationState;
  }

  try {
    const saved = sessionStorage.getItem(
      "pendingDummyPayment"
    );

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const DummyPayment = () => {
  const location = useLocation();

  const {
    backendUrl,
    token,
    navigate,
    setCartItems,
    currency,
  } = useContext(ShopContext);

  const pendingPayment = useMemo(
    () => readPendingPayment(location.state),
    [location.state]
  );

  const [step, setStep] = useState(1);

  const [mobile, setMobile] = useState(
    pendingPayment?.orderData?.address?.phone || ""
  );

  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [processing, setProcessing] = useState(false);

  const isKhalti =
    pendingPayment?.method === "khalti";

  const providerName = isKhalti
    ? "Khalti"
    : "eSewa";

  const providerLogo = isKhalti
    ? assets.khalti_logo
    : assets.esewa_logo;

  const providerColor = isKhalti
    ? "#5c2d91"
    : "#60bb46";

  useEffect(() => {
    if (!pendingPayment) {
      toast.error("No pending payment was found");

      navigate("/place-order", {
        replace: true,
      });
    }
  }, [pendingPayment, navigate]);

  if (!pendingPayment) return null;

  const continueToOtp = (event) => {
    event.preventDefault();

    if (!/^(97|98)\d{8}$/.test(mobile)) {
      toast.error(
        "Enter a valid Nepal mobile number starting with 97 or 98"
      );

      return;
    }

    if (
      isKhalti &&
      !/^\d{4,6}$/.test(secret)
    ) {
      toast.error(
        "Enter any 4 to 6 digit demo Khalti PIN"
      );

      return;
    }

    if (!isKhalti && secret.length < 4) {
      toast.error(
        "Enter any demo eSewa password with at least 4 characters"
      );

      return;
    }

    setStep(2);
  };

  const confirmPayment = async (event) => {
    event.preventDefault();

    if (otp !== "123456") {
      toast.error(
        "Incorrect demo OTP. Use 123456"
      );

      return;
    }

    try {
      setProcessing(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const response = await axios.post(
        `${backendUrl}/api/order/${pendingPayment.method}`,
        {
          ...pendingPayment.orderData,
          dummyPayment: {
            mobile,
            secret,
            otp,
          },
        },
        {
          headers: { token },
        }
      );

      if (!response.data.success) {
        toast.error(response.data.message);
        return;
      }

      if (pendingPayment.isBuyNow) {
        sessionStorage.removeItem("buyNowItem");
      } else {
        setCartItems({});
      }

      sessionStorage.removeItem(
        "pendingDummyPayment"
      );

      toast.success(
        `Payment successful. Transaction: ${response.data.transactionId}`
      );

      navigate("/orders", {
        replace: true,
      });
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || error.message
      );
    } finally {
      setProcessing(false);
    }
  };

  const cancelPayment = () => {
    sessionStorage.removeItem(
      "pendingDummyPayment"
    );

    navigate("/place-order", {
      replace: true,
      state: {
        savedFormData:
          pendingPayment.orderData.address,
        savedMethod: pendingPayment.method,
      },
    });
  };

  return (
    <div className="border-t min-h-[78vh] py-10 flex items-center justify-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl">
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            backgroundColor: providerColor,
          }}
        >
          <div className="bg-white rounded-lg px-4 py-2">
            <img
              src={providerLogo}
              alt={providerName}
              className="h-8 max-w-28 object-contain"
            />
          </div>

          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
            DEMO PAYMENT
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Simulation only. Do not enter your real{" "}
            {providerName} password or PIN.
          </div>

          <div className="mb-7 flex items-center justify-between border-b pb-5">
            <div>
              <p className="text-xs text-gray-500">
                Paying to
              </p>

              <p className="font-semibold">
                DK Store
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">
                Total amount
              </p>

              <p
                className="text-xl font-semibold"
                style={{
                  color: providerColor,
                }}
              >
                {currency}
                {Number(
                  pendingPayment.displayAmount
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full text-white grid place-items-center text-sm font-semibold"
              style={{
                backgroundColor: providerColor,
              }}
            >
              {step > 1 ? "✓" : "1"}
            </div>

            <div className="h-[2px] flex-1 bg-gray-200"></div>

            <div
              className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold ${
                step === 2
                  ? "text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
              style={
                step === 2
                  ? {
                      backgroundColor:
                        providerColor,
                    }
                  : {}
              }
            >
              2
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={continueToOtp}>
              <h1 className="text-xl font-semibold mb-1">
                {providerName} Login
              </h1>

              <p className="text-sm text-gray-500 mb-6">
                Enter dummy account details to
                continue.
              </p>

              <label
                className="block text-sm font-medium mb-2"
                htmlFor="paymentMobile"
              >
                Mobile number
              </label>

              <input
                id="paymentMobile"
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={(event) =>
                  setMobile(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="98XXXXXXXX"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 mb-4"
                required
              />

              <label
                className="block text-sm font-medium mb-2"
                htmlFor="paymentSecret"
              >
                {isKhalti
                  ? "Demo MPIN"
                  : "Demo password"}
              </label>

              <input
                id="paymentSecret"
                type="password"
                inputMode={
                  isKhalti ? "numeric" : "text"
                }
                value={secret}
                onChange={(event) =>
                  setSecret(event.target.value)
                }
                placeholder={
                  isKhalti
                    ? "Any 4 to 6 digits"
                    : "Any 4+ characters"
                }
                maxLength={isKhalti ? 6 : 30}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                required
              />

              <button
                type="submit"
                className="mt-6 w-full rounded-lg py-3 font-medium text-white"
                style={{
                  backgroundColor: providerColor,
                }}
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={confirmPayment}>
              <h1 className="text-xl font-semibold mb-1">
                Confirm Payment
              </h1>

              <p className="text-sm text-gray-500 mb-5">
                Enter the demonstration OTP shown
                below.
              </p>

              <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
                <p className="text-xs text-blue-700">
                  Your demo OTP is
                </p>

                <p className="text-2xl font-bold tracking-[0.35em] text-blue-900">
                  123456
                </p>
              </div>

              <label
                className="block text-sm font-medium mb-2"
                htmlFor="paymentOtp"
              >
                OTP code
              </label>

              <input
                id="paymentOtp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 123456"
                maxLength={6}
                className="w-full rounded-lg border px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:ring-2"
                required
                autoFocus
              />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={processing}
                  className="flex-1 rounded-lg border py-3 font-medium"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex-[1.7] rounded-lg py-3 font-medium text-white disabled:opacity-60"
                  style={{
                    backgroundColor: providerColor,
                  }}
                >
                  {processing
                    ? "Processing..."
                    : `Pay ${currency}${Number(
                        pendingPayment.displayAmount
                      ).toFixed(2)}`}
                </button>
              </div>
            </form>
          )}

          <button
            type="button"
            onClick={cancelPayment}
            disabled={processing}
            className="mt-5 w-full text-sm text-gray-500 hover:text-black"
          >
            Cancel payment and return to checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DummyPayment;