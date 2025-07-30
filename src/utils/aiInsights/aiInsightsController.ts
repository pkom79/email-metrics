import { ProcessedCampaign, ProcessedFlowEmail, ProcessedSubscriber } from '../dataTypes';
import { InsightResult, AIInsightsReport, TopPriority } from './types';
import { formatCurrency, formatPercent } from './calculationHelpers';
import { getDateRange, detectSeasonalEvents } from './dateUtils';
import { AITextGenerator } from './aiTextGenerator';

// Import all processors
import { 
  analyzeMoneyMakingTimeWindow, 
  analyzeDayOfWeekReliability 
} from './processors/timingInsights';
import {
  analyzeFlowEmailsToCut,
  analyzeFlowVsCampaignBalance,
  analyzeFlowPerformanceByPosition,
  analyzeFlowDayOfWeekPerformance,
  analyzeListSizeImpactOnFlows
} from './processors/flowInsights';
import {
  analyzeSubjectLineDrivers,
  analyzeCampaignSpacing,
  analyzeZeroOrderCampaigns,
  analyzeCampaignThemes,
  analyzeClickToPurchaseDropoff
} from './processors/campaignInsights';
import {
  analyzeSubscriberDecay,
  analyzeSubscriberLifecycle,
  analyzeHighValueEngagement,
  analyzeListGrowthQuality,
  analyzeNewSubscriberEngagement
} from './processors/subscriberInsights';
import {
  analyzeCampaignFatigue,
  analyzeBounceTrend,
  analyzeSpamBySize,
  analyzeRevenueConcentration,
  analyzeRevenuePerEmailTrend,
  analyzeRevenueClustering,
  analyzeCampaignPerformanceBySize,
  analyzePerfectCampaignRecipe
} from './processors/performanceInsights';

// Define insight categories and their processors
const INSIGHT_PROCESSORS = {
  flow: [
    { id: 'flowEmailsToCut', processor: analyzeFlowEmailsToCut, type: 'flows' as const },
    { id: 'flowVsCampaignBalance', processor: analyzeFlowVsCampaignBalance, type: 'flowsAndCampaigns' as const },
    { id: 'flowPerformanceByPosition', processor: analyzeFlowPerformanceByPosition, type: 'flows' as const },
    { id: 'flowDayOfWeekPerformance', processor: analyzeFlowDayOfWeekPerformance, type: 'flows' as const },
    { id: 'listSizeFlowImpact', processor: analyzeListSizeImpactOnFlows, type: 'flowsAndSubscribers' as const }
  ],
  campaign: [
    { id: 'subjectLineDrivers', processor: analyzeSubjectLineDrivers, type: 'campaigns' as const },
    { id: 'campaignSpacing', processor: analyzeCampaignSpacing, type: 'campaigns' as const },
    { id: 'zeroOrderCampaigns', processor: analyzeZeroOrderCampaigns, type: 'campaigns' as const },
    { id: 'campaignThemes', processor: analyzeCampaignThemes, type: 'campaigns' as const },
    { id: 'clickToPurchaseDropoff', processor: analyzeClickToPurchaseDropoff, type: 'campaigns' as const }
  ],
  subscriber: [
    { id: 'subscriberDecay', processor: analyzeSubscriberDecay, type: 'all' as const },
    { id: 'subscriberLifecycle', processor: analyzeSubscriberLifecycle, type: 'subscribers' as const },
    { id: 'highValueEngagement', processor: analyzeHighValueEngagement, type: 'subscribers' as const },
    { id: 'listGrowthQuality', processor: analyzeListGrowthQuality, type: 'subscribers' as const },
    { id: 'newSubscriberEngagement', processor: analyzeNewSubscriberEngagement, type: 'subscribers' as const }
  ],
  listHealth: [
    { id: 'campaignFatigue', processor: analyzeCampaignFatigue, type: 'campaigns' as const },
    { id: 'bounceTrend', processor: analyzeBounceTrend, type: 'campaigns' as const },
    { id: 'spamBySize', processor: analyzeSpamBySize, type: 'campaigns' as const }
  ],
  revenue: [
    { id: 'revenueConcentration', processor: analyzeRevenueConcentration, type: 'campaigns' as const },
    { id: 'revenuePerEmailTrend', processor: analyzeRevenuePerEmailTrend, type: 'campaigns' as const },
    { id: 'revenueClustering', processor: analyzeRevenueClustering, type: 'campaigns' as const },
    { id: 'performanceBySize', processor: analyzeCampaignPerformanceBySize, type: 'campaigns' as const },
    { id: 'perfectRecipe', processor: analyzePerfectCampaignRecipe, type: 'campaigns' as const }
  ],
  timing: [
    { id: 'moneyMakingTimeWindow', processor: analyzeMoneyMakingTimeWindow, type: 'campaigns' as const },
    { id: 'dayOfWeekReliability', processor: analyzeDayOfWeekReliability, type: 'campaigns' as const }
  ]
};

