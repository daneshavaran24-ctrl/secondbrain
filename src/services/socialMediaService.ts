// Social Media Integration Service
// Handles behavioral learning and platform integration

export interface SocialPlatform {
  id: string;
  name: string;
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  lastSync: string;
  apiEndpoint: string;
}

export interface UserBehavior {
  platform: string;
  action: 'like' | 'comment' | 'share' | 'view';
  content: string;
  timestamp: string;
  category?: string;
  keywords: string[];
}

export interface Interest {
  category: string;
  weight: number;
  confidence: number;
  sources: string[];
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  relatedInterests: string[];
  actionable: boolean;
}

class SocialMediaService {
  private platforms: Map<string, SocialPlatform> = new Map();
  private behaviors: UserBehavior[] = [];
  private interests: Map<string, Interest> = new Map();

  // Platform Management
  async connectPlatform(platformId: string, authData: any): Promise<boolean> {
    try {
      const platform: SocialPlatform = {
        id: platformId,
        name: this.getPlatformName(platformId),
        connected: true,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        lastSync: new Date().toISOString(),
        apiEndpoint: this.getApiEndpoint(platformId)
      };
      
      this.platforms.set(platformId, platform);
      await this.syncPlatformData(platformId);
      return true;
    } catch (error) {
      console.error(`Failed to connect ${platformId}:`, error);
      return false;
    }
  }

  async disconnectPlatform(platformId: string): Promise<void> {
    const platform = this.platforms.get(platformId);
    if (platform) {
      // Revoke tokens and clean up data
      platform.connected = false;
      platform.accessToken = undefined;
      platform.refreshToken = undefined;
      this.platforms.set(platformId, platform);
    }
  }

  // Behavioral Tracking
  async trackBehavior(behavior: UserBehavior): Promise<void> {
    // Add consent check
    if (!this.hasUserConsent()) {
      return;
    }

    this.behaviors.push({
      ...behavior,
      timestamp: new Date().toISOString()
    });

    // Extract keywords and categorize
    const keywords = this.extractKeywords(behavior.content);
    const category = await this.categorizeContent(behavior.content, keywords);
    
    behavior.keywords = keywords;
    behavior.category = category;

    // Update interests based on behavior
    await this.updateInterests(behavior);
  }

  // Interest Learning using ML
  private async updateInterests(behavior: UserBehavior): Promise<void> {
    const category = behavior.category || 'general';
    const currentInterest = this.interests.get(category);
    
    // Simple collaborative filtering approach
    const baseWeight = this.calculateBehaviorWeight(behavior.action);
    const keywordRelevance = this.calculateKeywordRelevance(behavior.keywords);
    
    const newWeight = currentInterest 
      ? (currentInterest.weight * 0.8) + (baseWeight * keywordRelevance * 0.2)
      : baseWeight * keywordRelevance;

    const interest: Interest = {
      category,
      weight: Math.min(newWeight, 1.0), // Cap at 1.0
      confidence: this.calculateConfidence(category),
      sources: currentInterest?.sources || [],
      updatedAt: new Date().toISOString()
    };

    if (!interest.sources.includes(behavior.platform)) {
      interest.sources.push(behavior.platform);
    }

    this.interests.set(category, interest);
  }

  private calculateBehaviorWeight(action: string): number {
    const weights = {
      'like': 0.3,
      'comment': 0.6,
      'share': 0.8,
      'view': 0.1
    };
    return weights[action] || 0.1;
  }

  private calculateKeywordRelevance(keywords: string[]): number {
    // Healthcare/medical technology related keywords get higher relevance
    const medicalKeywords = [
      'تجهیزات پزشکی', 'صادرات', 'فناوری سلامت', 'نوآوری پزشکی',
      'medical device', 'healthcare', 'innovation', 'export'
    ];
    
    let relevanceScore = 0.1; // Base score
    keywords.forEach(keyword => {
      if (medicalKeywords.some(mk => keyword.includes(mk))) {
        relevanceScore += 0.3;
      }
    });
    
    return Math.min(relevanceScore, 1.0);
  }

  private calculateConfidence(category: string): number {
    const behaviors = this.behaviors.filter(b => b.category === category);
    const uniquePlatforms = new Set(behaviors.map(b => b.platform)).size;
    const totalBehaviors = behaviors.length;
    
    // Higher confidence with more behaviors and diverse platforms
    return Math.min((totalBehaviors * 0.1) + (uniquePlatforms * 0.2), 1.0);
  }

