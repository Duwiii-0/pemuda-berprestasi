import React, { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Loader } from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { useAuth } from "../../context/authContext";

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

const JadwalPertandingan: React.FC<{ idKompetisi: number }> = ({}) => {
  const {
    kelasKejuaraanList,
    fetchKelasKejuaraanByKompetisi,
    pesertaList,
    fetchAtletByKompetisi,
    loadingKelasKejuaraan,
    loadingAtlet,
    errorKelasKejuaraan,
    errorAtlet,
  } = useKompetisi();

  const { user } = useAuth();
  const idKompetisi = user?.admin_kompetisi?.id_kompetisi;

  const [hariList, setHariList] = useState<HariPertandingan[]>([
    { id: "1", namaHari: "Hari ke-1", lapangan: [] },
  ]);

  const [approvedPesertaByKelas, setApprovedPesertaByKelas] = useState<
    Record<number, any[]>
  >({});

  // 🔹 Fetch kelas kejuaraan dan peserta
  useEffect(() => {
    if (!idKompetisi) {
      console.warn("⚠️ ID Kompetisi belum tersedia di user context");
      return;
    }

    const fetchData = async () => {
      try {
        await fetchKelasKejuaraanByKompetisi(idKompetisi);
        await fetchAtletByKompetisi(idKompetisi);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [idKompetisi]);

  // 🔹 Pisahkan peserta APPROVED berdasarkan kelas_kejuaraan dari pesertaList
  useEffect(() => {
    if (!pesertaList || pesertaList.length === 0) {
      console.log("📭 Tidak ada peserta untuk diproses");
      return;
    }

    const map: Record<number, any[]> = {};
    pesertaList.forEach((peserta) => {
      // Hanya ambil yang APPROVED
      if (peserta.status !== "APPROVED") return;

      const idKelas = peserta.kelas_kejuaraan?.id_kelas_kejuaraan;
      if (!idKelas) return;

      if (!map[idKelas]) map[idKelas] = [];

      // Format data peserta dengan nama yang benar
      const pesertaData = {
        id_peserta: peserta.id_peserta_kompetisi,
        nama_peserta: peserta.is_team
          ? `Tim ${
              peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang || "Unknown"
            }`
          : peserta.atlet?.nama_atlet || "Unknown",
        is_team: peserta.is_team,
        dojang: peserta.is_team
          ? peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang
          : peserta.atlet?.dojang?.nama_dojang,
      };

      map[idKelas].push(pesertaData);
    });

    console.log("📊 Peserta APPROVED per kelas:", map);
    setApprovedPesertaByKelas(map);
  }, [pesertaList]);

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

        {/* ERROR MESSAGES */}
        {(errorKelasKejuaraan || errorAtlet) && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              borderLeft: "4px solid #dc2626",
            }}
          >
            <p className="text-sm font-medium text-red-600">
              {errorKelasKejuaraan || errorAtlet}
            </p>
          </div>
        )}

        {/* TAMBAH HARI */}
        <div className="mb-6">
          <button
            onClick={addHari}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
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
        {(loadingKelasKejuaraan || loadingAtlet) && (
          <div className="flex flex-col justify-center items-center py-10">
            <Loader
              className="animate-spin mb-3"
              size={40}
              style={{ color: "#990D35" }}
            />
            <span className="text-sm font-medium" style={{ color: "#990D35" }}>
              Memuat data kelas kejuaraan dan peserta...
            </span>
          </div>
        )}

        {/* DAFTAR HARI */}
        {!loadingKelasKejuaraan &&
          !loadingAtlet &&
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
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

              <div className="space-y-4">
                {hari.lapangan.map((lap) => (
                  <div
                    key={lap.id}
                    className="rounded-xl border p-4 space-y-4"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#FFFFFF",
                    }}
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
                        title="Hapus Lapangan"
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

                      <div
                        className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg"
                        style={{ backgroundColor: "#F5FBEF" }}
                      >
                        {kelasKejuaraanList && kelasKejuaraanList.length > 0 ? (
                          kelasKejuaraanList.map((kelas) => {
                            const approvedPeserta =
                              approvedPesertaByKelas[
                                kelas.id_kelas_kejuaraan
                              ] || [];

                            // Generate nama kelas display
                            const parts = [];

                            if (kelas.cabang) {
                              parts.push(kelas.cabang);
                            }

                            if (kelas.kategori_event?.nama_kategori) {
                              parts.push(kelas.kategori_event.nama_kategori);
                            }

                            if (kelas.kelompok?.nama_kelompok) {
                              parts.push(kelas.kelompok.nama_kelompok);
                            }

                            if (kelas.kelas_berat) {
                              const gender =
                                kelas.kelas_berat.jenis_kelamin === "LAKI_LAKI"
                                  ? "Putra"
                                  : "Putri";
                              parts.push(`${gender}`);
                            }

                            if (kelas.kelas_berat?.nama_kelas) {
                              parts.push(kelas.kelas_berat.nama_kelas);
                            }

                            if (kelas.poomsae?.nama_kelas) {
                              parts.push(kelas.poomsae.nama_kelas);
                            }

                            const namaKelasDisplay =
                              parts.length > 0
                                ? parts.join(" - ")
                                : "Kelas Tidak Lengkap";

                            return (
                              <label
                                key={kelas.id_kelas_kejuaraan}
                                className="flex flex-col border rounded-md p-2 hover:bg-white cursor-pointer transition-colors"
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
                                      className="accent-[#990D35] cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-[#050505]">
                                      {namaKelasDisplay}
                                    </span>
                                  </div>
                                  <span
                                    className="text-xs px-2 py-1 rounded-md font-medium"
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
                                  <ul className="mt-2 ml-6 list-disc text-xs text-[#050505] space-y-1">
                                    {approvedPeserta.map((p) => (
                                      <li key={p.id_peserta}>
                                        <span className="font-medium">
                                          {p.nama_peserta}
                                        </span>
                                        {p.dojang && (
                                          <span className="text-[#990D35] ml-1">
                                            ({p.dojang})
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </label>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <p
                              className="text-sm font-medium mb-1"
                              style={{ color: "#050505", opacity: 0.6 }}
                            >
                              Tidak ada kelas kejuaraan tersedia
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "#050505", opacity: 0.5 }}
                            >
                              Silakan tambahkan kelas kejuaraan terlebih dahulu
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INFO KELAS TERPILIH */}
                    {lap.kelasDipilih.length > 0 && (
                      <div
                        className="mt-3 p-2 rounded-md"
                        style={{ backgroundColor: "rgba(153,13,53,0.05)" }}
                      >
                        <p
                          className="text-xs font-medium mb-1"
                          style={{ color: "#990D35" }}
                        >
                          Kelas yang dipilih: {lap.kelasDipilih.length}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "#050505", opacity: 0.7 }}
                        >
                          Total peserta:{" "}
                          {lap.kelasDipilih.reduce(
                            (total, kelasId) =>
                              total +
                              (approvedPesertaByKelas[kelasId]?.length || 0),
                            0
                          )}
                        </p>
                      </div>
                    )}
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
