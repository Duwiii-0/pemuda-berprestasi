import { useState } from 'react';
import { Play, Clock, BookOpen, Users, Trophy, PencilLine, CheckCircle, Check } from 'lucide-react';

// Define Tutorial interface
interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  steps: string[];
  category: string;
}

interface VideoPlayerProps {
  tutorial: Tutorial;
  onClose: () => void;
}

// Removed the local NavbarLanding component - using the imported one instead

const TutorialPage = () => {
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('semua');

  // Enhanced tutorial data dengan kategori
  const tutorials = [
    {
      id: 1,
      title: "Cara Mendaftarkan Dojang Baru",
      description: "Panduan lengkap untuk mendaftarkan dojang Anda ke dalam sistem perlombaan taekwondo. Pelajari proses registrasi dari awal hingga verifikasi.",
      duration: "8:30",
      difficulty: "Pemula",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      category: "registrasi",
      steps: [
        "Buka halaman registrasi dojang",
        "Isi data lengkap dojang dan pelatih", 
        "Upload dokumen sertifikat dan izin",
        "Verifikasi email dan nomor telepon",
        "Tunggu konfirmasi dari admin"
      ]
    },
    {
      id: 2,
      title: "Menambahkan Data Atlet ke Dojang",
      description: "Pelajari cara menambahkan dan mengelola data atlet di dojang Anda. Tutorial ini mencakup input biodata, upload dokumen, dan manajemen profil atlet.",
      duration: "12:15",
      difficulty: "Pemula",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      category: "manajemen",
      steps: [
        "Login ke dashboard dojang",
        "Pilih menu 'Tambah Atlet'",
        "Isi biodata atlet lengkap",
        "Upload foto dan dokumen atlet",
        "Set kategori dan tingkat sabuk",
        "Konfirmasi data atlet"
      ]
    },
    {
      id: 3,
      title: "Mendaftarkan Atlet ke Kompetisi",
      description: "Tutorial step-by-step mendaftarkan atlet Anda ke dalam kompetisi yang tersedia. Termasuk pemilihan kategori dan pembayaran.",
      duration: "10:45",
      difficulty: "Menengah",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      category: "kompetisi",
      steps: [
        "Pilih kompetisi yang tersedia",
        "Pilih atlet yang akan didaftarkan",
        "Pilih kategori dan kelas kejuaraan",
        "Lakukan pembayaran pendaftaran",
        "Konfirmasi pendaftaran",
        "Download bukti pendaftaran"
      ]
    },
    {
      id: 4,
      title: "Mengelola Profil Dojang",
      description: "Cara mengedit dan memperbarui informasi profil dojang, termasuk data pelatih, fasilitas, dan prestasi dojang.",
      duration: "6:20",
      difficulty: "Pemula",
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      category: "manajemen",
      steps: [
        "Akses menu pengaturan profil",
        "Edit informasi dasar dojang",
        "Update data pelatih dan staf",
        "Tambahkan prestasi dan sertifikat",
        "Simpan perubahan"
      ]
    }
  ];

  const categories = [
    { id: 'semua', name: 'Semua Tutorial', icon: BookOpen },
    { id: 'registrasi', name: 'Registrasi', icon: PencilLine },
    { id: 'manajemen', name: 'Manajemen', icon: Users },
    { id: 'kompetisi', name: 'Kompetisi', icon: Trophy }
  ];

  const filteredTutorials = selectedCategory === 'semua' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedCategory);

  const VideoPlayer = ({ tutorial, onClose }: VideoPlayerProps) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-3xl font-bebas text-red">{tutorial.title}</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-3xl text-gray-600 hover:text-red transition-colors rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-100"
            >
              ×
            </button>
          </div>
          
          {/* Video Player */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="text-center relative z-10">
              <div className="bg-gradient-to-r from-red to-red/80 backdrop-blur-sm rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                <Play size={40} className="text-white ml-1" />
              </div>
              <p className="text-white font-plex font-semibold text-lg mb-2">Klik untuk memutar video tutorial</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-red/5 to-red/10 rounded-2xl p-6 border border-red/10">
              <h4 className="font-bebas text-2xl text-red mb-4 flex items-center gap-2">
                <BookOpen size={24} />
                Deskripsi Tutorial
              </h4>
              <p className="text-gray-700 font-plex mb-6 leading-relaxed">{tutorial.description}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-gray-600 border border-gray-200">
                  <Clock size={16} />
                  {tutorial.duration}
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow/10 to-yellow/20 rounded-2xl p-6 border border-yellow/20">
              <h4 className="font-bebas text-2xl text-red mb-4 flex items-center gap-2">
                <CheckCircle size={24} />
                Langkah-langkah Tutorial
              </h4>
              <ol className="space-y-3">
                {tutorial.steps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="bg-gradient-to-r from-red to-red/80 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 shadow-lg">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-plex leading-relaxed">{step}</span>
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
    <div className="min-h-screen bg-white relative">
      <div className='pt-40'>
      {/* Category Filter */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-6xl font-bebas text-[#990D35] mb-4 inline-block relative">
            Pilih Kategori Tutorial
          </h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-plex font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-[#990D35] to-[#990D35]/90 text-[#F5FBEF] shadow-lg scale-105'
                  : 'bg-[#F5FBEF] text-gray-700 hover:bg-[#990D35]/10 hover:text-[#990D35] shadow-md border border-gray-100'
              }`}
            >
              <category.icon size={20} />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tutorial Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          {filteredTutorials.map((tutorial, index) => (
            <div key={tutorial.id} className="group">
              <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2">
                {/* Thumbnail */}
                <div className="relative overflow-hidden cursor-pointer" onClick={() => setActiveVideo(tutorial)}>
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative">
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
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-red to-red/90 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                          <Play size={24} className="text-white ml-1" />
                        </div>
                        <p className="text-gray-700 font-plex font-semibold text-sm">Tonton Tutorial</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/10 group-hover:from-red/10 transition-colors duration-500"></div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow to-yellow/90 text-black px-3 py-1 rounded-full text-xs font-plex font-bold shadow-lg">
                    #{index + 1}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {tutorial.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-gradient-to-r from-red/10 to-red/20 text-red px-3 py-1 rounded-full text-sm font-plex font-semibold">
                      {tutorial.difficulty}
                    </span>
                    <span className="text-gray-500 text-sm font-plex capitalize">
                      {tutorial.category}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bebas text-red mb-3 leading-tight">
                    {tutorial.title}
                  </h3>
                  
                  <p className="text-gray-600 font-plex leading-relaxed mb-4 line-clamp-2">
                    {tutorial.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle size={16} />
                      <span>{tutorial.steps.length} langkah</span>
                    </div>
                    
                    <button 
                      onClick={() => setActiveVideo(tutorial)}
                      className="bg-gradient-to-r from-red to-red/90 hover:from-yellow hover:to-yellow/90 text-white hover:text-black transition-all duration-300 px-4 py-2 rounded-xl font-plex font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Play size={16} />
                      Tonton
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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