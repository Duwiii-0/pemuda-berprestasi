import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { Atlet } from '../../types';
import { generateCertificatePdfBytes, getKelasKejuaraan, MedalStatus } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';

const ITEMS_PER_PAGE = 100;

const BulkCetakSertifikat: React.FC = () => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet, atletPagination, setAtletPage } = useKompetisi();
  
  const [isGenerating, setIsGenerating] = useState(false);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;

  useEffect(() => {
    if (kompetisiId) {
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId, fetchAtletByKompetisi, atletPagination.page]);

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
        {/* FILTERS REMOVED FOR SIMPLICITY - RE-IMPLEMENT ON SERVER-SIDE */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingAtlet ? (
                    <p>Loading...</p>
                ) : (
                    pesertaList.map(peserta => (
                        <div key={peserta.id_peserta_kompetisi} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                           <p className="font-bold">{peserta.atlet?.nama_atlet}</p>
                           <p className="text-sm text-gray-500">{peserta.atlet?.dojang?.nama_dojang}</p>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default BulkCetakSertifikat;