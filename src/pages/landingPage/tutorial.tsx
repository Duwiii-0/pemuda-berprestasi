import { useState } from 'react';
import { Play, Clock, ChevronRight, BookOpen, Users, CheckCircle, ArrowRight } from 'lucide-react';

// Define Tutorial interface
interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  thumbnail: string;
  videoUrl: string;
  steps: string[];
}

interface VideoPlayerProps {
  tutorial: Tutorial;
  onClose: () => void;
}

const TutorialPage = () => {
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);

  // Data tutorial videos
  const tutorials = [
    {
      id: 1,
      title: "Cara Mendaftarkan Dojang Baru",
      description: "Panduan lengkap untuk mendaftarkan dojang Anda ke dalam sistem perlombaan",
      duration: "8:30",
      difficulty: "Pemula",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      steps: [
        "Buka halaman registrasi dojang",
        "Isi data lengkap dojang", 
        "Upload dokumen yang diperlukan",
        "Verifikasi email dan nomor telepon"
      ]
    },
    {
      id: 2,
      title: "Menambahkan Data Atlet ke Dojang",
      description: "Pelajari cara menambahkan dan mengelola data atlet di dojang Anda",
      duration: "12:15",
      difficulty: "Pemula",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      steps: [
        "Login ke dashboard dojang",
        "Pilih menu 'Tambah Atlet'",
        "Isi biodata atlet lengkap",
        "Upload foto dan dokumen atlet",
        "Konfirmasi data atlet"
      ]
    },
    {
      id: 3,
      title: "Mendaftarkan Atlet ke Kompetisi",
      description: "Tutorial step-by-step mendaftarkan atlet Anda ke dalam kompetisi yang tersedia",
      duration: "10:45",
      difficulty: "Menengah",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      steps: [
        "Pilih kompetisi yang tersedia",
        "Pilih atlet yang akan didaftarkan",
        "Pilih kategori dan kelas kejuaraan",
        "Konfirmasi pendaftaran",
        "Download bukti pendaftaran"
      ]
    }
  ];

  const VideoPlayer = ({ tutorial, onClose }: VideoPlayerProps) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bebas text-red">{tutorial.title}</h3>
            <button 
              onClick={onClose}
              className="text-3xl text-gray-600 hover:text-red transition-colors rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
            >
              ×
            </button>
          </div>
          
          {/* Video placeholder */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-video rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="text-center relative z-10">
              <div className="bg-red/90 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play size={32} className="text-white ml-1" />
              </div>
              <p className="text-gray-700 font-inter font-semibold">Video Player akan ditampilkan di sini</p>
              <p className="text-sm text-gray-500 mt-1">URL: {tutorial.videoUrl}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-red/5 to-red/10 rounded-2xl p-6">
              <h4 className="font-bebas text-2xl text-red mb-4 flex items-center gap-2">
                <BookOpen size={24} />
                Deskripsi
              </h4>
              <p className="text-gray-700 font-inter mb-6 leading-relaxed">{tutorial.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full text-gray-600">
                  <Clock size={16} />
                  {tutorial.duration}
                </span>
                <span className="bg-yellow text-black px-4 py-2 rounded-full font-semibold">
                  {tutorial.difficulty}
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow/10 to-yellow/20 rounded-2xl p-6">
              <h4 className="font-bebas text-2xl text-red mb-4 flex items-center gap-2">
                <CheckCircle size={24} />
                Langkah-langkah
              </h4>
              <ol className="space-y-3">
                {tutorial.steps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="bg-gradient-to-r from-red to-red/80 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 shadow-lg">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-inter leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Floating Elements */}
      <div className="absolute top-40 left-10 w-20 h-20 bg-yellow/20 rounded-full blur-xl"></div>
      <div className="absolute top-60 right-16 w-32 h-32 bg-red/15 rounded-full blur-2xl"></div>
      <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-yellow/15 rounded-full blur-xl"></div>

      {/* Hero Section - Organic Shape */}
      <div className="relative pt-32 pb-20 mb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-red via-red/95 to-red/80"></div>
        <div className="absolute inset-0">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full">
            <path 
              fill="rgba(255,255,255,0.1)" 
              d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,133.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-8xl font-bebas text-white mb-6 leading-none drop-shadow-lg">
            Tutorial Website
          </h1>
          <p className="text-xl font-inter text-white/95 max-w-2xl mx-auto leading-relaxed backdrop-blur-sm bg-white/10 rounded-2xl p-6">
            Panduan lengkap menggunakan website perlombaan taekwondo untuk pelatih. 
            Mulai dari mendaftar dojang hingga mendaftarkan atlet ke kompetisi.
          </p>
        </div>
      </div>

      {/* Stats Section - Floating Cards */}
      <div className="max-w-6xl mx-auto px-6 mb-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50">
            <div className="bg-gradient-to-br from-red to-red/80 text-white rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
              <BookOpen size={32} />
            </div>
            <h3 className="text-3xl font-bebas text-red mb-3">3 Video Tutorial</h3>
            <p className="text-gray-600 font-inter leading-relaxed">Panduan lengkap step-by-step untuk semua kebutuhan</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 md:mt-8">
            <div className="bg-gradient-to-br from-yellow to-yellow/80 text-black rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
              <Users size={32} />
            </div>
            <h3 className="text-3xl font-bebas text-red mb-3">Untuk Pelatih</h3>
            <p className="text-gray-600 font-inter leading-relaxed">Khusus pengelola dojang dan pelatih taekwondo</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50">
            <div className="bg-gradient-to-br from-red to-red/80 text-white rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-3xl font-bebas text-red mb-3">Mudah Dipahami</h3>
            <p className="text-gray-600 font-inter leading-relaxed">Bahasa sederhana dengan langkah yang jelas</p>
          </div>
        </div>
      </div>

      {/* Tutorial Cards - Organic Layout */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bebas text-red mb-4 inline-block relative">
            Pelajari Step by Step
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-yellow to-red rounded-full"></div>
          </h2>
          <p className="text-gray-600 font-inter text-lg max-w-2xl mx-auto mt-6">
            Video tutorial yang mudah dipahami untuk membantu Anda mengelola dojang dan atlet dengan lancar
          </p>
        </div>

        <div className="space-y-16">
          {tutorials.map((tutorial, index) => (
            <div key={tutorial.id} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 group`}>
              {/* Video Section */}
              <div className="lg:w-1/2 relative">
                <div className="relative group cursor-pointer" onClick={() => setActiveVideo(tutorial)}>
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500 relative">
                    <img 
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const nextSibling = target.nextElementSibling as HTMLElement;
                        target.style.display = 'none';
                        if (nextSibling) nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-red to-red/90 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                          <Play size={32} className="text-white ml-1" />
                        </div>
                        <p className="text-gray-700 font-inter font-semibold">Klik untuk memutar video</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 group-hover:from-red/20 transition-colors duration-500"></div>
                    </div>
                  </div>
                  
                  {/* Floating Duration */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {tutorial.duration}
                  </div>

                  {/* Floating Number */}
                  <div className="absolute -top-4 -left-4 bg-gradient-to-br from-yellow to-yellow/90 text-black rounded-2xl w-12 h-12 flex items-center justify-center font-bebas text-2xl shadow-lg">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="bg-gradient-to-r from-yellow to-yellow/80 text-black px-4 py-2 rounded-full text-sm font-inter font-bold shadow-lg">
                    {tutorial.difficulty}
                  </span>
                </div>
                
                <h3 className="text-4xl font-bebas text-red leading-tight">
                  {tutorial.title}
                </h3>
                
                <p className="text-gray-700 font-inter text-lg leading-relaxed">
                  {tutorial.description}
                </p>

                {/* Quick Preview */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                  <p className="text-sm text-red font-inter font-semibold mb-3 flex items-center gap-2">
                    <ArrowRight size={16} />
                    Yang akan Anda pelajari:
                  </p>
                  <div className="space-y-2">
                    {tutorial.steps.slice(0, 3).map((step: string, stepIndex: number) => (
                      <div key={stepIndex} className="flex items-center gap-3 text-gray-700 font-inter">
                        <div className="w-2 h-2 bg-red rounded-full"></div>
                        {step}
                      </div>
                    ))}
                    <div className="text-gray-500 font-inter text-sm italic">
                      +{tutorial.steps.length - 3} langkah lainnya...
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveVideo(tutorial)}
                  className="bg-gradient-to-r from-red to-red/90 hover:from-yellow hover:to-yellow/90 text-white hover:text-black transition-all duration-300 px-8 py-4 rounded-2xl font-inter font-bold flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Play size={24} />
                  Tonton Tutorial
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section - Organic Shape */}
        <div className="mt-24 relative">
          <div className="bg-gradient-to-br from-red/10 via-yellow/10 to-red/5 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-red/15 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bebas text-red mb-6">
                Masih Butuh Bantuan?
              </h3>
              <p className="text-gray-700 font-inter text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Jika masih kesulitan menggunakan website, jangan ragu untuk menghubungi tim support kami
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a 
                  href="mailto:support@pemudaberprestasi.com" 
                  className="bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white transition-all duration-300 px-8 py-4 rounded-2xl font-inter font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Email Support
                </a>
                <a 
                  href="tel:+62123456789" 
                  className="bg-white/80 backdrop-blur-sm border-2 border-red text-red hover:bg-red hover:text-white transition-all duration-300 px-8 py-4 rounded-2xl font-inter font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Telepon Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <VideoPlayer 
          tutorial={activeVideo} 
          onClose={() => setActiveVideo(null)} 
        />
      )}
    </div>
  );
};

export default TutorialPage;