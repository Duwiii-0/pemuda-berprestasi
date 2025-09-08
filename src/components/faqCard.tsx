import { useState } from "react";
import { CirclePlus, CircleMinus } from "lucide-react";

type FaqCardProps = {
  question: string;
  answer: string;
};

const FaqCard = ({ question, answer }: FaqCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border-b-2 border-yellow px-8 py-5 cursor-pointer group">
      {/* Header */}
      <div
        className="flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-bebas text-red text-2xl sm:text-3xl md:text-4xl lg:text-4xl leading-none group-hover:scale-103 transition-discrete duration-300 pr-4">
          {question}
        </div>
        <div
          className={`transition-transform duration-300 ease-in-out ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          {isOpen ? (
            <CircleMinus size={28} className="text-black" />
          ) : (
            <CirclePlus size={28} className="text-black" />
          )}
        </div>
      </div>


      {/* Body (animasi expand/collapse) */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-40 mt-4" : "max-h-0"
        }`}
      >
        <div className="text-black font-plex text-sm md:text-lg">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default FaqCard;
