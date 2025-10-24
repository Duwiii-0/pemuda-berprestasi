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

// POST /api/lapangan/simpan-kelas - Endpoint baru untuk simpan kelas
router.post("/simpan-kelas", lapanganController.simpanKelasLapangan);

// DELETE /api/lapangan/hapus-lapangan
router.delete("/hapus-lapangan", lapanganController.hapusLapangan);

// GET /api/lapangan/kompetisi/:id_kompetisi
router.get(
  "/kompetisi/:id_kompetisi",
  lapanganController.getHariLapanganByKompetisi
);

// GET /api/lapangan/:id_lapangan/kelas - Get kelas untuk antrian/bagan
router.get(
  "/:id_lapangan/kelas",
  lapanganController.getKelasKejuaraanByLapangan
);

// DELETE /api/lapangan/hapus-hari
router.delete("/hapus-hari", lapanganController.hapusHariLapangan);

export default router;
