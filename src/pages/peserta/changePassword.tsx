import React, { useState } from "react";
import Navbardashboard from "../../components/navbarDashboard";
import TextInput from "../../components/textInput";
import GeneralButton from "../../components/generalButton";
import { KeyRound } from "lucide-react";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password lama:", formData.oldPassword);
    console.log("Password baru:", formData.newPassword);
    console.log("Konfirmasi password:", formData.confirmPassword);
    // TODO: tambah validasi & API call
  };

  return (
    <div className="min-h-screen w-full">
      <Navbardashboard />
      <div className="overflow-y-scroll lg:absolute lg:right-3 lg:my-6 lg:border-2 bg-white border-red md:w-full lg:w-[70vw] xl:w-[77vw] 2xl:w-[78vw] md:h-full lg:h-[95vh] lg:rounded-2xl shadow-2xl flex flex-col gap-6 pt-20 pb-12 px-20">
        <div className="font-bebas text-6xl py-10 pl-4">
          Ganti Password
        </div>

        <form className="flex flex-col gap-6 w-full max-w-lg" onSubmit={handleSubmit}>
          {/* Password Lama */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg text-red">
              Password Lama
            </label>
            <TextInput
              className='h-12'
              disabled={false}
              placeholder="Masukkan password lama"
              icon={<KeyRound className="text-red" />}
              value={formData.oldPassword}
              onChange={handleChange}
            />
          </div>

          {/* Password Baru */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg text-red">
              Password Baru
            </label>
            <TextInput
              className='h-12'
              disabled={false}
              placeholder="Masukkan password baru"
              icon={<KeyRound className="text-red" />}
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          {/* Konfirmasi Password Baru */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg text-red">
              Konfirmasi Password Baru
            </label>
            <TextInput
              className='h-12'
              disabled={false}
              placeholder="Masukkan ulang password baru"
              icon={<KeyRound className="text-red" />}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {/* Tombol Simpan */}
          <GeneralButton
            type='action' label='Simpan Perubahan' className="bg-red text-white font-semibold py-2 px-6 rounded-lg hover:bg-red/80 transition"
          />
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
