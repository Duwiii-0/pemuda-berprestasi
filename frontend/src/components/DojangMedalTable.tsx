import React, { useState } from 'react';
import { Trophy, Download, Save, Medal, Award } from 'lucide-react';

// Fungsi untuk menghitung medali per dojang dari data leaderboard
const calculateDojangMedals = (leaderboard: any) => {
  const dojangMedals: Record<string, { gold: number; silver: number; bronze: number }> = {};

  // Hitung Gold
  leaderboard.gold?.forEach((participant: any) => {
    const dojang = participant.dojo || 'Unknown';
    if (!dojangMedals[dojang]) {
      dojangMedals[dojang] = { gold: 0, silver: 0, bronze: 0 };
    }
    dojangMedals[dojang].gold += 1;
  });

  // Hitung Silver
  leaderboard.silver?.forEach((participant: any) => {
    const dojang = participant.dojo || 'Unknown';
    if (!dojangMedals[dojang]) {
      dojangMedals[dojang] = { gold: 0, silver: 0, bronze: 0 };
    }
    dojangMedals[dojang].silver += 1;
  });

  // Hitung Bronze
  leaderboard.bronze?.forEach((participant: any) => {
    const dojang = participant.dojo || 'Unknown';
    if (!dojangMedals[dojang]) {
      dojangMedals[dojang] = { gold: 0, silver: 0, bronze: 0 };
    }
    dojangMedals[dojang].bronze += 1;
  });

  return dojangMedals;
};

// Fungsi untuk sort dojang berdasarkan medali (Gold > Silver > Bronze)
const sortDojangsByMedals = (dojangMedals: Record<string, any>) => {
  return Object.entries(dojangMedals)
    .map(([dojang, medals]) => ({
      dojang,
      ...medals,
      total: medals.gold + medals.silver + medals.bronze
    }))
    .sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });
};

