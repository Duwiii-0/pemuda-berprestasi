  import { ArrowLeft, Mail, IdCard, Phone, CalendarFold, Map, MapPinned, User, Settings as SettingsIcon, Shield } from 'lucide-react';
  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { Link } from "react-router-dom";
  import { TextInput } from '../dashboard/dataDojang';
  import { useAuth } from "../../context/authContext";
  import { apiClient } from "../../config/api";
  import Select from "react-select";
  import toast from 'react-hot-toast';
  import FileInput from "../../components/fileInput";

  // Data provinsi dan kota
  const provinsiKotaData = {
    "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam"],
    "Sumatera Utara": ["Medan", "Binjai", "Gunungsitoli", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
    "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
    "Riau": ["Pekanbaru", "Dumai"],
    "Kepulauan Riau": ["Tanjung Pinang", "Batam"],
    "Jambi": ["Jambi", "Sungai Penuh"],
    "Sumatera Selatan": ["Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih"],
    "Bangka Belitung": ["Pangkal Pinang"],
    "Bengkulu": ["Bengkulu"],
    "Lampung": ["Bandar Lampung", "Metro"],
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

  const Settings = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<{
      fotoKtp?: File | string | null;
      sertifikatSabuk?: File | string | null;
    }>({});

    const [formData, setFormData] = useState<{
      email: string;
      name: string;
      no_telp: string;
      nik: string;
      tanggal_lahir: string;
      kota: string;
      Alamat: string;
      Provinsi: string;
      jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN" | '';
    }>({
      email: user?.email || '',
      name: '',
      no_telp: '',
      nik: '',
      tanggal_lahir: '',
      kota: '',
      Alamat: '',
      Provinsi: '',
      jenis_kelamin: '',
    });

    const [initialData, setInitialData] = useState(formData);

    const genderOptions = [
      { value: "LAKI_LAKI", label: "Laki-Laki" },
      { value: "PEREMPUAN", label: "Perempuan" },
    ];

    // Get city options based on selected province
    const kotaOptions = formData.Provinsi ? provinsiKotaData[formData.Provinsi]?.map(kota => ({
      value: kota,
      label: kota
    })) || [] : [];

    const handleProvinsiChange = (selectedOption) => {
      setFormData({ 
        ...formData, 
        Provinsi: selectedOption?.value || "",
        kota: "" // Reset city when province changes
      });
    };

    const handleKotaChange = (selectedOption) => {
      setFormData({ ...formData, kota: selectedOption?.value || "" });
    };

    const getSelectValue = (options, value) => {
      return options.find(option => option.value === value) || null;
    };

    // Set token ke API client saat component mount
    useEffect(() => {
      if (token) {
        // Token handled by apiClient automatically
      }
    }, [token]);

    useEffect(() => {
      const fetchFiles = async () => {
        if (!user) return;

        try {
          const res = await apiClient.get('/pelatih/files');
          if (res.success) {
            setFiles({
              fotoKtp: res.data.foto_ktp?.path || null,
              sertifikatSabuk: res.data.sertifikat_sabuk?.path || null
            });
          }
        } catch (err) {
          console.error(err);
          toast.error('Gagal mengambil file');
        }
      };

      fetchFiles();
    }, [user]);

    // Fetch profile data dari API pelatih saat component mount
    useEffect(() => {
      const fetchPelatihProfile = async () => {
        if (!user || user.role !== 'PELATIH') return;

        try {
          setLoading(true);
          const response = await apiClient.get('/pelatih/profile');
          
          if (response.success) {
            const profileData = response.data;
            const data = {
              email: profileData.akun.email,
              name: profileData.nama_pelatih,
              no_telp: profileData.no_telp || '',
              nik: profileData.nik || '',
              tanggal_lahir: profileData.tanggal_lahir || '',
              kota: profileData.kota || '',
              Alamat: profileData.alamat || '',
              Provinsi: profileData.provinsi || '',
              jenis_kelamin: profileData.jenis_kelamin || ''
            };
            setFormData(data);
            setInitialData(data);
          }
        } catch (error) {
          console.error('Error fetching profile:');
          toast.error('Gagal mengambil data profil');
        } finally {
          setLoading(false);
        }
      };

      fetchPelatihProfile();
    }, [user]);

    const handleCancel = () => {
      setIsEditing(false);
      setFormData(initialData);
    };

    const handleUpdate = async () => {
      try {
        setLoading(true);

        // Update data text - handle empty strings properly
        const updateData = {
          nama_pelatih: formData.name?.trim() || null,
          no_telp: formData.no_telp?.trim() || null,
          nik: formData.nik?.trim() || null,
          tanggal_lahir: formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : null,
          kota: formData.kota?.trim() || null,
          provinsi: formData.Provinsi?.trim() || null,
          alamat: formData.Alamat?.trim() || null,
          jenis_kelamin: formData.jenis_kelamin || null,
        };

        // Remove null values to avoid sending unnecessary data
        const filteredData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== null && value !== '')
        );

        const response = await apiClient.put("/pelatih/profile", filteredData);
        
        if (!response.success) {
          toast.error(response.message || "Gagal memperbarui profil");
          return;
        }

        // Upload file (jika ada)
        if (files.fotoKtp instanceof File || files.sertifikatSabuk instanceof File) {
          const formDataToSend = new FormData();

          if (files.fotoKtp instanceof File) {
            formDataToSend.append("foto_ktp", files.fotoKtp);
          }
          if (files.sertifikatSabuk instanceof File) {
            formDataToSend.append("sertifikat_sabuk", files.sertifikatSabuk);
          }

          const uploadRes = await apiClient.postFormData("/pelatih/upload", formDataToSend);

          if (!uploadRes.success) {
            toast.error(uploadRes.message || "Upload file gagal");
            return;
          } 
        }

        setIsEditing(false);
        toast.success("Profil berhasil diperbarui");
      } catch (error) {
        console.error("Error updating profile:");
        toast.error("Pastikan semua data sudah sesuai");
      } finally {
        setLoading(false);
      }
    };

  const handlePasswordReset = () => {
    const confirmReset = window.confirm(
      "Untuk mengubah password, Anda akan logout dari sistem terlebih dahulu. Lanjutkan?"
    );
    
    if (confirmReset) {
      logout();
      
      setTimeout(() => {
        window.location.href = 'https://pemudaberprestasi.com/resetpassword';
      }, 1000);
    }
  };

    // Redirect jika tidak login
    useEffect(() => {
      if (!user) {
        toast.error("Anda harus login terlebih dahulu");
        navigate("/", { replace: true });
      }
    }, [user, navigate]);

    // Loading state
    if (loading && !formData.name) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red/[0.02] to-white flex items-center justify-center overflow-hidden">
          {/* Animated Background Elements - Responsive */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
            <div className="absolute bottom-1/4 right-1/4 w-36 sm:w-56 lg:w-72 h-36 sm:h-56 lg:h-72 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
          </div>
          
          <div className="text-center relative z-10 px-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red/20 border-t-red rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 border-2 border-red/30 border-t-red/80 rounded-full animate-spin animation-reverse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg sm:text-xl font-bebas tracking-wide bg-gradient-to-r from-red to-red/80 bg-clip-text text-transparent">
                MEMUAT PROFIL
              </p>
              <p className="text-black/60 font-plex text-sm">Tunggu sebentar...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden">
        {/* Animated Background Elements - Responsive */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
          <div className="absolute bottom-1/4 right-1/4 w-36 sm:w-56 lg:w-72 h-36 sm:h-56 lg:h-72 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 sm:w-2 sm:h-2 bg-red/20 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-red/30 rounded-full animate-bounce animation-delay-500"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          
          {/* Header - Mobile Optimized */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <Link 
              to='/' 
              className="inline-flex items-center gap-2 sm:gap-3 text-black/70 hover:text-red transition-all duration-300 group mb-6 sm:mb-8"
            >
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 transition-colors duration-200"
                style={{ 
                  color: '#990D35',
                  fontFamily: 'IBM Plex Sans, sans-serif'
                }}
                title="Kembali ke Beranda"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Beranda</span>
              </button>
            </Link>
            
            {/* Enhanced Header - Mobile Responsive */}
            <div className="relative">
              {/* Section Label */}
              <div className="inline-block group mb-3 sm:mb-4">
                <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] border-l-3 sm:border-l-4 border-red pl-4 sm:pl-6 relative">
                  Pengaturan Akun
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
                </span>
              </div>
              
              {/* Main Title - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 flex bg-gradient-to-br from-red to-red/90 rounded-xl sm:rounded-2xl shadow-lg w-fit">
                  <SettingsIcon className="text-white" size={24} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bebas leading-[0.85] tracking-wide">
                    <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                      Kelola Profil
                    </span>
                    <span className="block bg-gradient-to-r from-red/90 via-red to-red/90 bg-clip-text text-transparent">
                      Anda
                    </span>
                  </h1>
                  <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
                </div>
              </div>
              <p className="font-plex text-black/70 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Perbarui informasi personal dan kelola pengaturan keamanan akun Anda dengan mudah dan aman.
              </p>
            </div>
          </div>

          {/* Main Content - Improved Grid Responsiveness */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
            
            {/* Profile Card - Mobile First */}
            <div className="lg:col-span-4">
              <div className="relative group">
                {/* Decorative background elements - Responsive */}
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-red/8 to-red/4 rounded-full blur-sm group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-red/6 to-red/3 rounded-full blur-sm group-hover:scale-110 transition-transform duration-700 animation-delay-200"></div>
                
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-red/10 group-hover:shadow-2xl group-hover:shadow-red/10 transition-all duration-500">
                  {/* Glass morphism overlay */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] rounded-2xl sm:rounded-3xl"></div>
                  
                  <div className="relative text-center space-y-4 sm:space-y-6">
                    <div className="relative inline-block">
                      <div 
                        onClick={() => toast.error("Fitur upload foto akan segera hadir")} 
                        className='h-20 w-20 sm:h-28 sm:w-28 rounded-xl sm:rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-red/70 to-red/90 mx-auto cursor-pointer hover:border-red/40 hover:shadow-xl transition-all duration-300 hover:scale-105 group/avatar'
                      >
                        <div className="w-full h-full flex items-center justify-center text-white group-hover/avatar:bg-red/90 transition-colors duration-300">
                          <User strokeWidth={1.5} size={32} className="sm:w-10 sm:h-10"/>
                        </div>
                      </div>
                      {/* Online indicator - Responsive */}
                      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 border-2 sm:border-4 border-white rounded-full shadow-sm"></div>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="font-bebas text-lg sm:text-2xl tracking-wide bg-gradient-to-r from-red to-red/80 bg-clip-text text-transparent">
                        {formData.name || user?.pelatih?.nama_pelatih || 'Pengguna'}
                      </h3>
                      <p className="font-plex text-black/60 text-xs sm:text-sm bg-red/5 px-2 sm:px-3 py-1 rounded-full inline-block">
                        {formData.email}
                      </p>
                    </div>
                    
                    {/* Enhanced Account Actions - Mobile Optimized */}
                    <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                      <button 
                        onClick={handlePasswordReset}
                        className="group/btn w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red to-red/90 text-white rounded-lg sm:rounded-xl font-plex font-medium hover:from-red/90 hover:to-red hover:shadow-lg hover:shadow-red/25 transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
                      >
                        <Shield size={16} className="sm:w-[18px] sm:h-[18px] group-hover/btn:rotate-12 transition-transform duration-300" />
                        Ganti Password
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => toast.error("Fitur ini akan segera hadir")} 
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-red/30 text-red hover:bg-red/5 hover:border-red/50 rounded-lg sm:rounded-xl font-plex font-medium transition-all duration-300 hover:shadow-lg text-sm sm:text-base"
                      >
                        Hapus Akun
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content - Mobile Optimized */}
            <div className="lg:col-span-8">
              <div className="relative group">
                {/* Decorative elements - Responsive */}
                <div className="absolute top-1/4 -right-1 sm:-right-2 w-2 h-2 sm:w-3 sm:h-3 bg-red/30 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/3 -left-0.5 sm:-left-1 w-1 h-1 sm:w-2 sm:h-2 bg-red/20 rounded-full animate-ping animation-delay-1000"></div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-red/10 overflow-hidden group-hover:shadow-2xl group-hover:shadow-red/10 transition-all duration-500">
                  {/* Glass morphism overlay */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]"></div>
                  
                  {/* Enhanced Form Header - Mobile Responsive */}
                  <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-red/10 bg-gradient-to-r from-red/[0.02] via-transparent to-red/[0.02]">
                    {/* Mobile Layout - Stacked */}
                    <div className="block sm:hidden space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red/10 rounded-lg">
                          <User className="text-red" size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bebas tracking-wide bg-gradient-to-r from-red to-red/80 bg-clip-text text-transparent">
                            INFORMASI PERSONAL
                          </h2>
                          <p className="font-plex text-black/60 text-xs">Kelola data pribadi Anda</p>
                        </div>
                      </div>
                      
                      {/* Mobile Action Button */}
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={loading}
                          className="w-full group/edit inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-medium px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <span>Ubah Data Diri</span>
                          <svg className="w-4 h-4 group-hover/edit:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border-2 border-red/30 text-red hover:bg-red/5 hover:border-red/50 rounded-xl font-plex font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 text-sm"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="flex-1 group/save inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-medium px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                          >
                            <span>{loading ? "Simpan..." : "Simpan"}</span>
                            {!loading && (
                              <svg className="w-4 h-4 group-hover/save:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop Layout - Horizontal */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red/10 rounded-xl">
                          <User className="text-red" size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bebas tracking-wide bg-gradient-to-r from-red to-red/80 bg-clip-text text-transparent">
                            INFORMASI PERSONAL
                          </h2>
                          <p className="font-plex text-black/60 text-sm">Kelola data pribadi Anda dengan aman</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            disabled={loading}
                            className="group/edit inline-flex items-center gap-2 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>Ubah Data Diri</span>
                            <svg className="w-4 h-4 group-hover/edit:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={handleCancel}
                              disabled={loading}
                              className="px-6 py-3 border-2 border-red/30 text-red hover:bg-red/5 hover:border-red/50 rounded-xl font-plex font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleUpdate}
                              disabled={loading}
                              className="group/save inline-flex items-center gap-2 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50"
                            >
                              <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                              {!loading && (
                                <svg className="w-4 h-4 group-hover/save:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Fields - Mobile Optimized */}
                  <div className="relative p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      
                      {/* Email (Read Only) */}
                      <div className="md:col-span-2 space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Alamat Email
                        </label>
                        <TextInput
                          className="w-full"
                          disabled
                          value={formData.email}
                          placeholder="Email"
                          icon={<Mail className="text-gray-400" size={20} />}
                        />
                      </div>

                      {/* NIK */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Nomor Induk Kependudukan
                        </label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nik: e.target.value })}
                          disabled={!isEditing}
                          value={formData.nik}
                          placeholder="Masukkan NIK"
                          icon={<IdCard className={isEditing ? "text-red/60" : "text-gray-400"} size={20} />}
                        />
                      </div>                  
                      
                      {/* Nama */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Nama Lengkap
                        </label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing || loading}
                          value={formData.name}
                          placeholder="Masukkan nama lengkap"
                          icon={<User className={isEditing ? "text-red/60" : "text-gray-400"} size={20} />}
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Nomor Telepon
                        </label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, no_telp: e.target.value })}
                          disabled={!isEditing || loading}
                          value={formData.no_telp}
                          placeholder="Masukkan nomor telepon"
                          icon={<Phone className={isEditing ? "text-red/60" : "text-gray-400"} size={20} />}
                        />
                      </div>

                      {/* Tanggal Lahir */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Tanggal Lahir
                        </label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                          disabled={!isEditing}
                          value={formData.tanggal_lahir}
                          type="date"
                          placeholder="Pilih tanggal lahir"
                          icon={<CalendarFold className={isEditing ? "text-red/60" : "text-gray-400"} size={20} />}
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Jenis Kelamin
                        </label>
                        <div className='relative'>
                          <Select
                            unstyled
                            isDisabled={!isEditing}
                            value={genderOptions.find(opt => opt.value === formData.jenis_kelamin) || null}
                            onChange={(selected) =>
                              setFormData({ ...formData, jenis_kelamin: selected?.value as "LAKI_LAKI" | "PEREMPUAN" })
                            }
                            options={genderOptions}
                            placeholder="Pilih jenis kelamin"
                            classNames={{
                              control: () =>
                                `flex items-center border-2 ${
                                  isEditing 
                                    ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                                    : 'border-gray-200 bg-gray-50'
                                } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                              valueContainer: () => "px-1",
                              placeholder: () => "text-gray-400 font-plex text-sm",
                              menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                              menuList: () => "max-h-32 overflow-y-auto",
                              option: ({ isFocused, isSelected }) =>
                                [
                                  "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200",
                                  isFocused ? "bg-red/10 text-red" : "text-black/80",
                                  isSelected ? "bg-red text-white" : ""
                                ].join(" "),
                            }}
                          />
                          {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                        </div>
                      </div>

                      {/* Provinsi */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Provinsi
                        </label>
                        <div className='relative'>
                          <Select
                            unstyled
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: base => ({ ...base, zIndex: 50 })
                            }}
                            isDisabled={!isEditing}
                            value={getSelectValue(provinsiOptions, formData.Provinsi)}
                            onChange={handleProvinsiChange}
                            options={provinsiOptions}
                            placeholder="Pilih provinsi"
                            classNames={{
                              control: () =>
                                `flex items-center border-2 ${
                                  isEditing 
                                    ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                                    : 'border-gray-200 bg-gray-50'
                                } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                              valueContainer: () => "px-1",
                              placeholder: () => "text-gray-400 font-plex text-sm",
                              singleValue: () => "text-black/80 font-plex text-sm",
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
                          {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                        </div>
                      </div>

                      {/* Kota */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Kota
                        </label>
                        <div className='relative'>
                          <Select
                            unstyled
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: base => ({ ...base, zIndex: 50 })
                            }}
                            isDisabled={!isEditing || !formData.Provinsi}
                            value={getSelectValue(kotaOptions, formData.kota)}
                            onChange={handleKotaChange}
                            options={kotaOptions}
                            placeholder={formData.Provinsi ? "Pilih kota" : "Pilih provinsi dulu"}
                            classNames={{
                              control: () =>
                                `flex items-center border-2 ${
                                  isEditing && formData.Provinsi
                                    ? 'border-red/20 hover:border-red/40 focus-within:border-red bg-white/80' 
                                    : 'border-gray-200 bg-gray-50'
                                } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                              valueContainer: () => "px-1",
                              placeholder: () => "text-gray-400 font-plex text-sm",
                              singleValue: () => "text-black/80 font-plex text-sm",
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
                          {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                        </div>
                      </div>

                      {/* Alamat */}
                      <div className="md:col-span-2 space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Alamat Lengkap
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 sm:left-4 top-3 sm:top-4">
                            <MapPinned className={isEditing ? "text-red/60" : "text-gray-400"} size={18} />
                          </div>
                          <textarea
                            value={formData.Alamat}
                            onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
                            disabled={!isEditing}
                            rows={3}
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-black/80 font-plex border-2 ${
                              isEditing 
                                ? 'border-red/20 hover:border-red/40 focus:border-red bg-white' 
                                : 'border-gray-200 bg-gray-50'
                            } rounded-xl text-sm transition-all duration-300 hover:shadow-lg focus:shadow-lg resize-none`}
                            placeholder="Masukkan alamat lengkap"
                          />
                          {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                        </div>
                      </div>

                      {/* Upload Foto KTP */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Upload Foto KTP
                        </label>
                        <div className="relative">
                          <FileInput
                            accept="image/*"
                            disabled={!isEditing}
                            file={files?.fotoKtp instanceof File ? files.fotoKtp : null}
                            previewUrl={typeof files?.fotoKtp === "string" ? files.fotoKtp : undefined}
                            onChange={(e) =>
                              setFiles({ ...files, fotoKtp: e.target.files?.[0] || files?.fotoKtp })
                            }
                          />
                          {!isEditing && (
                            <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                          )}
                        </div>
                      </div>

                      {/* Upload Sertifikat Sabuk */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="block font-plex font-semibold text-black/80 text-sm">
                          Upload Sertifikat Sabuk
                        </label>
                        <div className="relative">
                          <FileInput
                            accept="image/*"
                            disabled={!isEditing}
                            file={files?.sertifikatSabuk instanceof File ? files.sertifikatSabuk : null}
                            previewUrl={typeof files?.sertifikatSabuk === "string" ? files.sertifikatSabuk : undefined}
                            onChange={(e) =>
                              setFiles({ ...files, sertifikatSabuk: e.target.files?.[0] || files?.sertifikatSabuk })
                            }
                          />
                          {!isEditing && (
                            <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default Settings;