export class AIInsightsController {
  private campaigns: ProcessedCampaign[];
  private flows: ProcessedFlowEmail[];
  private subscribers: ProcessedSubscriber[];
  private dateRange: ReturnType<typeof getDateRange>;
  private seasonalEvents: string[];
  private textGenerator: AITextGenerator;

  constructor(
    campaigns: ProcessedCampaign[],
    flows: ProcessedFlowEmail[],
    subscribers: ProcessedSubscriber[]
  ) {
    this.campaigns = campaigns;
    this.flows = flows;
    this.subscribers = subscribers;
    this.dateRange = getDateRange(90);
    this.seasonalEvents = detectSeasonalEvents(this.dateRange);
    this.textGenerator = new AITextGenerator();
  }

  async generateInsights(): Promise<AIInsightsReport> {
    console.log('Starting AI Insights generation...');
    
    // Process all insights
    const allInsights = await this.processAllInsights();
    
    // Filter significant insights
    const significantInsights = allInsights.filter(insight => insight.hasSignificantFinding);
    
    console.log(`Found ${significantInsights.length} significant insights out of ${allInsights.length} total`);
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(significantInsights);
    
    // Organize insights by category
    const categorizedInsights = this.categorizeInsights(significantInsights);
    
    // Generate top priorities
    const topPriorities = this.generateTopPriorities(significantInsights);
    
    return {
      executiveSummary,
      categories: categorizedInsights,
      topPriorities
    };
  }

  private async processAllInsights(): Promise<InsightResult[]> {
    const results: InsightResult[] = [];
    
    for (const [category, processors] of Object.entries(INSIGHT_PROCESSORS)) {
      console.log(`Processing ${category} insights...`);
      
      for (const { id, processor, type } of processors) {
        try {
          let result: InsightResult;
          
          switch (type) {
            case 'all':
              result = await processor(this.subscribers, this.campaigns, this.flows);
              break;
            case 'flowsAndSubscribers':
              result = await processor(this.flows, this.subscribers);
              break;
            case 'flowsAndCampaigns':
              result = await processor(this.flows, this.campaigns);
              break;
            case 'flows':
              result = await processor(this.flows);
              break;
            case 'campaigns':
              result = await processor(this.campaigns);
              break;
            case 'subscribers':
              result = await processor(this.subscribers);
              break;
            default:
              throw new Error(`Unknown processor type: ${type}`);
          }
          
          // Add context
          if (result.context) {
            result.context.seasonalEvents = this.seasonalEvents;
          }
          
          // Enhance all insights with AI-generated text (both significant and non-significant)
          const enhancedText = await this.textGenerator.generateInsightText(result, {
            campaigns: this.campaigns,
            flows: this.flows,
            subscribers: this.subscribers,
            dateRange: this.dateRange.formatted
          });
          if (enhancedText) {
            result.summary = enhancedText.summary;
            result.actions = enhancedText.actions;
          }
          
          results.push(result);
        } catch (error) {
          console.error(`Error processing ${id}:`, error);
          results.push({
            insightId: id,
            hasSignificantFinding: false,
            data: null,
            summary: `Error processing ${id} insight`
          });
        }
      }
    }
    
    return results;
  }

