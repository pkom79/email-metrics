// AI Enhancement Edge Function for Deep Email Marketing Analysis
// Uses o3 primary with GPT-4o fallback for sophisticated insights

// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface InsightResult {
  insightId: string
  title: string
  category: string
  data: any
  significance: number
  confidence: number
  recommendations: string[]
}

interface EnhancedContext {
  storeName: string
  productDescription: string
  priceRange: string
  slowMonths: string[]
  accountMetrics: {
    avgOrderValue: number
    purchaseFrequency: string
    listSize: number
    accountAge: number
    monthlyEmailVolume: number
  }
  performance: {
    avgOpenRate: number
    avgClickRate: number
    avgRevenuePerEmail: number
    accountTier: string
  }
  detectedPatterns: {
    primaryChallenges: string[]
    opportunities: string[]
    seasonalityStrength: string
    topContentThemes: string[]
  }
}

interface EnhancedAnalysis {
  insights: {
    [insightId: string]: {
      originalInsight: InsightResult
      aiEnhancement: {
        deeperAnalysis: string
        rootCause: string
        predictedImpact: string
        specificActions: string[]
      }
    }
  }
  customDiscoveries: Array<{
    title: string
    finding: string
    evidence: string
    estimatedValue: number
    implementation: string
  }>
  strategicSynthesis: {
    biggestOpportunity: string
    primaryRisk: string
    prioritizedActions: Array<{
      action: string
      expectedROI: string
      timeframe: string
      effort: 'low' | 'medium' | 'high'
    }>
  }
}

interface AIRequest {
  insights: InsightResult[]
  enhancedContext: EnhancedContext
  accountId: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { insights, enhancedContext, accountId }: AIRequest = await req.json()

