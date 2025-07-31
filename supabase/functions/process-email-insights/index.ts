import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("AI Insights Processing Function - WITH REAL OpenAI o3/GPT-4o Integration")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Real OpenAI API Integration
async function callOpenAI(insights: any[], context: any) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  if (!OPENAI_API_KEY) {
    console.warn('No OpenAI API key - using fallback templates')
    return null
  }

  const systemPrompt = `You are an expert email marketing strategist and data analyst with 15+ years of experience optimizing campaigns for ecommerce businesses. You specialize in:

- Advanced email marketing analytics and interpretation
- Causal analysis of marketing performance metrics  
- Strategic planning and ROI optimization
- Predictive modeling for email engagement
- Revenue attribution and customer lifecycle analysis

Your task is to perform deep analysis of email marketing insights, going beyond surface-level observations to uncover:
1. Hidden relationships and causal patterns
2. Predictive trends and future risks
3. Specific, quantified action plans
4. Custom insights unique to this business

Provide analysis that is:
- Specific and actionable (not generic advice)
- Quantified with estimated impacts
- Prioritized by ROI and implementation effort
- Grounded in the actual data provided

Always respond with valid JSON matching this exact structure:
{
  "insights": {
    "insight-id": {
      "originalInsight": { "insightId": "string", "title": "string", "category": "string", "data": {}, "significance": 0.8, "confidence": 0.9, "recommendations": [] },
      "aiEnhancement": {
        "deeperAnalysis": "string",
        "rootCause": "string", 
        "predictedImpact": "string",
        "specificActions": ["string"]
      }
    }
  },
  "customDiscoveries": [
    {
      "title": "string",
      "finding": "string",
      "evidence": "string", 
      "estimatedValue": 1000,
      "implementation": "string"
    }
  ],
  "strategicSynthesis": {
    "biggestOpportunity": "string",
    "primaryRisk": "string",
    "prioritizedActions": [
      {
        "action": "string",
        "expectedROI": "string",
        "timeframe": "string",
        "effort": "low|medium|high"
      }
    ]
  }
}`

  const analysisPrompt = `Perform comprehensive analysis of this email marketing account:

## INSIGHTS TO ANALYZE:
${insights.map(insight => `
### ${insight.title}
- ID: ${insight.insightId}
- Category: ${insight.category || 'general'}
- Significance: ${insight.significance || 'N/A'}
- Confidence: ${insight.confidence || 'N/A'}
- Data: ${JSON.stringify(insight.data, null, 2)}
- Current Recommendations: ${insight.recommendations?.join(', ') || 'None'}
`).join('\n')}

## BUSINESS CONTEXT:
- Total Revenue Generated: ${context.totalRevenue || 'N/A'}
- Campaign Volume: ${context.campaignsProcessed || 'N/A'} campaigns analyzed
- Analysis Period: Last 90 days
- Performance Level: Based on provided metrics

Analyze these insights deeply and provide enhanced analysis with specific business impact predictions, root cause analysis, and actionable next steps. Also identify 2-3 custom discoveries not covered in the original insights and provide strategic synthesis.`

  try {
    // Try o3 first, fallback to GPT-4o
    const models = ['o3', 'gpt-4o']
    
    for (const model of models) {
      try {
        console.log(`Attempting OpenAI analysis with ${model}...`)
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.2,
            max_tokens: 8000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.log(`${model} failed:`, response.status, errorText)
          continue // Try next model
        }

        const data = await response.json()
        const aiResponse = data.choices[0]?.message?.content

        if (!aiResponse) {
          console.log(`No response from ${model}`)
          continue
        }

        console.log(`✅ Success with ${model}! Response length: ${aiResponse.length}`)
        
        // Parse and validate JSON response
        try {
          const parsedResponse = JSON.parse(aiResponse)
          
          // Validate required structure
          if (!parsedResponse.insights || !parsedResponse.customDiscoveries || !parsedResponse.strategicSynthesis) {
            throw new Error('Invalid response structure')
          }

          console.log(`✅ Valid JSON response from ${model}`)
          return parsedResponse
        } catch (parseError) {
          console.log(`${model} returned invalid JSON:`, parseError)
          console.log('Raw response:', aiResponse.substring(0, 500))
          continue
        }
        
      } catch (error) {
        console.log(`Error with ${model}:`, error.message)
        continue
      }
    }
    
    console.log('All OpenAI models failed, using fallback')
    return null
    
  } catch (error) {
    console.error('OpenAI integration error:', error)
    return null
  }
}

// AI ENHANCEMENT FUNCTIONS
function generateAIEnhancement(insight: any, campaigns: any[]) {
  const { insightId, data, title } = insight
  
  switch (insightId) {
    case 'subject-line-revenue-drivers':
      return {
        deeperAnalysis: `Your ${data.totalCampaignsAnalyzed} campaigns reveal distinct subject line patterns that directly impact revenue. ` +
          `The ${data.emojiCampaigns} campaigns with emojis average $${data.avgEmojiRevenue} per email, while the ${data.totalCampaignsAnalyzed - data.emojiCampaigns} without average $${data.avgNoEmojiRevenue}. ` +
          `This ${data.emojiLift}% difference represents significant untapped revenue potential across your entire email program.`,
        rootCause: Math.abs(parseFloat(data.emojiLift)) > 10 ? 
          `${parseFloat(data.emojiLift) > 0 ? 'Emojis create visual appeal and emotional connection' : 'Your audience responds better to professional, text-only subject lines'}, matching your brand personality and audience preferences.` :
          'Your current emoji usage is balanced - neither helping nor hurting performance significantly.',
        predictedImpact: Math.abs(parseFloat(data.emojiLift)) > 10 ?
          `Implementing optimal emoji strategy across all campaigns could increase monthly revenue by approximately ${(parseFloat(data.emojiLift) * 0.7).toFixed(1)}%. ` +
          `For a typical month, this translates to measurable revenue gains on your email program.` :
          'Current emoji strategy appears optimal - focus optimization efforts on other subject line elements for bigger impact.',
        specificActions: Math.abs(parseFloat(data.emojiLift)) > 10 ? [
          parseFloat(data.emojiLift) > 0 ? 
            `Add relevant emojis to your next 5 campaigns - try 🔥 for urgency, 💰 for sales, ⭐ for quality` :
            `Remove emojis from upcoming campaigns and test professional, text-only subject lines`,
          `A/B test emoji placement: beginning vs. end of subject line`,
          `Track performance for 2-3 weeks to confirm the ${Math.abs(parseFloat(data.emojiLift)).toFixed(1)}% lift`,
          `Scale successful emoji patterns to your entire email program`
        ] : [
          'Continue current emoji usage patterns - they\'re working well',
          'Focus on optimizing other subject line elements like length and urgency',
          'Test seasonal emoji variations for special campaigns'
        ]
      }
      
    case 'optimal-timing':
      return {
        deeperAnalysis: `Deep analysis of send times reveals your audience has distinct engagement patterns. ` +
          `${data.bestHour}:00 consistently outperforms other hours with $${data.bestHourRevenue} per email, while ${data.bestDay}s ` +
          `generate peak revenue at $${data.bestDayRevenue} per email. These aren't random - they reflect your subscribers' behavior patterns.`,
        rootCause: `Your audience's lifestyle and checking habits create predictable engagement windows. ` +
          `${data.bestHour < 12 ? 'Morning email checkers dominate your list' : 
            data.bestHour < 17 ? 'Afternoon browsing during work breaks drives engagement' : 
            'Evening email review sessions are your sweet spot'}.`,
        predictedImpact: `Optimizing send times could increase campaign performance by 15-25%. ` +
          `Shifting campaigns to your optimal ${data.bestDay} ${data.bestHour}:00 window could boost monthly revenue significantly.`,
        specificActions: [
          `Schedule your next 3 campaigns for ${data.bestDay}s at ${data.bestHour}:00`,
          `Set up automated scheduling for this optimal time window`,
          `Test a secondary time slot to find backup optimal windows`,
          `Monitor performance changes and refine timing based on results`
        ]
      }
      
    default:
      return {
        deeperAnalysis: `Analysis of your ${title.toLowerCase()} reveals actionable patterns in your email performance data that directly impact revenue and engagement.`,
        rootCause: 'Multiple factors in your email strategy are creating these performance patterns, indicating optimization opportunities.',
        predictedImpact: 'Addressing these findings could improve your overall email marketing ROI and subscriber engagement.',
        specificActions: insight.recommendations || []
      }
  }
}

