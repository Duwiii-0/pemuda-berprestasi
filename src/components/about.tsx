const About = () => {

      return (
        <div className=" h-[50vh] lg:h-[60vh] xl:h-[90vh] 2xl:h-[90vh] w-full flex md:items-center lg:items-center justify-center z-0">
            <div className="flex w-full flex-col pl-10 pr-10 md:pl-8 lg:pl-8 xl:pl-40 gap-6 lg:gap-10 justify-center md:justify-start items-center lg:pb-20 lg:pr-20">
                <div className="text-4xl md:text-5xl lg:text-6xl xl:text-8xl 2xl:text-judul font-bebas text-red leading-none text-center md:text-left">Embrace the Spirit of Competition</div>
                <div className="md:text-md lg:text-lg xl:text-2xl 2xl:text-h3 font-plex text-black text-center md:text-left">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt 
                </div>
            </div>
            <div className=" h-full lg:w-[60vw] 2xl:w-[55vw] flex items-center xl:items-center z-0">
                <img src="src/assets/photos/belt.jpg" alt="belt" className="hidden md:block object-contain"/>
            </div>
        </div>
    )
}

export default About;