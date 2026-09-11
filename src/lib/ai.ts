// AI service functions for Perplexity API integration via Edge Function

import { supabase } from '@/integrations/supabase/client';

interface SummaryResult {
  summary: string;
  key_points: string[];
  quotes?: string[];
  actions?: string[];
  tags?: string[];
}

interface MindmapNode {
  id: string;
  label: string;
  group?: string;
  level: number;
}

interface MindmapEdge {
  from: string;
  to: string;
}

interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  title: string;
  description?: string;
}

// Check if Perplexity API is configured
export async function checkPerplexityApiStatus(): Promise<{ configured: boolean; success: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('perplexity-proxy', {
      body: { action: 'test' }
    });

    if (error) {
      console.error('Error checking Perplexity API status:', error);
      return { configured: false, success: false };
    }

    return { 
      configured: data?.configured ?? false, 
      success: data?.success ?? false 
    };
  } catch (error) {
    console.error('Error checking Perplexity API status:', error);
    return { configured: false, success: false };
  }
}

// Summarize content using Perplexity API via Edge Function
export async function summarizeContent(
  source: string,
  title: string,
  detailLevel: 'short' | 'medium' | 'long' = 'medium',
  language: string = 'persian'
): Promise<SummaryResult> {
  const { data, error } = await supabase.functions.invoke('perplexity-proxy', {
    body: {
      action: 'summarize',
      source,
      title,
      detailLevel,
      language
    }
  });

  if (error) {
    console.error('Error in summarizeContent:', error);
    throw new Error(error.message || 'خطا در برقراری ارتباط با سرور');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'خطای غیرمنتظره در خلاصه‌سازی');
  }

  const result = data.data as SummaryResult;
  
  // Validate required fields
  if (!result.summary || !result.key_points || !Array.isArray(result.key_points)) {
    throw new Error('ساختار JSON نامعتبر است');
  }

  return result;
}

// Generate mindmap using Perplexity API via Edge Function
export async function generateMindmap(
  source: string,
  title: string,
  customPrompt?: string
): Promise<MindmapData> {
  const { data, error } = await supabase.functions.invoke('perplexity-proxy', {
    body: {
      action: 'mindmap',
      source,
      title,
      customPrompt
    }
  });

  if (error) {
    console.error('Error in generateMindmap:', error);
    throw new Error(error.message || 'خطا در برقراری ارتباط با سرور');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'خطای غیرمنتظره در تولید مایندمپ');
  }

  const result = data.data as MindmapData;
  
  // Validate required fields
  if (!result.title || !result.nodes || !result.edges || 
      !Array.isArray(result.nodes) || !Array.isArray(result.edges)) {
    throw new Error('ساختار JSON نامعتبر است');
  }

  // Validate nodes structure
  for (const node of result.nodes) {
    if (!node.id || !node.label || typeof node.level !== 'number') {
      throw new Error('ساختار گره‌ها نامعتبر است');
    }
  }

  // Validate edges structure
  for (const edge of result.edges) {
    if (!edge.from || !edge.to) {
      throw new Error('ساختار اتصالات نامعتبر است');
    }
  }

  return result;
}
