import React, { useState, useEffect } from 'react';
import { Trophy, Edit3, Save, Medal, CheckCircle, ArrowLeft, AlertTriangle, RefreshCw, Download, Shuffle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/authContext'; // ⬅️ TAMBAHKAN INI

interface Peserta {
  id_peserta_kompetisi: number;
  id_atlet?: number;
  is_team: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  atlet?: {
    id_atlet: number;
    nama_atlet: string;
    dojang: {
      nama_dojang: string;
    };
  };
  anggota_tim?: {
    atlet: {
      nama_atlet: string;
    };
  }[];
}

interface Match {
  id_match: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  skor_a: number;
  skor_b: number;
  peserta_a?: Peserta;
  peserta_b?: Peserta;
  venue?: {
    nama_venue: string;
  };
}

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: 'KYORUGI' | 'POOMSAE';
  kategori_event: {
    nama_kategori: string;
  };
  kelompok?: {
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    nama_kelas: string;
    batas_min: number;
    batas_max: number;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  };
  poomsae?: {
    nama_kelas: string;
  };
  kompetisi: {
    id_kompetisi: number;
    nama_event: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    lokasi: string;
    status: 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI'; // ⬅️ TAMBAH INI
  };
  peserta_kompetisi: Peserta[];
  bagan: {
    id_bagan: number;
    match: Match[];
    drawing_seed: {
      peserta_kompetisi: Peserta;
      seed_num: number;
    }[];
  }[];
}

interface TournamentBracketProps {
  kelasData?: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
  kompetisiId?: number;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  kelasData, 
  onBack,
  apiBaseUrl = '/api',
  kompetisiId
}) => {
  const { token } = useAuth(); // ⬅️ TAMBAHKAN INI
  const [selectedKelas, setSelectedKelas] = useState<KelasKejuaraan | null>(kelasData || null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false); 
  const [deleting, setDeleting] = useState(false); 
  const [showParticipantSelection, setShowParticipantSelection] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null);
  const leaderboardRef = React.useRef<HTMLDivElement>(null);
  
  // ⬅️ TAMBAHKAN STATE MODAL INI
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    type: 'info',
    title: '',
    message: '',
  });

    // Helper function to show modal
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({
      type,
      title,
      message,
      onConfirm,
      confirmText: 'OK',
    });
    setShowModal(true);
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setModalConfig({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
    });
    setShowModal(true);
  };

  // Tambahkan setelah fungsi showConfirmation

const handleSelectParticipant = (participantId: number) => {
  setSelectedParticipants(prev => {
    const newSet = new Set(prev);
    if (newSet.has(participantId)) {
      newSet.delete(participantId);
    } else {
      newSet.add(participantId);
    }
    return newSet;
  });
};

const handleSelectAll = () => {
  if (selectAll) {
    // Deselect all
    setSelectedParticipants(new Set());
    setSelectAll(false);
  } else {
    // Select all approved participants
    const allIds = new Set(
      approvedParticipants.map(p => p.id_peserta_kompetisi)
    );
    setSelectedParticipants(allIds);
    setSelectAll(true);
  }
};