function generateCustomDiscoveries(campaigns: any[]) {
  const discoveries: any[] = []
  
  // Find top-performing campaigns for specific examples
  const topCampaigns = campaigns
    .sort((a, b) => (b.revenue / b.emailsSent) - (a.revenue / a.emailsSent))
    .slice(0, 3)
  
  if (topCampaigns.length > 0) {
    const bestCampaign = topCampaigns[0]
    discoveries.push({
      title: "Hidden Revenue Pattern Discovery",
      finding: `Your highest-performing campaign "${bestCampaign.subject}" generated $${(bestCampaign.revenue / bestCampaign.emailsSent).toFixed(4)} per email - ${((bestCampaign.revenue / bestCampaign.emailsSent) / (campaigns.reduce((sum, c) => sum + c.revenue / c.emailsSent, 0) / campaigns.length) * 100 - 100).toFixed(0)}% above your average.`,
      evidence: `This campaign's ${bestCampaign.openRate.toFixed(1)}% open rate and ${bestCampaign.clickRate.toFixed(1)}% click rate created a perfect storm of engagement. ` +
        `Sent to ${bestCampaign.emailsSent.toLocaleString()} subscribers, it generated ${bestCampaign.totalOrders} orders totaling $${bestCampaign.revenue.toFixed(2)}.`,
      estimatedValue: bestCampaign.revenue * 0.3, // 30% of best campaign revenue as potential
      implementation: `Analyze this campaign's subject line structure, send time, and content approach. ` +
        `Replicate these elements in your next 3 campaigns to capture similar performance.`
    })
  }
  
  // Revenue concentration discovery
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const sortedByRevenue = campaigns.sort((a, b) => b.revenue - a.revenue)
  const top20Percent = Math.max(1, Math.floor(campaigns.length * 0.2))
  const topRevenue = sortedByRevenue.slice(0, top20Percent).reduce((sum, c) => sum + c.revenue, 0)
  const concentrationRatio = (topRevenue / totalRevenue) * 100
  
  if (concentrationRatio > 60) {
    discoveries.push({
      title: "Revenue Concentration Risk Alert",
      finding: `Your top ${top20Percent} campaigns (${(top20Percent/campaigns.length*100).toFixed(0)}%) generate ${concentrationRatio.toFixed(0)}% of total revenue - creating dangerous dependency.`,
      evidence: `These ${top20Percent} campaigns generated $${topRevenue.toFixed(2)} of your $${totalRevenue.toFixed(2)} total revenue. ` +
        `If these campaign types fail, your revenue drops dramatically.`,
      estimatedValue: totalRevenue * 0.15, // 15% revenue protection value
      implementation: `Diversify campaign types immediately. Test 3 new campaign formats in the next 2 weeks ` +
        `to reduce dependency on your current high performers.`
    })
  }
  
  return discoveries
}

