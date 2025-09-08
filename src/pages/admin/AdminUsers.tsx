// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import { Search, Trash2, UserPlus, Loader, AlertTriangle, Users, Eye, Ban, CheckCircle } from 'lucide-react';

interface User {
  id_akun: number;
  email: string;
  role: 'ADMIN' | 'PELATIH';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at?: string;
  admin?: {
    nama_admin: string;
  };
  pelatih?: {
    nama_pelatih: string;
    dojang?: {
      nama_dojang: string;
    };
  };
}

interface UserResponse {
  users: User[];
  total: number;
  page?: number;
  limit?: number;
}

// Admin Service untuk mengambil users
const adminService = {
  getUsers: async (): Promise<User[]> => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UserResponse = await response.json();
      return data.users || data as any; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Error fetching users:');
      
      // Return mock data for development
      const mockUsers: User[] = [
        {
          id_akun: 1,
          email: 'admin@taekwondo.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          created_at: '2024-01-15T08:00:00Z',
          admin: {
            nama_admin: 'Super Admin'
          }
        },
        {
          id_akun: 2,
          email: 'pelatih1@dojang.com',
          role: 'PELATIH',
          status: 'ACTIVE',
          created_at: '2024-02-10T10:30:00Z',
          pelatih: {
            nama_pelatih: 'John Doe',
            dojang: {
              nama_dojang: 'Dojang Taekwondo Garuda'
            }
          }
        },
        {
          id_akun: 3,
          email: 'pelatih2@dojang.com',
          role: 'PELATIH',
          status: 'INACTIVE',
          created_at: '2024-01-20T14:15:00Z',
          pelatih: {
            nama_pelatih: 'Jane Smith',
            dojang: {
              nama_dojang: 'Dojang Champions'
            }
          }
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (error.message.includes('network') || error.name === 'TypeError') {
        throw {
          data: {
            message: 'Tidak dapat terhubung ke server. Menggunakan data contoh.'
          }
        };
      }
      
      return mockUsers;
    }
  },

  updateUserStatus: async (userId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
    } catch (error: any) {
      throw {
        data: {
          message: error.message || 'Gagal mengupdate status user'
        }
      };
    }
  },

  deleteUser: async (userId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
    } catch (error: any) {
      throw {
        data: {
          message: error.message || 'Gagal menghapus user'
        }
      };
    }
  }
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'PELATIH'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:');
      setError(err.data?.message || 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      setActionLoading(userId);
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      await adminService.updateUserStatus(userId, newStatus);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id_akun === userId 
          ? { ...user, status: newStatus }
          : user
      ));
      
    } catch (err: any) {
      console.error('Error updating user status:');
      alert(err.data?.message || 'Gagal mengupdate status user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminService.deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id_akun !== userId));
      
    } catch (err: any) {
      console.error('Error deleting user:');
      alert(err.data?.message || 'Gagal menghapus user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const userName = user.admin?.nama_admin || user.pelatih?.nama_pelatih || '';
    const dojangName = user.pelatih?.dojang?.nama_dojang || '';
    
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dojangName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800 border border-purple-200',
      PELATIH: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[role as keyof typeof styles]}`}>
        {role === 'ADMIN' ? 'Admin' : 'Pelatih'}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 border border-green-200',
      INACTIVE: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status as keyof typeof styles]}`}>
        {status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-gray-600">Memuat data user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-gray-600" size={24} />
          <h1 className="text-3xl font-bold text-gray-800">Manajemen User</h1>
        </div>
        <p className="text-gray-600">Kelola semua user sistem</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={fetchUsers}
              className="ml-4 text-red-800 underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, atau dojang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="PELATIH">Pelatih</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-gray-600">
            Menampilkan <span className="font-semibold">{filteredUsers.length}</span> dari <span className="font-semibold">{users.length}</span> user
          </p>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus size={16} />
            Tambah User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Role</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Dojang</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Bergabung</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userName = user.admin?.nama_admin || user.pelatih?.nama_pelatih || 'N/A';
                const isLoading = actionLoading === user.id_akun;
                
                return (
                  <tr key={user.id_akun} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                    <td className="py-4 px-6">{getStatusBadge(user.status)}</td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">
                        {user.pelatih?.dojang?.nama_dojang || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button 
                          onClick={() => handleStatusToggle(user.id_akun, user.status)}
                          disabled={isLoading}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'ACTIVE' 
                              ? 'text-orange-600 hover:bg-orange-50' 
                              : 'text-green-600 hover:bg-green-50'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={user.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {isLoading ? (
                            <Loader size={16} className="animate-spin" />
                          ) : user.status === 'ACTIVE' ? (
                            <Ban size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteUser(user.id_akun, userName)}
                          disabled={isLoading}
                          className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Hapus User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Tidak ada user yang ditemukan</p>
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('ALL');
                  setFilterStatus('ALL');
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Bersihkan filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-sm text-blue-700">Admin</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'PELATIH').length}</p>
          <p className="text-sm text-green-700">Pelatih</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'ACTIVE').length}</p>
          <p className="text-sm text-emerald-700">Aktif</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'INACTIVE').length}</p>
          <p className="text-sm text-red-700">Nonaktif</p>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;