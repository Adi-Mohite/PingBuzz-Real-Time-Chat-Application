import express from "express";
import { askGemini,getQuickRepliesFromAI } from "../controllers/ai.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/ask", askGemini);
router.post("/quick-replies", protectRoute, getQuickRepliesFromAI);

export default router;
