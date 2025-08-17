import { useState } from "react";
import Select from "react-select";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import { Mail, User, Phone, Lock, IdCard } from "lucide-react";
import { Link } from "react-router-dom";

const Register = () => {

    const [selectedDojang, setSelectedDojang] = useState<OptionType | null>(null);
    type OptionType = { value: string; label: string };


  const dojangOptions: OptionType [] = [
    { value: "dojangA", label: "Dojang A" },
    { value: "dojangB", label: "Dojang B" },
    { value: "dojangC", label: "Dojang C" },
 
  ];

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-start items-center gap-8 py-10 overflow-y-scroll font-inter">
        <div className="flex flex-col gap-2 justify-center items-center">
            <img src="src/assets/logo/taekwondo.png" alt="taekwondo logo" className="h-50 w-50"/>
            <label className="font-bebas text-6xl text-red">registrasi</label>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Nama */}
          <div>
            <label className="pl-2">Nama</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="Nama"
              icon={<User className="text-black" size={20} />}
            />
          </div>

          {/* Email */}
          <div>
            <label className="pl-2">Email</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="Email"
              icon={<Mail className="text-black" size={20} />}
            />
          </div>

          {/* NIK */}
          <div>
            <label className="pl-2">NIK</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="NIK"
              icon={<IdCard className="text-black" size={20} />}
            />
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="pl-2">Nomor Telepon</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="Nomor Telepon"
              icon={<Phone className="text-black" size={20} />}
            />
          </div>

          {/* Password */}
          <div>
            <label className="pl-2">Password</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="Password"
              icon={<Lock className="text-black" size={20} />}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="pl-2">Confirm Password</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              placeholder="Confirm Password"
              icon={<Lock className="text-black" size={20} />}
            />
          </div>

          {/* Nama Dojang */}
          <div>
            <label className="pl-2">Nama Dojang</label>
            <Select
              unstyled
              options={dojangOptions}
              value={selectedDojang}
              onChange={setSelectedDojang}
              placeholder="Pilih atau cari nama dojang..."
              isSearchable
              classNames={{
                  control: () =>
                  "border-2 border-red rounded-lg h-12 px-2 text-inter",
                  valueContainer: () => "px-2",
                  placeholder: () => "text-red/50 text-inter",
                  menu: () => "border-2 border-red bg-white rounded-lg shadow-lg mt-1",
                  menuList: () => "max-h-40 overflow-y-scroll", // max tinggi + scroll
                  option: ({ isFocused, isSelected }) =>
                  [
                      "px-4 py-2 cursor-pointer",
                      isFocused ? "bg-yellow/10 text-black" : "text-black",
                      isSelected ? "bg-red text-white" : "text-black"
                  ].join(" "),
              }}

            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <GeneralButton label="Register" type="link" className="w-full bg-red border-2 border-red h-12 text-white rounded-lg font-semibold"/>
          <Link to="/login" className="underline text-red hover:text-red-600">
            Login here
          </Link>
          <Link to="/registerdojang" className="underline text-red hover:text-red-600">
            register your dojang
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;