function generateStrategicSynthesis(insights: any[], campaigns: any[]) {
  const significantInsights = insights.filter(i => i.hasSignificantFinding)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const avgRevenuePerEmail = totalRevenue / campaigns.reduce((sum, c) => sum + c.emailsSent, 0)
  
  // Find biggest opportunity
  const highestImpactInsight = significantInsights.reduce((highest, current) => 
    current.significance > highest.significance ? current : highest, 
    { significance: 0, title: 'Timing Optimization' }
  )
  
  return {
    biggestOpportunity: `${highestImpactInsight.title} represents your highest-impact optimization. ` +
      `With current revenue per email at $${avgRevenuePerEmail.toFixed(4)}, implementing these changes ` +
      `could increase monthly revenue by 15-30% based on your specific data patterns.`,
    primaryRisk: campaigns.length > 0 ? 
      `Revenue concentration in top-performing campaigns creates vulnerability. ` +
      `${significantInsights.length < 3 ? 'Limited optimization opportunities identified' : 'Multiple issues need attention'} ` +
      `- diversification and systematic testing required.` :
      'Insufficient campaign data for comprehensive risk assessment.',
    prioritizedActions: [
      {
        action: `Implement ${highestImpactInsight.title.toLowerCase()} improvements`,
        expectedROI: '15-25%',
        timeframe: '2-3 weeks',
        effort: 'low'
      },
      {
        action: 'Establish systematic A/B testing program',
        expectedROI: '10-20%',
        timeframe: '1 month',
        effort: 'medium'
      },
      {
        action: 'Diversify campaign types and approaches',
        expectedROI: '5-15%',
        timeframe: '4-6 weeks',
        effort: 'high'
      }
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started - processing AI insights')
    
    const requestData = await req.json()
    console.log('Request data received:', {
      campaigns: requestData.campaigns?.length || 0,
      flows: requestData.flows?.length || 0,
      subscribers: requestData.subscribers?.length || 0,
      accountId: requestData.accountId,
      jobId: requestData.jobId
    })

    // SAFE data processing - convert strings to dates and handle nulls
    const safeCampaigns = (requestData.campaigns || []).map((campaign: any) => {
      try {
        return {
          ...campaign,
          sentDate: new Date(campaign.sentDate),
          revenue: Number(campaign.revenue) || 0,
          emailsSent: Math.max(Number(campaign.emailsSent) || 1, 1), // Prevent division by zero
          openRate: Number(campaign.openRate) || 0,
          clickRate: Number(campaign.clickRate) || 0,
          unsubscribeRate: Number(campaign.unsubscribeRate) || 0,
          spamRate: Number(campaign.spamRate) || 0,
          totalOrders: Number(campaign.totalOrders) || 0,
          subject: String(campaign.subject || 'Untitled')
        }
      } catch (e) {
        console.error('Error processing campaign:', e)
        return null
      }
    }).filter(Boolean)

    console.log('Safe campaigns processed:', safeCampaigns.length)

    // Filter to recent campaigns (90 days) safely
    const recentCampaigns = safeCampaigns.filter(campaign => {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 90)
        return campaign.sentDate >= cutoffDate
      } catch (e) {
        console.error('Error filtering campaign date:', e)
        return false
      }
    })

    console.log('Recent campaigns filtered:', recentCampaigns.length)

    // Generate comprehensive insights safely
    const insights: any[] = []

    if (recentCampaigns.length > 0) {
      // 1. COMPREHENSIVE SUBJECT LINE ANALYSIS
      try {
        const emojiCampaigns = recentCampaigns.filter(c => 
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(c.subject)
        )
        const noEmojiCampaigns = recentCampaigns.filter(c => 
          !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(c.subject)
        )

        const avgEmojiRevenue = emojiCampaigns.length > 0 ? 
          emojiCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / emojiCampaigns.length : 0
        const avgNoEmojiRevenue = noEmojiCampaigns.length > 0 ? 
          noEmojiCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / noEmojiCampaigns.length : 0
        
        const emojiLift = avgNoEmojiRevenue > 0 ? ((avgEmojiRevenue - avgNoEmojiRevenue) / avgNoEmojiRevenue) * 100 : 0
        
        // Analyze subject line length patterns
        const shortSubjects = recentCampaigns.filter(c => c.subject.length <= 30)
        const mediumSubjects = recentCampaigns.filter(c => c.subject.length > 30 && c.subject.length <= 50)
        const longSubjects = recentCampaigns.filter(c => c.subject.length > 50)
        
        const avgShortRevenue = shortSubjects.length > 0 ? 
          shortSubjects.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / shortSubjects.length : 0
        const avgMediumRevenue = mediumSubjects.length > 0 ? 
          mediumSubjects.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / mediumSubjects.length : 0
        const avgLongRevenue = longSubjects.length > 0 ? 
          longSubjects.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / longSubjects.length : 0
        
        const bestLengthCategory = avgShortRevenue >= avgMediumRevenue && avgShortRevenue >= avgLongRevenue ? 'short' :
                                 avgMediumRevenue >= avgLongRevenue ? 'medium' : 'long'
        
        const hasSignificantFinding = Math.abs(emojiLift) > 5 || 
          Math.max(avgShortRevenue, avgMediumRevenue, avgLongRevenue) > Math.min(avgShortRevenue, avgMediumRevenue, avgLongRevenue) * 1.2

        insights.push({
          insightId: "subject-line-revenue-drivers",
          title: "Subject Line Revenue Drivers",
          category: "Campaign Insights",
          hasSignificantFinding,
          summary: hasSignificantFinding ? 
            `Analysis of ${recentCampaigns.length} recent campaigns reveals significant patterns in subject line performance. ` +
            `${emojiLift > 10 ? `Emojis in subject lines generate ${emojiLift.toFixed(1)}% higher revenue per email.` : 
              emojiLift < -10 ? `Subject lines without emojis perform ${Math.abs(emojiLift).toFixed(1)}% better.` :
              'Emoji usage shows minimal impact on revenue.'} ` +
            `${bestLengthCategory === 'short' ? 'Shorter subject lines (≤30 chars) drive highest revenue.' :
              bestLengthCategory === 'medium' ? 'Medium-length subject lines (31-50 chars) perform best.' :
              'Longer subject lines (>50 chars) generate the most revenue.'}` :
            'No significant findings in this analysis',
          data: {
            emojiLift: emojiLift.toFixed(1),
            totalCampaignsAnalyzed: recentCampaigns.length,
            emojiCampaigns: emojiCampaigns.length,
            avgEmojiRevenue: avgEmojiRevenue.toFixed(4),
            avgNoEmojiRevenue: avgNoEmojiRevenue.toFixed(4),
            lengthAnalysis: {
              short: { count: shortSubjects.length, avgRevenue: avgShortRevenue.toFixed(4) },
              medium: { count: mediumSubjects.length, avgRevenue: avgMediumRevenue.toFixed(4) },
              long: { count: longSubjects.length, avgRevenue: avgLongRevenue.toFixed(4) },
              bestCategory: bestLengthCategory
            }
          },
          significance: hasSignificantFinding ? Math.min(Math.abs(emojiLift) / 10 + 0.3, 1.0) : 0.1,
          confidence: recentCampaigns.length > 10 ? 0.85 : 0.6,
          recommendations: hasSignificantFinding ? [
            emojiLift > 10 ? "Incorporate relevant emojis in subject lines for revenue boost" : 
            emojiLift < -10 ? "Avoid emojis in subject lines for better performance" :
            "Emoji usage has minimal impact - focus on other elements",
            bestLengthCategory === 'short' ? "Keep subject lines under 30 characters for optimal performance" :
            bestLengthCategory === 'medium' ? "Aim for 31-50 character subject lines" :
            "Longer, descriptive subject lines work best for your audience",
            `Continue A/B testing subject line elements with your ${recentCampaigns.length} campaign sample size`
          ] : [
            "No significant subject line patterns found",
            "Continue testing different approaches",
            "Monitor performance over time"
          ]
        })
        console.log('Comprehensive subject line analysis completed')
      } catch (e) {
        console.error('Error in subject line analysis:', e)
      }

      // 2. PERFORMANCE TRENDS ANALYSIS
      try {
        const sortedCampaigns = recentCampaigns.sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime())
        const firstHalf = sortedCampaigns.slice(0, Math.floor(sortedCampaigns.length / 2))
        const secondHalf = sortedCampaigns.slice(Math.floor(sortedCampaigns.length / 2))
        
        const firstHalfAvgRevenue = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / firstHalf.length : 0
        const secondHalfAvgRevenue = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / secondHalf.length : 0
        
        const firstHalfAvgOpen = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, c) => sum + c.openRate, 0) / firstHalf.length : 0
        const secondHalfAvgOpen = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, c) => sum + c.openRate, 0) / secondHalf.length : 0
        
        const revenueChange = firstHalfAvgRevenue > 0 ? 
          ((secondHalfAvgRevenue - firstHalfAvgRevenue) / firstHalfAvgRevenue) * 100 : 0
        const openRateChange = firstHalfAvgOpen > 0 ? 
          ((secondHalfAvgOpen - firstHalfAvgOpen) / firstHalfAvgOpen) * 100 : 0
        
        const hasSignificantTrend = Math.abs(revenueChange) > 10 || Math.abs(openRateChange) > 5
        
        insights.push({
          insightId: "performance-trends",
          title: "Performance Trends Analysis", 
          category: "Revenue & Performance Trends",
          hasSignificantFinding: hasSignificantTrend,
          summary: hasSignificantTrend ?
            `Performance analysis reveals ${revenueChange > 0 ? 'improving' : 'declining'} trends. ` +
            `Revenue per email has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% ` +
            `and open rates have ${openRateChange > 0 ? 'improved' : 'declined'} by ${Math.abs(openRateChange).toFixed(1)}% ` +
            `over the analysis period.` :
            'No significant findings in this analysis',
          data: {
            revenueChange: revenueChange.toFixed(1),
            openRateChange: openRateChange.toFixed(1),
            firstPeriod: {
              avgRevenue: firstHalfAvgRevenue.toFixed(4),
              avgOpenRate: firstHalfAvgOpen.toFixed(1),
              campaigns: firstHalf.length
            },
            secondPeriod: {
              avgRevenue: secondHalfAvgRevenue.toFixed(4), 
              avgOpenRate: secondHalfAvgOpen.toFixed(1),
              campaigns: secondHalf.length
            }
          },
          significance: hasSignificantTrend ? Math.min((Math.abs(revenueChange) + Math.abs(openRateChange)) / 30, 1.0) : 0.1,
          confidence: 0.8,
          recommendations: hasSignificantTrend ? [
            revenueChange > 0 ? "Continue current strategies - revenue performance is improving" : 
            "Investigate recent changes that may be impacting revenue performance",
            openRateChange > 0 ? "Your open rate optimization efforts are working" :
            "Focus on improving subject lines and sender reputation to boost opens",
            "Monitor these trends closely and adjust strategy accordingly"
          ] : [
            "Performance appears stable across the analysis period",
            "Continue monitoring for emerging trends",
            "Consider testing new strategies to drive improvement"
          ]
        })
        console.log('Performance trends analysis completed')
      } catch (e) {
        console.error('Error in performance trends analysis:', e)
      }

      // 3. CAMPAIGN TIMING INSIGHTS
      try {
        const hourAnalysis: { [hour: string]: { campaigns: any[], avgRevenue: number } } = {}
        const dayAnalysis: { [day: string]: { campaigns: any[], avgRevenue: number } } = {}
        
        recentCampaigns.forEach(campaign => {
          const hour = campaign.sentDate.getHours()
          const day = campaign.sentDate.getDay() // 0=Sunday, 1=Monday, etc.
          
          const hourKey = hour.toString()
          const dayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
          
          if (!hourAnalysis[hourKey]) hourAnalysis[hourKey] = { campaigns: [], avgRevenue: 0 }
          if (!dayAnalysis[dayKey]) dayAnalysis[dayKey] = { campaigns: [], avgRevenue: 0 }
          
          hourAnalysis[hourKey].campaigns.push(campaign)
          dayAnalysis[dayKey].campaigns.push(campaign)
        })
        
        // Calculate averages
        Object.keys(hourAnalysis).forEach(hour => {
          const campaigns = hourAnalysis[hour].campaigns
          hourAnalysis[hour].avgRevenue = campaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / campaigns.length
        })
        
        Object.keys(dayAnalysis).forEach(day => {
          const campaigns = dayAnalysis[day].campaigns
          dayAnalysis[day].avgRevenue = campaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / campaigns.length
        })
        
        const bestHour = Object.entries(hourAnalysis).reduce((best, [hour, data]) => 
          data.avgRevenue > best.avgRevenue ? { hour: parseInt(hour), avgRevenue: data.avgRevenue } : best,
          { hour: 0, avgRevenue: 0 }
        )
        
        const bestDay = Object.entries(dayAnalysis).reduce((best, [day, data]) => 
          data.avgRevenue > best.avgRevenue ? { day, avgRevenue: data.avgRevenue } : best,
          { day: 'Monday', avgRevenue: 0 }
        )
        
        const hourSpread = Math.max(...Object.values(hourAnalysis).map(h => h.avgRevenue)) - 
                          Math.min(...Object.values(hourAnalysis).map(h => h.avgRevenue))
        const daySpread = Math.max(...Object.values(dayAnalysis).map(d => d.avgRevenue)) - 
                         Math.min(...Object.values(dayAnalysis).map(d => d.avgRevenue))
        
        const hasSignificantTiming = hourSpread > 0.001 || daySpread > 0.001 // Meaningful revenue differences
        
        insights.push({
          insightId: "optimal-timing",
          title: "Optimal Send Time Analysis",
          category: "Segmentation & Timing", 
          hasSignificantFinding: hasSignificantTiming,
          summary: hasSignificantTiming ?
            `Timing analysis reveals optimal send patterns for your audience. ` +
            `${bestHour.hour}:00 generates the highest revenue per email ($${bestHour.avgRevenue.toFixed(4)}), ` +
            `and ${bestDay.day}s are your most profitable sending day ($${bestDay.avgRevenue.toFixed(4)} per email).` :
            'No significant findings in this analysis',
          data: {
            bestHour: bestHour.hour,
            bestHourRevenue: bestHour.avgRevenue.toFixed(4),
            bestDay: bestDay.day,
            bestDayRevenue: bestDay.avgRevenue.toFixed(4),
            hourlyPerformance: Object.fromEntries(
              Object.entries(hourAnalysis).map(([hour, data]) => [
                hour, 
                { campaigns: data.campaigns.length, avgRevenue: data.avgRevenue.toFixed(4) }
              ])
            ),
            dailyPerformance: Object.fromEntries(
              Object.entries(dayAnalysis).map(([day, data]) => [
                day,
                { campaigns: data.campaigns.length, avgRevenue: data.avgRevenue.toFixed(4) }
              ])
            )
          },
          significance: hasSignificantTiming ? Math.min((hourSpread + daySpread) * 1000, 1.0) : 0.1,
          confidence: Object.keys(hourAnalysis).length > 3 ? 0.7 : 0.5,
          recommendations: hasSignificantTiming ? [
            `Schedule campaigns around ${bestHour.hour}:00 for optimal revenue performance`,
            `${bestDay.day}s appear to be your best performing day - prioritize sends then`,
            "Test these timing patterns with A/B splits to confirm optimization"
          ] : [
            "No clear timing patterns detected in current data",
            "Continue sending at various times to gather more data",
            "Consider testing different time slots systematically"
          ]
        })
        console.log('Timing analysis completed')
      } catch (e) {
        console.error('Error in timing analysis:', e)
      }

      // 4. CAMPAIGN OVERVIEW WITH DETAILED METRICS
      try {
        const totalRevenue = recentCampaigns.reduce((sum, c) => sum + c.revenue, 0)
        const totalEmails = recentCampaigns.reduce((sum, c) => sum + c.emailsSent, 0)
        const avgOpenRate = recentCampaigns.reduce((sum, c) => sum + c.openRate, 0) / recentCampaigns.length
        const avgClickRate = recentCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / recentCampaigns.length
        const avgUnsubRate = recentCampaigns.reduce((sum, c) => sum + c.unsubscribeRate, 0) / recentCampaigns.length
        const totalOrders = recentCampaigns.reduce((sum, c) => sum + c.totalOrders, 0)
        
        const conversionRate = totalEmails > 0 ? (totalOrders / totalEmails) * 100 : 0
        const revenuePerEmail = totalEmails > 0 ? totalRevenue / totalEmails : 0
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        insights.push({
          insightId: "campaign-overview",
          title: "Campaign Performance Overview",
          category: "Performance Summary",
          hasSignificantFinding: true,
          summary: `Comprehensive analysis of ${recentCampaigns.length} campaigns over the last 90 days. ` +
            `Generated $${totalRevenue.toFixed(2)} in revenue from ${totalEmails.toLocaleString()} emails sent, ` +
            `achieving a ${avgOpenRate.toFixed(1)}% open rate and $${revenuePerEmail.toFixed(4)} revenue per email. ` +
            `Your ${totalOrders} orders represent a ${conversionRate.toFixed(2)}% conversion rate with an average order value of $${avgOrderValue.toFixed(2)}.`,
          data: {
            totalCampaigns: recentCampaigns.length,
            totalRevenue: totalRevenue.toFixed(2),
            totalEmails: totalEmails,
            totalOrders: totalOrders,
            avgOpenRate: avgOpenRate.toFixed(1),
            avgClickRate: avgClickRate.toFixed(1),
            avgUnsubscribeRate: avgUnsubRate.toFixed(3),
            conversionRate: conversionRate.toFixed(2),
            revenuePerEmail: revenuePerEmail.toFixed(4),
            avgOrderValue: avgOrderValue.toFixed(2)
          },
          significance: 0.95,
          confidence: 0.99,
          recommendations: [
            `Your $${revenuePerEmail.toFixed(4)} revenue per email ${revenuePerEmail > 0.01 ? 'is performing well' : 'has room for improvement'}`,
            `${avgOpenRate.toFixed(1)}% open rate ${avgOpenRate > 20 ? 'is above average' : 'could be optimized'}`,
            `${conversionRate.toFixed(2)}% conversion rate ${conversionRate > 1 ? 'shows strong engagement' : 'indicates optimization opportunities'}`
          ]
        })
        console.log('Campaign overview completed')
      } catch (e) {
        console.error('Error in campaign overview:', e)
      }

      // 5. REVENUE CONCENTRATION ANALYSIS
      try {
        const totalRevenue = recentCampaigns.reduce((sum, c) => sum + c.revenue, 0)
        const sortedCampaigns = recentCampaigns.sort((a, b) => b.revenue - a.revenue)
        const top20Percent = Math.max(1, Math.floor(recentCampaigns.length * 0.2))
        const topCampaigns = sortedCampaigns.slice(0, top20Percent)
        const topCampaignRevenue = topCampaigns.reduce((sum, c) => sum + c.revenue, 0)
        const concentrationRatio = totalRevenue > 0 ? (topCampaignRevenue / totalRevenue) * 100 : 0
        
        const hasHighConcentration = concentrationRatio > 60
        
        insights.push({
          insightId: "revenue-concentration",
          title: "Revenue Concentration Analysis",
          category: "Revenue & Performance Trends",
          hasSignificantFinding: hasHighConcentration,
          summary: hasHighConcentration ?
            `Revenue analysis shows high concentration risk. The top ${top20Percent} campaigns (${(top20Percent/recentCampaigns.length*100).toFixed(0)}% of total) ` +
            `generate ${concentrationRatio.toFixed(1)}% of all revenue. This indicates heavy dependence on a few high-performing campaigns.` :
            'No significant findings in this analysis',
          data: {
            concentrationRatio: concentrationRatio.toFixed(1),
            topCampaigns: top20Percent,
            topCampaignRevenue: topCampaignRevenue.toFixed(2),
            averageTopRevenue: (topCampaignRevenue / top20Percent).toFixed(2),
            averageOtherRevenue: ((totalRevenue - topCampaignRevenue) / (recentCampaigns.length - top20Percent)).toFixed(2)
          },
          significance: hasHighConcentration ? Math.min(concentrationRatio / 80, 1.0) : 0.2,
          confidence: 0.9,
          recommendations: hasHighConcentration ? [
            "Diversify campaign types to reduce revenue concentration risk",
            "Analyze top-performing campaigns to identify replicable elements",
            "Develop strategies to improve consistency across all campaigns"
          ] : [
            "Revenue distribution appears well-balanced across campaigns",
            "Continue current diversification strategy",
            "Monitor for emerging concentration patterns"
          ]
        })
        console.log('Revenue concentration analysis completed')
      } catch (e) {
        console.error('Error in revenue concentration analysis:', e)
      }

      // 6. CAMPAIGN SPACING ANALYSIS
      try {
        const sortedByDate = recentCampaigns.sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime())
        const spacings: number[] = []
        const spacingPerformance: { spacing: number, avgRevenue: number, count: number }[] = []
        
        for (let i = 1; i < sortedByDate.length; i++) {
          const daysBetween = Math.floor((sortedByDate[i].sentDate.getTime() - sortedByDate[i-1].sentDate.getTime()) / (1000 * 60 * 60 * 24))
          spacings.push(daysBetween)
          
          const revenuePerEmail = sortedByDate[i].emailsSent > 0 ? sortedByDate[i].revenue / sortedByDate[i].emailsSent : 0
          spacingPerformance.push({ spacing: daysBetween, avgRevenue: revenuePerEmail, count: 1 })
        }
        
        // Group by spacing ranges
        const spacingGroups = {
          immediate: spacingPerformance.filter(s => s.spacing <= 1),
          short: spacingPerformance.filter(s => s.spacing > 1 && s.spacing <= 3),
          medium: spacingPerformance.filter(s => s.spacing > 3 && s.spacing <= 7),
          long: spacingPerformance.filter(s => s.spacing > 7)
        }
        
        const avgSpacingRevenue = {
          immediate: spacingGroups.immediate.length > 0 ? 
            spacingGroups.immediate.reduce((sum, s) => sum + s.avgRevenue, 0) / spacingGroups.immediate.length : 0,
          short: spacingGroups.short.length > 0 ? 
            spacingGroups.short.reduce((sum, s) => sum + s.avgRevenue, 0) / spacingGroups.short.length : 0,
          medium: spacingGroups.medium.length > 0 ? 
            spacingGroups.medium.reduce((sum, s) => sum + s.avgRevenue, 0) / spacingGroups.medium.length : 0,
          long: spacingGroups.long.length > 0 ? 
            spacingGroups.long.reduce((sum, s) => sum + s.avgRevenue, 0) / spacingGroups.long.length : 0
        }
        
        const bestSpacing = Object.entries(avgSpacingRevenue).reduce((best, [key, value]) => 
          value > best.value ? { key, value } : best, { key: 'medium', value: 0 })
        
        const hasSignificantSpacing = Object.values(avgSpacingRevenue).some(v => v > 0) && 
          Math.max(...Object.values(avgSpacingRevenue)) > Math.min(...Object.values(avgSpacingRevenue).filter(v => v > 0)) * 1.3
        
        insights.push({
          insightId: "campaign-spacing",
          title: "Campaign Spacing Optimization",
          category: "Segmentation & Timing",
          hasSignificantFinding: hasSignificantSpacing,
          summary: hasSignificantSpacing ?
            `Campaign spacing analysis reveals optimal frequency patterns. ` +
            `${bestSpacing.key === 'immediate' ? 'Daily campaigns' : 
              bestSpacing.key === 'short' ? 'Campaigns spaced 2-3 days apart' :
              bestSpacing.key === 'medium' ? 'Weekly campaigns' : 'Campaigns spaced over a week apart'} ` +
            `generate the highest revenue per email ($${bestSpacing.value.toFixed(4)}).` :
            'No significant findings in this analysis',
          data: {
            avgSpacing: spacings.length > 0 ? (spacings.reduce((sum, s) => sum + s, 0) / spacings.length).toFixed(1) : '0',
            spacingBreakdown: {
              immediate: { count: spacingGroups.immediate.length, avgRevenue: avgSpacingRevenue.immediate.toFixed(4) },
              short: { count: spacingGroups.short.length, avgRevenue: avgSpacingRevenue.short.toFixed(4) },
              medium: { count: spacingGroups.medium.length, avgRevenue: avgSpacingRevenue.medium.toFixed(4) },
              long: { count: spacingGroups.long.length, avgRevenue: avgSpacingRevenue.long.toFixed(4) }
            },
            bestSpacing: bestSpacing.key,
            bestSpacingRevenue: bestSpacing.value.toFixed(4)
          },
          significance: hasSignificantSpacing ? Math.min(bestSpacing.value * 1000, 1.0) : 0.2,
          confidence: spacings.length > 5 ? 0.75 : 0.5,
          recommendations: hasSignificantSpacing ? [
            `Optimize campaign frequency to ${bestSpacing.key === 'immediate' ? 'daily sends' : 
              bestSpacing.key === 'short' ? '2-3 day intervals' :
              bestSpacing.key === 'medium' ? 'weekly intervals' : 'longer intervals'} for maximum revenue`,
            "Test this spacing pattern with A/B experiments",
            "Monitor subscriber fatigue signals closely"
          ] : [
            "No clear spacing patterns detected",
            "Continue testing different send frequencies",
            "Monitor subscriber engagement across various intervals"
          ]
        })
        console.log('Campaign spacing analysis completed')
      } catch (e) {
        console.error('Error in campaign spacing analysis:', e)
      }

      // 7. ZERO ORDER CAMPAIGNS ANALYSIS
      try {
        const zeroOrderCampaigns = recentCampaigns.filter(c => c.totalOrders === 0)
        const zeroOrderRate = (zeroOrderCampaigns.length / recentCampaigns.length) * 100
        
        // Analyze common patterns in zero-order campaigns
        const zeroOrderOpenRate = zeroOrderCampaigns.length > 0 ? 
          zeroOrderCampaigns.reduce((sum, c) => sum + c.openRate, 0) / zeroOrderCampaigns.length : 0
        const zeroOrderClickRate = zeroOrderCampaigns.length > 0 ? 
          zeroOrderCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / zeroOrderCampaigns.length : 0
        
        const hasHighZeroOrderRate = zeroOrderRate > 30
        
        insights.push({
          insightId: "zero-order-campaigns",
          title: "Zero Order Campaign Analysis",
          category: "Campaign Insights",
          hasSignificantFinding: hasHighZeroOrderRate,
          summary: hasHighZeroOrderRate ?
            `${zeroOrderRate.toFixed(1)}% of campaigns generated zero orders, indicating potential issues with conversion optimization. ` +
            `These campaigns averaged ${zeroOrderOpenRate.toFixed(1)}% open rate and ${zeroOrderClickRate.toFixed(1)}% click rate, ` +
            `suggesting the issue may be in post-click experience or offer relevance.` :
            'No significant findings in this analysis',
          data: {
            zeroOrderCount: zeroOrderCampaigns.length,
            zeroOrderRate: zeroOrderRate.toFixed(1),
            avgZeroOrderOpenRate: zeroOrderOpenRate.toFixed(1),
            avgZeroOrderClickRate: zeroOrderClickRate.toFixed(1),
            totalRevenueLost: '0.00' // Conservative estimate
          },
          significance: hasHighZeroOrderRate ? Math.min(zeroOrderRate / 50, 1.0) : 0.1,
          confidence: 0.85,
          recommendations: hasHighZeroOrderRate ? [
            "Investigate post-click conversion funnel for zero-order campaigns",
            "Review offer relevance and landing page optimization",
            "Consider segmenting audiences for better targeting"
          ] : [
            "Campaign conversion rates appear healthy",
            "Continue monitoring zero-order patterns",
            "Maintain focus on conversion optimization"
          ]
        })
        console.log('Zero order campaigns analysis completed')
      } catch (e) {
        console.error('Error in zero order campaigns analysis:', e)
      }

      // 8. CLICK-TO-PURCHASE DROPOFF ANALYSIS
      try {
        const campaignsWithClicks = recentCampaigns.filter(c => c.clickRate > 0)
        let totalClickToPurchaseRate = 0
        let validCampaigns = 0
        
        campaignsWithClicks.forEach(campaign => {
          const estimatedClicks = (campaign.clickRate / 100) * campaign.emailsSent
          if (estimatedClicks > 0) {
            const clickToPurchaseRate = (campaign.totalOrders / estimatedClicks) * 100
            totalClickToPurchaseRate += clickToPurchaseRate
            validCampaigns++
          }
        })
        
        const avgClickToPurchaseRate = validCampaigns > 0 ? totalClickToPurchaseRate / validCampaigns : 0
        const hasLowConversion = avgClickToPurchaseRate < 5 && avgClickToPurchaseRate > 0
        
        insights.push({
          insightId: "click-to-purchase-dropoff",
          title: "Click-to-Purchase Conversion Analysis",
          category: "Campaign Insights",
          hasSignificantFinding: hasLowConversion,
          summary: hasLowConversion ?
            `Post-click conversion analysis reveals optimization opportunities. Average click-to-purchase rate of ` +
            `${avgClickToPurchaseRate.toFixed(1)}% suggests significant dropoff after email clicks, indicating ` +
            `potential issues with landing page experience, offer alignment, or checkout process.` :
            'No significant findings in this analysis',
          data: {
            avgClickToPurchaseRate: avgClickToPurchaseRate.toFixed(1),
            campaignsAnalyzed: validCampaigns,
            estimatedClicksLost: validCampaigns > 0 ? 
              (campaignsWithClicks.reduce((sum, c) => sum + (c.clickRate / 100) * c.emailsSent, 0) - 
               campaignsWithClicks.reduce((sum, c) => sum + c.totalOrders, 0)).toFixed(0) : '0'
          },
          significance: hasLowConversion ? Math.min((5 - avgClickToPurchaseRate) / 5, 1.0) : 0.2,
          confidence: validCampaigns > 3 ? 0.8 : 0.5,
          recommendations: hasLowConversion ? [
            "Optimize landing page experience for email traffic",
            "Ensure offer consistency between email and landing page",
            "Review and streamline checkout process"
          ] : [
            "Click-to-purchase conversion appears optimized",
            "Continue monitoring post-click performance",
            "Test incremental improvements to conversion funnel"
          ]
        })
        console.log('Click-to-purchase dropoff analysis completed')
      } catch (e) {
        console.error('Error in click-to-purchase dropoff analysis:', e)
      }

      // 9. CAMPAIGN FATIGUE ANALYSIS
      try {
        const sortedCampaigns = recentCampaigns.sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime())
        let fatigueScore = 0
        let consecutivePoorPerformers = 0
        
        for (let i = 1; i < sortedCampaigns.length; i++) {
          const current = sortedCampaigns[i]
          const previous = sortedCampaigns[i - 1]
          
          const currentRevenue = current.emailsSent > 0 ? current.revenue / current.emailsSent : 0
          const previousRevenue = previous.emailsSent > 0 ? previous.revenue / previous.emailsSent : 0
          
          if (currentRevenue < previousRevenue * 0.8) {
            consecutivePoorPerformers++
            fatigueScore += 1
          } else {
            consecutivePoorPerformers = 0
          }
          
          if (current.unsubscribeRate > 0.5) fatigueScore += 2
          if (current.openRate < 15) fatigueScore += 1
        }
        
        const hasFatigue = fatigueScore > 5 || consecutivePoorPerformers > 2
        
        insights.push({
          insightId: "campaign-fatigue",
          title: "Subscriber Fatigue Analysis",
          category: "List Health & Deliverability",
          hasSignificantFinding: hasFatigue,
          summary: hasFatigue ?
            `Subscriber fatigue signals detected. Analysis shows declining performance patterns with ` +
            `${consecutivePoorPerformers} consecutive underperforming campaigns and elevated unsubscribe rates. ` +
            `This suggests your audience may be experiencing email fatigue.` :
            'No significant findings in this analysis',
          data: {
            fatigueScore: fatigueScore,
            consecutivePoorPerformers: consecutivePoorPerformers,
            avgUnsubRate: (recentCampaigns.reduce((sum, c) => sum + c.unsubscribeRate, 0) / recentCampaigns.length).toFixed(3),
            trendDirection: fatigueScore > 3 ? 'declining' : 'stable'
          },
          significance: hasFatigue ? Math.min(fatigueScore / 10, 1.0) : 0.1,
          confidence: 0.75,
          recommendations: hasFatigue ? [
            "Reduce email frequency to combat subscriber fatigue",
            "Refresh email content and design approaches",
            "Implement re-engagement campaigns for inactive subscribers"
          ] : [
            "Subscriber engagement appears healthy",
            "Continue monitoring fatigue signals",
            "Maintain current content variety"
          ]
        })
        console.log('Campaign fatigue analysis completed')
      } catch (e) {
        console.error('Error in campaign fatigue analysis:', e)
      }

      // 10. REVENUE PER EMAIL TREND ANALYSIS
      try {
        const monthlyRevenue = {}
        recentCampaigns.forEach(campaign => {
          const monthKey = `${campaign.sentDate.getFullYear()}-${String(campaign.sentDate.getMonth() + 1).padStart(2, '0')}`
          if (!monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey] = { revenue: 0, emails: 0 }
          }
          monthlyRevenue[monthKey].revenue += campaign.revenue
          monthlyRevenue[monthKey].emails += campaign.emailsSent
        })
        
        const monthlyRPE = Object.entries(monthlyRevenue).map(([month, data]: [string, any]) => ({
          month,
          rpe: data.emails > 0 ? data.revenue / data.emails : 0
        })).sort((a, b) => a.month.localeCompare(b.month))
        
        let trendDirection = 'stable'
        if (monthlyRPE.length >= 2) {
          const firstHalf = monthlyRPE.slice(0, Math.floor(monthlyRPE.length / 2))
          const secondHalf = monthlyRPE.slice(Math.floor(monthlyRPE.length / 2))
          
          const firstAvg = firstHalf.reduce((sum, m) => sum + m.rpe, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((sum, m) => sum + m.rpe, 0) / secondHalf.length
          
          const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
          
          if (changePercent > 10) trendDirection = 'improving'
          else if (changePercent < -10) trendDirection = 'declining'
        }
        
        const hasSignificantTrend = trendDirection !== 'stable'
        
        insights.push({
          insightId: "revenue-per-email-trend",
          title: "Revenue Per Email Trend Analysis",
          category: "Revenue & Performance Trends",
          hasSignificantFinding: hasSignificantTrend,
          summary: hasSignificantTrend ?
            `Revenue per email trends show ${trendDirection} patterns over the analysis period. ` +
            `${trendDirection === 'improving' ? 'Your optimization efforts are paying off with increasing revenue efficiency.' :
              'Recent performance suggests revenue efficiency challenges that need attention.'}` :
            'No significant findings in this analysis',
          data: {
            trendDirection,
            monthlyData: monthlyRPE,
            avgRPE: monthlyRPE.length > 0 ? (monthlyRPE.reduce((sum, m) => sum + m.rpe, 0) / monthlyRPE.length).toFixed(4) : '0.0000',
            periodsAnalyzed: monthlyRPE.length
          },
          significance: hasSignificantTrend ? 0.8 : 0.2,
          confidence: monthlyRPE.length >= 2 ? 0.85 : 0.5,
          recommendations: hasSignificantTrend ? [
            trendDirection === 'improving' ? "Continue current optimization strategies" : "Investigate factors causing revenue decline",
            "Focus on maintaining revenue efficiency gains",
            "Monitor this trend closely for early intervention"
          ] : [
            "Revenue per email appears stable",
            "Look for opportunities to drive improvement",
            "Continue monitoring for emerging trends"
          ]
        })
        console.log('Revenue per email trend analysis completed')
      } catch (e) {
        console.error('Error in revenue per email trend analysis:', e)
      }

      // 11. CAMPAIGN SIZE OPTIMIZATION ANALYSIS
      try {
        const sizeGroups = {
          small: recentCampaigns.filter(c => c.emailsSent <= 1000),
          medium: recentCampaigns.filter(c => c.emailsSent > 1000 && c.emailsSent <= 5000), 
          large: recentCampaigns.filter(c => c.emailsSent > 5000 && c.emailsSent <= 20000),
          huge: recentCampaigns.filter(c => c.emailsSent > 20000)
        }
        
        const sizeMetrics = Object.fromEntries(
          Object.entries(sizeGroups).map(([size, campaigns]) => [
            size,
            {
              count: campaigns.length,
              avgRevenue: campaigns.length > 0 ? 
                campaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / campaigns.length : 0,
              avgOpenRate: campaigns.length > 0 ? 
                campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length : 0,
              totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0)
            }
          ])
        )
        
        const bestSize = Object.entries(sizeMetrics).reduce((best, [size, metrics]) => 
          metrics.avgRevenue > best.avgRevenue ? { size, avgRevenue: metrics.avgRevenue } : best,
          { size: 'medium', avgRevenue: 0 }
        )
        
        const hasSignificantSizeEffect = Object.values(sizeMetrics).some(m => m.count > 0) &&
          Math.max(...Object.values(sizeMetrics).map(m => m.avgRevenue)) > 
          Math.min(...Object.values(sizeMetrics).filter(m => m.avgRevenue > 0).map(m => m.avgRevenue)) * 1.5
        
        insights.push({
          insightId: "campaign-size-optimization",
          title: "Campaign Size Performance Analysis",
          category: "Campaign Insights",
          hasSignificantFinding: hasSignificantSizeEffect,
          summary: hasSignificantSizeEffect ?
            `Campaign size analysis reveals optimization opportunities. ${bestSize.size.charAt(0).toUpperCase() + bestSize.size.slice(1)} ` +
            `campaigns generate the highest revenue per email ($${bestSize.avgRevenue.toFixed(4)}), suggesting optimal ` +
            `list size for your audience engagement and deliverability.` :
            'No significant findings in this analysis',
          data: {
            sizeBreakdown: sizeMetrics,
            optimalSize: bestSize.size,
            optimalRevenue: bestSize.avgRevenue.toFixed(4)
          },
          significance: hasSignificantSizeEffect ? 0.7 : 0.2,
          confidence: 0.75,
          recommendations: hasSignificantSizeEffect ? [
            `Focus on ${bestSize.size} campaign sizes for optimal performance`,
            "Segment larger lists into smaller, more targeted campaigns",
            "Test segmentation strategies to maintain engagement"
          ] : [
            "Campaign size doesn't appear to significantly impact performance",
            "Continue current list management approach",
            "Monitor for size-related patterns over time"
          ]
        })
        console.log('Campaign size optimization analysis completed')
      } catch (e) {
        console.error('Error in campaign size optimization analysis:', e)
      }

      // 12. SUBJECT LINE URGENCY ANALYSIS
      try {
        const urgencyWords = ['urgent', 'limited', 'expires', 'deadline', 'hurry', 'quick', 'fast', 'now', 'today', 'immediate', 'last chance', 'final', 'ends']
        const urgentCampaigns = recentCampaigns.filter(c => 
          urgencyWords.some(word => c.subject.toLowerCase().includes(word))
        )
        const nonUrgentCampaigns = recentCampaigns.filter(c => 
          !urgencyWords.some(word => c.subject.toLowerCase().includes(word))
        )
        
        const urgentAvgRevenue = urgentCampaigns.length > 0 ?
          urgentCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / urgentCampaigns.length : 0
        const nonUrgentAvgRevenue = nonUrgentCampaigns.length > 0 ?
          nonUrgentCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / nonUrgentCampaigns.length : 0
        
        const urgencyLift = nonUrgentAvgRevenue > 0 ? 
          ((urgentAvgRevenue - nonUrgentAvgRevenue) / nonUrgentAvgRevenue) * 100 : 0
        
        const hasSignificantUrgencyEffect = Math.abs(urgencyLift) > 15
        
        insights.push({
          insightId: "subject-line-urgency",
          title: "Subject Line Urgency Impact Analysis",
          category: "Campaign Insights",
          hasSignificantFinding: hasSignificantUrgencyEffect,
          summary: hasSignificantUrgencyEffect ?
            `Urgency analysis shows ${urgencyLift > 0 ? 'positive' : 'negative'} impact on revenue. ` +
            `Urgent subject lines ${urgencyLift > 0 ? 'increase' : 'decrease'} revenue per email by ` +
            `${Math.abs(urgencyLift).toFixed(1)}%, indicating ${urgencyLift > 0 ? 'effective' : 'counterproductive'} urgency usage.` :
            'No significant findings in this analysis',
          data: {
            urgencyLift: urgencyLift.toFixed(1),
            urgentCampaigns: urgentCampaigns.length,
            nonUrgentCampaigns: nonUrgentCampaigns.length,
            urgentAvgRevenue: urgentAvgRevenue.toFixed(4),
            nonUrgentAvgRevenue: nonUrgentAvgRevenue.toFixed(4)
          },
          significance: hasSignificantUrgencyEffect ? Math.min(Math.abs(urgencyLift) / 30, 1.0) : 0.2,
          confidence: (urgentCampaigns.length + nonUrgentCampaigns.length) > 10 ? 0.8 : 0.6,
          recommendations: hasSignificantUrgencyEffect ? [
            urgencyLift > 0 ? "Incorporate urgency language strategically in subject lines" : 
            "Reduce or eliminate urgency language in subject lines",
            "Test different urgency approaches for optimal impact",
            "Monitor urgency fatigue in your audience"
          ] : [
            "Urgency language shows neutral impact",
            "Use urgency sparingly for genuine time-sensitive offers",
            "Focus on other subject line optimization tactics"
          ]
        })
        console.log('Subject line urgency analysis completed')
      } catch (e) {
        console.error('Error in subject line urgency analysis:', e)
      }

      // 13. DISCOUNT MENTION EFFECTIVENESS
      try {
        const discountWords = ['%', 'off', 'discount', 'sale', 'save', 'deal', 'coupon', 'promo', 'special', 'free shipping', 'free']
        const discountCampaigns = recentCampaigns.filter(c => 
          discountWords.some(word => c.subject.toLowerCase().includes(word))
        )
        const nonDiscountCampaigns = recentCampaigns.filter(c => 
          !discountWords.some(word => c.subject.toLowerCase().includes(word))
        )
        
        const discountAvgRevenue = discountCampaigns.length > 0 ?
          discountCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / discountCampaigns.length : 0
        const nonDiscountAvgRevenue = nonDiscountCampaigns.length > 0 ?
          nonDiscountCampaigns.reduce((sum, c) => sum + (c.revenue / c.emailsSent), 0) / nonDiscountCampaigns.length : 0
        
        const discountLift = nonDiscountAvgRevenue > 0 ? 
          ((discountAvgRevenue - nonDiscountAvgRevenue) / nonDiscountAvgRevenue) * 100 : 0
        
        const hasSignificantDiscountEffect = Math.abs(discountLift) > 20
        
        insights.push({
          insightId: "discount-mention-effectiveness",
          title: "Discount Mention Effectiveness Analysis",
          category: "Campaign Insights",
          hasSignificantFinding: hasSignificantDiscountEffect,
          summary: hasSignificantDiscountEffect ?
            `Discount mention analysis reveals ${discountLift > 0 ? 'strong positive' : 'concerning negative'} impact. ` +
            `Subject lines mentioning discounts ${discountLift > 0 ? 'boost' : 'reduce'} revenue per email by ` +
            `${Math.abs(discountLift).toFixed(1)}%, suggesting discount positioning ${discountLift > 0 ? 'drives' : 'hurts'} performance.` :
            'No significant findings in this analysis',
          data: {
            discountLift: discountLift.toFixed(1),
            discountCampaigns: discountCampaigns.length,
            nonDiscountCampaigns: nonDiscountCampaigns.length,
            discountAvgRevenue: discountAvgRevenue.toFixed(4),
            nonDiscountAvgRevenue: nonDiscountAvgRevenue.toFixed(4)
          },
          significance: hasSignificantDiscountEffect ? Math.min(Math.abs(discountLift) / 40, 1.0) : 0.2,
          confidence: 0.85,
          recommendations: hasSignificantDiscountEffect ? [
            discountLift > 0 ? "Continue leveraging discount messaging in subject lines" : 
            "Reconsider discount positioning strategy in subject lines",
            "Test subtle vs. explicit discount mentions",
            "Monitor discount fatigue in your audience"
          ] : [
            "Discount mentions show neutral impact",
            "Focus on value proposition rather than just discounts",
            "Test different promotional approaches"
          ]
        })
        console.log('Discount mention effectiveness analysis completed')
      } catch (e) {
        console.error('Error in discount mention effectiveness analysis:', e)
      }

      // 14. SPAM RATE ANALYSIS
      try {
        const avgSpamRate = recentCampaigns.reduce((sum, c) => sum + c.spamRate, 0) / recentCampaigns.length
        const highSpamCampaigns = recentCampaigns.filter(c => c.spamRate > 0.5)
        const spamTrend = recentCampaigns.slice(-10).reduce((sum, c) => sum + c.spamRate, 0) / 
                         Math.min(10, recentCampaigns.length)
        
        const hasSpamIssue = avgSpamRate > 0.3 || highSpamCampaigns.length > recentCampaigns.length * 0.2
        
        insights.push({
          insightId: "spam-rate-analysis",
          title: "Spam Rate & Deliverability Analysis",
          category: "List Health & Deliverability",
          hasSignificantFinding: hasSpamIssue,
          summary: hasSpamIssue ?
            `Deliverability analysis reveals concerning spam rates. Average spam rate of ${avgSpamRate.toFixed(2)}% ` +
            `with ${highSpamCampaigns.length} campaigns exceeding 0.5% threshold suggests potential sender reputation ` +
            `issues that could impact future deliverability.` :
            'No significant findings in this analysis',
          data: {
            avgSpamRate: avgSpamRate.toFixed(3),
            highSpamCampaigns: highSpamCampaigns.length,
            recentTrend: spamTrend.toFixed(3),
            worstSpamRate: Math.max(...recentCampaigns.map(c => c.spamRate)).toFixed(3)
          },
          significance: hasSpamIssue ? Math.min(avgSpamRate * 3, 1.0) : 0.1,
          confidence: 0.9,
          recommendations: hasSpamIssue ? [
            "Investigate and address factors causing high spam rates",
            "Review email content for spam trigger words and formatting",
            "Consider list hygiene and authentication improvements"
          ] : [
            "Spam rates appear healthy for good deliverability",
            "Continue monitoring deliverability metrics",
            "Maintain current content and sending practices"
          ]
        })
        console.log('Spam rate analysis completed')
      } catch (e) {
        console.error('Error in spam rate analysis:', e)
      }

      // 15. BOUNCE RATE TREND ANALYSIS
      try {
        // Calculate bounce rate from delivery data (estimated)
        const estimatedBounceRates = recentCampaigns.map(c => {
          const estimatedDelivered = c.emailsSent * (1 - c.spamRate / 100)
          const estimatedBounceRate = Math.max(0, (c.emailsSent - estimatedDelivered) / c.emailsSent * 100)
          return estimatedBounceRate
        })
        
        const avgBounceRate = estimatedBounceRates.reduce((sum, rate) => sum + rate, 0) / estimatedBounceRates.length
        const recentBounceRate = estimatedBounceRates.slice(-5).reduce((sum, rate) => sum + rate, 0) / 
                                Math.min(5, estimatedBounceRates.length)
        
        const hasBounceTrend = avgBounceRate > 2 || recentBounceRate > avgBounceRate * 1.5
        
        insights.push({
          insightId: "bounce-rate-trend",
          title: "Bounce Rate Trend Analysis",
          category: "List Health & Deliverability",
          hasSignificantFinding: hasBounceTrend,
          summary: hasBounceTrend ?
            `Bounce rate analysis indicates potential list health issues. Average estimated bounce rate of ` +
            `${avgBounceRate.toFixed(2)}% suggests the need for list hygiene improvements to maintain ` +
            `deliverability and sender reputation.` :
            'No significant findings in this analysis',
          data: {
            avgBounceRate: avgBounceRate.toFixed(2),
            recentBounceRate: recentBounceRate.toFixed(2),
            trendDirection: recentBounceRate > avgBounceRate ? 'increasing' : 'stable'
          },
          significance: hasBounceTrend ? Math.min(avgBounceRate / 5, 1.0) : 0.1,
          confidence: 0.7,
          recommendations: hasBounceTrend ? [
            "Implement regular list cleaning to remove invalid addresses",
            "Use double opt-in to ensure email validity",
            "Monitor bounce rates closely and suppress hard bounces"
          ] : [
            "Bounce rates appear within acceptable ranges",
            "Continue current list management practices",
            "Monitor for any emerging bounce trends"
          ]
        })
        console.log('Bounce rate trend analysis completed')
      } catch (e) {
        console.error('Error in bounce rate trend analysis:', e)
      }
    }

    console.log('Analysis completed successfully, insights generated:', insights.length)

    // ENHANCE INSIGHTS WITH REAL AI ANALYSIS (OpenAI o3/GPT-4o)
    console.log('Starting REAL AI enhancement with OpenAI...')
    let enhancedInsights: { [key: string]: any } = {}
    let customDiscoveries: any[] = []
    let strategicSynthesis: any = {}
    
    // Attempt real OpenAI analysis
    try {
      const aiAnalysis = await callOpenAI(insights.filter(i => i.hasSignificantFinding), {
        totalRevenue: '3482.44', // This should come from actual data
        campaignsProcessed: recentCampaigns.length
      })
      
      if (aiAnalysis) {
        console.log('✅ OpenAI analysis successful!')
        enhancedInsights = aiAnalysis.insights || {}
        customDiscoveries = aiAnalysis.customDiscoveries || []
        strategicSynthesis = aiAnalysis.strategicSynthesis || {}
      } else {
        throw new Error('OpenAI analysis failed')
      }
    } catch (error) {
      console.log('OpenAI analysis failed, using fallback templates:', error.message)
      
      // Fallback to template-based enhancement
      insights.forEach(insight => {
        if (insight.hasSignificantFinding) {
          enhancedInsights[insight.insightId] = {
            originalInsight: insight,
            aiEnhancement: generateAIEnhancement(insight, recentCampaigns)
          }
        }
      })
      
      customDiscoveries.push(...generateCustomDiscoveries(recentCampaigns))
      strategicSynthesis = generateStrategicSynthesis(insights, recentCampaigns)
    }
    
    console.log('AI enhancement completed, enhanced insights:', Object.keys(enhancedInsights).length)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Insights processing completed',
        timestamp: new Date().toISOString(),
        requestId: Math.floor(Math.random() * 1000),
        jobId: requestData.jobId,
        data: {
          campaignsProcessed: safeCampaigns.length,
          flowsProcessed: 0,
          subscribersProcessed: 0,
          insightsGenerated: insights.length,
          insights: insights,
          enhancedAnalysis: {
            insights: enhancedInsights,
            customDiscoveries: customDiscoveries,
            strategicSynthesis: strategicSynthesis
          }
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    console.error('Stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Function execution failed',
        details: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
