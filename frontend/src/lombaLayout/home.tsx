import { Phone, Instagram, Eye } from "lucide-react";
import sriwijaya from "../assets/logo/sriwijaya.png";
import heroLomba from "../assets/photos/heroLomba.png";
import UnifiedRegistration from "../components/registrationSteps/UnifiedRegistration";
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import toast from "react-hot-toast";
import ketua from "../assets/photos/ketua.png";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const { user } = useAuth();

  const handleJoinClick = () => {
    if (user?.role != "PELATIH") {
      toast.error("Hanya pelatih yang bisa mendaftar kompetisi!");
      return;
    }
    setIsRegistrationOpen(true);
  };

  useEffect(() => {
    if (isRegistrationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // cleanup (biar ga bug kalau unmount)
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isRegistrationOpen]);

  const registerStep = [
    {
      number: 1,
      title: "Buat Akun",
      desc: "Daftar di website resmi kejuaraan dengan mengisi informasi pribadi dan data tim secara lengkap.",
    },
    {
      number: 2,
      title: "Login dan Pilih Kategori",
      desc: "Masuk menggunakan akun yang sudah terdaftar lalu pilih kategori lomba sesuai kelompok usia dan kemampuan.",
    },
    {
      number: 3,
      title: "Unggah Dokumen",
      desc: "Upload dokumen yang dibutuhkan seperti kartu identitas, foto, dan bukti pembayaran.",
    },
    {
      number: 4,
      title: "Konfirmasi & Selesai",
      desc: "Periksa kembali data yang telah diisi, lalu konfirmasi pendaftaran untuk mendapatkan nomor peserta.",
    },
  ];

  return (
    <div className="min-h-screen w-full">
      {/* Enhanced Hero Section - Professional & Clean */}
      <div
        className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center 2xl:bg-top overflow-hidden pt-20 md:pt-16"
        style={{ backgroundImage: `url(${heroLomba})` }}
      >
        {/* Enhanced Gradient Overlays - More Professional */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="w-full max-w-7xl flex flex-col justify-center items-center space-y-6 md:space-y-8 lg:space-y-12 text-center mx-auto">
            {/* Enhanced Logo Section */}
            <div className="relative group mt-8 md:mt-12">
              {/* Subtle backdrop circle */}
              <div className="absolute inset-0 bg-yellow/5 rounded-full blur-3xl scale-150 opacity-60"></div>
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-125"></div>

              <img
                src={sriwijaya}
                alt="Sriwijaya International Taekwondo Championship Logo"
                className="relative z-10 h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-64 lg:w-64 xl:h-80 xl:w-80 drop-shadow-2xl group-hover:scale-[1.02] transition-transform duration-700"
              />

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-3 h-3 md:w-4 md:h-4 bg-yellow/40 rounded-full blur-sm"></div>
              <div className="absolute -bottom-3 -left-3 w-4 h-4 md:w-6 md:h-6 bg-yellow/30 rounded-full blur-sm"></div>
            </div>

            {/* Enhanced Title Section - Better Typography */}
            <div className="space-y-4 md:space-y-6 px-4 max-w-5xl">
              {/* Main Title */}
              <div className="relative">
                <h1 className="text-4xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bebas text-yellow leading-[0.9] tracking-wide drop-shadow-2xl">
                  <span className="block bg-gradient-to-r from-red via-red/95 to-red/90 md:to-white/90 bg-clip-text text-transparent">
                    Sriwijaya International
                  </span>
                  <span className="block bg-gradient-to-r from-red via-red/95 to-red/90 md:to-white/90 bg-clip-text text-transparent">
                    Taekwondo Championship
                  </span>
                </h1>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 md:w-32 h-1 bg-gradient-to-r from-yellow to-yellow/60 rounded-full"></div>
              </div>

              {/* Year Badge */}
              <div className="inline-block bg-yellow/10 backdrop-blur-sm border border-yellow/30 rounded-xl px-6 py-3">
                <span className="text-2xl md:text-3xl lg:text-4xl font-bebas bg-gradient-to-r from-yellow to-yellow/90 bg-clip-text text-transparent">
                  2025
                </span>
              </div>

              {/* Description */}
              <div className="max-w-4xl mx-auto">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-plex font-light text-white/95 leading-relaxed drop-shadow-lg">
                  Kompetisi taekwondo internasional bergengsi yang menggabungkan
                  tradisi dan inovasi, menghadirkan standar kompetisi kelas
                  dunia untuk para atlet berprestasi.
                </p>
              </div>
            </div>

            {/* Enhanced CTA Button */}
            <div className="pt-2 md:pt-4 flex justify-center items-center gap-6">
              <button
                onClick={handleJoinClick}
                className="group relative inline-flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 text-base md:text-lg lg:text-xl font-plex font-semibold bg-yellow text-black hover:bg-yellow/90 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-2xl hover:shadow-yellow/30"
              >
                <span className="relative z-10">Daftar Kompetisi</span>
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
              <Link
                to="/event/pertandingan/1" // Assuming competition ID 1 for now
                className="group relative inline-flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 text-base md:text-lg lg:text-xl font-plex font-semibold bg-red text-white hover:bg-red/90 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-2xl hover:shadow-red/30"
              >
                <Eye className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                <span className="relative z-10">Lihat Antrean</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced About Section - Consistent Padding */}
      <section className="relative w-full flex items-center bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden py-12 md:py-16 lg:py-20">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(220,38,38,.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(220,38,38,.3) 1px, transparent 1px)
            `,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 xl:gap-16 items-center max-w-7xl mx-auto">
            {/* Text Content */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              {/* Section Label */}
              <div className="inline-block group">
                <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-4 md:pl-6 relative">
                  Pengantar
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
                </span>
              </div>

              {/* Main Heading */}
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bebas leading-[0.85] tracking-wide">
                  <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                    Sambutan
                  </span>
                  <span className="block bg-gradient-to-r from-red/90 via-red to-red/90 bg-clip-text text-transparent">
                    Ketua Pelaksana
                  </span>
                </h2>
                <div className="absolute -bottom-2 left-1/2 lg:left-0 transform -translate-x-1/2 lg:transform-none w-16 md:w-20 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
              </div>

              {/* Enhanced Description */}
              <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto lg:mx-0">
                <p className="text-xs sm:text-sm md:text-base lg:text-lg font-plex text-black/85 leading-relaxed font-light px-2 lg:px-0">
                  Salam hormat Sabum, Sabumnim dan orang tua Atlet Taekwondo
                  Indonesia. Tahun ini Pengurus Pengprov TISS mengadakan event
                  Sriwijaya Internasional Championship 2025 Dimana semua itu
                  dapat terwujud dengan adanya kerjasama dan dukungan dari
                  seluruh pihak, para insan Taekwondoin Sumatera Selatan, KONI
                  Sumatera Selatan dan Pemerintah Provinsi Sumatera Selatan.
                  Pelaksanaan event kejuaraan ini bertempat di GOR RANAU JSC
                  PALEMBANG Untuk itu kami mengundang semua untuk bergabung pada
                  kegiatan tersebut. Semoga dengan diadakannya event ini, dapat
                  menjadi tolak ukur para atlet-atlet muda, serta dapat memenuhi
                  harapan Insan Taekwondo, agar Atlet dapat dipandang di kancah
                  Nasional dan Internasional nantinya. Aamiin.
                </p>
              </div>
            </div>

            {/* Enhanced Director Section */}
            <div className="relative order-1 lg:order-2 flex justify-center items-center py-8 lg:py-0">
              <div className="relative w-full max-w-md group flex justify-center items-center">
                <div className="group/card flex flex-col w-full gap-4 md:gap-6 justify-center items-center hover:scale-[1.02] transition-all duration-500">
                  {/* Enhanced Image Container */}
                  <div className="relative overflow-hidden rounded-xl mx-auto group-hover/card:scale-105 transition-transform duration-700">
                    {/* Subtle overlay patterns */}
                    <img
                      src={ketua}
                      alt="Hj. Meilinda, S.Sos.,M.M"
                      className="h-48 w-36 sm:h-56 sm:w-42 md:h-64 md:w-48 lg:h-72 lg:w-54 xl:h-96 xl:w-72 object-cover group-hover/card:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Enhanced Text Section */}
                  <div className="text-center space-y-2 md:space-y-3 group-hover/card:scale-105 transition-transform duration-500 px-2">
                    <div className="space-y-1">
                      <h3 className="font-bebas text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl bg-gradient-to-r from-red to-red/80 bg-clip-text text-transparent">
                        Hj. Meilinda, S.Sos.,M.M
                      </h3>
                      <p className="font-plex text-xs md:text-sm lg:text-md 2xl:text-xl text-black/70 font-medium tracking-wide">
                        Ketua Panitia Kejuaraan Sriwijaya
                      </p>
                    </div>
                    <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-red/60 to-transparent mx-auto"></div>
                    <p className="text-xs md:text-sm xl:text-md text-black/60 font-plex leading-relaxed max-w-sm">
                      “SALAM TAEKWONDO INDONESIA PROVINSI SUMATERA SELATAN”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Registration Steps Section - Mobile Optimized */}
      <section className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-yellow/[0.02] to-white overflow-hidden py-8 md:py-12 lg:py-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(251,191,36,.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251,191,36,.4) 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-3 md:space-y-6 mb-6 md:mb-12 lg:mb-16">
            {/* Section Label */}
            <div className="inline-block group">
              <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 md:pl-6 relative">
                Cara Pendaftaran
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bebas leading-[0.85] tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  Panduan
                </span>
                <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                  Pendaftaran
                </span>
              </h2>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 md:w-20 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
            </div>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-4 font-plex text-black/80 max-w-3xl mx-auto leading-relaxed font-light">
              Ikuti langkah-langkah berikut untuk mendaftar sebagai peserta
              Sriwijaya Competition 2025 dengan mudah dan efisien.
            </p>
          </div>

          {/* Mobile Optimized Steps Container */}
          <div className="max-w-5xl mx-auto">
            {/* Mobile: Single Column, Tablet+: 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 py-2 md:py-6">
              {registerStep.map((step) => (
                <div
                  key={step.number}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-red/10 hover:border-red/20 shadow-md hover:shadow-lg hover:shadow-red/10 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Mobile Optimized Step Content */}
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    {/* Step Number - Smaller on Mobile */}
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-red to-red/80 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bebas text-sm sm:text-base md:text-lg font-bold">
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bebas text-sm sm:text-base md:text-lg lg:text-xl text-red mb-1 sm:mb-2 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-sm text-black/70 font-plex leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Decorative elements - Smaller on Mobile */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red/20 rounded-full group-hover:bg-red/40 transition-colors duration-300"></div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red/15 rounded-full group-hover:bg-red/30 transition-colors duration-300"></div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg sm:rounded-xl"></div>
                </div>
              ))}
            </div>

            {/* Mobile CTA Button */}
            <div className="text-center mt-6 sm:mt-8 md:mt-10">
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                }}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-plex font-semibold bg-red text-white hover:bg-red/90 transition-all duration-300 rounded-lg sm:rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-red/30"
              >
                <span>Mulai Daftar Sekarang</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section - Fixed Layout */}
      <section className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-blue/[0.02] to-white overflow-hidden py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12 lg:mb-16">
            <div className="inline-block group">
              <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-4 md:pl-6 relative">
                Hubungi Kami
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bebas leading-[0.85] tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  Pusat
                </span>
                <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                  Informasi
                </span>
              </h2>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-20 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
            </div>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-4">
              Berikut adalah detail informasi mengenai kontak dan lokasi
              pertandingan. Jangan takut untuk menghubungi tim kami kapan saja.
              Kami siap memberikan informasi detail Sriwijaya Competition 2025
              serta panduan menuju ke lokasi pertandingan
            </p>
          </div>

          {/* Enhanced Contact Card - Fixed Layout */}
          <div className="max-w-7xl mx-auto">
            <div className="group relative bg-white/95 backdrop-blur-sm border-2 border-yellow/30 rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-yellow/20 transition-all duration-700 overflow-hidden hover:scale-[1.01]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow/[0.03] via-transparent to-yellow/[0.02]"></div>

              <div className="relative z-10 grid grid-cols-1 p-6 sm:p-8 md:p-10">
                {/* Contact Info Side */}
                <div className="w-full h-full flex flex-col space-y-6 md:space-y-8 xl:pl-8">
                  <div className="text-center w-full">
                    <h3 className="font-bebas text-red text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2">
                      Pusat Informasi
                    </h3>
                    <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-red to-red/60 mx-auto mb-3"></div>
                    <p className="text-xs md:text-sm lg:text-md font-plex text-black/70 max-w-md mx-auto">
                      Berikut adalah Kontak tim kami dan lokasi venue Sriwijaya
                      Championship
                    </p>
                  </div>

                  {/* Enhanced Contact Details - Larger & More Prominent */}
                  <div className="space-y-4 md:space-y-6">
                    {/* Phone & Instagram - Stack on Mobile, Side by Side on Desktop */}
                    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-6">
                      {/* Phone Contact */}
                      <div className="group flex items-center gap-4 md:gap-5 p-5 md:p-6 lg:p-7 rounded-2xl bg-gradient-to-br from-red/5 to-red/10 hover:from-red/10 hover:to-red/15 transition-all duration-300 border border-red/20 hover:border-red/30 shadow-sm hover:shadow-lg hover:shadow-red/10 transform hover:-translate-y-1">
                        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red to-red/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Phone
                            className="w-5 h-5 md:w-6 md:h-6 text-white"
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base text-black/70 font-plex mb-1 font-medium">
                            Telepon
                          </p>
                          <a
                            href="https://wa.me/6281377592090"
                            className="text-base md:text-lg lg:text-xl font-plex text-red font-bold hover:text-red/80 transition-colors duration-200 block"
                          >
                            0813-7759-2090
                          </a>
                          <p className="text-xs md:text-sm text-black/60 font-plex mt-1">
                            (Rora)
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-plex mb-1 font-medium text-transparent">
                            Telepon
                          </p>
                          <a
                            href="https://wa.me/6285922124908"
                            className="text-base md:text-lg lg:text-xl font-plex text-red font-bold hover:text-red/80 transition-colors duration-200 block"
                          >
                            0859-2212-4908
                          </a>
                          <p className="text-xs md:text-sm text-black/60 font-plex mt-1">
                            (Rizka)
                          </p>
                        </div>
                      </div>

                      {/* Instagram Contact */}
                      <div className="group flex items-center gap-4 md:gap-5 p-5 md:p-6 lg:p-7 rounded-2xl bg-gradient-to-br from-red/5 to-red/10 hover:from-red/10 hover:to-red/15 transition-all duration-300 border border-red/20 hover:border-red/30 shadow-sm hover:shadow-lg hover:shadow-red/10 transform hover:-translate-y-1">
                        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red to-red/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Instagram
                            className="w-5 h-5 md:w-6 md:h-6 text-white"
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base text-black/70 font-plex mb-1 font-medium">
                            Instagram
                          </p>
                          <a
                            href="https://www.instagram.com/sumsel_taekwondo"
                            className="text-base md:text-lg lg:text-xl font-plex text-red font-bold hover:text-red/80 transition-colors duration-200 block break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            @sumsel_taekwondo
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Map - More Prominent */}
                  <div className="w-full">
                    <div className="group flex w-full items-center justify-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl ">
                      <div className="flex-1 min-w-0 w-full justify-center items-center">
                        <h4 className="text-center font-bebas text-red text-lg md:text-xl lg:text-3xl mb-2">
                          Lokasi Pertandingan
                        </h4>
                        <p className="text-center text-sm md:text-base font-plex text-black/80 font-medium">
                          GOR Jakabaring (Gor Ranau JSC), Palembang
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-56 md:h-64 lg:h-80 xl:h-96 border-2 border-red/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red/20 transition-all duration-500 group/map">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.2808245295255!2d104.7919914!3d-3.0190341000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e3b9da396d2b289%3A0xcc3623bbbb92bd93!2sGOR%20Jakabaring!5e0!3m2!1sen!2sid!4v1757524240866!5m2!1sen!2sid"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full group-hover/map:scale-[1.02] transition-transform duration-700 filter grayscale-[20%] hover:grayscale-0"
                        title="Lokasi Sekretariat Sriwijaya Championship"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Registration Modal */}
      <UnifiedRegistration
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
