/*
  # Email Data Analysis Edge Function with OpenAI Integration

  This function receives email marketing data and uses OpenAI GPT to generate
  actionable insights and recommendations based on actual campaign performance data.

  1. Data Processing
    - Receives aggregated email metrics
    - Processes campaign and flow performance data
    - Analyzes subscriber demographics

  2. AI Analysis
    - Uses OpenAI GPT API to analyze trends and patterns
    - Generates specific, actionable recommendations
    - Provides comprehensive performance audit

  3. Response
    - Returns structured insights in JSON format
    - Includes specific action items with priority levels
    - Provides trend analysis and predictions
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

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
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

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      // Fall back to mock insights if no API key is configured
      const insights = generateFallbackInsights({
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
    }

    // Generate AI insights using OpenAI
    const insights = await generateAIInsights({
      currentPeriod,
      previousPeriod,
      topCampaigns,
      bottomCampaigns,
      topFlows,
      bottomFlows,
      audienceInsights,
      dateRange
    }, openaiApiKey);

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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
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

async function generateAIInsights(data: EmailDataPayload, apiKey: string) {
  const { currentPeriod, previousPeriod, topCampaigns, bottomCampaigns, topFlows, bottomFlows, audienceInsights, dateRange } = data;
  
  // Calculate key performance changes
  const revenueChange = previousPeriod.totalRevenue > 0 
    ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100 
    : 0;
  
  const openRateChange = previousPeriod.openRate > 0 
    ? currentPeriod.openRate - previousPeriod.openRate 
    : 0;
    
  const clickRateChange = previousPeriod.clickRate > 0 
    ? currentPeriod.clickRate - previousPeriod.clickRate 
    : 0;

  // Prepare comprehensive data summary for the AI
  const dataContext = {
    performance_summary: {
      current_period: {
        revenue: currentPeriod.totalRevenue,
        emails_sent: currentPeriod.emailsSent,
        open_rate: currentPeriod.openRate,
        click_rate: currentPeriod.clickRate,
        conversion_rate: currentPeriod.conversionRate,
        unsubscribe_rate: currentPeriod.unsubscribeRate,
        bounce_rate: currentPeriod.bounceRate,
        spam_rate: currentPeriod.spamRate
      },
      previous_period: {
        revenue: previousPeriod.totalRevenue,
        emails_sent: previousPeriod.emailsSent,
        open_rate: previousPeriod.openRate,
        click_rate: previousPeriod.clickRate,
        conversion_rate: previousPeriod.conversionRate
      },
      changes: {
        revenue_change_percent: revenueChange,
        open_rate_change: openRateChange,
        click_rate_change: clickRateChange
      }
    },
    top_campaigns: topCampaigns.slice(0, 3).map(c => ({
      subject: c.subject,
      revenue: c.revenue,
      open_rate: c.openRate,
      click_rate: c.clickRate,
      emails_sent: c.emailsSent
    })),
    bottom_campaigns: bottomCampaigns.slice(0, 3).map(c => ({
      subject: c.subject,
      revenue: c.revenue,
      open_rate: c.openRate,
      click_rate: c.clickRate,
      emails_sent: c.emailsSent
    })),
    top_flows: topFlows.slice(0, 3),
    bottom_flows: bottomFlows.slice(0, 3),
    audience: {
      total_subscribers: audienceInsights.totalSubscribers,
      buyer_percentage: audienceInsights.buyerPercentage,
      avg_clv: audienceInsights.avgClvAll
    },
    date_range: dateRange
  };

  // Create the AI prompt
  const prompt = `You are an expert email marketing analyst. Analyze the following email campaign data and provide actionable insights in the exact JSON format specified below.

EMAIL PERFORMANCE DATA:
${JSON.stringify(dataContext, null, 2)}

ANALYSIS REQUIREMENTS:
1. Subject Line Intelligence: Analyze the top and bottom performing campaign subjects to identify patterns in language, length, structure, and style that correlate with performance.

2. Audience Size Analysis: Evaluate the relationship between emails sent and performance metrics to identify optimal audience sizes.

3. Performance Trends: Compare current vs previous period to identify positive and negative trends.

4. Health Assessment: Evaluate spam rates, bounce rates, and unsubscribe rates to assess account health.

5. Actionable Recommendations: Provide specific, prioritized recommendations that can be implemented immediately.

6. Revenue Optimization: Identify opportunities to increase revenue per email and overall campaign ROI.

REQUIRED JSON OUTPUT FORMAT (respond with valid JSON only, no other text):
{
  "summary": {
    "overall_health": "excellent|good|stable|needs_attention",
    "key_metrics": {
      "revenue": "formatted revenue with change percentage",
      "open_rate": "formatted open rate with change",
      "click_rate": "formatted click rate with change", 
      "conversion_rate": "formatted conversion rate with change"
    }
  },
  "trends": {
    "revenue": "strong_growth|growth|stable|declining",
    "engagement": "improving|stable|declining",
    "conversion": "improving|stable|declining"
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "Subject Line Optimization|Audience Targeting|Send Timing|Content Strategy|List Health",
      "action": "specific actionable recommendation",
      "reason": "data-driven explanation",
      "impact": "expected business impact"
    }
  ],
  "campaign_insights": {
    "topPerformer": {
      "name": "campaign subject",
      "revenue": revenue_amount,
      "openRate": open_rate_number,
      "success_factors": ["factor1", "factor2", "factor3"]
    },
    "worstPerformer": {
      "name": "campaign subject", 
      "revenue": revenue_amount,
      "openRate": open_rate_number,
      "improvement_areas": ["area1", "area2", "area3"]
    }
  },
  "flow_insights": {
    "topPerformer": {
      "name": "flow name",
      "revenue": revenue_amount,
      "openRate": open_rate_number,
      "strength": "key strength description"
    },
    "improvement_needed": {
      "name": "flow name",
      "revenue": revenue_amount, 
      "openRate": open_rate_number,
      "issues": ["issue1", "issue2", "issue3"]
    }
  },
  "audience_insights": {
    "total_subscribers": subscriber_count,
    "buyer_percentage": "percentage_string",
    "avg_clv": "formatted_clv",
    "opportunity": "high|medium|low"
  },
  "sending_analysis": {
    "emails_per_month": "calculated_frequency",
    "frequency_assessment": "optimal|under_mailing|over_mailing"
  }
}

Provide insights based on the actual data patterns you observe. Focus on actionable recommendations that can drive real business results.`;

  try {
    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email marketing analyst who provides data-driven insights in structured JSON format. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse: OpenAIResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let insights;
    try {
      insights = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!insights.summary || !insights.recommendations || !insights.trends) {
      throw new Error('AI response missing required fields');
    }

    return insights;

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fall back to mock insights if AI fails
    return generateFallbackInsights(data);
  }
}

function generateFallbackInsights(data: EmailDataPayload) {
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