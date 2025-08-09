const About = () => {

      return (
        <div className="bg-white h-[50vh] xl:h-[70vh] 2xl:h-[90vh] w-full flex items-center justify-center">
            <div className="flex w-full flex-col pl-10 pr-10 md:pl-8 lg:pl-8 xl:pl-40 gap-6 lg:gap-10 justify-center md:justify-start items-center lg:pb-20 lg:pr-20">
                <div className="text-4xl md:text-6xl xl:text-8xl 2xl:text-judul font-bebas text-red leading-none text-center md:text-left">Embrace the Spirit of Competition</div>
                <div className="md:text-md xl:text-2xl 2xl:text-h3 font-inter text-black text-center md:text-left">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt 
                </div>
            </div>
            <div className="  h-full lg:w-[60vw] 2xl:w-[55vw] flex items-center">
                <img src="src/assets/photos/belt.jpg" alt="belt" className="hidden md:block"/>
            </div>
        </div>
    )
}

export default About;