  // Recommendation Generation
  async generateRecommendations(): Promise<Recommendation[]> {
    const topInterests = Array.from(this.interests.entries())
      .sort(([,a], [,b]) => b.weight - a.weight)
      .slice(0, 5);

    const recommendations: Recommendation[] = [];

    for (const [category, interest] of topInterests) {
      if (interest.weight > 0.3) { // Only recommend significant interests
        const rec = await this.createRecommendation(category, interest);
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  private async createRecommendation(category: string, interest: Interest): Promise<Recommendation> {
    // Template-based recommendation generation
    // In production, this would use more sophisticated NLP
    const templates = {
      'تجهیزات پزشکی': {
        title: 'فرصت‌های جدید در تجهیزات پزشکی',
        description: 'بر اساس علاقه شما به تجهیزات پزشکی، پیشنهاد می‌کنیم روی ترندهای جدید تمرکز کنید.'
      },
      'صادرات': {
        title: 'بازارهای صادراتی جدید',
        description: 'فعالیت‌های صادراتی شما نشان‌دهنده علاقه به توسعه بین‌المللی است.'
      }
    };

    const template = templates[category] || {
      title: `توسعه فعالیت در ${category}`,
      description: `بر اساس رفتار شما، ${category} اولویت بالایی دارد.`
    };

    return {
      id: `rec_${Date.now()}_${category}`,
      title: template.title,
      description: template.description,
      confidence: interest.confidence,
      relatedInterests: [category],
      actionable: true
    };
  }

  // Platform-specific API methods
  private async syncPlatformData(platformId: string): Promise<void> {
    const platform = this.platforms.get(platformId);
    if (!platform || !platform.connected) return;

    try {
      switch (platformId) {
        case 'linkedin':
          await this.syncLinkedInData(platform);
          break;
        case 'twitter':
          await this.syncTwitterData(platform);
          break;
        case 'instagram':
          await this.syncInstagramData(platform);
          break;
        // Add more platforms as needed
      }
      
      platform.lastSync = new Date().toISOString();
      this.platforms.set(platformId, platform);
    } catch (error) {
      console.error(`Sync failed for ${platformId}:`, error);
    }
  }

  private async syncLinkedInData(platform: SocialPlatform): Promise<void> {
    // LinkedIn API integration
    // This would use the LinkedIn API v2 to fetch user activities
    const mockData = {
      likes: 24,
      comments: 8,
      shares: 12,
      posts: ['post1', 'post2', 'post3']
    };
    
    // Process the data and extract behaviors
    for (const post of mockData.posts) {
      await this.trackBehavior({
        platform: 'linkedin',
        action: 'like',
        content: `Medical device innovation post ${post}`,
        timestamp: new Date().toISOString(),
        keywords: ['medical device', 'innovation']
      });
    }
  }

  private async syncTwitterData(platform: SocialPlatform): Promise<void> {
    // Twitter/X API integration
    // Similar to LinkedIn but using X API v2
    const mockData = {
      tweets: ['tweet1', 'tweet2'],
      likes: 45,
      retweets: 12
    };
    
    // Process Twitter data
  }

  private async syncInstagramData(platform: SocialPlatform): Promise<void> {
    // Instagram API integration
    // Process visual content and engagement
  }

  // Utility methods
  private getPlatformName(platformId: string): string {
    const names = {
      'linkedin': 'LinkedIn',
      'twitter': 'X (Twitter)',
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'youtube': 'YouTube'
    };
    return names[platformId] || platformId;
  }

  private getApiEndpoint(platformId: string): string {
    const endpoints = {
      'linkedin': 'https://api.linkedin.com/v2',
      'twitter': 'https://api.twitter.com/2',
      'instagram': 'https://graph.instagram.com',
      'facebook': 'https://graph.facebook.com',
      'youtube': 'https://www.googleapis.com/youtube/v3'
    };
    return endpoints[platformId] || '';
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    // In production, use more sophisticated NLP
    const keywords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Limit to 10 keywords
    
    return keywords;
  }

  private async categorizeContent(content: string, keywords: string[]): Promise<string> {
    // Simple categorization based on keywords
    // In production, use ML classification
    const categories = {
      'تجهیزات پزشکی': ['medical', 'device', 'equipment', 'پزشکی', 'تجهیزات'],
      'صادرات': ['export', 'international', 'trade', 'صادرات', 'بازرگانی'],
      'فناوری سلامت': ['health tech', 'digital health', 'telemedicine', 'سلامت'],
      'آموزش پزشکی': ['medical education', 'training', 'آموزش', 'پزشکی'],
      'نوآوری': ['innovation', 'startup', 'technology', 'نوآوری', 'فناوری']
    };

    for (const [category, categoryKeywords] of Object.entries(categories)) {
      if (keywords.some(kw => categoryKeywords.some(ck => kw.includes(ck)))) {
        return category;
      }
    }

    return 'general';
  }

  private hasUserConsent(): boolean {
    // Check if user has given consent for behavioral tracking
    // This should integrate with a proper consent management system
    return localStorage.getItem('social_tracking_consent') === 'true';
  }

  // Public getters
  getConnectedPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.connected);
  }

  getTopInterests(limit: number = 5): Interest[] {
    return Array.from(this.interests.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  getRecentBehaviors(limit: number = 10): UserBehavior[] {
    return this.behaviors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * پاکسازی کامل تمام داده‌های رسانه‌های اجتماعی
   */
  cleanupAllData(): void {
    // پاک کردن Map ها و آرایه‌ها
    this.platforms.clear();
    this.behaviors = [];
    this.interests.clear();
    
    // پاک کردن localStorage
    localStorage.removeItem('social_tracking_consent');
    localStorage.removeItem('social_platforms');
    localStorage.removeItem('social_behaviors');
    localStorage.removeItem('social_interests');
    
    console.log('✅ داده‌های رسانه‌های اجتماعی پاک شدند');
  }
}

export const socialMediaService = new SocialMediaService();