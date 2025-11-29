import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { generateIdCardPdfBytes } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';
import { CreditCard, Loader, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkGenerateIDCard: React.FC = () => {
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
  const [selectedAtlets, setSelectedAtlets] = useState<Set<number>>(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  // Fetch when filters change (FIXED: Gabungan filter)
  useEffect(() => {
    if (kompetisiId) {
      console.log(`🔄 Applying filters: dojang=${selectedDojang}, kelas=${selectedKelas}`);
      setAtletPage(1); // Reset to page 1
      setSelectedAtlets(new Set()); // Clear selection when filter changes
      fetchAtletByKompetisi(
        kompetisiId, 
        undefined, 
        selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), 
        selectedKelas === "ALL" ? undefined : selectedKelas,
        "APPROVED"
      );
    }
  }, [selectedDojang, selectedKelas, kompetisiId]);

  // Fetch when pagination changes (FIXED: Includes limit)
  useEffect(() => {
    if (kompetisiId) {
      console.log(`🔄 Loading page ${atletPagination.page}, limit ${atletPagination.limit}...`);
      setSelectedAtlets(new Set()); // Clear selection when page changes
      fetchAtletByKompetisi(
        kompetisiId, 
        undefined, 
        selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), 
        selectedKelas === "ALL" ? undefined : selectedKelas,
        "APPROVED"
      );
    }
  }, [atletPagination.page, atletPagination.limit, kompetisiId]);

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

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedAtlets.size === pesertaList.length) {
      setSelectedAtlets(new Set());
    } else {
      const allIds = new Set(pesertaList.map(p => p.id_peserta_kompetisi));
      setSelectedAtlets(allIds);
    }
  };

  const handleSelectAtlet = (id: number) => {
    const newSelected = new Set(selectedAtlets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAtlets(newSelected);
  };

  const isAllSelected = pesertaList.length > 0 && selectedAtlets.size === pesertaList.length;

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
    // Determine which athletes to generate
    const atletToGenerate = selectedAtlets.size > 0 
      ? pesertaList.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : pesertaList;

    if (atletToGenerate.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    const toastId = toast.loading(`Generating ${atletToGenerate.length} ID cards...`);
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();
      let successCount = 0;
      let errorCount = 0;

      for (const peserta of atletToGenerate) {
        if (!peserta.atlet) continue;
        try {
          const pdfBytes = await generateIdCardPdfBytes(peserta.atlet, pesertaList);
          const pdfToMerge = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          successCount++;
        } catch (error) {
          console.error(`Failed to generate ID card for ${peserta.atlet.nama_atlet}:`, error);
          errorCount++;
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ID-Cards-Bulk-Page${currentPage}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${successCount} ID cards generated! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`, { id: toastId });
    } catch (error) {
      console.error("Failed to generate bulk ID cards:", error);
      toast.error("Failed to generate ID cards", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPreview = () => {
    const atletToPreview = selectedAtlets.size > 0 
      ? pesertaList.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : pesertaList;

    if (atletToPreview.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    setShowPrintPreview(true);
  };

  const handlePrint = async () => {
    const atletToPrint = selectedAtlets.size > 0 
      ? pesertaList.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : pesertaList;

    if (atletToPrint.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    const toastId = toast.loading(`Preparing ${atletToPrint.length} ID cards for printing...`);
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const peserta of atletToPrint) {
        if (!peserta.atlet) continue;
        try {
          const pdfBytes = await generateIdCardPdfBytes(peserta.atlet, pesertaList);
          const pdfToMerge = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`Failed to generate ID card for ${peserta.atlet.nama_atlet}:`, error);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      URL.revokeObjectURL(url);
      toast.success('Print dialog opened!', { id: toastId });
    } catch (error) {
      console.error("Failed to prepare print:", error);
      toast.error("Failed to prepare print", { id: toastId });
    } finally {
      setIsGenerating(false);
      setShowPrintPreview(false);
    }
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
              <CreditCard 
                size={32} 
                className="sm:w-8 sm:h-8" 
                style={{ color: 'white' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1" style={{ color: '#050505' }}>
                BULK GENERATE ID CARD
              </h1>
              <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
                Generate ID card untuk peserta yang sudah disetujui
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
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="text-sm" style={{ color: '#050505', opacity: 0.7 }}>
              {selectedAtlets.size > 0 ? (
                <span className="font-medium" style={{ color: '#990D35' }}>
                  {selectedAtlets.size} dipilih dari {pesertaList.length} peserta
                </span>
              ) : (
                <span>
                  Tidak ada yang dipilih (akan generate semua: {pesertaList.length} peserta)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrintPreview}
                disabled={isGenerating || pesertaList.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'white',
                  color: '#050505',
                  border: '1px solid rgba(153, 13, 53, 0.2)'
                }}
              >
                <Printer size={18} />
                Print Preview
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
                {isGenerating ? `Generating...` : `Download ${selectedAtlets.size > 0 ? selectedAtlets.size : pesertaList.length} ID Cards`}
              </button>
            </div>
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
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold" style={{ color: '#050505' }}>
                Peserta yang Disetujui ({atletPagination.total})
              </h2>
              {pesertaList.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded cursor-pointer"
                    style={{ accentColor: '#990D35' }}
                  />
                  <span className="text-sm font-medium" style={{ color: '#990D35' }}>
                    Select All
                  </span>
                </label>
              )}
            </div>
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
              <CreditCard size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
              <p style={{ color: '#050505', opacity: 0.6 }}>
                Tidak ada peserta yang disetujui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {pesertaList.map((peserta, idx) => {
                const isSelected = selectedAtlets.has(peserta.id_peserta_kompetisi);
                return (
                  <div
                    key={peserta.id_peserta_kompetisi || idx}
                    onClick={() => handleSelectAtlet(peserta.id_peserta_kompetisi)}
                    className="rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer relative"
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(153, 13, 53, 0.05)' : '#F5FBEF',
                      borderColor: isSelected ? '#990D35' : 'rgba(153, 13, 53, 0.1)',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectAtlet(peserta.id_peserta_kompetisi)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded cursor-pointer"
                        style={{ accentColor: '#990D35' }}
                      />
                    </div>
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
                      >
                        <CreditCard size={20} style={{ color: 'white' }} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
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
                );
              })}
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

      {/* PRINT PREVIEW MODAL */}
      {showPrintPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPrintPreview(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}
            >
              <div>
                <h3 className="text-2xl font-bebas" style={{ color: '#050505' }}>
                  PRINT PREVIEW
                </h3>
                <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                  {selectedAtlets.size > 0 
                    ? `${selectedAtlets.size} ID card yang dipilih` 
                    : `${pesertaList.length} ID card (semua di halaman ini)`}
                </p>
              </div>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Athlete List */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {(selectedAtlets.size > 0 
                  ? pesertaList.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
                  : pesertaList
                ).map((peserta, idx) => (
                  <div
                    key={peserta.id_peserta_kompetisi || idx}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: '#F5FBEF',
                      borderColor: 'rgba(153, 13, 53, 0.1)'
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
                    >
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#050505' }}>
                        {peserta.atlet?.nama_atlet || 'N/A'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#050505', opacity: 0.6 }}>
                        {peserta.atlet?.dojang?.nama_dojang || 'N/A'}
                      </p>
                    </div>
                    <CreditCard size={18} style={{ color: '#990D35' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="p-6 border-t flex gap-3 justify-end"
              style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}
            >
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-6 py-2.5 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: 'white',
                  color: '#050505',
                  border: '1px solid rgba(153, 13, 53, 0.2)'
                }}
              >
                Batal
              </button>
              <button
                onClick={handlePrint}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{ 
                  background: isGenerating ? '#7A0A2B' : 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
                }}
              >
                <Printer size={18} />
                {isGenerating ? 'Processing...' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkGenerateIDCard;
