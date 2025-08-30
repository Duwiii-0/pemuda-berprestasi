// src/pages/admin/AllAtlets.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, Loader, Eye, AlertTriangle } from "lucide-react";
import { useAtletContext, genderOptions } from "../../context/AtlitContext";
import type { Atlet } from "../../context/AtlitContext";
import { setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";
import { useAuth } from "../../context/authContext";

const AllAtlets: React.FC = () => {
  const { atlits, fetchAllAtlits } = useAtletContext();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [filterAgeCategory, setFilterAgeCategory] = useState<"ALL" | "CADET" | "JUNIOR" | "SENIOR">("ALL");


    // Set token global sekali aja
  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchAllAtlits();
      } catch (err: any) {
        console.error("Error fetching athletes:", err);
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-gray-600" size={24} />
          <h1 className="text-3xl font-bold text-gray-800">Semua Atlet</h1>
        </div>
        <p className="text-gray-600">Kelola data semua atlet</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button
              onClick={fetchAllAtlits}
              className="ml-4 text-red-800 underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atlet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="ALL">Semua Jenis Kelamin</option>
            {genderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filterAgeCategory}
            onChange={(e) => setFilterAgeCategory(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {ageCategories.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <p className="text-gray-600">
          Menampilkan <span className="font-semibold">{filteredAtlits.length}</span> dari <span className="font-semibold">{atlits.length}</span> atlet
        </p>
      </div>

      {/* Atlet Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Nama Atlet</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Jenis Kelamin</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Tanggal Lahir</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Umur</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtlits.map((atlet) => (
                <tr key={atlet.id_atlet} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{atlet.nama_atlet}</td>
                  <td className="py-4 px-6">{getGenderBadge(atlet.jenis_kelamin)}</td>
                  <td className="py-4 px-6 text-gray-600">{formatDate(atlet.tanggal_lahir)}</td>
                  <td className="py-4 px-6 text-gray-600">{atlet.umur ?? '-'}</td>
                  <td className="py-4 px-6">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                      title="Lihat Detail"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAtlits.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Tidak ada atlet yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAtlets;
