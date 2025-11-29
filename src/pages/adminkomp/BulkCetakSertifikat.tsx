import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { Atlet } from '../../types';
import { generateCertificatePdfBytes, getKelasKejuaraan, MedalStatus } from '../../utils/pdfGenerators';
import { PDFDocument } from 'pdf-lib';

const BulkCetakSertifikat: React.FC = () => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet } = useKompetisi();
  
  const [dojangs, setDojangs] = useState<{ id: number; name: string }[]>([]);
  const [kelasKejuaraan, setKelasKejuaraan] = useState<{ id: string; name: string }[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<any[]>([]);

  const [selectedDojang, setSelectedDojang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI"
    ? user?.admin_kompetisi?.id_kompetisi
    : null;

  useEffect(() => {
    if (kompetisiId) {
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId, fetchAtletByKompetisi]);

  useEffect(() => {
    if (pesertaList.length > 0) {
      const dojangSet = new Map<number, string>();
      const kelasSet = new Map<string, string>();

      pesertaList.forEach((peserta: any) => {
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
  }, [pesertaList]);

  useEffect(() => {
    let filtered = pesertaList;

    if (selectedDojang !== "ALL") {
      filtered = filtered.filter((p: any) => p.atlet?.dojang?.id_dojang === parseInt(selectedDojang));
    }

    if (selectedKelas !== "ALL") {
      filtered = filtered.filter((p: any) => p.kelas_kejuaraan?.id_kelas_kejuaraan === selectedKelas);
    }

    setFilteredPeserta(filtered);
  }, [selectedDojang, selectedKelas, pesertaList]);

  const handleBulkDownload = async () => {
    if (filteredPeserta.length === 0) {
      alert("No athletes selected.");
      return;
    }
    setIsGenerating(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const peserta of filteredPeserta) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            style={{ backgroundColor: "#990D35" }}
          >
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
        
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Filtered Peserta ({filteredPeserta.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingAtlet ? (
                    <p>Loading...</p>
                ) : (
                    filteredPeserta.map(peserta => (
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
