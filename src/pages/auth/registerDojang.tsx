import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import { Home, Phone, MapPin, Map } from 'lucide-react';
import { Link } from "react-router-dom";

const RegisterDojang = () => {

     return (
  <div className="h-screen w-full flex items-center justify-center bg-cover bg-center"
              style={{backgroundImage: "url('src/assets/photos/login.jpg')",
        }}>
      <div className="px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-start items-center gap-8 py-10 overflow-y-scroll font-inter">
        <div className="flex flex-col gap-2 justify-center items-center">
            <img src="src/assets/logo/taekwondo.png" alt="taekwondo logo" className="h-50 w-50"/>
            <label className="font-bebas text-6xl text-red">registrasi Dojang</label>
        </div>
      <div className="w-full flex flex-col gap-4">
        <div>
          <label className="pl-2">Nama Dojang</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="Nama Dojang"
            icon={<Home className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">No Hp</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="No Hp"
            icon={<Phone className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Alamat Lengkap</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="alamat"
            icon={<MapPin className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Kecamatan</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="kecamatan"
            icon={<Map className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Kabupaten/Kota</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="kabupaten/kota"
            icon={<Map className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Provinsi</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="provinsi"
            icon={<Map className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Negara</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="Negara"
            icon={<Map className="text-red" size={20} />}
          />
        </div>
      </div>
    <div className="w-full flex flex-col gap-2">
      <GeneralButton label="Register" className="w-full bg-red border-2 border-red h-12 text-white rounded-lg font-semibold"/>
      <Link to="/login" className="underline text-red hover:text-red-600">
        Login here
      </Link>
    </div>
    </div>
  </div>
);

}

export default RegisterDojang;