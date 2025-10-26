import { Router } from "express";
import lapanganController from "../controllers/lapanganController";

const router = Router();

// Rute ini memerlukan autentikasi dan role ADMIN

// POST /api/lapangan/tambah-hari
router.post("/tambah-hari", lapanganController.tambahHariLapangan);

// POST /api/lapangan/tambah-lapangan-ke-hari
router.post(
  "/tambah-lapangan-ke-hari",
  lapanganController.tambahLapanganKeHari
);

// POST /api/lapangan/simpan-kelas
router.post("/simpan-kelas", lapanganController.simpanKelasLapangan);

// DELETE /api/lapangan/hapus-lapangan
router.delete("/hapus-lapangan", lapanganController.hapusLapangan);

// GET /api/lapangan/kompetisi/:id_kompetisi
router.get(
  "/kompetisi/:id_kompetisi",
  lapanganController.getHariLapanganByKompetisi
);

// DELETE /api/lapangan/hapus-hari
router.delete("/hapus-hari", lapanganController.hapusHariLapangan);

// GET /api/lapangan/:id_lapangan/kelas
router.get(
  "/:id_lapangan/kelas",
  lapanganController.getKelasKejuaraanByLapangan
);

// POST /api/lapangan/antrian
router.post("/antrian", lapanganController.simpanAntrian);

export default router;
