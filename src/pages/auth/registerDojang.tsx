import { useState } from "react";
import TextInput from "../../components/textInput";
import { Home, Phone, MapPin, Map, User, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../../pemuda-berprestasi-mvp/src/config/api"; 

const RegisterDojang = () => {
  const [namaDojang, setNamaDojang] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [founder, setFounder] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try { 
      // Payload yang benar sesuai backend - TIDAK mengirim 'status'
      const payload = {
        nama_dojang: namaDojang,
        email: email || null,
        no_telp: noHp || null,
        founder: founder || null,
        negara: negara || null,
        provinsi: provinsi || null,
        kota: kabupaten || null, // backend expects 'kota'
        // JANGAN kirim field berikut:
        // - status (akan di-set otomatis oleh backend via schema default)
        // - id_pelatih_pendaftar (bisa null untuk public registration)
      };

      console.log("Sending payload:", payload);

      const response = await apiClient.post("/dojang", payload);
      
      toast.success("Registrasi dojang berhasil! Menunggu persetujuan admin.");
      
      // Reset form setelah berhasil
      setNamaDojang("");
      setEmail("");
      setNoHp("");
      setFounder("");
      setKabupaten("");
      setProvinsi("");
      setNegara("");

      console.log("Registration successful:", response);
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Handle different error types dengan response yang benar dari api.ts
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
        toast.error(`Gagal registrasi: ${errorMessage}`);
      } else if (err.response?.status === 401) {
        toast.error("Sesi anda telah habis. Silakan refresh halaman.");
      } else if (err.response?.status === 409 || err.message?.includes('sudah terdaftar')) {
        toast.error("Nama dojang sudah terdaftar. Silakan gunakan nama lain.");
      } else {
        toast.error(err.message || "Terjadi kesalahan sistem. Coba lagi nanti.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validasi minimal - hanya nama dojang yang wajib
    if (!namaDojang.trim()) {
      toast.error("Nama dojang harus diisi");
      return;
    }

    // Validasi nama dojang tidak terlalu pendek
    if (namaDojang.trim().length < 3) {
      toast.error("Nama dojang minimal 3 karakter");
      return;
    }

    // Validasi email jika diisi
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    // Validasi nomor HP jika diisi
    if (noHp && !/^[\d\s\-\+\(\)]+$/.test(noHp)) {
      toast.error("Format nomor HP tidak valid");
      return;
    }

    handleRegister();
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-10 sm:px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-start items-center gap-8 py-10 overflow-y-scroll font-plex">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img
            src="src/assets/logo/taekwondo.png"
            alt="taekwondo logo"
            className="sm:h-50 sm:w-50 h-30 w-30"
          />
          <label className="font-bebas text-6xl text-center text-red">
            registrasi Dojang
          </label>
          <p className="text-sm text-gray-600 text-center">
            Daftarkan dojang anda untuk bergabung dengan komunitas taekwondo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="pl-2 text-sm font-medium">
              Nama Dojang <span className="text-red-500">*</span>
            </label>
            <TextInput
              value={namaDojang}
              onChange={(e) => setNamaDojang(e.target.value)}
              className="h-12 border-red"
              placeholder="Contoh: Dojang Garuda Sakti"
              icon={<Home className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">Email (Opsional)</label>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-red"
              placeholder="email@example.com"
              type="email"
              icon={<Mail className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">No HP (Opsional)</label>
            <TextInput
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              className="h-12 border-red"
              placeholder="08123456789"
              icon={<Phone className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">Nama Founder (Opsional)</label>
            <TextInput
              value={founder}
              onChange={(e) => setFounder(e.target.value)}
              className="h-12 border-red"
              placeholder="Nama pendiri dojang"
              icon={<User className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">Kabupaten/Kota (Opsional)</label>
            <TextInput
              value={kabupaten}
              onChange={(e) => setKabupaten(e.target.value)}
              className="h-12 border-red"
              placeholder="Jakarta Selatan"
              icon={<MapPin className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">Provinsi (Opsional)</label>
            <TextInput
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
              className="h-12 border-red"
              placeholder="DKI Jakarta"
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="pl-2 text-sm font-medium">Negara (Opsional)</label>
            <TextInput
              value={negara}
              onChange={(e) => setNegara(e.target.value)}
              className="h-12 border-red"
              placeholder="Indonesia"
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium">ℹ️ Informasi Penting:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Pendaftaran akan berstatus "Menunggu Persetujuan"</li>
              <li>Admin akan melakukan verifikasi sebelum aktivasi</li>
              <li>Anda akan dihubungi melalui kontak yang diberikan</li>
            </ul>
          </div>

          {/* Tombol Register */}
          <button
            type="submit"
            disabled={isLoading}
            className={`active:scale-97 mt-2 w-full h-12 rounded-xl text-white text-lg font-semibold transition-all duration-300 hover:shadow-xl ${
              isLoading 
                ? "bg-gray-400 border-gray-400 cursor-not-allowed" 
                : "bg-red border-2 border-red hover:scale-101"
            }`}
          >
            {isLoading ? "Mendaftarkan..." : "Daftar Dojang"}
          </button>

          <span className="text-center pt-1 text-sm">
            Belum punya akun pelatih?
            <Link to="/register" className="pl-1 underline hover:text-red">
              Daftar sebagai pelatih
            </Link>
          </span>

          <span className="text-center text-sm">
            Sudah punya akun?
            <Link
              to="/login"
              className="pl-1 underline hover:text-red transition-colors"
            >
              Login di sini
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
};

export default RegisterDojang;