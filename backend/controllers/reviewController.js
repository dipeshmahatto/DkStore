import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";

// Mask a reviewer's name so only the first 2 characters are shown,
// e.g. "Dipesh" -> "Di****"
const maskName = (name) => {
  if (!name) return "Anonymous";
  const trimmed = name.trim();
  if (trimmed.length <= 2) {
    return trimmed + "*".repeat(4);
  }
  const visible = trimmed.slice(0, 2);
  const maskedLength = Math.max(trimmed.length - 2, 4); // at least 4 stars
  return visible + "*".repeat(maskedLength);
};

// Map a 1-5 rating to a band: low (1-2), medium (3), high (4-5)
const ratingToBand = (rating) => {
  if (rating <= 2) return "low";
  if (rating === 3) return "medium";
  return "high";
};

// Add a review (requires logged-in user, sets req.userId via authUser middleware)
const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.userId;

    if (!productId || !rating || !comment) {
      return res.json({
        success: false,
        message: "Product, rating and comment are required",
      });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const review = new reviewModel({
      productId,
      userId,
      userName: user.name,
      rating: numericRating,
      comment,
      date: Date.now(),
    });

    await review.save();

    res.json({ success: true, message: "Review added successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List reviews for a product, optionally filtered by rating band (low/medium/high),
// with reviewer names masked. Also returns a rating summary.
const listReviews = async (req, res) => {
  try {
    const { productId, filter } = req.body;

    if (!productId) {
      return res.json({ success: false, message: "Product ID is required" });
    }

    const allReviews = await reviewModel
      .find({ productId })
      .sort({ date: -1 });

    // Build summary from the full (unfiltered) set of reviews
    const totalCount = allReviews.length;
    const averageRating = totalCount
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

    const bandCounts = { low: 0, medium: 0, high: 0 };
    allReviews.forEach((r) => {
      bandCounts[ratingToBand(r.rating)] += 1;
    });

    // Apply band filter if requested
    let filteredReviews = allReviews;
    if (filter && ["low", "medium", "high"].includes(filter)) {
      filteredReviews = allReviews.filter(
        (r) => ratingToBand(r.rating) === filter
      );
    }

    const reviews = filteredReviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      reviewerName: maskName(r.userName),
    }));

    res.json({
      success: true,
      reviews,
      summary: {
        totalCount,
        averageRating: Number(averageRating.toFixed(1)),
        bandCounts,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addReview, listReviews };
