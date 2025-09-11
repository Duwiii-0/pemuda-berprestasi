import GeneralButton from "./generalButton";
import sriwijaya from "../assets/logo/sriwijaya.png";

const CompCard = () => { 
  return (
    <div className="bg-white border-2 border-yellow shadow-2xl rounded-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 ease-in-out 
                    flex flex-col md:flex-row items-center gap-4 md:gap-6 lg:gap-8 xl:gap-12 
                    px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-8 
                    w-full max-w-5xl mx-auto">      
      {/* Image Container */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <img 
          src={sriwijaya} 
          alt="Sriwijaya Championship Logo" 
          className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 xl:h-48 xl:w-48 2xl:h-56 2xl:w-56 
                     object-contain transition-transform duration-300 hover:scale-105" 
        />
      </div>      

      {/* Content Container */}
      <div className="flex-1 flex flex-col justify-between gap-4 md:gap-6 w-full min-h-0">        
        {/* Title + Description Container */}
        <div className="flex flex-col gap-2 md:gap-3 text-center md:text-left">
          <h3 className="font-bebas text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 
                         text-red leading-none md:leading-tight">
            Sriwijaya International Taekwondo Championship 2025
          </h3>
          <p className="font-plex text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl 
                        text-black/80 leading-relaxed 
                        hidden sm:block md:line-clamp-3 lg:line-clamp-none">
            Kompetisi taekwondo internasional bergengsi yang menggabungkan tradisi dan inovasi, menghadirkan standar kompetisi kelas dunia untuk para atlet berprestasi.
          </p>
        </div>        

        {/* Button Container */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start lg:justify-end">
          <GeneralButton 
            to="/event/home" 
            label="Join the Competition" 
            type="link" 
            className="active:scale-95 hover:shadow-lg hover:bg-yellow hover:text-black 
                       shadow-red/30 transition-all duration-300 font-semibold 
                       h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14
                       bg-red text-white rounded-2xl 
                       text-xs sm:text-sm md:text-base lg:text-base xl:text-lg
                       px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10
                       py-2 sm:py-2.5 md:py-3 lg:py-3 xl:py-4
                       whitespace-nowrap"
          />
          
          {/* Download Proposal Button - Using direct anchor tag since GeneralButton doesn't support external links */}
          <a 
            href="https://drive.google.com/file/d/1vA7Rc6scIsrEHVjajt3WIagbhx_9i_po/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="active:scale-95 hover:shadow-lg hover:bg-red hover:text-white 
                       shadow-yellow/30 transition-all duration-300 font-semibold 
                       h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14
                       bg-yellow text-black rounded-2xl 
                       text-xs sm:text-sm md:text-base lg:text-base xl:text-lg
                       px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10
                       py-2 sm:py-2.5 md:py-3 lg:py-3 xl:py-4
                       whitespace-nowrap
                       flex items-center justify-center
                       no-underline"
          >
            Download Proposal
          </a>
        </div>      
      </div> 
    </div>
  );
}

export default CompCard;