import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TabConfig {
  id: string;
  title: string;
  skipExport?: boolean;
}

const TABS_CONFIG: TabConfig[] = [
  { id: 'summary', title: 'Executive Summary' },
  { id: 'headcount', title: 'Headcount Breakdown' },
  { id: 'orgchart', title: 'Organization Chart', skipExport: true }, // Interactive, not suitable for PDF
  { id: 'spans', title: 'Spans & Layers Analysis' },
  { id: 'tenure', title: 'Tenure Analysis' },
  { id: 'automation', title: 'Automation Analysis' },
  { id: 'offshoring', title: 'Offshoring Analysis' },
  { id: 'compensation', title: 'Compensation Analysis' },
];

// A4 dimensions in mm (210 x 297)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const HEADER_HEIGHT = 15;
const FOOTER_HEIGHT = 10;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const CONTENT_HEIGHT = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - (MARGIN * 2);

export async function exportDashboardToPDF(
  tabRefs: Map<string, HTMLElement | null>,
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let currentPage = 1;
  let totalPages = 0;
  const pageContents: { tabTitle: string; canvas: HTMLCanvasElement }[] = [];

  // First pass: capture all tabs
  const tabsToExport = TABS_CONFIG.filter(t => !t.skipExport);
  
  for (let i = 0; i < tabsToExport.length; i++) {
    const tab = tabsToExport[i];
    const element = tabRefs.get(tab.id);
    
    if (!element) {
      console.warn(`Tab element not found: ${tab.id}`);
      continue;
    }

    onProgress?.(((i + 1) / tabsToExport.length) * 50, `Capturing ${tab.title}...`);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Fixed width for consistent rendering
      });

      pageContents.push({ tabTitle: tab.title, canvas });
    } catch (error) {
      console.error(`Failed to capture tab: ${tab.id}`, error);
    }
  }

  // Calculate total pages needed
  for (const { canvas } of pageContents) {
    const imgHeight = (canvas.height * CONTENT_WIDTH) / canvas.width;
    const pagesForThisTab = Math.ceil(imgHeight / CONTENT_HEIGHT);
    totalPages += pagesForThisTab;
  }

  // Second pass: add to PDF with proper pagination
  let isFirstPage = true;
  
  for (let i = 0; i < pageContents.length; i++) {
    const { tabTitle, canvas } = pageContents[i];
    
    onProgress?.(50 + ((i + 1) / pageContents.length) * 50, `Generating ${tabTitle}...`);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = CONTENT_WIDTH;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Calculate how many pages this tab needs
    const pagesForThisTab = Math.ceil(imgHeight / CONTENT_HEIGHT);
    
    for (let pageIndex = 0; pageIndex < pagesForThisTab; pageIndex++) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Add header
      addHeader(pdf, tabTitle);
      
      // Add content (clipped portion of the image)
      const sourceY = pageIndex * (CONTENT_HEIGHT / imgWidth * canvas.width);
      const sourceHeight = Math.min(
        (CONTENT_HEIGHT / imgWidth * canvas.width),
        canvas.height - sourceY
      );
      
      // Create a temporary canvas for the clipped portion
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        
        const clippedImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
        const clippedHeight = (sourceHeight * imgWidth) / canvas.width;
        
        pdf.addImage(
          clippedImgData,
          'JPEG',
          MARGIN,
          MARGIN + HEADER_HEIGHT,
          imgWidth,
          clippedHeight
        );
      }

      // Add footer
      addFooter(pdf, currentPage, totalPages, exportDate);
      currentPage++;
    }
  }

  // Download the PDF
  const filename = `organizational-due-diligence-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

function addHeader(pdf: jsPDF, tabTitle: string): void {
  pdf.setFillColor(75, 35, 95); // Aubergine color
  pdf.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Organizational Due Diligence', MARGIN, 9);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`| ${tabTitle}`, MARGIN + 58, 9);
}

function addFooter(pdf: jsPDF, currentPage: number, totalPages: number, exportDate: string): void {
  const footerY = PAGE_HEIGHT - FOOTER_HEIGHT;
  
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);
  
  pdf.setTextColor(128, 128, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`Page ${currentPage} of ${totalPages}`, MARGIN, footerY + 6);
  pdf.text(`Generated on ${exportDate}`, PAGE_WIDTH - MARGIN, footerY + 6, { align: 'right' });
}
