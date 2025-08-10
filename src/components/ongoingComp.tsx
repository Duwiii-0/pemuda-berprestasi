import CompCard from "./compCard";
import { ChevronLeft,ChevronRight } from "lucide-react";

const OngoingComp = () => {

     return (
        <div className="relative bg-white pt-20 md:pt-0 md:h-[50vh] xl:h-[70vh] 2xl:h-[80vh] w-full flex flex-col justify-start items-center md:items-start gap-10 lg:gap-16 xl:gap-20">
            <div className="absolute top-5 md:hidden h-[2px] w-[80vw] bg-black/10"></div>
            <div className="flex flex-col lg:gap-4 md:pl-8 lg:pl-8 xl:pl-40 md:pt-8 lg:pt-12">
                <div className="text-center md:text-left text-4xl md:text-6xl xl:text-8xl 2xl:text-judul font-bebas text-red leading-none">Welcome to the arena</div>
                <div className="text-center md:text-left text-xl md:text-2xl xl:text-2xl 2xl:text-h2 leading-none font-bebas tracking-wide text-black">
                    Be Part of the Ultimate Taekwondo Challenge
                </div>
            </div>
                <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10">
                  {/* Left Arrow — hide on mobile if needed */}
                  <div className="hidden md:block">
                    <ChevronLeft size={60} className="text-red hover:text-yellow transition-colors duration-200"/>
                  </div>

                  {/* Card — full width on mobile */}
                  <div className="w-auto md:w-auto">
                    <CompCard />
                  </div>

                  {/* Right Arrow — hide on mobile if needed */}
                  <div className="hidden md:block">
                    <ChevronRight size={60} className="text-red hover:text-yellow transition-colors duration-200"/>
                  </div>
                </div>
        </div>
    )
}

export default OngoingComp;