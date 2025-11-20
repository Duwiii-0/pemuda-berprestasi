import { Router } from "express";
import { KompetisiController } from "../controllers/kompetisiController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { kompetisiValidation } from "../validations/kompetisiValidation";

const router = Router();

// Protected routes (require authentication)
router.use(authenticate);

// ============================================================
// CRUD OPERATIONS
// ============================================================
router.post(
  "/",
  validateRequest(kompetisiValidation.create),
  KompetisiController.create
);
router.get("/", KompetisiController.getAll);
router.get("/:id", KompetisiController.getById);
router.put(
  "/:id",
  validateRequest(kompetisiValidation.update),
  KompetisiController.update
);
router.delete("/:id", KompetisiController.delete);

// ============================================================
// REGISTRATION MANAGEMENT
// ============================================================
router.get(
  "/:id/atlet",
  KompetisiController.getAtletsByKompetisi
);
router.post(
  "/:id/register", 
  KompetisiController.registerAtlet
);

// ============================================================
// PESERTA MANAGEMENT (HARUS DI ATAS SEBELUM ROUTES LAIN!)
// ============================================================

// ✅ GET available classes for participant (PALING ATAS)
router.get(
  "/:id/peserta/:participantId/classes",
  KompetisiController.getAvailableClassesWithDetails
);

// ✅ UPDATE participant class/status
router.put(
  "/:id/peserta/:participantId",
  validateRequest(kompetisiValidation.updateParticipantClass),
  KompetisiController.updateParticipantClass
);

// ✅ DELETE participant
router.delete(
  "/:id/peserta/:participantId",
  KompetisiController.deleteParticipant
);

// ✅ UPDATE weigh-in data
router.put(
  "/:id/peserta/:participantId/penimbangan",
  KompetisiController.updatePenimbangan
);

// ============================================================
// LEGACY ROUTES (for backward compatibility - bisa dihapus kalau tidak dipakai)
// ============================================================
router.get(
  "/:id/participants/:participantId/available-classes",
  KompetisiController.getAvailableClassesForParticipant
);

router.put(
  "/:id/participants/:participantId/status",
  validateRequest(kompetisiValidation.updateStatus),
  KompetisiController.updateRegistrationStatus
);

router.put(
  "/:id/participants/:participantId/class",
  KompetisiController.updateParticipantClass
);

// ============================================================
// TOURNAMENT/BRACKET MANAGEMENT ROUTES
// ============================================================

router.get(
  "/:id/brackets/list",
  KompetisiController.getBracketsListPublic
);

router.post(
  "/:id/brackets/generate",
  validateRequest(kompetisiValidation.generateBracket),
  KompetisiController.generateBrackets
);

router.post(
  "/:id/brackets/shuffle", 
  KompetisiController.shuffleBrackets
);

router.get(
  "/:id/brackets/pdf", 
  KompetisiController.exportBracketToPdf
);

// 🆕 NEW: Assign athlete to match
router.put(
  "/:id/brackets/:kelasKejuaraanId/matches/:matchId/assign",
  KompetisiController.assignAthleteToMatch
);

// Existing: Update match (scores/schedule)
router.put(
  "/:id/brackets/match/:matchId",
  validateRequest(kompetisiValidation.updateMatch),
  KompetisiController.updateMatch
);

router.post(
  "/:id/draw", 
  KompetisiController.conductDraw
);

router.post(
  "/:id/brackets/:kelasKejuaraanId/clear-results",
  KompetisiController.clearBracketResults
);

router.post(
  "/:id/brackets/:kelasKejuaraanId/regenerate",
  KompetisiController.regenerateBracket
);

router.delete(
  "/:id/brackets/:kelasKejuaraanId",
  KompetisiController.deleteBracket
);

// Clear scheduling (nomor partai)
router.delete(
  '/:id/kelas/:kelasKejuaraanId/scheduling',
  authenticate,
  KompetisiController.clearScheduling
);

router.get(
  "/:id/brackets/:kelasKejuaraanId",
  KompetisiController.getBracketByClass
);

router.get(
  "/:id/brackets", 
  KompetisiController.getBrackets
);

export default router;