const openParticipantSelection = () => {
  // ⭐ BYE SEKARANG OPSIONAL - bisa 0
  const total = approvedParticipants.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(total)));
  const byesNeeded = nextPowerOf2 - total;
  
  // Clear previous selection
  setSelectedParticipants(new Set());
  setSelectAll(false);
  
  console.log(`📊 Total: ${total}, Bracket size: ${nextPowerOf2}, BYE recommended: ${byesNeeded}`);
  
  setShowParticipantSelection(true);
};

  const isPemula = selectedKelas?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
  
  console.log('📊 Category type:', isPemula ? 'PEMULA' : 'PRESTASI');

  // Fetch competition class data from database
  const fetchKelasData = async (id_kelas_kejuaraan: number) => {
    try {
      setLoading(true);
      
      if (!selectedKelas?.kompetisi?.id_kompetisi) {
        console.error('❌ Kompetisi ID not found');
        return;
      }

      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;

      // Fetch bracket data if exists
      await fetchBracketData(kompetisiId, id_kelas_kejuaraan);
      
    } catch (error) {
      console.error('❌ Error fetching kelas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - replace with your actual API calls
  useEffect(() => {
    if (!kelasData && !selectedKelas) {
      // If no data provided, component will show "Pilih Kelas Kejuaraan" message
      console.log('⚠️ No kelas data provided. Waiting for selection...');
    }
  }, [kelasData, selectedKelas]);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

const generateBracket = async (shuffle: boolean = false) => {
  if (!selectedKelas) return;
  
  // ⭐ VALIDASI: Berbeda untuk PEMULA vs PRESTASI
  if (isPemula) {
    // Pemula: any number of BYEs is OK
    console.log(`🥋 PEMULA: Generating with ${selectedParticipants.size} BYE participants`);
  } else {
    // Prestasi: 0 (no BYE) or exact recommended count
    const recommended = Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length;
    
    if (selectedParticipants.size !== 0 && selectedParticipants.size !== recommended) {
      showNotification(
        'warning',
        'Jumlah BYE Tidak Sesuai',
        `Pilih 0 untuk skip BYE atau ${recommended} peserta sesuai rekomendasi`,
        () => setShowModal(false)
      );
      return;
    }
    
    console.log(`🏆 PRESTASI: Generating with ${selectedParticipants.size} BYE participants`);
  }
  
  setLoading(true);
  setShowParticipantSelection(false);
  
  try {
    const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
    const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

    const endpoint = `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        kelasKejuaraanId: kelasKejuaraanId,
        byeParticipantIds: selectedParticipants.size > 0 ? Array.from(selectedParticipants) : []
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate bracket');
    }

    const result = await response.json();
    console.log('✅ Bracket generated:', result);

    await fetchBracketData(kompetisiId, kelasKejuaraanId);
    
    showNotification(
      'success',
      'Berhasil!',
      `Bracket berhasil dibuat${selectedParticipants.size > 0 ? ` dengan ${selectedParticipants.size} BYE` : ' tanpa BYE'}!`,
      () => setShowModal(false)
    );
    
  } catch (error: any) {
    console.error('❌ Error generating bracket:', error);
    showNotification(
      'error',
      'Gagal Membuat Bracket',
      error.message || 'Terjadi kesalahan saat membuat bracket.',
      () => setShowModal(false)
    );
  } finally {
    setLoading(false);
  }
};

  const fetchBracketData = async (kompetisiId: number, kelasKejuaraanId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Bracket not found - not an error, just not generated yet
          console.log('ℹ️ Bracket not yet generated for this class');
          setBracketGenerated(false);
          setMatches([]);
          return;
        }
        throw new Error('Failed to fetch bracket data');
      }

      const result = await response.json();
      console.log('📊 Bracket data fetched:', result);

      // Transform API response to match component interface
      if (result.data && result.data.matches) {
        const transformedMatches: Match[] = result.data.matches.map((m: any) => ({
          id_match: m.id,
          ronde: m.round,
          id_peserta_a: m.participant1?.id,
          id_peserta_b: m.participant2?.id,
          skor_a: m.scoreA || 0,
          skor_b: m.scoreB || 0,
          peserta_a: m.participant1 ? transformParticipantFromAPI(m.participant1) : undefined,
          peserta_b: m.participant2 ? transformParticipantFromAPI(m.participant2) : undefined,
          venue: m.venue ? { nama_venue: m.venue } : undefined
        }));

        setMatches(transformedMatches);
        setBracketGenerated(true);
        console.log(`✅ Loaded ${transformedMatches.length} matches`);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transform participant data from API format
   */
  const transformParticipantFromAPI = (participant: any): Peserta => {
    if (participant.isTeam) {
      return {
        id_peserta_kompetisi: participant.id,
        is_team: true,
        status: 'APPROVED',
        anggota_tim: participant.teamMembers?.map((name: string) => ({
          atlet: { nama_atlet: name }
        })) || []
      };
    } else {
      return {
        id_peserta_kompetisi: participant.id,
        id_atlet: participant.atletId,
        is_team: false,
        status: 'APPROVED',
        atlet: {
          id_atlet: participant.atletId || 0,
          nama_atlet: participant.name,
          dojang: {
            nama_dojang: participant.dojang || ''
          }
        }
      };
    }
  };

  // Save bracket to database
    const saveBracket = async () => {
    if (!selectedKelas || !bracketGenerated) return;
    
    setSaving(true);
    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

      // Note: Bracket is already saved when generated via API
      // This button can be used to manually trigger save or update
      console.log('ℹ️ Bracket is already saved via API');
      
      showNotification(
        'info',
        'Informasi',
        'Bracket sudah tersimpan di database!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error saving bracket:', error);
      showNotification(
        'error',
        'Gagal Menyimpan',
        'Gagal menyimpan bracket. Silakan coba lagi.',
        () => setShowModal(false)
      );
    } finally {
      setSaving(false);
    }
  };

// Clear match results (reset scores only)
const clearBracketResults = async () => {
  if (!selectedKelas) return;
  
  const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
  const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

  showConfirmation(
    'Hapus Semua Hasil Pertandingan?',
    'Semua skor akan direset ke 0. Struktur bracket tetap sama. Aksi ini tidak dapat dibatalkan.',
    async () => {
      setClearing(true);
      try {
        console.log(`🧹 Clearing results for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

        const response = await fetch(
          `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}/clear-results`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to clear results');
        }

        const result = await response.json();
        console.log('✅ Results cleared:', result);

        // Refresh bracket data
        await fetchBracketData(kompetisiId, kelasKejuaraanId);

        showNotification(
          'success',
          'Berhasil!',
          'Semua hasil pertandingan berhasil direset',
          () => setShowModal(false)
        );
      } catch (error: any) {
        console.error('❌ Error clearing results:', error);
        showNotification(
          'error',
          'Gagal Mereset Hasil',
          error.message || 'Terjadi kesalahan saat mereset hasil. Silakan coba lagi.',
          () => setShowModal(false)
        );
      } finally {
        setClearing(false);
      }
    },
    () => setShowModal(false)
  );
};

// Delete entire bracket
const deleteBracketPermanent = async () => {
  if (!selectedKelas) return;
  
  const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
  const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;
  const isSelesai = selectedKelas.kompetisi.status === 'SELESAI';

  const confirmationSteps = async () => {
    // First confirmation
    showConfirmation(
      'Hapus Bracket Turnamen?',
      'Bracket akan dihapus PERMANENT termasuk semua pertandingan dan hasil. Anda harus generate ulang dari awal. Aksi ini tidak dapat dibatalkan.',
      async () => {
        // If competition is SELESAI, show second confirmation
        if (isSelesai) {
          showConfirmation(
            '⚠️ Kompetisi Sudah Selesai!',
            'Kompetisi ini sudah berstatus SELESAI. Apakah Anda YAKIN ingin menghapus bracket? Data hasil tidak dapat dikembalikan.',
            async () => {
              await executeDeletion();
            },
            () => setShowModal(false)
          );
        } else {
          await executeDeletion();
        }
      },
      () => setShowModal(false)
    );
  };

  const executeDeletion = async () => {
    setDeleting(true);
    try {
      console.log(`🗑️ Deleting bracket for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete bracket');
      }

      const result = await response.json();
      console.log('✅ Bracket deleted:', result);

      // Reset state
      setMatches([]);
      setBracketGenerated(false);

      showNotification(
        'success',
        'Berhasil!',
        'Bracket berhasil dihapus. Anda dapat generate bracket baru.',
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error('❌ Error deleting bracket:', error);
      showNotification(
        'error',
        'Gagal Menghapus Bracket',
        error.message || 'Terjadi kesalahan saat menghapus bracket. Silakan coba lagi.',
        () => setShowModal(false)
      );
    } finally {
      setDeleting(false);
    }
  };

  confirmationSteps();
};

// Helper to convert modern color spaces (oklch, oklab, lch, lab) to rgb
const convertModernColorsToRgb = (clonedDoc: Document) => {
  // STEP 1: Inject CSS to override ALL oklch colors
  const style = clonedDoc.createElement('style');
  style.textContent = `
    * {
      color: inherit !important;
      background-color: transparent !important;
      border-color: currentColor !important;
    }
    [style*="oklch"] {
      color: rgb(0, 0, 0) !important;
      background-color: rgb(255, 255, 255) !important;
      border-color: rgb(0, 0, 0) !important;
    }
  `;
  clonedDoc.head.appendChild(style);
  
  // STEP 2: Force replace ALL computed styles
  const allElements = clonedDoc.querySelectorAll('*');
  
  allElements.forEach((el) => {
    const element = el as HTMLElement;
    const computed = clonedDoc.defaultView?.getComputedStyle(element);
    
    if (!computed) return;
    
    // Color mapping for common values
    const colorMap: Record<string, string> = {
      'oklch(0.98 0.01 106.42)': 'rgb(245, 251, 239)',
      'oklch(0.39 0.13 16.32)': 'rgb(153, 13, 53)',
      'oklch(0.80 0.13 91.23)': 'rgb(245, 183, 0)',
      'oklch(0.08 0 0)': 'rgb(5, 5, 5)',
    };
    
    // Replace function
    const replaceOklch = (value: string): string => {
      if (!value || !value.includes('oklch')) return value;
      
      // Try exact match first
      for (const [oklch, rgb] of Object.entries(colorMap)) {
        if (value.includes(oklch)) {
          return value.replace(oklch, rgb);
        }
      }
      
      // Generic replace
      return value.replace(/oklch\([^)]+\)/g, 'rgb(128, 128, 128)');
    };
    
    // Critical properties to override
    const props = [
      'color', 'backgroundColor', 'background',
      'borderColor', 'borderTopColor', 'borderRightColor', 
      'borderBottomColor', 'borderLeftColor', 'borderWidth',
      'fill', 'stroke', 'outlineColor', 'boxShadow'
    ];
    
    props.forEach(prop => {
      try {
        const value = computed.getPropertyValue(prop);
        if (value && value.includes('oklch')) {
          element.style.setProperty(prop, replaceOklch(value), 'important');
        }
      } catch (e) {
        // Ignore
      }
    });
    
    // NUCLEAR OPTION: Remove all style attributes containing oklch
    const styleAttr = element.getAttribute('style');
    if (styleAttr && styleAttr.includes('oklch')) {
      element.setAttribute('style', 
        styleAttr.replace(/oklch\([^)]+\)/g, 'rgb(128, 128, 128)')
      );
    }
    
    // Remove class if it might contain oklch
    const className = element.className;
    if (className && typeof className === 'string') {
      // Keep classes but force inline styles
      element.style.color = element.style.color || 'rgb(0, 0, 0)';
    }
  });
  
  // STEP 3: Wait for styles to apply
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 100);
  });
};

    const exportToPDF = async () => {
  if (!selectedKelas || !bracketGenerated) return;
  
  setExporting(true);
  try {
    console.log(`📄 Exporting PDF for ${isPemula ? 'PEMULA' : 'PRESTASI'} category...`);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // ========== COVER PAGE ==========
    const title = selectedKelas.kompetisi.nama_event;
    const kategori = selectedKelas.kategori_event.nama_kategori;
    const kelompok = selectedKelas.kelompok?.nama_kelompok || '';
    const kelas = selectedKelas.kelas_berat?.nama_kelas || selectedKelas.poomsae?.nama_kelas || '';
    const gender = selectedKelas.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female';
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BAGAN TURNAMEN', pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${kategori} - ${kelompok} ${gender} ${kelas}`, pdf.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text(`Competition: ${kategori}`, pdf.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
    pdf.text(`Category: ${kelompok} | Class: ${kelas}`, pdf.internal.pageSize.getWidth() / 2, 62, { align: 'center' });

if (isPemula) {
  // ========== PEMULA: CAPTURE BAGAN + LEADERBOARD ==========
  
  if (!bracketRef.current) {
    throw new Error('Bracket element not found');
  }

  // Find the matches container (left column in grid)
  const gridContainer = bracketRef.current.querySelector('.grid');
  
  if (!gridContainer) {
    throw new Error('Grid container not found');
  }

  const matchesContainer = gridContainer.querySelector('div:first-child');
  
  if (matchesContainer) {
    console.log('📸 Capturing matches container...');
    
    // Add page for PARTAI PERTANDINGAN
    pdf.addPage('a4', 'portrait');
    
    // Add styled header FIRST
    pdf.setFillColor(153, 13, 53); // #990D35
    pdf.rect(0, 0, 210, 35, 'F'); // Full width header
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('PARTAI PERTANDINGAN', 105, 15, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Semua pertandingan dalam 1 babak', 105, 25, { align: 'center' });
    
    // Reset text color
    pdf.setTextColor(5, 5, 5);
    
    // Capture matches
const matchesCanvas = await html2canvas(matchesContainer as HTMLElement, {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#F5FBEF',
  windowWidth: (matchesContainer as HTMLElement).scrollWidth,
  windowHeight: (matchesContainer as HTMLElement).scrollHeight,
  onclone: async (clonedDoc) => {
    await convertModernColorsToRgb(clonedDoc);
  }
});

    const imgWidth = 180; // Slightly smaller for better margins
    const imgHeight = (matchesCanvas.height * imgWidth) / matchesCanvas.width;
    const imgData = matchesCanvas.toDataURL('image/png', 1.0);
    
    const xOffset = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    
    // Check if image fits in one page
    const maxHeight = 245; // Max height per page (accounting for header)
    
    if (imgHeight > maxHeight) {
      // Multi-page layout
      let remainingHeight = imgHeight;
      let sourceY = 0;
      let pageNum = 0;
      
      while (remainingHeight > 0) {
        const pageHeight = Math.min(remainingHeight, maxHeight);
        const sourceHeight = (pageHeight / imgHeight) * matchesCanvas.height;
        
        if (pageNum > 0) {
          pdf.addPage('a4', 'portrait');
          // Add header on continuation pages too
          pdf.setFillColor(153, 13, 53);
          pdf.rect(0, 0, 210, 25, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text('PARTAI PERTANDINGAN (lanjutan)', 105, 15, { align: 'center' });
          pdf.setTextColor(5, 5, 5);
        }
        
        // Create cropped canvas for this page
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = matchesCanvas.width;
        croppedCanvas.height = sourceHeight;
        const ctx = croppedCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            matchesCanvas,
            0, sourceY, 
            matchesCanvas.width, sourceHeight,
            0, 0, 
            matchesCanvas.width, sourceHeight
          );
          
          const croppedData = croppedCanvas.toDataURL('image/png', 1.0);
          const yPos = pageNum === 0 ? 40 : 30;
          pdf.addImage(croppedData, 'PNG', xOffset, yPos, imgWidth, pageHeight);
        }
        
        sourceY += sourceHeight;
        remainingHeight -= pageHeight;
        pageNum++;
      }
    } else {
      // Single page
      pdf.addImage(imgData, 'PNG', xOffset, 40, imgWidth, imgHeight);
    }
  }

  // ========== LEADERBOARD PAGE ==========
  pdf.addPage('a4', 'portrait');
  
  if (!leaderboardRef.current) {
    throw new Error('Leaderboard element not found');
  }

  console.log('📸 Capturing leaderboard...');

const leaderboardCanvas = await html2canvas(leaderboardRef.current, {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#FFFFFF',
  windowWidth: leaderboardRef.current.scrollWidth,
  windowHeight: leaderboardRef.current.scrollHeight,
  onclone: async (clonedDoc) => {
    await convertModernColorsToRgb(clonedDoc);
  }
});

  const lbImgWidth = 180;
  const lbImgHeight = (leaderboardCanvas.height * lbImgWidth) / leaderboardCanvas.width;
  const lbImgData = leaderboardCanvas.toDataURL('image/png', 1.0);
  
  const lbXOffset = (pdf.internal.pageSize.getWidth() - lbImgWidth) / 2;
  
  // Add leaderboard with better positioning
  if (lbImgHeight > 270) {
    // If too tall, split into multiple pages
    let remainingHeight = lbImgHeight;
    let sourceY = 0;
    let pageNum = 0;
    
    while (remainingHeight > 0) {
      if (pageNum > 0) {
        pdf.addPage('a4', 'portrait');
      }
      
      const pageHeight = Math.min(remainingHeight, 270);
      const sourceHeight = (pageHeight / lbImgHeight) * leaderboardCanvas.height;
      
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = leaderboardCanvas.width;
      croppedCanvas.height = sourceHeight;
      const ctx = croppedCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          leaderboardCanvas,
          0, sourceY,
          leaderboardCanvas.width, sourceHeight,
          0, 0,
          leaderboardCanvas.width, sourceHeight
        );
        
        const croppedData = croppedCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(croppedData, 'PNG', lbXOffset, 15, lbImgWidth, pageHeight);
      }
      
      sourceY += sourceHeight;
      remainingHeight -= pageHeight;
      pageNum++;
    }
  } else {
    pdf.addImage(lbImgData, 'PNG', lbXOffset, 15, lbImgWidth, lbImgHeight);
  }

} else {
      // ========== PRESTASI: CAPTURE BRACKET TREE ==========
      
      pdf.addPage('a4', 'landscape');
      
      if (!bracketRef.current) {
        throw new Error('Bracket element not found');
      }
      
const canvas = await html2canvas(bracketRef.current, {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#F5FBEF',
  windowWidth: bracketRef.current.scrollWidth,
  windowHeight: bracketRef.current.scrollHeight,
  onclone: async (clonedDoc) => {
    await convertModernColorsToRgb(clonedDoc);
  }
});
      const imgWidth = 277; // A4 landscape width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const xOffset = (297 - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight);
    }

    // Generate filename
    const filename = `Bracket_${kategori}_${kelompok}_${kelas}_${gender}.pdf`.replace(/\s+/g, '_');

    // Save PDF
    pdf.save(filename);

    console.log('✅ PDF exported successfully:', filename);
    
    showNotification(
      'success',
      'Berhasil Export PDF!',
      `Bracket ${isPemula ? '(Partai + Leaderboard)' : 'Tournament'} berhasil diexport ke PDF`,
      () => setShowModal(false)
    );
    
  } catch (error: any) {
    console.error('❌ Error exporting PDF:', error);
    showNotification(
      'error',
      'Gagal Export PDF',
      error.message || 'Terjadi kesalahan saat export PDF. Silakan coba lagi.',
      () => setShowModal(false)
    );
  } finally {
    setExporting(false);
  }
};

  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.ronde === round);
  };

  const getTotalRounds = () => {
    if (!selectedKelas) return 0;
    const approvedCount = selectedKelas.peserta_kompetisi.filter(p => p.status === 'APPROVED').length;
    return Math.ceil(Math.log2(approvedCount));
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi Final';
    if (round === totalRounds - 2) return 'Quarter Final';
    return `Round ${round}`;
  };

  const getParticipantName = (peserta?: Peserta) => {
    if (!peserta) return '';
    if (peserta.is_team) {
      return peserta.anggota_tim?.map(t => t.atlet.nama_atlet).join(', ') || 'Team';
    }
    return peserta.atlet?.nama_atlet || '';
  };

  const getDojoName = (peserta?: Peserta) => {
    if (!peserta) return '';
    return peserta.atlet?.dojang.nama_dojang || '';
  };

  const generateLeaderboard = () => {
  if (!isPemula || matches.length === 0) return null;

  const leaderboard: {
    gold: { name: string; dojo: string; id: number }[];
    silver: { name: string; dojo: string; id: number }[];
    bye: { name: string; dojo: string; id: number }[];
  } = {
    gold: [],
    silver: [],
    bye: []
  };

  // Track processed participants to avoid duplicates
  const processedGold = new Set<number>();
  const processedSilver = new Set<number>();
  const processedBye = new Set<number>();

  matches.forEach(match => {
    // Check for BYE (free draw) - must have participant A but NO participant B
    if (match.peserta_a && !match.peserta_b) {
      const id = match.peserta_a.id_peserta_kompetisi;
      if (!processedBye.has(id)) {
        leaderboard.bye.push({
          name: getParticipantName(match.peserta_a),
          dojo: getDojoName(match.peserta_a),
          id: id
        });
        processedBye.add(id);
      }
      return; // Skip to next match, don't process as normal match
    }

    // Check if match has been played (has scores)
    const hasScore = match.skor_a > 0 || match.skor_b > 0;
    
    if (hasScore && match.peserta_a && match.peserta_b) {
      // Determine winner and loser
      const winner = match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b;
      const loser = match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;
      
      const winnerId = winner.id_peserta_kompetisi;
      const loserId = loser.id_peserta_kompetisi;
      
      // Add winner to gold (if not already there)
      if (!processedGold.has(winnerId) && !processedBye.has(winnerId)) {
        leaderboard.gold.push({
          name: getParticipantName(winner),
          dojo: getDojoName(winner),
          id: winnerId
        });
        processedGold.add(winnerId);
      }
      
      // Add loser to silver (if not already there and not in bye)
      if (!processedSilver.has(loserId) && !processedBye.has(loserId)) {
        leaderboard.silver.push({
          name: getParticipantName(loser),
          dojo: getDojoName(loser),
          id: loserId
        });
        processedSilver.add(loserId);
      }
    }
  });

  return leaderboard;
};

  const leaderboard = generateLeaderboard();

    const updateMatchResult = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!selectedKelas) return;

    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      
      // Determine winner based on scores
      const match = matches.find(m => m.id_match === matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const winnerId = scoreA > scoreB 
        ? match.id_peserta_a 
        : match.id_peserta_b;

      if (!winnerId) {
        throw new Error('Cannot determine winner');
      }

      console.log(`🎯 Updating match ${matchId}: ${scoreA} - ${scoreB}, winner: ${winnerId}`);

      // Call API to update match
      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/match/${matchId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            winnerId: winnerId,
            scoreA: scoreA,
            scoreB: scoreB
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update match result');
      }

      const result = await response.json();
      console.log('✅ Match updated:', result);

      // Refresh bracket data to get updated state
      await fetchBracketData(kompetisiId, selectedKelas.id_kelas_kejuaraan);

      setEditingMatch(null);
      showNotification(
        'info',
        'Informasi',
        'Informasi Match Berhasil Diperbarui!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error updating match result:', error);
      showNotification(
        'error',
        'Gagal Memperbarui',
        error.message || 'Gagal memperbarui hasil pertandingan. Silakan coba lagi.',
        () => setShowModal(false)
      );
    }
  };

  if (!selectedKelas) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="text-center">
          <Trophy size={64} style={{ color: '#990D35' }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#050505' }}>
            Pilih Kelas Kejuaraan
          </h2>
          <p style={{ color: '#050505', opacity: 0.6 }}>
            Silakan pilih kelas kejuaraan untuk melihat bracket tournament
          </p>
        </div>
      </div>
    );
  }

  const totalRounds = getTotalRounds();
  const approvedParticipants = selectedKelas.peserta_kompetisi.filter(p => p.status === 'APPROVED');

  useEffect(() => {
    if (selectedKelas && selectedKelas.kompetisi?.id_kompetisi) {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;
      
      console.log(`🔄 Loading bracket for kelas ${kelasKejuaraanId}...`);
      fetchBracketData(kompetisiId, kelasKejuaraanId);
    }
  }, [selectedKelas?.id_kelas_kejuaraan]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Header with competition info */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: '#990D35' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-black/5 transition-all"
                >
                  <ArrowLeft size={20} style={{ color: '#990D35' }} />
                </button>
              )}
              <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#990D35' }}>
                <Trophy size={32} style={{ color: '#F5FBEF' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1" style={{ color: '#050505' }}>
                  {selectedKelas.kompetisi.nama_event}
                </h1>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                  <span>Tournament date: {new Date(selectedKelas.kompetisi.tanggal_mulai).toLocaleDateString()} - {new Date(selectedKelas.kompetisi.tanggal_selesai).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{selectedKelas.kompetisi.lokasi}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">

<button
  onClick={openParticipantSelection} // ⭐ Ubah dari generateBracket(true)
  disabled={loading || approvedParticipants.length < 2}
  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
  style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
>
  {loading ? (
    <>
      <RefreshCw size={16} className="animate-spin" />
      <span>Processing...</span>
    </>
  ) : (
    <>
      <Shuffle size={16} />
      <span>{bracketGenerated ? 'Edit & Regenerate' : 'Select & Generate'}</span>
    </>
  )}
</button>

  <button
    onClick={() => generateBracket(false)}
    disabled={loading || approvedParticipants.length < 2}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
    style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
  >
    {loading ? (
      <>
        <RefreshCw size={16} className="animate-spin" />
        <span>Generating...</span>
      </>
    ) : (
      <>
        <RefreshCw size={16} />
        <span>{bracketGenerated ? 'Regenerate' : 'Generate'}</span>
      </>
    )}
  </button>
  
  {/* Clear Results Button */}
  <button
    onClick={clearBracketResults}
    disabled={!bracketGenerated || clearing}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
    style={{ backgroundColor: '#F97316', color: '#F5FBEF' }}
    title="Reset semua skor pertandingan"
  >
    {clearing ? (
      <>
        <RefreshCw size={16} className="animate-spin" />
        <span>Clearing...</span>
      </>
    ) : (
      <>
        <AlertTriangle size={16} />
        <span>Clear Results</span>
      </>
    )}
  </button>

  {/* Delete Bracket Button */}
  <button
    onClick={deleteBracketPermanent}
    disabled={!bracketGenerated || deleting}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
    style={{ backgroundColor: '#DC2626', color: '#F5FBEF' }}
    title="Hapus bracket secara permanen"
  >
    {deleting ? (
      <>
        <RefreshCw size={16} className="animate-spin" />
        <span>Deleting...</span>
      </>
    ) : (
      <>
        <AlertTriangle size={16} />
        <span>Delete Bracket</span>
      </>
    )}
  </button>
  
  <button
    onClick={saveBracket}
    disabled={!bracketGenerated || saving}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
    style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
  >
    {saving ? (
      <>
        <RefreshCw size={16} className="animate-spin" />
        <span>Saving...</span>
      </>
    ) : (
      <>
        <Save size={16} />
        <span>Save</span>
      </>
    )}
  </button>

  <button
    onClick={exportToPDF}
    disabled={!bracketGenerated || exporting}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
    style={{ backgroundColor: '#059669', color: '#F5FBEF' }}
  >
    {exporting ? (
      <>
        <RefreshCw size={16} className="animate-spin" />
        <span>Exporting...</span>
      </>
    ) : (
      <>
        <Download size={16} />
        <span>Export PDF</span>
      </>
    )}
  </button>
</div>
          </div>

          {/* Competition details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#990D35' }}>
                  {selectedKelas.kelompok?.nama_kelompok} {selectedKelas.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} {selectedKelas.kelas_berat?.nama_kelas || selectedKelas.poomsae?.nama_kelas}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.7 }}>
                  Contestants: {approvedParticipants.length}
                </p>
              </div>
              <div className="text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                Competition date: {new Date(selectedKelas.kompetisi.tanggal_mulai).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Bracket */}
      {bracketGenerated && matches.length > 0 ? (
        <div className="p-6" ref={bracketRef}>
          {isPemula ? (
            /* ========== PEMULA LAYOUT ========== */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: All Matches */}
              <div>
                <div className="mb-6">
  <div 
    className="rounded-lg p-4 shadow-sm"
    style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)' }}
  >
    <h3 className="text-2xl font-bold text-center" style={{ color: '#990D35' }}>
      🥋 PARTAI PERTANDINGAN
    </h3>
    <p className="text-center text-sm mt-2" style={{ color: '#050505', opacity: 0.6 }}>
      Semua pertandingan dalam 1 babak
    </p>
  </div>
                </div>

                <div className="space-y-4">
                  {matches.map((match, matchIndex) => (
  <div
    key={match.id_match}
    className="bg-white rounded-xl shadow-md border-2 overflow-hidden"
    style={{ borderColor: '#990D35' }}
  >
    {/* Match Header */}
    <div 
      className="px-4 py-2.5 border-b flex items-center justify-between"
      style={{ 
        backgroundColor: 'rgba(153, 13, 53, 0.05)',
        borderColor: '#990D35'
      }}
    >
      <span className="text-sm font-semibold" style={{ color: '#050505' }}>
        Partai {matchIndex + 1}
      </span>
      <button
        onClick={() => setEditingMatch(match)}
        className="p-1.5 rounded-lg hover:bg-black/5 transition-all"
        title="Edit Score"
      >
        <Edit3 size={14} style={{ color: '#050505', opacity: 0.6 }} />
      </button>
    </div>

    {/* Participants Container */}
    <div className="p-4 space-y-3">
      {/* Participant A (Blue Corner) */}
      <div 
        className={`relative rounded-lg border-2 p-3 transition-all ${
          match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0)
            ? 'border-yellow-400 bg-yellow-50/50' 
            : 'border-gray-200 bg-white'
        }`}
      >
        {match.peserta_a ? (
          <div className="flex items-center gap-3">
            {/* Left: Badge + Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span 
                  className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded shadow-sm flex-shrink-0"
                  style={{ backgroundColor: '#990D35', color: 'white' }}
                >
                  B/{match.peserta_a.id_peserta_kompetisi}
                </span>
                <span 
                  className="font-bold text-base truncate"
                  style={{ color: '#3B82F6' }}
                  title={getParticipantName(match.peserta_a)}
                >
                  {getParticipantName(match.peserta_a)}
                </span>
              </div>
              <p 
                className="text-xs uppercase truncate pl-0.5"
                style={{ color: '#3B82F6', opacity: 0.7 }}
                title={getDojoName(match.peserta_a)}
              >
                {getDojoName(match.peserta_a)}
              </p>
            </div>

            {/* Right: Medal + Score */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0) && (
                <span 
                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                  style={{ backgroundColor: '#F5B700', color: 'white' }}
                >
                  🏆 GOLD
                </span>
              )}
              {(match.skor_a > 0 || match.skor_b > 0) && (
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                  style={{ 
                    backgroundColor: match.skor_a > match.skor_b ? '#22c55e' : '#e5e7eb',
                    color: match.skor_a > match.skor_b ? 'white' : '#6b7280'
                  }}
                >
                  {match.skor_a}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <span 
              className="text-sm font-medium"
              style={{ color: '#050505', opacity: 0.4 }}
            >
              TBD
            </span>
          </div>
        )}
      </div>

      {/* Participant B (Red Corner) */}
      {match.peserta_b ? (
        <div 
          className={`relative rounded-lg border-2 p-3 transition-all ${
            match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0)
              ? 'border-yellow-400 bg-yellow-50/50' 
              : match.skor_a > 0 || match.skor_b > 0
              ? 'border-gray-300 bg-gray-50/30'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Left: Badge + Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span 
                  className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded shadow-sm flex-shrink-0"
                  style={{ backgroundColor: '#990D35', color: 'white' }}
                >
                  R/{match.peserta_b.id_peserta_kompetisi}
                </span>
                <span 
                  className="font-bold text-base truncate"
                  style={{ color: '#EF4444' }}
                  title={getParticipantName(match.peserta_b)}
                >
                  {getParticipantName(match.peserta_b)}
                </span>
              </div>
              <p 
                className="text-xs uppercase truncate pl-0.5"
                style={{ color: '#EF4444', opacity: 0.7 }}
                title={getDojoName(match.peserta_b)}
              >
                {getDojoName(match.peserta_b)}
              </p>
            </div>

            {/* Right: Medal + Score */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                <span 
                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                  style={{ backgroundColor: '#F5B700', color: 'white' }}
                >
                  🏆 GOLD
                </span>
              )}
              {match.skor_b < match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                <span 
                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                  style={{ backgroundColor: '#C0C0C0', color: 'white' }}
                >
                  🥈 SILVER
                </span>
              )}
              {(match.skor_a > 0 || match.skor_b > 0) && (
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                  style={{ 
                    backgroundColor: match.skor_b > match.skor_a ? '#22c55e' : '#e5e7eb',
                    color: match.skor_b > match.skor_a ? 'white' : '#6b7280'
                  }}
                >
                  {match.skor_b}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 px-4 rounded-lg" style={{ backgroundColor: 'rgba(192, 192, 192, 0.05)' }}>
          <span 
            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ 
              backgroundColor: 'rgba(192, 192, 192, 0.2)', 
              color: '#6b7280' 
            }}
          >
            🎁 Free draw (Silver Medal)
          </span>
        </div>
      )}
    </div>
  </div>
))}
                </div>
              </div>

              {/* RIGHT: Leaderboard */}
              <div className="lg:sticky lg:top-6 lg:self-start" ref={leaderboardRef}>
                <div className="bg-white rounded-lg shadow-lg border-2" style={{ borderColor: '#990D35' }}>
                  <div className="p-6 border-b" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: '#990D35' }}>
                    <div className="flex items-center gap-3 justify-center">
                      <Trophy size={28} style={{ color: '#990D35' }} />
                      <h3 className="text-2xl font-bold" style={{ color: '#990D35' }}>
                        LEADERBOARD
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Gold Medals */}
                    {leaderboard && leaderboard.gold.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5B700' }}>
                            <span className="text-lg">🥇</span>
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                            GOLD MEDALS
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {leaderboard.gold.map((participant, idx) => (
                            <div key={participant.id} className="p-3 rounded-lg border-2" style={{ 
                              backgroundColor: 'rgba(245, 183, 0, 0.1)', 
                              borderColor: '#F5B700' 
                            }}>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold" style={{ color: '#F5B700' }}>
                                  {idx + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                    {participant.name}
                                  </p>
                                  <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                    {participant.dojo}
                                  </p>
                                </div>
                                <Trophy size={20} style={{ color: '#F5B700' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Silver Medals */}
                    {leaderboard && leaderboard.silver.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C0C0C0' }}>
                            <span className="text-lg">🥈</span>
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                            SILVER MEDALS
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {leaderboard.silver.map((participant, idx) => (
                            <div key={participant.id} className="p-3 rounded-lg border" style={{ 
                              backgroundColor: 'rgba(192, 192, 192, 0.1)', 
                              borderColor: '#C0C0C0' 
                            }}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold" style={{ color: '#6b7280' }}>
                                  {idx + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                    {participant.name}
                                  </p>
                                  <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                    {participant.dojo}
                                  </p>
                                </div>
                                <Medal size={20} style={{ color: '#C0C0C0' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BYE (Free Draw) */}
                    {leaderboard && leaderboard.bye.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
                            <span className="text-lg">🎁</span>
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                            FREE DRAW (Silver)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {leaderboard.bye.map((participant) => (
                            <div key={participant.id} className="p-3 rounded-lg border" style={{ 
                              backgroundColor: 'rgba(107, 114, 128, 0.1)', 
                              borderColor: '#6b7280' 
                            }}>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                    {participant.name}
                                  </p>
                                  <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                    {participant.dojo}
                                  </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full" style={{ 
                                  backgroundColor: '#C0C0C0', 
                                  color: 'white' 
                                }}>
                                  🥈 Auto Silver
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {leaderboard && leaderboard.gold.length === 0 && leaderboard.silver.length === 0 && (
                      <div className="text-center py-8">
                        <Trophy size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
                        <p className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                          Belum ada hasil pertandingan
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
/* ========== PRESTASI LAYOUT (IMPROVED - HORIZONTAL WITH TOP HEADERS) ========== */
<div className="overflow-x-auto overflow-y-visible pb-8">
  {/* Round Headers - HORIZONTAL AT TOP */}
  <div className="flex gap-8 mb-6 px-8 sticky top-0 z-20 bg-white/95 backdrop-blur-sm py-4 shadow-sm">
    {Array.from({ length: totalRounds }, (_, roundIndex) => {
      const round = roundIndex + 1;
      const roundMatches = getMatchesByRound(round);
      
      return (
        <div 
          key={`header-${round}`}
          className="flex-shrink-0"
          style={{ width: '340px' }} // Match card width + padding
        >
          <div 
            className="text-center px-6 py-3 rounded-lg font-bold text-lg shadow-md"
            style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
          >
            {getRoundName(round, totalRounds)}
          </div>
          <div className="text-center mt-2 text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
            {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
          </div>
        </div>
      );
    })}
  </div>

  {/* Matches Container - HORIZONTAL FLOW */}
  <div 
    className="inline-flex items-center gap-8 min-w-full px-8" 
    style={{ minHeight: '700px' }}
  >
    {Array.from({ length: totalRounds }, (_, roundIndex) => {
      const round = roundIndex + 1;
      const roundMatches = getMatchesByRound(round);
      
      // Dynamic spacing based on round progression
      const matchCardHeight = 160; // Increased from 140
      const baseGap = 60; // Increased base gap
      const verticalSpacing = baseGap * Math.pow(2, roundIndex);
      
      return (
        <div 
          key={`round-${round}`} 
          className="flex flex-col justify-center relative flex-shrink-0"
          style={{ 
            width: '340px', // Fixed width for consistency
            gap: `${verticalSpacing}px`,
            minHeight: '600px' // Ensure minimum height
          }}
        >
          {/* Matches */}
          {roundMatches.map((match, matchIndex) => {
            const hasScores = match.skor_a > 0 || match.skor_b > 0;
            const winner = hasScores 
              ? (match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b)
              : null;
            
            return (
              <div
                key={match.id_match}
                className="relative"
                style={{ 
                  minHeight: `${matchCardHeight}px`,
                  maxHeight: `${matchCardHeight}px`
                }}
              >
                {/* Connecting Lines */}
                {round < totalRounds && (
                  <>
                    {/* Horizontal connector to next round */}
                    <div
                      className="absolute left-full border-t-2"
                      style={{ 
                        borderColor: '#990D35',
                        top: '50%',
                        width: '32px',
                        transform: 'translateY(-1px)',
                        zIndex: 1
                      }}
                    />
                    
                    {/* Vertical bracket connector */}
                    {matchIndex % 2 === 0 && matchIndex + 1 < roundMatches.length && (
                      <div
                        className="absolute border-l-2"
                        style={{
                          borderColor: '#990D35',
                          left: 'calc(100% + 32px)',
                          top: '50%',
                          height: `calc(${verticalSpacing + matchCardHeight}px)`,
                          zIndex: 0
                        }}
                      />
                    )}
                  </>
                )}

                {/* Match Card */}
                <div
                  className="bg-white rounded-xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all relative z-10"
                  style={{ 
                    borderColor: winner ? '#22c55e' : '#990D35',
                    height: `${matchCardHeight}px`,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Match Header */}
                  <div 
                    className="px-4 py-2.5 flex items-center justify-between border-b flex-shrink-0"
                    style={{ 
                      backgroundColor: 'rgba(153, 13, 53, 0.05)',
                      borderColor: '#990D35'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#990D35', color: 'white' }}
                      >
                        {matchIndex + 1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#050505' }}>
                        Match {match.id_match}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingMatch(match)}
                      className="p-1.5 rounded-lg hover:bg-black/5 transition-all"
                      title="Edit Score"
                    >
                      <Edit3 size={14} style={{ color: '#990D35' }} />
                    </button>
                  </div>

                  {/* Participants */}
                  <div className="flex-1 flex flex-col">
                    {/* Participant A */}
                    <div 
                      className={`flex-1 px-4 py-3 border-b flex items-center justify-between gap-3 transition-all ${
                        match.skor_a > match.skor_b && hasScores
                          ? 'bg-gradient-to-r from-green-50 to-green-100' 
                          : 'hover:bg-blue-50/30'
                      }`}
                      style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}
                    >
                      {match.peserta_a ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span 
                                className="text-xs font-bold px-2 py-0.5 rounded shadow-sm"
                                style={{ backgroundColor: '#3B82F6', color: 'white' }}
                              >
                                B/{match.peserta_a.id_peserta_kompetisi}
                              </span>
                              {match.skor_a > match.skor_b && hasScores && (
                                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p 
                              className="font-bold text-sm truncate leading-tight"
                              style={{ color: '#050505' }}
                              title={getParticipantName(match.peserta_a)}
                            >
                              {getParticipantName(match.peserta_a)}
                            </p>
                            <p 
                              className="text-xs truncate mt-0.5"
                              style={{ color: '#3B82F6', opacity: 0.7 }}
                              title={getDojoName(match.peserta_a)}
                            >
                              {getDojoName(match.peserta_a)}
                            </p>
                          </div>
                          {hasScores && (
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0"
                              style={{ 
                                backgroundColor: match.skor_a > match.skor_b ? '#22c55e' : '#e5e7eb',
                                color: match.skor_a > match.skor_b ? 'white' : '#6b7280'
                              }}
                            >
                              {match.skor_a}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 w-full text-center font-medium">TBD</span>
                      )}
                    </div>

                    {/* Participant B */}
                    <div 
                      className={`flex-1 px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                        match.skor_b > match.skor_a && hasScores
                          ? 'bg-gradient-to-r from-green-50 to-green-100' 
                          : 'hover:bg-red-50/30'
                      }`}
                    >
                      {match.peserta_b ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span 
                                className="text-xs font-bold px-2 py-0.5 rounded shadow-sm"
                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                              >
                                R/{match.peserta_b.id_peserta_kompetisi}
                              </span>
                              {match.skor_b > match.skor_a && hasScores && (
                                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p 
                              className="font-bold text-sm truncate leading-tight"
                              style={{ color: '#050505' }}
                              title={getParticipantName(match.peserta_b)}
                            >
                              {getParticipantName(match.peserta_b)}
                            </p>
                            <p 
                              className="text-xs truncate mt-0.5"
                              style={{ color: '#EF4444', opacity: 0.7 }}
                              title={getDojoName(match.peserta_b)}
                            >
                              {getDojoName(match.peserta_b)}
                            </p>
                          </div>
                          {hasScores && (
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0"
                              style={{ 
                                backgroundColor: match.skor_b > match.skor_a ? '#22c55e' : '#e5e7eb',
                                color: match.skor_b > match.skor_a ? 'white' : '#6b7280'
                              }}
                            >
                              {match.skor_b}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full flex justify-center">
                          <span 
                            className="text-xs px-3 py-1.5 rounded-full font-medium"
                            style={{ 
                              backgroundColor: 'rgba(192, 192, 192, 0.15)',
                              color: '#6b7280'
                            }}
                          >
                            🎁 BYE
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Status Footer */}
                  {hasScores && (
                    <div 
                      className="px-3 py-1.5 text-center border-t flex-shrink-0"
                      style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.05)',
                        borderColor: 'rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      <span className="text-xs font-semibold text-green-700 flex items-center justify-center gap-1">
                        <CheckCircle size={12} />
                        Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    })}
  </div>
</div>
          )}
        </div>
      ) : (
        /* No Bracket State */
<div className="p-6">
  <div className="text-center py-16">
    <Trophy size={64} style={{ color: '#990D35', opacity: 0.4 }} className="mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2" style={{ color: '#050505' }}>
      {approvedParticipants.length < 2 ? 'Insufficient Participants' : 'Tournament Bracket Not Generated'}
    </h3>
    <p className="text-base mb-6" style={{ color: '#050505', opacity: 0.6 }}>
      {approvedParticipants.length < 2 
        ? `Need at least 2 approved participants. Currently have ${approvedParticipants.length}.`
        : 'Click "Select & Generate" to create the tournament bracket'
      }
    </p>
    {approvedParticipants.length >= 2 && (
      <div className="flex gap-3 justify-center">
        <button
          onClick={openParticipantSelection} // ⭐ CHANGED: Buka modal selection
          disabled={loading}
          className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Shuffle size={16} />
              <span>Select & Generate Bracket</span>
            </div>
          )}
        </button>
      </div>
    )}
  </div>
</div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
              <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
                Update Match Result
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {editingMatch.peserta_a && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                    {getParticipantName(editingMatch.peserta_a)} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Score"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                    defaultValue={editingMatch.skor_a}
                    id="scoreA"
                  />
                </div>
              )}
              
              {editingMatch.peserta_b && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                    {getParticipantName(editingMatch.peserta_b)} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Score"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                    defaultValue={editingMatch.skor_b}
                    id="scoreB"
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#990D35' }}>
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium transition-all"
                style={{ borderColor: '#990D35', color: '#990D35' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const scoreA = parseInt((document.getElementById('scoreA') as HTMLInputElement)?.value || '0');
                  const scoreB = parseInt((document.getElementById('scoreB') as HTMLInputElement)?.value || '0');
                  updateMatchResult(editingMatch.id_match, scoreA, scoreB);
                }}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notification/Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slideUp">
            {/* Modal Header */}
            <div 
              className="p-6 border-b rounded-t-xl" 
              style={{ 
                backgroundColor: 
                  modalConfig.type === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                  modalConfig.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                  modalConfig.type === 'warning' ? 'rgba(245, 183, 0, 0.1)' :
                  'rgba(99, 102, 241, 0.1)',
                borderColor: 
                  modalConfig.type === 'success' ? '#22c55e' :
                  modalConfig.type === 'error' ? '#ef4444' :
                  modalConfig.type === 'warning' ? '#F5B700' :
                  '#6366f1'
              }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: 
                      modalConfig.type === 'success' ? '#22c55e' :
                      modalConfig.type === 'error' ? '#ef4444' :
                      modalConfig.type === 'warning' ? '#F5B700' :
                      '#6366f1'
                  }}
                >
                  {modalConfig.type === 'success' && (
                    <CheckCircle size={24} style={{ color: 'white' }} />
                  )}
                  {modalConfig.type === 'error' && (
                    <span className="text-2xl">❌</span>
                  )}
                  {modalConfig.type === 'warning' && (
                    <AlertTriangle size={24} style={{ color: 'white' }} />
                  )}
                  {modalConfig.type === 'info' && (
                    <span className="text-2xl">ℹ️</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold flex-1" style={{ color: '#050505' }}>
                  {modalConfig.title}
                </h3>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-base leading-relaxed" style={{ color: '#050505', opacity: 0.8 }}>
                {modalConfig.message}
              </p>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t flex gap-3" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
              {modalConfig.cancelText && (
                <button
                  onClick={() => {
                    if (modalConfig.onCancel) modalConfig.onCancel();
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-lg border font-medium transition-all hover:bg-gray-50"
                  style={{ borderColor: '#990D35', color: '#990D35' }}
                >
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  setShowModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: 
                    modalConfig.type === 'success' ? '#22c55e' :
                    modalConfig.type === 'error' ? '#ef4444' :
                    modalConfig.type === 'warning' ? '#F5B700' :
                    '#990D35',
                  color: '#F5FBEF' 
                }}
              >
                {modalConfig.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
{/* Participant Selection Modal - BYE SELECTION ONLY */}
{showParticipantSelection && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      {/* Modal Header */}
<div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
        {isPemula 
          ? '🥋 Kategori PEMULA - Pilih Peserta untuk BYE (Opsional)'
          : '🏆 Kategori PRESTASI - Pilih Peserta untuk BYE (Opsional)'}
      </h3>
      <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
        {isPemula 
          ? 'Pemula: BYE = auto mendapat medali perak tanpa bertanding'
          : (() => {
              const total = approvedParticipants.length;
              const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(total)));
              const recommended = nextPowerOf2 - total;
              return `Pilih 0 (skip BYE) atau ${recommended} peserta untuk langsung ke Round 2`;
            })()
        }
      </p>
    </div>
    <button
      onClick={() => {
        setShowParticipantSelection(false);
        setSelectedParticipants(new Set());
      }}
      className="p-2 rounded-lg hover:bg-black/5 transition-all"
    >
      <span className="text-2xl" style={{ color: '#990D35' }}>×</span>
    </button>
  </div>
</div>

      {/* BYE Info Banner */}
<div className={`p-4 border-b ${
  isPemula ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
}`}>
  <div className="flex items-start gap-3">
    {isPemula ? (
      <span className="text-2xl">ℹ️</span>
    ) : (
      <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <p className={`text-sm font-semibold ${
        isPemula ? 'text-blue-800' : 'text-yellow-800'
      }`}>
        Total Peserta: {approvedParticipants.length}
      </p>
      
      {isPemula ? (
        <>
          <p className="text-xs text-blue-700 mt-1">
            Kategori PEMULA: Semua peserta bertanding dalam 1 babak
          </p>
          <p className="text-xs text-blue-700 mt-1">
            ⚠️ Peserta yang di-BYE otomatis mendapat medali PERAK tanpa bertanding
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-yellow-700 mt-1">
            Bracket size: {Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length)))} | 
            BYE direkomendasikan: {Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length} peserta
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            💡 BYE = peserta langsung masuk Round 2 tanpa bertanding di Round 1
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            ✅ Anda bisa skip BYE (pilih 0) dan semua peserta bertanding dari Round 1
          </p>
        </>
      )}
    </div>
  </div>
</div>

      {/* Selection Counter */}
<div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="font-semibold" style={{ color: '#050505' }}>
        Dipilih: {selectedParticipants.size}
      </span>
      
      {!isPemula && (
        <span className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
          / {Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length} (rekomendasi)
        </span>
      )}
    </div>
    
    <div className="flex items-center gap-2">
      {/* Clear Selection Button */}
      {selectedParticipants.size > 0 && (
        <button
          onClick={() => setSelectedParticipants(new Set())}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all hover:bg-gray-50"
          style={{ borderColor: '#990D35', color: '#990D35' }}
        >
          Clear Selection
        </button>
      )}
      
      {/* Status Badge */}
      {selectedParticipants.size === 0 ? (
        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
          ⚪ No BYE
        </span>
      ) : !isPemula && selectedParticipants.size === (Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length) ? (
        <span className="text-sm font-medium text-green-600 flex items-center gap-1">
          <CheckCircle size={16} />
          Perfect!
        </span>
      ) : (
        <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
          🎯 {selectedParticipants.size} BYE
        </span>
      )}
    </div>
  </div>
</div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {approvedParticipants.map((participant) => {
            const isSelected = selectedParticipants.has(participant.id_peserta_kompetisi);
            const byesNeeded = Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length;
            const canSelect = isSelected || selectedParticipants.size < byesNeeded;
            
            return (
              <label
                key={participant.id_peserta_kompetisi}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  canSelect ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ 
                  borderColor: isSelected ? '#F5B700' : '#e5e7eb',
                  backgroundColor: isSelected ? 'rgba(245, 183, 0, 0.05)' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => canSelect && handleSelectParticipant(participant.id_peserta_kompetisi)}
                  disabled={!canSelect}
                  className="w-5 h-5 rounded border-2 cursor-pointer"
                  style={{ 
                    accentColor: '#F5B700',
                    borderColor: '#F5B700' 
                  }}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: '#990D35', 
                        color: 'white' 
                      }}
                    >
                      #{participant.id_peserta_kompetisi}
                    </span>
                    <span className="font-bold" style={{ color: '#050505' }}>
                      {getParticipantName(participant)}
                    </span>
                    {isSelected && (
                      <span 
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F5B700', color: 'white' }}
                      >
                        🎁 BYE
                      </span>
                    )}
                  </div>
                  <p className="text-xs uppercase mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                    {getDojoName(participant)}
                  </p>
                </div>

                {isSelected && (
                  <CheckCircle size={20} style={{ color: '#F5B700' }} />
                )}
              </label>
            );
          })}
        </div>
      </div>

{/* Modal Footer */}
<div className="p-6 border-t flex gap-3" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
  <button
    onClick={() => {
      setShowParticipantSelection(false);
      setSelectedParticipants(new Set());
    }}
    className="flex-1 py-3 px-4 rounded-lg border font-medium transition-all hover:bg-gray-50"
    style={{ borderColor: '#990D35', color: '#990D35' }}
  >
    Batal
  </button>
  
  <button
    onClick={() => {
      // ⭐ VALIDASI BARU: Allow ANY count untuk PEMULA, allow 0 atau exact untuk PRESTASI
      if (isPemula) {
        // Pemula: any count OK
        generateBracket(false);
      } else {
        // Prestasi: 0 (no BYE) atau exact recommended count
        const recommended = Math.pow(2, Math.ceil(Math.log2(approvedParticipants.length))) - approvedParticipants.length;
        
        if (selectedParticipants.size !== 0 && selectedParticipants.size !== recommended) {
          showNotification(
            'warning',
            'Jumlah BYE Tidak Sesuai',
            `Untuk kategori PRESTASI, pilih 0 untuk skip BYE atau tepat ${recommended} peserta sesuai rekomendasi`,
            () => setShowModal(false)
          );
          return;
        }
        
        generateBracket(false);
      }
    }}
    className="flex-1 py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90"
    style={{ 
      backgroundColor: '#990D35', 
      color: '#F5FBEF' 
    }}
  >
    <div className="flex items-center justify-center gap-2">
      <RefreshCw size={16} />
      <span>
        {selectedParticipants.size === 0 
          ? 'Generate (No BYE)' 
          : isPemula
          ? `Generate dengan ${selectedParticipants.size} BYE (Auto Perak)`
          : `Generate dengan ${selectedParticipants.size} BYE (ke Round 2)`}
      </span>
    </div>
  </button>
</div>
    </div>
  </div>
)}
    </div>
  );
};

export default TournamentBracket;