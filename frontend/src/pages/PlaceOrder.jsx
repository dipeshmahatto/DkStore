import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const emptyAddress = {
  Name: "",
  street: "",
  city: "",
  phone: "",
};

const submitEsewaForm = (paymentUrl, formData) => {
  const form = document.createElement("form");

  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = name;
    input.value = String(value);

    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const PlaceOrder = () => {
  const location = useLocation();

  const [method, setMethod] = useState(location.state?.savedMethod || "cod");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [buyNowItem] = useState(() => {
    if (location.state?.buyNowItem) {
      return location.state.buyNowItem;
    }

    try {
      const savedItem = sessionStorage.getItem("buyNowItem");

      return savedItem ? JSON.parse(savedItem) : null;
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState(
    location.state?.savedFormData || emptyAddress,
  );

  const { navigate, backendUrl, token, cartItems, setCartItems, products } =
    useContext(ShopContext);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const buildOrder = () => {
    const orderItems = [];

    if (buyNowItem) {
      orderItems.push(structuredClone(buyNowItem));
    } else {
      Object.keys(cartItems).forEach((productId) => {
        Object.keys(cartItems[productId]).forEach((selectedSize) => {
          const selectedQuantity = Number(cartItems[productId][selectedSize]);

          if (selectedQuantity < 1) return;

          const product = products.find((item) => item._id === productId);

          if (!product) return;

          orderItems.push({
            ...structuredClone(product),
            size: selectedSize,
            quantity: selectedQuantity,
          });
        });
      });
    }

    return {
      address: formData,
      items: orderItems,
      isBuyNow: Boolean(buyNowItem),
    };
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Please login before placing an order");

      navigate("/login");
      return;
    }

    const orderData = buildOrder();

    if (!orderData.items.length) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setIsSubmitting(true);

      if (method === "esewa") {
        const response = await axios.post(
          `${backendUrl}/api/order/esewa/initiate`,
          orderData,
          {
            headers: { token },
          },
        );

        if (!response.data.success) {
          toast.error(response.data.message);
          return;
        }

        submitEsewaForm(response.data.paymentUrl, response.data.formData);

        return;
      }

      if (method === "khalti") {
        const response = await axios.post(
          `${backendUrl}/api/order/khalti/initiate`,
          orderData,
          {
            headers: { token },
          },
        );

        if (!response.data.success) {
          toast.error(response.data.message);
          return;
        }

        window.location.assign(response.data.paymentUrl);

        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        orderData,
        {
          headers: { token },
        },
      );

      if (!response.data.success) {
        toast.error(response.data.message);
        return;
      }

      if (buyNowItem) {
        sessionStorage.removeItem("buyNowItem");
      } else {
        setCartItems({});
      }

      toast.success("Order placed successfully");

      navigate("/orders");
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || location.state?.savedFormData) {
        return;
      }

      try {
        const { data } = await axios.get(`${backendUrl}/api/user/profile`, {
          headers: { token },
        });

        if (data.success) {
          setFormData((previous) => ({
            ...previous,
            Name: data.profile.name || "",
            phone: data.profile.phone || "",
          }));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchProfile();
  }, [backendUrl, token, location.state?.savedFormData]);

  const inputClass =
    "border border-gray-300 rounded-md py-3 px-4 w-full outline-none focus:border-black transition";

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col lg:flex-row justify-between gap-10 pt-8 sm:pt-14 min-h-[80vh] border-t"
    >
      <div className="flex flex-col gap-4 w-full lg:max-w-[500px]">
        <div className="text-xl sm:text-2xl mb-2">
          <Title text1="DELIVERY" text2="INFORMATION" />
        </div>

        <input
          required
          name="Name"
          value={formData.Name}
          onChange={onChangeHandler}
          className={inputClass}
          type="text"
          placeholder="Full name"
          maxLength={70}
        />

        <input
          required
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          className={inputClass}
          type="tel"
          inputMode="numeric"
          pattern="(97|98)[0-9]{8}"
          placeholder="Phone number (97/98XXXXXXXX)"
          maxLength={10}
        />

        <input
          required
          name="city"
          value={formData.city}
          onChange={onChangeHandler}
          className={inputClass}
          type="text"
          placeholder="City / District"
          maxLength={50}
        />

        <textarea
          required
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          className={`${inputClass} min-h-28 resize-none`}
          placeholder="Detailed delivery address"
          maxLength={150}
        />
      </div>

      <div className="w-full lg:max-w-[520px]">
        <div className="min-w-0">
          {buyNowItem && (
            <div className="mb-5 flex items-center gap-3 border rounded-md p-3 text-sm">
              <img
                src={buyNowItem.image[0]}
                alt={buyNowItem.name}
                className="w-16 h-16 object-cover rounded"
              />

              <div>
                <p className="font-medium">{buyNowItem.name}</p>

                <p className="text-gray-500 mt-1">
                  Size: {buyNowItem.size} · Quantity: {buyNowItem.quantity}
                </p>
              </div>
            </div>
          )}

          <CartTotal
            overrideSubtotal={
              buyNowItem
                ? Number(buyNowItem.price) * Number(buyNowItem.quantity)
                : undefined
            }
          />
        </div>

        <div className="mt-12">
          <div className="mb-5">
            <Title text1="PAYMENT" text2="METHOD" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMethod("khalti")}
              className={`min-h-16 flex items-center justify-center gap-3 border rounded-md p-3 transition ${
                method === "khalti"
                  ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600"
                  : "border-gray-300 hover:border-gray-500"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "khalti" ? "bg-purple-600" : ""
                }`}
              ></span>

              <img
                className="h-7 max-w-20 object-contain"
                src={assets.khalti_logo}
                alt="Khalti"
              />
            </button>

            <button
              type="button"
              onClick={() => setMethod("esewa")}
              className={`min-h-16 flex items-center justify-center gap-3 border rounded-md p-3 transition ${
                method === "esewa"
                  ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                  : "border-gray-300 hover:border-gray-500"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "esewa" ? "bg-green-600" : ""
                }`}
              ></span>

              <img
                className="h-7 max-w-20 object-contain"
                src={assets.esewa_logo}
                alt="eSewa"
              />
            </button>

            <button
              type="button"
              onClick={() => setMethod("cod")}
              className={`min-h-16 flex items-center justify-center gap-2 border rounded-md p-3 transition ${
                method === "cod"
                  ? "border-black bg-gray-50 ring-1 ring-black"
                  : "border-gray-300 hover:border-gray-500"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-black" : ""
                }`}
              ></span>

              <span className="text-xs font-medium">CASH ON DELIVERY</span>
            </button>
          </div>

          {/* {(method === "khalti" || method === "esewa") && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              You will be redirected to the official{" "}
              {method === "esewa" ? "eSewa UAT" : "Khalti sandbox"} checkout.
              Only test money is used.
            </div>
          )} */}

          <div className="w-full text-right mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white px-10 sm:px-16 py-3 text-sm rounded disabled:opacity-50"
            >
              {isSubmitting
                ? "CONNECTING..."
                : method === "cod"
                  ? "PLACE ORDER"
                  : `PAY WITH ${method.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
