import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const AUTO_ROTATE_MS = 4000;

const Hero = () => {
  const { products, currency } = useContext(ShopContext);
  const [current, setCurrent] = useState(0);

  // Prefer real bestsellers; if there aren't enough, fill in with the
  // most recently added products so the hero always has something to show.
  const slides = useMemo(() => {
    if (!products?.length) return [];

    const bestsellers = products.filter((p) => p.bestseller);
    const latest = [...products].sort((a, b) => b.date - a.date);

    const combined = [...bestsellers];
    for (const product of latest) {
      if (combined.length >= 5) break;
      if (!combined.find((p) => p._id === product._id)) {
        combined.push(product);
      }
    }

    return combined.slice(0, 5);
  }, [products]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Keep the index valid if the product list changes size
  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  if (!slides.length) {
    // Nothing to show yet (e.g. products still loading) - render nothing
    // rather than a fake placeholder banner.
    return null;
  }

  const goTo = (index) => setCurrent(index);
  const goPrev = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % slides.length);

  const active = slides[current];
  const label = active.bestseller ? "OUR BESTSELLERS" : "LATEST ARRIVAL";

  return (
    <div className="relative flex flex-col sm:flex-row border border-gray-400 h-[280px] sm:h-[320px] md:h-[380px]">
      {/* Left side - real product info */}
      <div className="w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center py-4 sm:py-0 px-4">
        <div className="text-[#414141]">
          <div className="flex items-center gap-2">
            <p className="w-6 md:w-8 h-[2px] bg-[#414141]"></p>
            <p className="font-medium text-xs md:text-sm">{label}</p>
          </div>
          <h1 className="text-xl prata-regular py-1.5 md:text-2xl lg:text-3xl leading-snug max-w-md">
            {active.name}
          </h1>
          <p className="text-sm md:text-base font-medium mb-1.5">
            {currency}
            {active.price}
          </p>
          <Link
            to={`/product/${active._id}`}
            className="flex items-center gap-2 w-fit"
          >
            <p className="font-semibold text-xs md:text-sm">SHOP NOW</p>
            <p className="w-6 md:w-8 h-[2px] bg-[#414141]"></p>
          </Link>
        </div>
      </div>

      {/* Right side - real product image, clickable */}
      <Link
        to={`/product/${active._id}`}
        className="w-full h-1/2 sm:w-1/2 sm:h-full overflow-hidden block"
      >
        <img
          className="w-full h-full object-cover"
          src={active.image[0]}
          alt={active.name}
        />
      </Link>

      {/* Prev / Next controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide._id}
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === current ? "bg-[#414141]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Hero;