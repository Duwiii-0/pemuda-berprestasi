import React, { useState, useEffect } from 'react';
import { Trophy, Download, Save, Medal } from 'lucide-react';

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
  link.setAttribute('download', `Medal_Tally_${eventName}_${Date.now()}.csv`);
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
  link.setAttribute('download', `Medal_Tally_${eventName}_${Date.now()}.json`);
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
      setSavedMessage('✅ Data berhasil disimpan!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('❌ Gagal menyimpan data');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg border-2" style={{ borderColor: '#990D35' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b-2" style={{ backgroundColor: '#FFF5F5', borderColor: '#990D35' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Medal size={28} style={{ color: '#990D35' }} />
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#990D35' }}>
                  PEROLEHAN MEDALI PER DOJANG
                </h3>
                <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                  {eventName}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: '#10B981', color: 'white' }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => exportToCSV(sortedDojangs, eventName)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#6366F1', color: 'white' }}
              >
                <Download size={16} />
                <span>CSV</span>
              </button>
              
              <button
                onClick={() => exportToJSON(sortedDojangs, eventName)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#990D35', color: 'white' }}
              >
                <Download size={16} />
                <span>JSON</span>
              </button>
            </div>
          </div>
          
          {/* Save Message */}
          {savedMessage && (
            <div className="mt-3 p-2 rounded-lg text-center text-sm font-medium" style={{
              backgroundColor: savedMessage.includes('✅') ? '#D1FAE5' : '#FEE2E2',
              color: savedMessage.includes('✅') ? '#065F46' : '#991B1B'
            }}>
              {savedMessage}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#FFF5F5' }}>
                <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#990D35' }}>
                  Peringkat
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#990D35' }}>
                  Nama Dojang
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: '#990D35' }}>
                  🥇 Emas
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: '#990D35' }}>
                  🥈 Perak
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: '#990D35' }}>
                  🥉 Perunggu
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: '#990D35' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDojangs.map((item, index) => (
                <tr 
                  key={item.dojang}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ 
                    backgroundColor: index < 3 ? 'rgba(245, 183, 0, 0.05)' : 'transparent'
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-xl">🥇</span>}
                      {index === 1 && <span className="text-xl">🥈</span>}
                      {index === 2 && <span className="text-xl">🥉</span>}
                      <span className="font-bold" style={{ color: '#050505' }}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: '#050505' }}>
                      {item.dojang}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded-full font-bold text-sm"
                      style={{ 
                        backgroundColor: item.gold > 0 ? '#FFFBEA' : '#F5F5F5',
                        color: item.gold > 0 ? '#F5B700' : '#9CA3AF'
                      }}
                    >
                      {item.gold}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded-full font-bold text-sm"
                      style={{ 
                        backgroundColor: item.silver > 0 ? '#F5F5F5' : '#FAFAFA',
                        color: item.silver > 0 ? '#9CA3AF' : '#D1D5DB'
                      }}
                    >
                      {item.silver}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded-full font-bold text-sm"
                      style={{ 
                        backgroundColor: item.bronze > 0 ? '#FFF8F0' : '#FAFAFA',
                        color: item.bronze > 0 ? '#CD7F32' : '#D1D5DB'
                      }}
                    >
                      {item.bronze}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className="inline-block px-4 py-1 rounded-full font-bold"
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
              <tr style={{ backgroundColor: '#FFF5F5', fontWeight: 'bold' }}>
                <td colSpan={2} className="px-4 py-3 text-right" style={{ color: '#990D35' }}>
                  TOTAL KESELURUHAN:
                </td>
                <td className="px-4 py-3 text-center" style={{ color: '#F5B700' }}>
                  {sortedDojangs.reduce((sum, item) => sum + item.gold, 0)}
                </td>
                <td className="px-4 py-3 text-center" style={{ color: '#9CA3AF' }}>
                  {sortedDojangs.reduce((sum, item) => sum + item.silver, 0)}
                </td>
                <td className="px-4 py-3 text-center" style={{ color: '#CD7F32' }}>
                  {sortedDojangs.reduce((sum, item) => sum + item.bronze, 0)}
                </td>
                <td className="px-4 py-3 text-center" style={{ color: '#990D35' }}>
                  {sortedDojangs.reduce((sum, item) => sum + item.total, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Empty State */}
        {sortedDojangs.length === 0 && (
          <div className="p-12 text-center">
            <Trophy size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
              Belum ada data medali
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