// src/pages/admin/AdminStats.tsx
import React, { useState, useEffect } from 'react';
import { Users, Trophy, Building2, Activity, TrendingUp, Loader } from 'lucide-react';
import { apiClient } from "../../config/api";

interface Stats {
  totalUsers: number;
  totalAtlets: number;
  totalDojangs: number;
  totalKompetisi: number;
  pendingValidations: number;
  recentActivity: ActivityItem[];
  userGrowth: GrowthData[];
  atletByCategory: CategoryData[];
}

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

interface GrowthData {
  date: string;
  count: number;
}

interface CategoryData {
  category: string;
  count: number;
}

// Admin Service untuk mengambil stats
const adminService = {
  getStats: async (): Promise<Stats> => {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      throw {
        data: {
          message: error.response?.data?.message || 'Terjadi kesalahan saat mengambil data'
        }
      };
    }
  }
};

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.data?.message || 'Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    color 
  }: { 
    icon: React.ComponentType<any>, 
    title: string, 
    value: number, 
    color: string 
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value.toLocaleString('id-ID')}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-gray-600">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <Activity className="mr-2" size={20} />
            <div>
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
          <button 
            onClick={fetchStats}
            className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Statistik</h1>
        <p className="text-gray-600">Overview sistem dan aktivitas terkini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total User"
          value={stats?.totalUsers || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Trophy}
          title="Total Atlet"
          value={stats?.totalAtlets || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={Building2}
          title="Total Dojang"
          value={stats?.totalDojangs || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={Activity}
          title="Pending Validasi"
          value={stats?.pendingValidations || 0}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Aktivitas Terkini</h2>
            <Activity size={20} className="text-gray-400" />
          </div>
          
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                    <Activity size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <p className="text-xs text-gray-600">oleh {activity.user}</p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity size={32} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada aktivitas terkini</p>
              </div>
            )}
          </div>
        </div>

        {/* Atlet by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Atlet per Kategori</h2>
            <Trophy size={20} className="text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {stats?.atletByCategory && stats.atletByCategory.length > 0 ? (
              stats.atletByCategory.map((category, index) => (
                <div key={category.category} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index % 4 === 0 ? 'bg-blue-500' : 
                      index % 4 === 1 ? 'bg-green-500' : 
                      index % 4 === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm text-gray-700">{category.category}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{category.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada data kategori atlet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Growth Chart Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Pertumbuhan User</h2>
          <TrendingUp size={20} className="text-gray-400" />
        </div>
        
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">Chart Pertumbuhan User</p>
            <p className="text-sm">Grafik akan ditampilkan setelah integrasi library chart</p>
            {stats?.userGrowth && stats.userGrowth.length > 0 && (
              <p className="text-xs mt-2 text-blue-600">
                {stats.userGrowth.length} data points tersedia
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Data terakhir diperbarui: {new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
  );
};

export default AdminStats;