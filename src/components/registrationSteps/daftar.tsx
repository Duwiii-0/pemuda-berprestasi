import { useState } from "react";
import Select from "react-select";
import GeneralButton from "../../components/generalButton";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import Modal from "../modal";

type DaftarProps = {
  isOpen: boolean;
  onBack: () => void;
  styleType: "kyorugi" | "poomsae" | null;
  categoryType: "prestasi" | "pemula" | null; // <-- prop baru
};

const Daftar = ({ isOpen, onBack, styleType, categoryType }: DaftarProps) => {
  type OptionType = { value: string; label: string };

  const [selectedDojang, setSelectedDojang] = useState<OptionType | null>(null);
  const [selectedAtlit, setSelectedAtlit] = useState<OptionType | null>(null);
  const [selectedGender, setSelectedGender] = useState<OptionType | null>(null);

  const atlitOptions: OptionType[] = dummyAtlits.map((a) => ({
    value: a.name,
    label: a.name,
  }));

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
      <div className="px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[35vw] rounded-xl flex flex-col justify-center items-center gap-8 py-10 overflow-y-scroll font-inter">
        <div className="flex flex-col gap-2 justify-center items-center">
          <label className="font-bebas text-6xl text-red">Registrasi Atlit</label>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Hanya tampilkan jika kategori BUKAN pemula */}
          {categoryType !== "pemula" && (
            <div>
              <label className="pl-2">Kelas Umur</label>
              <Select
                unstyled
                options={ageOptions}
                value={selectedDojang}
                onChange={setSelectedDojang}
                placeholder="Pilih kelas umur..."
                isSearchable
                classNames={selectClassNames}
              />
            </div>
          )}

          {/* Select Nama Atlit */}
          <div>
            <label className="pl-2">Nama Atlit</label>
            <Select
              unstyled
              options={atlitOptions}
              value={selectedAtlit}
              onChange={setSelectedAtlit}
              placeholder="Pilih nama atlit..."
              isSearchable
              classNames={selectClassNames}
            />
          </div>

          {/* Select Gender */}
          <div>
            <label className="pl-2">Jenis Kelamin</label>
            <Select
              unstyled
              options={genderOptions}
              value={selectedGender}
              onChange={setSelectedGender}
              placeholder="Pilih gender..."
              isSearchable={false}
              classNames={selectClassNames}
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <GeneralButton
            label="Daftar"
            type="action"
            className="w-full bg-red border-2 border-red h-12 text-white rounded-lg font-semibold"
          />
        </div>
      </div>
    </Modal>
  );
};

export default Daftar;
