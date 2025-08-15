import Navbardashboard from "../../components/navbar/navbarDashboard";
import TextInput from "../../components/textInput";
import { Phone, Mail, MapPin, Map, Building, Flag, Menu } from 'lucide-react';
import { useState, useEffect } from "react";
import GeneralButton from "../../components/generalButton";

const Dojang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    namaDojang: "Dojang Pemuda Berprestasi Depok",
    nomorTelepon: "021-87654321",
    emailDojang: "depok@pemudaberprestasi.id",
    negara: "Indonesia",
    provinsi: "Jawa Barat",
    kecamatan: "Pancoran Mas",
    kabupatenKota: "Kota Depok",
    kelurahan: "Depok",
    alamat: "Jl. Margonda Raya No. 123, Komplek Pemuda Center"
  });

  // Optional: kalau ukuran layar diperbesar ke desktop, otomatis close mobile sidebar
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUpdate = () => {
    console.log("Data dojang diupdate:", formData);
    setIsEditing(false);
    // TODO: kirim ke API / simpan ke backend
  };

  return (
    <div className="min-h-screen w-full">
      {/* Desktop Navbar (visible di lg ke atas) */}
      <div className="hidden lg:block">
        <Navbardashboard />
      </div>

      {/* Konten utama */}
      <div className="overflow-y-scroll lg:absolute lg:right-3 lg:my-6 lg:border-2 bg-white border-red md:w-full lg:w-[70vw] xl:w-[77vw] 2xl:w-[78vw] md:h-full lg:h-[95vh] lg:rounded-2xl shadow-2xl flex flex-col gap-6 pt-20 pb-12 px-20">
        <div className="flex flex-col md:flex-row justify-between items-end w-full xl:pr-45">
          <div className="hidden md:block font-bebas text-4xl md:text-6xl pl-4">DATA DOJANG</div>
          <div className="flex gap-4">
            <div className="flex gap-3">
              {!isEditing ? (
                <GeneralButton
                  label="Ubah Data Dojang"
                  type='action'
                  className="hidden md:block h-12 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <>
                  <GeneralButton
                    label="Cancel"
                    type='action'
                    className="hidden md:block h-12 text-white border-2 border-gray-500 bg-gray-500 hover:bg-gray-600"
                    onClick={handleCancel}
                  />
                  <GeneralButton
                    label="Update"
                    type='action'
                    className="hidden md:block h-12 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                    onClick={handleUpdate}
                  />
                </>
              )}
            </div>

            {/* Burger icon untuk mobile */}
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-200"
                aria-label="Open menu"
              >
                <Menu size={28} />
              </button>
            </div>
          </div>
          <div className="w-full mt-2 md:hidden">
            <div className="font-bebas text-4xl text-center">DATA DOJANG</div>
          </div>
          <div className="w-full mt-2 md:hidden">
            <div className="font-bebas text-center flex gap-2 w-full justify-end">
              {!isEditing ? (
                <GeneralButton
                  label="Ubah Data Dojang"
                  type='action'
                  className="h-12 w-40 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <>
                  <GeneralButton
                    label="Cancel"
                    type='action'
                    className="h-12 text-white border-2 border-gray-500 bg-gray-500 hover:bg-gray-600"
                    onClick={handleCancel}
                  />
                  <GeneralButton
                    label="Update"
                    type='action'
                    className="h-12 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                    onClick={handleUpdate}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:pr-35 gap-x-10 gap-y-4 justify-start font-inter">
          <div>
            <label className="block mb-1">Nama Dojang</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, namaDojang: e.target.value })}
              disabled={!isEditing}
              value={formData.namaDojang}
              placeholder=""
              icon={<Building className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Nomor Telepon</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
              disabled={!isEditing}
              value={formData.nomorTelepon}
              placeholder=""
              icon={<Phone className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Email Dojang</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, emailDojang: e.target.value })}
              disabled={!isEditing}
              value={formData.emailDojang}
              placeholder=""
              icon={<Mail className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Negara</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, negara: e.target.value })}
              disabled={!isEditing}
              value={formData.negara}
              placeholder=""
              icon={<Flag className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Provinsi</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
              disabled={!isEditing}
              value={formData.provinsi}
              placeholder=""
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Kecamatan</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
              disabled={!isEditing}
              value={formData.kecamatan}
              placeholder=""
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Kabupaten/Kota</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
              disabled={!isEditing}
              value={formData.kabupatenKota}
              placeholder=""
              icon={<Building className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Kelurahan</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
              disabled={!isEditing}
              value={formData.kelurahan}
              placeholder=""
              icon={<MapPin className="text-red" size={20} />}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block mb-1">Alamat</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              disabled={!isEditing}
              value={formData.alamat}
              placeholder=""
              icon={<MapPin className="text-red" size={20} />}
            />
          </div>
        </div>
      </div>

      {/* MOBILE: overlay + Navbardashboard (mobile variant) */}
      {sidebarOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          {/* Navbardashboard mobile (props: mobile + onClose) */}
          <div className="lg:hidden z-50">
            <Navbardashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dojang;