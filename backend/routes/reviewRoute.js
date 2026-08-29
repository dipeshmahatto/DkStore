import express from "express";
import { addReview, listReviews } from "../controllers/reviewController.js";
import authUser from "../middleware/auth.js";

const reviewRouter = express.Router();

// Add a review - requires the user to be logged in
reviewRouter.post("/add", authUser, addReview);

// List reviews for a product, optionally filtered by rating band (low/medium/high)
// No auth required - anyone (including guests) can view reviews
reviewRouter.post("/list", listReviews);

export default reviewRouter;
