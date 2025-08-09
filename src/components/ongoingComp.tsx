import CompCard from "./compCard";

const OngoingComp = () => {

     return (
        <div className="h-[70vh] w-full flex flex-col justify-center items-start bg-white gap-20">
            <div className="flex-flex-col pl-40">
                <div className="text-judul font-bebas text-red leading-none">Welcome to the arena</div>
                <div className="text-h2 leading-none font-bebas tracking-wide text-black">
                    Be Part of the Ultimate Taekwondo Challenge
                </div>
            </div>
            <div className="w-full flex justify-center items-center">
                <CompCard/>
            </div>
        </div>
    )
}

export default OngoingComp;