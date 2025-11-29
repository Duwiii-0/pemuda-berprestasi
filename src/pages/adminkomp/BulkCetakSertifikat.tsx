import React, { useEffect, useState } from 'react';
import { useKompetisi } from '../../context/KompetisiContext';
import { useAuth } from '../../context/authContext';
import { CertificateGenerator } from '../../components/CertificateGenerator';
import { Atlet } from '../../types'; // Assuming you have a types file

const BulkCetakSertifikat: React.FC = () => {
  const { user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet } = useKompetisi();
  
  const [dojangs, setDojangs] = useState<{ id: number; name: string }[]>([]);
  const [kelasKejuaraan, setKelasKejuaraan] = useState<{ id: string; name: string }[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Atlet[]>([]);

  const [selectedDojang, setSelectedDojang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");

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

    setFilteredPeserta(filtered.map((p: any) => p.atlet));
  }, [selectedDojang, selectedKelas, pesertaList]);

  const handleBulkDownload = () => {
    // This is a placeholder for the bulk download logic.
    // For now, it just logs the filtered athletes.
    console.log("Bulk downloading certificates for:", filteredPeserta);
    alert(`Bulk download for ${filteredPeserta.length} athletes. See console for details.`);
  };
  
  const handleBulkPrint = () => {
    // This is a placeholder for the bulk print logic.
    console.log("Bulk printing certificates for:", filteredPeserta);
    alert(`Bulk print for ${filteredPeserta.length} athletes. See console for details.`);
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleBulkDownload}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            style={{ backgroundColor: "#990D35" }}
          >
            Download PDF
          </button>
        </div>
        
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Filtered Peserta ({filteredPeserta.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingAtlet ? (
                    <p>Loading...</p>
                ) : (
                    filteredPeserta.map(atlet => (
                        <div key={atlet.id_atlet} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <CertificateGenerator atlet={atlet} isEditing={false} />
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