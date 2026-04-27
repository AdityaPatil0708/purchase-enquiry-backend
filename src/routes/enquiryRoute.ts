import express, { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  selectVendor,
  reopenEnquiry,
  reviewDeal,
  deleteEnquiry,
} from "../controllers/enquiryController.js";

const router: Router = express.Router();

router.use(authMiddleware);

// ── User routes ────────────────────────────────────────────────
router.post("/", createEnquiry);
router.get("/", getAllEnquiries);
router.get("/:id", getEnquiryById);
router.patch("/:id/select", selectVendor);
router.patch("/:id/reopen", reopenEnquiry);
router.delete("/:id", deleteEnquiry);  

// ── Admin-only routes ──────────────────────────────────────────
router.patch("/:id/review", adminMiddleware, reviewDeal);

export default router;