import GeneralButton from "./generalButton";
import { Link } from "react-router-dom";

const Hero = () => {

     return (
        <div className="h-[60vh] sm:h-screen w-full flex items-center md:items-end justify-center bg-cover bg-center 2xl:bg-top z-50"
              style={{backgroundImage: "url('src/assets/photos/hero.png')",
               }}>
            <div className="w-full h-[40vh]  md:h-[80vh] flex flex-col justify-center md:justify-end md:pr-[30vw] xl:pr-[50vw] gap-8 md:pb-40 md:pl-10 lg:pl-20 xl:pl-40">
                <div className="flex flex-col justify-center items-center px-4 md:px-0 pt-10 md:pt-0">
                    <div className="text-5xl md:text-8xl xl:text-judul font-bebas text-yellow leading-none text-center md:text-left">Welcome to the arena</div>
                    <div className="hidden sm:block md:text-lg xl:text-xl font-plex font-semibold text-white text-center md:text-left">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    </div>
                </div>
                <div className="md:pl-6 flex justify-center items-center md:justify-start md:items-start">
                    <GeneralButton label="See Our Competitions" type="hero" to="/event" className="active:scale-97 h-12 md:text-lg xl:text-xl border-2 border-white text-white"/>
                </div>
            </div>
        </div>
    )
}

export default Hero;