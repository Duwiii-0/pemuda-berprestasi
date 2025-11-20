// src/pages/admin/Reports.tsx
import React, { useState } from 'react';
import { 
  Download, 
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Trophy,
  FileSpreadsheet
} from 'lucide-react';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('all');

  const reportTypes = [
    { id: 'peserta', label: 'Laporan Peserta', icon: Users, color: '#990D35' },
    { id: 'dojang', label: 'Laporan Dojang', icon: Trophy, color: '#F5B700' },
    { id: 'statistik', label: 'Laporan Statistik', icon: BarChart3, color: '#050505' },
    { id: 'aktivitas', label: 'Laporan Aktivitas', icon: TrendingUp, color: '#990D35' }
  ];

  const quickStats = [
    { label: 'Total Peserta', value: '1,247', change: '+12%', color: '#990D35' },
    { label: 'Total Dojang', value: '89', change: '+5%', color: '#F5B700' },
    { label: 'Peserta Aktif', value: '892', change: '+8%', color: '#050505' },
    { label: 'Validasi Pending', value: '23', change: '-15%', color: '#990D35' }
  ];

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: '#F5FBEF', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 
            className="font-inter font-bold"
            style={{ fontSize: '32px', color: '#050505' }}
          >
            Laporan & Statistik
          </h1>
          <p 
            className="font-inter mt-1"
            style={{ fontSize: '16px', color: '#050505', opacity: '0.7' }}
          >
            Kelola dan unduh laporan sistem
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-xl border font-inter"
            style={{ 
              borderColor: '#990D35',
              backgroundColor: '#F5FBEF',
              color: '#050505'
            }}
          >
            <option value="week">Minggu ini</option>
            <option value="month">Bulan ini</option>
            <option value="quarter">Kuartal ini</option>
            <option value="year">Tahun ini</option>
          </select>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-inter font-medium transition-all duration-300 hover:shadow-md"
            style={{ 
              backgroundColor: '#990D35',
              color: '#F5FBEF'
            }}
          >
            <Download size={16} />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div 
            key={index}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${stat.color}20` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="font-inter font-medium"
                  style={{ fontSize: '14px', color: '#050505', opacity: '0.7' }}
                >
                  {stat.label}
                </p>
                <p 
                  className="font-inter font-bold mt-1"
                  style={{ fontSize: '24px', color: '#050505' }}
                >
                  {stat.value}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <BarChart3 size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="mt-3">
              <span 
                className="font-inter font-medium text-sm"
                style={{ color: stat.change.startsWith('+') ? '#22c55e' : '#ef4444' }}
              >
                {stat.change}
              </span>
              <span 
                className="font-inter text-sm ml-1"
                style={{ color: '#050505', opacity: '0.5' }}
              >
                vs bulan lalu
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div 
            key={report.id}
            className="p-6 rounded-xl shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md"
            style={{ 
              backgroundColor: '#FFFFFF',
              border: selectedReport === report.id ? `2px solid ${report.color}` : '1px solid #00000010'
            }}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${report.color}15` }}
                >
                  <report.icon size={24} style={{ color: report.color }} />
                </div>
                <div>
                  <h3 
                    className="font-inter font-semibold"
                    style={{ fontSize: '18px', color: '#050505' }}
                  >
                    {report.label}
                  </h3>
                  <p 
                    className="font-inter mt-1"
                    style={{ fontSize: '14px', color: '#050505', opacity: '0.6' }}
                  >
                    Generate laporan {report.label.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-lg transition-all duration-300 hover:shadow-sm"
                  style={{ backgroundColor: `${report.color}15`, color: report.color }}
                >
                  <FileSpreadsheet size={16} />
                </button>
                <button 
                  className="p-2 rounded-lg transition-all duration-300 hover:shadow-sm"
                  style={{ backgroundColor: `${report.color}15`, color: report.color }}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span 
                  className="font-inter text-sm"
                  style={{ color: '#050505', opacity: '0.6' }}
                >
                  Last generated:
                </span>
                <span 
                  className="font-inter text-sm font-medium"
                  style={{ color: '#050505' }}
                >
                  2 hari lalu
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="font-inter text-sm"
                  style={{ color: '#050505', opacity: '0.6' }}
                >
                  Size:
                </span>
                <span 
                  className="font-inter text-sm font-medium"
                  style={{ color: '#050505' }}
                >
                  2.4 MB
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="p-6 rounded-xl shadow-sm"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="font-inter font-semibold"
              style={{ fontSize: '18px', color: '#050505' }}
            >
              Tren Pendaftaran
            </h3>
            <PieChart size={20} style={{ color: '#990D35' }} />
          </div>
          <div 
            className="h-64 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#F5FBEF' }}
          >
            <p 
              className="font-inter"
              style={{ color: '#050505', opacity: '0.5' }}
            >
              Chart akan ditampilkan di sini
            </p>
          </div>
        </div>

        <div 
          className="p-6 rounded-xl shadow-sm"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="font-inter font-semibold"
              style={{ fontSize: '18px', color: '#050505' }}
            >
              Distribusi Dojang
            </h3>
            <BarChart3 size={20} style={{ color: '#F5B700' }} />
          </div>
          <div 
            className="h-64 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#F5FBEF' }}
          >
            <p 
              className="font-inter"
              style={{ color: '#050505', opacity: '0.5' }}
            >
              Chart akan ditampilkan di sini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;