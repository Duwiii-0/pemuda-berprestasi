import GeneralButton from "../components/generalButton";
import TextInput from "../components/textInput";
import { Mail, KeyRound } from 'lucide-react';
import { Link } from "react-router-dom";


const Login = () => {

     return (
        <div className="h-screen w-full flex items-center justify-center bg-cover bg-center"
              style={{backgroundImage: "url('src/assets/photos/login.jpg')",
        }}>
            <div className="px-20 bg-white h-screen md:h-[72vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[42vw] rounded-xl flex flex-col justify-center items-center gap-8 border-3 border-yellow py-10 font-inter">
                <img src="src/assets/logo/sriwijaya.png" className="w-44 h-44 bg-black"/>
                <label className="font-bebas text-6xl">login</label>
                <div className="w-full flex flex-col gap-4">
                    <div className="w-full">
                        <label className="pl-2">Email address</label>
                        <TextInput className="h-12 placeholder-red" placeholder="your email address" icon={<Mail className='text-red' size={20}/>}/>
                    </div>
                    <div className="w-full">
                        <label className="pl-2">Password</label>
                        <TextInput className="h-12 placeholder:text-cyan-300" placeholder="your password" icon={<KeyRound className='text-red' size={20}/>}/>
                    </div>
                    <Link to='/' className="flex justify-end hover:text-red underline">Forgot Password?</Link>
                </div>
                <div className="w-full flex flex-col gap-2">
                    <GeneralButton className="w-full bg-red border-2 border-red h-12 text-white round-lg font-semibold">Login</GeneralButton>
                    <div>Doesnt have an account?<Link to='' className="pl-1 underline hover:text-red">Register Here</Link></div>
                </div>
            </div>
        </div>
    )
}

export default Login;