  private generateExecutiveSummary(insights: InsightResult[]): any {
    // Calculate total revenue
    const campaignRevenue = this.campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const flowRevenue = this.flows.reduce((sum, f) => sum + f.revenue, 0);
    const totalRevenue = campaignRevenue + flowRevenue;
    
    // Find key insights
    const riskInsights = insights.filter(i => 
      i.summary?.toLowerCase().includes('risk') || 
      i.summary?.toLowerCase().includes('declining') ||
      i.summary?.toLowerCase().includes('warning')
    );
    
    // Extract key findings
    const keyFindings = [];
    
    // Add flow vs campaign balance
    const flowBalance = insights.find(i => i.insightId === 'flowVsCampaignBalance');
    if (flowBalance?.data?.split) {
      keyFindings.push(`${formatPercent(flowBalance.data.split.flowPercentage)} from flows`);
    }
    
    // Add subscriber metrics
    const subscriberCount = this.subscribers.length;
    keyFindings.push(`${subscriberCount.toLocaleString()} subscribers`);
    
    // Add performance trend
    const revenueTrend = insights.find(i => i.insightId === 'revenuePerEmailTrend');
    if (revenueTrend?.data?.revenuePerEmailChange) {
      const change = revenueTrend.data.revenuePerEmailChange;
      keyFindings.push(`revenue/email ${change > 0 ? 'up' : 'down'} ${formatPercent(Math.abs(change))}`);
    }
    
    // Add risk alert if any
    if (riskInsights.length > 0) {
      keyFindings.push(`${riskInsights.length} risk alerts`);
    }
    
    // Calculate key metrics with proper weighted averages
    const totalEmails = this.campaigns.reduce((sum, c) => sum + c.emailsSent, 0) +
                       this.flows.reduce((sum, f) => sum + f.emailsSent, 0);
    const revenuePerEmail = totalEmails > 0 ? totalRevenue / totalEmails : 0;
    
    // Calculate weighted average open rate (campaigns + flows)
    const totalOpens = this.campaigns.reduce((sum, c) => sum + (c.openRate * c.emailsSent / 100), 0) +
                      this.flows.reduce((sum, f) => sum + (f.openRate * f.emailsSent / 100), 0);
    const avgOpenRate = totalEmails > 0 ? (totalOpens / totalEmails) * 100 : 0;
    
    return {
      totalRevenue: formatCurrency(totalRevenue),
      dateRange: this.dateRange.formatted,
      keyFindings: keyFindings.slice(0, 4),
      metrics: [
        { value: formatCurrency(totalRevenue), label: 'TOTAL REVENUE' },
        { value: formatCurrency(revenuePerEmail), label: 'PER EMAIL' },
        { value: formatPercent(avgOpenRate), label: 'AVG OPEN RATE' },
        { value: insights.length.toString(), label: 'INSIGHTS FOUND' }
      ]
    };
  }

  private categorizeInsights(insights: InsightResult[]): any[] {
    const categoryMap = {
      flow: {
        title: 'Flow Insights',
        insightIds: ['flowEmailsToCut', 'flowVsCampaignBalance', 'flowPerformanceByPosition', 
                     'flowDayOfWeekPerformance', 'listSizeFlowImpact']
      },
      campaign: {
        title: 'Campaign Insights',
        insightIds: ['subjectLineDrivers', 'campaignSpacing', 'zeroOrderCampaigns', 
                     'campaignThemes', 'clickToPurchaseDropoff']
      },
      subscriber: {
        title: 'Subscriber Insights',
        insightIds: ['subscriberDecay', 'subscriberLifecycle', 'highValueEngagement', 
                     'listGrowthQuality', 'newSubscriberEngagement']
      },
      listHealth: {
        title: 'List Health & Deliverability',
        insightIds: ['campaignFatigue', 'bounceTrend', 'spamBySize']
      },
      revenue: {
        title: 'Revenue & Performance Trends',
        insightIds: ['revenueConcentration', 'revenuePerEmailTrend', 'revenueClustering', 
                     'performanceBySize', 'moneyMakingTimeWindow']
      },
      timing: {
        title: 'Segmentation & Timing',
        insightIds: ['dayOfWeekReliability', 'perfectRecipe']
      }
    };
    
    const categories = [];
    
    for (const [, config] of Object.entries(categoryMap)) {
      const categoryInsights = config.insightIds.map(id => {
        const insight = insights.find(i => i.insightId === id);
        if (!insight) {
          // Return placeholder for missing insights
          return {
            title: this.getInsightTitle(id),
            summary: 'No significant findings',
            actionsTitle: 'No actions needed',
            actions: []
          };
        }
        
        return {
          title: this.getInsightTitle(id),
          summary: insight.summary || 'Analysis complete',
          actionsTitle: insight.actionsTitle || 'Recommended Actions:',
          actions: insight.actions || []
        };
      });
      
      categories.push({
        title: config.title,
        insights: categoryInsights
      });
    }
    
    return categories;
  }

