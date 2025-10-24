import { Router } from "express";
import lapanganController from "../controllers/lapanganController";

const router = Router();

// POST /api/lapangan/tambah-hari
router.post("/tambah-hari", lapanganController.tambahHariLapangan);

// POST /api/lapangan/tambah-lapangan-ke-hari
router.post(
  "/tambah-lapangan-ke-hari",
  lapanganController.tambahLapanganKeHari
);

// DELETE /api/lapangan/hapus-lapangan
router.delete("/hapus-lapangan", lapanganController.hapusLapangan);

// GET /api/lapangan/kompetisi/:id_kompetisi
router.get(
  "/kompetisi/:id_kompetisi",
  lapanganController.getHariLapanganByKompetisi
);

// DELETE /api/lapangan/hapus-hari
router.delete("/hapus-hari", lapanganController.hapusHariLapangan);

export default router;
