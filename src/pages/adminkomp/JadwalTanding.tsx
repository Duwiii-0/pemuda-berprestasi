import React, { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Loader } from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";

interface JadwalLapangan {
  id: string;
  namaLapangan: string;
  kelasDipilih: number[]; // id_kelas_kejuaraan
}

interface HariPertandingan {
  id: string;
  namaHari: string;
  lapangan: JadwalLapangan[];
}

const JadwalPertandingan: React.FC<{ idKompetisi: number }> = ({
  idKompetisi,
}) => {
  const { kompetisiDetail, fetchKompetisiById, loadingKompetisi } =
    useKompetisi();

  const [hariList, setHariList] = useState<HariPertandingan[]>([
    { id: "1", namaHari: "Hari ke-1", lapangan: [] },
  ]);

  // 🔹 State tambahan untuk peserta approved per kelas
  const [approvedPesertaByKelas, setApprovedPesertaByKelas] = useState<
    Record<number, any[]>
  >({});

  // Fetch kompetisi
  useEffect(() => {
    fetchKompetisiById(idKompetisi);
  }, [idKompetisi]);

  // 🔹 Pisahkan peserta approved berdasarkan kelas_kejuaraan
  useEffect(() => {
    if (!kompetisiDetail?.peserta_kompetisi) return;

    const map: Record<number, any[]> = {};
    kompetisiDetail.peserta_kompetisi.forEach((peserta: any) => {
      if (peserta.status !== "APPROVED") return;
      const idKelas = peserta.kelas_kejuaraan?.id_kelas_kejuaraan;
      if (!idKelas) return;

      if (!map[idKelas]) map[idKelas] = [];
      map[idKelas].push(peserta);
    });

    setApprovedPesertaByKelas(map);
  }, [kompetisiDetail]);

  const addHari = () => {
    const nextDay = hariList.length + 1;
    setHariList([
      ...hariList,
      { id: nextDay.toString(), namaHari: `Hari ke-${nextDay}`, lapangan: [] },
    ]);
  };

  const addLapangan = (hariId: string) => {
    setHariList((prev) =>
      prev.map((hari) =>
        hari.id === hariId
          ? {
              ...hari,
              lapangan: [
                ...hari.lapangan,
                {
                  id: `${hari.id}-${hari.lapangan.length + 1}`,
                  namaLapangan: `Lapangan ${hari.lapangan.length + 1}`,
                  kelasDipilih: [],
                },
              ],
            }
          : hari
      )
    );
  };

  const removeLapangan = (hariId: string, lapId: string) => {
    setHariList((prev) =>
      prev.map((hari) =>
        hari.id === hariId
          ? { ...hari, lapangan: hari.lapangan.filter((l) => l.id !== lapId) }
          : hari
      )
    );
  };

  const toggleKelas = (hariId: string, lapId: string, kelasId: number) => {
    setHariList((prev) =>
      prev.map((hari) =>
        hari.id === hariId
          ? {
              ...hari,
              lapangan: hari.lapangan.map((lap) =>
                lap.id === lapId
                  ? {
                      ...lap,
                      kelasDipilih: lap.kelasDipilih.includes(kelasId)
                        ? lap.kelasDipilih.filter((id) => id !== kelasId)
                        : [...lap.kelasDipilih, kelasId],
                    }
                  : lap
              ),
            }
          : hari
      )
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <Calendar size={32} style={{ color: "#990D35" }} />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bebas"
              style={{ color: "#050505" }}
            >
              PENJADWALAN PERTANDINGAN
            </h1>
            <p className="text-sm" style={{ color: "#050505", opacity: 0.6 }}>
              Tentukan kelas kejuaraan yang bertanding per lapangan setiap hari
            </p>
          </div>
        </div>

        {/* TAMBAH HARI */}
        <div className="mb-6">
          <button
            onClick={addHari}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
            style={{
              backgroundColor: "#990D35",
              color: "#F5FBEF",
            }}
          >
            <Plus size={16} />
            Tambah Hari Pertandingan
          </button>
        </div>

        {/* LOADING */}
        {loadingKompetisi && (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin" style={{ color: "#990D35" }} />
          </div>
        )}

        {/* DAFTAR HARI */}
        {!loadingKompetisi &&
          hariList.map((hari) => (
            <div
              key={hari.id}
              className="rounded-xl shadow-sm border p-6 mb-6"
              style={{ borderColor: "#990D35", backgroundColor: "#F5FBEF" }}
            >
              {/* HEADER HARI */}
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: "#990D35" }}
                >
                  {hari.namaHari}
                </h2>
                <button
                  onClick={() => addLapangan(hari.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "rgba(153, 13, 53, 0.1)",
                    color: "#990D35",
                  }}
                >
                  <Plus size={14} />
                  Tambah Lapangan
                </button>
              </div>

              {/* LAPANGAN */}
              {hari.lapangan.length === 0 && (
                <p
                  className="text-sm italic mb-4"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Belum ada lapangan ditambahkan
                </p>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {hari.lapangan.map((lap) => (
                  <div
                    key={lap.id}
                    className="rounded-xl border p-4 space-y-4"
                    style={{ borderColor: "#990D35" }}
                  >
                    <div className="flex justify-between items-center">
                      <h3
                        className="font-semibold"
                        style={{ color: "#050505" }}
                      >
                        {lap.namaLapangan}
                      </h3>
                      <button
                        onClick={() => removeLapangan(hari.id, lap.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* KELAS KEJUARAAN */}
                    <div>
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: "#990D35" }}
                      >
                        Pilih Kelas Kejuaraan:
                      </p>

                      <div className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg">
                        {kompetisiDetail?.kelas_kejuaraan?.map((kelas) => {
                          const approvedPeserta =
                            approvedPesertaByKelas[kelas.id_kelas_kejuaraan] ||
                            [];
                          return (
                            <label
                              key={kelas.id_kelas_kejuaraan}
                              className="flex flex-col border rounded-md p-2 hover:bg-[#f9f9f9]"
                              style={{ borderColor: "rgba(153,13,53,0.3)" }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={lap.kelasDipilih.includes(
                                      kelas.id_kelas_kejuaraan
                                    )}
                                    onChange={() =>
                                      toggleKelas(
                                        hari.id,
                                        lap.id,
                                        kelas.id_kelas_kejuaraan
                                      )
                                    }
                                    className="accent-[#990D35]"
                                  />
                                  <span className="text-sm font-medium text-[#050505]">
                                    {kelas.nama_kelas}
                                  </span>
                                </div>
                                <span
                                  className="text-xs px-2 py-1 rounded-md"
                                  style={{
                                    backgroundColor: "rgba(153,13,53,0.1)",
                                    color: "#990D35",
                                  }}
                                >
                                  {approvedPeserta.length} peserta
                                </span>
                              </div>

                              {/* 🔹 DAFTAR PESERTA APPROVED */}
                              {approvedPeserta.length > 0 && (
                                <ul className="mt-2 ml-6 list-disc text-xs text-[#050505]">
                                  {approvedPeserta.map((p) => (
                                    <li key={p.id_peserta}>
                                      {p.nama_peserta || p.nama_tim}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default JadwalPertandingan;
