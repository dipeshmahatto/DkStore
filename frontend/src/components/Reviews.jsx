import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

// Renders `count` stars, filled up to `rating` (rounded)
const StarRow = ({ rating, size = "w-3.5" }) => {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <img
          key={star}
          src={star <= rounded ? assets.star_icon : assets.star_dull_icon}
          alt=""
          className={size}
        />
      ))}
    </div>
  );
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High (4-5)" },
  { key: "medium", label: "Medium (3)" },
  { key: "low", label: "Low (1-2)" },
];

const Reviews = ({ productId }) => {
  const { backendUrl, token } = useContext(ShopContext);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    averageRating: 0,
    bandCounts: { low: 0, medium: 0, high: 0 },
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async (filter) => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/review/list`, {
        productId,
        filter: filter === "all" ? undefined : filter,
      });
      if (response.data.success) {
        setReviews(response.data.reviews);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(activeFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, activeFilter]);

  const handleSubmitReview = async () => {
    if (!token) {
      toast.error("Please log in to write a review");
      return;
    }
    if (!newRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/review/add`,
        { productId, rating: newRating, comment: newComment },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Review submitted!");
        setNewRating(0);
        setNewComment("");
        setShowForm(false);
        fetchReviews(activeFilter);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const bandTotal =
    summary.bandCounts.low + summary.bandCounts.medium + summary.bandCounts.high;

  return (
    <div className="flex flex-col gap-6 border px-6 py-6 text-sm text-gray-600">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <StarRow rating={summary.averageRating} size="w-4" />
          <span className="font-medium text-gray-800">
            {summary.averageRating || 0} out of 5
          </span>
        </div>
        <p className="text-gray-500">
          {summary.totalCount} {summary.totalCount === 1 ? "review" : "reviews"}
        </p>
      </div>

      {/* Rating breakdown bar */}
      {bandTotal > 0 && (
        <div className="flex flex-col gap-1 max-w-md">
          {[
            { key: "high", label: "High (4-5)" },
            { key: "medium", label: "Medium (3)" },
            { key: "low", label: "Low (1-2)" },
          ].map(({ key, label }) => {
            const count = summary.bandCounts[key];
            const pct = bandTotal ? (count / bandTotal) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-gray-500">{label}</span>
                <div className="flex-1 bg-gray-100 h-2 rounded overflow-hidden">
                  <div
                    className="bg-orange-400 h-2"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1 rounded-full border text-xs transition ${
              activeFilter === key
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Write a review */}
      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-4 py-2 border border-black rounded hover:bg-black hover:text-white transition"
          >
            Write a Review
          </button>
        ) : (
          <div className="flex flex-col gap-3 border rounded p-4 max-w-md">
            <p className="text-gray-700 font-medium text-sm">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={
                    star <= newRating ? assets.star_icon : assets.star_dull_icon
                  }
                  alt=""
                  className="w-5 cursor-pointer"
                  onClick={() => setNewRating(star)}
                />
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="border rounded p-2 text-sm w-full min-h-[80px]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="text-xs px-4 py-2 bg-black text-white rounded disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewRating(0);
                  setNewComment("");
                }}
                className="text-xs px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review list */}
      <div className="flex flex-col gap-4 mt-2">
        {loading ? (
          <p className="text-gray-400 text-xs">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-xs">
            No reviews {activeFilter !== "all" ? "in this range " : ""}yet.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 text-sm">
                  {review.reviewerName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
              <StarRow rating={review.rating} />
              <p className="mt-1 text-gray-600">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
