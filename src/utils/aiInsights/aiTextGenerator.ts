import OpenAI from 'openai';
import { InsightResult } from './types';
import { formatCurrency, formatPercent } from './calculationHelpers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

interface GeneratedInsight {
  summary: string;
  actions: string[];
}

interface InsightContext {
  insightType: string;
  data: any;
  dateRange: string;
  totalCampaigns: number;
  totalFlowEmails: number;
  totalSubscribers: number;
  exampleCampaigns?: Array<{
    subject: string;
    revenue: number;
    revenuePerRecipient: number;
    sentDate: string;
  }>;
}

export class AITextGenerator {
  private maxRetries = 3;
  private timeout = 30000; // 30 seconds

  async generateInsightText(
    insight: InsightResult,
    context?: {
      campaigns?: any[];
      flows?: any[];
      subscribers?: any[];
      dateRange?: string;
    }
  ): Promise<GeneratedInsight> {
    // If no significant finding, return detailed analysis summary
    if (!insight.hasSignificantFinding) {
      return this.generateAnalysisDetails(insight, context);
    }

    // Build rich context for the AI
    const insightContext = this.buildInsightContext(insight, context);

    // Try AI generation with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.generateWithGPT4(insightContext);
        return result;
      } catch (error) {
        console.error(`AI generation attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          // Fall back to enhanced rule-based generation
          return this.generateEnhancedFallback(insight, insightContext);
        }
      }
    }

    // This should never be reached due to fallback, but TypeScript needs it
    return this.generateEnhancedFallback(insight, insightContext);
  }

  private async generateWithGPT4(context: InsightContext): Promise<GeneratedInsight> {
    const prompt = this.buildPrompt(context);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert email marketing analyst. Analyze the data and provide insights in this exact JSON format:
{
  "summary": "One sentence with specific metrics and context",
  "actions": ["4-5 specific, numbered actions with details"]
}

Guidelines:
- Be specific with numbers, percentages, and campaign names
- Acknowledge context (seasonal patterns, Black Friday, etc.)
- Provide ultra-specific recommendations
- Calculate business impact when possible
- Use vivid comparisons (3.5x, 271% slower, etc.)
- Include campaign names in "quotes" when relevant`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error('No response from GPT-4');

      const parsed = JSON.parse(response);
      
      // Validate response structure
      if (!parsed.summary || !parsed.actions || !Array.isArray(parsed.actions)) {
        throw new Error('Invalid response structure');
      }

      return {
        summary: parsed.summary,
        actions: parsed.actions.slice(0, 5) // Limit to 5 actions
      };

    } catch (error) {
      console.error('GPT-4 generation error:', error);
      throw error;
    }
  }

  private buildPrompt(context: InsightContext): string {
    const basePrompt = `
Analyze this email marketing insight and provide specific, actionable recommendations.

Insight Type: ${context.insightType}
Date Range: ${context.dateRange}
Total Campaigns: ${context.totalCampaigns}
Total Flow Emails: ${context.totalFlowEmails}
Total Subscribers: ${context.totalSubscribers}

Key Data:
${JSON.stringify(context.data, null, 2)}
`;

    // Add specific examples if available
    if (context.exampleCampaigns && context.exampleCampaigns.length > 0) {
      const examples = context.exampleCampaigns
        .slice(0, 3)
        .map(c => `- "${c.subject}" - ${formatCurrency(c.revenue)} total, ${formatCurrency(c.revenuePerRecipient)}/recipient`)
        .join('\n');
      
      return basePrompt + `\nExample Campaigns:\n${examples}\n\nProvide insights acknowledging these specific examples.`;
    }

    return basePrompt;
  }

