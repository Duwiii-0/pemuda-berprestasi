// src/pages/admin/AllAtlets.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, Loader, Eye, AlertTriangle } from "lucide-react";
import { useAtletContext, genderOptions } from "../../context/AtlitContext";
import { apiClient } from "../../config/api";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom"; // tambahkan import

const AllAtlets: React.FC = () => {
  const { atlits, fetchAllAtlits } = useAtletContext();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filterAgeCategory, setFilterAgeCategory] = useState<"ALL" | "CADET" | "JUNIOR" | "SENIOR">("ALL");


    // Set token global sekali aja
  useEffect(() => {
    // Token handled by apiClient automatically
  }, [token]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchAllAtlits();
      } catch (err: any) {
        console.error("Error fetching athletes:");
        setError("Gagal memuat data atlet");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAgeCategory = (umur: number | undefined): "CADET" | "JUNIOR" | "SENIOR" | undefined => {
    if (!umur) return undefined;
    if (umur >= 10 && umur <= 12) return "CADET";     // misal sekarang 2025 → lahir 2013-2011
    if (umur >= 13 && umur <= 15) return "JUNIOR";   // lahir 2010-2008
    if (umur >= 16) return "SENIOR";                 // lahir 2007 ke atas
  };

  const filteredAtlits = atlits.filter((atlet) => {
    const matchesSearch = atlet.nama_atlet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === "ALL" || atlet.jenis_kelamin === filterGender;

    const category = getAgeCategory(atlet.umur);
    const matchesAgeCategory = filterAgeCategory === "ALL" || category === filterAgeCategory;

    return matchesSearch && matchesGender && matchesAgeCategory;
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const ageCategories = [
    { value: "ALL", label: "Semua Kelompok Umur" },
    { value: "CADET", label: "Cadet (2011-2013)" },
    { value: "JUNIOR", label: "Junior (2008-2010)" },
    { value: "SENIOR", label: "Senior (2007 ke atas)" },
  ];

  const getGenderBadge = (gender: string) => {
    const styles = {
      LAKI_LAKI: "bg-blue-100 text-blue-800 border border-blue-200",
      PEREMPUAN: "bg-pink-100 text-pink-800 border border-pink-200",
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[gender as keyof typeof styles]}`}>
        {gender === "LAKI_LAKI" ? "Laki-Laki" : "Perempuan"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
        <p className="text-gray-600">Memuat data atlet...</p>
      </div>
    );
  }

  return (
<div className="p-8 max-w-full mx-auto space-y-10 px-48">
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="flex items-center gap-4">
      <Users className="text-red-500" size={60} />
      <div>
        <h1 className="text-7xl font-bebas text-black/90">Semua Atlet</h1>
        <p className="text-black/60 text-xl mt-1">Kelola data semua atlet</p>
      </div>
    </div>
  </div>

  {error && (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-300 rounded-2xl text-red-700">
      <AlertTriangle size={22} />
      <div className="flex-1 flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={fetchAllAtlits}
          className="text-red-600 font-semibold underline hover:no-underline"
        >
          Coba lagi
        </button>
      </div>
    </div>
  )}

{/* Filters */}
<div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg space-y-5">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
    {/* Search */}
    <div className="relative md:col-span-2">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
      <input
        type="text"
        placeholder="Cari berdasarkan nama atlet..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-14 pr-4 py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-lg transition placeholder-gray-400"
      />
    </div>

    {/* Gender Filter */}
<select
  value={filterGender}
  onChange={(e) => setFilterGender(e.target.value as any)}
  className="
    w-full
    px-4
    py-4
    rounded-3xl
    border-2
    border-gray-300
    bg-white/80
    backdrop-blur-sm
    shadow-lg
    text-sm md:text-base
    font-plex
    transition-all
    duration-300
    hover:shadow-xl
    hover:border-red/40
    focus:outline-none
    focus:border-red
    focus:shadow-red/10
  "
>
  <option value="ALL">Semua Jenis Kelamin</option>
  {genderOptions.map((opt) => (
    <option key={opt.value} value={opt.value} className="text-lg">
      {opt.label}
    </option>
  ))}
</select>

    {/* Age Category Filter */}
<select
  value={filterAgeCategory}
  onChange={(e) => setFilterAgeCategory(e.target.value as any)}
  className="
    w-full
    px-4
    py-4
    rounded-3xl
    border-2
    border-gray-300
    bg-white/80 backdrop-blur-sm shadow-lg text-sm md:text-base font-plex transition-all duration-300 hover:shadow-xl hover:border-red/40 focus:outline-none focus:border-red focus:shadow-red/10
  "
>
  {ageCategories.map((opt) => (
    <option key={opt.value} value={opt.value} className="text-lg">
      {opt.label}
    </option>
  ))}
</select>
  </div>

  <p className="text-gray-600 text-base">
    Menampilkan <span className="font-semibold">{filteredAtlits.length}</span> dari <span className="font-semibold">{atlits.length}</span> atlet
  </p>
</div>

  {/* Table */}
  <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-lg">
        <thead className="bg-yellow">
          <tr>
            <th className="py-5 px-6 font-semibold text-black/80">Nama Atlet</th>
            <th className="py-5 px-6 font-semibold text-black/80 text-center">Jenis Kelamin</th>
            <th className="py-5 px-6 font-semibold text-black/80 text-center">Tanggal Lahir</th>
            <th className="py-5 px-6 font-semibold text-black/80 text-center">Umur</th>
            <th className="py-5 px-6 font-semibold text-black/80 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredAtlits.map((atlet) => (
            <tr key={atlet.id_atlet} 
                onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)} 
                className="border-t border-gray-200 hover:bg-yellow/10 transition cursor-pointer">
              <td className="py-4 px-6 font-medium text-black/90 w-2/6">{atlet.nama_atlet}</td>
              <td className="py-4 px-6 text-center w-1/5">{getGenderBadge(atlet.jenis_kelamin)}</td>
              <td className="py-4 px-6 text-black/70 text-center w-1/5">{formatDate(atlet.tanggal_lahir)}</td>
              <td className="py-4 px-6 text-black/70 text-center w-1/5">{atlet.umur ?? '-'}</td>
              <td className="py-4 px-6 text-center">
                <button
                  className=" cursor-pointer p-2 text-white hover:bg-red-700 rounded-lg transition flex items-center gap-6 bg-red-500 px-4"
                  title="Lihat Detail"
                >
                  <Eye size={18} />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {filteredAtlits.length === 0 && !loading && (
      <div className="py-16 text-center text-gray-400">
        <Users size={52} className="mx-auto mb-4" />
        <p className="text-lg">Tidak ada atlet yang ditemukan</p>
      </div>
    )}
  </div>
</div>
  );
};

export default AllAtlets;
