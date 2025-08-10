import Navbardashboard from "../../components/navbarDashboard";

const Dojang = () => {

     return (
        <div className="min-h-screen w-full">
            <Navbardashboard/>
            <div className="overflow-y-scroll lg:absolute lg:right-3 lg:my-6 lg:border-2 bg-white border-red md:w-full lg:w-[70vw] xl:w-[77vw] 2xl:w-[78vw] md:h-full lg:h-[95vh] lg:rounded-2xl shadow-2xl flex flex-col gap-6 pt-20 pb-12 px-20">
                <div className="font-bebas text-6xl py-20 pl-4">
                  dojang
                </div>
            </div>
        </div>
    )
}

export default Dojang;