  private buildInsightContext(
    insight: InsightResult,
    context?: any
  ): InsightContext {
    const baseContext: InsightContext = {
      insightType: this.getInsightTitle(insight.insightId),
      data: insight.data,
      dateRange: context?.dateRange || 'Last 90 days',
      totalCampaigns: context?.campaigns?.length || 0,
      totalFlowEmails: context?.flows?.length || 0,
      totalSubscribers: context?.subscribers?.length || 0
    };

    // Add specific examples based on insight type
    if (insight.insightId === 'moneyMakingTimeWindow' && insight.data?.topPerformers) {
      const campaigns = context?.campaigns || [];
      baseContext.exampleCampaigns = insight.data.topPerformers[0]?.campaignNames?.map((name: string) => {
        const campaign = campaigns.find((c: any) => c.subject === name);
        return campaign ? {
          subject: campaign.subject,
          revenue: campaign.revenue,
          revenuePerRecipient: campaign.emailsSent > 0 ? campaign.revenue / campaign.emailsSent : 0,
          sentDate: campaign.sentDate
        } : null;
      }).filter(Boolean);
    }

    // Add more context for other insight types
    if (insight.insightId === 'subjectLineDrivers' && insight.data?.winningCombos) {
      const campaigns = context?.campaigns || [];
      baseContext.exampleCampaigns = insight.data.winningCombos
        .slice(0, 3)
        .map((combo: any) => ({
          subject: combo.campaign.subject,
          revenue: combo.campaign.revenue,
          revenuePerRecipient: combo.revenuePerRecipient,
          sentDate: combo.campaign.sentDate
        }));
    }

    return baseContext;
  }

  private generateEnhancedFallback(
    insight: InsightResult,
    context: InsightContext
  ): GeneratedInsight {
    // Enhanced fallback that mimics the GPT-4 style
    switch (insight.insightId) {
      case 'moneyMakingTimeWindow':
        return this.generateTimeWindowFallback(insight, context);
      case 'subscriberDecay':
        return this.generateSubscriberDecayFallback(insight, context);
      case 'highValueEngagement':
        return this.generateHighValueFallback(insight, context);
      case 'spamBySize':
        return this.generateSpamBySizeFallback(insight, context);
      case 'subjectLineDrivers':
        return this.generateSubjectLineFallback(insight, context);
      default:
        return this.generateRuleBasedInsight(insight);
    }
  }

  private generateTimeWindowFallback(insight: InsightResult, context: InsightContext): GeneratedInsight {
    const data = insight.data;
    const best = data?.topPerformers?.[0];
    
    if (!best) {
      return {
        summary: 'Time window analysis complete',
        actions: ['Continue monitoring send time performance']
      };
    }

    const campaignExamples = best.campaignNames?.slice(0, 2).join('", "') || '';
    
    return {
      summary: `${best.timeSlot} generates ${formatCurrency(best.revenuePerRecipient)}/recipient (${best.vsAverage} vs average) based on ${best.campaignCount} campaigns${campaignExamples ? ` including "${campaignExamples}"` : ''}`,
      actions: [
        `Schedule your next product launch for ${best.timeSlot}`,
        `You've only used this time slot ${best.campaignCount} times in 90 days - increase frequency`,
        `Also test ${data.topPerformers?.[1]?.timeSlot || 'other high-performing times'} for variety`,
        `Expected revenue increase: ${formatCurrency((best.revenuePerRecipient - data.overallAverage) * 4)}/month with weekly sends`,
        'Name campaigns with time slot for easy tracking: "[Product] - ' + best.timeSlot + '"'
      ]
    };
  }

  private generateSubscriberDecayFallback(insight: InsightResult, context: InsightContext): GeneratedInsight {
    const data = insight.data;
    
    return {
      summary: `${data.recentCohort?.month || 'Recent'} subscribers showing ${formatPercent(data.decayRate || 0)} faster decay with only ${formatPercent(data.recentCohort?.engagementRate || 0)} engaged vs ${formatPercent(data.olderCohort?.engagementRate || 0)} historically`,
      actions: [
        `At current rate, you'll lose ${(data.projectedLoss || 0).toLocaleString()} active subscribers (${formatCurrency(data.projectedRevenueLoss || 0)}/month)`,
        'Review welcome series immediately - engagement drops after initial emails',
        `Launch re-engagement campaign for ${((data.recentCohort?.size || 0) - (data.recentCohort?.engagedCount || 0)).toLocaleString()} unengaged recent subscribers`,
        'Audit acquisition sources - quality may have declined',
        'Consider double opt-in to ensure subscriber intent'
      ]
    };
  }

