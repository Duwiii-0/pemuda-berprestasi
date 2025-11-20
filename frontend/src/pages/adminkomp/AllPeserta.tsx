// src/pages/adminkomp/AllPeserta.tsx
import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import toast from 'react-hot-toast';
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { apiClient } from "../../config/api";
import { useNavigate } from "react-router-dom";
import SelectTeamMemberModal from "../../components/selectTeamModal";
import Select from "react-select";
import { useDojang } from "../../context/dojangContext";
import { kelasBeratOptionsMap } from "../../dummy/beratOptions";
import * as XLSX from "xlsx";

const AllPeserta: React.FC = () => {
  const { user } = useAuth();
  const {
    pesertaList,
    fetchAtletByKompetisi,
    updatePesertaStatus,
    deleteParticipant,
    loadingAtlet,
  } = useKompetisi();
  const navigate = useNavigate();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any[]>([]);

  const [processing, setProcessing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [filterCategory, setFilterCategory] = useState<
    "ALL" | "KYORUGI" | "POOMSAE"
  >("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<string>("ALL");
  const [filterKelasUsia, setFilterKelasUsia] = useState<
    "ALL" | "Super pracadet" | "Pracadet" | "Cadet" | "Junior" | "Senior"
  >("ALL");
  const [filterLevel, setFilterLevel] = useState<"pemula" | "prestasi" | null>(
    null
  );
  const [filterPoomsaeType, setFilterPoomsaeType] = useState<"ALL" | "FREESTYLE" | "RECOGNIZED">(
    "ALL"
  );
  const [filterDojang, setFilterDojang] = useState<string>("ALL");
  const { dojangOptions, refreshDojang } = useDojang();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pesertaToDelete, setPesertaToDelete] = useState<any>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [pesertaToEdit, setPesertaToEdit] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [editFormData, setEditFormData] = useState({
    kelasKejuaraanId: "",
    currentClassName: "",
    status: "",
  });

  const [selectedPesertas, setSelectedPesertas] = useState(new Set<number>());

  useEffect(() => {
    refreshDojang();
  }, []);

  const handleToggleSelect = (pesertaId: number) => {
    setSelectedPesertas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pesertaId)) {
        newSet.delete(pesertaId);
      } else {
        newSet.add(pesertaId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPesertas.size === displayedPesertas.length) {
      setSelectedPesertas(new Set());
    } else {
      setSelectedPesertas(
        new Set(displayedPesertas.map((p) => p.id_peserta_kompetisi))
      );
    }
  };

  const handleBulkAction = async (status: "APPROVED" | "REJECTED") => {
    if (!kompetisiId || selectedPesertas.size === 0) return;

    const actionText = status === "APPROVED" ? "menyetujui" : "menolak";
    const totalSelected = selectedPesertas.size;
    const toastId = toast.loading(`Sedang ${actionText} ${totalSelected} peserta...`);

    const promises = Array.from(selectedPesertas).map((id) =>
      updatePesertaStatus(kompetisiId, id, status)
    );

    try {
      await Promise.all(promises);
      
      toast.success(
        `${totalSelected} peserta telah di-${status === "APPROVED" ? "setujui" : "tolak"}.`,
        { id: toastId }
      );

      setSelectedPesertas(new Set());
    } catch (error) {
      toast.error("Gagal memproses beberapa peserta.", { id: toastId });
      console.error("Error during bulk action:", error);
    }
  };

  const kompetisiId =
    user?.role === "ADMIN_KOMPETISI"
      ? user?.admin_kompetisi?.id_kompetisi
      : null;

  const handleRowClick = (peserta: any) => {
    if (peserta.is_team) {
      setSelectedTeam(peserta.anggota_tim.map((a: any) => a.atlet));
      setTeamModalOpen(true);
    } else if (peserta.atlet?.id_atlet) {
      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
    }
  };

  useEffect(() => {
    if (kompetisiId) fetchAtletByKompetisi(kompetisiId);
  }, [kompetisiId]);

  const handleDeletePeserta = async (peserta: any) => {
    setPesertaToDelete(peserta);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pesertaToDelete || !kompetisiId) return;

    const pesertaId = pesertaToDelete.id_peserta_kompetisi;
    const pesertaName = pesertaToDelete.is_team
      ? pesertaToDelete.anggota_tim
          ?.map((m: any) => m.atlet.nama_atlet)
          .join(", ")
      : pesertaToDelete.atlet?.nama_atlet;

    setDeleting(pesertaId);
    setShowDeleteModal(false); // Tutup modal immediately

    try {
      // ✅ GUNAKAN fungsi dari context, bukan manual API call
      await deleteParticipant(kompetisiId, pesertaId);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.style.maxWidth = "400px";
      notification.innerHTML = `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <div class="flex-1">
        <p class="font-semibold">Berhasil Dihapus!</p>
        <p class="text-sm opacity-90">${pesertaName}</p>
      </div>
    `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error deleting:", error);

      const errorMessage = error.message || "Gagal menghapus peserta";

      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.style.maxWidth = "400px";
      notification.innerHTML = `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <div class="flex-1">
        <p class="font-semibold">Gagal Menghapus!</p>
        <p class="text-sm opacity-90">${errorMessage}</p>
      </div>
    `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    } finally {
      setDeleting(null);
      setPesertaToDelete(null);
    }
  };

  const fetchAvailableClasses = async (
    kompetisiId: number,
    pesertaId: number
  ) => {
    setLoadingClasses(true);
    try {
      const response = await apiClient.get(
        `/kompetisi/${kompetisiId}/peserta/${pesertaId}/classes`
      );

      console.log("📦 Full Response:", response);
      console.log("📦 Response.data:", response.data);

      if (response.data && response.data.availableClasses) {
        const classes = response.data.availableClasses;
        const isAdminMode = response.data.isAdminMode || false;

        console.log("✅ Classes to set:", classes);
        console.log("✅ Classes length:", classes?.length);
        console.log("✅ First class:", classes?.[0]);
        console.log("✅ Admin mode:", isAdminMode);

        if (!classes || classes.length === 0) {
          console.error("❌ No classes found in response");
          alert("Tidak ada kelas yang tersedia");
          return null;
        }

        setAvailableClasses(classes);

        return {
          currentClass: response.data.currentClass,
          availableClasses: classes,
          isAdminMode: isAdminMode,
        };
      } else {
        console.error("❌ Invalid response structure:", response.data);
        alert("Format response tidak valid");
        return null;
      }
    } catch (error: any) {
      console.error("❌ Error fetching classes:", error);
      console.error("❌ Error response:", error.response);
      alert(error.response?.data?.message || "Gagal memuat daftar kelas");
      return null;
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleEditPeserta = async (peserta: any) => {
    console.log("🎯 Opening edit modal for:", peserta);

    setPesertaToEdit(peserta);

    // Format current class name
    const currentKelas = peserta.kelas_kejuaraan;
    let currentClassName = "";

    if (currentKelas) {
      currentClassName += currentKelas.cabang;
      currentClassName += ` - ${currentKelas.kategori_event?.nama_kategori}`;
      if (currentKelas.kelompok) {
        currentClassName += ` - ${currentKelas.kelompok.nama_kelompok}`;
      }
      if (currentKelas.kelas_berat) {
        currentClassName += ` - ${currentKelas.kelas_berat.nama_kelas}`;
      }
      if (currentKelas.poomsae) {
        currentClassName += ` - ${currentKelas.poomsae.nama_kelas}`;
      }
    }

    console.log("📝 Current class name:", currentClassName);

    setEditFormData({
      kelasKejuaraanId: currentKelas?.id_kelas_kejuaraan?.toString() || "",
      currentClassName: currentClassName,
      status: peserta.status || "PENDING",
    });

    // ✅ Fetch classes SEBELUM buka modal
    if (kompetisiId) {
      console.log("🔄 Fetching classes...");
      const result = await fetchAvailableClasses(
        kompetisiId,
        peserta.id_peserta_kompetisi
      );

      console.log("🔄 Fetch result:", result);

      if (result && result.availableClasses) {
        console.log(
          "✅ Classes fetched successfully:",
          result.availableClasses.length
        );
        // ✅ Pastikan state di-set lagi kalau perlu
        setAvailableClasses(result.availableClasses);
      } else {
        console.error("❌ No classes returned from fetch");
      }
    }

    // ✅ Buka modal SETELAH data siap
    console.log("🚪 Opening modal...");
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!pesertaToEdit || !kompetisiId) return;

    const isChangingClass =
      editFormData.kelasKejuaraanId &&
      editFormData.kelasKejuaraanId !==
        pesertaToEdit.kelas_kejuaraan?.id_kelas_kejuaraan?.toString();

    const isChangingStatus = editFormData.status !== pesertaToEdit.status;

    console.log("🔍 Validation:", {
      isChangingClass,
      isChangingStatus,
      kelasKejuaraanId: editFormData.kelasKejuaraanId,
      currentKelasId: pesertaToEdit.kelas_kejuaraan?.id_kelas_kejuaraan,
      status: editFormData.status,
      currentStatus: pesertaToEdit.status,
    });

    if (!isChangingClass && !isChangingStatus) {
      alert("Tidak ada perubahan yang dilakukan!");
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = {};

      if (isChangingClass && editFormData.kelasKejuaraanId) {
        payload.kelas_kejuaraan_id = Number(editFormData.kelasKejuaraanId);
      }

      if (isChangingStatus) {
        payload.status = editFormData.status;
      }

      console.log("📤 Sending payload:", payload);
      console.log(
        "📍 Endpoint:",
        `/kompetisi/${kompetisiId}/peserta/${pesertaToEdit.id_peserta_kompetisi}`
      );

      const response = await apiClient.put(
        `/kompetisi/${kompetisiId}/peserta/${pesertaToEdit.id_peserta_kompetisi}`,
        payload
      );

      console.log("✅ Response:", response);

      // ✅ UPDATE DOM LANGSUNG tanpa full refresh
      const updatedPeserta = response.data.data;

      // Update di state pesertaList
      const updatedList = pesertaList.map((p) =>
        p.id_peserta_kompetisi === pesertaToEdit.id_peserta_kompetisi
          ? { ...p, ...updatedPeserta }
          : p
      );

      // Trigger manual update ke context (jika ada setter)
      // Atau bisa langsung update UI dengan re-render

      // ✅ UPDATE DOM ELEMENT
      const rowElement = document.querySelector(
        `[data-peserta-id="${pesertaToEdit.id_peserta_kompetisi}"]`
      );
      if (rowElement) {
        // Add success animation
        rowElement.classList.add("animate-pulse-success");

        setTimeout(() => {
          rowElement.classList.remove("animate-pulse-success");
        }, 1000);

        // Update status badge jika ada perubahan status
        if (isChangingStatus) {
          const statusBadge = rowElement.querySelector(".status-badge");
          if (statusBadge) {
            statusBadge.className =
              "status-badge px-2 py-1 rounded-full text-xs font-medium";

            const statusMap = {
              PENDING: { bg: "rgba(245, 183, 0, 0.2)", text: "#050505" },
              APPROVED: { bg: "rgba(34, 197, 94, 0.2)", text: "#059669" },
              REJECTED: { bg: "rgba(153, 13, 53, 0.1)", text: "#990D35" },
            };

            const colors =
              statusMap[editFormData.status as keyof typeof statusMap];
            if (colors) {
              (statusBadge as HTMLElement).style.backgroundColor = colors.bg;
              (statusBadge as HTMLElement).style.color = colors.text;
              statusBadge.textContent = editFormData.status;
            }
          }
        }

        // Update kelas info jika ada perubahan kelas
        if (isChangingClass) {
          const selectedClass = availableClasses.find(
            (k) => k.value === editFormData.kelasKejuaraanId
          );
          if (selectedClass) {
            // Update kategori cell
            const kategoriCell = rowElement.querySelector(".kategori-cell");
            if (kategoriCell) {
              kategoriCell.textContent = selectedClass.details.cabang;
            }

            // Update level cell
            const levelCell = rowElement.querySelector(".level-cell");
            if (levelCell) {
              levelCell.textContent = selectedClass.details.level;
            }

            // Update kelas berat cell
            const kelasBeratCell =
              rowElement.querySelector(".kelas-berat-cell");
            if (kelasBeratCell) {
              kelasBeratCell.textContent = selectedClass.details.kelasBerat;
            }

            // Update kelas poomsae cell
            const kelasPoomsaeCell = rowElement.querySelector(
              ".kelas-poomsae-cell"
            );
            if (kelasPoomsaeCell) {
              kelasPoomsaeCell.textContent = selectedClass.details.kelasPoomsae;
            }

            // Update kelompok usia cell
            const kelasUsiaCell = rowElement.querySelector(".kelas-usia-cell");
            if (kelasUsiaCell) {
              kelasUsiaCell.textContent = selectedClass.details.kelompokUsia;
            }
          }
        }
      }

      // Success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <div>
        <p class="font-semibold">Berhasil Diupdate!</p>
        <p class="text-sm opacity-90">${
          isChangingClass ? "Kelas dan status" : "Status"
        } telah diperbarui</p>
      </div>
    `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 3000);

      // ✅ Refresh data dari server (background update)
      fetchAtletByKompetisi(kompetisiId);

      setShowEditModal(false);
      setPesertaToEdit(null);
      setAvailableClasses([]);
    } catch (error: any) {
      console.error("❌ Error updating:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error data:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      const errorMsg =
        error.response?.data?.message || "Gagal mengupdate peserta";

      // Error notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <div>
        <p class="font-semibold">Gagal Update!</p>
        <p class="text-sm opacity-90">${errorMsg}</p>
      </div>
    `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!kompetisiId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchAtletByKompetisi(kompetisiId);

      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.style.maxWidth = "400px";
      notification.innerHTML = `
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <div class="flex-1">
          <p class="font-semibold">Data Diperbarui!</p>
          <p class="text-sm opacity-90">Data peserta telah di-refresh</p>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 2000);

      console.log("✅ Manual refresh completed");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);

    try {
      const kompetisiInfo = user?.admin_kompetisi as any;

      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const headerInfo = [
        ["LAPORAN DATA PESERTA KOMPETISI"],
        [
          "Nama Event",
          kompetisiInfo?.nama_event ||
            "Sriwijaya International Taekwondo Championship 2025",
        ],
        ["Lokasi", kompetisiInfo?.lokasi || "GOR Ranau JSC Palembang"],
        ["Tanggal Export", currentDate],
        ["Total Peserta", displayedPesertas.length.toString()],
        [],
      ];

      const exportData = displayedPesertas.map(
        (peserta: any, index: number) => {
          const isTeam = peserta.is_team;

          const namaPeserta = isTeam
            ? peserta.anggota_tim
                ?.map((m: any) => m.atlet.nama_atlet)
                .join(", ")
            : peserta.atlet?.nama_atlet || "-";

          const cabang = peserta.kelas_kejuaraan?.cabang || "-";
          const levelEvent =
            peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";

          const kelasBerat =
            cabang === "KYORUGI"
              ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"
              : "-";

          const kelasPoomsae =
            cabang === "POOMSAE"
              ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"
              : "-";

          const kelasUsia =
            peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";

          const jenisKelamin = !isTeam
            ? peserta.atlet?.jenis_kelamin === "LAKI_LAKI"
              ? "Laki-Laki"
              : peserta.atlet?.jenis_kelamin === "PEREMPUAN"
              ? "Perempuan"
              : "-"
            : "-";

          const dojang =
            isTeam && peserta.anggota_tim?.length
              ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
              : peserta.atlet?.dojang?.nama_dojang || "-";

          const tanggalLahir = !isTeam
            ? peserta.atlet?.tanggal_lahir || "-"
            : "-";

          const beratBadan = !isTeam
            ? peserta.atlet?.berat_badan
              ? `${peserta.atlet.berat_badan} kg`
              : "-"
            : "-";

          const tingiBadan = !isTeam
            ? peserta.atlet?.tinggi_badan
              ? `${peserta.atlet.tinggi_badan} cm`
              : "-"
            : "-";

          const sabuk = !isTeam
            ? peserta.atlet?.sabuk?.nama_sabuk || peserta.atlet?.belt || "-"
            : "-";

          const anggotaTimDetail =
            isTeam && peserta.anggota_tim?.length
              ? peserta.anggota_tim
                  .map(
                    (m: any, i: number) =>
                      `${i + 1}. ${m.atlet.nama_atlet} (${
                        m.atlet.dojang?.nama_dojang || "-"
                      })`
                  )
                  .join("; ")
              : "-";

          return {
            No: index + 1,
            "Nama Peserta": namaPeserta,
            Tipe: isTeam ? "Tim" : "Individu",
            Kategori: cabang,
            Level: levelEvent,
            "Kelas Berat": kelasBerat,
            "Kelas Poomsae": kelasPoomsae,
            "Kelompok Usia": kelasUsia,
            "Jenis Kelamin": jenisKelamin,
            "Tanggal Lahir": tanggalLahir,
            "Berat Badan": beratBadan,
            "Tinggi Badan": tingiBadan,
            Sabuk: sabuk,
            Dojang: dojang,
            Status: peserta.status,
            "Anggota Tim": anggotaTimDetail,
          };
        }
      );

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);

      XLSX.utils.sheet_add_json(worksheet, exportData, {
        origin: `A${headerInfo.length + 1}`,
        skipHeader: false,
      });

      const columnWidths = [
        { wch: 5 },
        { wch: 30 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 50 },
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `Data_Peserta_Sriwijaya_Cup_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Gagal export data ke Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (user?.role !== "ADMIN_KOMPETISI") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div
          className="rounded-xl shadow-sm border p-6 max-w-md w-full"
          style={{
            backgroundColor: "rgba(153, 13, 53, 0.05)",
            borderColor: "rgba(153, 13, 53, 0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#990D35" }}
            />
            <p className="text-sm sm:text-base" style={{ color: "#990D35" }}>
              Akses ditolak. Hanya Admin Kompetisi yang dapat melihat daftar
              peserta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!kompetisiId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div
          className="rounded-xl shadow-sm border p-6 max-w-md w-full"
          style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
        >
          <p
            className="text-sm sm:text-base"
            style={{ color: "#050505", opacity: 0.6 }}
          >
            ⚠ Tidak ada kompetisi terkait akun ini.
          </p>
        </div>
      </div>
    );
  }

  const handleApproval = async (id: number) => {
    if (!kompetisiId) return;
    setProcessing(id);
    try {
      await updatePesertaStatus(kompetisiId, id, "APPROVED");

      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.style.maxWidth = "400px";
      notification.innerHTML = `
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="flex-1">
          <p class="font-semibold">Peserta Disetujui!</p>
          <p class="text-sm opacity-90">Status berhasil diubah</p>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejection = async (id: number) => {
    if (!kompetisiId) return;
    setProcessing(id);
    try {
      await updatePesertaStatus(kompetisiId, id, "REJECTED");

      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in";
      notification.style.maxWidth = "400px";
      notification.style.backgroundColor = "#990D35";
      notification.innerHTML = `
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="flex-1">
          <p class="font-semibold">Peserta Ditolak</p>
          <p class="text-sm opacity-90">Status berhasil diubah</p>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        notification.style.transition = "all 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    } finally {
      setProcessing(null);
    }
  };

  const displayedPesertas = pesertaList.filter((peserta: any) => {
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a: any) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";

    const matchesSearch = namaPeserta
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const pesertaStatus = peserta.status?.toUpperCase() || "";
    const matchesStatus =
      filterStatus === "ALL" || pesertaStatus === filterStatus.toUpperCase();
    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory =
      filterCategory === "ALL" || kategori === filterCategory.toUpperCase();
    const kelasBerat =
      peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas?.toUpperCase() || "";
    const matchesKelasBerat =
      filterKelasBerat === "ALL" ||
      kelasBerat === filterKelasBerat.toUpperCase();
    const kelasUsia =
      peserta.kelas_kejuaraan?.kelompok?.nama_kelompok?.toUpperCase() || "";
    const matchesKelasUsia =
      filterKelasUsia === "ALL" || kelasUsia === filterKelasUsia.toUpperCase();
    const level =
      peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toUpperCase() ||
      "";
    const matchesLevel = !filterLevel || level === filterLevel.toUpperCase();
    const poomsaeType = peserta.kelas_kejuaraan?.poomsae_type?.toUpperCase() || "";
    const matchesPoomsaeType =
      filterPoomsaeType === "ALL" || poomsaeType === filterPoomsaeType.toUpperCase();
    const pesertaDojang = peserta.is_team
      ? peserta.anggota_tim?.[0]?.atlet?.dojang?.id_dojang?.toString() || ""
      : peserta.atlet?.dojang?.id_dojang?.toString() || "";
    const matchesDojang =
      filterDojang === "ALL" || pesertaDojang === filterDojang;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesKelasBerat &&
      matchesKelasUsia &&
      matchesLevel &&
      matchesPoomsaeType &&
      matchesDojang
    );
  });

  const totalPages = Math.ceil(displayedPesertas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPesertas = displayedPesertas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterStatus,
    filterCategory,
    filterKelasBerat,
    filterKelasUsia,
    filterLevel,
    filterPoomsaeType,
    filterDojang,
    itemsPerPage,
  ]);

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const categoryOptions = [
    { value: "ALL", label: "Semua Kategori" },
    { value: "KYORUGI", label: "KYORUGI" },
    { value: "POOMSAE", label: "POOMSAE" },
  ];

  const levelOptions = [
    { value: null, label: "Semua Level" },
    { value: "pemula", label: "Pemula" },
    { value: "prestasi", label: "Prestasi" },
  ];

  const ageOptions = [
    { value: "ALL", label: "Semua Kelompok Umur" },
    { value: "Super Pra-cadet", label: "Super Pra-Cadet (2017-2020)" },
    { value: "Pracadet", label: "Pracadet (2014-2016)" },
    { value: "Cadet", label: "Cadet (2011-2013)" },
    { value: "Junior", label: "Junior (2008-2010)" },
    { value: "Senior", label: "Senior (2007 ke atas)" },
  ];

  const itemsPerPageOptions = [
    { value: 25, label: "25 per halaman" },
    { value: 50, label: "50 per halaman" },
    { value: 100, label: "100 per halaman" },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { bg: "rgba(245, 183, 0, 0.2)", text: "#050505" },
      APPROVED: { bg: "rgba(34, 197, 94, 0.2)", text: "#059669" },
      REJECTED: { bg: "rgba(153, 13, 53, 0.1)", text: "#990D35" },
    };
    const colors =
      statusMap[status as keyof typeof statusMap] || statusMap.PENDING;

    return (
      <span
        className="status-badge px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {status}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (loadingAtlet) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader
            className="animate-spin"
            style={{ color: "#990D35" }}
            size={32}
          />
          <p style={{ color: "#050505", opacity: 0.6 }}>
            Memuat data peserta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out forwards;
  }

  .row-removing {
    animation: fadeOut 0.3s ease-out forwards;
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  /* ✅ Tambahkan animation untuk success update */
  @keyframes pulse-success {
    0%, 100% {
      background-color: transparent;
    }
    50% {
      background-color: rgba(34, 197, 94, 0.1);
    }
  }

  .animate-pulse-success {
    animation: pulse-success 1s ease-in-out;
  }
`}</style>

      <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          {/* HEADER */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <Users
                  size={28}
                  className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0"
                  style={{ color: "#990D35" }}
                />
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bebas leading-tight"
                    style={{ color: "#050505" }}
                  >
                    Daftar Peserta Sriwijaya International Taekwondo
                    Championship 2025
                  </h1>
                  <p
                    className="text-sm sm:text-base mt-1"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Kelola semua peserta kompetisi Sriwijaya International
                    Taekwondo Championship 2025
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing || loadingAtlet}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "#F5FBEF",
                    color: "#990D35",
                    borderColor: "#990D35",
                  }}
                  title="Refresh data peserta"
                >
                  {isRefreshing ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || displayedPesertas.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "#990D35",
                    color: "#F5FBEF",
                    borderColor: "#990D35",
                  }}
                >
                  {isExporting ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span className="hidden sm:inline">Export Excel</span>
                      <span className="sm:hidden">Export</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* FILTER + SEARCH */}
          <div
            className="rounded-xl shadow-sm border p-4 sm:p-6 mb-6"
            style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
          >
            <div className="space-y-4">
              <div className="w-full">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#050505", opacity: 0.4 }}
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Cari peserta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Kategori
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Tipe Poomsae
                  </label>
                  <select
                    value={filterPoomsaeType}
                    onChange={(e) => setFilterPoomsaeType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    <option value="ALL">Semua Tipe Poomsae</option>
                    <option value="FREESTYLE">Freestyle</option>
                    <option value="RECOGNIZED">Recognized</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Level
                  </label>
                  <select
                    value={filterLevel || ""}
                    onChange={(e) =>
                      setFilterLevel(
                        (e.target.value as "pemula" | "prestasi" | null) || null
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {levelOptions.map((opt) => (
                      <option key={opt.value || "null"} value={opt.value || ""}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Usia
                  </label>
                  <select
                    value={filterKelasUsia}
                    onChange={(e) => setFilterKelasUsia(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {ageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-3 lg:col-span-1">
                  <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Dojang</label>
                  <Select
                    options={[{ value: "ALL", label: "Semua Dojang" }, ...dojangOptions]}
                    value={[{ value: "ALL", label: "Semua Dojang" }, ...dojangOptions].find(opt => opt.value === filterDojang)}
                    onChange={(option) => setFilterDojang(option ? option.value : "ALL")}
                    isSearchable
                    placeholder="Cari dojang..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#F5FBEF',
                        borderColor: '#990D35',
                        borderRadius: '0.75rem',
                        padding: '0.3rem',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#990D35',
                        },
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#050505',
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#F5FBEF',
                        borderRadius: '0.75rem',
                        borderColor: '#990D35',
                        borderWidth: '1px',
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected ? '#990D35' : isFocused ? 'rgba(245, 183, 0, 0.1)' : '#F5FBEF',
                        color: isSelected ? '#F5FBEF' : '#050505',
                        '&:active': {
                          backgroundColor: '#990D35',
                        },
                      }),
                    }}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Kelas Berat
                  </label>
                  <select
                    value={filterKelasBerat}
                    onChange={(e) => setFilterKelasBerat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {kelasBeratOptionsMap[filterKelasUsia || "ALL"].map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t"
                style={{ borderColor: "rgba(153, 13, 53, 0.2)" }}
              >
                <div className="flex items-center gap-3">
                  <p
                    className="text-sm"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Menampilkan{" "}
                    <span className="font-semibold">
                      {startIndex + 1}-
                      {Math.min(endIndex, displayedPesertas.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold">
                      {displayedPesertas.length}
                    </span>{" "}
                    peserta
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Tampilkan:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border shadow-sm text-sm transition-colors"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                      color: "#050505",
                    }}
                  >
                    {itemsPerPageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <>
            {isRefreshing && (
              <div className="fixed top-20 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in">
                <Loader className="animate-spin" size={20} />
                <span className="text-sm font-medium">Memperbarui data...</span>
              </div>
            )}

            {/* Mobile Cards View */}
            <div className="block lg:hidden space-y-4">
              {currentPesertas.map((peserta: any) => {
                const isTeam = peserta.is_team;
                const namaPeserta = isTeam
                  ? peserta.anggota_tim
                      ?.map((m: any) => m.atlet.nama_atlet)
                      .join(", ")
                  : peserta.atlet?.nama_atlet || "-";

                const cabang = peserta.kelas_kejuaraan?.cabang || "-";
                const levelEvent =
                  peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
                const kelasUsia =
                  peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";
                const dojang =
                  isTeam && peserta.anggota_tim?.length
                    ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                    : peserta.atlet?.dojang?.nama_dojang || "-";

                return (
                  <div
                    key={peserta.id_peserta_kompetisi}
                    data-peserta-id={peserta.id_peserta_kompetisi}
                    className="rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                    style={{
                      backgroundColor: selectedPesertas.has(
                        peserta.id_peserta_kompetisi
                      )
                        ? "rgba(245, 183, 0, 0.1)"
                        : "#F5FBEF",
                      borderColor: "#990D35",
                    }}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center flex-1 min-w-0 pr-3">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-4 flex-shrink-0"
                            checked={selectedPesertas.has(
                              peserta.id_peserta_kompetisi
                            )}
                            onChange={() =>
                              handleToggleSelect(peserta.id_peserta_kompetisi)
                            }
                          />
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleRowClick(peserta)}
                          >
                            <h3
                              className="font-semibold text-base leading-tight"
                              style={{ color: "#050505" }}
                            >
                              {namaPeserta}
                            </h3>
                            <p
                              className="text-sm mt-1"
                              style={{ color: "#050505", opacity: 0.6 }}
                            >
                              {cabang} - {levelEvent}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(peserta.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pl-9">
                        <div>
                          <span style={{ color: "#050505", opacity: 0.5 }}>
                            Kelas:
                          </span>
                          <p
                            className="font-medium"
                            style={{ color: "#050505" }}
                          >
                            {kelasUsia}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: "#050505", opacity: 0.5 }}>
                            Dojang:
                          </span>
                          <p
                            className="font-medium truncate"
                            style={{ color: "#050505" }}
                          >
                            {dojang}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 p-4 pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproval(peserta.id_peserta_kompetisi);
                        }}
                        disabled={processing === peserta.id_peserta_kompetisi}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
                      >
                        {processing === peserta.id_peserta_kompetisi ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        <span className="hidden xs:inline">Setujui</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejection(peserta.id_peserta_kompetisi);
                        }}
                        disabled={processing === peserta.id_peserta_kompetisi}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all text-sm font-medium"
                        style={{ backgroundColor: "#990D35" }}
                      >
                        {processing === peserta.id_peserta_kompetisi ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span className="hidden xs:inline">Tolak</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePeserta(peserta);
                        }}
                        disabled={deleting === peserta.id_peserta_kompetisi}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium"
                      >
                        {deleting === peserta.id_peserta_kompetisi ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPeserta(peserta);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View - UPDATE dengan class names */}
            <div className="hidden lg:block">
              <div
                className="rounded-xl shadow-sm border overflow-hidden"
                style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: "#F5B700" }}>
                      <tr>
                        <th className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={handleSelectAll}
                            checked={
                              displayedPesertas.length > 0 &&
                              selectedPesertas.size === displayedPesertas.length
                            }
                          />
                        </th>
                        {[
                          "Nama Peserta",
                          "Kategori",
                          "Level",
                          "Kelas Berat",
                          "Kelas Poomsae",
                          "Kelompok Usia",
                          "Jenis Kelamin",
                          "Dojang",
                          "Status",
                          "Aksi",
                        ].map((header) => (
                          <th
                            key={header}
                            className={`py-3 px-4 font-semibold text-sm ${
                              [
                                "Dojang",
                                "Usia/Kelompok",
                                "Jenis Kelamin",
                                "Status",
                                "Aksi",
                              ].includes(header)
                                ? "text-center"
                                : "text-left"
                            }`}
                            style={{ color: "#050505" }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y"
                      style={{ borderColor: "#990D35" }}
                    >
                      {currentPesertas.map((peserta: any) => {
                        const isTeam = peserta.is_team;
                        const namaPeserta = isTeam
                          ? peserta.anggota_tim
                              ?.map((m: any) => m.atlet.nama_atlet)
                              .join(", ")
                          : peserta.atlet?.nama_atlet || "-";
                        const cabang = peserta.kelas_kejuaraan?.cabang || "-";
                        const levelEvent =
                          peserta.kelas_kejuaraan?.kategori_event
                            ?.nama_kategori || "-";
                        const kelasBerat =
                          cabang === "KYORUGI"
                            ? peserta.kelas_kejuaraan?.kelas_berat
                                ?.nama_kelas || "-"
                            : "-";
                        const kelasUsia =
                          peserta.kelas_kejuaraan?.kelompok?.nama_kelompok ||
                          "-";
                        const jenisKelamin = !isTeam
                          ? peserta.atlet?.jenis_kelamin || "-"
                          : "-";
                        const dojang =
                          isTeam && peserta.anggota_tim?.length
                            ? peserta.anggota_tim[0]?.atlet?.dojang
                                ?.nama_dojang || "-"
                            : peserta.atlet?.dojang?.nama_dojang || "-";

                        return (
                          <tr
                            key={peserta.id_peserta_kompetisi}
                            data-peserta-id={peserta.id_peserta_kompetisi}
                            className="transition-colors"
                            style={{
                              backgroundColor: selectedPesertas.has(
                                peserta.id_peserta_kompetisi
                              )
                                ? "rgba(245, 183, 0, 0.1)"
                                : "transparent",
                            }}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedPesertas.has(
                                  peserta.id_peserta_kompetisi
                                )}
                                onChange={() =>
                                  handleToggleSelect(
                                    peserta.id_peserta_kompetisi
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td
                              className="py-3 px-4 font-medium text-sm cursor-pointer"
                              style={{ color: "#050505" }}
                              onClick={() => handleRowClick(peserta)}
                            >
                              <div
                                className="max-w-[200px] truncate"
                                title={namaPeserta}
                              >
                                {namaPeserta}
                              </div>
                            </td>
                            {/* ✅ Tambahkan class names */}
                            <td
                              className="kategori-cell py-3 px-4 text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {cabang}
                            </td>
                            <td
                              className="level-cell py-3 px-4 text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {levelEvent}
                            </td>
                            <td
                              className="kelas-berat-cell py-3 px-4 text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {kelasBerat}
                            </td>
                            <td
                              className="kelas-poomsae-cell py-3 px-4 text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {peserta.kelas_kejuaraan?.cabang === "POOMSAE"
                                ? peserta.kelas_kejuaraan?.poomsae
                                    ?.nama_kelas || "-"
                                : "-"}
                            </td>
                            <td
                              className="kelas-usia-cell py-3 px-4 text-center text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {kelasUsia}
                            </td>
                            <td
                              className="py-3 px-4 text-center text-sm"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {jenisKelamin === "LAKI_LAKI"
                                ? "Laki-Laki"
                                : jenisKelamin === "PEREMPUAN"
                                ? "Perempuan"
                                : "-"}
                            </td>
                            <td
                              className="py-3 px-4 text-sm text-center"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              <div
                                className="max-w-[150px] truncate"
                                title={dojang}
                              >
                                {dojang}
                              </div>
                            </td>
                            {/* ✅ Tambahkan class status-badge */}
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(peserta.status)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproval(
                                      peserta.id_peserta_kompetisi
                                    );
                                  }}
                                  disabled={
                                    processing === peserta.id_peserta_kompetisi
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
                                  title="Setujui peserta"
                                >
                                  {processing ===
                                  peserta.id_peserta_kompetisi ? (
                                    <Loader
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                  <span className="hidden xl:inline">
                                    Setujui
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejection(
                                      peserta.id_peserta_kompetisi
                                    );
                                  }}
                                  disabled={
                                    processing === peserta.id_peserta_kompetisi
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all text-sm font-medium"
                                  style={{ backgroundColor: "#990D35" }}
                                  title="Tolak peserta"
                                >
                                  {processing ===
                                  peserta.id_peserta_kompetisi ? (
                                    <Loader
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                  <span className="hidden xl:inline">
                                    Tolak
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePeserta(peserta);
                                  }}
                                  disabled={
                                    deleting === peserta.id_peserta_kompetisi
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium"
                                  title="Hapus peserta"
                                >
                                  {deleting === peserta.id_peserta_kompetisi ? (
                                    <Loader
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                  <span className="hidden xl:inline">
                                    Hapus
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPeserta(peserta);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                                  title="Edit peserta"
                                >
                                  <Edit size={16} />
                                  <span className="hidden xl:inline">Edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {displayedPesertas.length === 0 && (
              <div
                className="py-16 text-center"
                style={{ color: "#050505", opacity: 0.4 }}
              >
                <Users size={52} className="mx-auto mb-4" />
                <p className="text-lg">Tidak ada peserta yang ditemukan</p>
                {(searchTerm ||
                  filterStatus !== "ALL" ||
                  filterCategory !== "ALL" ||
                  filterKelasUsia !== "ALL" ||
                  filterLevel ||
                  filterDojang !== "ALL") && (
                  <p className="text-sm mt-2">
                    Coba ubah filter pencarian Anda
                  </p>
                )}
              </div>
            )}
          </>

          {totalPages > 1 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl shadow-sm border p-4 sm:p-6 mt-6"
              style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
            >
              <div className="flex items-center gap-4 order-2 sm:order-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all-footer"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={handleSelectAll}
                    checked={
                      displayedPesertas.length > 0 &&
                      selectedPesertas.size === displayedPesertas.length
                    }
                  />
                  <label
                    htmlFor="select-all-footer"
                    className="ml-2 text-sm font-medium"
                    style={{ color: "#050505" }}
                  >
                    Pilih Semua ({selectedPesertas.size} dipilih)
                  </label>
                </div>
                {selectedPesertas.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction("APPROVED")}
                      className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-xs font-medium"
                    >
                      <CheckCircle size={14} />
                      Setujui
                    </button>
                    <button
                      onClick={() => handleBulkAction("REJECTED")}
                      className="flex items-center gap-1 px-3 py-2 text-white rounded-lg hover:shadow-md transition-all text-xs font-medium"
                      style={{ backgroundColor: "#990D35" }}
                    >
                      <XCircle size={14} />
                      Tolak
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  style={{
                    borderColor: "#990D35",
                    backgroundColor: "#F5FBEF",
                    color: "#050505",
                  }}
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-2 text-sm"
                        style={{ color: "#050505", opacity: 0.4 }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum as number)}
                        className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm min-w-[32px] sm:min-w-[40px]`}
                        style={{
                          backgroundColor:
                            currentPage === pageNum ? "#990D35" : "#F5FBEF",
                          color:
                            currentPage === pageNum ? "#F5FBEF" : "#050505",
                          border:
                            currentPage === pageNum
                              ? "none"
                              : `1px solid #990D35`,
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  style={{
                    borderColor: "#990D35",
                    backgroundColor: "#F5FBEF",
                    color: "#050505",
                  }}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {showDeleteModal && pesertaToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div
                  className="p-6 flex flex-col items-center"
                  style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    <Trash2 size={40} style={{ color: "white" }} />
                  </div>

                  <h3
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: "#050505" }}
                  >
                    Hapus Peserta?
                  </h3>

                  <p
                    className="text-center text-base leading-relaxed mb-4"
                    style={{ color: "#050505", opacity: 0.7 }}
                  >
                    Apakah Anda yakin ingin menghapus peserta{" "}
                    <strong>
                      {pesertaToDelete.is_team
                        ? pesertaToDelete.anggota_tim
                            ?.map((m: any) => m.atlet.nama_atlet)
                            .join(", ")
                        : pesertaToDelete.atlet?.nama_atlet}
                    </strong>{" "}
                    dari database?
                  </p>

                  <p
                    className="text-center text-base"
                    style={{ color: "#DC2626" }}
                  >
                    Aksi ini tidak dapat dibatalkan!
                  </p>
                </div>

                <div className="p-6 bg-gray-50 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPesertaToDelete(null);
                      // JANGAN set deleting di sini!
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:bg-white border-2"
                    style={{
                      borderColor: "#990D35",
                      color: "#990D35",
                      backgroundColor: "white",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting !== null}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#DC2626", color: "white" }}
                  >
                    {deleting !== null ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        <span>Ya, Hapus</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditModal && pesertaToEdit && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
                <div
                  className="p-6"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      <Edit size={24} style={{ color: "white" }} />
                    </div>
                    <div>
                      <h3
                        className="text-2xl font-bold"
                        style={{ color: "#050505" }}
                      >
                        Edit Peserta
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "#050505", opacity: 0.6 }}
                      >
                        {pesertaToEdit.is_team
                          ? pesertaToEdit.anggota_tim
                              ?.map((m: any) => m.atlet.nama_atlet)
                              .join(", ")
                          : pesertaToEdit.atlet?.nama_atlet}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Current Class Info */}
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Kelas Saat Ini:
                    </p>
                    <p className="text-sm text-blue-800">
                      {editFormData.currentClassName || "Tidak ada kelas"}
                    </p>
                  </div>

                  {/* Kelas Kejuaraan Dropdown */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "#050505" }}
                    >
                      Ubah Kelas Kejuaraan{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {loadingClasses ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader
                          className="animate-spin"
                          size={24}
                          style={{ color: "#3B82F6" }}
                        />
                        <span
                          className="ml-2 text-sm"
                          style={{ color: "#050505", opacity: 0.6 }}
                        >
                          Memuat kelas...
                        </span>
                      </div>
                    ) : (
                      <select
                        value={editFormData.kelasKejuaraanId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            kelasKejuaraanId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "#990D35",
                          backgroundColor: "#F5FBEF",
                        }}
                      >
                        <option value="">-- Pilih Kelas Baru --</option>
                        {availableClasses.map((kelas) => (
                          <option
                            key={kelas.value}
                            value={kelas.value}
                            disabled={kelas.isCurrentClass}
                          >
                            {kelas.label}{" "}
                            {kelas.isCurrentClass ? "(Kelas Saat Ini)" : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    <p
                      className="text-xs mt-2"
                      style={{ color: "#050505", opacity: 0.5 }}
                    >
                      Format: Kategori - Level - Kelompok Usia - Kelas
                      Berat/Poomsae
                    </p>
                  </div>

                  {/* Status Peserta */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "#050505" }}
                    >
                      Status Peserta
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "#990D35",
                        backgroundColor: "#F5FBEF",
                      }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  {/* Preview Selected Class Details */}
                  {editFormData.kelasKejuaraanId &&
                    editFormData.kelasKejuaraanId !==
                      pesertaToEdit.kelas_kejuaraan?.id_kelas_kejuaraan?.toString() && (
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-sm font-semibold text-green-900 mb-2">
                          Kelas Baru:
                        </p>
                        {availableClasses.find(
                          (k) => k.value === editFormData.kelasKejuaraanId
                        )?.details && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                            <div>
                              <span className="font-semibold">Kategori:</span>{" "}
                              {
                                availableClasses.find(
                                  (k) =>
                                    k.value === editFormData.kelasKejuaraanId
                                )?.details.cabang
                              }
                            </div>
                            <div>
                              <span className="font-semibold">Level:</span>{" "}
                              {
                                availableClasses.find(
                                  (k) =>
                                    k.value === editFormData.kelasKejuaraanId
                                )?.details.level
                              }
                            </div>
                            <div>
                              <span className="font-semibold">Usia:</span>{" "}
                              {
                                availableClasses.find(
                                  (k) =>
                                    k.value === editFormData.kelasKejuaraanId
                                )?.details.kelompokUsia
                              }
                            </div>
                            <div>
                              <span className="font-semibold">Berat:</span>{" "}
                              {
                                availableClasses.find(
                                  (k) =>
                                    k.value === editFormData.kelasKejuaraanId
                                )?.details.kelasBerat
                              }
                            </div>
                            {availableClasses.find(
                              (k) => k.value === editFormData.kelasKejuaraanId
                            )?.details.kelasPoomsae !== "-" && (
                              <div className="col-span-2">
                                <span className="font-semibold">Poomsae:</span>{" "}
                                {
                                  availableClasses.find(
                                    (k) =>
                                      k.value === editFormData.kelasKejuaraanId
                                  )?.details.kelasPoomsae
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setPesertaToEdit(null);
                      setAvailableClasses([]);
                    }}
                    disabled={editLoading}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:bg-white border-2"
                    style={{
                      borderColor: "#990D35",
                      color: "#990D35",
                      backgroundColor: "white",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitEdit}
                    disabled={editLoading || !editFormData.kelasKejuaraanId}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#3B82F6", color: "white" }}
                  >
                    {editLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Edit size={18} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <SelectTeamMemberModal
            isOpen={teamModalOpen}
            anggotaTim={selectedTeam}
            onClose={() => setTeamModalOpen(false)}
            onSelect={(atlet) => {
              navigate(`/dashboard/atlit/${atlet.id_atlet}`);
              setTeamModalOpen(false);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AllPeserta;
