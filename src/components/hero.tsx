import GeneralButton from "./generalButton";

const Hero = () => {

     return (
        <div className="h-screen w-full bg-red flex items-center justify-center">
            <div className="w-full h-[80vh] flex flex-col justify-end pr-[50vw] gap-8 pb-40 pl-40">
                <div className="flex flex-col">
                    <div className="text-judul font-bebas text-white leading-none">Welcome to the arena</div>
                    <div className="text-xl font-inter text-white">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    </div>
                </div>
                <div className="pl-6">
                    <GeneralButton className="text-xl border-2 border-white text-white"> See Our Competitions</GeneralButton>
                </div>
            </div>
        </div>
    )
}

export default Hero;