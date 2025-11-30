import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { generateIdCardPdfBytes } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';
import { CreditCard, Loader, ChevronLeft, ChevronRight, Download, Printer, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

const BulkGenerateIDCard: React.FC = () => {
  const { user } = useAuth();
  const { 
    pesertaList, 
    fetchAtletByKompetisi, 
    loadingAtlet, 
    atletPagination, 
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
  const [currentDisplayPage, setCurrentDisplayPage] = useState(1); // Visual pagination
  const [itemsPerDisplayPage] = useState(25); // Show 25 items per page visually
  
  // Additional filters like ValidasiPeserta
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("APPROVED");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelompokUsia, setFilterKelompokUsia] = useState<"ALL" | "Super Pra-cadet" | "Pracadet" | "Cadet" | "Junior" | "Senior">("ALL");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "pemula" | "prestasi">("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<"ALL" | string>("ALL");

  const kelasBeratOptions = [
    { value: "ALL", label: "Semua Kelas Berat" },
    { value: "Under 18 kg", label: "Under 18 kg" },
    { value: "Under 19 kg", label: "Under 19 kg" },
    { value: "Under 20 kg", label: "Under 20 kg" },
    { value: "Under 21 kg", label: "Under 21 kg" },
    { value: "Under 22 kg", label: "Under 22 kg" },
    { value: "Under 23 kg", label: "Under 23 kg" },
    { value: "Under 24 kg", label: "Under 24 kg" },
    { value: "Under 25 kg", label: "Under 25 kg" },
    { value: "Under 26 kg", label: "Under 26 kg" },
    { value: "Under 27 kg", label: "Under 27 kg" },
    { value: "Under 28 kg", label: "Under 28 kg" },
    { value: "Under 29 kg", label: "Under 29 kg" },
    { value: "Under 30 kg", label: "Under 30 kg" },
    { value: "Under 32 kg", label: "Under 32 kg" },
    { value: "Under 33 kg", label: "Under 33 kg" },
    { value: "Under 35 kg", label: "Under 35 kg" },
    { value: "Under 36 kg", label: "Under 36 kg" },
    { value: "Under 37 kg", label: "Under 37 kg" },
    { value: "Under 38 kg", label: "Under 38 kg" },
    { value: "Under 39 kg", label: "Under 39 kg" },
    { value: "Under 41 kg", label: "Under 41 kg" },
    { value: "Under 42 kg", label: "Under 42 kg" },
    { value: "Under 44 kg", label: "Under 44 kg" },
    { value: "Under 45 kg", label: "Under 45 kg" },
    { value: "Under 46 kg", label: "Under 46 kg" },
    { value: "Under 47 kg", label: "Under 47 kg" },
    { value: "Under 48 kg", label: "Under 48 kg" },
    { value: "Under 49 kg", label: "Under 49 kg" },
    { value: "Under 51 kg", label: "Under 51 kg" },
    { value: "Under 52 kg", label: "Under 52 kg" },
    { value: "Under 53 kg", label: "Under 53 kg" },
    { value: "Under 54 kg", label: "Under 54 kg" },
    { value: "Under 55 kg", label: "Under 55 kg" },
    { value: "Under 57 kg", label: "Under 57 kg" },
    { value: "Under 59 kg", label: "Under 59 kg" },
    { value: "Under 61 kg", label: "Under 61 kg" },
    { value: "Under 62 kg", label: "Under 62 kg" },
    { value: "Under 63 kg", label: "Under 63 kg" },
    { value: "Under 65 kg", label: "Under 65 kg" },
    { value: "Under 67 kg", label: "Under 67 kg" },
    { value: "Under 68 kg", label: "Under 68 kg" },
    { value: "Under 73 kg", label: "Under 73 kg" },
    { value: "Under 74 kg", label: "Under 74 kg" },
    { value: "Under 78 kg", label: "Under 78 kg" },
    { value: "Under 80 kg", label: "Under 80 kg" },
    { value: "Under 87 kg", label: "Under 87 kg" },
    { value: "Over 32 kg", label: "Over 32 kg" },
    { value: "Over 33 kg", label: "Over 33 kg" },
    { value: "Over 38 kg", label: "Over 38 kg" },
    { value: "Over 39 kg", label: "Over 39 kg" },
    { value: "Over 59 kg", label: "Over 59 kg" },
    { value: "Over 65 kg", label: "Over 65 kg" },
    { value: "Over 68 kg", label: "Over 68 kg" },
    { value: "Over 73 kg", label: "Over 73 kg" },
    { value: "Over 78 kg", label: "Over 78 kg" },
    { value: "Over 87 kg", label: "Over 87 kg" },
    { value: "Over 200 kg", label: "Over 200 kg" },
  ];

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;

  // FIXED: Set limit ONCE on mount before any fetch
  useEffect(() => {
    if (kompetisiId) {
      console.log('🔄 [BulkIDCard] Setting initial limit to 10000...');
      console.log('🔄 [BulkIDCard] Current limit before set:', atletPagination.limit);
      setAtletLimit(10000); // Set very high limit to load all data (3900+)
      // Wait a bit for state to update, then fetch
      setTimeout(() => {
        console.log('🔄 [BulkIDCard] Fetching with limit (after set):', atletPagination.limit);
        fetchAtletByKompetisi(kompetisiId, undefined, undefined, undefined, "APPROVED");
      }, 100);
    }
  }, [kompetisiId]);

  // Load all data for filter options
  useEffect(() => {
    if (kompetisiId) {
      fetchAllAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId]);

  // Fetch when filters change (ONLY when user changes, NOT on mount)
  useEffect(() => {
    // Skip initial render by checking if we already have data
    if (kompetisiId && pesertaList.length > 0) {
      console.log(`🔄 [BulkIDCard] Filter changed: dojang=${selectedDojang}, kelas=${selectedKelas}`);
      setCurrentDisplayPage(1); // Reset visual page to 1
      setSelectedAtlets(new Set()); // Clear selection when filter changes
      fetchAtletByKompetisi(
        kompetisiId, 
        undefined, 
        selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), 
        selectedKelas === "ALL" ? undefined : selectedKelas,
        "APPROVED"
      );
    }
  }, [selectedDojang, selectedKelas]);

  // Fetch when pagination changes (ONLY when page > 1, NOT on mount)
  useEffect(() => {
    if (kompetisiId && atletPagination.page > 1) {
      console.log(`🔄 [BulkIDCard] Page changed to ${atletPagination.page}`);
      setSelectedAtlets(new Set()); // Clear selection when page changes
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

  // Apply all filters to pesertaList (same as ValidasiPeserta)
  const filteredPeserta = pesertaList.filter((peserta) => {
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a: any) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";

    const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || peserta.status === filterStatus;

    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory = filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

    const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || "";
    const matchesLevel = filterLevel === "ALL" || level === filterLevel;

    const matchesKelompok =
      filterKelompokUsia === "ALL" ||
      peserta.kelas_kejuaraan?.kelompok?.nama_kelompok.toLowerCase().includes(filterKelompokUsia.toLowerCase());

    const pesertaDojang = peserta.is_team
      ? peserta.anggota_tim?.[0]?.atlet?.dojang?.id_dojang?.toString() || ""
      : peserta.atlet?.dojang?.id_dojang?.toString() || "";
    const matchesDojang = selectedDojang === "ALL" || pesertaDojang === selectedDojang;

    const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-");
    const matchesKelasBerat = filterKelasBerat === "ALL" || kelasBerat === filterKelasBerat;

    return matchesSearch && matchesStatus && matchesCategory && matchesLevel && matchesKelompok && matchesDojang && matchesKelasBerat;
  });

  // Calculate visual pagination (25 per page from FILTERED data)
  const totalItems = filteredPeserta.length;
  const totalDisplayPages = Math.ceil(totalItems / itemsPerDisplayPage);
  const startIndex = (currentDisplayPage - 1) * itemsPerDisplayPage;
  const endIndex = startIndex + itemsPerDisplayPage;
  const displayedPeserta = filteredPeserta.slice(startIndex, endIndex);

  // Selection handlers - UPDATE to use displayedPeserta
  const handleSelectAll = () => {
    if (selectedAtlets.size === displayedPeserta.length) {
      setSelectedAtlets(new Set());
    } else {
      const allIds = new Set(displayedPeserta.map(p => p.id_peserta_kompetisi));
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

  const isAllSelected = displayedPeserta.length > 0 && selectedAtlets.size === displayedPeserta.length;

  // Pagination helper for visual pages
  const getDisplayPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalDisplayPages <= maxVisiblePages) {
      for (let i = 1; i <= totalDisplayPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentDisplayPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalDisplayPages);
      } else if (currentDisplayPage >= totalDisplayPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalDisplayPages - 3; i <= totalDisplayPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentDisplayPage - 1; i <= currentDisplayPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalDisplayPages);
      }
    }
    return pageNumbers;
  };

  const handleBulkDownload = async () => {
    // Determine which athletes to generate - USE FILTERED DATA
    const atletToGenerate = selectedAtlets.size > 0 
      ? filteredPeserta.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : filteredPeserta; // Use filtered data when nothing is selected

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
        if (!peserta.atlet) {
          console.warn(`Peserta ${peserta.id_peserta_kompetisi} tidak memiliki data atlet`);
          errorCount++;
          continue;
        }
        try {
          // CRITICAL FIX: Pass the complete peserta object with atlet relation
          // Create enhanced atlet object with full peserta_kompetisi data
          const enhancedAtlet = {
            ...peserta.atlet,
            peserta_kompetisi: [{
              ...peserta,
              kelas_kejuaraan: peserta.kelas_kejuaraan
            }]
          };
          
          console.log(`🔍 Generating ID card for ${peserta.atlet.nama_atlet}:`, {
            has_pas_foto: !!(peserta.atlet as any).pas_foto,
            pas_foto: (peserta.atlet as any).pas_foto,
            has_pas_foto_path: !!(peserta.atlet as any).pas_foto_path,
            pas_foto_path: (peserta.atlet as any).pas_foto_path,
            kelas_kejuaraan: peserta.kelas_kejuaraan?.kategori_event?.nama_kategori,
            dojang: peserta.atlet.dojang?.nama_dojang
          });
          
          const pdfBytes = await generateIdCardPdfBytes(enhancedAtlet as any, atletToGenerate);
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
      link.download = `ID-Cards-Bulk-Page${currentDisplayPage}.pdf`;
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
      ? filteredPeserta.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : filteredPeserta; // Use filtered data when nothing is selected

    if (atletToPreview.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    setShowPrintPreview(true);
  };

  const handlePrint = async () => {
    const atletToPrint = selectedAtlets.size > 0 
      ? filteredPeserta.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
      : filteredPeserta; // Use filtered data when nothing is selected

    if (atletToPrint.length === 0) {
      toast.error("Tidak ada peserta yang tersedia");
      return;
    }

    const toastId = toast.loading(`Preparing ${atletToPrint.length} ID cards for printing...`);
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const peserta of atletToPrint) {
        if (!peserta.atlet) {
          console.warn(`Peserta ${peserta.id_peserta_kompetisi} tidak memiliki data atlet`);
          continue;
        }
        try {
          // CRITICAL FIX: Pass the complete peserta object with atlet relation
          const enhancedAtlet = {
            ...peserta.atlet,
            peserta_kompetisi: [{
              ...peserta,
              kelas_kejuaraan: peserta.kelas_kejuaraan
            }]
          };
          
          const pdfBytes = await generateIdCardPdfBytes(enhancedAtlet as any, atletToPrint);
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
          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
              <Search size={16} className="inline mr-1" />
              Cari Peserta
            </label>
            <input
              type="text"
              placeholder="Cari nama peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#990D35]"
              style={{ 
                borderColor: 'rgba(153, 13, 53, 0.2)'
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Filter Status */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Status
              </label>
              <Select
                value={{ 
                  value: filterStatus, 
                  label: filterStatus === "ALL" ? "Semua Status" : filterStatus 
                }}
                onChange={(selected) => setFilterStatus(selected?.value as any || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Status" },
                  { value: "PENDING", label: "PENDING" },
                  { value: "APPROVED", label: "APPROVED" },
                  { value: "REJECTED", label: "REJECTED" }
                ]}
                isSearchable={false}
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>

            {/* Filter Kategori */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Kategori
              </label>
              <Select
                value={{ 
                  value: filterCategory, 
                  label: filterCategory === "ALL" ? "Semua Kategori" : filterCategory 
                }}
                onChange={(selected) => setFilterCategory(selected?.value as any || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Kategori" },
                  { value: "KYORUGI", label: "KYORUGI" },
                  { value: "POOMSAE", label: "POOMSAE" }
                ]}
                isSearchable={false}
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>

            {/* Filter Kelompok Usia */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Kelompok Usia
              </label>
              <Select
                value={{ 
                  value: filterKelompokUsia, 
                  label: filterKelompokUsia === "ALL" ? "Semua Kelompok" : filterKelompokUsia 
                }}
                onChange={(selected) => setFilterKelompokUsia(selected?.value as any || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Kelompok" },
                  { value: "Super Pra-cadet", label: "Super Pra-cadet" },
                  { value: "Pracadet", label: "Pracadet" },
                  { value: "Cadet", label: "Cadet" },
                  { value: "Junior", label: "Junior" },
                  { value: "Senior", label: "Senior" }
                ]}
                isSearchable
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>

            {/* Filter Level */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Level
              </label>
              <Select
                value={{ 
                  value: filterLevel, 
                  label: filterLevel === "ALL" ? "Semua Level" : filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)
                }}
                onChange={(selected) => setFilterLevel(selected?.value as any || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Level" },
                  { value: "pemula", label: "Pemula" },
                  { value: "prestasi", label: "Prestasi" }
                ]}
                isSearchable={false}
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>

            {/* Filter Kelas Berat */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Kelas Berat
              </label>
              <Select
                value={{ 
                  value: filterKelasBerat, 
                  label: filterKelasBerat === "ALL" ? "Semua Kelas Berat" : filterKelasBerat 
                }}
                onChange={(selected) => setFilterKelasBerat(selected?.value || "ALL")}
                options={kelasBeratOptions}
                isSearchable
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>

            {/* Filter Dojang */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Dojang
              </label>
              <Select
                value={{ value: selectedDojang, label: selectedDojang === "ALL" ? "Semua Dojang" : dojangs.find(d => d.id.toString() === selectedDojang)?.name || "Semua Dojang" }}
                onChange={(selected) => setSelectedDojang(selected?.value || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Dojang" },
                  ...dojangs.map(d => ({ value: d.id.toString(), label: d.name }))
                ]}
                isDisabled={loadingAtlet}
                isSearchable
                placeholder="Pilih Dojang..."
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Filter Kelas */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                Kelas
              </label>
              <Select
                value={{ value: selectedKelas, label: selectedKelas === "ALL" ? "Semua Kelas" : kelasKejuaraan.find(k => k.id === selectedKelas)?.name || "Semua Kelas" }}
                onChange={(selected) => setSelectedKelas(selected?.value || "ALL")}
                options={[
                  { value: "ALL", label: "Semua Kelas" },
                  ...kelasKejuaraan.map(k => ({ value: k.id, label: k.name }))
                ]}
                isDisabled={loadingAtlet}
                isSearchable
                placeholder="Pilih Kelas..."
                className="w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'rgba(153, 13, 53, 0.2)',
                    '&:hover': { borderColor: 'rgba(153, 13, 53, 0.4)' }
                  })
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="text-sm" style={{ color: '#050505', opacity: 0.7 }}>
              {selectedAtlets.size > 0 ? (
                <span className="font-medium" style={{ color: '#990D35' }}>
                  {selectedAtlets.size} dipilih dari {totalItems} peserta
                </span>
              ) : (
                <span>
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} peserta
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrintPreview}
                disabled={isGenerating || filteredPeserta.length === 0}
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
                disabled={isGenerating || loadingAtlet || filteredPeserta.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: isGenerating ? '#7A0A2B' : 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
                }}
              >
                <Download size={18} />
                {isGenerating ? `Generating...` : `Download ${selectedAtlets.size > 0 ? selectedAtlets.size : filteredPeserta.length} ID Cards`}
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
                Peserta yang Disetujui
              </h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)', color: '#990D35' }}>
                {totalItems} peserta (filtered)
              </span>
              {displayedPeserta.length > 0 && (
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
              Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} peserta
            </p>
          </div>

          {/* Grid List */}
          {loadingAtlet ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
            </div>
          ) : displayedPeserta.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
              <p style={{ color: '#050505', opacity: 0.6 }}>
                Tidak ada peserta yang disetujui atau sesuai filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {displayedPeserta.map((peserta, idx) => {
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

          {/* VISUAL PAGINATION */}
          {totalDisplayPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
              <button
                onClick={() => setCurrentDisplayPage(currentDisplayPage - 1)}
                disabled={currentDisplayPage === 1}
                className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                style={{ color: '#990D35' }}
              >
                <ChevronLeft size={20} />
              </button>

              {getDisplayPageNumbers().map((pageNum, idx) => (
                <React.Fragment key={idx}>
                  {pageNum === '...' ? (
                    <span className="px-2" style={{ color: '#050505', opacity: 0.3 }}>...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentDisplayPage(pageNum as number)}
                      className="w-10 h-10 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: currentDisplayPage === pageNum ? '#990D35' : 'transparent',
                        color: currentDisplayPage === pageNum ? 'white' : '#050505',
                        opacity: currentDisplayPage === pageNum ? 1 : 0.6
                      }}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}

              <button
                onClick={() => setCurrentDisplayPage(currentDisplayPage + 1)}
                disabled={currentDisplayPage === totalDisplayPages}
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
                    : `${filteredPeserta.length} ID card (semua data ter-filter)`}
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
                  ? filteredPeserta.filter(p => selectedAtlets.has(p.id_peserta_kompetisi))
                  : filteredPeserta
                ).map((peserta, idx) => (
                  <div
                    key={peserta.id_peserta_kompetisi || idx}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'white',
                      borderColor: 'rgba(153, 13, 53, 0.2)'
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
