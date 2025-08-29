import React, { useState } from 'react';
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
  Menu
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    onClick: () => void;
    color: string;
  }> = ({ title, description, icon: Icon, onClick, color }) => (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-100 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={24} style={{ color }} />
          </div>
          <ArrowUpRight 
            size={16} 
            className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-gray-900">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Desktop Sidebar */}
      <NavbarDashboard />
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <Menu size={20} style={{ color: '#990D35' }} />
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <NavbarDashboard 
          mobile={true} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-72 p-8 space-y-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            DASHBOARD
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Kelola sistem manajemen taekwondo dengan mudah
          </p>
        </div>

        {/* Stats Overview */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">
            STATISTIK OVERVIEW
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">
              AKSI CEPAT
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                title="Tambah Atlit Baru"
                description="Daftarkan atlit baru ke dalam sistem dengan data lengkap"
                icon={Plus}
                color="#990D35"
                onClick={() => alert('Navigate to Tambah Atlit')}
              />
              <QuickActionCard
                title="Kelola Data Atlit"
                description="Lihat, edit, dan kelola semua data atlit yang terdaftar"
                icon={Users}
                color="#3B82F6"
                onClick={() => alert('Navigate to Data Atlit')}
              />
              <QuickActionCard
                title="Data Dojang"
                description="Kelola informasi dojang dan lokasi pelatihan"
                icon={Home}
                color="#10B981"
                onClick={() => alert('Navigate to Data Dojang')}
              />
              <QuickActionCard
                title="Data Kompetisi"
                description="Kelola jadwal dan informasi kompetisi taekwondo"
                icon={Trophy}
                color="#F59E0B"
                onClick={() => alert('Navigate to Data Kompetisi')}
              />
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">
              AKTIVITAS TERBARU
            </h2>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
                      <div 
                        className="p-3 rounded-xl flex-shrink-0"
                        style={{ 
                          backgroundColor: activity.type === 'atlit' ? '#990D3515' : 
                                          activity.type === 'kompetisi' ? '#F59E0B15' : '#10B98115'
                        }}
                      >
                        <Icon 
                          size={18} 
                          style={{ color: activity.type === 'atlit' ? '#990D35' : 
                                         activity.type === 'kompetisi' ? '#F59E0B' : '#10B981' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 mb-1 leading-snug">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="w-full mt-6 text-center py-3 text-sm font-semibold rounded-xl transition-all duration-200 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                Lihat Semua Aktivitas
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Competitions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
              KOMPETISI MENDATANG
            </h2>
            <button 
              onClick={() => alert('Navigate to Data Kompetisi')}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              Lihat Semua
              <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingCompetitions.map((comp) => (
              <div key={comp.id} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-xl bg-amber-100 group-hover:scale-110 transition-transform duration-300">
                    <Trophy size={28} className="text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold px-4 py-2 rounded-full bg-green-100 text-green-700">
                    Mendatang
                  </span>
                </div>
                
                <h3 className="font-bold text-xl mb-4 text-gray-900 leading-tight">
                  {comp.name}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Calendar size={16} className="text-amber-600" />
                    </div>
                    <span className="font-medium">{comp.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <MapPin size={16} className="text-amber-600" />
                    </div>
                    <span className="font-medium">{comp.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Users size={16} className="text-amber-600" />
                    </div>
                    <span className="font-medium">{comp.participants} atlit terdaftar</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => alert('Navigate to Data Kompetisi')}
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:-translate-y-1"
                >
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 tracking-wide">
              PERFORMA SISTEM
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistem berjalan normal
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-red-100">
                  <span className="text-2xl font-bold text-red-600 font-mono">
                    {dashboardData.totalAtlit}
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                Total Atlit
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Terdaftar aktif
              </p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-blue-100">
                  <span className="text-2xl font-bold text-blue-600 font-mono">
                    {dashboardData.totalDojang}
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                Total Dojang
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Cabang terdaftar
              </p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-amber-100">
                  <span className="text-2xl font-bold text-amber-600 font-mono">
                    {dashboardData.totalKompetisi}
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                Total Event
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Tahun ini
              </p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-green-100">
                  <span className="text-xl font-bold text-green-600 font-mono">
                    +{dashboardData.pertumbuhanAtlet}%
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                Pertumbuhan
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Bulan ini
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;