// Fungsi untuk export ke CSV
const exportToCSV = (sortedDojangs: any[], eventName: string) => {
  const headers = ['Peringkat', 'Nama Dojang', 'Emas', 'Perak', 'Perunggu', 'Total'];
  const rows = sortedDojangs.map((item, index) => [
    index + 1,
    item.dojang,
    item.gold,
    item.silver,
    item.bronze,
    item.total
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Medal_Tally_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fungsi untuk export ke JSON
const exportToJSON = (sortedDojangs: any[], eventName: string) => {
  const data = {
    event: eventName,
    generatedAt: new Date().toISOString(),
    medalTally: sortedDojangs
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Medal_Tally_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Component untuk Dojang Medal Table
const DojangMedalTable: React.FC<{
  leaderboard: any;
  eventName: string;
  onSave?: (data: any[]) => Promise<void>;
}> = ({ leaderboard, eventName, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const dojangMedals = calculateDojangMedals(leaderboard);
  const sortedDojangs = sortDojangsByMedals(dojangMedals);

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(sortedDojangs);
      setSavedMessage('Data berhasil disimpan!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('Gagal menyimpan data');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border-2 overflow-hidden" style={{ borderColor: '#990D35' }}>
        {/* Header with Subtle Design */}
        <div className="relative px-4 sm:px-6 py-5 sm:py-6 border-b-2" style={{ 
          backgroundColor: '#FAFAFA',
          borderColor: '#E5E7EB' 
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: '#FFF5F7' }}>
                <Trophy size={24} className="sm:w-7 sm:h-7" style={{ color: '#990D35' }} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-wide" style={{ color: '#990D35' }}>
                  PEROLEHAN MEDALI PER DOJANG
                </h3>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6B7280' }}>
                  {eventName}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:scale-105"
                  style={{ backgroundColor: '#10B981', color: 'white' }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span className="hidden sm:inline">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span className="hidden sm:inline">Simpan</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => exportToCSV(sortedDojangs, eventName)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all hover:shadow-lg hover:scale-105"
                style={{ backgroundColor: '#6366F1', color: 'white' }}
              >
                <Download size={16} />
                <span>CSV</span>
              </button>
            </div>
          </div>
          
          {/* Save Message */}
          {savedMessage && (
            <div className={`mt-3 p-3 rounded-lg text-center text-xs sm:text-sm font-medium ${
              savedMessage.includes('berhasil') 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {savedMessage}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  <div className="flex items-center gap-2">
                    <span>Peringkat</span>
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  Nama Dojang
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Emas</span>
                  </div>
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Perak</span>
                  </div>
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Perunggu</span>
                  </div>
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2" style={{ color: '#374151', borderColor: '#E5E7EB' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedDojangs.map((item, index) => (
                <tr 
                  key={item.dojang}
                  className="transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: index === 0 
                      ? 'rgba(255, 215, 0, 0.08)' 
                      : index === 1 
                      ? 'rgba(192, 192, 192, 0.08)' 
                      : index === 2 
                      ? 'rgba(205, 127, 50, 0.08)' 
                      : 'white'
                  }}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {index < 3 && (
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-md`} style={{
                          background: index === 0 
                            ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' 
                            : index === 1 
                            ? 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)' 
                            : 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)'
                        }}>
                          {index + 1}
                        </div>
                      )}
                      {index >= 3 && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2" style={{ 
                          borderColor: '#D1D5DB', 
                          color: '#6B7280',
                          backgroundColor: '#F9FAFB'
                        }}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className="font-bold text-sm sm:text-base" style={{ color: '#050505' }}>
                      {item.dojang}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                    <span 
                      className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-transform hover:scale-105"
                      style={{ 
                        background: item.gold > 0 
                          ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' 
                          : '#F3F4F6',
                        color: item.gold > 0 ? 'white' : '#9CA3AF'
                      }}
                    >
                      {item.gold}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                    <span 
                      className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-transform hover:scale-105"
                      style={{ 
                        background: item.silver > 0 
                          ? 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)' 
                          : '#F3F4F6',
                        color: item.silver > 0 ? 'white' : '#9CA3AF'
                      }}
                    >
                      {item.silver}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                    <span 
                      className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-transform hover:scale-105"
                      style={{ 
                        background: item.bronze > 0 
                          ? 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' 
                          : '#F3F4F6',
                        color: item.bronze > 0 ? 'white' : '#9CA3AF'
                      }}
                    >
                      {item.bronze}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                    <span 
                      className="inline-flex items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] px-4 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-md"
                      style={{ 
                        backgroundColor: '#990D35',
                        color: 'white'
                      }}
                    >
                      {item.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ 
                backgroundColor: '#F3F4F6',
                borderTop: '2px solid #E5E7EB'
              }}>
                <td colSpan={2} className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ color: '#374151' }}>
                  Total Keseluruhan
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm" style={{ 
                    background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                    color: 'white'
                  }}>
                    {sortedDojangs.reduce((sum, item) => sum + item.gold, 0)}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm" style={{ 
                    background: 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)',
                    color: 'white'
                  }}>
                    {sortedDojangs.reduce((sum, item) => sum + item.silver, 0)}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-3 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm" style={{ 
                    background: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
                    color: 'white'
                  }}>
                    {sortedDojangs.reduce((sum, item) => sum + item.bronze, 0)}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] px-4 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-md" style={{ 
                    backgroundColor: '#990D35',
                    color: 'white'
                  }}>
                    {sortedDojangs.reduce((sum, item) => sum + item.total, 0)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Empty State */}
        {sortedDojangs.length === 0 && (
          <div className="p-12 sm:p-16 text-center">
            <div className="inline-flex p-4 sm:p-6 rounded-full bg-red-50 mb-4">
              <Medal size={48} className="sm:w-16 sm:h-16" style={{ color: '#990D35', opacity: 0.3 }} />
            </div>
            <p className="text-base sm:text-lg font-medium mb-2" style={{ color: '#990D35' }}>
              Belum Ada Data Medali
            </p>
            <p className="text-xs sm:text-sm" style={{ color: '#050505', opacity: 0.5 }}>
              Data perolehan medali akan ditampilkan setelah pertandingan selesai
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Export helper functions untuk digunakan di komponen lain
export { calculateDojangMedals, sortDojangsByMedals, exportToCSV, exportToJSON };

// Export komponen utama
export default DojangMedalTable;