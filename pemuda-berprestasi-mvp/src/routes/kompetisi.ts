import { Router } from "express";
import { KompetisiController } from "../controllers/kompetisiController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { kompetisiValidation } from "../validations/kompetisiValidation";

const router = Router();

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
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

// Registration management
router.get(
  "/:id/atlet",
  authenticate,
  KompetisiController.getAtletsByKompetisi
);
router.post("/:id/register", authenticate, KompetisiController.registerAtlet);

// ✅ DELETE PESERTA - Harus sebelum route dengan parameter yang lebih spesifik
router.delete(
  "/:id/peserta/:participantId",
  KompetisiController.deleteParticipant
);

router.get(
  "/:id/participants/:participantId/available-classes",
  KompetisiController.getAvailableClassesForParticipant
);
router.get(
  "/:id/participants/:participantId/available-classes",
  authenticate,
  KompetisiController.getAvailableClassesSimple
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
router.post(
  "/:id/brackets/generate",
  validateRequest(kompetisiValidation.generateBracket),
  KompetisiController.generateBrackets
);

router.post("/:id/brackets/shuffle", KompetisiController.shuffleBrackets);
router.get("/:id/brackets/pdf", KompetisiController.exportBracketToPdf);
router.put(
  "/:id/brackets/match/:matchId",
  validateRequest(kompetisiValidation.updateMatch),
  KompetisiController.updateMatch
);
router.post("/:id/draw", KompetisiController.conductDraw);

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
router.get(
  "/:id/brackets/:kelasKejuaraanId",
  KompetisiController.getBracketByClass
);
router.get("/:id/brackets", KompetisiController.getBrackets);

export default router;