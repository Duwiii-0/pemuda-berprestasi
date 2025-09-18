// src/pages/atlit/TambahAtlit.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPinned, CalendarFold, Scale, Ruler, IdCard, Save, Menu, AlertCircle, CheckCircle } from "lucide-react";
import Select from "react-select";
import TextInput from "../../components/textInput";
import FileInput from "../../components/fileInput";
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import { useAtletContext, calculateAge, genderOptions, beltOptions } from "../../context/AtlitContext";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext"; 

// Type untuk form
interface AtletForm {
  name: string;
  phone: string;
  nik: string;
  tanggal_lahir: string;
  alamat: string;
  provinsi: string;
  kota: string; // Changed from 'provinsi' to 'kota' for city
  bb: number | string;
  tb: number | string;
  gender: string;
  belt: string;
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;
}

// Data provinsi dan kota - integrated from RegisterDojang
const provinsiKotaData: Record<string, string[]> = {
  "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam"],
  "Sumatera Utara": ["Medan", "Binjai", "Gunungsitoli", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
  "Riau": ["Pekanbaru", "Dumai"],
  "Kepulauan Riau": ["Tanjung Pinang", "Batam"],
  "Jambi": ["Jambi", "Sungai Penuh"],
  "Sumatera Selatan": ["Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih", "Muara Enim", 'Lahat'],
  "Bangka Belitung": ["Pangkal Pinang"],
  "Bengkulu": ["Bengkulu"],
  "Lampung": ["Lampung Barat", "Tanggamus", "Lampung Selatan", "Lampung Timur", "Lampung Tengah", "Lampung Utara", "Way Kanan", "Pesawaran", "Pringsewu", 'Mesuji', 'Tulang Bawang Barat', 'Pesisir Barat', 'Bandar Lampung', 'Metro'  ],
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Banjar"],
  "Banten": ["Serang", "Tangerang", "Tangerang Selatan", "Cilegon"],
  "Jawa Tengah": ["Semarang", "Magelang", "Pekalongan", "Purwokerto", "Salatiga", "Solo", "Tegal"],
  "Yogyakarta": ["Yogyakarta"],
  "Jawa Timur": ["Surabaya", "Malang", "Batu", "Blitar", "Kediri", "Madiun", "Mojokerto", "Pasuruan", "Probolinggo"],
  "Bali": ["Denpasar"],
  "Nusa Tenggara Barat": ["Mataram", "Bima"],
  "Nusa Tenggara Timur": ["Kupang"],
  "Kalimantan Barat": ["Pontianak", "Singkawang"],
  "Kalimantan Tengah": ["Palangka Raya"],
  "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru"],
  "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang"],
  "Kalimantan Utara": ["Tarakan"],
  "Sulawesi Utara": ["Manado", "Bitung", "Kotamobagu", "Tomohon"],
  "Sulawesi Tengah": ["Palu"],
  "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare"],
  "Sulawesi Tenggara": ["Kendari", "Bau-Bau"],
  "Gorontalo": ["Gorontalo"],
  "Sulawesi Barat": ["Mamuju"],
  "Maluku": ["Ambon", "Tual"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan"],
  "Papua": ["Jayapura"],
  "Papua Tengah": ["Nabire"],
  "Papua Pegunungan": ["Wamena"],
  "Papua Selatan": ["Merauke"],
  "Papua Barat": ["Manokwari", "Sorong"],
  "Papua Barat Daya": ["Sorong"]
};

const provinsiOptions = Object.keys(provinsiKotaData).map(provinsi => ({
  value: provinsi,
  label: provinsi
}));

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