  private generateTopPriorities(insights: InsightResult[]): TopPriority[] {
    // Score each insight based on impact
    const scoredInsights = insights.map(insight => {
      let score = 0;
      let impact = '';
      
      // Revenue impact
      if (insight.data?.projectedRevenueLoss) {
        score += 5;
        impact = `${formatCurrency(insight.data.projectedRevenueLoss)} at risk`;
      } else if (insight.data?.potentialLostRevenue) {
        score += 4;
        impact = `${formatCurrency(insight.data.potentialLostRevenue)} opportunity`;
      } else if (insight.data?.monthlyRevenueAtRisk) {
        score += 4;
        impact = `${formatCurrency(insight.data.monthlyRevenueAtRisk)}/month at risk`;
      }
      
      // Engagement impact
      if (insight.insightId.includes('decay') || insight.insightId.includes('fatigue')) {
        score += 3;
        if (!impact) impact = 'List health declining';
      }
      
      // Efficiency impact
      if (insight.insightId.includes('revenuePerEmail')) {
        score += 2;
        if (!impact && insight.data?.revenuePerEmailChange) {
          impact = `${formatPercent(Math.abs(insight.data.revenuePerEmailChange))} efficiency change`;
        }
      }
      
      // Quick wins
      if (insight.insightId.includes('perfectRecipe') || insight.insightId.includes('moneyMaking')) {
        score += 2;
        if (!impact) impact = 'Quick win opportunity';
      }
      
      return {
        insight,
        score,
        impact: impact || 'Performance improvement opportunity'
      };
    });
    
    // Sort by score and take top 5
    const topScored = scoredInsights
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return topScored.map(scored => ({
      title: scored.insight.summary || this.getInsightTitle(scored.insight.insightId),
      impact: scored.impact
    }));
  }

  private getInsightTitle(insightId: string): string {
    const titleMap: Record<string, string> = {
      flowEmailsToCut: 'Flow Emails That Should Be Cut',
      flowVsCampaignBalance: 'Flow vs Campaign Revenue Balance',
      flowPerformanceByPosition: 'Flow Performance by Position',
      flowDayOfWeekPerformance: 'Day-of-Week Flow Performance (Email 2+)',
      listSizeFlowImpact: 'List Size Impact on Flow Performance',
      subjectLineDrivers: 'Subject Line Revenue Drivers',
      campaignSpacing: 'Campaign Spacing Impact',
      zeroOrderCampaigns: 'Zero-Order High-Engagement Campaigns',
      campaignThemes: 'Campaign Theme Performance Analysis',
      clickToPurchaseDropoff: 'Click-to-Purchase Conversion Drop-off',
      subscriberDecay: 'Subscriber Decay Alert',
      subscriberLifecycle: 'Subscriber Lifecycle + Dead Weight',
      highValueEngagement: 'High-Value Subscriber Engagement',
      listGrowthQuality: 'Recent List Growth vs Quality',
      newSubscriberEngagement: 'New Subscriber Early Engagement Trend',
      campaignFatigue: 'Campaign Fatigue Pattern',
      bounceTrend: 'Bounce Rate Trend Analysis',
      spamBySize: 'Spam Complaint Rate by Campaign Size',
      revenueConcentration: 'Revenue Concentration Risk',
      revenuePerEmailTrend: 'Revenue Per Email Trend',
      revenueClustering: 'Revenue Clustering by Send Time',
      performanceBySize: 'Campaign Performance by List Size',
      moneyMakingTimeWindow: 'Your Money-Making Time Window',
      dayOfWeekReliability: 'Day-of-Week Revenue Reliability',
      perfectRecipe: 'Perfect Campaign Recipe Detector'
    };
    
    return titleMap[insightId] || insightId;
  }
}
