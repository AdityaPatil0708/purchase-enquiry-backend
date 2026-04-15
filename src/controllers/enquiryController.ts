import type { Request, Response } from "express";
import Enquiry from "../models/enquiryModel.js";

/**
 * POST /api/enquiries
 * Create a new enquiry with product name and vendor quotes.
 */
export async function createEnquiry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { product, vendors } = req.body;

    if (!product || !product.trim()) {
      res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
      return;
    }

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one vendor quote is required.",
      });
      return;
    }

    const enquiry = await Enquiry.create({
      product: product.trim(),
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      vendors,
      closed: false,
      closedVendorIdx: null,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * GET /api/enquiries
 * Get all enquiries (shared across all users).
 */
export async function getAllEnquiries(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * GET /api/enquiries/:id
 * Get a single enquiry by ID.
 */
export async function getEnquiryById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const enquiry = await Enquiry.findById(req.params["id"]);

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error("Get enquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * PATCH /api/enquiries/:id/select
 * Close a deal — select a vendor by index.
 * Body: { vendorIdx: number }
 */
export async function selectVendor(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { vendorIdx } = req.body;

    if (vendorIdx === undefined || typeof vendorIdx !== "number") {
      res.status(400).json({
        success: false,
        message: "vendorIdx (number) is required.",
      });
      return;
    }

    const enquiry = await Enquiry.findById(req.params["id"]);

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
      return;
    }

    if (vendorIdx < 0 || vendorIdx >= enquiry.vendors.length) {
      res.status(400).json({
        success: false,
        message: "Invalid vendor index.",
      });
      return;
    }

    const selectedVendor = enquiry.vendors[vendorIdx];
    if (!selectedVendor || selectedVendor.rateStatus !== "received") {
      res.status(400).json({
        success: false,
        message: "Cannot select a vendor without a received rate.",
      });
      return;
    }

    enquiry.closed = true;
    enquiry.closedVendorIdx = vendorIdx;
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Deal closed successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Select vendor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * PATCH /api/enquiries/:id/reopen
 * Reopen a closed deal.
 */
export async function reopenEnquiry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const enquiry = await Enquiry.findById(req.params["id"]);

    if (!enquiry) {
      res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
      return;
    }

    if (!enquiry.closed) {
      res.status(400).json({
        success: false,
        message: "Enquiry is already open.",
      });
      return;
    }

    enquiry.closed = false;
    enquiry.closedVendorIdx = null;
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Enquiry reopened successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Reopen enquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
