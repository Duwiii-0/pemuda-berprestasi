import FaqCard from "../components/faqCard";

const FAQ = () => {
  // FAQ Data Structure
  const faqSections = [
    {
      title: "Pendaftaran & Persyaratan",
      description:
        "Informasi lengkap mengenai proses pendaftaran, syarat peserta, dan dokumen yang diperlukan",
      questions: [
        {
          question: "Kapan periode pendaftaran dibuka dan ditutup?",
          answer:
            "Pendaftaran dibuka mulai 1 Agustus 2025 dan ditutup pada 8 November 2025, atau lebih cepat jika kuota sudah terpenuhi.",
        },
        {
          question: "Apa saja persyaratan umum untuk peserta?",
          answer:
            "Peserta harus sehat jasmani & rohani, merupakan taekwondoin di bawah naungan PBTI, tidak sedang menjalani sanksi, melampirkan rekomendasi Pengprov/MNA (untuk WNA), BPJS (WNI) atau asuransi (WNA), fotokopi akta kelahiran, sertifikat taekwondo, pas foto 3x4 (2 lembar), dan surat keterangan sehat (khusus prestasi).",
        },
        {
          question: "Berapa biaya pendaftaran untuk kejuaraan ini?",
          answer:
            "Biaya pendaftaran adalah Rp 500.000/atlet untuk WNI dan Rp 1.000.000/atlet untuk WNA.",
        },
        {
          question: "Bagaimana cara melakukan pembayaran pendaftaran?",
          answer:
            "Pembayaran dilakukan ke Bank Sumsel Babel dengan rekening a.n Panitia UKT Pengprov TISS No. 19309010367. Konfirmasi pembayaran dikirim melalui nomor panitia (Jeje: 0853-7844-1489).",
        },
      ],
    },
    {
      title: "Kategori & Kompetisi",
      description:
        "Detail mengenai kategori pertandingan yang tersedia dan aturan penilaian",
      questions: [
        {
          question: "Apa saja kategori usia yang dipertandingkan?",
          answer:
            "Kategori usia meliputi: Super Pra-Cadet (5–8 tahun, kelahiran 2017–2020), Pra-Cadet (9–11 tahun, kelahiran 2014–2016), Cadet (12–14 tahun, kelahiran 2011–2013), Junior (15–17 tahun, kelahiran 2008–2010), dan Senior (18 tahun ke atas, kelahiran 2007 atau sebelumnya).",
        },
        {
          question: "Apa saja jenis kompetisi yang tersedia?",
          answer:
            "Kompetisi terdiri dari Kyorugi (pemula & prestasi), Poomsae (recognized dan freestyle, individu putra/putri), serta kategori beregu sesuai ketentuan.",
        },
        {
          question: "Bagaimana sistem penilaian yang digunakan?",
          answer:
            "Kyorugi pemula menggunakan DSS (Digital Scoring System), kyorugi prestasi menggunakan aturan WT Competition Rules, sedangkan Poomsae (pemula & prestasi) menggunakan sistem gugur (battle).",
        },
        {
          question: "Apakah atlet bisa mengikuti lebih dari satu kategori?",
          answer:
            "Ya, atlet dapat bertanding di Kyorugi dan Poomsae sekaligus, dengan mendapatkan 2 ID card.",
        },
      ],
    },
    {
      title: "Teknis & Fasilitas",
      description:
        "Informasi mengenai lokasi, jadwal, fasilitas, dan akomodasi",
      questions: [
        {
          question: "Di mana lokasi penyelenggaraan kejuaraan?",
          answer:
            "Kejuaraan akan dilaksanakan di GOR Ranau Jakabaring Sport City (JSC) Palembang, Sumatera Selatan.",
        },
        {
          question: "Kapan jadwal pertandingan berlangsung?",
          answer:
            "Pertandingan berlangsung pada 22–26 November 2025. Penimbangan atlet dilakukan 21 November 2025 (10.00–15.00 WIB), dilanjutkan dengan Technical Meeting pada pukul 15.30 WIB.",
        },
        {
          question: "Apa saja fasilitas untuk peserta di venue?",
          answer:
            "Tersedia area pemanasan, dukungan medis, shuttle bus di kawasan JSC, serta akses transportasi umum seperti Transmusi, LRT, Grab, dan Gojek.",
        },
        {
          question: "Apakah ada rekomendasi penginapan untuk peserta?",
          answer:
            "Ya, panitia merekomendasikan beberapa hotel dekat venue seperti Wyndham Opi Hotel (1,8 km), Opi Indah Hotel (1,7 km), Ayola Sentosa Palembang (5,1 km), dan Ibis Palembang Sanggar (5,2 km).",
        },
      ],
    },
    {
      title: "Penghargaan & Hadiah",
      description: "Detail mengenai penghargaan, medali, dan hadiah pembinaan",
      questions: [
        {
          question: "Apa penghargaan untuk juara umum kategori prestasi?",
          answer:
            "Juara Umum 1: Rp 30.000.000 + piala, piagam, dan hadiah sponsor. Juara Umum 2: Rp 15.000.000. Juara Umum 3: Rp 7.500.000.",
        },
        {
          question: "Apa penghargaan untuk juara umum kategori pemula?",
          answer:
            "Juara Umum 1: Rp 15.000.000, Juara Umum 2: Rp 10.000.000, Juara Umum 3: Rp 5.000.000, beserta piala, piagam, dan hadiah sponsor.",
        },
        {
          question: "Apakah ada penghargaan individu?",
          answer:
            "Ya, atlet terbaik di setiap kategori (Pracadet, Cadet, Junior, Senior, dan Poomsae) akan mendapatkan uang pembinaan Rp 1.000.000 serta piagam penghargaan.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-yellow/[0.01] to-white pt-10 lg:pt-0">
      {/* Enhanced Hero Section */}
      <section className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-6 sm:pb-8 md:pb-12 lg:pb-16">
        {/* Background pattern */}
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

        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 w-full max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            {/* Section Label */}
            <div className="hidden lg:inline-block group">
              <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 sm:pl-4 md:pl-6 relative">
                Pusat Bantuan
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>

            {/* Main Title */}
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  Frequently Asked
                </span>
                <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                  Questions
                </span>
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Temukan jawaban untuk pertanyaan yang sering diajukan seputar
              Sriwijaya Competition 2025. Jika tidak menemukan jawaban yang Anda
              cari, silakan hubungi tim kami.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      {faqSections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-yellow/[0.01] to-white overflow-hidden py-6 sm:py-8 md:py-12 lg:py-16"
        >
          {/* Alternating background patterns */}
          <div className="absolute inset-0 opacity-[0.01]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                                linear-gradient(rgba(251,191,36,.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(251,191,36,.3) 1px, transparent 1px)
                            `,
                backgroundSize:
                  sectionIndex % 2 === 0 ? "50px 50px" : "30px 30px",
              }}
            ></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 w-full max-w-7xl">
            <div className="max-w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 2xl:gap-16 items-start">
                {/* Section Info */}
                <div className="lg:col-span-2 xl:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 text-center lg:text-left">
                  {/* Section Title */}
                  <div className="relative">
                    <h2 className="text-3xl sm:text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-bebas leading-[0.9] tracking-wide">
                      <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                        {section.title.split(" ")[0]}
                      </span>
                      {section.title.split(" ").slice(1).length > 0 && (
                        <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                          {section.title.split(" ").slice(1).join(" ")}
                        </span>
                      )}
                    </h2>
                    <div className="absolute -bottom-1 left-1/2 lg:left-0 transform -translate-x-1/2 lg:transform-none w-10 sm:w-12 md:w-16 h-0.5 bg-gradient-to-r from-red to-yellow rounded-full"></div>
                  </div>

                  {/* Section Description */}
                  <p className="text-xs sm:text-sm md:text-base font-plex text-black/70 leading-relaxed font-light max-w-md mx-auto lg:mx-0">
                    {section.description}
                  </p>
                </div>

                {/* FAQ Cards - Wider Span */}
                <div className="lg:col-span-3 xl:col-span-3">
                  <div className="w-full flex flex-col border-t-2 border-yellow/60 bg-white/40 backdrop-blur-sm transition-all duration-500">
                    {section.questions.map((faq, questionIndex) => (
                      <div
                        key={questionIndex}
                        className="border-b border-yellow/20 last:border-b-0 hover:bg-yellow/[0.02] transition-all duration-300"
                      >
                        <FaqCard question={faq.question} answer={faq.answer} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom spacing for mobile navigation or footer */}
      <div className="h-16 sm:h-20 md:h-0"></div>
    </div>
  );
};

export default FAQ;
