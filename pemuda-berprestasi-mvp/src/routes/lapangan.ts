import { Router } from "express";
import lapanganController from "../controllers/lapanganController";

const router = Router();

// POST /api/lapangan/tambah-hari
router.post("/tambah-hari", lapanganController.tambahHariLapangan);

// GET /api/lapangan/kompetisi/:id_kompetisi
router.get(
  "/kompetisi/:id_kompetisi",
  lapanganController.getHariLapanganByKompetisi
);

// DELETE /api/lapangan/hapus-hari
router.delete("/hapus-hari", lapanganController.hapusHariLapangan);

export default router;
