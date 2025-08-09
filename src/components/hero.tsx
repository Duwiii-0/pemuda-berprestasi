import GeneralButton from "./generalButton";

const Hero = () => {

     return (
        <div className="h-[60vh] sm:h-screen w-full bg-red flex items-center justify-center bg-cover bg-center 2xl:bg-top"
              style={{backgroundImage: "url('src/assets/photos/hero.png')",
               }}>
            <div className="w-full h-[40vh]  md:h-[80vh] flex flex-col justify-center md:justify-end md:pr-[30vw] xl:pr-[50vw] gap-8 md:pb-40 md:pl-10 lg:pl-20 xl:pl-40">
                <div className="flex flex-col justify-center items-center px-4 md:px-0">
                    <div className="text-5xl md:text-8xl xl:text-judul font-bebas text-white leading-none text-center md:text-left">Welcome to the arena</div>
                    <div className="md:text-lg xl:text-xl font-inter font-semibold text-white text-center md:text-left">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    </div>
                </div>
                <div className="pl-6 flex justify-center items-center md:justify-start md:items-start">
                    <GeneralButton className="h-12 md:text-lg xl:text-xl border-2 border-white text-white"> See Our Competitions</GeneralButton>
                </div>
            </div>
        </div>
    )
}

export default Hero;