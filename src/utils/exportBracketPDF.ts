import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

// ==========================================================================================
// KONSTANTA PDF
// ==========================================================================================
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_LEFT = 20;
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

// ==========================================================================================
// HEADER + FOOTER
// ==========================================================================================
const addHeaderAndFooter = (
  doc: jsPDF,
  config: any,
  pageNumber: number,
  totalPages: number
) => {
  // header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(THEME.text);
  doc.text(config.eventName, PAGE_WIDTH / 2, HEADER_HEIGHT - 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.categoryName, PAGE_WIDTH / 2, HEADER_HEIGHT, { align: 'center' });

  // footer
  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const footerY = PAGE_HEIGHT - 10;
  doc.setFontSize(8);
  doc.text(exportDate, MARGIN_LEFT, footerY);
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH / 2, footerY, {
    align: 'center',
  });
};

// ==========================================================================================
// FUNGSI AUTO-DETEKSI BRACKET MURNI (tanpa leaderboard/sidebar)
// ==========================================================================================
const detectBracketContainer = (root: HTMLElement): HTMLElement => {
  const allDivs = Array.from(root.querySelectorAll('div')) as HTMLElement[];
  let largest = root;
  let maxArea = 0;
  for (const div of allDivs) {
    const area = div.scrollWidth * div.scrollHeight;
    if (area > maxArea && area < 2_000_000_000) {
      largest = div;
      maxArea = area;
    }
  }
  return largest;
};

// ==========================================================================================
// KONVERSI DOM → IMAGE (cleaned & fixed dimension)
// ==========================================================================================
const convertElementToImage = async (element: HTMLElement): Promise<HTMLImageElement> => {
  // 1️⃣ Cari elemen bracket terbesar
  const bracket = detectBracketContainer(element);

  // 2️⃣ Sembunyikan elemen non-bracket (leaderboard, nav, sidebar, dsb)
  const toHide = document.querySelectorAll(
    'nav, aside, header, footer, .leaderboard, .sidebar, .toolbar'
  );
  const hiddenEls: HTMLElement[] = [];
  toHide.forEach(el => {
    const e = el as HTMLElement;
    if (e && e.style) {
      e.style.display = 'none';
      hiddenEls.push(e);
    }
  });

  // 3️⃣ Ambil ukuran penuh
  const width = bracket.scrollWidth || bracket.offsetWidth;
  const height = bracket.scrollHeight || bracket.offsetHeight;
  if (width === 0 || height === 0) throw new Error('⚠️ Bracket element has 0 dimension.');

  // 4️⃣ Clone biar ga ketutup scroll container
  const clone = bracket.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';
  clone.style.left = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  clone.style.background = '#FFFFFF';
  document.body.appendChild(clone);

  // 5️⃣ Render image high-res
  const dataUrl = await htmlToImage.toPng(clone, {
    quality: 1,
    pixelRatio: 2.2,
    backgroundColor: '#FFFFFF',
    width,
    height,
    cacheBust: true,
  });

  // 6️⃣ Bersihkan
  document.body.removeChild(clone);
  hiddenEls.forEach(el => (el.style.display = ''));

  const img = new Image();
  img.src = dataUrl;
  await new Promise(res => (img.onload = res));
  return img;
};

// ==========================================================================================
// ADD IMAGE TO PDF (split & render proporsional)
// ==========================================================================================
const addImageToPage = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: any,
  yStart: number,
  scale: number,
  pageNumber: number,
  totalPages: number
) => {
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const viewHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);

  // slice portion
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  const cropHeight = viewHeight / scale;
  const cropY = yStart / scale;
  canvas.height = Math.min(cropHeight, img.height - cropY);
  ctx.drawImage(img, 0, cropY, img.width, canvas.height, 0, 0, img.width, canvas.height);

  const sliced = canvas.toDataURL('image/jpeg', 1);

  // clear page
  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  addHeaderAndFooter(doc, config, pageNumber, totalPages);

  // display scaling (proporsional)
  const availableWidth = PAGE_WIDTH - 2 * MARGIN_LEFT;
  const displayHeight = (canvas.height * availableWidth) / img.width;
  const x = MARGIN_LEFT;
  const y = HEADER_HEIGHT + 5;
  if (!isFinite(displayHeight) || !isFinite(availableWidth)) return;
  doc.addImage(sliced, 'JPEG', x, y, availableWidth, displayHeight);
};

// ==========================================================================================
// EXPORT UTAMA
// ==========================================================================================
export const exportBracketToPDF = async (
  config: any,
  bracketElement: HTMLElement
): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    doc.deletePage(1);

    // ambil gambar bracket
    const bracketImg = await convertElementToImage(bracketElement);

    // skala disesuaikan biar besar tapi muat
    const scale = 1.8;
    const totalHeight = bracketImg.height * scale;
    const viewHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);
    const totalSlices = Math.ceil(totalHeight / viewHeight);
    const totalPages = totalSlices + 1;

    // halaman cover
    doc.addPage();
    doc.setFillColor(THEME.background);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(THEME.primary);
    doc.text(config.eventName.toUpperCase(), PAGE_WIDTH / 2, 70, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(config.categoryName, PAGE_WIDTH / 2, 85, { align: 'center' });
    addHeaderAndFooter(doc, config, 1, totalPages);

    // halaman bagan
    let yStart = 0;
    for (let i = 0; i < totalSlices; i++) {
      doc.addPage();
      addImageToPage(doc, bracketImg, config, yStart, scale, i + 2, totalPages);
      yStart += viewHeight;
    }

    // simpan file
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Bracket_${safeName}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('❌ Error exporting PDF:', err);
    alert('Export gagal. Pastikan elemen bracket terlihat di layar sebelum export.');
  }
};
