// src/pages/atlit/TambahAtlit.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPinned, CalendarFold, Scale, Ruler, IdCard, Save } from "lucide-react";
import Select from "react-select";
import TextInput from "../../components/textInput"; // pastikan path sesuai
import FileInput from "../../components/fileInput"; // pastikan path sesuai
import NavbarDashboard from "../../components/navbar/navbarDashboard"; // pastikan path sesuai
import { useAtletContext, calculateAge, genderOptions, beltOptions } from "../../context/AtlitContext"; // pastikan path sesuai
import toast from "react-hot-toast";

// Type untuk form
interface AtletForm {
  name: string;
  phone: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  provinsi: string;
  bb: number | string;
  tb: number | string;
  gender: string;
  belt: string;
  akteKelahiran?: File | null;
  pasFoto?: File | null;
  sertifikatBelt?: File | null;
  ktp?: File | null;
}

const provinsiOptions = [
  { value: "Jawa Barat", label: "Jawa Barat" },
  { value: "Jawa Tengah", label: "Jawa Tengah" },
  { value: "DKI Jakarta", label: "DKI Jakarta" },
  { value: "Banten", label: "Banten" },
  // tambahin sesuai kebutuhan
];

const TambahAtlit: React.FC = () => {
  const navigate = useNavigate();
  const { createAtlet } = useAtletContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<AtletForm>({
    name: "",
    phone: "",
    nik: "",
    tglLahir: "",
    alamat: "",
    provinsi: "",
    bb: "",
    tb: "",
    gender: "",
    belt: "",
    akteKelahiran: null,
    pasFoto: null,
    sertifikatBelt: null,
    ktp: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => navigate("/dashboard/atlit");

  const handleInputChange = (field: keyof AtletForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof AtletForm, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nama wajib diisi";
    if (!formData.phone) newErrors.phone = "Nomor telepon wajib diisi";
    if (!formData.tglLahir) newErrors.tglLahir = "Tanggal lahir wajib diisi";
    if (!formData.gender) newErrors.gender = "Pilih gender";
    if (!formData.provinsi) newErrors.provinsi = "Pilih provinsi";
    if (!formData.belt) newErrors.belt = "Pilih tingkat sabuk";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createAtlet({
        nama_atlet: formData.name,
        no_telp: formData.phone,
        nik: formData.nik,
        tanggal_lahir: formData.tglLahir,
        jenis_kelamin: formData.gender as "LAKI_LAKI" | "PEREMPUAN",
        alamat: formData.alamat,
        provinsi: formData.provinsi,
        berat_badan: Number(formData.bb) || undefined,
        tinggi_badan: Number(formData.tb) || undefined,
        belt: formData.belt,
      });

      setSubmitSuccess(true);
      toast.success("Data atlet berhasil disimpan!");
      setTimeout(() => navigate("/dashboard/atlit"), 2000);
    } catch (error) {
      console.error("Gagal tambah atlet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex justify-center items-center">
      <div className="min-h-screen py-10">
        <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 md:px-8 rounded-lg">
          
          {submitSuccess && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-pulse">
              Data atlet berhasil disimpan!
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2 flex-1">
              <button 
                onClick={handleBack}
                className="text-red hover:text-red/80 font-plex mb-4 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={20} />
                Kembali ke Data Atlit
              </button>
              <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                TAMBAH ATLIT
              </h1>
              <p className="font-plex text-black/60 text-lg">
                Daftarkan atlet baru ke sistem
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* === DATA PRIBADI === */}
            {/* ... (isi form sama persis dengan yang kamu kasih, pakai handleInputChange, errors, calculateAge, dsb) */}
            
            {/* === DATA FISIK === */}
            {/* ... (berat badan, tinggi badan, NIK) */}

            {/* === DOKUMEN PENDUKUNG === */}
            {/* ... (Akte kelahiran, pas foto, sertifikat belt, KTP) */}

            {/* Buttons */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer px-6 py-3 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-lg font-plex disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red text-white hover:bg-red/90 transition-all duration-300 shadow-lg font-plex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="cursor-default animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Data Atlit
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default TambahAtlit;
