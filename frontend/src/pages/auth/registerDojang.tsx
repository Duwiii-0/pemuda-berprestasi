import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import Select from "react-select";
import TextInput from "../../components/textInput";
import { Home, Phone, Mail, Upload, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../config/api";
import Logo from '../../assets/logo/logo.png';

// Types
interface OptionType {
  value: string;
  label: string;
}

// Data provinsi dan kota
const provinsiKotaData: Record<string, string[]> = {
  "Aceh": ["Simeulue", "Aceh Singkil", "Aceh Selatan", "Aceh Tenggara", "Aceh Timur", "Aceh Tengah", "Aceh Barat", "Aceh Besar", "Pidie", "Bireuen", "Aceh Utara", "Aceh Barat Daya", "Gayo Lues", "Aceh Tamiang", "Nagan Raya", "Aceh Jaya", "Bener Meriah", "Pidie Jaya", "Banda Aceh", "Sabang", "Langsa", "Lhokseumawe", "Subulussalam"],
  "Sumatera Utara": ["Asahan", "Batubara", "Dairi", "Deli Serdang", "Humbang Hasundutan", "Karo", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara", "Langkat", "Mandailing Natal", "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Padang Lawas", "Padang Lawas Utara", "Pakpak Bharat", "Samosir", "Serdang Bedagai", "Simalungun", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara", "Toba", "Binjai", "Gunungsitoli", "Medan", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  "Sumatera Barat": ["Agam", "Dharmasraya", "Kepulauan Mentawai", "Lima Puluh Kota", "Padang Pariaman", "Pasaman", "Pasaman Barat", "Pesisir Selatan", "Sijunjung", "Solok", "Solok Selatan", "Tanah Datar", "Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok (Kota)"],
  "Riau": ["Bengkalis", "Indragiri Hilir", "Indragiri Hulu", "Kampar", "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan", "Rokan Hilir", "Rokan Hulu", "Siak", "Pekanbaru", "Dumai"],
  "Kepulauan Riau": ["Bintan", "Karimun", "Kepulauan Anambas", "Lingga", "Natuna", "Batam", "Tanjung Pinang"],
  "Jambi": ["Batanghari", "Bungo", "Kerinci", "Merangin", "Muaro Jambi", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo", "Jambi", "Sungai Penuh"],
  "Sumatera Selatan": ["Banyuasin", "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin", "Musi Rawas", "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur", "Penukal Abab Lematang Ilir", "Palembang", "Prabumulih", "Pagar Alam", "Lubuklinggau", "Martapura"],
  "Bangka Belitung": ["Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah", "Belitung", "Belitung Timur", "Pangkal Pinang"],
  "Bengkulu": ["Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Kaur", "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma", "Bengkulu"],
  "Lampung": ["Lampung Barat", "Tanggamus", "Lampung Selatan", "Lampung Timur", "Lampung Tengah", "Lampung Utara", "Way Kanan", "Pesawaran", "Pringsewu", "Mesuji", "Tulang Bawang", "Tulang Bawang Barat", "Pesisir Barat", "Bandar Lampung", "Metro"],
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bandung Barat", "Bekasi", "Bogor", "Ciamis", "Cianjur", "Cirebon", "Garut", "Indramayu", "Karawang", "Kuningan", "Majalengka", "Pangandaran", "Purwakarta", "Subang", "Sukabumi", "Sumedang", "Tasikmalaya", "Banjar", "Cimahi", "Depok"],
  "Banten": ["Lebak", "Pandeglang", "Serang", "Tangerang", "Tangerang Selatan", "Cilegon"],
  "Jawa Tengah": ["Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", "Cilacap", "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", "Kendal", "Klaten", "Kudus", "Magelang", "Pati", "Pekalongan", "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Semarang", "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri", "Wonosobo", "Magelang (Kota)", "Pekalongan (Kota)", "Salatiga", "Semarang (Kota)", "Surakarta", "Tegal (Kota)"],
  "Yogyakarta": ["Bantul", "Gunungkidul", "Kulon Progo", "Sleman", "Yogyakarta"],
  "Jawa Timur": ["Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", "Jombang", "Kediri", "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung", "Batu", "Kediri (Kota)", "Madiun (Kota)", "Malang (Kota)", "Mojokerto (Kota)", "Pasuruan (Kota)", "Probolinggo (Kota)", "Surabaya"],
  "Bali": ["Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan", "Denpasar"],
  "Nusa Tenggara Barat": ["Bima", "Dompu", "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Lombok Utara", "Sumbawa", "Sumbawa Barat", "Mataram", "Bima (Kota)"],
  "Nusa Tenggara Timur": ["Alor", "Belu", "Ende", "Flores Timur", "Kupang", "Lembata", "Malaka", "Manggarai", "Manggarai Barat", "Manggarai Timur", "Ngada", "Nagekeo", "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat", "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur", "Timor Tengah Selatan", "Timor Tengah Utara", "Kupang (Kota)"],
  "Kalimantan Barat": ["Bengkayang", "Kapuas Hulu", "Kayong Utara", "Ketapang", "Kubu Raya", "Landak", "Melawi", "Mempawah", "Sambas", "Sanggau", "Sekadau", "Sintang", "Pontianak", "Singkawang"],
  "Kalimantan Tengah": ["Barito Selatan", "Barito Timur", "Barito Utara", "Gunung Mas", "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur", "Lamandau", "Murung Raya", "Pulang Pisau", "Seruyan", "Sukamara", "Palangka Raya"],
  "Kalimantan Selatan": ["Balangan", "Banjar", "Barito Kuala", "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara", "Kotabaru", "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin", "Banjarbaru", "Banjarmasin", "Martapura"],
  "Kalimantan Timur": ["Berau", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Mahakam Ulu", "Paser", "Penajam Paser Utara", "Samarinda", "Balikpapan", "Bontang"],
  "Kalimantan Utara": ["Bulungan", "Malinau", "Nunukan", "Tana Tidung", "Tarakan"],
  "Sulawesi Utara": ["Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara", "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro", "Kepulauan Talaud", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara", "Bitung", "Kotamobagu", "Manado", "Tomohon"],
  "Sulawesi Tengah": ["Banggai", "Banggai Kepulauan", "Banggai Laut", "Buol", "Donggala", "Morowali", "Morowali Utara", "Parigi Moutong", "Poso", "Sigi", "Tojo Una-Una", "Toli-Toli", "Palu"],
  "Sulawesi Selatan": ["Bantaeng", "Barru", "Bone", "Bulukumba", "Enrekang", "Gowa", "Jeneponto", "Kepulauan Selayar", "Luwu", "Luwu Timur", "Luwu Utara", "Maros", "Pangkajene Kepulauan", "Pinrang", "Sidenreng Rappang", "Sinjai", "Soppeng", "Takalar", "Tana Toraja", "Toraja Utara", "Wajo", "Makassar", "Palopo", "Parepare"],
  "Sulawesi Tenggara": ["Bombana", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat", "Wakatobi", "Kendari", "Bau-Bau"],
  "Gorontalo": ["Boalemo", "Bone Bolango", "Gorontalo", "Gorontalo Utara", "Pohuwato", "Gorontalo (Kota)"],
  "Sulawesi Barat": ["Majene", "Mamasa", "Mamuju", "Mamuju Tengah", "Pasangkayu", "Polewali Mandar"],
  "Maluku": ["Buru", "Buru Selatan", "Kepulauan Aru", "Maluku Barat Daya", "Maluku Tengah", "Maluku Tenggara", "Maluku Tenggara Barat", "Seram Bagian Barat", "Seram Bagian Timur", "Tual", "Ambon"],
  "Maluku Utara": ["Halmahera Barat", "Halmahera Tengah", "Halmahera Timur", "Halmahera Selatan", "Halmahera Utara", "Kepulauan Sula", "Pulau Morotai", "Pulau Taliabu", "Tidore Kepulauan", "Ternate"],
  "Papua": ["Biak Numfor", "Jayapura", "Jayawijaya", "Keerom", "Kepulauan Yapen", "Mamberamo Raya", "Mamberamo Tengah", "Sarmi", "Supiori", "Waropen", "Yalimo", "Jayapura (Kota)"],
  "Papua Tengah": ["Deiyai", "Dogiyai", "Intan Jaya", "Mimika", "Nabire", "Paniai"],
  "Papua Pegunungan": ["Jayawijaya", "Lanny Jaya", "Mamberamo Tengah", "Mappi", "Nduga", "Pegunungan Bintang", "Tolikara", "Yahukimo", "Yalimo"],
  "Papua Selatan": ["Asmat", "Boven Digoel", "Mappi", "Merauke"],
  "Papua Barat": ["Fakfak", "Kaimana", "Manokwari", "Manokwari Selatan", "Pegunungan Arfak", "Teluk Bintuni", "Teluk Wondama"],
  "Papua Barat Daya": ["Maybrat", "Raja Ampat", "Sorong", "Sorong Selatan", "Tambrauw"]
};

const provinsiOptions: OptionType[] = Object.keys(provinsiKotaData).map(provinsi => ({
  value: provinsi,
  label: provinsi
}));

// File Preview Component
interface FilePreviewProps {
  file: File | null;
  onRemove: () => void;
  disabled: boolean;
  label: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  onRemove, 
  disabled,
  label 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewError(false);
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating preview URL:', error);
        setPreviewError(true);
      }
    } else {
      setPreviewUrl(null);
      setPreviewError(false);
    }
  }, [file]);

  const isImageFile = (): boolean => {
    if (file) return file.type.startsWith('image/');
    return false;
  };

  if (!file) return null;

  return (
    <div className="mt-2 p-3 bg-white/70 rounded-xl border border-red/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-black/70">
          File dipilih: {file.name}
        </span>
        {!disabled && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red/10 rounded-full transition-colors"
            type="button"
          >
            <X size={16} className="text-red" />
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        {/* Preview Image */}
        {previewUrl && !previewError && isImageFile() && (
          <div className="relative w-20 h-20 flex-shrink-0">
            <img 
              src={previewUrl} 
              alt={`Preview ${label}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              onError={() => {
                setPreviewError(true);
              }}
            />
          </div>
        )}
        
        {/* File icon untuk non-image atau jika preview error */}
        {(!previewUrl || previewError || !isImageFile()) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 w-20 h-20 border rounded-lg justify-center bg-gray-50">
            <Upload size={24} className="text-gray-400" />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1 flex-1">
          {/* View/Preview Button */}
          {previewUrl && (
            <button
              onClick={() => {
                window.open(previewUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
              type="button"
            >
              <Eye size={12} />
              Preview Logo
            </button>
          )}
          
          {/* Status indicator */}
          <div className="text-xs text-gray-500">
            Logo siap diupload
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterDojang = () => {
  const [nama_dojang, setnama_dojang] = useState("");
  const [email, setEmail] = useState("");
  const [no_telp, setno_telp] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get city options based on selected province
  const kotaOptions: OptionType[] = provinsi ? provinsiKotaData[provinsi]?.map((kota: string) => ({
    value: kota,
    label: kota
  })) || [] : [];

  const handleProvinsiChange = (selectedOption: OptionType | null) => {
    setProvinsi(selectedOption?.value || "");
    setKabupaten(""); 
  };

  const handleKotaChange = (selectedOption: OptionType | null) => {
    setKabupaten(selectedOption?.value || "");
  };

  const getSelectValue = (options: OptionType[], value: string): OptionType | null => {
    return options.find((option: OptionType) => option.value === value) || null;
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target?.files?.[0];
  if (!file) return;

  console.log('📸 Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Validasi ukuran file (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Ukuran file maksimal 5MB");
    e.target.value = ''; // Reset input
    return;
  }

  // Validasi tipe file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    toast.error("Format file harus JPG, PNG, JPEG, atau WebP");
    e.target.value = ''; // Reset input
    return;
  }

  // Validasi nama file
  if (file.name.length > 255) {
    toast.error("Nama file terlalu panjang");
    e.target.value = ''; // Reset input
    return;
  }

  setLogoFile(file);
  toast.success(`Logo ${file.name} berhasil dipilih`);
};

  const removeLogo = () => {
    setLogoFile(null);
    
    const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
    const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
    
    if (fileInputDesktop) fileInputDesktop.value = '';
    if (fileInputMobile) fileInputMobile.value = '';
    
    toast.success("Logo berhasil dihapus");
  };

  const resetForm = () => {
  setnama_dojang("");
  setEmail("");
  setno_telp("");
  setKabupaten("");
  setProvinsi("");
  setNegara("");
  setLogoFile(null);
  
  // Reset file inputs
  const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
  const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
  if (fileInputDesktop) fileInputDesktop.value = '';
  if (fileInputMobile) fileInputMobile.value = '';
};

const handleRegister = async () => {
  setIsLoading(true);
  try {
    console.log('📝 Data yang akan dikirim:', {
      nama_dojang: nama_dojang.trim(),
      email: email.trim(),
      no_telp: no_telp.trim(),
      negara: negara.trim(),
      provinsi: provinsi.trim(),
      kota: kabupaten.trim(),
      logo: logoFile?.name || 'tidak ada'
    });

    if (!nama_dojang.trim()) {
      toast.error("Nama dojang tidak boleh kosong");
      return;
    }

    const formData = new FormData();
    formData.append('nama_dojang', nama_dojang.trim());
    formData.append('email', email.trim() || '');
    formData.append('no_telp', no_telp.trim() || '');
    formData.append('negara', negara.trim() || 'Indonesia');
    formData.append('provinsi', provinsi.trim() || '');
    formData.append('kota', kabupaten.trim() || '');
    
    if (logoFile) {
      formData.append('logo', logoFile);
      console.log('📎 Uploading logo:', logoFile.name, 'Size:', logoFile.size);
    }

    console.log('📤 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, value.name, `(${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    console.log('🚀 Sending request to /dojang...');
    
    // ✅ PERBAIKAN: Call API dengan handling yang sudah diperbaiki
    const response = await apiClient.postFormData("/dojang", formData);
    
    console.log('✅ Registration response:', response);
    
    // ✅ PERBAIKAN: Handle response - API Client sudah return parsed JSON
    if (response) {
      console.log('✅ Registration successful:', response);
      toast.success("Registrasi dojang berhasil! Silahkan login.");
      resetForm();
    } else {
      console.log('⚠️ Empty response but no error thrown');
      toast.success("Registrasi dojang berhasil! Silahkan login.");
      resetForm();
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // ✅ PERBAIKAN: Handle structured error dari API Client
    if (error && typeof error === 'object' && error.status !== undefined) {
      const { status, data, message } = error;
      
      console.log('📡 API Error - Status:', status, 'Data:', data, 'Message:', message);
      
      // Handle berdasarkan status code
      if (status === 400) {
        if (data && data.errors) {
          // Laravel validation errors
          const errors = data.errors;
          const firstErrorKey = Object.keys(errors)[0];
          const firstError = errors[firstErrorKey];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMsg || "Data tidak valid");
        } else if (data && data.message) {
          toast.error(data.message);
        } else {
          toast.error("Data tidak valid. Periksa kembali input Anda.");
        }
      } else if (status === 422) {
        if (data && data.errors) {
          const errors = data.errors;
          const firstErrorKey = Object.keys(errors)[0];
          const firstError = errors[firstErrorKey];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMsg || "Data tidak sesuai format yang diperlukan.");
        } else if (data && data.message) {
          toast.error(data.message);
        } else {
          toast.error("Data tidak sesuai format yang diperlukan.");
        }
      } else if (status === 413) {
        toast.error("File terlalu besar. Maksimal 5MB.");
      } else if (status === 500) {
        toast.error("Terjadi kesalahan server. Coba lagi nanti.");
      } else if (status === 0) {
        // Network error
        toast.error("Koneksi bermasalah. Periksa internet Anda.");
      } else if (status >= 400) {
        toast.error(message || `Error ${status}`);
      } else {
        toast.error(message || "Terjadi kesalahan tidak terduga.");
      }
    } else {
      // Fallback untuk error format lain
      console.error('❌ Unexpected error format:', error);
      const errorMessage = error?.message || 'Terjadi kesalahan tidak terduga.';
      
      if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        toast.error("Koneksi bermasalah. Periksa internet Anda.");
      } else {
        toast.error(errorMessage);
      }
    }
  } finally {
    setIsLoading(false);
  }
};
  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validasi yang lebih ketat
  const trimmedNama = nama_dojang.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = no_telp.trim();

  if (!trimmedNama) {
    toast.error("Nama dojang harus diisi");
    return;
  }

  if (trimmedNama.length < 3) {
    toast.error("Nama dojang minimal 3 karakter");
    return;
  }

  if (trimmedNama.length > 100) {
    toast.error("Nama dojang maksimal 100 karakter");
    return;
  }

  // Validasi email jika diisi
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    toast.error("Format email tidak valid");
    return;
  }

  // Validasi phone jika diisi
  if (trimmedPhone && !/^[\d\s\-\+\(\)]{8,20}$/.test(trimmedPhone)) {
    toast.error("Format nomor HP tidak valid (8-20 digit)");
    return;
  }

  // Validasi file logo jika ada
  if (logoFile) {
    if (logoFile.size > 5 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 5MB");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(logoFile.type)) {
      toast.error("Format logo harus JPG, PNG, JPEG, atau WebP");
      return;
    }
  }

  console.log('🚀 Form submitted with valid data');
  handleRegister();
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 py-8">
      {/* Register Container */}
      <div className="w-full max-w-lg mx-4 sm:max-w-xl sm:mx-6 2xl:max-w-2xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-7 md:p-8">
          
          {/* Header Section */}
          <div className="text-center mb-6 md:mb-8">
            {/* Logo */}
            <div className="relative mb-4 md:mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
              <img 
                src={Logo}
                alt="Taekwondo Logo" 
                className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto drop-shadow-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl leading-none tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  REGISTRASI DOJANG
                </span>
              </h1>
              <div className="w-14 md:w-20 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
              <p className="text-xs md:text-sm font-plex text-black/70 mt-2 md:mt-3">
                Daftarkan dojang Anda untuk bergabung dengan komunitas taekwondo
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            
            {/* Logo Upload Section - Desktop */}
            <div className="hidden sm:block space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Logo Dojang <span className="text-xs text-black/50">(opsional)</span>
              </label>
              <div className="relative group">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full p-3 md:p-4 border-2 border-red/25 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20 text-sm md:text-base"
                  disabled={isLoading}
                />
                <Upload className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors pointer-events-none" size={16} />
              </div>
              <FilePreview
                file={logoFile}
                onRemove={removeLogo}
                disabled={isLoading}
                label="Logo Dojang"
              />
            </div>

            {/* Logo Upload Section - Mobile */}
            <div className="sm:hidden space-y-1.5">
              <label className="text-xs font-plex font-medium text-black/80 block">
                Logo Dojang <span className="text-xs text-black/50">(opsional)</span>
              </label>
              <div className="relative group">
                <input
                  id="logo-upload-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full p-2.5 text-sm border-2 border-red/25 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20"
                  disabled={isLoading}
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors pointer-events-none" size={14} />
              </div>
              <FilePreview
                file={logoFile}
                onRemove={removeLogo}
                disabled={isLoading}
                label="Logo Dojang"
              />
            </div>

            {/* Nama Dojang */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Nama Dojang <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={nama_dojang}
                  onChange={(e) => setnama_dojang(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Contoh: Dojang Garuda Sakti"
                  type="text"
                  disabled={isLoading}
                />
                <Home className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Email <span className="text-xs text-black/50"></span>
              </label>
              <div className="relative group">
                <TextInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="email@example.com"
                  type="email"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                No HP <span className="text-xs text-black/50"></span>
              </label>
              <div className="relative group">
                <TextInput
                  value={no_telp}
                  onChange={(e) => setno_telp(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="08123456789"
                  disabled={isLoading}
                />
                <Phone className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Location Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provinsi */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Provinsi <span className="text-xs text-black/50"></span>
                </label>
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 50 })
                  }}
                  isDisabled={isLoading}
                  value={getSelectValue(provinsiOptions, provinsi)}
                  onChange={handleProvinsiChange}
                  options={provinsiOptions}
                  placeholder="Pilih provinsi"
                  classNames={{
                    control: () =>
                      `flex items-center border-2 ${
                        !isLoading 
                          ? 'border-red/25 hover:border-red/40 focus-within:border-red bg-white/80' 
                          : 'border-gray-200 bg-gray-50'
                      } rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs md:text-sm",
                    singleValue: () => "text-black/80 font-plex text-xs md:text-sm",
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
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Kota <span className="text-xs text-black/50"></span>
                </label>
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 50 })
                  }}
                  isDisabled={isLoading || !provinsi}
                  value={getSelectValue(kotaOptions, kabupaten)}
                  onChange={handleKotaChange}
                  options={kotaOptions}
                  placeholder={provinsi ? "Pilih kota" : "Pilih provinsi dulu"}
                  classNames={{
                    control: () =>
                      `flex items-center border-2 ${
                        !isLoading && provinsi
                          ? 'border-red/25 hover:border-red/40 focus-within:border-red bg-white/80' 
                          : 'border-gray-200 bg-gray-50'
                      } rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs md:text-sm",
                    singleValue: () => "text-black/80 font-plex text-xs md:text-sm",
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

            {/* Negara */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Negara <span className="text-xs text-black/50"></span>
              </label>
              <div className="relative group">
                <TextInput
                  value={negara}
                  onChange={(e) => setNegara(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-4 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Indonesia"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-4 md:pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 md:h-12 rounded-xl text-white text-sm md:text-base font-plex font-semibold transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 active:scale-[0.98]"
                }`}
              >
                {isLoading ? "Mendaftarkan..." : "Daftar Dojang"}
              </button>
            </div>

            {/* Links */}
            <div className="text-center pt-4 md:pt-6 space-y-2">
              <p className="text-xs md:text-sm font-plex text-black/70">
                Belum punya akun pelatih?{" "}
                <Link 
                  to="/register" 
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Daftar sebagai pelatih
                </Link>
              </p>
              
              <p className="text-xs md:text-sm font-plex text-black/70">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Login di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterDojang;