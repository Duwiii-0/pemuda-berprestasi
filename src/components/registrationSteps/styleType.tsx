import Modal from "../modal";
import { ArrowLeft } from "lucide-react";

type StyleProps = {
  isOpen: boolean;
  onBack: () => void;
  onSelect: (style: "kyorugi" | "poomsae") => void; // kirim style
};

const Style = ({ isOpen, onBack, onSelect }: StyleProps) => {
  return (
    <Modal isOpen={isOpen}>
      <div className="flex flex-col gap-6 pb-20 px-8">
        <button
          onClick={onBack}
          className="cursor-pointer font-inter flex items-center gap-2 text-white hover:text-white/70"
        >
          <ArrowLeft size={30} />
          <span className="text-xl">Back</span>
        </button>

        <div className="text-yellow text-5xl font-bebas text-center pt-10">
          Style Apa yang kamu inginkan
        </div>

        <div className="w-[60vw] h-[30vh] flex justify-between items-center gap-2">
          <button
            onClick={() => onSelect("kyorugi")}
            className="mx-10 rounded-xl h-full w-full bg-[#f3f8d7] border-2 border-red text-red font-bebas text-7xl flex flex-col gap-2 justify-center items-center scale-90 opacity-50 hover:opacity-100 hover:scale-100 transition-all duration-300"
          >
            Kyorugi
            <span className="text-black text-xl font-inter">(Tarung)</span>
          </button>
          <button
            onClick={() => onSelect("poomsae")}
            className="mx-10 rounded-xl h-full w-full bg-[#f3f8d7] border-2 border-red text-red font-bebas text-7xl flex flex-col gap-2 justify-center items-center scale-90 opacity-50 hover:opacity-100 hover:scale-100 transition-all duration-300"
          >
            Pomsae
            <span className="text-black text-xl font-inter">(Seni)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Style;
