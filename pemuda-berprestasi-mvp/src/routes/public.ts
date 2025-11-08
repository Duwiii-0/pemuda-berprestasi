import { Router } from 'express';
import { KompetisiController } from '../controllers/kompetisiController';

const router = Router();

// ✅ PUBLIC endpoints untuk Medal Tally (NO AUTH REQUIRED)
// Endpoint ini bisa diakses tanpa login

// 🔥 FIX: Tambahkan logging untuk debugging
router.use((req, res, next) => {
  console.log(`📍 Public Route Hit: ${req.method} ${req.originalUrl}`);
  next();
});

// Medal Tally endpoint - HARUS specific dulu sebelum :id
router.get('/kompetisi/:id/medal-tally', (req, res, next) => {
  console.log(`🏅 Medal Tally Request for kompetisi: ${req.params.id}`);
  KompetisiController.getMedalTally(req, res);
});

// Get bracket by class (public read-only)
router.get('/kompetisi/:id/brackets/:kelasKejuaraanId', (req, res, next) => {
  console.log(`📊 Bracket Request: kompetisi=${req.params.id}, kelas=${req.params.kelasKejuaraanId}`);
  KompetisiController.getBracketByClass(req, res);
});

// Get competition by ID (harus paling bawah karena catch-all)
router.get('/kompetisi/:id', (req, res, next) => {
  console.log(`ℹ️ Kompetisi Detail Request: ${req.params.id}`);
  KompetisiController.getById(req, res);
});

// ✅ OPTIONAL: Get all published competitions (untuk public viewing)
router.get('/kompetisi', (req, res, next) => {
  console.log(`📋 All Kompetisi Request (public)`);
  
  // Add filter for published only
  req.query.status = 'SEDANG_DIMULAI,SELESAI'; // Only show ongoing/finished
  KompetisiController.getAll(req, res);
});

export default router;