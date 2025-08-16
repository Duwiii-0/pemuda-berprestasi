import { ArrowLeft, Mail,KeyRound, IdCard, Phone, CalendarFold, Map, MapPinned, Scale, VenusAndMars,   } from 'lucide-react';
import { useEffect,useState } from "react";
import { User } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import TextInput from '../../components/textInput';
import GeneralButton from '../../components/generalButton'; 
import { useAuth } from "../../context/authContext";
import Select from "react-select";


const Settings = () => {
  const { user } = useAuth(); // Ambil user dari context
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email,
    password: user?.password,
    name: user?.name,
    phone: user?.phone,
    nik: user?.nik,
    tglLahir: user?.tglLahir ,
    kota: user?.kota,
    Alamat: user?.alamat ,
    Provinsi: user?.provinsi,
    gender: user?.gender,
  });

  const genderOptions = [
  { value: "Laki-Laki", label: "Laki-Laki" },
  { value: "Perempuan", label: "Perempuan" },
];

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUpdate = () => {
    console.log("Data dojang diupdate:", formData);
    setIsEditing(false);
    // TODO: kirim ke API / simpan ke backend
  };

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true }); // redirect ke home
    }
  }, [user, navigate]);

  if (!user) return null; // sementara jangan render halaman


  if (!user) return <div>Loading...</div>; // atau redirect ke login

  return (
    <div className="h-screen w-full bg-red flex justify-center items-center">
      <div className="w-[90vw] h-[90vh] bg-white rounded-xl flex flex-col py-4 px-4">
        <Link to='/' className="flex text-black/40 gap-2 items-center w-full pl-6 mb-4">
          <ArrowLeft size={20} />
          <div className='text-lg'>Back to Home</div>
        </Link>

        <div className='w-full h-full flex'>
          {/* Sidebar / Profile */}
          <div className='w-1/3 h-full flex flex-col justify-start items-center gap-6 px-20 py-10'>
            <div className='text-black/40 font-inter text-2xl'>Your Profile</div>
            {/* Foto User */}
            <div className='h-40 w-40 rounded-full overflow-hidden border-2 border-yellow'>
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-yellow/10 flex items-center justify-center text-red font-bold text-xl">
                  <User strokeWidth={1} size={80}/>
                </div>
              )}
            </div>

            {/* Email */}
            <div className='w-full'>
                <label className='font-inter text-md pl-2 text-black/60'>Username</label>
                <TextInput
                  className="h-12 w-full border-red"
                  value={formData.email}
                  disabled
                  placeholder="Email"
                  icon={<Mail className="text-red" size={20} />}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div className='w-full'>
            <label className='font-inter text-md pl-2 text-black/60'>Password</label>
            {/* Password */}
            <TextInput
              className="h-12 w-full border-red"
              value={formData.password?.replace(/./g, '•')} // tampil bullet
              disabled
              placeholder="Password"
              icon={<KeyRound className="text-red" size={20} />}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            </div>
            <div className=' space-y-4 mt-4'>
              <button className='h-12 w-full text-md border-2 hover:bg-red-600 hover:text-white border-red-600 text-red-600 px-4 rounded-md'>Delete Account</button>
              <button className='h-12 w-full text-md border-2 border-red-600 text-red-600 px-4 rounded-md' onClick={() => navigate("/resetpassword")}>
                Change Password
              </button>
            </div>
          </div>

          {/* Konten kanan bisa diisi nanti */}
          <div className='border-l-2 border-black/20 w-full h-[78vh] flex flex-col justify-start items-start gap-6 px-20 py-10'>
              <div className='flex justify-between items-center pl-4 pr-10 w-full'>
                <div className='text-black/40 font-inter text-2xl'>Your Personal Data</div>
                <div className='flex items-center justify-center gap-2'>
                {!isEditing ? (
                  <GeneralButton
                    label="Ubah Profile"
                    type='action'
                    className="hidden md:block h-12 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                    onClick={() => setIsEditing(true)}
                  />
                ) : (
                  <>
                    <GeneralButton
                      label="Cancel"
                      type='action'
                      className="hidden md:block h-12 text-white border-2 border-gray-500 bg-gray-500 hover:bg-gray-600"
                      onClick={handleCancel}
                    />
                    <GeneralButton
                      label="Update"
                      type='action'
                      className="hidden md:block h-12 text-white border-2 border-green-600 bg-green-600 hover:bg-green-700"
                      onClick={handleUpdate}
                    />
                  </>
                )}
                </div>
              </div>
                <div className='grid grid-cols-2 gap-4 w-full'>               
                    <div>
                        <label className="block mb-1">NIK</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        disabled={!isEditing}
                        value={formData.nik}
                        placeholder=""
                        icon={<IdCard className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Nama</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        value={formData.name}
                        placeholder=""
                        icon={<User className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">No.Telp</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        value={formData.phone}
                        placeholder=""
                        icon={<Phone className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Tanggal Lahir</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, tglLahir: e.target.value })}
                        disabled={!isEditing}
                        value={formData.tglLahir}
                        placeholder=""
                        icon={<CalendarFold className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Kota</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        disabled={!isEditing}
                        value={formData.kota}
                        placeholder=""
                        icon={<Map className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Gender</label>
                        <Select
                            unstyled
                            isDisabled={!isEditing}
                            value={genderOptions.find(opt => opt.value === formData.gender) || null}
                            onChange={(selected) =>
                                setFormData({ ...formData, gender: selected?.value as "Laki-Laki" | "Perempuan" })
                            }
                            options={genderOptions}
                            classNames={{
                                control: () =>
                                "border-2 border-red rounded-lg h-12 px-2 text-inter",
                                valueContainer: () => "px-2",
                                placeholder: () => "text-red/50 text-inter",
                                menu: () => "border-2 border-red bg-white rounded-lg shadow-lg mt-1",
                                menuList: () => "max-h-40 overflow-y-scroll",
                                option: ({ isFocused, isSelected }) =>
                                [
                                    "px-4 py-2 cursor-pointer",
                                    isFocused ? "bg-yellow/10 text-black" : "text-black",
                                    isSelected ? "bg-red text-white" : "text-black"
                                ].join(" "),
                            }}
                            />
                    </div>

                    <div>
                        <label className="block mb-1">Provinsi</label>
                        <TextInput
                        className="h-12 w-full placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, Provinsi: e.target.value })}
                        disabled={!isEditing}
                        value={formData.Provinsi}
                        placeholder=""
                        icon={<Map className="text-red" size={20} />}
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Alamat</label>
                        <TextInput
                        className="h-12 placeholder:text-red border-red"
                        onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
                        disabled={!isEditing}
                        value={formData.Alamat}
                        placeholder=""
                        icon={<MapPinned className="text-red" size={20} />}
                        />
                    </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings;
