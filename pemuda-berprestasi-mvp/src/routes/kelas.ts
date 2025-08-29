// src/routes/kelasRoute.ts
import { Router } from "express";
import { kelasController } from "../controllers/kelasController";
import { authenticate } from "../middleware/auth";

const router = Router();

// semua route di bawah ini wajib login
router.use(authenticate);

router.get("/kelompok-usia", kelasController.getKelompokUsia);
router.get("/berat", kelasController.getKelasBerat);
router.get("/poomsae", kelasController.getKelasPoomsae);
router.post("/kejuaraan/:kompetisiId/filter", kelasController.getKelasKejuaraan);

export default router;

