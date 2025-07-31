// Base types for AI Insights
export interface InsightResult {
  insightId: string;
  hasSignificantFinding: boolean;
  data: any;
  summary?: string;
  actionsTitle?: string;
  actions?: string[];
  context?: {
    dateRange: string;
    timeframe: string;
    seasonalEvents?: string[];
    anomalies?: any[];
  };
}

export interface ProcessedInsight {
  title: string;
  summary: string;
  actionsTitle?: string;
  actions: string[];
}

export interface InsightCategory {
  icon: JSX.Element;
  title: string;
  insights: ProcessedInsight[];
}

export interface ExecutiveSummaryData {
  totalRevenue: string;
  dateRange: string;
  keyFindings: string[];
  metrics: {
    value: string;
    label: string;
  }[];
}

export interface TopPriority {
  insight: InsightResult;
  urgency: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

// Enhanced Analysis Types
export interface EnhancedInsight {
  originalInsight: {
    insightId: string;
    title: string;
    category: string;
    data: any;
    significance: number;
    confidence: number;
    recommendations: string[];
  };
  aiEnhancement: {
    deeperAnalysis: string;
    rootCause: string;
    predictedImpact: string;
    specificActions: string[];
  };
}

export interface CustomDiscovery {
  title: string;
  finding: string;
  evidence: string;
  estimatedValue: number;
  implementation: string;
}

export interface StrategicSynthesis {
  biggestOpportunity: string;
  primaryRisk: string;
  prioritizedActions: Array<{
    action: string;
    expectedROI: string;
    timeframe: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface EnhancedAnalysis {
  insights: { [insightId: string]: EnhancedInsight };
  customDiscoveries: CustomDiscovery[];
  strategicSynthesis: StrategicSynthesis;
}

export interface AIInsightsReport {
  executiveSummary: ExecutiveSummaryData;
  categories: InsightCategory[];
  topPriorities: TopPriority[];
  enhancedAnalysis?: EnhancedAnalysis;
}

// Significance thresholds
export const SIGNIFICANCE_THRESHOLDS = {
  revenue: {
    percentDifference: 0.20, // 20% difference to be significant
    minSampleSize: 3
  },
  engagement: {
    percentDifference: 0.15, // 15% difference
    minSampleSize: 3
  },
  spam: {
    absoluteDifference: 0.0005, // 0.05% absolute
    relativeDifference: 2, // 2x relative
    minSampleSize: 3
  },
  unsubscribe: {
    absoluteDifference: 0.001, // 0.1% absolute
    relativeDifference: 1.5, // 50% relative
    minSampleSize: 3
  }
};

// Date range for analysis (last 90 days)
export const ANALYSIS_DAYS = 90;
