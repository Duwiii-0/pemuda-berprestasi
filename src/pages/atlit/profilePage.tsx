// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useState } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Map, VenusAndMars, Scale } from "lucide-react";
import TextInput from "../../components/textInput";
import FileInput from "../../components/fileInput";
import GeneralButton from "../../components/generalButton";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import type { DummyAtlit } from "../../dummy/dummyAtlit";
import Select from "react-select";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const atlit = dummyAtlits.find((a) => a.id === Number(id)) || null;

  const [formData, setFormData] = useState<DummyAtlit | null>(atlit);
  const [isEditing, setIsEditing] = useState(false);

  const genderOptions = [
  { value: "Laki-Laki", label: "Laki-Laki" },
  { value: "Perempuan", label: "Perempuan" },
];

  if (!formData) {
    return <div className="p-6 text-red-600">Data Atlit tidak ditemukan</div>;
  }

  return (
    <div className="min-h-screen w-full">
      <div className="overflow-y-scroll bg-white border-red 
          w-full h-full rounded-2xl shadow-xl 
          flex flex-col gap-6 pt-20 pb-12 px-10">

        <h1 className="hidden md:block font-bebas text-4xl md:text-5xl mb-6 text-black400 pl-4">
          {`Profil ${atlit?.name}` }
        </h1>

        <div className="flex flex-col gap-4">
          {/* Nama */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            value={formData.name}
            placeholder="Nama"
            icon={<User className="text-red" size={20} />}
          />

          {/* No HP */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            value={formData.phone}
            placeholder="No HP"
            icon={<Phone className="text-red" size={20} />}
          />

          {/* Alamat */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            disabled={!isEditing}
            value={formData.alamat}
            placeholder="Alamat"
            icon={<MapPinned className="text-red" size={20} />}
          />

          {/* Provinsi */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
            disabled={!isEditing}
            value={formData.provinsi}
            placeholder="Provinsi"
            icon={<Map className="text-red" size={20} />}
          />

          {/* Gender */}
          <Select
                            unstyled
                            isDisabled={!isEditing}
                            value={genderOptions.find(opt => opt.value === formData.gender) || null}
                            onChange={(selected) =>
                                setFormData({ ...formData, gender: selected?.value as "Laki-Laki" | "Perempuan" })
                            }
                            options={genderOptions}
                            classNames={{
                                control: () =>
                                "border-2 border-red rounded-lg h-12 px-2 text-inter",
                                valueContainer: () => "px-2",
                                placeholder: () => "text-red/50 text-inter",
                                menu: () => "border-2 border-red bg-white rounded-lg shadow-lg mt-1",
                                menuList: () => "max-h-40 overflow-y-scroll",
                                option: ({ isFocused, isSelected }) =>
                                [
                                    "px-4 py-2 cursor-pointer",
                                    isFocused ? "bg-yellow/10 text-black" : "text-black",
                                    isSelected ? "bg-red text-white" : "text-black"
                                ].join(" "),
                            }}
                            />

          {/* Umur */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, umur: Number(e.target.value) })}
            disabled={!isEditing}
            value={formData.umur.toString()}
            placeholder="Umur"
            icon={<CalendarFold className="text-red" size={20} />}
          />

          {/* Berat Badan */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, bb: Number(e.target.value) })}
            disabled={!isEditing}
            value={formData.bb.toString()}
            placeholder="Berat Badan"
            icon={<Scale className="text-red" size={20} />}
          />

          {/* NIK */}
          <TextInput
            className="h-12 border-red"
            onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            disabled={!isEditing}
            value={formData.nik}
            placeholder="NIK"
            icon={<IdCard className="text-red" size={20} />}
          />

          {/* Upload File */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 justify-start font-inter">
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

          {/* Tombol Edit / Simpan */}
          <div className="flex gap-4 mt-6">
            {isEditing ? (
              <GeneralButton
                label="Simpan"
                type="action"
                onClick={() => setIsEditing(false)}
                className="bg-green-600 hover:bg-green-700"
              />
            ) : (
              <GeneralButton
                label="Edit"
                type="action"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
