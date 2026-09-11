/**
 * File Processor Service
 * Handles extraction and processing of various file types
 * Enhanced with audio/video support and Supabase storage integration
 */

import { ocrService } from './ocrService';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessedFile {
  type: 'image' | 'pdf' | 'excel' | 'csv' | 'audio' | 'video';
  fileName: string;
  text?: string;
  data?: Record<string, unknown>[];
  summary: string;
  confidence?: number;
  pages?: number;
  rows?: number;
  columns?: number;
  preview?: string;
  // Audio/Video specific
  audioUrl?: string;
  transcript?: string;
  duration?: number;
  storageUrl?: string;
}

class FileProcessorService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images/pdf
  private readonly MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB for audio

  /**
   * Process a file and extract its content
   */
  async processFile(file: File): Promise<ProcessedFile> {
    const type = this.getFileType(file);
    
    // Validate file size based on type
    const maxSize = (type === 'audio' || type === 'video') ? this.MAX_AUDIO_SIZE : this.MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new Error(`حجم فایل بیش از ${this.formatFileSize(maxSize)} است`);
    }
    
    switch (type) {
      case 'image':
        return await this.processImage(file);
      case 'pdf':
        return await this.processPDF(file);
      case 'excel':
        return await this.processExcel(file);
      case 'csv':
        return await this.processCSV(file);
      case 'audio':
        return await this.processAudio(file);
      case 'video':
        return await this.processVideo(file);
      default:
        throw new Error('نوع فایل پشتیبانی نمی‌شود');
    }
  }

  /**
   * Process image file with OCR
   */
  private async processImage(file: File): Promise<ProcessedFile> {
    try {
      const ocrResult = await ocrService.extractTextFromImage(file);
      const preview = URL.createObjectURL(file);
      
      return {
        type: 'image',
        fileName: file.name,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        preview,
        summary: ocrResult.text 
          ? `متن استخراج شده (${Math.round(ocrResult.confidence)}% اطمینان)`
          : 'متنی در تصویر یافت نشد'
      };
    } catch (error) {
      console.error('[FileProcessor] Image processing error:', error);
      throw new Error('خطا در پردازش تصویر');
    }
  }

  /**
   * Process PDF file
   */
  private async processPDF(file: File): Promise<ProcessedFile> {
    try {
      const pdfResult = await ocrService.extractTextFromPDF(file);
      
      return {
        type: 'pdf',
        fileName: file.name,
        text: pdfResult.text,
        pages: pdfResult.pages,
        confidence: pdfResult.confidence,
        summary: `${pdfResult.pages} صفحه • ${pdfResult.text.split(/\s+/).length} کلمه`
      };
    } catch (error) {
      console.error('[FileProcessor] PDF processing error:', error);
      throw new Error('خطا در پردازش PDF');
    }
  }

  /**
   * Process Excel file
   */
  private async processExcel(file: File): Promise<ProcessedFile> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      
      // Get column count
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const columns = range.e.c - range.s.c + 1;
      
      // Generate text representation
      const headers = Object.keys(data[0] || {});
      const textRows = data.slice(0, 10).map(row => 
        headers.map(h => `${h}: ${row[h]}`).join(' | ')
      );
      
      return {
        type: 'excel',
        fileName: file.name,
        data,
        text: textRows.join('\n'),
        rows: data.length,
        columns,
        summary: `${data.length} ردیف • ${columns} ستون`
      };
    } catch (error) {
      console.error('[FileProcessor] Excel processing error:', error);
      throw new Error('خطا در پردازش فایل اکسل');
    }
  }

  /**
   * Process CSV file
   */
  private async processCSV(file: File): Promise<ProcessedFile> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV manually
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const data: Record<string, unknown>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        data.push(row);
      }
      
      return {
        type: 'csv',
        fileName: file.name,
        text,
        data,
        rows: data.length,
        columns: headers.length,
        summary: `${data.length} ردیف • ${headers.length} ستون`
      };
    } catch (error) {
      console.error('[FileProcessor] CSV processing error:', error);
      throw new Error('خطا در پردازش فایل CSV');
    }
  }

  /**
   * Process audio file - upload and transcribe
   */
  private async processAudio(file: File): Promise<ProcessedFile> {
    try {
      console.log('[FileProcessor] Processing audio file:', file.name);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      // Get duration estimate from file size (rough estimate)
      const estimatedDuration = Math.round(file.size / 16000); // Assume ~16KB per second
      
      // Convert to base64 for speech-to-text
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Call speech-to-text edge function
      let transcript = '';
      try {
        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64 }
        });
        
        if (error) {
          console.error('[FileProcessor] STT error:', error);
        } else if (data?.text) {
          transcript = data.text;
        }
      } catch (sttError) {
        console.error('[FileProcessor] STT invocation error:', sttError);
      }
      
      return {
        type: 'audio',
        fileName: file.name,
        text: transcript,
        transcript,
        duration: estimatedDuration,
        preview,
        summary: transcript 
          ? `${Math.round(estimatedDuration / 60)} دقیقه • ${transcript.split(/\s+/).length} کلمه`
          : `${Math.round(estimatedDuration / 60)} دقیقه • در انتظار رونویسی`
      };
    } catch (error) {
      console.error('[FileProcessor] Audio processing error:', error);
      throw new Error('خطا در پردازش فایل صوتی');
    }
  }

  /**
   * Process video file
   */
  private async processVideo(file: File): Promise<ProcessedFile> {
    try {
      console.log('[FileProcessor] Processing video file:', file.name);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      // Get duration estimate
      const estimatedDuration = Math.round(file.size / 100000); // Rough estimate
      
      return {
        type: 'video',
        fileName: file.name,
        duration: estimatedDuration,
        preview,
        summary: `ویدیو • ${this.formatFileSize(file.size)}`
      };
    } catch (error) {
      console.error('[FileProcessor] Video processing error:', error);
      throw new Error('خطا در پردازش فایل ویدیویی');
    }
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadToStorage(file: File, bucket: string = 'documents'): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('کاربر وارد نشده است');
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        console.error('[FileProcessor] Upload error:', error);
        throw new Error('خطا در آپلود فایل');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('[FileProcessor] Storage upload error:', error);
      return null;
    }
  }

  /**
   * Determine file type from file object
   */
  getFileType(file: File): 'image' | 'pdf' | 'excel' | 'csv' | 'audio' | 'video' | 'unknown' {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Image types
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    // PDF
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    
    // Excel
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      return 'excel';
    }
    
    // CSV
    if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
      return 'csv';
    }

    // Audio types
    if (
      mimeType.startsWith('audio/') ||
      fileName.endsWith('.mp3') ||
      fileName.endsWith('.wav') ||
      fileName.endsWith('.m4a') ||
      fileName.endsWith('.ogg') ||
      fileName.endsWith('.webm')
    ) {
      return 'audio';
    }

    // Video types
    if (
      mimeType.startsWith('video/') ||
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.mkv')
    ) {
      return 'video';
    }

    return 'unknown';
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(type: string): string {
    switch (type) {
      case 'image': return '🖼️';
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'csv': return '📋';
      case 'audio': return '🎤';
      case 'video': return '🎬';
      default: return '📁';
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Detect data type from content (contact, meeting, task, etc.)
   */
  detectDataType(content: string): 'contact' | 'meeting' | 'task' | 'gratitude' | 'journal' | 'unknown' {
    const lowerContent = content.toLowerCase();
    
    // Contact patterns
    if (
      /(\d{10,11}|@[\w.]+|تلفن|موبایل|ایمیل|شرکت|سازمان)/i.test(content)
    ) {
      return 'contact';
    }
    
    // Meeting patterns
    if (
      /(جلسه|قرار|ساعت|تاریخ|حضور|شرکت‌کنندگان|دستور جلسه)/i.test(content)
    ) {
      return 'meeting';
    }
    
    // Task patterns
    if (
      /(وظیفه|کار|انجام|پیگیری|موعد|مسئول|deadline)/i.test(content)
    ) {
      return 'task';
    }
    
    // Gratitude patterns
    if (
      /(شکرگزار|ممنون|قدردان|سپاس|خدا را شکر)/i.test(content)
    ) {
      return 'gratitude';
    }
    
    return 'unknown';
  }
}

export const fileProcessor = new FileProcessorService();
