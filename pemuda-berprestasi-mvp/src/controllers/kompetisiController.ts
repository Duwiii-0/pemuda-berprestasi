import { Request, Response } from 'express';
import { KompetisiService } from '../services/kompetisiService';
import { BracketService } from '../services/bracketService';
import { sendSuccess, sendError } from '../utils/response';
import { StatusKompetisi } from '@prisma/client';
import prisma from '../config/database';
import PDFDocument from 'pdfkit'; 

export class KompetisiController {
  // Create new kompetisi
  static async create(req: Request, res: Response) {
    try {
      const kompetisiData = req.body;

      // Convert string dates to Date objects
      if (kompetisiData.tanggal_mulai) {
        kompetisiData.tanggal_mulai = new Date(kompetisiData.tanggal_mulai);
      }
      if (kompetisiData.tanggal_selesai) {
        kompetisiData.tanggal_selesai = new Date(kompetisiData.tanggal_selesai);
      }

      const kompetisi = await KompetisiService.createKompetisi(kompetisiData);
      return sendSuccess(res, kompetisi, 'Kompetisi berhasil dibuat', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async deleteParticipant(req: Request, res: Response) {
    try {
      const { id, participantId } = req.params;

      // Validasi parameter
      const kompetisiId = parseInt(id);
      const pesertaId = parseInt(participantId);

      if (isNaN(kompetisiId)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      if (isNaN(pesertaId)) {
        return sendError(res, 'ID peserta tidak valid', 400);
      }

      // Panggil service untuk handle delete logic
      const result = await KompetisiService.deleteParticipant(kompetisiId, pesertaId);

      return sendSuccess(res, result.data, result.message);

    } catch (error: any) {
      console.error('Controller - Error deleting participant:', error);
      return sendError(res, error.message || 'Gagal menghapus peserta', 400);
    }
  }

  // Get all kompetisi with optional filters
  static async getAll(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 100,
        search: req.query.search as string,
        status: req.query.status as StatusKompetisi,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      };

      const result = await KompetisiService.getAllKompetisi(filters);
      return sendSuccess(res, result.data, 'Data kompetisi berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get kompetisi by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const kompetisi = await KompetisiService.getKompetisiById(id);
      return sendSuccess(res, kompetisi, 'Detail kompetisi berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  // Update kompetisi
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const updateData = {
        id_kompetisi: id,
        ...req.body,
      };

      // Convert string dates to Date objects if provided
      if (updateData.tanggal_mulai) updateData.tanggal_mulai = new Date(updateData.tanggal_mulai);
      if (updateData.tanggal_selesai) updateData.tanggal_selesai = new Date(updateData.tanggal_selesai);

      const updatedKompetisi = await KompetisiService.updateKompetisi(updateData);
      return sendSuccess(res, updatedKompetisi, 'Kompetisi berhasil diperbarui');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Delete kompetisi
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const result = await KompetisiService.deleteKompetisi(id);
      return sendSuccess(res, null, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async registerAtlet(req: Request, res: Response) {
  try {
    const { atlitId, kelasKejuaraanId, atlitId2 } = req.body;

    if (!atlitId || !kelasKejuaraanId) {
      return sendError(res, 'atlitId dan kelasKejuaraanId wajib diisi', 400);
    }

    if (atlitId2 && atlitId === atlitId2) {
      return sendError(res, 'Atlet pertama dan kedua tidak boleh sama', 400);
    }

    // Tentukan apakah ini pendaftaran tim
    let isTeam = false;
    if (atlitId2) {
      const kelas = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan: Number(kelasKejuaraanId) },
      });
      // Asumsinya jika Poomsae dan kelas beregu/berpasangan
      if (kelas?.cabang === "POOMSAE") {
        isTeam = true;
      }
    }

    const registrationData = {
      atlitId: Number(atlitId),
      kelasKejuaraanId: Number(kelasKejuaraanId),
      ...(atlitId2 ? { atlitId2: Number(atlitId2) } : {}),
      isTeam,
    };

    const peserta = await KompetisiService.registerAtlet(registrationData);

    const message = isTeam
      ? 'Tim atlet berhasil didaftarkan ke kelas kejuaraan'
      : 'Atlet berhasil didaftarkan ke kelas kejuaraan';

    return sendSuccess(res, peserta, message, 201);
    
  } catch (error: any) {
    console.error("❌ Controller - Registration error:", error);
    return sendError(res, error.message, 400);
  }
}


  static async getAtletsByKompetisi(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = "1", limit = "1000", id_dojang: idDojangQuery } = req.query; // ⬅️ ambil query
      let idDojang: number | undefined = undefined;

      const kompetisiId = parseInt(id, 10);
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      if (isNaN(kompetisiId)) {
        return res.status(400).json({ message: "Invalid kompetisiId" });
      }
      console.log("Role:", req.user?.role, "idDojang:", idDojang);

      // role PELATIH → selalu pakai id_dojang dari token
      if (req.user?.role === "PELATIH" && req.user.id_dojang) {
        idDojang = req.user.id_dojang;
      }
      // role ADMIN → boleh filter manual lewat query
      else if (req.user?.role === "ADMIN" && idDojangQuery) {
        idDojang = parseInt(idDojangQuery as string, 10);
      }


      const result = await KompetisiService.getAtletsByKompetisi(
        kompetisiId,
        pageNum,
        limitNum,
        idDojang
      );

      return res.status(200).json({
        success: true,
        data: result.peserta,
        total: result.total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error: any) {
      console.error("Error getAtletsByKompetisi:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch atlet by kompetisi",
        error: error.message,
      });
    }
  }
  
  static async updateRegistrationStatus(req: Request, res: Response) {
    try {
      const { id, participantId } = req.params;
      const { status } = req.body;

      if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedPeserta = await KompetisiService.updateRegistrationStatus(
        Number(id),
        Number(participantId),
        status
      );

      return res.status(200).json({
        message: "Status peserta berhasil diperbarui",
        data: updatedPeserta,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async updateParticipantClass(req: Request, res: Response) {
  try {
    const { id, participantId } = req.params;
    // ✅ FIXED: Sesuaikan dengan nama field yang dikirim frontend
    const { kelas_kejuaraan_id } = req.body; // Frontend mengirim field ini

    // Validasi parameter
    const kompetisiId = parseInt(id);
    const pesertaId = parseInt(participantId);
    const newKelasId = parseInt(kelas_kejuaraan_id); // ✅ FIXED: Gunakan field yang benar

    if (isNaN(kompetisiId)) {
      return sendError(res, 'ID kompetisi tidak valid', 400);
    }

    if (isNaN(pesertaId)) {
      return sendError(res, 'ID peserta tidak valid', 400);
    }

    if (isNaN(newKelasId)) {
      return sendError(res, 'ID kelas kejuaraan tidak valid', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    // Call service to handle the update logic
    const result = await KompetisiService.updateParticipantClass(
      kompetisiId, 
      pesertaId, 
      newKelasId, 
      user
    );

    return sendSuccess(res, result.data, result.message);

  } catch (error: any) {
    console.error('Controller - Error updating participant class:', error);
    return sendError(res, error.message || 'Gagal mengubah kelas peserta', 400);
  }
}

static async getAvailableClassesSimple(req: Request, res: Response) {
  try {
    const { id, participantId } = req.params;
    
    const kompetisiId = parseInt(id);
    const pesertaId = parseInt(participantId);

    if (isNaN(kompetisiId) || isNaN(pesertaId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    const availableClasses = await KompetisiService.getAvailableClassesSimple(
      kompetisiId, 
      pesertaId
    );

    return sendSuccess(res, availableClasses, 'Kelas yang tersedia berhasil diambil');

  } catch (error: any) {
    console.error('Controller - Error getting available classes:', error);
    return sendError(res, error.message || 'Gagal mendapatkan kelas yang tersedia', 400);
  }
}

static async getAvailableClassesForParticipant(req: Request, res: Response) {
  try {
    const { id, participantId } = req.params;
    
    const kompetisiId = parseInt(id);
    const pesertaId = parseInt(participantId);

    if (isNaN(kompetisiId)) {
      return sendError(res, 'ID kompetisi tidak valid', 400);
    }

    if (isNaN(pesertaId)) {
      return sendError(res, 'ID peserta tidak valid', 400);
    }

    const availableClasses = await KompetisiService.getAvailableClassesForParticipant(
      kompetisiId, 
      pesertaId
    );

    return sendSuccess(res, availableClasses, 'Kelas yang tersedia berhasil diambil');

  } catch (error: any) {
    console.error('Controller - Error getting available classes:', error);
    return sendError(res, error.message || 'Gagal mendapatkan kelas yang tersedia', 400);
  }
}

// Tournament/Bracket management methods - ADD THESE TO KompetisiController

/**
 * Generate bracket for a competition class
 */
static async generateBrackets(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { kelasKejuaraanId } = req.body;

    console.log(`\n📥 Generate Bracket Request:`);
    console.log(`   Kompetisi ID: ${id}`);
    console.log(`   Kelas Kejuaraan ID: ${kelasKejuaraanId}`);

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    const registrations = await prisma.tb_peserta_kompetisi.findMany({
      where: {
        id_kelas_kejuaraan: kelasId,
        status: 'APPROVED'
      },
      include: {
        kelas_kejuaraan: {
          include: {
            kategori_event: true
          }
        }
      }
    });

    const participantCount = registrations.length;
    console.log(`📊 Total approved participants: ${participantCount}`);

    const kategori = registrations[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
    const isPemula = kategori.includes('pemula');

    if (!isPemula && participantCount < 4) {
      return sendError(res, 'Minimal 4 peserta diperlukan untuk bracket prestasi', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
      include: {
        admin: true,
        kelas_kejuaraan: {
          where: { id_kelas_kejuaraan: kelasId }
        }
      }
    });

    if (!kompetisi) {
      return sendError(res, 'Kompetisi tidak ditemukan', 404);
    }

    if (kompetisi.kelas_kejuaraan.length === 0) {
      return sendError(res, 'Kelas kejuaraan tidak ditemukan dalam kompetisi ini', 404);
    }

    if (user.role === 'ADMIN_KOMPETISI') {
      const isAdminOfThisKompetisi = kompetisi.admin.some(
        admin => admin.id_akun === user.id_akun
      );
      if (!isAdminOfThisKompetisi) {
        return sendError(res, 'Anda tidak memiliki akses untuk membuat bagan di kompetisi ini', 403);
      }
    } else if (user.role !== 'ADMIN') {
      return sendError(res, 'Tidak memiliki akses untuk membuat bagan', 403);
    }

    // ⭐ Generate bracket (BYE auto-calculated in service)
    const bracket = await BracketService.generateBracket(
      kompetisiId, 
      kelasId
      // byeParticipantIds REMOVED
    );

    console.log(`✅ Bracket generated with ${bracket.matches.length} matches`);

    return sendSuccess(
      res, 
      bracket,
      'Bagan turnamen berhasil dibuat dengan BYE otomatis', 
      201
    );
  } catch (error: any) {
    console.error('❌ Controller - Error generating bracket:', error);
    return sendError(res, error.message || 'Gagal membuat bagan turnamen', 400);
  }
}

/**
 * Get bracket for a competition
 */
static async getBrackets(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { kelasKejuaraanId } = req.query;

    const kompetisiId = parseInt(id);
    const kelasId = kelasKejuaraanId ? parseInt(kelasKejuaraanId as string) : null;

    if (isNaN(kompetisiId)) {
      return sendError(res, 'ID kompetisi tidak valid', 400);
    }

    if (kelasId) {
      // Get specific class bracket
      const bracket = await BracketService.getBracket(kompetisiId, kelasId);
      
      if (!bracket) {
        return sendError(res, 'Bagan tidak ditemukan', 404);
      }

      return sendSuccess(res, bracket, 'Bagan turnamen berhasil diambil');
    } else {
      // Get all brackets for competition
      const kelas = await prisma.tb_kelas_kejuaraan.findMany({
        where: { id_kompetisi: kompetisiId },
        include: {
          kategori_event: true,
          kelompok: true,
          kelas_berat: true,
          poomsae: true
        }
      });

      const brackets = await Promise.all(
        kelas.map(async (k) => {
          const bracket = await BracketService.getBracket(kompetisiId, k.id_kelas_kejuaraan);
          return {
            kelas: k,
            bracket
          };
        })
      );

      return sendSuccess(res, brackets, 'Semua bagan turnamen berhasil diambil');
    }
  } catch (error: any) {
    console.error('Controller - Error getting brackets:', error);
    return sendError(res, error.message || 'Gagal mengambil bagan turnamen', 400);
  }
}

/**
 * Get bracket by specific class
 */
static async getBracketByClass(req: Request, res: Response) {
  try {
    const { id, kelasKejuaraanId } = req.params;

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    const bracket = await BracketService.getBracket(kompetisiId, kelasId);
    
    if (!bracket) {
      return sendError(res, 'Bagan tidak ditemukan untuk kelas ini', 404);
    }

    return sendSuccess(res, bracket, 'Bagan kelas kejuaraan berhasil diambil');
  } catch (error: any) {
    console.error('Controller - Error getting bracket by class:', error);
    return sendError(res, error.message || 'Gagal mengambil bagan kelas', 400);
  }
}

/**
 * Shuffle/regenerate bracket
 */
static async shuffleBrackets(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { kelasKejuaraanId, isPemula } = req.body; // ⭐ TAMBAH isPemula

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
      include: {
        admin: true,
        kelas_kejuaraan: {
          where: { id_kelas_kejuaraan: kelasId },
          include: {
            kategori_event: true
          }
        }
      }
    });

    if (!kompetisi) {
      return sendError(res, 'Kompetisi tidak ditemukan', 404);
    }

    if (kompetisi.kelas_kejuaraan.length === 0) {
      return sendError(res, 'Kelas kejuaraan tidak ditemukan', 404);
    }

    // Authorization check
    if (user.role === 'ADMIN_KOMPETISI') {
      const isAdminOfThisKompetisi = kompetisi.admin.some(
        admin => admin.id_akun === user.id_akun
      );
      if (!isAdminOfThisKompetisi) {
        return sendError(res, 'Anda tidak memiliki akses untuk mengacak bagan di kompetisi ini', 403);
      }
    } else if (user.role !== 'ADMIN') {
      return sendError(res, 'Tidak memiliki akses untuk mengacak bagan', 403);
    }

    // ⭐ DETECT category from flag or database
    const kategori = kompetisi.kelas_kejuaraan[0]?.kategori_event?.nama_kategori?.toLowerCase() || '';
    const isPemulaCategory = isPemula ?? kategori.includes('pemula');

    console.log(`\n🔀 Shuffle request for: ${isPemulaCategory ? 'PEMULA' : 'PRESTASI'}`);

    // Check if any matches have been played
    const existingBagan = await prisma.tb_bagan.findFirst({
      where: {
        id_kompetisi: kompetisiId,
        id_kelas_kejuaraan: kelasId
      },
      include: {
        match: true
      }
    });

    if (existingBagan) {
      const playedMatches = existingBagan.match.some(match => match.skor_a > 0 || match.skor_b > 0);
      if (playedMatches) {
        return sendError(res, 'Tidak dapat mengacak bagan karena ada pertandingan yang sudah dimulai', 400);
      }
    }

    let bracket;

    if (isPemulaCategory) {
      // PEMULA: Use special shuffle (re-assign only)
      bracket = await BracketService.shufflePemulaBracket(kompetisiId, kelasId);
    } else {
      // PRESTASI: Delete + regenerate with new BYE
      bracket = await BracketService.shuffleBracket(kompetisiId, kelasId);
    }

    return sendSuccess(res, bracket, 'Bagan turnamen berhasil diacak ulang');
  } catch (error: any) {
    console.error('Controller - Error shuffling bracket:', error);
    return sendError(res, error.message || 'Gagal mengacak ulang bagan', 400);
  }
}

/**
 * Regenerate bracket for specific class
 */
static async regenerateBracket(req: Request, res: Response) {
  try {
    const { id, kelasKejuaraanId } = req.params;

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    if (user.role !== 'ADMIN' && user.role !== 'ADMIN_KOMPETISI') {
      return sendError(res, 'Tidak memiliki akses untuk regenerasi bagan', 403);
    }

    const bracket = await BracketService.shuffleBracket(kompetisiId, kelasId);

    return sendSuccess(res, bracket, 'Bagan berhasil di-regenerasi');
  } catch (error: any) {
    console.error('Controller - Error regenerating bracket:', error);
    return sendError(res, error.message || 'Gagal regenerasi bagan', 400);
  }
}

static async updateMatch(req: Request, res: Response) {
  try {
    const { id, matchId } = req.params;
    const { 
      winnerId, 
      scoreA, 
      scoreB, 
      tanggalPertandingan, 
      nomorAntrian,
      nomorLapangan,
      nomorPartai
    } = req.body;

    const kompetisiId = parseInt(id);
    const matchIdInt = parseInt(matchId);

    if (isNaN(kompetisiId) || isNaN(matchIdInt)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // ⭐ DETECT UPDATE MODE
    const isResultUpdate = winnerId !== undefined && winnerId !== null;
    const isScheduleUpdate = nomorAntrian !== undefined || nomorLapangan !== undefined || tanggalPertandingan !== undefined;
    
    console.log(`\n📝 Update Match Request:`);
    console.log(`   Match ID: ${matchIdInt}`);
    console.log(`   Mode: ${isResultUpdate ? 'RESULT' : 'SCHEDULE'} update`);

    // ⭐ VALIDATION HANYA UNTUK RESULT UPDATE MODE
    if (isResultUpdate) {
      const winnerIdInt = parseInt(winnerId);
      const scoreAInt = parseInt(scoreA);
      const scoreBInt = parseInt(scoreB);

      if (isNaN(winnerIdInt)) {
        return sendError(res, 'Winner ID tidak valid', 400);
      }

      if (isNaN(scoreAInt) || isNaN(scoreBInt)) {
        return sendError(res, 'Skor tidak valid', 400);
      }

      if (scoreAInt < 0 || scoreBInt < 0) {
        return sendError(res, 'Skor tidak boleh negatif', 400);
      }

      if (scoreAInt === scoreBInt) {
        return sendError(res, 'Pertandingan tidak boleh berakhir seri', 400);
      }
      
      // ⭐ VALIDASI WINNER vs SCORE (hanya jika result update)
      const match = await prisma.tb_match.findFirst({
        where: {
          id_match: matchIdInt,
          bagan: {
            id_kompetisi: kompetisiId
          }
        },
        include: {
          peserta_a: true,
          peserta_b: true
        }
      });

      if (!match) {
        return sendError(res, 'Pertandingan tidak ditemukan', 404);
      }

      if (!match.peserta_a || !match.peserta_b) {
        return sendError(res, 'Pertandingan belum lengkap (peserta kurang)', 400);
      }

      // Validate winner
      const validWinnerIds = [match.id_peserta_a, match.id_peserta_b].filter(Boolean);
      if (!validWinnerIds.includes(winnerIdInt)) {
        return sendError(res, 'Winner ID tidak valid untuk pertandingan ini', 400);
      }

      // Validate score matches winner
      const isWinnerA = winnerIdInt === match.id_peserta_a;
      if ((isWinnerA && scoreAInt <= scoreBInt) || (!isWinnerA && scoreBInt <= scoreAInt)) {
        return sendError(res, 'Skor tidak sesuai dengan pemenang', 400);
      }
    }

    // ⭐ PARSE FIELDS (validation minimal untuk schedule)
    let parsedTanggal: Date | null = null;
    if (tanggalPertandingan) {
      parsedTanggal = new Date(tanggalPertandingan);
      if (isNaN(parsedTanggal.getTime())) {
        return sendError(res, 'Format tanggal tidak valid', 400);
      }
    }
    
    let parsedAntrian: number | null = null;
    let parsedLapangan: string | null = null;
    
    if (nomorAntrian !== undefined && nomorAntrian !== null) {
      parsedAntrian = parseInt(nomorAntrian);
      if (isNaN(parsedAntrian) || parsedAntrian < 1) {
        return sendError(res, 'Nomor antrian harus angka positif', 400);
      }
    }
    
    if (nomorLapangan !== undefined && nomorLapangan !== null) {
      parsedLapangan = String(nomorLapangan).toUpperCase().trim();
      if (!/^[A-Z]$/.test(parsedLapangan)) {
        return sendError(res, 'Nomor lapangan harus huruf kapital tunggal (A-Z)', 400);
      }
    }

    // ⭐ CHECK AUTHORIZATION (untuk semua mode)
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    if (user.role !== 'ADMIN' && user.role !== 'ADMIN_KOMPETISI') {
      return sendError(res, 'Tidak memiliki akses untuk mengupdate pertandingan', 403);
    }

    // ⭐ CALL SERVICE dengan parameter yang sesuai mode
    if (isResultUpdate) {
      const winnerIdInt = parseInt(winnerId);
      const scoreAInt = parseInt(scoreA);
      const scoreBInt = parseInt(scoreB);

      const updatedMatch = await BracketService.updateMatch(
        matchIdInt, 
        winnerIdInt, 
        scoreAInt, 
        scoreBInt,
        parsedTanggal,
        parsedAntrian,
        parsedLapangan
      );

      return sendSuccess(res, updatedMatch, 'Hasil pertandingan berhasil diupdate');
    } else {
      // ⭐ SCHEDULE-ONLY UPDATE - No winner/scores
      const updatedMatch = await BracketService.updateMatch(
        matchIdInt,
        null,              // No winner
        null,              // No scoreA
        null,              // No scoreB
        parsedTanggal,
        parsedAntrian,
        parsedLapangan
      );

      return sendSuccess(res, updatedMatch, 'Jadwal pertandingan berhasil diupdate');
    }

  } catch (error: any) {
    console.error('Controller - Error updating match:', error);
    return sendError(res, error.message || 'Gagal mengupdate pertandingan', 400);
  }
}
/**
 * Export bracket to PDF
 */
static async exportBracketToPdf(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { kelasKejuaraanId } = req.query;

    const kompetisiId = parseInt(id);
    const kelasId = kelasKejuaraanId ? parseInt(kelasKejuaraanId as string) : null;

    if (isNaN(kompetisiId)) {
      return sendError(res, 'ID kompetisi tidak valid', 400);
    }

    if (!kelasId || isNaN(kelasId)) {
      return sendError(res, 'ID kelas kejuaraan diperlukan untuk export PDF', 400);
    }

    // Get bracket data
    const bracket = await BracketService.getBracket(kompetisiId, kelasId);
    
    if (!bracket) {
      return sendError(res, 'Bagan tidak ditemukan', 404);
    }

    // Get competition and class info
    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
      include: {
        penyelenggara: true
      }
    });

    const kelas = await prisma.tb_kelas_kejuaraan.findUnique({
      where: { id_kelas_kejuaraan: kelasId },
      include: {
        kategori_event: true,
        kelompok: true,
        kelas_berat: true,
        poomsae: true
      }
    });

    if (!kompetisi || !kelas) {
      return sendError(res, 'Data kompetisi atau kelas tidak ditemukan', 404);
    }

    // Generate PDF
    const pdfBuffer = await KompetisiController.generateBracketPDF(kompetisi, kelas, bracket);

    // Set response headers for PDF download
    const fileName = `Bagan-${kompetisi.nama_event}-${kelas.kategori_event.nama_kategori}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Controller - Error exporting bracket PDF:', error);
    return sendError(res, error.message || 'Gagal export bagan ke PDF', 400);
  }
}

// ==========================================
// ADD THESE METHODS TO kompetisiController.ts
// Place them AFTER exportBracketToPdf method
// ==========================================

/**
 * Clear all match results (reset scores)
 */
static async clearBracketResults(req: Request, res: Response) {
  try {
    const { id, kelasKejuaraanId } = req.params;

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    // Verify competition exists and user has access
    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
      include: {
        admin: true,
        kelas_kejuaraan: {
          where: { id_kelas_kejuaraan: kelasId }
        }
      }
    });

    if (!kompetisi) {
      return sendError(res, 'Kompetisi tidak ditemukan', 404);
    }

    if (kompetisi.kelas_kejuaraan.length === 0) {
      return sendError(res, 'Kelas kejuaraan tidak ditemukan dalam kompetisi ini', 404);
    }

    // Authorization check
    if (user.role === 'ADMIN_KOMPETISI') {
      const isAdminOfThisKompetisi = kompetisi.admin.some(
        admin => admin.id_akun === user.id_akun
      );
      if (!isAdminOfThisKompetisi) {
        return sendError(res, 'Anda tidak memiliki akses untuk mereset hasil di kompetisi ini', 403);
      }
    } else if (user.role !== 'ADMIN') {
      return sendError(res, 'Tidak memiliki akses untuk mereset hasil pertandingan', 403);
    }

    // Clear match results
    const result = await BracketService.clearMatchResults(kompetisiId, kelasId);

    return sendSuccess(res, result, result.message);
  } catch (error: any) {
    console.error('Controller - Error clearing bracket results:', error);
    return sendError(res, error.message || 'Gagal mereset hasil pertandingan', 400);
  }
}

/**
 * Delete entire bracket (permanent deletion)
 */
static async deleteBracket(req: Request, res: Response) {
  try {
    const { id, kelasKejuaraanId } = req.params;

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // Check authorization
    const user = req.user;
    if (!user) {
      return sendError(res, 'User tidak ditemukan', 401);
    }

    // Verify competition exists and user has access
    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
      include: {
        admin: true,
        kelas_kejuaraan: {
          where: { id_kelas_kejuaraan: kelasId }
        }
      }
    });

    if (!kompetisi) {
      return sendError(res, 'Kompetisi tidak ditemukan', 404);
    }

    if (kompetisi.kelas_kejuaraan.length === 0) {
      return sendError(res, 'Kelas kejuaraan tidak ditemukan dalam kompetisi ini', 404);
    }

    // Authorization check
    if (user.role === 'ADMIN_KOMPETISI') {
      const isAdminOfThisKompetisi = kompetisi.admin.some(
        admin => admin.id_akun === user.id_akun
      );
      if (!isAdminOfThisKompetisi) {
        return sendError(res, 'Anda tidak memiliki akses untuk menghapus bracket di kompetisi ini', 403);
      }
    } else if (user.role !== 'ADMIN') {
      return sendError(res, 'Tidak memiliki akses untuk menghapus bracket', 403);
    }

    // Extra validation for SELESAI status - requires double confirmation from frontend
    if (kompetisi.status === 'SELESAI') {
      console.log('⚠️ Attempting to delete bracket for SELESAI competition - requires confirmation');
      // Frontend should handle double confirmation before calling this
    }

    // Delete bracket
    const result = await BracketService.deleteBracket(kompetisiId, kelasId);

    return sendSuccess(res, result, result.message);
  } catch (error: any) {
    console.error('Controller - Error deleting bracket:', error);
    return sendError(res, error.message || 'Gagal menghapus bracket', 400);
  }
}

/**
 * Generate PDF for bracket
 */
static async generateBracketPDF(kompetisi: any, kelas: any, bracket: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(`BAGAN TURNAMEN`, { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(14);
      doc.text(`${kompetisi.nama_event}`, { align: 'center' });
      doc.moveDown(0.3);
      
      doc.fontSize(12);
      doc.text(`${kelas.kategori_event.nama_kategori}`, { align: 'center' });
      
      if (kelas.kelompok) {
        doc.text(`Kelompok Usia: ${kelas.kelompok.nama_kelompok}`, { align: 'center' });
      }
      
      if (kelas.kelas_berat) {
        doc.text(`Kelas Berat: ${kelas.kelas_berat.nama_kelas}`, { align: 'center' });
      }
      
      doc.moveDown(1);

      // Draw bracket
      KompetisiController.drawBracketOnPDF(doc, bracket);

      // Footer
      doc.fontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 50, doc.page.height - 30);
      doc.text(`Total Participants: ${bracket.participants.length}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw bracket structure on PDF
 */
static drawBracketOnPDF(doc: any, bracket: any) {
  const pageWidth = doc.page.width - 100; // Account for margins
  const pageHeight = doc.page.height - 150; // Account for title and margins
  
  const rounds = bracket.totalRounds;
  const roundWidth = pageWidth / rounds;
  
  // Group matches by round
  const matchesByRound: any = {};
  bracket.matches.forEach((match: any) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  // Draw each round
  for (let round = 1; round <= rounds; round++) {
    const roundMatches = matchesByRound[round] || [];
    const x = 50 + (round - 1) * roundWidth;
    const matchHeight = pageHeight / Math.max(roundMatches.length, 1);
    
    // Round title
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Round ${round}`, x, 130);
    
    // Draw matches
    roundMatches.forEach((match: any, index: number) => {
      const y = 150 + (index * matchHeight);
      
      doc.fontSize(8).font('Helvetica');
      
      // Match box
      doc.rect(x, y, roundWidth - 10, Math.min(matchHeight - 5, 80)).stroke();
      
      // Participant 1
      const p1Name = match.participant1 ? 
        (match.participant1.name.length > 20 ? match.participant1.name.substring(0, 20) + '...' : match.participant1.name) : 
        'TBD';
      doc.text(p1Name, x + 5, y + 5);
      
      // Score 1
      if (match.scoreA !== undefined) {
        doc.text(match.scoreA.toString(), x + roundWidth - 25, y + 5);
      }
      
      // Participant 2
      const p2Name = match.participant2 ? 
        (match.participant2.name.length > 20 ? match.participant2.name.substring(0, 20) + '...' : match.participant2.name) : 
        'TBD';
      doc.text(p2Name, x + 5, y + 20);
      
      // Score 2
      if (match.scoreB !== undefined) {
        doc.text(match.scoreB.toString(), x + roundWidth - 25, y + 20);
      }
      
      // Winner indicator
      if (match.winner) {
        doc.font('Helvetica-Bold');
        doc.text('★', x + roundWidth - 15, y + 35);
        doc.font('Helvetica');
      }
      
      // Match status
      if (match.status === 'completed') {
        doc.fillColor('green').text('✓', x + 5, y + 35);
      } else if (match.status === 'ongoing') {
        doc.fillColor('orange').text('●', x + 5, y + 35);
      } else {
        doc.fillColor('gray').text('○', x + 5, y + 35);
      }
      doc.fillColor('black');
    });
  }
}

/**
 * Conduct draw (legacy method - kept for compatibility)
 */
static async conductDraw(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { kelasKejuaraanId } = req.body;

    const kompetisiId = parseInt(id);
    const kelasId = parseInt(kelasKejuaraanId);

    if (isNaN(kompetisiId) || isNaN(kelasId)) {
      return sendError(res, 'Parameter tidak valid', 400);
    }

    // This is essentially the same as generateBrackets
    const bracket = await BracketService.generateBracket(kompetisiId, kelasId);

    return sendSuccess(res, bracket, 'Drawing berhasil dilakukan', 201);
  } catch (error: any) {
    console.error('Controller - Error conducting draw:', error);
    return sendError(res, error.message || 'Gagal melakukan drawing', 400);
  }
}

}

