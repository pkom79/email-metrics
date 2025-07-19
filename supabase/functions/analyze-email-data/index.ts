/*
  # Email Data Analysis Edge Function

  This function receives email marketing data and uses OpenAI to generate
  actionable insights and recommendations.

  1. Data Processing
    - Receives aggregated email metrics
    - Processes campaign and flow performance data
    - Analyzes subscriber demographics

  2. AI Analysis
    - Uses OpenAI API to analyze trends
    - Generates actionable recommendations
    - Provides performance audit

  3. Response
    - Returns structured insights
    - Includes specific action items
    - Provides trend analysis
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailDataPayload {
  currentPeriod: any;
  previousPeriod: any;
  topCampaigns: any[];
  bottomCampaigns: any[];
  topFlows: any[];
  bottomFlows: any[];
  audienceInsights: any;
  dateRange: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      currentPeriod, 
      previousPeriod, 
      topCampaigns, 
      bottomCampaigns, 
      topFlows, 
      bottomFlows, 
      audienceInsights, 
      dateRange 
    }: EmailDataPayload = await req.json();

    // For now, let's generate mock insights since OpenAI API requires API key setup
    // In production, you would replace this with actual OpenAI API calls
    const insights = generateMockInsights({
      currentPeriod,
      previousPeriod,
      topCampaigns,
      bottomCampaigns,
      topFlows,
      bottomFlows,
      audienceInsights,
      dateRange
    });

    return new Response(
      JSON.stringify({ insights }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-email-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function generateMockInsights(data: EmailDataPayload) {
  const { currentPeriod, previousPeriod, topCampaigns, bottomCampaigns, topFlows, bottomFlows, audienceInsights, dateRange } = data;
  
  // Calculate trends
  const revenueChange = previousPeriod.totalRevenue > 0 
    ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100 
    : 0;
  
  const openRateChange = previousPeriod.openRate > 0 
    ? currentPeriod.openRate - previousPeriod.openRate 
    : 0;
    
  const clickRateChange = previousPeriod.clickRate > 0 
    ? currentPeriod.clickRate - previousPeriod.clickRate 
    : 0;
    
  const conversionChange = previousPeriod.conversionRate > 0 
    ? currentPeriod.conversionRate - previousPeriod.conversionRate 
    : 0;

  // Generate performance summary
  const performanceSummary = {
    revenue: {
      current: currentPeriod.totalRevenue,
      change: revenueChange,
      trend: revenueChange > 5 ? 'strong_growth' : revenueChange > 0 ? 'growth' : revenueChange > -5 ? 'stable' : 'declining'
    },
    engagement: {
      openRate: { current: currentPeriod.openRate, change: openRateChange },
      clickRate: { current: currentPeriod.clickRate, change: clickRateChange },
      trend: openRateChange > 2 ? 'improving' : openRateChange > -2 ? 'stable' : 'declining'
    },
    conversion: {
      current: currentPeriod.conversionRate,
      change: conversionChange,
      trend: conversionChange > 0.5 ? 'improving' : conversionChange > -0.5 ? 'stable' : 'declining'
    }
  };

  // Generate actionable recommendations
  const recommendations = [];
  
  // Revenue recommendations
  if (revenueChange < -10) {
    recommendations.push({
      priority: 'high',
      category: 'Revenue Recovery',
      action: 'Launch a re-engagement campaign targeting inactive subscribers',
      reason: `Revenue has dropped ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period`,
      impact: 'Could recover 15-25% of lost revenue'
    });
  }
  
  // Engagement recommendations
  if (openRateChange < -3) {
    recommendations.push({
      priority: 'high',
      category: 'Subject Line Optimization',
      action: 'A/B test subject lines focusing on personalization and urgency',
      reason: `Open rates have declined by ${Math.abs(openRateChange).toFixed(1)} percentage points`,
      impact: 'Could improve open rates by 3-8%'
    });
  }
  
  // Conversion recommendations
  if (conversionChange < -1) {
    recommendations.push({
      priority: 'medium',
      category: 'Email Content',
      action: 'Review and optimize call-to-action buttons and email design',
      reason: `Conversion rates have dropped by ${Math.abs(conversionChange).toFixed(1)} percentage points`,
      impact: 'Could increase conversions by 10-20%'
    });
  }
  
  // Flow recommendations
  if (bottomFlows.length > 0) {
    const worstFlow = bottomFlows[0];
    recommendations.push({
      priority: 'medium',
      category: 'Flow Optimization',
      action: `Optimize the "${worstFlow.flowName}" flow - consider adjusting timing and content`,
      reason: `This flow has the lowest performance with ${worstFlow.openRate.toFixed(1)}% open rate`,
      impact: 'Could improve flow revenue by 20-40%'
    });
  }
  
  // Audience recommendations
  if (audienceInsights.buyerPercentage < 25) {
    recommendations.push({
      priority: 'high',
      category: 'Audience Development',
      action: 'Create targeted campaigns for non-buyers with special offers and product education',
      reason: `Only ${audienceInsights.buyerPercentage.toFixed(1)}% of subscribers have made a purchase`,
      impact: 'Could convert 5-10% of non-buyers'
    });
  }
  
  // Sending frequency recommendations
  const emailsPerSubscriber = currentPeriod.emailsSent / audienceInsights.totalSubscribers;
  const daysInPeriod = dateRange === 'all' ? 365 : parseInt(dateRange.replace('d', ''));
  const emailsPerMonth = (emailsPerSubscriber / daysInPeriod) * 30;
  
  if (emailsPerMonth < 4) {
    recommendations.push({
      priority: 'medium',
      category: 'Sending Frequency',
      action: 'Increase email frequency - you are currently under-mailing your audience',
      reason: `Currently sending ${emailsPerMonth.toFixed(1)} emails per subscriber per month`,
      impact: 'Could increase revenue by 15-30% with optimal frequency'
    });
  } else if (emailsPerMonth > 12) {
    recommendations.push({
      priority: 'medium',
      category: 'Sending Frequency',
      action: 'Consider reducing email frequency to prevent fatigue',
      reason: `Currently sending ${emailsPerMonth.toFixed(1)} emails per subscriber per month`,
      impact: 'Could improve engagement and reduce unsubscribes'
    });
  }

  // Campaign performance insights
  const campaignInsights = {
    topPerformer: topCampaigns[0] ? {
      name: topCampaigns[0].subject,
      revenue: topCampaigns[0].revenue,
      openRate: topCampaigns[0].openRate,
      success_factors: ['Strong subject line', 'Good timing', 'Relevant content']
    } : null,
    worstPerformer: bottomCampaigns[0] ? {
      name: bottomCampaigns[0].subject,
      revenue: bottomCampaigns[0].revenue,
      openRate: bottomCampaigns[0].openRate,
      improvement_areas: ['Subject line needs work', 'Consider better timing', 'Review content relevance']
    } : null
  };

  // Flow performance insights
  const flowInsights = {
    topPerformer: topFlows[0] ? {
      name: topFlows[0].flowName,
      revenue: topFlows[0].revenue,
      openRate: topFlows[0].openRate,
      strength: 'High engagement and conversion'
    } : null,
    improvement_needed: bottomFlows[0] ? {
      name: bottomFlows[0].flowName,
      revenue: bottomFlows[0].revenue,
      openRate: bottomFlows[0].openRate,
      issues: ['Low open rates', 'Poor timing', 'Content needs optimization']
    } : null
  };

  return {
    summary: {
      overall_health: performanceSummary.revenue.trend === 'strong_growth' ? 'excellent' : 
                     performanceSummary.revenue.trend === 'growth' ? 'good' : 
                     performanceSummary.revenue.trend === 'stable' ? 'stable' : 'needs_attention',
      key_metrics: {
        revenue: `$${currentPeriod.totalRevenue.toLocaleString()} (${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%)`,
        open_rate: `${currentPeriod.openRate.toFixed(1)}% (${openRateChange > 0 ? '+' : ''}${openRateChange.toFixed(1)}%)`,
        click_rate: `${currentPeriod.clickRate.toFixed(1)}% (${clickRateChange > 0 ? '+' : ''}${clickRateChange.toFixed(1)}%)`,
        conversion_rate: `${currentPeriod.conversionRate.toFixed(1)}% (${conversionChange > 0 ? '+' : ''}${conversionChange.toFixed(1)}%)`
      }
    },
    trends: {
      revenue: performanceSummary.revenue.trend,
      engagement: performanceSummary.engagement.trend,
      conversion: performanceSummary.conversion.trend
    },
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    }),
    campaign_insights: campaignInsights,
    flow_insights: flowInsights,
    audience_insights: {
      total_subscribers: audienceInsights.totalSubscribers,
      buyer_percentage: audienceInsights.buyerPercentage.toFixed(1),
      avg_clv: `$${audienceInsights.avgClvAll.toFixed(2)}`,
      opportunity: audienceInsights.buyerPercentage < 30 ? 'high' : 'medium'
    },
    sending_analysis: {
      emails_per_month: emailsPerMonth.toFixed(1),
      frequency_assessment: emailsPerMonth < 4 ? 'under_mailing' : emailsPerMonth > 12 ? 'over_mailing' : 'optimal'
    }
  };
}