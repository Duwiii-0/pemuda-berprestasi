import { useState, useEffect, useContext } from "react";
import { Download, Eye, Award, AlertCircle, CheckCircle } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useAuth } from "../context/authContext";
import { useKompetisi } from "../context/KompetisiContext";

interface Atlet {
  id_atlet?: number;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  pas_foto_path?: string;
  dojang_name?: string;
  kelas_berat?: string;
  belt?: string;
  dojang?: {
    id_dojang?: number;
    nama_dojang?: string;
    kota?: string;
    provinsi?: string;
  };
  peserta_kompetisi?: Array<{
    id_peserta_kompetisi?: number;
    status?: string;
    ranking?: number;
    kelas_kejuaraan?: {
      id_kelas_kejuaraan?: number;
      cabang?: string;
      kelompok?: {
        id_kelompok?: number;
        nama_kelompok?: string;
        usia_min?: number;
        usia_max?: number;
      };
      kelas_berat?: {
        nama_kelas?: string;
      };
      poomsae?: {
        nama_kelas?: string;
      };
      kategori_event?: {
        nama_kategori?: string;
      };
      jenis_kelamin?: string;
      kompetisi?: {
        id_kompetisi?: number;
        nama_event?: string;
      };
    };
  }>;
}

interface CertificateGeneratorProps {
  atlet: Atlet;
  isEditing: boolean;
}

interface CertificateStatus {
  [id_peserta_kompetisi: number]: {
    generated: boolean;
    pdfBlob: Blob | null;
    isGenerating: boolean;
    showPreview: boolean;
    previewUrl: string;
  };
}

interface MedalStatus {
  status: "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT";
  kelasName: string;
}

const COORDS_MM = {
  nama: {
    y: 140, // Posisi vertikal nama atlet dari atas (diturunkan dari 115)
    fontSize: 24,
  },
  achievement: {
    y: 158, // Posisi vertikal achievement dari atas (diturunkan dari 135)
    fontSize: 14,
  },
};

export const CertificateGenerator = ({ atlet, isEditing }: CertificateGeneratorProps) => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi } = useKompetisi();

  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus>({});
  const [medalStatuses, setMedalStatuses] = useState<{ [id_peserta: number]: MedalStatus }>({});
  const [loadingMedals, setLoadingMedals] = useState(false);

  // Fetch medal statuses saat component mount
  useEffect(() => {
    if (atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0) {
      fetchMedalStatuses();
    }
  }, [atlet.peserta_kompetisi, pesertaList]);

  // ✅ Auto-fetch pesertaList jika belum ada
  useEffect(() => {
    const kompetisiId = user?.admin_kompetisi?.id_kompetisi;
    
    if (kompetisiId && (!pesertaList || pesertaList.length === 0)) {
      console.log("🔄 Auto-fetching pesertaList for Certificate...");
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [user, pesertaList]);

  const fetchMedalStatuses = async () => {
    setLoadingMedals(true);
    try {
      const approvedPeserta = atlet.peserta_kompetisi?.filter(p => p.status === 'APPROVED') || [];
      
      // Group by kompetisi
      const byKompetisi: { [id_kompetisi: number]: any[] } = {};
      approvedPeserta.forEach(p => {
        const kompetisiId = p.kelas_kejuaraan?.kompetisi?.id_kompetisi;
        if (kompetisiId) {
          if (!byKompetisi[kompetisiId]) byKompetisi[kompetisiId] = [];
          byKompetisi[kompetisiId].push(p);
        }
      });

      const newMedalStatuses: { [id_peserta: number]: MedalStatus } = {};

      // Fetch medal tally for each kompetisi
      for (const [kompetisiId, pesertaList] of Object.entries(byKompetisi)) {
        try {
          const timestamp = `?_t=${Date.now()}`;
          const response = await fetch(`/api/public/kompetisi/${kompetisiId}/medal-tally${timestamp}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });
          
          if (!response.ok) continue;

          const result = await response.json();
          if (!result.success) continue;

          const kelasList = result.data.kelas || [];

          // Check each peserta
          pesertaList.forEach((peserta: any) => {
            const kelasData = kelasList.find(
              (k: any) => k.id_kelas_kejuaraan === peserta.kelas_kejuaraan?.id_kelas_kejuaraan
            );

            if (!kelasData?.bracket?.matches?.length) {
              // No bracket = participant only
              newMedalStatuses[peserta.id_peserta_kompetisi!] = {
                status: "PARTICIPANT",
                kelasName: getKelasKejuaraan(peserta)
              };
              return;
            }

            // Detect medal from bracket using same logic as MedalTallyPage
            const isPemula = kelasData.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
            const medalStatus = detectMedalFromBracket(
              kelasData.bracket.matches,
              peserta.id_peserta_kompetisi!,
              isPemula
            );

            newMedalStatuses[peserta.id_peserta_kompetisi!] = {
              status: medalStatus,
              kelasName: getKelasKejuaraan(peserta)
            };
          });
        } catch (error) {
          console.error(`Error fetching medal tally for kompetisi ${kompetisiId}:`, error);
        }
      }

      setMedalStatuses(newMedalStatuses);

    } catch (error) {
      console.error('Error fetching medal statuses:', error);
    } finally {
      setLoadingMedals(false);
    }
  };

  const detectMedalFromBracket = (
    matches: any[],
    id_peserta: number,
    isPemula: boolean
  ): "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT" => {
    if (!matches || matches.length === 0) return "PARTICIPANT";

    const totalRounds = Math.max(...matches.map((m: any) => m.round));

    if (isPemula) {
      // PEMULA logic (same as MedalTallyPage)
      const round1Matches = matches.filter((m: any) => m.round === 1);
      const round2Matches = matches.filter((m: any) => m.round === 2);
      const hasAdditionalMatch = round2Matches.length > 0;

      if (hasAdditionalMatch) {
        // GANJIL
        const additionalMatch = round2Matches[0];
        if (additionalMatch.scoreA > 0 || additionalMatch.scoreB > 0) {
          const winnerId = additionalMatch.scoreA > additionalMatch.scoreB
            ? additionalMatch.participant1?.id
            : additionalMatch.participant2?.id;
          const loserId = additionalMatch.scoreA > additionalMatch.scoreB
            ? additionalMatch.participant2?.id
            : additionalMatch.participant1?.id;

          if (winnerId === id_peserta) return "GOLD";
          if (loserId === id_peserta) return "SILVER";
        }

        // Check bronze (last match loser in round 1)
        const lastRound1Match = round1Matches[round1Matches.length - 1];
        if (lastRound1Match && (lastRound1Match.scoreA > 0 || lastRound1Match.scoreB > 0)) {
          const loserId = lastRound1Match.scoreA > lastRound1Match.scoreB
            ? lastRound1Match.participant2?.id
            : lastRound1Match.participant1?.id;
          if (loserId === id_peserta) return "BRONZE";
        }

        // Check other round 1 matches for medals
        for (const match of round1Matches.slice(0, -1)) {
          if (match.scoreA > 0 || match.scoreB > 0) {
            const winnerId = match.scoreA > match.scoreB
              ? match.participant1?.id
              : match.participant2?.id;
            const loserId = match.scoreA > match.scoreB
              ? match.participant2?.id
              : match.participant1?.id;

            if (winnerId === id_peserta) return "GOLD";
            if (loserId === id_peserta) return "SILVER";
          }
        }
      } else {
        // GENAP
        for (const match of round1Matches) {
          if (match.scoreA > 0 || match.scoreB > 0) {
            const winnerId = match.scoreA > match.scoreB
              ? match.participant1?.id
              : match.participant2?.id;
            const loserId = match.scoreA > match.scoreB
              ? match.participant2?.id
              : match.participant1?.id;

            if (winnerId === id_peserta) return "GOLD";
            if (loserId === id_peserta) return "SILVER";
          }
        }
      }
    } else {
      // PRESTASI logic (same as MedalTallyPage)
      const finalMatch = matches.find((m: any) => m.round === totalRounds);
      if (finalMatch && (finalMatch.scoreA > 0 || finalMatch.scoreB > 0)) {
        const winnerId = finalMatch.scoreA > finalMatch.scoreB
          ? finalMatch.participant1?.id
          : finalMatch.participant2?.id;
        const loserId = finalMatch.scoreA > finalMatch.scoreB
          ? finalMatch.participant2?.id
          : finalMatch.participant1?.id;

        if (winnerId === id_peserta) return "GOLD";
        if (loserId === id_peserta) return "SILVER";
      }

      // Check semi-final for bronze
      const semiRound = totalRounds - 1;
      const semiMatches = matches.filter((m: any) => m.round === semiRound);
      for (const match of semiMatches) {
        if (match.scoreA > 0 || match.scoreB > 0) {
          const loserId = match.scoreA > match.scoreB
            ? match.participant2?.id
            : match.participant1?.id;
          if (loserId === id_peserta) return "BRONZE";
        }
      }
    }

    return "PARTICIPANT";
  };

  const getKelasKejuaraan = (peserta: any): string => {
    if (!peserta.kelas_kejuaraan) return "-";

    console.log("🔍 getKelasKejuaraan - Input peserta:", peserta);
    
    // ✅ CARI DATA LENGKAP DARI CONTEXT pesertaList
    let kelasData = peserta.kelas_kejuaraan;
    
    if (pesertaList && pesertaList.length > 0) {
      const fullPesertaData = pesertaList.find((p: any) => {
        const match1 = p.id_peserta_kompetisi === peserta.id_peserta_kompetisi;
        const match2 = p.id_atlet === atlet.id_atlet && p.status === 'APPROVED';
        return match1 || match2;
      });
      
      console.log("🔍 Search result from pesertaList:", fullPesertaData);
      
      if (fullPesertaData?.kelas_kejuaraan) {
        const hasCompleteRelations = 
          fullPesertaData.kelas_kejuaraan.kelompok || 
          fullPesertaData.kelas_kejuaraan.kelas_berat ||
          fullPesertaData.kelas_kejuaraan.poomsae;
        
        if (hasCompleteRelations) {
          console.log("✅ Using COMPLETE data from pesertaList context");
          kelasData = fullPesertaData.kelas_kejuaraan;
        }
      }
    }

    console.log("📚 Final kelas data to use:", kelasData);

    const cabang = kelasData.cabang || "";
    const kelompokUsia = kelasData.kelompok?.nama_kelompok || "";
    const jenisKelamin = kelasData.jenis_kelamin?.toLowerCase() === 'laki_laki' ? 'Male' : (kelasData.jenis_kelamin?.toLowerCase() === 'perempuan' ? 'Female' : '');
    
    let kelasDetail = "";
    if (cabang === "KYORUGI" && kelasData.kelas_berat?.nama_kelas) {
      kelasDetail = kelasData.kelas_berat.nama_kelas;
    } else if (cabang === "POOMSAE" && kelasData.poomsae?.nama_kelas) {
      kelasDetail = kelasData.poomsae.nama_kelas;
    }
    
    console.log("📋 Extracted data:", {
      cabang,
      kelompokUsia,
      jenisKelamin,
      kelasDetail
    });
    
    const parts = [];
    if (cabang) parts.push(cabang);
    if (kelompokUsia && kelompokUsia.toLowerCase() !== 'pemula') {
      parts.push(kelompokUsia);
    }
    if (kelasDetail) {
      parts.push(kelasDetail);
    }
    if (jenisKelamin) {
      parts.push(jenisKelamin);
    }
    
    const result = parts.join(" ") || "-";
    console.log("✅ FINAL Kelas Info:", result);
    
    return result;
  };

  const getMedalText = (medalStatus: "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT"): string => {
    switch (medalStatus) {
      case "GOLD": return "First Winner";
      case "SILVER": return "Second Winner";
      case "BRONZE": return "Third Winner";
      case "PARTICIPANT": return "Participant";
    }
  };

  const generateCertificate = async (peserta: any) => {
    const pesertaId = peserta.id_peserta_kompetisi;
    if (!pesertaId) return;

    setCertificateStatus(prev => ({
      ...prev,
      [pesertaId]: {
        ...prev[pesertaId],
        isGenerating: true
      }
    }));

    try {
      const medalStatus = medalStatuses[pesertaId];
      if (!medalStatus) {
        throw new Error('Medal status not found');
      }

      // Generate PDF using piagam.pdf template
      const templatePath = `/templates/piagam.pdf`;
      const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
      const helvetica = await pdfDoc.embedFont('Helvetica');
      const mmToPt = (mm: number) => mm * 2.83465;
      const textColor = rgb(0, 0, 0); // Black text

      // Nama Atlet (centered)
      const namaText = atlet.nama_atlet.toUpperCase();
      const namaWidth = helveticaBold.widthOfTextAtSize(namaText, COORDS_MM.nama.fontSize);
      firstPage.drawText(namaText, {
        x: (pageWidth - namaWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM.nama.y),
        size: COORDS_MM.nama.fontSize,
        font: helveticaBold,
        color: textColor,
      });

      // Achievement Text (centered)
      const achievementText = `${getMedalText(medalStatus.status)} ${medalStatus.kelasName}`;
      const achievementWidth = helvetica.widthOfTextAtSize(achievementText, COORDS_MM.achievement.fontSize);
      firstPage.drawText(achievementText, {
        x: (pageWidth - achievementWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM.achievement.y),
        size: COORDS_MM.achievement.fontSize,
        font: helvetica,
        color: textColor,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Download
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Piagam-${getMedalText(medalStatus.status).replace(/\s/g, "-")}-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`;
      link.download = fileName;
      link.click();

      setCertificateStatus(prev => ({
        ...prev,
        [pesertaId]: {
          generated: true,
          pdfBlob: blob,
          isGenerating: false,
          showPreview: false,
          previewUrl: url
        }
      }));

    } catch (error: any) {
      console.error('Error generating certificate:', error);
      alert('Gagal generate Certificate: ' + error.message);
      
      setCertificateStatus(prev => ({
        ...prev,
        [pesertaId]: {
          ...prev[pesertaId],
          isGenerating: false
        }
      }));
    }
  };

  const handlePreview = (pesertaId: number) => {
    const status = certificateStatus[pesertaId];
    if (status?.pdfBlob) {
      const url = URL.createObjectURL(status.pdfBlob);
      setCertificateStatus(prev => ({
        ...prev,
        [pesertaId]: {
          ...prev[pesertaId],
          showPreview: true,
          previewUrl: url
        }
      }));
    }
  };

  const handleDownloadAgain = (pesertaId: number) => {
    const status = certificateStatus[pesertaId];
    const medalStatus = medalStatuses[pesertaId];
    if (status?.pdfBlob && medalStatus) {
      const url = URL.createObjectURL(status.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Piagam-${getMedalText(medalStatus.status).replace(/\s/g, "-")}-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const approvedPeserta = atlet.peserta_kompetisi?.filter(p => p.status === 'APPROVED') || [];

  if (loadingMedals) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
        <div className="text-center py-8">
          <Award size={48} className="mx-auto mb-4 animate-spin" style={{ color: '#990D35' }} />
          <p className="text-sm font-medium" style={{ color: '#050505' }}>
            Loading medal statuses...
          </p>
        </div>
      </div>
    );
  }

  if (approvedPeserta.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
        <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide mb-4">
          PIAGAM PENGHARGAAN
        </h3>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-800 font-semibold text-sm">
                Belum Ada Kompetisi
              </p>
              <p className="text-yellow-700 text-sm">
                Atlet belum terdaftar dalam kompetisi atau belum disetujui
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
      <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide mb-6">
        PIAGAM PENGHARGAAN
      </h3>

      {/* List Kelas Kejuaraan */}
      <div className="space-y-4">
        {approvedPeserta.map((peserta) => {
          const pesertaId = peserta.id_peserta_kompetisi!;
          const status = certificateStatus[pesertaId];
          const medalStatus = medalStatuses[pesertaId];
          const kelasName = getKelasKejuaraan(peserta);
          const eventName = peserta.kelas_kejuaraan?.kompetisi?.nama_event || "Unknown Event";

          return (
            <div
              key={pesertaId}
              className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-base text-black/80 mb-1">
                    {eventName}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {kelasName}
                  </p>
                  {medalStatus && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          medalStatus.status === "GOLD"
                            ? "bg-yellow-400 text-yellow-900"
                            : medalStatus.status === "SILVER"
                            ? "bg-gray-300 text-gray-800"
                            : medalStatus.status === "BRONZE"
                            ? "bg-orange-400 text-orange-900"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                                              {medalStatus.status === "GOLD" && "🥇 First Winner"}
                                              {medalStatus.status === "SILVER" && "🥈 Second"}
                                              {medalStatus.status === "BRONZE" && "🥉 Third"}
                                              {medalStatus.status === "PARTICIPANT" && "📋 Participant"}                      </span>
                    </div>
                  )}
                </div>

                {status?.generated && (
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      Tersedia
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div className="flex gap-2 flex-wrap">
                  {!status?.generated ? (
                    <button
                      onClick={() => generateCertificate(peserta)}
                      disabled={status?.isGenerating || !medalStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Award size={16} />
                      {status?.isGenerating ? "Generating..." : "Generate Piagam"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePreview(pesertaId)}
                        disabled={status?.isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-lg disabled:opacity-50"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownloadAgain(pesertaId)}
                        disabled={status?.isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-lg disabled:opacity-50"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Preview Modal */}
              {status?.showPreview && status.previewUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bebas text-2xl text-black/80">Preview Piagam</h4>
                      <button
                        onClick={() => setCertificateStatus(prev => ({
                          ...prev,
                          [pesertaId]: {
                            ...prev[pesertaId],
                            showPreview: false
                          }
                        }))}
                        className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="flex justify-center">
                      <iframe
                        src={status.previewUrl}
                        className="w-full h-[70vh] border-2 border-gray-300 rounded-lg"
                        title="Certificate Preview"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificateGenerator;