// src/services/adminService.ts
import { apiClient } from '../config/api';

export const adminService = {
  // Atlet
  getPendingAtlets: () => apiClient.get('/admin/atlets/pending'),
  validateAtlet: (id: number, status: string) => 
    apiClient.post(`/admin/atlets/${id}/validate`, { status }),

  // Dojang
  getPendingDojangs: () => apiClient.get('/admin/dojangs/pending'),
  validateDojang: (id: number, status: string) =>
    apiClient.post(`/admin/dojangs/${id}/validate`, { status }),

  // Users
  getUsers: () => apiClient.get('/admin/users'),
  updateUser: (id: number, data: any) =>
    apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) =>
    apiClient.delete(`/admin/users/${id}`),
  createUser: (data: any) =>
    apiClient.post('/admin/users', data),

  // Stats
  getStats: () => apiClient.get('/admin/stats'),

  // Reports
  generateReport: (type: string, filters: any) =>
    apiClient.post('/admin/reports/generate', { type, filters })
};