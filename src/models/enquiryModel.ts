import mongoose, { type Document } from "mongoose";

const RATE_STATUSES = ["received", "not_received", "not_available"] as const;
const UNIT_TYPES = [
  "Kgs",
  "Barrels",
] as const;

// Admin can approve or reject a closed deal, or it stays "pending" review
const ADMIN_STATUSES = ["pending", "approved", "rejected"] as const;

export type RateStatus = (typeof RATE_STATUSES)[number];
export type UnitType = (typeof UNIT_TYPES)[number];
export type AdminStatus = (typeof ADMIN_STATUSES)[number];

export interface IVendorQuote {
  vendor: string;
  brand?: string;
  rateStatus: RateStatus;
  rate: number | null;
  enquiredQty: string;
  availableQty: string;
  unit: UnitType;
  remark?: string;
  availableQtyMax?: number | null
}

export interface IEnquiry extends Document {
  product: string;
  date: string;
  vendors: (IVendorQuote & { _id: mongoose.Types.ObjectId })[];
  closed: boolean;
  /** Indices selected by the user — awaiting admin approval */
  pendingVendorIdxs: number[];
  /** Indices finalised after admin approves */
  closedVendorIdxs: number[];
  createdBy: mongoose.Types.ObjectId;
  /** Marks the enquiry as Purchase Order ready */
  poReady: boolean;
  // Admin review fields
  adminStatus: AdminStatus;
  adminRemark?: string;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  /** Freeform remark left by the regular user on this enquiry */
  userRemark?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapId(_doc: any, ret: any) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
}

const vendorQuoteSchema = new mongoose.Schema(
  {
    vendor: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    rateStatus: {
      type: String,
      enum: RATE_STATUSES,
      required: true,
      default: "not_received",
    },
    rate: { type: Number, default: null },
    enquiredQty: { type: String, required: true, default: 0 },
    availableQty: { type: String, required: true, default: 0 },
    unit: { type: String, enum: UNIT_TYPES, required: true, default: "Kgs" },
    remark: { type: String, trim: true, default: "" },
  },
  {
    toJSON: { transform: mapId },
  }
);

const enquirySchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    vendors: [vendorQuoteSchema],
    closed: { type: Boolean, default: false },
    pendingVendorIdxs: { type: [Number], default: [] },
    closedVendorIdxs: { type: [Number], default: [] },
    poReady: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Admin review — only relevant once a deal is closed
    adminStatus: {
      type: String,
      enum: ADMIN_STATUSES,
      default: "pending",
    },
    adminRemark: { type: String, trim: true, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    userRemark: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
    toJSON: { transform: mapId },
  }
);

const Enquiry = mongoose.model<IEnquiry>("Enquiry", enquirySchema);
export default Enquiry;