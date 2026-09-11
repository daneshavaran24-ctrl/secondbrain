// @huggingface/transformers loaded dynamically to avoid onnxruntime-node install issues
let pipeline: any = null;
async function getPipeline() {
  if (!pipeline) {
    try {
      const mod = await import('@huggingface/transformers');
      pipeline = mod.pipeline;
    } catch { pipeline = null; }
  }
  return pipeline;
}
import { KnowledgeItem } from '@/types';

export interface ClassificationResult {
  category: KnowledgeItem['category'];
  confidence: number;
  tags: string[];
  organization?: KnowledgeItem['organization'];
}

class AIClassificationService {
  private classifier: any = null;
  private embedder: any = null;

  async initializeModels(): Promise<void> {
    const pipeline = await getPipeline();
    if (!pipeline) return;
    try {
      // Initialize text classification model
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );

      // Initialize embedding model for semantic similarity
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }
  }

  async classifyContent(content: string, title?: string): Promise<ClassificationResult> {
    if (!this.classifier || !this.embedder) {
      await this.initializeModels();
    }

    const fullText = title ? `${title}\n${content}` : content;
    
    // Extract tags using keyword extraction
    const tags = this.extractKeywords(fullText);
    
    // Classify category based on content patterns
    const category = this.classifyCategory(fullText);
    
    // Detect organization based on content
    const organization = this.detectOrganization(fullText);
    
    return {
      category,
      confidence: 0.85, // Placeholder confidence
      tags,
      organization
    };
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // Medical keywords (Persian and English)
    const medicalTerms = [
      'پزشکی', 'درمان', 'دارو', 'بیمار', 'بیمارستان', 'دکتر', 'پزشک',
      'سلامت', 'بهداشت', 'medical', 'health', 'treatment', 'patient'
    ];
    
    // Technology keywords
    const techTerms = [
      'فناوری', 'تکنولوژی', 'هوش مصنوعی', 'دیجیتال', 'نرم‌افزار',
      'technology', 'AI', 'digital', 'software', 'innovation'
    ];
    
    // Business keywords
    const businessTerms = [
      'کسب‌وکار', 'تجارت', 'صادرات', 'واردات', 'شرکت', 'سازمان',
      'business', 'export', 'import', 'company', 'organization'
    ];
    
    const allTerms = [...medicalTerms, ...techTerms, ...businessTerms];
    
    allTerms.forEach(term => {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        keywords.push(term);
      }
    });
    
    // Extract entities that look like names or organizations
    const entityPattern = /[A-Za-z\u0600-\u06FF]+(?:\s+[A-Za-z\u0600-\u06FF]+){0,2}/g;
    const entities = text.match(entityPattern) || [];
    
    entities.forEach((entity: string) => {
      if (entity.length > 3 && entity.length < 20) {
        keywords.push(entity.trim());
      }
    });
    
    return [...new Set(keywords)].slice(0, 10); // Remove duplicates and limit to 10
  }

  private classifyCategory(text: string): KnowledgeItem['category'] {
    const projectIndicators = [
      'پروژه', 'طرح', 'project', 'plan', 'initiative', 'کیوسک', 'سیستم',
      'توسعه', 'development', 'implementation'
    ];
    
    const areaIndicators = [
      'حوزه', 'زمینه', 'area', 'domain', 'field', 'مدیریت', 'management',
      'استراتژی', 'strategy', 'سلامت', 'health'
    ];
    
    const resourceIndicators = [
      'منبع', 'مقاله', 'کتاب', 'مطالعه', 'تحقیق', 'resource', 'article',
      'study', 'research', 'reference', 'آموزش', 'training'
    ];
    
    const archiveIndicators = [
      'آرشیو', 'قدیمی', 'گذشته', 'archive', 'old', 'past', 'completed',
      'تمام شده', 'historical'
    ];
    
    const lowerText = text.toLowerCase();
    
    if (projectIndicators.some(indicator => lowerText.includes(indicator))) {
      return 'Projects';
    }
    
    if (areaIndicators.some(indicator => lowerText.includes(indicator))) {
      return 'Areas';
    }
    
    if (archiveIndicators.some(indicator => lowerText.includes(indicator))) {
      return 'Archives';
    }
    
    return 'Resources'; // Default
  }

  private detectOrganization(text: string): KnowledgeItem['organization'] | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('ورید') || lowerText.includes('varid')) {
      return 'Varid';
    }
    
    if (lowerText.includes('فرانگران') || lowerText.includes('frangaran')) {
      return 'Frangaran';
    }
    
    if (lowerText.includes('انجمن') || lowerText.includes('association') || 
        lowerText.includes('تولیدکنندگان')) {
      return 'Association';
    }
    
    if (lowerText.includes('اتاق بازرگانی') || lowerText.includes('chamber')) {
      return 'Chamber';
    }
    
    return undefined;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.initializeModels();
    }
    
    const result = await this.embedder(text, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    return Array.from(result.data);
  }

  async findSimilarContent(
    targetEmbedding: number[], 
    candidateEmbeddings: { id: string; embedding: number[] }[],
    threshold: number = 0.7
  ): Promise<string[]> {
    const similarities = candidateEmbeddings.map(candidate => ({
      id: candidate.id,
      similarity: this.cosineSimilarity(targetEmbedding, candidate.embedding)
    }));
    
    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.id);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export const aiClassificationService = new AIClassificationService();