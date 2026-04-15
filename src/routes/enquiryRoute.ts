import express, { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  selectVendor,
  reopenEnquiry,
} from "../controllers/enquiryController.js";

const router: Router = express.Router();

// All enquiry routes are protected
router.use(authMiddleware);

router.post("/", createEnquiry);
router.get("/", getAllEnquiries);
router.get("/:id", getEnquiryById);
router.patch("/:id/select", selectVendor);
router.patch("/:id/reopen", reopenEnquiry);

export default router;
