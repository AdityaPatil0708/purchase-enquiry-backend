import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./db/dbConnect.js";
import userRoutes from "./routes/userRoute.js";
import enquiryRoutes from "./routes/enquiryRoute.js";

dotenv.config();

const app = express();

// CORS — allow frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://13.53.50.161:3000",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/enquiries", enquiryRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

dbConnect().then(() => {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
});
