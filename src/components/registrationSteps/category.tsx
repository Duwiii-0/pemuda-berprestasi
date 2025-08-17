import Modal from "../modal";
import { ArrowLeft } from "lucide-react";

type CategoryProps = {
  isOpen: boolean;
  onBack: () => void;
  onSelect: (category: "prestasi" | "pemula") => void; // <-- kirim kategori
};

const Category = ({ isOpen, onBack, onSelect }: CategoryProps) => {
  return (
    <Modal isOpen={isOpen}>
      <div className="flex flex-col gap-6 pb-20 px-8">
        <button
          onClick={onBack}
          className="cursor-pointer font-inter flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={30} />
          <span className="text-xl">Back</span>
        </button>

        <div className="text-red text-5xl font-bebas text-center pt-10">
          Kategori apa yang kamu pilih
        </div>

        <div className="w-[60vw] h-[30vh] flex justify-between items-center gap-10">
          <div 
            onClick={() => onSelect("prestasi")} 
            className="rounded-xl h-full w-full bg-[#f3f8d7] border-2 border-red text-red font-bebas text-3xl flex flex-col gap-2 justify-center items-center cursor-pointer"
          >
            Prestasi
            <span className="text-black text-xl font-inter">(pilih)</span>
          </div>
          <div 
            onClick={() => onSelect("pemula")} 
            className="rounded-xl h-full w-full bg-[#f3f8d7] border-2 border-red text-red font-bebas text-3xl flex flex-col gap-2 justify-center items-center cursor-pointer"
          >
            Pemula
            <span className="text-black text-xl font-inter">(pilih)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Category;
