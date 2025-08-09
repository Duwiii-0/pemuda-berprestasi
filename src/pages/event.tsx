import CompCard from "../components/compCard";

const Event = () => {

     return (
        <div className="min-h-screen w-full py-40">
            <div className="flex flex-col justify-center items-center gap-16">
                <div className="text-judul font-bebas text-red leading-none">our competitions</div>
                <div className="flex flex-col gap-8">
                    <CompCard/>
                    <CompCard/>
                    <CompCard/>
                    <CompCard/>
                </div>
            </div>
        </div>
    )
}

export default Event;