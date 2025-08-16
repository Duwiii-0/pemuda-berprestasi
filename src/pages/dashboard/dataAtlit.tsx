import { useNavigate } from "react-router-dom";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import NavbarDashboard from "../../components/navbar/navbarDashboard";

const DataAtlit = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <NavbarDashboard />
      </div>

      {/* Konten utama */}
      <div className="overflow-y-scroll lg:absolute lg:right-3 lg:my-6 border-2 border-red bg-white 
        md:w-full lg:w-[70vw] xl:w-[77vw] 2xl:w-[78vw] 
        md:h-full lg:h-[95vh] lg:rounded-2xl shadow-xl flex flex-col gap-6 pt-20 pb-12 px-10">
        
        <div className="flex flex-col justify-start items-start w-full h-full">
          <h1 className="hidden md:block font-bebas text-4xl md:text-5xl mb-6 text-black400 pl-4">
            Data Atlit
          </h1>

          <div className="overflow-hidden rounded-xl border-2 border-yellow w-full">
            <table className="w-full text-sm md:text-base ">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Nama</th>
                  <th className="px-6 py-4 text-center font-semibold">Provinsi</th>
                  <th className="px-6 py-4 text-center font-semibold">Gender</th>
                  <th className="px-6 py-4 text-center font-semibold">Umur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow/30">
                {dummyAtlits.map((atlit) => (
                  <tr
                    key={atlit.id}
                    className="hover:bg-yellow-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/dashboard/atlit/${atlit.id}`)} // 👈 Navigate ke Profile
                  >
                    <td className="px-6 py-4 font-medium text-black text-left">
                      {atlit.name}
                    </td>
                    <td className="px-6 py-4 text-gray-800 text-center">
                      {atlit.provinsi}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          atlit.gender === "Laki-Laki"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red"
                        }`}
                      >
                        {atlit.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 text-center">
                      {atlit.umur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAtlit;
