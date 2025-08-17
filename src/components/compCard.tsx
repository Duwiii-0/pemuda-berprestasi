import GeneralButton from "./generalButton";
import { useNavigate } from "react-router-dom";

const CompCard = () => { 
  const navigate = useNavigate();

  return (
    <div className="bg-white border-2 border-yellow shadow-2xl rounded-lg hover:-translate-y-2 hover:scale-101 transition-all duration-300 ease-in-out 
                    flex flex-col md:flex-row items-center gap-2 md:gap-12 px-6 md:px-12 py-6 md:py-8 md:pb-10 w-[65vw]">
      
      {/* Image */}
      <img 
        src="src/assets/logo/sriwijaya.png" 
        alt="tes tes" 
        className="h-48 w-48 lg:w-48 lg:h-48 xl:w-56 xl:h-56 shrink-0 object-contain  " 
      />
      
      {/* Content */}
      <div className="flex flex-col h-auto md:h-56 justify-between w-full">
        
        {/* Title + Description */}
        <div className="flex flex-col gap-2 2xl:pr-30">
          <div className="font-bebas 2xl:text-5xl xl:text-4xl lg:text-2xl text-2xl text-red text-center md:text-left leading-none">
            Sriwijawa International Taekwondo Championship 2025
          </div>
          <div className="hidden md:block font-inter text-sm xl:text-xl text-black">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </div>
        </div>

        {/* Button */}
        <div className="w-full flex justify-center md:justify-end mt-4 md:mt-0">
          <GeneralButton onClick={() => navigate("/lomba/home")} label="Join the Competition" type="action" className="h-10 xl:h-12 bg-red text-white rounded-lg text-sm md:text-base px-4 md:px-6 py-2"/>
        </div>
      </div> 
    </div>
  );
}

export default CompCard;
