import { jsPDF } from 'jspdf';
import { PT_SANS_REGULAR_BASE64, PT_SANS_BOLD_BASE64 } from './pdfFonts';

export function registerCyrillicFont(pdf: jsPDF) {
    pdf.addFileToVFS('PTSans-Regular.ttf', PT_SANS_REGULAR_BASE64);
    pdf.addFileToVFS('PTSans-Bold.ttf', PT_SANS_BOLD_BASE64);
    pdf.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    pdf.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
    pdf.setFont('PTSans', 'normal');
}