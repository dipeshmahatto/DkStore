import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import PaymentResult from "./pages/PaymentResult";
import Orders from "./pages/Orders";
import Invoice from "./pages/Invoice";
import Profile from "./pages/Profile";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ToastContainer />

      <Navbar />
      <SearchBar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/collection" element={<Collection />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/product/:productId" element={<Product />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/login" element={<Login />} />

        <Route path="/place-order" element={<PlaceOrder />} />

        <Route
          path="/payment/esewa/success"
          element={<PaymentResult provider="esewa" />}
        />

        <Route
          path="/payment/esewa/failure"
          element={<PaymentResult provider="esewa" failed />}
        />

        <Route
          path="/payment/khalti/callback"
          element={<PaymentResult provider="khalti" />}
        />

        <Route path="/profile" element={<Profile />} />

        <Route path="/orders" element={<Orders />} />

        <Route path="/invoice/:orderId" element={<Invoice />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
