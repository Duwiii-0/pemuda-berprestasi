import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader, Search } from "lucide-react";
import { useAuth, } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";
import Select from "react-select";

const AllPeserta: React.FC = () => {
  const { token, user } = useAuth();
  const {
    pesertaList,
    fetchAtletByKompetisi,
    updatePesertaStatus,
    loadingAtlet,
  } = useKompetisi();

  const [processing, setProcessing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const kompetisiId = user?.adminKompetisi?.[0]?.id_kompetisi;

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);


useEffect(() => {
  if (kompetisiId) {
    fetchAtletByKompetisi(kompetisiId);
  }
}, [kompetisiId]);

const handleApproval = async (id: number) => {
  if (!kompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(kompetisiId, id, "APPROVED");
  } finally {
    setProcessing(null);
  }
};

const handleRejection = async (id: number) => {
  if (!kompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(kompetisiId, id, "REJECTED");
  } finally {
    setProcessing(null);
  }
};

  const displayedPesertas = pesertaList.filter((peserta) => {
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";

    const matchesSearch = namaPeserta
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" || peserta.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Daftar Peserta Kompetisi
      </h1>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-3xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm md:text-base placeholder-gray-400 transition-colors"
            />
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-gray-600 text-xs mb-1">Status</label>
            <Select
              unstyled
              value={{
                value: filterStatus,
                label:
                  filterStatus === "ALL"
                    ? "Semua Status"
                    : filterStatus.charAt(0) +
                      filterStatus.slice(1).toLowerCase(),
              }}
              onChange={(selected) =>
                setFilterStatus(selected?.value as any)
              }
              options={[
                { value: "ALL", label: "Semua Status" },
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
              classNames={{
                control: () =>
                  `w-full py-3 flex items-center border-2 border-gray-300 rounded-3xl px-4 gap-3 backdrop-blur-sm transition-all`,
                valueContainer: () => "px-1",
                menu: () =>
                  "bg-white border rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-4 py-2 cursor-pointer text-sm",
                    isFocused ? "bg-blue-100" : "",
                    isSelected ? "bg-blue-500 text-white" : "",
                  ].join(" "),
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loadingAtlet ? (
        <p className="text-gray-500">Loading peserta...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="w-full min-w-[800px]">
            <thead className="bg-blue-500 text-white">
              <tr>
                {[
                  "Nama",
                  "Kategori",
                  "Kelas",
                  "Jenis Kelamin",
                  "Dojang",
                  "Status",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 font-semibold text-sm text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPesertas.map((peserta: any) => {
                const isTeam = peserta.is_team;
                const cabang = peserta.kelas_kejuaraan?.cabang || "-";
                const namaPeserta = isTeam
                  ? peserta.anggota_tim
                      ?.map((m: any) => m.atlet.nama_atlet)
                      .join(", ")
                  : peserta.atlet?.nama_atlet || "-";
                const dojang = isTeam
                  ? peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang || "-"
                  : peserta.atlet?.dojang?.nama_dojang || "-";

                return (
                  <tr
                    key={peserta.id_peserta_kompetisi}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2 px-4">{namaPeserta}</td>
                    <td className="py-2 px-4">{cabang}</td>
                    <td className="py-2 px-4">
                      {peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas ||
                        peserta.kelas_kejuaraan?.poomsae?.nama_kelas ||
                        "-"}
                    </td>
                    <td className="py-2 px-4">
                      {!isTeam ? peserta.atlet?.jenis_kelamin || "-" : "-"}
                    </td>
                    <td className="py-2 px-4">{dojang}</td>
                    <td className="py-2 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          peserta.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : peserta.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {peserta.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() =>
                          handleApproval(peserta.id_peserta_kompetisi)
                        }
                        disabled={processing === peserta.id_peserta_kompetisi}
                        className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-xs"
                      >
                        {processing === peserta.id_peserta_kompetisi ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Setujui
                      </button>
                      <button
                        onClick={() =>
                          handleRejection(peserta.id_peserta_kompetisi)
                        }
                        disabled={processing === peserta.id_peserta_kompetisi}
                        className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs"
                      >
                        {processing === peserta.id_peserta_kompetisi ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Tolak
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllPeserta;
