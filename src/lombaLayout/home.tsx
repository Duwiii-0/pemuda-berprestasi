import GeneralButton from "../components/generalButton";
import Steps from "../components/howTo";
import TextInput from "../components/textInput";
import TextArea from "../components/textArea";  
import { Mail, User, PenLine, MapPin, Phone, } from 'lucide-react';

const LandingPage = () => {

    const registerStep = [
      {
        number: 1,
        title: "Buat Akun",
        desc:
          "Daftar di website resmi kejuaraan dengan mengisi informasi pribadi dan data tim secara lengkap."
      },
      {
        number: 2,
        title: "Login dan Pilih Kategori",
        desc:
          "Masuk menggunakan akun yang sudah terdaftar lalu pilih kategori lomba sesuai kelompok usia dan kemampuan."
      },
      {
        number: 3,
        title: "Unggah Dokumen",
        desc:
          "Upload dokumen yang dibutuhkan seperti kartu identitas, foto, dan bukti pembayaran."
      },
      {
        number: 4,
        title: "Konfirmasi & Selesai",
        desc:
          "Periksa kembali data yang telah diisi, lalu konfirmasi pendaftaran untuk mendapatkan nomor peserta."
      }
    ];
    return(
        <div className="min-h-screen w-full">
            {/*hero*/}
              <div className="h-[60vh] sm:h-screen w-full bg-red flex items-center justify-center bg-cover bg-center 2xl:bg-top"
                    style={{backgroundImage: "url('src/assets/photos/hero.png')",
                     }}>
                  <div className=" w-[80vw] h-[40vh] md:h-[80vh] flex flex-col justify-center items-center gap-8">
                      <img src="src/assets/logo/sriwijaya.png" alt="sriwijaya logo" className=" bg-green-200 h-70 w-70"/>
                      <div className="flex flex-col justify-center items-center gap-5">
                          <div className="text-5xl md:text-8xl xl:text-5xl font-bebas text-yellow leading-none text-center md:text-left">Sriwijawa international taekwondo championship 2025</div>
                          <div className="text-lg font-inter font-semibold text-white text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                          </div>
                      </div>
                      <div className="flex justify-center items-center md:justify-start md:items-start">
                          <GeneralButton label="Join the Competitions" type="action" to="" className="h-12 md:text-lg xl:text-xl border-2 border-white text-white"/>
                      </div>
                  </div>
              </div>

            {/* About */}
              <div className="h-[50vh] xl:h-[70vh] 2xl:h-[90vh] w-full flex items-center justify-center">
                <div className="w-full h-full flex flex-col gap-10 pl-30 justify-center">
                    <div className="text-8xl font-bebas text-red leading-none text-left">Tentang Kejuaraan</div>
                    <div className="text-xl font-inter text-black text-left pr-50">Sriwijaya Competition 2025, di bawah naungan Pengurus Besar Taekwondo Indonesia (PBTI), merupakan edisi ke-7 sejak 2015 yang menghadirkan kategori Kyorugi, Poomsae, dan Freestyle Poomsae untuk berbagai kelompok usia. Kejuaraan ini digelar untuk mengasah prestasi, menjunjung sportivitas, serta menjaring atlet potensial menuju tingkat internasional.
                    </div>
                </div>
                <div className="w-1/2 h-full ">
                    <div className="w-2/3 h-full flex flex-col justify-center">
                      <div className="flex flex-col w-66 gap-4">
                        <img src="src/assets/logo/taekwondo.png" alt="foto bapak" className="rounded-lg border-2 border-yellow shadow-xl w-66 h-88 bg-blue-100"/>
                        <div className="text-center">
                            <div className="font-bebas text-3xl text-red">
                              Muhammad Rafif Dwiarka
                            </div>
                            <div className="font-inter text-sm text-black">
                              Direktur sriwijaya championship
                            </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

            {/* how to enter */}
            <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center gap-4">
                <div className="text-7xl font-bebas text-red leading-none text-left"> Tata cara mendaftar</div>
                <div className="text-xl font-inter text-black max-w-7xl text-center">Tata Cara Pendaftaran Peserta Kejuaraan Taekwondo Sriwijaya Competition Tahun 2025, Meliputi Pengisian Formulir, Pengiriman Dokumen, dan Proses Verifikasi</div>
                <div className="h-full w-1/2 flex flex-col gap-8 py-20">
                  {registerStep.map((step) => (
                    <Steps
                      key={step.number}
                      number={step.number}
                      title={step.title}
                      desc={step.desc}
                    />
                  ))}
                </div>
            </div>

            {/* contact us */}
            <div className="min-h-screen w-full flex flex-col justify-center items-center gap-4 pt-20">
                <div className="text-7xl font-bebas text-red leading-none text-left"> Punya pertanyaan?</div>
                <div className="text-xl font-inter text-black max-w-7xl text-center">Jangan ragu untuk menghubungi kami melalui formulir atau kontak yang tersedia untuk mendapatkan informasi lebih lanjut.</div>

                <div className="border-3 flex bg-white border-yellow h-[56vh] w-[65vw] rounded-2xl mt-20 py-8 shadow-2xl">
                  <div  className="w-full h-full flex flex-col items-center gap-6">
                    <div className="font-bebas text-red text-4xl">Contact Us</div>
                    <div className="flex justify-between w-full gap-2 px-12">
                        <div className="">
                            <TextInput
                            className="h-12 placeholder-red"
                            placeholder="your name"
                            icon={<User className="text-black" size={20} />}
                            />
                        </div>
                        <div className="">
                            <TextInput
                            className="h-12 placeholder-red"
                            placeholder="your email address"
                            icon={<Mail className="text-black" size={20} />}
                            />
                        </div>                    
                    </div>
                    <div className="w-full px-12">
                        <TextArea 
                        placeholder="your massage here"
                        icon={<PenLine className="text-black" size={20} />}
                        rows={13}
                        />
                    </div>
                  </div>
                  <div className="w-full h-full flex flex-col items-center gap-5">
                    <div className="font-bebas text-red text-4xl">Sriwijaya Championship</div>
                    <div className="flex flex-col justify-center items-center gap-2">
                        <span className="flex gap-2"><MapPin size={20} className="text-black"/> Jl.Puri Depok Mas Blok L no.15 pancoran mas, Depok  </span>
                        <div className="flex gap-2 justify-center items-center">
                            <span className="flex gap-2"><Phone size={20} className="text-black"/> 0812-1302-0861</span>
                            <span className="flex gap-2"><Mail size={20} className="text-black"/> Sriwijaya@gmail.com</span>
                        </div>
                    </div>
                    <div className="border-2 border-red rounded-lg">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.1798162429486!2d106.82109567593805!3d-6.370770862321453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec1cabb59bdf%3A0x28b4f84e4677f329!2sJakarta%20State%20Polytechnic!5e0!3m2!1sen!2sid!4v1755283210158!5m2!1sen!2sid"
                      width="500"
                      height="310"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-md"
                    />
                    </div>
                  </div>
                </div>  
            </div>
        </div>
    )
}

export default LandingPage;