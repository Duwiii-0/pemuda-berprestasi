import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import { Mail, Home, User, Phone, Lock } from 'lucide-react';
import { Link } from "react-router-dom";

const RegisterDojang = () => {

     return (
  <div className="h-screen w-full flex items-center justify-center bg-cover bg-center"
              style={{backgroundImage: "url('src/assets/photos/login.jpg')",
        }}>
    <div className="px-20 bg-white h-screen md:h-[72vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[42vw] rounded-xl flex flex-col justify-start items-center gap-8 border-3 border-yellow py-10 overflow-y-scroll font-inter">
      <div className="font-bebas text-6xl">Register dojang</div>
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
          <label className="pl-2">Nama Pelatih</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="Nama Pelatih"
            icon={<User className="text-red" size={20} />}
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
          <label className="pl-2">Alamat Email</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="Email"
            icon={<Mail className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Password</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="password"
            icon={<Lock className="text-red" size={20} />}
          />
        </div>
        <div>
          <label className="pl-2">Konfirmasi Password</label>
          <TextInput
            className="h-12 placeholder:text-red border-red"
            placeholder="password"
            icon={<Lock className="text-red" size={20} />}
          />
        </div>
      </div>
    <div className="w-full flex flex-col gap-2">
      <GeneralButton label="Register" type="link" className="w-full bg-red border-2 border-red h-12 text-white rounded-lg font-semibold"/>
      <Link to="/login" className="underline text-red hover:text-red-600">
        Login here
      </Link>
    </div>
    </div>
  </div>
);

}

export default RegisterDojang;