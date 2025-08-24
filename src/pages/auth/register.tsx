import { useState } from "react";
import Select from "react-select";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import { Mail, User, Phone, Lock, IdCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../../pemuda-berprestasi-mvp/src/config/api";

type OptionType = { value: string; label: string };

const Register = () => {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [telepon, setTelepon] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedDojang, setSelectedDojang] = useState<OptionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // TODO: Nanti ini akan diganti dengan data dari API ketika Phase 2 Dojang selesai
  const dojangOptions: OptionType[] = [
    { value: "dojangA", label: "Dojang A" },
    { value: "dojangB", label: "Dojang B" },
    { value: "dojangC", label: "Dojang C" },
  ];

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      
      console.log('Sending registration data:', {
        nama,
        email,
        telepon,
        nik,
        dojangSelected: selectedDojang
      });
      
      // Prepare data sesuai dengan authValidation.ts schema
      const registerData = {
        email: email.toLowerCase().trim(),
        password,
        confirmPassword, // Required by validation
        nama_pelatih: nama.trim(), // Backend expects 'nama_pelatih', bukan 'nama'
        no_telp: telepon.trim() // Backend expects 'no_telp', bukan 'telepon'
        // Tidak kirim field lain karena tidak ada di validation schema
      };

      console.log('Final registration data (matching validation schema):', registerData);

      const response = await apiClient.post('/auth/register', registerData);
      
      console.log('Registration response:', response);
      
      if (response.success) {
        toast.success("Registrasi berhasil! Silakan login.");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        // Handle specific validation errors
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map((err: any) => err.message || err).join('\n');
          throw new Error(errorMessages);
        } else {
          throw new Error(response.message || 'Registrasi gagal');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle fetch errors
      if (error instanceof Error && error.message.includes('HTTP error')) {
        toast.error('Koneksi ke server gagal. Pastikan backend sedang berjalan.');
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Registrasi gagal';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ Validasi semua field
    if (
      !nama ||
      !email ||
      !nik ||
      !telepon ||
      !password ||
      !confirmPassword ||
      !selectedDojang
    ) {
      toast.error("Semua field harus terisi terlebih dahulu");
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    // Validasi NIK (16 digit)
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      toast.error("NIK harus berupa 16 digit angka");
      return;
    }

    // Validasi telepon
    if (!/^(\+62|62|0)[0-9]{9,13}$/.test(telepon)) {
      toast.error("Format nomor telepon tidak valid");
      return;
    }

    // Validasi password sesuai dengan backend requirement
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    // Password must contain at least one uppercase, one lowercase, and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password harus mengandung minimal 1 huruf, dan 1 angka");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      return;
    }

    handleRegister();
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-10 sm:px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-start items-center gap-8 py-10 pb-15 overflow-y-scroll font-plex">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img
            src="src/assets/logo/taekwondo.png"
            alt="taekwondo logo"
            className="h-30 w-30 sm:h-50 sm:w-50"
          />
          <label className="font-bebas text-6xl text-red">registrasi</label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Nama */}
          <div>
            <label className="pl-2">Nama *</label>
            <TextInput
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="h-12 border-red"
              placeholder="Nama Lengkap"
              icon={<User className="text-black" size={20} />}
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="pl-2">Email *</label>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-red"
              placeholder="Email"
              icon={<Mail className="text-black" size={20} />}
              disabled={isLoading}
            />
          </div>

          {/* NIK */}
          <div>
            <label className="pl-2">NIK *</label>
            <TextInput
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="h-12 border-red"
              placeholder="NIK (16 digit)"
              icon={<IdCard className="text-black" size={20} />}
              maxLength={16}
              disabled={isLoading}
            />
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="pl-2">Nomor Telepon *</label>
            <TextInput
              type="tel"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="h-12 border-red"
              placeholder="08xxxxxxxxxx"
              icon={<Phone className="text-black" size={20} />}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="pl-2">Password *</label>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-red"
              placeholder="Password (min. 8 karakter, harus ada huruf besar, kecil, angka)"
              icon={<Lock className="text-black" size={20} />}
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="pl-2">Confirm Password *</label>
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 border-red"
              placeholder="Konfirmasi Password"
              icon={<Lock className="text-black" size={20} />}
              disabled={isLoading}
            />
          </div>

          {/* Nama Dojang */}
          <div>
            <label className="pl-2">Nama Dojang *</label>
            <Select
              unstyled
              options={dojangOptions}
              value={selectedDojang}
              onChange={setSelectedDojang}
              placeholder="Pilih atau cari nama dojang..."
              isSearchable
              isDisabled={isLoading}
              classNames={{
                control: () =>
                  `border-2 border-red rounded-lg h-12 px-2 text-inter ${isLoading ? 'opacity-50' : ''}`,
                valueContainer: () => "px-2",
                placeholder: () => "text-red/50 text-inter",
                menu: () =>
                  "border-2 border-red bg-white rounded-lg shadow-lg mt-1",
                menuList: () => "max-h-40 overflow-y-scroll",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-4 py-2 cursor-pointer",
                    isFocused ? "bg-yellow/10 text-black" : "text-black",
                    isSelected ? "bg-red text-white" : "text-black",
                  ].join(" "),
              }}
            />
          </div>

          <div className="w-full text-end">
            <Link
              to="/registerdojang"
              className="underline hover:text-red transition-colors"
            >
              register your dojang
            </Link>
          </div>

          {/* Tombol Register */}
          <GeneralButton
            label={isLoading ? "Mendaftarkan..." : "Register"}
            type={"submit" as any}
            className={`active:scale-97 mt-2 w-full bg-red border-2 border-red h-12 rounded-xl text-white text-lg font-semibold hover:scale-101 transition-discrete duration-300 hover:shadow-xl ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          />

          <div className="w-full flex flex-col gap-2">
            <span className="text-center">
              Already have an account?
              <Link
                to="/login"
                className="pl-1 underline hover:text-red transition-colors"
              >
                Login here
              </Link>
            </span>
            
            {/* Info tambahan */}
            <div className="text-xs text-gray-600 text-center mt-2 px-4">
              <p>* Field wajib diisi</p>
              <p>Field lainnya seperti alamat, tanggal lahir, dll dapat diisi di halaman settings setelah login</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;