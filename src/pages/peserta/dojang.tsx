import Navbardashboard from "../../components/navbarDashboard";

const Dojang = () => {

     return (
        <div className="min-h-screen w-full">
            <Navbardashboard/>
            <div className="absolute right-3 my-6 border-2 bg-white border-red w-[78vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col px-20">
                <div className="font-bebas text-6xl py-20 pl-4">
                  dojang
                </div>
            </div>
        </div>
    )
}

export default Dojang;