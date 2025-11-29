import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { Atlet } from '../../types';
import { generateIdCardPdfBytes } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';

const BulkGenerateIDCard: React.FC = () => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet, atletPagination, setAtletPage, setAtletLimit, allPesertaList, fetchAllAtletByKompetisi } = useKompetisi();
  
  const [dojangs, setDojangs] = useState<{ id: number; name: string }[]>([]);
  const [kelasKejuaraan, setKelasKejuaraan] = useState<{ id: string; name: string }[]>([]);

  const [selectedDojang, setSelectedDojang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [deferredPesertaList, setDeferredPesertaList] = useState<any[]>([]);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;

  useEffect(() => {
    if (kompetisiId) {
      fetchAtletByKompetisi(kompetisiId, undefined, selectedDojang === "ALL" ? undefined : parseInt(selectedDojang), selectedKelas === "ALL" ? undefined : selectedKelas);
    }
  }, [kompetisiId, fetchAtletByKompetisi, atletPagination.page, atletPagination.limit, selectedDojang, selectedKelas]);

  useEffect(() => {
    if (kompetisiId) {
      fetchAllAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId, fetchAllAtletByKompetisi]);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredPesertaList(pesertaList);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [pesertaList]);

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
        if (peserta.atlet) {
            try {
                const pdfBytes = await generateIdCardPdfBytes(peserta.atlet, pesertaList);
                const pdfToMerge = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            } catch (error) {
                console.error(`Failed to generate ID card for ${peserta.atlet.nama_atlet}:`, error);
            }
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ID-Cards-Bulk.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate bulk ID cards:", error);
        alert("Failed to generate bulk ID cards. See console for details.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleBulkPrint = () => {
    alert("Print functionality is not implemented yet for bulk operations.");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bulk Generate ID Card</h1>
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
                {isGenerating ? 'Generating...' : `Download ${atletPagination.total} ID Cards`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingAtlet ? (
                    <p>Loading...</p>
                ) : (
                    deferredPesertaList.map(peserta => (
                        peserta.atlet &&
                        <div key={peserta.atlet.id_atlet} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                           <p className="font-bold">{peserta.atlet.nama_atlet}</p>
                           <p className="text-sm text-gray-500">{peserta.atlet.dojang?.nama_dojang}</p>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default BulkGenerateIDCard;