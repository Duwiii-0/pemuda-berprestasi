import { useState } from "react";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import { Home, Phone, MapPin, Map } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const RegisterDojang = () => {
  const [namaDojang, setNamaDojang] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");

  const handleRegister = () => {
    toast.success("Registrasi dojang berhasil (dummy)!");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !namaDojang ||
      !noHp ||
      !alamat ||
      !kecamatan ||
      !kabupaten ||
      !provinsi ||
      !negara
    ) {
      toast.error("Semua field harus terisi terlebih dahulu");
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="pl-2">Nama Dojang</label>
            <TextInput
              value={namaDojang}
              onChange={(e) => setNamaDojang(e.target.value)}
              className="h-12  border-red"
              placeholder="Nama Dojang"
              icon={<Home className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">No Hp</label>
            <TextInput
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              className="h-12  border-red"
              placeholder="No Hp"
              icon={<Phone className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">Alamat Lengkap</label>
            <TextInput
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="h-12  border-red"
              placeholder="alamat"
              icon={<MapPin className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">Kecamatan</label>
            <TextInput
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className="h-12  border-red"
              placeholder="kecamatan"
              icon={<Map className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">Kabupaten/Kota</label>
            <TextInput
              value={kabupaten}
              onChange={(e) => setKabupaten(e.target.value)}
              className="h-12  border-red"
              placeholder="kabupaten/kota"
              icon={<Map className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">Provinsi</label>
            <TextInput
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
              className="h-12  border-red"
              placeholder="provinsi"
              icon={<Map className="text-red" size={20} />}
            />
          </div>
          <div>
            <label className="pl-2">Negara</label>
            <TextInput
              value={negara}
              onChange={(e) => setNegara(e.target.value)}
              className="h-12  border-red"
              placeholder="Negara"
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          {/* Tombol Register */}
          <GeneralButton
            label="Register"
            type={ "submit" as any }
            className="mt-2 w-full bg-red border-2 border-red h-12 rounded-xl text-white text-lg font-semibold hover:scale-101 transition-discrete duration-300 hover:shadow-xl"
          />

          <span className="text-center pt-1">
            Dont have an account?
            <Link to="/register" className="pl-1 underline hover:text-red">
              Register here
            </Link>
          </span>

          <span className="text-center">
            Already have an account?
            <Link
              to="/login"
              className="pl-1 underline hover:text-red transition-colors"
            >
              Login here
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
};

export default RegisterDojang;
