import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Convert a DOM element into a PDF and trigger download.
 *
 * The function uses html2canvas to snapshot the element at a high
 * resolution, then fits the resulting image into an A4-sized jsPDF
 * document.  The output is automatically downloaded using the provided
 * filename.
 */
export async function exportElementAsPdf(element: HTMLElement, filename: string) {
  // make sure the element is in the document
  if (!element) {
    throw new Error('Cannot export: element is undefined');
  }

  // temporarily force full width to avoid cropping when element is narrow
  const originalWidth = element.style.width;
  element.style.width = '100%';

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);

  // restore original width if it was changed
  element.style.width = originalWidth;
}

/**
 * Export an HTML table element (or any container) to an Excel worksheet
 * and trigger a download.  This helper simply converts the passed-in
 * element into a worksheet using `XLSX.utils.table_to_sheet` if it
 * contains a `<table>`, otherwise it attempts to serialize any tables
 * found inside.
 */
export function exportElementAsExcel(element: HTMLElement, filename: string) {
  if (!element) {
    throw new Error('Cannot export: element is undefined');
  }

  // try to find a table inside the element
  const table = element.querySelector('table');
  if (!table) {
    throw new Error('No <table> found inside element for Excel export');
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table as HTMLTableElement);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
