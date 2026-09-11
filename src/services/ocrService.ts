// Lazy load tesseract.js to avoid CommonJS/ESM issues
let TesseractModule: typeof import('tesseract.js') | null = null;

async function getTesseract() {
  if (!TesseractModule) {
    TesseractModule = await import('tesseract.js');
  }
  return TesseractModule;
}

// Lazy load pdfjs-dist to avoid ESM issues
let pdfjs: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist');
    // Configure PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  pages?: number;
}

export interface DocumentInfo {
  type: 'image' | 'pdf';
  pages: number;
  size: number;
}

class OCRService {
  private worker: any = null;

  async initializeWorker(): Promise<void> {
    if (this.worker) return;
    
    const Tesseract = await getTesseract();
    this.worker = await Tesseract.createWorker('fas+eng');
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی .,!?;:'
    });
  }

  async extractTextFromImage(imageFile: File): Promise<OCRResult> {
    await this.initializeWorker();
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const { data } = await this.worker.recognize(imageFile);
    
    return {
      text: data.text,
      confidence: data.confidence,
      language: 'fas+eng',
      pages: 1
    };
  }

  async extractTextFromPDF(pdfFile: File): Promise<OCRResult> {
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    let totalConfidence = 0;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // First try to extract text directly
      const textContent = await page.getTextContent();
      if (textContent.items.length > 0) {
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
          totalConfidence += 95; // High confidence for direct text extraction
          continue;
        }
      }

      // If no text found, use OCR on rendered page
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

      // Convert canvas to blob and OCR
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const ocrResult = await this.extractTextFromImage(new File([blob], `page-${pageNum}.png`));
      fullText += ocrResult.text + '\n';
      totalConfidence += ocrResult.confidence;
    }

    return {
      text: fullText.trim(),
      confidence: totalConfidence / totalPages,
      language: 'fas+eng',
      pages: totalPages
    };
  }

  async analyzeDocument(file: File): Promise<DocumentInfo> {
    if (file.type.startsWith('image/')) {
      return {
        type: 'image',
        pages: 1,
        size: file.size
      };
    } else if (file.type === 'application/pdf') {
      const pdfjsLib = await getPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      return {
        type: 'pdf',
        pages: pdf.numPages,
        size: file.size
      };
    }
    
    throw new Error('Unsupported file type');
  }

  async processDocument(file: File): Promise<OCRResult> {
    const docInfo = await this.analyzeDocument(file);
    
    if (docInfo.type === 'image') {
      return this.extractTextFromImage(file);
    } else {
      return this.extractTextFromPDF(file);
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();
