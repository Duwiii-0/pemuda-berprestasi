import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

// =================================================================================================
// CONFIGURATION & CONSTANTS
// =================================================================================================

interface ExportConfig {
  eventName: string;
  categoryName: string;
  location: string;
  dateRange: string;
  totalParticipants: number;
}

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const HEADER_HEIGHT = 18;
const FOOTER_HEIGHT = 10;

const THEME = {
  primary: '#990D35',
  background: '#F5FBEF',
  text: '#050505',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

// =================================================================================================
// HEADER & FOOTER
// =================================================================================================

const addHeaderAndFooter = (
  doc: jsPDF,
  config: ExportConfig,
  pageNumber: number,
  totalPages: number
) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(THEME.text);
  doc.text(config.eventName, PAGE_WIDTH / 2, MARGIN_TOP + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.categoryName, PAGE_WIDTH / 2, MARGIN_TOP + 11, { align: 'center' });

  // Footer
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(THEME.textSecondary);
  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(exportDate, MARGIN_LEFT, footerY);
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH / 2, footerY, { align: 'center' });
};

// =================================================================================================
// COVER PAGE
// =================================================================================================

const addCoverPage = (doc: jsPDF, config: ExportConfig, totalPages: number) => {
  doc.setFillColor(THEME.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setFillColor(THEME.primary);
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(THEME.white);
  doc.text(config.eventName.toUpperCase(), PAGE_WIDTH / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Competition Bracket', PAGE_WIDTH / 2, 35, { align: 'center' });

  const boxX = PAGE_WIDTH / 2 - 100;
  const boxY = 70;
  const boxWidth = 200;
  const boxHeight = 60;

  doc.setDrawColor(THEME.border);
  doc.setFillColor(THEME.white);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, 'FD');

  const infoItems = [
    { label: 'Category', value: config.categoryName },
    { label: 'Location', value: config.location },
    { label: 'Date', value: config.dateRange },
    { label: 'Participants', value: `${config.totalParticipants} Athletes` },
  ];

  let currentY = boxY + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  infoItems.forEach(item => {
    doc.setTextColor(THEME.textSecondary);
    doc.text(item.label, boxX + 15, currentY, { align: 'left' });
    doc.setTextColor(THEME.text);
    doc.text(item.value, boxX + boxWidth - 15, currentY, { align: 'right' });
    currentY += 10;
  });

  addHeaderAndFooter(doc, config, 1, totalPages);
};

// =================================================================================================
// DOM-TO-IMAGE: CLEAN BRACKET CAPTURE
// =================================================================================================

const convertElementToImage = async (element: HTMLElement): Promise<HTMLImageElement> => {
  // Ambil container bracket terluas
  const bracketOnly = (() => {
    const allDivs = Array.from(element.querySelectorAll('div')) as HTMLElement[];
    return allDivs.reduce((max, el) =>
      el.scrollWidth > max.scrollWidth ? el : max, element
    );
  })();

  // Sembunyikan elemen non-bagan
  const toHide = element.querySelectorAll('.leaderboard, .toolbar, .header, .round-labels, aside, nav');
  const hiddenEls: HTMLElement[] = [];
  toHide.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = 'none';
    hiddenEls.push(htmlEl);
  });

  const width = bracketOnly.scrollWidth || bracketOnly.offsetWidth;
  const height = bracketOnly.scrollHeight || bracketOnly.offsetHeight;

  const clone = bracketOnly.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';
  clone.style.left = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  clone.style.background = '#FFFFFF';
  document.body.appendChild(clone);

  const dataUrl = await htmlToImage.toPng(clone, {
    quality: 1,
    pixelRatio: 2,
    width,
    height,
    backgroundColor: '#FFFFFF',
  });

  document.body.removeChild(clone);
  hiddenEls.forEach(el => (el.style.display = ''));

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => (img.onload = resolve));
  return img;
};

// =================================================================================================
// ADD IMAGE TO PAGE (SPLIT IF NEEDED)
// =================================================================================================

const addImageToPage = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: ExportConfig,
  yStart: number,
  scale: number,
  pageNumber: number,
  totalPages: number
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const scaledHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);

  const cropY = yStart / scale;
  const cropHeight = scaledHeight / scale;
  canvas.width = img.width;
  canvas.height = Math.min(img.height - cropY, cropHeight);
  ctx.drawImage(img, 0, cropY, img.width, canvas.height, 0, 0, img.width, canvas.height);

  const croppedData = canvas.toDataURL('image/jpeg', 1.0);
  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  addHeaderAndFooter(doc, config, pageNumber, totalPages);

  const displayWidth = PAGE_WIDTH - 2 * MARGIN_LEFT;
  const displayHeight = (canvas.height * displayWidth) / img.width;
  const x = MARGIN_LEFT;
  const y = HEADER_HEIGHT + 8;

  doc.addImage(croppedData, 'JPEG', x, y, displayWidth, displayHeight);
};

// =================================================================================================
// MAIN EXPORT FUNCTION
// =================================================================================================

export const exportBracketToPDF = async (kelasData: any, bracketElement: HTMLElement): Promise<void> => {
  // inline transformBracketDataForPDF agar tidak error saat build
  const config: ExportConfig = {
    eventName: kelasData.kompetisi.nama_event,
    categoryName: `${kelasData.kelompok?.nama_kelompok || ''} ${
      kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
    } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim(),
    location: kelasData.kompetisi.lokasi,
    dateRange: `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}`,
    totalParticipants: kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED').length,
  };

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    doc.deletePage(1);

    const bracketImg = await convertElementToImage(bracketElement);

    // auto scale supaya bracket pas (tidak terlalu kecil)
    const scale = 1.8;
    const totalHeight = bracketImg.height * scale;
    const viewHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);
    const totalSlices = Math.ceil(totalHeight / viewHeight);
    const totalPages = totalSlices + 1;

    doc.addPage();
    addCoverPage(doc, config, totalPages);

    let yStart = 0;
    for (let i = 0; i < totalSlices; i++) {
      doc.addPage();
      addImageToPage(doc, bracketImg, config, yStart, scale, i + 2, totalPages);
      yStart += viewHeight;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    alert('Gagal membuat PDF. Cek console untuk detail.');
  }
};
