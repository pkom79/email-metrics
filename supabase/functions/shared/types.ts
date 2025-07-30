// Shared TypeScript types for email insights processing
export interface ProcessingRequest {
  campaigns: ProcessedCampaign[];
  flows: ProcessedFlowEmail[];
  subscribers: ProcessedSubscriber[];
  context?: {
    storeName?: string;
    productDescription?: string;
    priceRange?: string;
    slowMonths?: string[];
  };
  dateRange: string;
  accountId: string;
  jobId: string;
}

export interface InsightResult {
  insightId: string;
  title: string;
  category: string;
  data: any;
  significance: number;
  confidence: number;
  recommendations: string[];
}

export interface ProcessedCampaign {
  id: string;
  subject: string;
  sentDate: Date;
  emailsSent: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalOrders: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  spamRate: number;
  bounceRate: number;
}

export interface ProcessedFlowEmail {
  id: string;
  flowName: string;
  emailName: string;
  sentDate: Date;
  status: string;
  emailsSent: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalOrders: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  spamRate: number;
  bounceRate: number;
}

export interface ProcessedSubscriber {
  id: string;
  email: string;
  status: string;
  subscriptionDate: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  tags: string[];
  location?: string;
  source?: string;
}
