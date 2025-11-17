import { Router } from 'express';
import { KompetisiController } from '../controllers/kompetisiController';

const router = Router();

// ✅ PUBLIC endpoints untuk Medal Tally dan Bracket Viewer (NO AUTH REQUIRED)

// 🔥 Logging middleware untuk debugging
router.use((req, res, next) => {
  console.log(`📍 Public Route Hit: ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// SPECIFIC ROUTES FIRST (lebih spesifik duluan)
// ============================================================

// Medal Tally endpoint
router.get('/kompetisi/:id/medal-tally', (req, res, next) => {
  console.log(`🏅 Medal Tally Request for kompetisi: ${req.params.id}`);
  KompetisiController.getMedalTally(req, res);
});

// ✅ NEW: Get brackets list (untuk bracket viewer)
router.get('/kompetisi/:id/brackets/list', (req, res, next) => {
  console.log(`📋 Brackets List Request for kompetisi: ${req.params.id}`);
  KompetisiController.getBracketsListPublic(req, res);
});

// Get bracket by specific class (public read-only)
router.get('/kompetisi/:id/brackets/:kelasKejuaraanId', (req, res, next) => {
  console.log(`📊 Bracket Request: kompetisi=${req.params.id}, kelas=${req.params.kelasKejuaraanId}`);
  KompetisiController.getBracketByClass(req, res);
});

// ============================================================
// GENERIC ROUTES LAST (catch-all di paling bawah)
// ============================================================

// Get competition by ID
router.get('/kompetisi/:id', (req, res, next) => {
  console.log(`ℹ️ Kompetisi Detail Request: ${req.params.id}`);
  KompetisiController.getById(req, res);
});

// Get all published competitions (untuk public viewing)
router.get('/kompetisi', (req, res, next) => {
  console.log(`📋 All Kompetisi Request (public)`);
  
  // Add filter for published only
  req.query.status = 'SEDANG_DIMULAI,SELESAI'; // Only show ongoing/finished
  KompetisiController.getAll(req, res);
});

export default router;