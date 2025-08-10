import Navbardashboard from "../../components/navbarDashboard";
import TextInput from "../../components/textInput";
import {Mail, Phone, User, CalendarFold, IdCard, MapPinned, Map, VenusAndMars, Scale } from 'lucide-react';
import { useState } from "react";

const Profile = () => {

    const [formData, setFormData] = useState({
        name: "Budi",
        email: "budi@example.com",
        phone: "0812345678",
        nik: '3172061807060002',
        tglLahir: '17 Juli 2006',
        kota: 'Depok',
        Alamat: 'Puri Depok Mas blok L no.15',
        Provinsi: 'Jawa Barat',
        bb: '52',
        gender: 'Laki-Laki',
        umur: '53'

    });
     return (
        <div className="min-h-screen w-full">
            <Navbardashboard/>
            <div className="absolute right-3 my-6 border-2 bg-white border-red w-[78vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col gap-6 pt-20 pb-12 px-20">
                <div className="font-bebas text-6xl pl-4">
                  BIODATA ANGGOTA
                </div>
                <div className="grid grid-cols-2 pr-35 gap-x-10 gap-y-4 justify-start font-inter">
                  <div>
                    <label className="block  mb-1">Email</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.email}
                      placeholder=""
                      icon={<Mail className="text-red" size={20} />}
                    />
                  </div>
                 <div>
                    <label className="block  mb-1">NIK</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.nik}
                      placeholder="No Hp"
                      icon={<IdCard className="text-red" size={20} />}
                    />
                  </div>
                  <div>
                    <label className="block  mb-1">Nama</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.name}
                      placeholder="No Hp"
                      icon={<User className="text-red" size={20} />}
                    />
                  </div>
                  <div>
                    <label className="block  mb-1">No.Telp</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.phone}
                      placeholder="No Hp"
                      icon={<Phone className="text-red" size={20} />}
                    />
                  </div>
                  <div>
                    <label className="block  mb-1">Tanggal Lahir</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.tglLahir}
                      placeholder="No Hp"
                      icon={<CalendarFold className="text-red" size={20} />}
                    />
                  </div> 
                  <div>
                    <label className="block  mb-1">Kota</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.kota}
                      placeholder="No Hp"
                      icon={<Map className="text-red" size={20} />}
                    />
                  </div> 
                  <div>
                    <label className="block  mb-1">Alamat</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.Alamat}
                      placeholder="No Hp"
                      icon={<MapPinned className="text-red" size={20} />}
                    />
                  </div>
                  <div>
                    <label className="block  mb-1">Provinsi</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.Provinsi}
                      placeholder="No Hp"
                      icon={<Map className="text-red" size={20} />}
                    />
                  </div>  
                  <div>
                    <label className="block  mb-1">Berat Badan</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.bb}
                      placeholder="No Hp"
                      icon={<Scale className="text-red" size={20} />}
                    />
                  </div> 
                  <div>
                    <label className="block  mb-1">Gender</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.gender}
                      placeholder="No Hp"
                      icon={<VenusAndMars className="text-red" size={20} />}
                    />
                  </div> 
                  <div>
                    <label className="block  mb-1">Umur</label>
                    <TextInput
                      className="h-12 placeholder:text-red border-red"
                      value={formData.umur}
                      icon={<CalendarFold className="text-red" size={20} />}
                    />
                  </div>                                     
                </div>
            </div>
        </div>
    )
}

export default Profile;