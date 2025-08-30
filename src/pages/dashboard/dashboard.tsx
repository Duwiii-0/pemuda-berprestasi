import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarDashboard from "../../components/navbar/navbarDashboard"
import { 
  Users, 
  Trophy, 
  Home, 
  Calendar,
  MapPin,
  Plus,
  Activity,
  ArrowUpRight,
  Menu,
  Award,
  TrendingUp
} from 'lucide-react';

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  change?: string;
  color: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  color, 
  onClick 
}) => (
  <div 
    className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-plex font-medium text-black/60 text-sm">{title}</h3>
          <p className="font-bebas text-2xl text-black/80">{value}</p>
          {change && (
            <p className="text-xs text-green-600 font-plex font-medium flex items-center gap-1">
              <TrendingUp size={12} />
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  color: string;
}> = ({ title, description, icon: Icon, onClick, color }) => (
  <div
    onClick={onClick}
    className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border border-white/50 relative overflow-hidden hover:scale-[1.02]"
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div 
          className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 ${color}`}
        >
          <Icon size={24} className="text-white" />
        </div>
        <ArrowUpRight 
          size={16} 
          className="text-black/40 group-hover:text-black/60 transition-colors duration-300"
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-bebas text-xl text-black/80 tracking-wide">
          {title}
        </h3>
        <p className="text-black/60 text-sm leading-relaxed font-plex">
          {description}
        </p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mock data - replace with actual data from your context/API
  const dashboardData = {
    totalAtlit: 25,
    totalDojang: 8,
    totalKompetisi: 3,
    kompetisiAktif: 1,
    atletAktifBulanIni: 18,
    pertumbuhanAtlet: 15.2
  };

  const recentActivities = [
    {
      id: 1,
      type: 'atlit',
      message: 'Atlit baru "Ahmad Rizki" telah terdaftar',
      time: '2 jam yang lalu',
      icon: Users
    },
    {
      id: 2,
      type: 'kompetisi',
      message: 'Kompetisi "Kejuaraan Nasional 2025" dimulai',
      time: '1 hari yang lalu',
      icon: Trophy
    },
    {
      id: 3,
      type: 'dojang',
      message: 'Dojang "Garuda Taekwondo" diperbarui',
      time: '3 hari yang lalu',
      icon: Home
    }
  ];

  const upcomingCompetitions = [
    {
      id: 1,
      name: 'Kejuaraan Regional Sumsel',
      date: '15 September 2025',
      location: 'Palembang',
      participants: 12
    },
    {
      id: 2,
      name: 'Open Tournament Jakarta',
      date: '22 Oktober 2025',
      location: 'Jakarta',
      participants: 8
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />
      
      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 lg:px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
                aria-label="Open menu"
              >
                <Menu size={24} className="text-red" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-6 flex-1">
              <div>
                <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DASHBOARD
                </h1>
                <p className="font-plex text-black/60 text-lg mt-2">
                  Kelola sistem manajemen taekwondo dengan mudah
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red/10 rounded-xl">
                <Activity className="text-red" size={20} />
              </div>
              <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                STATISTIK OVERVIEW
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Users}
                title="Total Atlet"
                value={dashboardData.totalAtlit.toString()}
                change="+15.2% bulan ini"
                color="bg-gradient-to-br from-red to-red/80"
                onClick={() => navigate('/dashboard/atlit')}
              />
              <StatsCard
                icon={Home}
                title="Total Dojang"
                value={dashboardData.totalDojang.toString()}
                change="+2 baru"
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                onClick={() => navigate('/dashboard/dojang')}
              />
              <StatsCard
                icon={Trophy}
                title="Total Kompetisi"
                value={dashboardData.totalKompetisi.toString()}
                change="1 aktif"
                color="bg-gradient-to-br from-yellow to-yellow/80"
                onClick={() => navigate('/dashboard/dataKompetisi')}
              />
              <StatsCard
                icon={Award}
                title="Atlet Aktif"
                value={dashboardData.atletAktifBulanIni.toString()}
                change="Bulan ini"
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Plus className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  AKSI CEPAT
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  title="Tambah Atlit Baru"
                  description="Daftarkan atlit baru ke dalam sistem dengan data lengkap"
                  icon={Plus}
                  color="bg-gradient-to-br from-red to-red/80"
                  onClick={() => navigate('/dashboard/TambahAtlit')}
                />
                <QuickActionCard
                  title="Kelola Data Atlit"
                  description="Lihat, edit, dan kelola semua data atlit yang terdaftar"
                  icon={Users}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  onClick={() => navigate('/dashboard/atlit')}
                />
                <QuickActionCard
                  title="Data Dojang"
                  description="Kelola informasi dojang dan lokasi pelatihan"
                  icon={Home}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                  onClick={() => navigate('/dashboard/dojang')}
                />
                <QuickActionCard
                  title="Data Kompetisi"
                  description="Kelola jadwal dan informasi kompetisi taekwondo"
                  icon={Trophy}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                  onClick={() => navigate('/dashboard/dataKompetisi')}
                />
              </div>
            </div>

            {/* Recent Activities */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Activity className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  AKTIVITAS TERBARU
                </h2>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/30 transition-all duration-200">
                        <div 
                          className={`p-3 rounded-xl flex-shrink-0 ${
                            activity.type === 'atlit' ? 'bg-gradient-to-br from-red to-red/80' : 
                            activity.type === 'kompetisi' ? 'bg-gradient-to-br from-yellow to-yellow/80' : 
                            'bg-gradient-to-br from-green-500 to-green-600'
                          }`}
                        >
                          <Icon size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-plex font-semibold text-black/80 mb-1 leading-snug">
                            {activity.message}
                          </p>
                          <p className="text-xs text-black/50 font-plex font-medium">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <button className="w-full mt-6 text-center py-3 text-sm font-plex font-semibold rounded-xl transition-all duration-200 border-2 border-red text-red hover:bg-red hover:text-white">
                  Lihat Semua Aktivitas
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Competitions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Trophy className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  KOMPETISI MENDATANG
                </h2>
              </div>
              <button 
                onClick={() => navigate('/dashboard/dataKompetisi')}
                className="flex items-center gap-2 text-sm font-plex font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-red text-red hover:bg-red hover:text-white hover:scale-105"
              >
                Lihat Semua
                <ArrowUpRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingCompetitions.map((comp) => (
                <div key={comp.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow to-yellow/80 group-hover:scale-110 transition-transform duration-300">
                      <Trophy size={28} className="text-white" />
                    </div>
                    <span className="text-sm font-plex font-semibold px-4 py-2 rounded-full bg-green-100 text-green-700">
                      Mendatang
                    </span>
                  </div>
                  
                  <h3 className="font-bebas text-xl mb-4 text-black/80 leading-tight tracking-wide">
                    {comp.name}
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-black/60">
                      <div className="p-2 rounded-lg bg-yellow/20">
                        <Calendar size={16} className="text-yellow" />
                      </div>
                      <span className="font-plex font-medium">{comp.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-black/60">
                      <div className="p-2 rounded-lg bg-yellow/20">
                        <MapPin size={16} className="text-yellow" />
                      </div>
                      <span className="font-plex font-medium">{comp.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-black/60">
                      <div className="p-2 rounded-lg bg-yellow/20">
                        <Users size={16} className="text-yellow" />
                      </div>
                      <span className="font-plex font-medium">{comp.participants} atlit terdaftar</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/dashboard/dataKompetisi')}
                    className="w-full py-3 px-6 rounded-xl font-plex font-semibold transition-all duration-300 border-2 border-red text-red hover:bg-red hover:text-white hover:-translate-y-1"
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red/10 rounded-xl">
                  <TrendingUp className="text-red" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  PERFORMA SISTEM
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/50 font-plex">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Sistem berjalan normal
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-red to-red/80">
                    <span className="text-2xl font-bebas text-white">
                      {dashboardData.totalAtlit}
                    </span>
                  </div>
                </div>
                <p className="font-bebas text-lg text-black/80 mb-1">
                  Total Atlit
                </p>
                <p className="text-sm text-black/50 font-plex font-medium">
                  Terdaftar aktif
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="text-2xl font-bebas text-white">
                      {dashboardData.totalDojang}
                    </span>
                  </div>
                </div>
                <p className="font-bebas text-lg text-black/80 mb-1">
                  Total Dojang
                </p>
                <p className="text-sm text-black/50 font-plex font-medium">
                  Cabang terdaftar
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-yellow to-yellow/80">
                    <span className="text-2xl font-bebas text-white">
                      {dashboardData.totalKompetisi}
                    </span>
                  </div>
                </div>
                <p className="font-bebas text-lg text-black/80 mb-1">
                  Total Event
                </p>
                <p className="text-sm text-black/50 font-plex font-medium">
                  Tahun ini
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
                    <span className="text-xl font-bebas text-white">
                      +{dashboardData.pertumbuhanAtlet}%
                    </span>
                  </div>
                </div>
                <p className="font-bebas text-lg text-black/80 mb-1">
                  Pertumbuhan
                </p>
                <p className="text-sm text-black/50 font-plex font-medium">
                  Bulan ini
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;