import { useState } from "react";
import Select from "react-select";
import GeneralButton from "../../components/generalButton";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import Modal from "../modal";
import TextInput from "../textInput";
import toast from "react-hot-toast";
import { LockedSelect } from "../lockSelect";
import { ArrowLeft } from 'lucide-react';

type DaftarProps = {
  isOpen: boolean;
  onBack: () => void;
  styleType: "kyorugi" | "poomsae" | null;
  categoryType: "prestasi" | "pemula" | null;
};

const Daftar = ({ isOpen, onBack, styleType, categoryType }: DaftarProps) => {
  type OptionType = { value: string; label: string };

  const [selectedDojang, setSelectedDojang] = useState<OptionType | null>(null);
  const [selectedAtlit, setSelectedAtlit] = useState<OptionType | null>(null);
  const [selectedGender, setSelectedGender] = useState<OptionType | null>(null);
  const [selectedBerat, setSelectedBerat] = useState<OptionType | null>(null);

  const atlitOptions: OptionType[] = dummyAtlits.map((a) => ({
    value: a.name,
    label: a.name,
  }));

  const selectedAtlitData = dummyAtlits.find(
    (a) => a.name === selectedAtlit?.value
  );

  const genderOptions: OptionType[] = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];

  const ageOptions: OptionType[] =
    styleType === "poomsae"
      ? [
          { value: "Cadet", label: "Cadet" },
          { value: "Junior", label: "Junior" },
          { value: "Senior", label: "Senior" },
          { value: "Master", label: "Master" },
        ]
      : [
          { value: "Cadet", label: "Cadet" },
          { value: "Junior", label: "Junior" },
          { value: "Senior", label: "Senior" },
        ];

  // contoh kelas berat statis (nanti bisa kamu pecah per gender/umur)
  const weightOptions: OptionType[] = [
    { value: "-54", label: "Under 54 kg" },
    { value: "-58", label: "Under 58 kg" },
    { value: "-63", label: "Under 63 kg" },
    { value: "-68", label: "Under 68 kg" },
    { value: "-74", label: "Under 74 kg" },
    { value: "-80", label: "Under 80 kg" },
    { value: "-87", label: "Under 87 kg" },
    { value: "+87", label: "Over 87 kg" },
  ];

  const selectClassNames = {
    control: () => "border-2 border-red rounded-lg h-12 px-2 text-inter",
    valueContainer: () => "px-2",
    placeholder: () => "text-red/50 text-inter",
    menu: () =>
      "border-2 border-red bg-white rounded-lg shadow-lg mt-1 z-50",
    menuList: () => "max-h-40 overflow-y-scroll",
    option: ({ isFocused, isSelected }: any) =>
      [
        "px-4 py-2 cursor-pointer",
        isFocused ? "bg-yellow/10 text-black" : "text-black",
        isSelected ? "bg-red text-white" : "text-black",
      ].join(" "),
  };

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-start items-center gap-8 py-10 overflow-y-scroll font-inter">
        <div className="w-full flex px-10">
        <button
          onClick={onBack}
          className="cursor-pointer font-inter flex items-center gap-2 text-black/30 hover:text-black/60 transition-colors duration-300"
        >
          <ArrowLeft size={30} />
          <span className="text-xl">Back</span>
        </button>
        </div>
        <div className="w-full px-25">
        <div className="flex flex-col gap-2 justify-center items-center">
          <label className="font-bebas text-6xl text-red">Registrasi Atlit</label>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Kelas Umur */}
          {categoryType !== "pemula" && (
            <div>
              <label className="pl-2">Kelas Umur</label>
              <LockedSelect
                unstyled
                options={ageOptions}
                value={selectedDojang}
                onChange={setSelectedDojang}
                placeholder="Pilih kelas umur..."
                isSearchable
                classNames={selectClassNames}
                disabled={false}
                message=""
              />
            </div>
          )}

          {/* Kelas Berat */}
          {styleType === "kyorugi" && categoryType === "prestasi" && (
            <div>
              <label className="pl-2">Kelas Berat</label>
              <LockedSelect
                unstyled
                options={weightOptions}
                value={selectedBerat}
                onChange={setSelectedBerat}
                placeholder="Pilih kelas berat..."
                isSearchable={false}
                classNames={selectClassNames}
                disabled={!selectedDojang}
                message="Harap pilih kelas umur terlebih dahulu"
              />
            </div>
          )}


          {/*  Gender */}
          <div>
              <label className="pl-2">Jenis Kelamin</label>
              <LockedSelect
                unstyled
                options={genderOptions}
                value={selectedGender}
                onChange={setSelectedGender}
                placeholder="Pilih jenis kelamin..."
                isSearchable={false}
                classNames={selectClassNames}
              disabled={
                categoryType !== "pemula"
                  ? !selectedDojang // jika ada kelas umur wajib dipilih dulu
                  : false
              }
                message="Harap pilih kelas berat terlebih dahulu"
              />
            </div>

          {/* Nama  */}
          <div>
            <label className="pl-2">Nama Atlit</label>
            <LockedSelect
              unstyled
              options={atlitOptions}
              value={selectedAtlit}
              onChange={setSelectedAtlit}
              placeholder="Pilih nama atlit..."
              isSearchable
              classNames={selectClassNames}
              disabled={!selectedGender}
              message="Harap pilih gender terlebih dahulu"
            />
          </div>

          {/* bb */}
          <div>
            <label className="pl-2">Berat Badan (kg)</label>
            <TextInput
              value={selectedAtlitData?.bb.toString() || ""}
              placeholder="Berat badan"
              className="h-12 w-full"
              onChange={() => toast.error("Berat badan tidak bisa diedit, silahkan edit di dalam data atlit")}
              onClick={() => toast.error("Berat badan tidak bisa diedit, silahkan edit di dalam data atlit")}
            />
          </div>

          {/* tb */}
          <div>
            <label className="pl-2">Tinggi Badan (cm)</label>
            <TextInput
              value={selectedAtlitData?.tb.toString() || ""}
              placeholder="Tinggi badan"
              className="h-12 w-full"
              onChange={() => toast.error("Tinggi badan tidak bisa diedit, silahkan edit di dalam data atlit")}
              onClick={() => toast.error("Tinggi badan tidak bisa diedit, silahkan edit di dalam data atlit")}

            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2 pt-8">
          <GeneralButton
            label="Daftar"
            className="w-full bg-red border-2 border-red h-12 text-white rounded-lg font-semibold"
          />
        </div>
        </div>
      </div>
    </Modal>
  );
};

export default Daftar;
