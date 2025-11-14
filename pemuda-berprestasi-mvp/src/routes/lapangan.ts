import { Router } from "express";
import lapanganController from "../controllers/lapanganController";

const router = Router();

// ============= EXISTING ROUTES (sudah ada) =============
router.post("/tambah-hari", lapanganController.tambahHariLapangan);
router.post("/tambah-lapangan-ke-hari", lapanganController.tambahLapanganKeHari);
router.post("/simpan-kelas", lapanganController.simpanKelasLapangan);
router.delete("/hapus-lapangan", lapanganController.hapusLapangan);
router.delete("/hapus-hari", lapanganController.hapusHariLapangan);
router.get("/kompetisi/:id_kompetisi", lapanganController.getHariLapanganByKompetisi);
router.get("/:id_lapangan/kelas", lapanganController.getKelasKejuaraanByLapangan);
router.post("/antrian", lapanganController.simpanAntrian);

// ============= 🆕 NEW ROUTES UNTUK AUTO-GENERATE =============

// 🆕 1. GET full data (lapangan + kelas + bracket + matches)
router.get(
  "/:id_lapangan/full-data",
  lapanganController.getLapanganFullData
);

// 🆕 2. GET preview nomor partai (tanpa save)
router.get(
  "/:id_lapangan/preview-numbers",
  lapanganController.previewMatchNumbers
);

// 🆕 3. POST auto-generate nomor partai (dengan save)
router.post(
  "/:id_lapangan/auto-generate-numbers",
  lapanganController.autoGenerateMatchNumbers
);

// 🆕 4. DELETE reset nomor partai
router.delete(
  "/:id_lapangan/reset-numbers",
  lapanganController.resetMatchNumbers
);

// 🆕 5. GET status penomoran (sudah ada nomor atau belum)
router.get(
  "/:id_lapangan/numbering-status",
  lapanganController.getNumberingStatus
);

export default router;