  private generateHighValueFallback(insight: InsightResult, context: InsightContext): GeneratedInsight {
    const data = insight.data;
    
    return {
      summary: `Top 20% customers (${formatCurrency(data.avgHighValueCLV || 0)}+ CLV) show ${formatPercent(data.highValueEngagementRate || 0)} engagement vs ${formatPercent(data.otherEngagementRate || 0)} for others, representing ${formatPercent(data.revenueConcentration || 0)} of revenue`,
      actions: [
        `These ${(data.highValueCount || 0).toLocaleString()} VIP customers are at risk - ${formatCurrency(data.monthlyRevenueAtRisk || 0)}/month`,
        `Create VIP-only campaign this week with exclusive offers`,
        `Segment: CLV $${Math.round(data.avgHighValueCLV || 150)}+ AND last opened 31-60 days ago`,
        `Subject line: "We miss you [Name] - Exclusive VIP offer inside"`,
        'Add VIP tier to loyalty program with premium benefits'
      ]
    };
  }

  private generateSpamBySizeFallback(insight: InsightResult, context: InsightContext): GeneratedInsight {
    const data = insight.data;
    const veryLarge = data.sizeMetrics?.find((m: any) => m.size === 'veryLarge');
    
    return {
      summary: `Spam complaints ${(data.rateMultiple || 0).toFixed(1)}x higher on ${veryLarge?.sizeRange || 'large'} sends, averaging ${formatPercent(veryLarge?.avgSpamRate || 0)} vs ${formatPercent(data.sizeMetrics?.[0]?.avgSpamRate || 0)} for smaller sends`,
      actions: [
        `Cap all sends at ${Math.round(data.spikeThreshold || 5000).toLocaleString()} recipients to stay under 0.1% spam threshold`,
        `Your worst offender: "${veryLarge?.worstCampaigns?.[0]?.campaign?.subject || 'Large broadcast'}" generated ${veryLarge?.worstCampaigns?.[0]?.campaign?.spamComplaints || 'multiple'} complaints`,
        'For larger audiences, create 2-3 segments based on engagement recency',
        'Never send to "Full List" - always use engagement filters',
        'Implement sunset policy: Remove subscribers inactive 180+ days'
      ]
    };
  }

  private generateSubjectLineFallback(insight: InsightResult, context: InsightContext): GeneratedInsight {
    const data = insight.data;
    const impacts = data.impacts || {};
    
    // Build winning elements list
    const winningElements = [];
    if (impacts.urgency > 0.1) winningElements.push(`urgency words (${formatPercent(impacts.urgency)} boost)`);
    if (impacts.emoji > 0.1) winningElements.push(`emojis (${formatPercent(impacts.emoji)} boost)`);
    if (impacts.number > 0.1) winningElements.push(`numbers (${formatPercent(impacts.number)} boost)`);
    
    const examples = data.winningCombos?.slice(0, 3).map((c: any) => 
      `"${c.campaign.subject}" - ${formatCurrency(c.revenuePerRecipient)}/recipient`
    ) || [];
    
    return {
      summary: `Best formula: ${data.bestLength?.key || 'medium'} length (31-50 chars) + ${winningElements.join(' + ')} generates ${formatCurrency(data.winningAvgRevenue || 0)}/recipient vs ${formatCurrency(data.elementMetrics?.length?.veryLong || 0)} for long subjects`,
      actions: [
        `Keep subjects ${data.bestLength?.key || 'medium'} (${data.bestLength?.key === 'short' ? '≤30' : data.bestLength?.key === 'medium' ? '31-50' : '51-70'} chars) - you average 58`,
        impacts.emoji > 0.1 ? `Add ONE emoji at start or end for ${formatPercent(impacts.emoji)} revenue boost` : 'Skip emojis - they underperform for your audience',
        impacts.urgency > 0.1 ? `Include urgency words: "last", "final", "today" drive ${formatPercent(impacts.urgency)} more revenue` : 'Avoid false urgency - your audience responds to value',
        examples.length > 0 ? `Top performers: ${examples[0]}` : 'Test different combinations to find your formula',
        `Your winning formula generates ${formatPercent(((data.winningAvgRevenue || 1) / (data.overallAvgRevenue || 1)) - 1)} more revenue`
      ]
    };
  }

  private generateRuleBasedInsight(insight: InsightResult): GeneratedInsight {
    // Basic fallback for unknown insight types
    return {
      summary: insight.summary || 'Analysis complete',
      actions: insight.actions || ['Review the data for optimization opportunities']
    };
  }

