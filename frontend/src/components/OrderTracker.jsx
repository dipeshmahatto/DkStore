import React from "react";

// The fixed sequence your admin panel moves orders through
// (see admin/src/pages/Orders.jsx status dropdown)
export const STATUS_STEPS = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

const CANCELLED = "Cancelled";

// A small checkmark icon drawn inline so no extra asset files are needed
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
    <path
      d="M5 13l4 4L19 7"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// A small X icon for the cancelled state, drawn inline
const CrossIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Visual step-by-step tracker for an order's current status, with a
 * timestamp shown under each stage that has already been reached.
 * If the order has been cancelled, shows a single clear cancellation
 * notice instead of the step pipeline (same message for every order).
 *
 * @param {String} status - the order's current status
 * @param {Array} statusHistory - [{ status, date }] log of every status change
 */
const OrderTracker = ({ status, statusHistory = [] }) => {
  const isCancelled = String(status || "").toLowerCase() === CANCELLED.toLowerCase();

  const currentIndex = STATUS_STEPS.findIndex(
    (step) => step.toLowerCase() === String(status || "").toLowerCase()
  );
  // If the status doesn't match any known step, default to the first step
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  // Look up when a given step was reached, if we have it in the history
  const getTimestamp = (step) => {
    const entry = statusHistory.find(
      (h) => h.status?.toLowerCase() === step.toLowerCase()
    );
    if (!entry) return null;
    const d = new Date(entry.date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (isCancelled) {
    const cancelledEntry = statusHistory.find(
      (h) => h.status?.toLowerCase() === CANCELLED.toLowerCase()
    );
    const cancelledDate = cancelledEntry
      ? `${new Date(cancelledEntry.date).toLocaleDateString()} ${new Date(
          cancelledEntry.date
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : null;

    return (
      <div className="w-full py-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-md px-4">
        <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
          <CrossIcon />
        </div>
        <div>
          <p className="text-red-700 font-medium text-sm">
            Your order has been cancelled.
          </p>
          {cancelledDate && (
            <p className="text-[11px] text-red-400 mt-0.5">
              Cancelled on {cancelledDate}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      {/* Desktop / tablet: horizontal stepper */}
      <div className="hidden sm:flex items-center">
        {STATUS_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isLast = index === STATUS_STEPS.length - 1;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isComplete
                      ? "bg-green-500 border-green-500"
                      : isCurrent
                      ? "bg-black border-black"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {isComplete ? (
                    <CheckIcon />
                  ) : (
                    <span
                      className={`text-[11px] font-medium ${
                        isCurrent ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1.5 text-[11px] text-center w-20 leading-tight ${
                    isCurrent
                      ? "text-black font-medium"
                      : isComplete
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </p>
                {(isComplete || isCurrent) && getTimestamp(step) && (
                  <p className="text-[10px] text-gray-400 w-20 text-center leading-tight">
                    {getTimestamp(step)}
                  </p>
                )}
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-5 ${
                    isComplete ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="flex sm:hidden flex-col">
        {STATUS_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isLast = index === STATUS_STEPS.length - 1;

          return (
            <div key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isComplete
                      ? "bg-green-500 border-green-500"
                      : isCurrent
                      ? "bg-black border-black"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {isComplete ? (
                    <CheckIcon />
                  ) : (
                    <span
                      className={`text-[10px] font-medium ${
                        isCurrent ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[18px] ${
                      isComplete ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={`text-xs ${
                    isCurrent
                      ? "text-black font-medium"
                      : isComplete
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </p>
                {(isComplete || isCurrent) && getTimestamp(step) && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {getTimestamp(step)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
