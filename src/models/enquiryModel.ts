import mongoose, { type Document } from "mongoose";

const RATE_STATUSES = ["received", "not_received", "not_available"] as const;
const UNIT_TYPES = [
  "Kgs",
  "Barrels",
  "Litres",
  "Tonnes",
  "Units",
  "Boxes",
  "Bags",
  "Pieces",
  "Meters",
  "MT",
] as const;

export type RateStatus = (typeof RATE_STATUSES)[number];
export type UnitType = (typeof UNIT_TYPES)[number];

export interface IVendorQuote {
  vendor: string;
  brand?: string;
  rateStatus: RateStatus;
  rate: number | null;
  qty: number;
  unit: UnitType;
  remark?: string;
}

export interface IEnquiry extends Document {
  product: string;
  date: string;
  vendors: (IVendorQuote & { _id: mongoose.Types.ObjectId })[];
  closed: boolean;
  closedVendorIdx: number | null;
  createdBy: mongoose.Types.ObjectId;
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
    qty: { type: Number, required: true, default: 0 },
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
    closedVendorIdx: { type: Number, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: mapId },
  }
);

const Enquiry = mongoose.model<IEnquiry>("Enquiry", enquirySchema);
export default Enquiry;
