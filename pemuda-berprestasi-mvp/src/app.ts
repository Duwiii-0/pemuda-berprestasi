// src/app.ts
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";
import pelatihRoutes from "./routes/pelatih";
import dojangRoutes from "./routes/dojang";
import atletRoutes from "./routes/atlet";
import kelasRoutes from "./routes/kelas";
import kompetisiRoutes from "./routes/kompetisi";
import buktiTransferRoutes from "./routes/buktiTransfer";
import lapanganRoutes from "./routes/lapangan";
import pertandinganRoutes from "./routes/pertandingan";
import publicRoutes from "./routes/public"; // ✅ ADD THIS

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ⭐ REQUEST LOGGING (for debugging)
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Pemuda Berprestasi API is running",
    version: "1.0.0",
    endpoints: [
      "GET /health",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/pelatih",
      "GET /api/dojang",
      "GET /api/atlet",
      "GET /api/kompetisi",
      "GET /api/kelas",
      "POST /api/bukti-transfer",
      "POST /api/lapangan/tambah-hari",
      "GET /api/lapangan/kompetisi/:id_kompetisi",
      "DELETE /api/lapangan/hapus-hari",
      "GET /api/public/kompetisi/:id/medal-tally", // ✅ ADD
      "GET /api/public/kompetisi/:id", // ✅ ADD
    ],
  });
});

// ⭐ PUBLIC ROUTES (NO AUTH) - MUST BE FIRST
console.log('🔧 Registering public routes...');
app.use("/api/public", publicRoutes); // ✅ ADD THIS
console.log('✅ Public routes registered');

// PROTECTED API ROUTES (dengan auth middleware di masing-masing route)
app.use("/api/auth", authRoutes);
app.use("/api/pelatih", pelatihRoutes);
app.use("/api/dojang", dojangRoutes);
app.use("/api/atlet", atletRoutes);
app.use("/api/kompetisi", kompetisiRoutes);
app.use("/api/kelas", kelasRoutes);
app.use("/api/bukti-transfer", buktiTransferRoutes);
app.use("/api/lapangan", lapanganRoutes);
app.use("/api/pertandingan", pertandinganRoutes);

// 404 handler (MUST BE AFTER ALL ROUTES)
app.use(notFoundHandler);

// Global error handler (MUST BE LAST)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

export default app;