    // Validate required data
    if (!insights || !enhancedContext || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: insights, enhancedContext, or accountId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get OpenAI API key from environment
    // @ts-ignore - Deno environment access
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Perform AI analysis with o3/GPT-4o fallback
    const enhancedAnalysis = await performAIAnalysis(insights, enhancedContext, openaiApiKey)

    // Store results in Supabase
    const supabase = createClient(
      // @ts-ignore - Deno environment access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno environment access
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    await supabase
      .from('insight_analysis')
      .insert({
        account_id: accountId,
        analysis_type: 'ai_enhanced',
        results: enhancedAnalysis,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: enhancedAnalysis,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Enhancement Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to enhance insights with AI',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function performAIAnalysis(
  insights: InsightResult[], 
  context: EnhancedContext, 
  apiKey: string
): Promise<EnhancedAnalysis> {
  
  // Try o3 first, fallback to GPT-4o
  let response: any
  
  try {
    console.log('Attempting analysis with o3...')
    response = await callOpenAI(insights, context, apiKey, 'o3')
  } catch (error) {
    console.log('o3 failed, falling back to GPT-4o:', error.message)
    try {
      response = await callOpenAI(insights, context, apiKey, 'gpt-4o')
    } catch (fallbackError) {
      console.error('Both o3 and GPT-4o failed:', fallbackError.message)
      throw new Error('AI analysis failed with both models')
    }
  }

  return parseAIResponse(response, insights)
}

async function callOpenAI(
  insights: InsightResult[], 
  context: EnhancedContext, 
  apiKey: string, 
  model: string
): Promise<any> {
  
  const systemPrompt = createSystemPrompt()
  const analysisPrompt = createAnalysisPrompt(insights, context)
  
  const config = model === 'o3' ? {
    model: 'o3',
    temperature: 0.2,
    max_tokens: 8000,
  } : {
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 8000,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...config,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt }
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content
}

function createSystemPrompt(): string {
  return `You are an expert email marketing strategist and data analyst with 15+ years of experience optimizing campaigns for ecommerce businesses. You specialize in:

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

Format your response as structured JSON matching the EnhancedAnalysis interface provided.`
}

function createAnalysisPrompt(insights: InsightResult[], context: EnhancedContext): string {
  const insightsJson = JSON.stringify(insights, null, 2)
  const contextJson = JSON.stringify(context, null, 2)
  
  return `Perform comprehensive analysis of this email marketing account:

## BUSINESS CONTEXT:
${contextJson}

## CALCULATED INSIGHTS (25 analyses):
${insightsJson}

## ANALYSIS REQUIREMENTS:

### Stage 1 - Pattern Recognition
Analyze all insights for hidden relationships. Look for:
- Causal chains between different metrics
- Compound effects where multiple issues amplify each other  
- Timing correlations across campaigns and flows
- Behavioral patterns in subscriber segments

### Stage 2 - Predictive Analysis  
Based on current trends, predict:
- Future problems that will emerge if current patterns continue
- Estimated revenue impact over next 3-6 months
- Engagement decay rates and subscriber churn risks
- Seasonal fluctuations and preparation needs

### Stage 3 - Strategic Recommendations
Generate specific action plans:
- Prioritize by estimated ROI vs implementation effort
- Provide realistic timelines (1 week, 1 month, 1 quarter)
- Include specific metrics to track success
- Account for this business's product category and price range

### Stage 4 - Custom Discoveries
Find insights beyond the standard 25 analyses:
- Unique patterns specific to this ${context.storeName} business (${context.productDescription})
- Untapped opportunities given their ${context.priceRange} price point
- Strategic advantages they haven't leveraged
- Competitive positioning improvements

## OUTPUT FORMAT:
Respond with valid JSON matching this exact structure:

{
  "insights": {
    "[insightId]": {
      "originalInsight": { /* original insight object */ },
      "aiEnhancement": {
        "deeperAnalysis": "Detailed explanation of root causes and relationships",
        "rootCause": "Primary underlying cause of this issue/opportunity", 
        "predictedImpact": "Specific future impact with timeframe and estimated values",
        "specificActions": ["Specific action 1", "Specific action 2", "Specific action 3"]
      }
    }
  },
  "customDiscoveries": [
    {
      "title": "Custom Insight Title",
      "finding": "What was discovered beyond standard analysis",
      "evidence": "Specific data points supporting this finding",
      "estimatedValue": 0000, // Dollar value or percentage improvement
      "implementation": "Specific steps to capture this opportunity"
    }
  ],
  "strategicSynthesis": {
    "biggestOpportunity": "Single highest-value opportunity with estimated impact",
    "primaryRisk": "Most critical risk requiring immediate attention",
    "prioritizedActions": [
      {
        "action": "Specific action with clear success metrics",
        "expectedROI": "X% increase in revenue/engagement over Y timeframe",
        "timeframe": "1 week/1 month/1 quarter",
        "effort": "low/medium/high"
      }
    ]
  }
}

Focus on insights that are:
1. Specific to this ${context.storeName} business (${context.productDescription}) with ${context.performance.accountTier} performance tier
2. Actionable within their current list size of ${context.accountMetrics.listSize} subscribers
3. Realistic given their account age of ${context.accountMetrics.accountAge} days
4. Leveraging their strength in ${context.detectedPatterns.topContentThemes.join(' and ')} content themes`
}

function parseAIResponse(aiResponse: string, originalInsights: InsightResult[]): EnhancedAnalysis {
  try {
    // Clean the response to extract JSON
    let cleanResponse = aiResponse.trim()
    
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const parsed = JSON.parse(cleanResponse)
    
    // Validate and ensure all required fields exist
    const enhancedAnalysis: EnhancedAnalysis = {
      insights: parsed.insights || {},
      customDiscoveries: parsed.customDiscoveries || [],
      strategicSynthesis: parsed.strategicSynthesis || {
        biggestOpportunity: "Unable to determine biggest opportunity",
        primaryRisk: "Unable to determine primary risk", 
        prioritizedActions: []
      }
    }
    
    // Ensure all original insights are represented
    originalInsights.forEach(insight => {
      if (!enhancedAnalysis.insights[insight.insightId]) {
        enhancedAnalysis.insights[insight.insightId] = {
          originalInsight: insight,
          aiEnhancement: {
            deeperAnalysis: "AI analysis unavailable for this insight",
            rootCause: "Unable to determine root cause",
            predictedImpact: "Impact analysis pending",
            specificActions: ["Review this insight manually"]
          }
        }
      } else {
        // Ensure original insight is preserved
        enhancedAnalysis.insights[insight.insightId].originalInsight = insight
      }
    })
    
    return enhancedAnalysis
    
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
    
    // Return fallback structure with original insights
    const fallbackAnalysis: EnhancedAnalysis = {
      insights: {},
      customDiscoveries: [{
        title: "AI Analysis Error",
        finding: "AI response could not be parsed properly",
        evidence: "JSON parsing failed",
        estimatedValue: 0,
        implementation: "Manual review recommended"
      }],
      strategicSynthesis: {
        biggestOpportunity: "Manual analysis required",
        primaryRisk: "AI enhancement unavailable",
        prioritizedActions: [{
          action: "Review insights manually and create action plan",
          expectedROI: "TBD",
          timeframe: "1 week",
          effort: "medium"
        }]
      }
    }
    
    // Add all original insights with basic structure
    originalInsights.forEach(insight => {
      fallbackAnalysis.insights[insight.insightId] = {
        originalInsight: insight,
        aiEnhancement: {
          deeperAnalysis: "AI enhancement unavailable - use original recommendations",
          rootCause: "Analysis pending",
          predictedImpact: "Review original significance and confidence scores",
          specificActions: insight.recommendations
        }
      }
    })
    
    return fallbackAnalysis
  }
}
