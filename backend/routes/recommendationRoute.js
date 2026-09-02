import express from "express";
import authUser from "../middleware/auth.js";

import {
  personalizedRecommendations,
  similarProducts,
  trackInteraction,
} from "../controllers/recommendationController.js";

const recommendationRouter = express.Router();

recommendationRouter.post(
  "/track",
  authUser,
  trackInteraction
);

recommendationRouter.get(
  "/personalized",
  personalizedRecommendations
);

recommendationRouter.get(
  "/similar/:productId",
  similarProducts
);

export default recommendationRouter;