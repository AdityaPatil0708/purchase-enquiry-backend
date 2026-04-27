import type { Request, Response } from "express";
import mongoose from "mongoose";
import Enquiry from "../models/enquiryModel.js";

/**
 * POST /api/enquiries
 * Create a new enquiry. (user only)
 */
export async function createEnquiry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (req.user?.role === "admin") {
      res.status(403).json({
        success: false,
        message: "Admins cannot create enquiries.",
      });
      return;
    }

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
      closedVendorIdxs: [],
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
 * - Admin: all deals. Supports ?filter=open|closed|pending_review
 * - Regular user: all enquiries.
 */
export async function getAllEnquiries(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const isAdmin = req.user?.role === "admin";
    const filter = req.query["filter"] as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (isAdmin && filter === "open") query["closed"] = false;
    else if (isAdmin && filter === "closed") query["closed"] = true;
    else if (isAdmin && filter === "pending_review") {
      // Deals where user has submitted a selection but admin hasn't acted yet
      query["pendingVendorIdxs.0"] = { $exists: true };
      query["closed"] = false;
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });

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
 * Regular user selects vendor(s) for admin review.
 * Saves to pendingVendorIdxs — deal stays OPEN until admin approves.
 */
export async function selectVendor(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (req.user?.role === "admin") {
      res.status(403).json({
        success: false,
        message: "Admins cannot submit vendor selections.",
      });
      return;
    }

    const { vendorIdxs } = req.body;

    if (!Array.isArray(vendorIdxs) || vendorIdxs.length === 0) {
      res.status(400).json({
        success: false,
        message: "vendorIdxs (array of numbers) is required and cannot be empty.",
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

    if (enquiry.closed) {
      res.status(400).json({
        success: false,
        message: "Cannot change selection on a closed deal.",
      });
      return;
    }

    for (const idx of vendorIdxs) {
      if (typeof idx !== "number" || idx < 0 || idx >= enquiry.vendors.length) {
        res.status(400).json({
          success: false,
          message: `Invalid vendor index: ${idx}`,
        });
        return;
      }
      const selectedVendor = enquiry.vendors[idx];
      if (!selectedVendor || selectedVendor.rateStatus !== "received") {
        res.status(400).json({
          success: false,
          message: `Cannot select a vendor without a received rate at index ${idx}.`,
        });
        return;
      }
    }

    // Save selection for admin to review — deal stays open
    enquiry.pendingVendorIdxs = vendorIdxs;
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Vendor selection submitted for admin review.",
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
 * Reopen a closed deal and clear all selections. (user only)
 */
export async function reopenEnquiry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (req.user?.role === "admin") {
      res.status(403).json({
        success: false,
        message: "Admins cannot reopen deals.",
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

    if (!enquiry.closed) {
      res.status(400).json({
        success: false,
        message: "Enquiry is already open.",
      });
      return;
    }

    enquiry.closed = false;
    enquiry.pendingVendorIdxs = [];
    enquiry.closedVendorIdxs = [];
    enquiry.adminStatus = "pending";
    enquiry.adminRemark = "";
    enquiry.reviewedBy = undefined;
    enquiry.reviewedAt = undefined;
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

/**
 * PATCH /api/enquiries/:id/review
 * Admin approves or rejects a user's vendor selection.
 * - approve → closed=true, closedVendorIdxs = pendingVendorIdxs, pendingVendorIdxs cleared
 * - reject  → deal stays open, pendingVendorIdxs cleared, user can re-select
 */
export async function reviewDeal(req: Request, res: Response): Promise<void> {
  try {
    const { action, remark } = req.body as {
      action: "approved" | "rejected";
      remark?: string;
    };

    if (!action || !["approved", "rejected"].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'action must be "approved" or "rejected".',
      });
      return;
    }

    if (action === "rejected" && !remark?.trim()) {
      res.status(400).json({
        success: false,
        message: "A remark is required when rejecting a deal.",
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

    if (enquiry.pendingVendorIdxs.length === 0) {
      res.status(400).json({
        success: false,
        message: "No pending vendor selection to review.",
      });
      return;
    }

    if (action === "approved") {
      // Finalise the deal
      enquiry.closed = true;
      enquiry.closedVendorIdxs = enquiry.pendingVendorIdxs;
      enquiry.pendingVendorIdxs = [];
      enquiry.adminStatus = "approved";
    } else {
      // Reject — clear pending so user can make a new selection
      enquiry.pendingVendorIdxs = [];
      enquiry.adminStatus = "rejected";
    }

    enquiry.adminRemark = remark?.trim() ?? "";
    enquiry.reviewedBy = new mongoose.Types.ObjectId(req.user!.userId);
    enquiry.reviewedAt = new Date();
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: `Deal ${action} successfully.`,
      enquiry,
    });
  } catch (error) {
    console.error("Review deal error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export async function deleteEnquiry(
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

    if (enquiry.closed) {
      res.status(400).json({
        success: false,
        message: "Cannot delete a closed deal.",
      });
      return;
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = enquiry.createdBy.toString() === req.user!.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not authorised to delete this enquiry.",
      });
      return;
    }

    await enquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    console.error("Delete enquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}