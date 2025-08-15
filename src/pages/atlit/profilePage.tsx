import Navbardashboard from "../../components/navbar/navbarDashboard";
import TextInput from "../../components/textInput";
import { Mail, Phone, User, CalendarFold, IdCard, MapPinned, Map, VenusAndMars, Scale, Menu, X } from 'lucide-react';
import { useState, useEffect } from "react";
import FileInput from "../../components/fileInput";
import GeneralButton from "../../components/generalButton";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "Budi",
    email: "budi@example.com",
    phone: "0812345678",
    nik: '3172061807060002',
    tglLahir: '17 Juli 2006',
    kota: 'Depok',
    Alamat: 'Puri Depok Mas blok L no.15',
    Provinsi: 'Jawa Barat',
    bb: '52',         
    gender: 'Laki-Laki',
    umur: '53'        
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
    console.log("Data diupdate:", formData);
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
          <div className=" hidden md:block font-bebas text-4xl md:text-6xl pl-4">BIODATA ANGGOTA</div>
          <div className="flex gap-4">
            <div className="flex gap-3">
              {!isEditing ? (
                <GeneralButton
                  label="Ubah Biodata"
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
            <div className=" font-bebas text-4xl text-center">BIODATA ANGGOTA</div>
          </div>
          <div className="w-full mt-2 md:hidden">
            <div className="font-bebas text-center flex gap-2 w-full justify-end">
              {!isEditing ? (
                <GeneralButton
                  label="Ubah Biodata"
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
            <label className="block mb-1">Email</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              value={formData.email}
              placeholder=""
              icon={<Mail className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">NIK</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              disabled={!isEditing}
              value={formData.nik}
              placeholder=""
              icon={<IdCard className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Nama</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              value={formData.name}
              placeholder=""
              icon={<User className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">No.Telp</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              value={formData.phone}
              placeholder=""
              icon={<Phone className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Tanggal Lahir</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, tglLahir: e.target.value })}
              disabled={!isEditing}
              value={formData.tglLahir}
              placeholder=""
              icon={<CalendarFold className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Kota</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
              disabled={!isEditing}
              value={formData.kota}
              placeholder=""
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Alamat</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
              disabled={!isEditing}
              value={formData.Alamat}
              placeholder=""
              icon={<MapPinned className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Provinsi</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, Provinsi: e.target.value })}
              disabled={!isEditing}
              value={formData.Provinsi}
              placeholder=""
              icon={<Map className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Berat Badan</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, bb: e.target.value })}
              disabled={!isEditing}
              value={isEditing ? formData.bb : `${formData.bb} Kg`}
              placeholder=""
              icon={<Scale className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Gender</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              disabled={!isEditing}
              value={formData.gender}
              placeholder=""
              icon={<VenusAndMars className="text-red" size={20} />}
            />
          </div>

          <div>
            <label className="block mb-1">Umur</label>
            <TextInput
              className="h-12 placeholder:text-red border-red"
              onChange={(e) => setFormData({ ...formData, umur: e.target.value })}
              disabled={!isEditing}
              value={isEditing ? formData.umur : `${formData.umur} Tahun`}
              icon={<CalendarFold className="text-red" size={20} />}
            />
          </div>
        </div>

        <div className="font-bebas text-6xl pl-4 pt-10">Berkas anggota</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:pr-35 gap-x-12 gap-y-6 justify-start font-inter">
          <div>
            <label className="block mb-1">Akte Kelahiran</label>
            <FileInput accept="image/*" disabled={!isEditing} />
          </div>
          <div>
            <label className="block mb-1">Pas Foto 3x4</label>
            <FileInput accept="image/*" disabled={!isEditing} />
          </div>
          <div>
            <label className="block mb-1">Sertifikasi Belt</label>
            <FileInput accept="image/*" disabled={!isEditing} />
          </div>
          <div>
            <label className="block mb-1">{`KTP (Wajib untuk 17+)`}</label>
            <FileInput accept="image/*" disabled={!isEditing} />
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

export default Profile;