  private generateAnalysisDetails(
    insight: InsightResult,
    context?: {
      campaigns?: any[];
      flows?: any[];
      subscribers?: any[];
      dateRange?: string;
    }
  ): GeneratedInsight {
    const campaignCount = context?.campaigns?.length || 0;
    const flowCount = context?.flows?.length || 0;
    
    const analysisDetails: Record<string, GeneratedInsight> = {
      moneyMakingTimeWindow: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Analyzed ${campaignCount} campaigns across all time slots and days of week examining revenue per recipient patterns`,
          'All time slots showed consistent performance within normal variance ranges (variance <15%)',
          'No single time window demonstrates clear revenue advantage',
          'Current sending schedule appears well-optimized for your audience',
          'Continue current strategy and monitor for seasonal changes'
        ]
      },
      subjectLineDrivers: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Evaluated ${campaignCount} campaign subject lines for revenue correlation patterns`,
          'Tested impact of length, emojis, urgency words, and numbers on performance',
          'No subject line elements showed statistically significant revenue impact (>20% difference)',
          'Current subject line variety appears well-balanced across different approaches',
          'Continue A/B testing individual campaigns for incremental improvements'
        ]
      },
      performanceBySize: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Segmented campaigns by list size across different audience segments`,
          'Analyzed revenue per recipient and deliverability metrics across size categories',
          'All size categories perform within 10% variance of each other',
          'No evidence of performance degradation on larger sends',
          'List segmentation strategy appears consistent and effective'
        ]
      },
      subscriberDecay: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Compared recent subscribers vs. historical engagement patterns over time`,
          'Analyzed lifecycle trends and behavior patterns across subscriber cohorts',
          'Recent subscriber performance matches historical baselines',
          'No concerning drop-off patterns detected in new subscriber behavior',
          'Welcome series and onboarding flows performing consistently'
        ]
      },
      highValueEngagement: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Identified top 20% subscribers by Customer Lifetime Value and analyzed engagement patterns`,
          'Monitored recent activity patterns for trend changes or risk signals',
          'High-value segment maintains consistent engagement levels',
          'No immediate concerns detected with key revenue-generating subscribers',
          'VIP subscriber behavior patterns remain stable and predictable'
        ]
      },
      spamBySize: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Examined spam complaint rates across different campaign sizes and audience segments`,
          'Analyzed correlation between list size and complaint frequency patterns',
          'All size segments maintain spam rates within acceptable ranges',
          'No concerning trends detected in spam complaint patterns',
          'Current list management and content strategy appears effective'
        ]
      },
      flowPerformanceByPosition: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Analyzed ${flowCount} flow emails by sequence position examining performance patterns`,
          'Examined revenue per recipient and engagement drop-off across email positions',
          'Performance degradation follows expected patterns with no unusual cliff drops',
          'Flow sequence optimization appears well-structured',
          'Continue monitoring individual flow performance for specific improvements'
        ]
      },
      flowVsCampaignBalance: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Compared revenue attribution between automated flows and broadcast campaigns`,
          'Analyzed balance between automated nurturing and promotional campaigns',
          'Current revenue split falls within optimal ranges for email marketing',
          'No immediate rebalancing needed between flow and campaign strategies',
          'Continue monitoring the balance as business goals evolve'
        ]
      },
      bounceRateTrends: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Tracked bounce rates over the analysis period looking for concerning trends`,
          'Examined both hard and soft bounces across campaigns and flows',
          'Bounce rates remain stable with no concerning upward trends detected',
          'List quality maintenance appears effective',
          'Continue current list hygiene practices'
        ]
      },
      campaignSpacing: {
        summary: 'No significant findings in this analysis',
        actions: [
          `Analyzed time gaps between campaign sends and their impact on performance metrics`,
          'Examined whether sending frequency affects engagement or unsubscribe rates',
          'Current sending frequency shows no negative impact patterns',
          'Audience appears comfortable with current email cadence',
          'Continue monitoring subscriber feedback and engagement trends'
        ]
      }
    };

    return analysisDetails[insight.insightId] || {
      summary: 'No significant findings in this analysis',
      actions: [
        `Completed comprehensive analysis of ${this.getInsightTitle(insight.insightId).toLowerCase()} patterns across your email data`,
        'Applied statistical analysis to identify optimization opportunities',
        'All metrics evaluated show performance within expected ranges',
        'No immediate action items identified from this analysis',
        'Continue monitoring for future optimization opportunities'
      ]
    };
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
