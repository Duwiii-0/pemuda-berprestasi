import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, User, CalendarFold, IdCard, MapPinned, Scale, Ruler, Save, ArrowLeft } from "lucide-react";
import NavbarDashboard from "../../components/navbar/navbarDashboard";

// Import your existing components
// import TextInput from "../../components/textInput";
// import FileInput from "../../components/fileInput";
// import Select from "react-select";

// Temporary components - replace with your actual imports
interface TextInputProps {
  icon?: React.ReactNode;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({ 
  icon, 
  className = "", 
  type = "text", 
  disabled = false, 
  ...props 
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
        {icon}
      </div>
    )}
    <input
      type={type}
      disabled={disabled}
      {...props}
      className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border-2 rounded-xl font-inter transition-all duration-300 focus:outline-none ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-red/40'
      } ${className}`}
    />
  </div>
);

interface FileInputProps {
  className?: string;
  accept?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: React.FC<FileInputProps> = ({ 
  className = "", 
  accept, 
  disabled = false, 
  onChange, 
  ...props 
}) => {
  const [fileName, setFileName] = useState<string>('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : '');
    if (onChange) onChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      <input 
        type="file" 
        accept={accept} 
        disabled={disabled}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        {...props} 
      />
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 hover:border-red/60'
      }`}>
        <p className="font-inter text-gray-500">
          {fileName || 'Klik untuk upload file'}
        </p>
        <p className="font-inter text-sm text-gray-400 mt-1">Format: JPG, PNG, PDF</p>
      </div>
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (selected: SelectOption | null) => void;
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ 
  options, 
  placeholder, 
  value, 
  onChange, 
  disabled = false, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border-2 rounded-xl font-inter text-left flex justify-between items-center transition-all duration-300 focus:outline-none ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-red/40'
        } ${className}`}
      >
        <span className={value ? 'text-black' : 'text-gray-500'}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-red/20 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (onChange) onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-red/10 transition-colors font-inter"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface AtlitFormData {
  name: string;
  provinsi: string;
  gender: "Laki-Laki" | "Perempuan" | "";
  umur: number | "";
  belt: string;
  phone: string;
  alamat: string;
  nik: string;
  bb: number | "";
  tb: number | "";
}

interface FormErrors {
  name?: string;
  provinsi?: string;
  gender?: string;
  umur?: string;
  belt?: string;
  phone?: string;
  alamat?: string;
  nik?: string;
  bb?: string;
  tb?: string;
}

const TambahAtlit: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<AtlitFormData>({
    name: "",
    provinsi: "",
    gender: "",
    umur: "",
    belt: "",
    phone: "",
    alamat: "",
    nik: "",
    bb: "",
    tb: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [documents, setDocuments] = useState<{
    akteKelahiran: File | null;
    pasFoto: File | null;
    sertifikatBelt: File | null;
    ktp: File | null;
  }>({
    akteKelahiran: null,
    pasFoto: null,
    sertifikatBelt: null,
    ktp: null,
  });

  const genderOptions: SelectOption[] = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];

  const beltOptions: SelectOption[] = [
    { value: "putih", label: "Putih" },
    { value: "kuning", label: "Kuning" },
    { value: "orange", label: "Orange" },
    { value: "hijau", label: "Hijau" },
    { value: "biru", label: "Biru" },
    { value: "coklat", label: "Coklat" },
    { value: "hitam", label: "Hitam" },
  ];

  const provinsiOptions: SelectOption[] = [
    { value: "DKI Jakarta", label: "DKI Jakarta" },
    { value: "Jawa Barat", label: "Jawa Barat" },
    { value: "Jawa Tengah", label: "Jawa Tengah" },
    { value: "Jawa Timur", label: "Jawa Timur" },
    { value: "Banten", label: "Banten" },
    { value: "Yogyakarta", label: "D.I. Yogyakarta" },
    { value: "Sumatera Utara", label: "Sumatera Utara" },
    { value: "Sumatera Barat", label: "Sumatera Barat" },
    { value: "Riau", label: "Riau" },
    { value: "Sumatera Selatan", label: "Sumatera Selatan" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = "Nama harus diisi";
    if (!formData.provinsi) newErrors.provinsi = "Provinsi harus dipilih";
    if (!formData.gender) newErrors.gender = "Gender harus dipilih";
    if (!formData.umur) newErrors.umur = "Umur harus diisi";
    if (!formData.belt) newErrors.belt = "Sabuk harus dipilih";
    if (!formData.phone.trim()) newErrors.phone = "No. telepon harus diisi";

    // Phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }

    // NIK validation
    if (formData.nik && (formData.nik.length !== 16 || !/^\d+$/.test(formData.nik))) {
      newErrors.nik = "NIK harus 16 digit angka";
    }

    // Age validation
    if (formData.umur) {
      const age = Number(formData.umur);
      if (isNaN(age) || age < 5 || age > 100) {
        newErrors.umur = "Umur harus antara 5-100 tahun";
      }
    }

    // Weight validation
    if (formData.bb && (Number(formData.bb) < 10 || Number(formData.bb) > 300)) {
      newErrors.bb = "Berat badan tidak valid";
    }

    // Height validation
    if (formData.tb && (Number(formData.tb) < 50 || Number(formData.tb) > 250)) {
      newErrors.tb = "Tinggi badan tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });
      
      // Add documents
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          submitData.append(key, file);
        }
      });
      
      console.log("Data yang akan disimpan:", Object.fromEntries(submitData));
      
      setSubmitSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          provinsi: "",
          gender: "",
          umur: "",
          belt: "",
          phone: "",
          alamat: "",
          nik: "",
          bb: "",
          tb: "",
        });
        setDocuments({
          akteKelahiran: null,
          pasFoto: null,
          sertifikatBelt: null,
          ktp: null,
        });
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AtlitFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const handleBack = () => {
    navigate('/dashboard/atlit');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 md:px-8">

          {/* Success Message */}
          {submitSuccess && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-pulse">
              Data atlet berhasil disimpan!
            </div>
          )}
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2 flex-1">
              <button 
                onClick={handleBack}
                className="text-red hover:text-red/80 font-inter mb-4 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={20} />
                Kembali ke Data Atlit
              </button>
              <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                TAMBAH ATLIT
              </h1>
              <p className="font-inter text-black/60 text-lg">
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
                  <label className="block font-inter font-medium text-black/70">
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
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm font-inter">{errors.name}</p>
                  )}
                </div>

                {/* No HP */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">
                    No. Telepon <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.phone ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Contoh: 08123456789"
                    icon={<Phone className="text-red" size={20} />}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm font-inter">{errors.phone}</p>
                  )}
                </div>

                {/* Alamat */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="block font-inter font-medium text-black/70">Alamat</label>
                  <TextInput
                    className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                    value={formData.alamat}
                    onChange={(e) => handleInputChange('alamat', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    icon={<MapPinned className="text-red" size={20} />}
                  />
                </div>

                {/* Provinsi */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">
                    Provinsi <span className="text-red">*</span>
                  </label>
                  <Select
                    value={formData.provinsi}
                    onChange={(selected) => handleInputChange('provinsi', selected?.value || '')}
                    options={provinsiOptions}
                    placeholder="Pilih provinsi"
                    className={`bg-white/50 backdrop-blur-sm focus:border-red transition-all duration-300 ${
                      errors.provinsi ? 'border-red-500' : 'border-red/20'
                    }`}
                  />
                  {errors.provinsi && (
                    <p className="text-red-500 text-sm font-inter">{errors.provinsi}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">
                    Gender <span className="text-red">*</span>
                  </label>
                  <Select
                    value={formData.gender}
                    onChange={(selected) => handleInputChange('gender', selected?.value as "Laki-Laki" | "Perempuan" || '')}
                    options={genderOptions}
                    placeholder="Pilih gender"
                    className={`bg-white/50 backdrop-blur-sm focus:border-red transition-all duration-300 ${
                      errors.gender ? 'border-red-500' : 'border-red/20'
                    }`}
                  />
                  {errors.gender && (
                    <p className="text-red-500 text-sm font-inter">{errors.gender}</p>
                  )}
                </div>

                {/* Umur */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">
                    Umur <span className="text-red">*</span>
                  </label>
                  <TextInput
                    type="number"
                    min="5"
                    max="100"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.umur ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.umur}
                    onChange={(e) => handleInputChange('umur', Number(e.target.value) || '')}
                    placeholder="Masukkan umur"
                    icon={<CalendarFold className="text-red" size={20} />}
                  />
                  {errors.umur && (
                    <p className="text-red-500 text-sm font-inter">{errors.umur}</p>
                  )}
                </div>

                {/* Sabuk */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">
                    Tingkat Sabuk <span className="text-red">*</span>
                  </label>
                  <Select
                    value={formData.belt}
                    onChange={(selected) => handleInputChange('belt', selected?.value || '')}
                    options={beltOptions}
                    placeholder="Pilih tingkat sabuk"
                    className={`bg-white/50 backdrop-blur-sm focus:border-red transition-all duration-300 ${
                      errors.belt ? 'border-red-500' : 'border-red/20'
                    }`}
                  />
                  {errors.belt && (
                    <p className="text-red-500 text-sm font-inter">{errors.belt}</p>
                  )}
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
                  DATA FISIK (OPSIONAL)
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Berat Badan */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">Berat Badan (kg)</label>
                  <TextInput
                    type="number"
                    min="10"
                    max="300"
                    step="0.1"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.bb ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.bb}
                    onChange={(e) => handleInputChange('bb', Number(e.target.value) || '')}
                    placeholder="Contoh: 65.5"
                    icon={<Scale className="text-red" size={20} />}
                  />
                  {errors.bb && (
                    <p className="text-red-500 text-sm font-inter">{errors.bb}</p>
                  )}
                </div>

                {/* Tinggi Badan */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">Tinggi Badan (cm)</label>
                  <TextInput
                    type="number"
                    min="50"
                    max="250"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.tb ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.tb}
                    onChange={(e) => handleInputChange('tb', Number(e.target.value) || '')}
                    placeholder="Contoh: 170"
                    icon={<Ruler className="text-red" size={20} />}
                  />
                  {errors.tb && (
                    <p className="text-red-500 text-sm font-inter">{errors.tb}</p>
                  )}
                </div>

                {/* NIK */}
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">NIK</label>
                  <TextInput
                    maxLength={16}
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.nik ? 'border-red-500' : 'border-red/20'
                    }`}
                    value={formData.nik}
                    onChange={(e) => handleInputChange('nik', e.target.value)}
                    placeholder="16 digit NIK"
                    icon={<IdCard className="text-red" size={20} />}
                  />
                  {errors.nik && (
                    <p className="text-red-500 text-sm font-inter">{errors.nik}</p>
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
                  <label className="block font-inter font-medium text-black/70">Akte Kelahiran</label>
                  <FileInput 
                    accept="image/*,application/pdf" 
                    className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                    onChange={(e) => handleFileChange('akteKelahiran', e.target.files?.[0] || null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">Pas Foto 3x4</label>
                  <FileInput 
                    accept="image/*" 
                    className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                    onChange={(e) => handleFileChange('pasFoto', e.target.files?.[0] || null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">Sertifikasi Belt</label>
                  <FileInput 
                    accept="image/*,application/pdf" 
                    className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                    onChange={(e) => handleFileChange('sertifikatBelt', e.target.files?.[0] || null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-inter font-medium text-black/70">KTP (Wajib untuk 17+)</label>
                  <FileInput 
                    accept="image/*,application/pdf" 
                    className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                    onChange={(e) => handleFileChange('ktp', e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-lg font-inter disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red text-white hover:bg-red/90 transition-all duration-300 shadow-lg font-inter disabled:opacity-50 disabled:cursor-not-allowed"
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
};

export default TambahAtlit;