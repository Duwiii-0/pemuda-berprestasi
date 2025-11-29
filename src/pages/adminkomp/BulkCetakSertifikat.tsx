import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { generateCertificatePdfBytes, getKelasKejuaraan } from '../../utils/pdfGenerators';
import type { MedalStatus } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';
import { Award, Loader, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkCetakSertifikat: React.FC = () => {
  const { user } = useAuth();
  const { 
    pesertaList, 
    fetchAtletByKompetisi, 
    loadingAtlet, 
    atletPagination, 
    setAtletPage, 
    setAtletLimit,
    allPesertaList,
    fetchAllAtletByKompetisi 
  } = useKompetisi();
  
  const [dojangs, setDojangs] = useState<{ id: number; name: string }[]>([]);
  const [kelasKejuaraan, setKelasKejuaraan] = useState<{ id: string; name: string }[]>([]);
  const [selectedDojang, setSelectedDojang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;

  // Load initial data on mount
  useEffect(() => {
    if (kompetisiId) {
      console.log('🔄 Initial load: Fetching athletes...');
      fetchAtletByKompetisi(kompetisiId, undefined, undefined, undefined, "APPROVED");
    }
  }, [kompetisiId]);

  // Load all data for filter options
  useEffect(() => {
    if (kompetisiId) {
      fetchAllAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId]);

  // Fetch when filters change
  useEffect(() => {
    if (kompetisiId && (selectedDojang !== "ALL" || selectedKelas !== "ALL")) {
      console.log(`🔄 Applying filters: dojang=${selectedDojang}, kelas=${selectedKelas}`);
      setAtletPage(1); // Reset to page 1
      fetchAtletByKompetisi(
        kompetisiId, 
        undefined, 
        selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), 
        selectedKelas === "ALL" ? undefined : selectedKelas,
        "APPROVED"
      );
    }
  }, [selectedDojang, selectedKelas]);

  // Fetch when pagination changes
  useEffect(() => {
    if (kompetisiId && atletPagination.page > 1) {
      console.log(`🔄 Loading page ${atletPagination.page}...`);
      fetchAtletByKompetisi(
        kompetisiId, 
        undefined, 
        selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), 
        selectedKelas === "ALL" ? undefined : selectedKelas,
        "APPROVED"
      );
    }
  }, [atletPagination.page]);

  // Build filter options from allPesertaList
  useEffect(() => {
    if (allPesertaList.length > 0) {
      const dojangSet = new Map<number, string>();
      const kelasSet = new Map<string, string>();

      allPesertaList.forEach((peserta: any) => {
        if (peserta.atlet?.dojang && peserta.status === "APPROVED") {
          dojangSet.set(peserta.atlet.dojang.id_dojang, peserta.atlet.dojang.nama_dojang);
        }
        if (peserta.kelas_kejuaraan && peserta.status === "APPROVED") {
          const kelas = peserta.kelas_kejuaraan;
          const kelasName = `${kelas.kategori_event.nama_kategori} - ${kelas.kelompok.nama_kelompok} - ${kelas.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri"} ${kelas.kelas_berat ? `- ${kelas.kelas_berat.nama_kelas}` : ''}${kelas.poomsae ? `- ${kelas.poomsae.nama_kelas}` : ''}`;
          kelasSet.set(kelas.id_kelas_kejuaraan, kelasName);
        }
      });

      setDojangs(Array.from(dojangSet, ([id, name]) => ({ id, name })));
      setKelasKejuaraan(Array.from(kelasSet, ([id, name]) => ({ id, name })));
      
      console.log(`📊 Filter options: ${dojangSet.size} dojangs, ${kelasSet.size} kelas`);
    }
  }, [allPesertaList]);

  const currentPage = atletPagination.page;
  const totalPages = atletPagination.totalPages;
  const itemsPerPage = atletPagination.limit;

  // Pagination helper
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const handleBulkDownload = async () => {
    if (pesertaList.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    const toastId = toast.loading(`Generating ${pesertaList.length} certificates...`);
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();
      let successCount = 0;
      let errorCount = 0;

      for (const peserta of pesertaList) {
        if (!peserta.atlet) continue;
        try {
          const medalStatus: MedalStatus = "PARTICIPANT"; 
          const kelasName = getKelasKejuaraan(peserta, pesertaList);

          const pdfBytes = await generateCertificatePdfBytes(peserta.atlet, medalStatus, kelasName);
          const pdfToMerge = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          successCount++;
        } catch (error) {
          console.error(`Failed to generate certificate for ${peserta.atlet.nama_atlet}:`, error);
          errorCount++;
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificates-Bulk-Page${currentPage}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${successCount} certificates generated! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`, { id: toastId });
    } catch (error) {
      console.error("Failed to generate bulk certificates:", error);
      toast.error("Failed to generate certificates", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkPrint = () => {
    toast('Print functionality coming soon!');
  };

  if (loadingAtlet && pesertaList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat data peserta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
              }}
            >
              <Award 
                size={32} 
                className="sm:w-8 sm:h-8" 
                style={{ color: 'white' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1" style={{ color: '#050505' }}>
                BULK CETAK SERTIFIKAT
              </h1>
              <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
                Generate sertifikat untuk peserta yang sudah disetujui
              </p>
            </div>
          </div>
        </div>

        {/* FILTERS & ACTIONS */}
        <div 
          className="rounded-2xl shadow-md border p-6 mb-6"
          style={{ 
            backgroundColor: 'white', 
            borderColor: 'rgba(153, 13, 53, 0.1)'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Filter Dojang */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Filter by Dojang
              </label>
              <select
                value={selectedDojang}
                onChange={(e) => setSelectedDojang(e.target.value)}
                disabled={loadingAtlet}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: 'rgba(153, 13, 53, 0.2)',
                  color: '#050505'
                }}
              >
                <option value="ALL">Semua Dojang</option>
                {dojangs.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Kelas */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Filter by Kelas
              </label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                disabled={loadingAtlet}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: 'rgba(153, 13, 53, 0.2)',
                  color: '#050505'
                }}
              >
                <option value="ALL">Semua Kelas</option>
                {kelasKejuaraan.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Items per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => setAtletLimit(parseInt(e.target.value))}
                disabled={loadingAtlet}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: 'rgba(153, 13, 53, 0.2)',
                  color: '#050505'
                }}
              >
                <option value={21}>21</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={handleBulkPrint}
              disabled={isGenerating || pesertaList.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'white',
                color: '#050505',
                border: '1px solid rgba(153, 13, 53, 0.2)'
              }}
            >
              <Printer size={18} />
              Print
            </button>
            <button
              type="button"
              onClick={handleBulkDownload}
              disabled={isGenerating || loadingAtlet || pesertaList.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: isGenerating ? '#7A0A2B' : 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
              }}
            >
              <Download size={18} />
              {isGenerating ? `Generating...` : `Download ${pesertaList.length} Sertifikat (Page ${currentPage})`}
            </button>
          </div>
        </div>

        {/* PESERTA LIST */}
        <div 
          className="rounded-2xl shadow-md border p-6"
          style={{ 
            backgroundColor: 'white', 
            borderColor: 'rgba(153, 13, 53, 0.1)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#050505' }}>
              Peserta yang Disetujui ({atletPagination.total})
            </h2>
            <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {/* Grid List */}
          {loadingAtlet ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
            </div>
          ) : pesertaList.length === 0 ? (
            <div className="text-center py-12">
              <Award size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
              <p style={{ color: '#050505', opacity: 0.6 }}>
                Tidak ada peserta yang disetujui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {pesertaList.map((peserta, idx) => (
                <div
                  key={peserta.id_peserta_kompetisi || idx}
                  className="rounded-xl border p-4 hover:shadow-md transition-all"
                  style={{ 
                    backgroundColor: '#F5FBEF',
                    borderColor: 'rgba(153, 13, 53, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
                    >
                      <Award size={20} style={{ color: 'white' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm mb-1 truncate" style={{ color: '#050505' }}>
                        {peserta.atlet?.nama_atlet || 'N/A'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#050505', opacity: 0.6 }}>
                        {peserta.atlet?.dojang?.nama_dojang || 'N/A'}
                      </p>
                      {peserta.kelas_kejuaraan && (
                        <p className="text-xs mt-1 truncate" style={{ color: '#990D35' }}>
                          {peserta.kelas_kejuaraan.kategori_event?.nama_kategori}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
              <button
                onClick={() => setAtletPage(currentPage - 1)}
                disabled={currentPage === 1 || loadingAtlet}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                style={{ color: '#990D35' }}
              >
                <ChevronLeft size={20} />
              </button>

              {getPageNumbers().map((pageNum, idx) => (
                <React.Fragment key={idx}>
                  {pageNum === '...' ? (
                    <span className="px-2" style={{ color: '#050505', opacity: 0.3 }}>...</span>
                  ) : (
                    <button
                      onClick={() => setAtletPage(pageNum as number)}
                      disabled={loadingAtlet}
                      className="w-10 h-10 rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: currentPage === pageNum ? '#990D35' : 'transparent',
                        color: currentPage === pageNum ? 'white' : '#050505',
                        opacity: currentPage === pageNum ? 1 : 0.6
                      }}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}

              <button
                onClick={() => setAtletPage(currentPage + 1)}
                disabled={currentPage === totalPages || loadingAtlet}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                style={{ color: '#990D35' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BulkCetakSertifikat;