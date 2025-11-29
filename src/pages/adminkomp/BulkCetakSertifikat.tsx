import React, { useEffect, useState, useRef } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { Atlet } from '../../types';
import { generateCertificatePdfBytes, getKelasKejuaraan, MedalStatus } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';
import { useVirtualizer } from '@tanstack/react-virtual';

const BulkCetakSertifikat: React.FC = () => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet, atletPagination, setAtletPage, setAtletLimit, allPesertaList, fetchAllAtletByKompetisi } = useKompetisi();
  
  const [dojangs, setDojangs] = useState<{ id: number; name: string }[]>([]);
  const [kelasKejuaraan, setKelasKejuaraan] = useState<{ id: string; name: string }[]>([]);

  const [selectedDojang, setSelectedDojang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;
    
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: pesertaList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (kompetisiId) {
      fetchAllAtletByKompetisi(kompetisiId);
      fetchAtletByKompetisi(kompetisiId, undefined, selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), selectedKelas === "ALL" ? undefined : selectedKelas);
    }
  }, [kompetisiId, fetchAllAtletByKompetisi, fetchAtletByKompetisi, atletPagination.page, atletPagination.limit, selectedDojang, selectedKelas]);

  useEffect(() => {
    if (allPesertaList.length > 0) {
      const dojangSet = new Map<number, string>();
      const kelasSet = new Map<string, string>();

      allPesertaList.forEach((peserta: any) => {
        if (peserta.atlet?.dojang) {
          dojangSet.set(peserta.atlet.dojang.id_dojang, peserta.atlet.dojang.nama_dojang);
        }
        if (peserta.kelas_kejuaraan) {
          const kelas = peserta.kelas_kejuaraan;
          const kelasName = `${kelas.kategori_event.nama_kategori} - ${kelas.kelompok.nama_kelompok} - ${kelas.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri"} ${kelas.kelas_berat ? `- ${kelas.kelas_berat.nama_kelas}` : ''}${kelas.poomsae ? `- ${kelas.poomsae.nama_kelas}` : ''}`;
          kelasSet.set(kelas.id_kelas_kejuaraan, kelasName);
        }
      });

      setDojangs(Array.from(dojangSet, ([id, name]) => ({ id, name })));
      setKelasKejuaraan(Array.from(kelasSet, ([id, name]) => ({ id, name })));
    }
  }, [allPesertaList]);

  const totalPages = atletPagination.totalPages;

  const handleBulkDownload = async () => {
    if (pesertaList.length === 0) {
      alert("No athletes selected.");
      return;
    }
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const peserta of pesertaList) {
        if (!peserta.atlet) continue;
        try {
          // TODO: Implement proper medal status detection for bulk generation
          const medalStatus: MedalStatus = "PARTICIPANT"; 
          const kelasName = getKelasKejuaraan(peserta, pesertaList);

          const pdfBytes = await generateCertificatePdfBytes(peserta.atlet, medalStatus, kelasName);
          const pdfToMerge = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
            console.error(`Failed to generate certificate for ${peserta.atlet.nama_atlet}:`, error);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Certificates-Bulk.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate bulk certificates:", error);
        alert("Failed to generate bulk certificates. See console for details.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleBulkPrint = () => {
    alert("Print functionality is not implemented yet for bulk operations.");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bulk Cetak Sertifikat</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dojang" className="block text-sm font-medium text-gray-700">
              Filter by Dojang
            </label>
            <select
              id="dojang"
              name="dojang"
              value={selectedDojang}
              onChange={(e) => setSelectedDojang(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              disabled={loadingAtlet}
            >
              <option value="ALL">All Dojang</option>
              {dojangs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="kelas" className="block text-sm font-medium text-gray-700">
              Filter by Kelas Kejuaraan
            </label>
            <select
              id="kelas"
              name="kelas"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              disabled={loadingAtlet}
            >
              <option value="ALL">All Kelas</option>
              {kelasKejuaraan.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
              Items per Page
            </label>
            <select
              id="limit"
              name="limit"
              value={atletPagination.limit}
              onChange={(e) => setAtletLimit(parseInt(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              disabled={loadingAtlet}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleBulkPrint}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleBulkDownload}
            disabled={isGenerating || loadingAtlet}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            style={{ backgroundColor: "#990D35" }}
          >
            {isGenerating ? 'Generating...' : `Download ${atletPagination.total} Certificates`}
          </button>
        </div>
        
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Peserta ({atletPagination.total})</h2>

            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-700">Page {atletPagination.page} of {totalPages}</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setAtletPage(atletPagination.page - 1)}
                        disabled={atletPagination.page <= 1 || isGenerating || loadingAtlet}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => setAtletPage(atletPagination.page + 1)}
                        disabled={atletPagination.page >= totalPages || isGenerating || loadingAtlet}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            <div ref={parentRef} className="list" style={{ height: `500px`, overflow: 'auto' }}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {loadingAtlet ? (
                        <p>Loading...</p>
                    ) : (
                        rowVirtualizer.getVirtualItems().map(virtualItem => {
                            const peserta = pesertaList[virtualItem.index];
                            return (
                                <div key={virtualItem.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                   <p className="font-bold">{peserta.atlet?.nama_atlet}</p>
                                   <p className="text-sm text-gray-500">{peserta.atlet?.dojang?.nama_dojang}</p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BulkCetakSertifikat;