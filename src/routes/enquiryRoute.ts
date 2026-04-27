import express, { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  selectVendor,
  reopenEnquiry,
  reviewDeal,
} from "../controllers/enquiryController.js";

const router: Router = express.Router();

// All enquiry routes require authentication
router.use(authMiddleware);

// ── User routes ────────────────────────────────────────────────
router.post("/", createEnquiry);           // create a new enquiry
router.get("/", getAllEnquiries);          // list all (admin gets open+closed; supports ?filter=open|closed)
router.get("/:id", getEnquiryById);        // single enquiry
router.patch("/:id/select", selectVendor); // close a deal / select vendor(s)
router.patch("/:id/reopen", reopenEnquiry);// reopen a closed deal

// ── Admin-only routes ──────────────────────────────────────────
// PATCH /api/enquiries/:id/review  — approve or reject a closed deal
router.patch("/:id/review", adminMiddleware, reviewDeal);

export default router;