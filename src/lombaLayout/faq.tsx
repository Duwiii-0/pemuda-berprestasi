import FaqCard from "../components/faqCard";

const FAQ = () => {
    // FAQ Data Structure
    const faqSections = [
        {
            title: "Pendaftaran & Persyaratan",
            description: "Informasi lengkap mengenai proses pendaftaran, syarat peserta, dan dokumen yang diperlukan",
            questions: [
                {
                    question: "Bagaimana cara mendaftar untuk Sriwijaya Championship 2025?",
                    answer: "Anda dapat mendaftar melalui website resmi dengan membuat akun terlebih dahulu, kemudian memilih kategori lomba, mengupload dokumen yang diperlukan, dan melakukan konfirmasi pendaftaran."
                },
                {
                    question: "Apa saja persyaratan untuk mengikuti kompetisi?",
                    answer: "Peserta harus memiliki sertifikat sabuk minimal, kartu identitas yang masih berlaku, surat kesehatan dari dokter, dan melakukan pembayaran biaya pendaftaran sesuai kategori."
                },
                {
                    question: "Apakah ada batas usia untuk setiap kategori?",
                    answer: "Ya, setiap kategori memiliki batasan usia yang berbeda. Kategori Children (6-11 tahun), Cadet (12-14 tahun), Junior (15-17 tahun), dan Senior (18+ tahun)."
                },
                {
                    question: "Berapa biaya pendaftaran untuk setiap kategori?",
                    answer: "Biaya pendaftaran bervariasi tergantung kategori dan jenis kompetisi. Silakan hubungi panitia atau download buku panduan untuk informasi detail mengenai biaya."
                }
            ]
        },
        {
            title: "Kategori & Kompetisi",
            description: "Detail mengenai berbagai kategori kompetisi yang tersedia dan aturan pertandingan",
            questions: [
                {
                    question: "Apa saja kategori kompetisi yang tersedia?",
                    answer: "Tersedia 3 kategori utama: Kyorugi (sparring), Poomsae (bentuk), dan Freestyle Poomsae. Masing-masing kategori dibagi berdasarkan kelompok usia dan tingkat sabuk."
                },
                {
                    question: "Apakah ada kategori tim atau hanya individual?",
                    answer: "Kompetisi menyediakan kategori individual dan tim. Untuk kategori tim, setiap tim terdiri dari 3-5 orang sesuai dengan aturan yang berlaku."
                },
                {
                    question: "Bagaimana sistem penilaian dalam kompetisi?",
                    answer: "Sistem penilaian mengikuti standar World Taekwondo (WT) dan dilakukan oleh juri bersertifikat internasional untuk memastikan objektifitas dan profesionalitas."
                },
                {
                    question: "Apakah peserta internasional bisa mengikuti kompetisi?",
                    answer: "Ya, kompetisi ini terbuka untuk peserta internasional. Peserta dari luar negeri harus melengkapi dokumen visa dan mengikuti prosedur pendaftaran yang sama."
                }
            ]
        },
        {
            title: "Teknis & Fasilitas",
            description: "Informasi mengenai fasilitas venue, jadwal pertandingan, dan hal-hal teknis lainnya",
            questions: [
                {
                    question: "Di mana lokasi penyelenggaraan kompetisi?",
                    answer: "Kompetisi akan diselenggarakan di Jakarta dengan venue yang akan diumumkan lebih lanjut. Sekretariat berada di Jl. Puri Depok Mas Blok L No.15, Pancoran Mas, Depok."
                },
                {
                    question: "Kapan jadwal pelaksanaan kompetisi?",
                    answer: "Jadwal detail kompetisi akan diumumkan setelah periode pendaftaran berakhir. Informasi terbaru dapat dilihat di website resmi atau media sosial kami."
                },
                {
                    question: "Apa saja fasilitas yang disediakan untuk peserta?",
                    answer: "Kami menyediakan area pemanasan, medical support, tempat istirahat, konsumsi untuk peserta, dan area parkir yang memadai."
                },
                {
                    question: "Bagaimana jika ada perubahan jadwal mendadak?",
                    answer: "Setiap perubahan jadwal akan diinformasikan melalui website resmi, email peserta yang terdaftar, dan pengumuman di venue kompetisi."
                }
            ]
        }
    ];

    return(
        <div className="min-h-screen w-full bg-gradient-to-br from-white via-yellow/[0.01] to-white pt-10 lg:pt-0">
            {/* Enhanced Hero Section */}
            <section className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-6 sm:pb-8 md:pb-12 lg:pb-16">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
                            linear-gradient(rgba(220,38,38,.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(220,38,38,.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}></div>
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
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bebas leading-[0.85] tracking-wide">
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
                            Temukan jawaban untuk pertanyaan yang sering diajukan seputar Sriwijaya Competition 2025. 
                            Jika tidak menemukan jawaban yang Anda cari, silakan hubungi tim kami.
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
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                                linear-gradient(rgba(251,191,36,.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(251,191,36,.3) 1px, transparent 1px)
                            `,
                            backgroundSize: sectionIndex % 2 === 0 ? '50px 50px' : '30px 30px'
                        }}></div>
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
                                                {section.title.split(' ')[0]}
                                            </span>
                                            {section.title.split(' ').slice(1).length > 0 && (
                                                <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                                                    {section.title.split(' ').slice(1).join(' ')}
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
                                                <FaqCard
                                                    question={faq.question}
                                                    answer={faq.answer}
                                                />
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
    )    
}

export default FAQ;