const compressImage = (file: File, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      const maxWidth = 1200;
      const maxHeight = 1200;
      
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx!.drawImage(img, 0, 0, width, height);
      
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          if (compressedFile.size > maxSizeKB * 1024 && quality > 0.1) {
            quality -= 0.1;
            tryCompress();
          } else {
            resolve(compressedFile);
          }
        }, file.type, quality);
      };
      
      tryCompress();
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Fungsi validasi file
const validateFile = (file: File, allowPDF: boolean = false) => {
  if (!file) return { isValid: false, error: 'File tidak ditemukan' };
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File terlalu besar. Maksimal 2MB` };
  }
  
  const allowedTypes = allowPDF 
    ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    : ALLOWED_IMAGE_TYPES;
    
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `Format tidak didukung` };
  }
  
  return { isValid: true };
};

// Fungsi format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TambahAtlit = () => {
  const navigate = useNavigate();
  const { createAtlet } = useAtletContext();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<AtletForm>({
    name: "",
    phone: "",
    nik: "",
    tanggal_lahir: "",
    alamat: "",
    provinsi: "",
    kota: "",
    bb: "",
    tb: "",
    gender: "",
    belt: "",
    akte_kelahiran: null,
    pas_foto: null,
    sertifikat_belt: null,
    ktp: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get city options based on selected province
  const kotaOptions = formData.provinsi
    ? provinsiKotaData[formData.provinsi]?.map((kota: string) => ({
        value: kota,
        label: kota
      })) || []
    : [];

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleBack = () => navigate("/dashboard/atlit");

  const handleInputChange = (field: keyof AtletForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProvinsiChange = (selectedOption: any) => {
    const newProvinsi = selectedOption?.value || "";
    setFormData((prev) => ({ 
      ...prev, 
      provinsi: newProvinsi,
      kota: "" // Reset city when province changes
    }));
    // Clear errors
    if (errors.provinsi) {
      setErrors((prev) => ({ ...prev, provinsi: "" }));
    }
    if (errors.kota) {
      setErrors((prev) => ({ ...prev, kota: "" }));
    }
  };

  const handleKotaChange = (selectedOption: any) => {
    handleInputChange('kota', selectedOption?.value || '');
  };

  const [fileProcessing, setFileProcessing] = useState<Record<string, boolean>>({
  akte_kelahiran: false,
  pas_foto: false,
  sertifikat_belt: false,
  ktp: false
});

const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

const handleFileChange = async (field: keyof AtletForm, file: File | null) => {
  if (!file) {
    setFormData((prev) => ({ ...prev, [field]: file }));
    setFileErrors((prev) => ({ ...prev, [field]: '' }));
    return;
  }

  setFileProcessing((prev) => ({ ...prev, [field]: true }));
  setFileErrors((prev) => ({ ...prev, [field]: '' }));

  try {
    const allowPDF = field === 'sertifikat_belt';
    const validation = validateFile(file, allowPDF);
    
    if (!validation.isValid) {
      setFileErrors((prev) => ({ ...prev, [field]: validation.error || 'File tidak valid' }));
      setFileProcessing((prev) => ({ ...prev, [field]: false }));
      return;
    }

    let processedFile = file;

    // Compress jika image
    if (file.type.startsWith('image/')) {
      try {
        const maxSizeKB = field === 'pas_foto' ? 300 : 500;
        processedFile = await compressImage(file, maxSizeKB);
        toast.success(`File dikompres: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
      } catch (error) {
        console.warn('Compression failed, using original');
        processedFile = file;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedFile }));

  } catch (error) {
    setFileErrors((prev) => ({ ...prev, [field]: 'Gagal memproses file' }));
    toast.error(`Gagal memproses ${field}`);
  } finally {
    setFileProcessing((prev) => ({ ...prev, [field]: false }));
  }
};

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Field wajib sesuai dengan requirement backend
    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }
    
    if (!formData.tanggal_lahir) {
      newErrors.tanggal_lahir = "Tanggal lahir wajib diisi";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Pilih gender";
    }

    // Validasi opsional - hanya validasi jika diisi
    if (formData.phone && !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.phone.trim())) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }

    if (formData.nik && formData.nik.trim().length !== 16) {
      newErrors.nik = "NIK harus 16 digit";
    }

    // Validasi tanggal lahir (tidak boleh di masa depan)
    if (formData.tanggal_lahir) {
      const today = new Date();
      const birthDate = new Date(formData.tanggal_lahir);
      if (birthDate > today) {
        newErrors.tanggal_lahir = "Tanggal lahir tidak boleh di masa depan";
      }
    }

    // Validasi angka untuk berat dan tinggi badan
    if (formData.bb && (Number(formData.bb) <= 0 || Number(formData.bb) > 300)) {
      newErrors.bb = "Berat badan harus antara 1-300 kg";
    }

    if (formData.tb && (Number(formData.tb) <= 0 || Number(formData.tb) > 250)) {
      newErrors.tb = "Tinggi badan harus antara 1-250 cm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error("Mohon periksa kembali data yang diisi");
    return;
  }

  // TAMBAH INI - Validasi file size sebelum submit
  const fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'] as const;
  const maxFileSize = 2 * 1024 * 1024; // 2MB

  for (const field of fileFields) {
    const file = formData[field] as File | null;
    if (file && file.size > maxFileSize) {
      toast.error(`${field} terlalu besar (${formatFileSize(file.size)}). Maksimal 2MB`);
      return;
    }
  }

  // Hitung total size
  let totalSize = 0;
  fileFields.forEach(field => {
    const file = formData[field] as File | null;
    if (file) totalSize += file.size;
  });

  if (totalSize > 8 * 1024 * 1024) { // 8MB total limit
    toast.error(`Total file terlalu besar (${formatFileSize(totalSize)}). Maksimal 8MB`);
    return;
  }

  setIsSubmitting(true);

  try {
    const formDataSend = new FormData();
    
    // REQUIRED FIELDS - Pastikan semuanya ada
    formDataSend.append("nama_atlet", formData.name.trim());
    formDataSend.append("jenis_kelamin", formData.gender);
    formDataSend.append("tanggal_lahir", formData.tanggal_lahir);
    formDataSend.append("id_dojang", String(user?.pelatih?.id_dojang ?? ""));
    formDataSend.append("id_pelatih_pembuat", String(user?.pelatih?.id_pelatih ?? ""));

    // ADDITIONAL FIELDS
    if (formData.belt) formDataSend.append("belt", formData.belt);
    if (formData.alamat?.trim()) formDataSend.append("alamat", formData.alamat.trim());
    if (formData.provinsi) formDataSend.append("provinsi", formData.provinsi);
    if (formData.kota) formDataSend.append("kota", formData.kota);
    if (formData.phone?.trim()) formDataSend.append("no_telp", formData.phone.trim());
    if (formData.nik?.trim()) formDataSend.append("nik", formData.nik.trim());
    
    // NUMERIC FIELDS - PENTING: Convert ke string dengan validation
    if (formData.bb) {
      const weight = parseFloat(formData.bb as string);
      if (!isNaN(weight) && weight > 0) {
        formDataSend.append("berat_badan", String(weight));
      }
    }
    
    if (formData.tb) {
      const height = parseFloat(formData.tb as string);
      if (!isNaN(height) && height > 0) {
        formDataSend.append("tinggi_badan", String(height));
      }
    }

    // FILES - Field names harus exact match dengan backend
    if (formData.akte_kelahiran) formDataSend.append("akte_kelahiran", formData.akte_kelahiran);
    if (formData.pas_foto) formDataSend.append("pas_foto", formData.pas_foto);
    if (formData.sertifikat_belt) formDataSend.append("sertifikat_belt", formData.sertifikat_belt);
    if (formData.ktp) formDataSend.append("ktp", formData.ktp);

    // DEBUG: Log FormData sebelum kirim
    console.log("📤 DEBUG: Sending FormData contents:");
    for (let [key, value] of formDataSend.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // PENTING: Pastikan createAtlet function menggunakan apiClient.postFormData
    const result = await createAtlet(formDataSend);

    if (result) {
      setSubmitSuccess(true);
      toast.success("Berhasil menambahkan Atlet!");
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        nik: "",
        tanggal_lahir: "",
        alamat: "",
        provinsi: "",
        kota: "",
        bb: "",
        tb: "",
        gender: "",
        belt: "",
        akte_kelahiran: null,
        pas_foto: null,
        sertifikat_belt: null,
        ktp: null,
      });
      
      setTimeout(() => navigate("/dashboard/atlit", { state: { refresh: true } }), 1000);
    }
 } catch (error: any) {
  console.error("❌ Error creating athlete:", error);
  
  if (error.status === 413 || error.message.includes('413') || error.message.includes('Payload Too Large')) {
    toast.error("File terlalu besar untuk server. Coba kompres lebih kecil atau hubungi admin.");
  } else if (error.message.includes('File size')) {
    toast.error("File terlalu besar. Maksimal 2MB per file.");
  } else if (error.message.includes('Invalid file')) {
    toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
  } else if (error.message.includes('wajib diisi')) {
    toast.error("Ada field wajib yang belum diisi: " + error.message);
  } else {
    toast.error(error.message || "Gagal menambahkan Atlet. Coba lagi atau hubungi admin.");
  }
} finally {
  setIsSubmitting(false);
}
};
  // Helper function to get select value for react-select
  const getSelectValue = (options: any[], value: string) => {
    return options.find(option => option.value === value) || null;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Success Message */}
      {submitSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-pulse">
          Data atlet berhasil disimpan!
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 lg:px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
                aria-label="Open menu"
              >
                <Menu size={24} className="text-red" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2 flex-1">
              <button 
                onClick={handleBack}
                className="text-red hover:text-red/80 font-plex mb-4 flex items-center gap-2 transition-colors"
                disabled={isSubmitting}
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
            {/* Data Pribadi */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red/10 rounded-xl">
                  <User className="text-red" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DATA PRIBADI
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nama */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Nama Lengkap <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.name ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    icon={<User className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm font-plex">{errors.name}</p>
                  )}
                </div>

                {/* No HP */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    No. Telepon
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.phone ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Contoh: 08123456789"
                    icon={<Phone className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm font-plex">{errors.phone}</p>
                  )}
                </div>

                {/* Alamat */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="block font-plex font-medium text-black/70">Alamat</label>
                  <TextInput
                    className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                    value={formData.alamat}
                    onChange={(e) => handleInputChange('alamat', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    icon={<MapPinned className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Provinsi */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Provinsi
                  </label>                 
                    <Select
                      unstyled
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: base => ({ ...base, zIndex: 50 })
                      }}
                      isDisabled={isSubmitting}
                      value={getSelectValue(provinsiOptions, formData.provinsi)}
                      onChange={handleProvinsiChange}
                      options={provinsiOptions}
                      placeholder="Pilih provinsi"
                      classNames={{
                        control: () =>
                          `flex items-center border-2 ${
                            !isSubmitting 
                              ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                              : 'border-gray-200 bg-gray-50'
                          } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                        valueContainer: () => "px-1",
                        placeholder: () => "text-gray-400 font-plex text-sm",
                        menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                        menuList: () => "max-h-32 overflow-y-auto",
                        option: ({ isFocused, isSelected }) =>
                          [
                            "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                            isFocused ? "bg-red/10 text-red" : "text-black/80",
                            isSelected ? "bg-red text-white" : ""
                          ].join(" "),
                      }}
                    />
                </div>

                {/* Kota */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Kota
                  </label>                 
                    <Select
                      unstyled
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: base => ({ ...base, zIndex: 50 })
                      }}
                      isDisabled={isSubmitting || !formData.provinsi}
                      value={getSelectValue(kotaOptions, formData.kota)}
                      onChange={handleKotaChange}
                      options={kotaOptions}
                      placeholder={formData.provinsi ? "Pilih kota" : "Pilih provinsi dulu"}
                      classNames={{
                        control: () =>
                          `flex items-center border-2 ${
                            !isSubmitting && formData.provinsi
                              ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                              : 'border-gray-200 bg-gray-50'
                          } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                        valueContainer: () => "px-1",
                        placeholder: () => "text-gray-400 font-plex text-sm",
                        menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                        menuList: () => "max-h-32 overflow-y-auto",
                        option: ({ isFocused, isSelected }) =>
                          [
                            "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                            isFocused ? "bg-red/10 text-red" : "text-black/80",
                            isSelected ? "bg-red text-white" : ""
                          ].join(" "),
                      }}
                    />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Gender <span className="text-red">*</span>
                  </label>
                    <Select
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: base => ({ ...base, zIndex: 50 })
                      }}
                      unstyled
                      isDisabled={isSubmitting}
                      value={getSelectValue(genderOptions, formData.gender)}
                      onChange={(selected) => handleInputChange('gender', selected?.value || '')}
                      options={genderOptions}
                      placeholder="Pilih gender"
                      classNames={{
                        control: () =>
                          `flex items-center border-2 ${
                            errors.gender
                              ? 'border-red bg-white/80' 
                              : !isSubmitting
                                ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                                : 'border-gray-200 bg-gray-50'
                          } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                        valueContainer: () => "px-1",
                        placeholder: () => "text-gray-400 font-plex text-sm",
                        menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                        menuList: () => "max-h-32 overflow-y-auto",
                        option: ({ isFocused, isSelected }) =>
                          [
                            "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                            isFocused ? "bg-red/10 text-red" : "text-black/80",
                            isSelected ? "bg-red text-white" : "text-black/80"
                          ].join(" "),
                      }}
                    />
                  {errors.gender && (
                    <p className="text-red-500 text-sm font-plex">{errors.gender}</p>
                  )}
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Tanggal Lahir <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.tanggal_lahir ? 'border-red-500' : 'border-red/20'
                    }`}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    value={formData.tanggal_lahir}
                    type="date"
                    placeholder="Pilih tanggal lahir"
                    icon={<CalendarFold className='text-red' size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.tanggal_lahir && (
                    <p className="text-red-500 text-sm font-plex">{errors.tanggal_lahir}</p>
                  )}
                  {formData.tanggal_lahir && !errors.tanggal_lahir && (
                    <p className="text-green-600 text-sm font-plex">
                      Umur: {calculateAge(formData.tanggal_lahir)} tahun
                    </p>
                  )}
                </div>

                {/* Sabuk */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Tingkat Sabuk
                  </label>
                    <Select
                      unstyled
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: base => ({ ...base, zIndex: 50 })
                      }}
                      isDisabled={isSubmitting}
                      value={getSelectValue(beltOptions, formData.belt)}
                      onChange={(selected) => handleInputChange('belt', selected?.value || '')}
                      options={beltOptions}
                      placeholder="Pilih tingkat sabuk"
                      classNames={{
                        control: () =>
                          `flex items-center border-2 ${
                            !isSubmitting
                              ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80'
                              : 'border-gray-200 bg-gray-50'
                          } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                        valueContainer: () => "px-1",
                        placeholder: () => "text-gray-400 font-plex text-sm",
                        menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                        menuList: () => "max-h-32 overflow-y-auto",
                        option: ({ isFocused, isSelected }) =>
                          [
                            "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                            isFocused ? "bg-red/10 text-red" : "text-black/80",
                            isSelected ? "bg-red text-white" : ""
                          ].join(" "),
                      }}
                    />
                </div>
              </div>
            </div>

            {/* Data Fisik */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Scale className="text-blue-500" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DATA FISIK
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Berat Badan */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">Berat Badan (kg)</label>
                  <TextInput
                    type="number"
                    min="10"
                    max="300"
                    step="0.1"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.bb ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.bb}
                    onChange={(e) => handleInputChange('bb', e.target.value)}
                    placeholder="Contoh: 65.5"
                    icon={<Scale className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.bb && (
                    <p className="text-red-500 text-sm font-plex">{errors.bb}</p>
                  )}
                </div>

                {/* Tinggi Badan */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">Tinggi Badan (cm)</label>
                  <TextInput
                    type="number"
                    min="50"
                    max="250"
                    step="1"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.tb ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.tb}
                    onChange={(e) => handleInputChange('tb', e.target.value)}
                    placeholder="Contoh: 170"
                    icon={<Ruler className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.tb && (
                    <p className="text-red-500 text-sm font-plex">{errors.tb}</p>
                  )}
                </div>

                {/* NIK */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">NIK</label>
                  <TextInput
                    type="text"
                    maxLength={16}
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.nik ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.nik}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleInputChange('nik', value);
                    }}
                    placeholder="16 digit NIK"
                    icon={<IdCard className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.nik && (
                    <p className="text-red-500 text-sm font-plex">{errors.nik}</p>
                  )}
                  {formData.nik && formData.nik.length > 0 && formData.nik.length < 16 && (
                    <p className="text-yellow-600 text-sm font-plex">
                      NIK: {formData.nik.length}/16 digit
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dokumen Pendukung */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <IdCard className="text-yellow-600" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DOKUMEN PENDUKUNG (OPSIONAL)
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
  <label className="block font-plex font-medium text-black/70">Akte Kelahiran</label>
  <div className="relative">
    <FileInput 
      accept="image/*"
      file={formData.akte_kelahiran} 
      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
      onChange={(e) => handleFileChange('akte_kelahiran', e.target.files?.[0] || null)}
      disabled={isSubmitting || fileProcessing.akte_kelahiran}
    />
    
    {fileProcessing.akte_kelahiran && (
      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
          <span className="text-sm text-red font-plex">Kompres...</span>
        </div>
      </div>
    )}
    
    {fileErrors.akte_kelahiran && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
          <AlertCircle size={16} />
          {fileErrors.akte_kelahiran}
        </p>
      </div>
    )}
    
    {formData.akte_kelahiran && !fileErrors.akte_kelahiran && !fileProcessing.akte_kelahiran && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-600 text-sm font-plex flex items-center gap-2">
          <CheckCircle size={16} />
          Siap upload ({formatFileSize(formData.akte_kelahiran.size)})
        </p>
      </div>
    )}
  </div>
</div>
                
<div className="space-y-2">
  <label className="block font-plex font-medium text-black/70">Pas Foto 3x4</label>
  <div className="relative">
    <FileInput 
      accept="image/*" 
      file={formData.pas_foto} 
      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
      onChange={(e) => handleFileChange('pas_foto', e.target.files?.[0] || null)}
      disabled={isSubmitting || fileProcessing.pas_foto}
    />
    
    {fileProcessing.pas_foto && (
      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
          <span className="text-sm text-red font-plex">Kompres...</span>
        </div>
      </div>
    )}
    
    {fileErrors.pas_foto && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
          <AlertCircle size={16} />
          {fileErrors.pas_foto}
        </p>
      </div>
    )}
    
    {formData.pas_foto && !fileErrors.pas_foto && !fileProcessing.pas_foto && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-600 text-sm font-plex flex items-center gap-2">
          <CheckCircle size={16} />
          Siap upload ({formatFileSize(formData.pas_foto.size)})
        </p>
      </div>
    )}
  </div>
</div>
                
                <div className="space-y-2">
  <label className="block font-plex font-medium text-black/70">Sertifikasi Belt</label>
  <div className="relative">
    <FileInput 
      accept="image/*,application/pdf" 
      file={formData.sertifikat_belt} 
      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
      onChange={(e) => handleFileChange('sertifikat_belt', e.target.files?.[0] || null)}
      disabled={isSubmitting || fileProcessing.sertifikat_belt}
    />
    
    {fileProcessing.sertifikat_belt && (
      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
          <span className="text-sm text-red font-plex">Memproses...</span>
        </div>
      </div>
    )}
    
    {fileErrors.sertifikat_belt && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
          <AlertCircle size={16} />
          {fileErrors.sertifikat_belt}
        </p>
      </div>
    )}
    
    {formData.sertifikat_belt && !fileErrors.sertifikat_belt && !fileProcessing.sertifikat_belt && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-600 text-sm font-plex flex items-center gap-2">
          <CheckCircle size={16} />
          Siap upload ({formatFileSize(formData.sertifikat_belt.size)})
        </p>
      </div>
    )}
  </div>
</div>
                
                <div className="space-y-2">
  <label className="block font-plex font-medium text-black/70">KTP (Wajib untuk 17+)</label>
  <div className="relative">
    <FileInput 
      accept="image/*"
      file={formData.ktp} 
      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
      onChange={(e) => handleFileChange('ktp', e.target.files?.[0] || null)}
      disabled={isSubmitting || fileProcessing.ktp}
    />
    
    {fileProcessing.ktp && (
      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
          <span className="text-sm text-red font-plex">Kompres...</span>
        </div>
      </div>
    )}
    
    {fileErrors.ktp && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
          <AlertCircle size={16} />
          {fileErrors.ktp}
        </p>
      </div>
    )}
    
    {formData.ktp && !fileErrors.ktp && !fileProcessing.ktp && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-600 text-sm font-plex flex items-center gap-2">
          <CheckCircle size={16} />
          Siap upload ({formatFileSize(formData.ktp.size)})
        </p>
      </div>
    )}
  </div>
</div>
              </div>
            </div>

            {/* Submit Buttons */}
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
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

      {/* Mobile Sidebar Overlay */}
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
}; // <- Hapus kurung kurawal extra di sini

export default TambahAtlit;