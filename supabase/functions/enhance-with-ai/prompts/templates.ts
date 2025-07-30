// Prompt templates for AI enhancement analysis

export interface PromptTemplates {
  system: string
  analysis: (insights: any[], context: any) => string
  discovery: (context: any) => string
  synthesis: (insights: any[], discoveries: any[]) => string
}

export const promptTemplates: PromptTemplates = {
  
  system: `You are an expert email marketing strategist and data analyst with 15+ years of experience optimizing campaigns for ecommerce businesses. You specialize in:

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

Always respond with valid JSON matching the specified structure.`,

  analysis: (insights: any[], context: any) => `Perform comprehensive analysis of this email marketing account:

## BUSINESS CONTEXT:
Store Name: ${context.storeName}
Product Description: ${context.productDescription}
Price Range: ${context.priceRange}
Slow Months: ${context.slowMonths.join(', ')}

Account Metrics:
- Average Order Value: $${context.accountMetrics.avgOrderValue}
- Purchase Frequency: ${context.accountMetrics.purchaseFrequency}
- List Size: ${context.accountMetrics.listSize} subscribers
- Account Age: ${context.accountMetrics.accountAge} days
- Monthly Email Volume: ${context.accountMetrics.monthlyEmailVolume} emails

Performance Benchmarks:
- Average Open Rate: ${context.performance.avgOpenRate}%
- Average Click Rate: ${context.performance.avgClickRate}%
- Revenue per Email: $${context.performance.avgRevenuePerEmail}
- Account Tier: ${context.performance.accountTier}

Detected Patterns:
- Primary Challenges: ${context.detectedPatterns.primaryChallenges.join(', ')}
- Opportunities: ${context.detectedPatterns.opportunities.join(', ')}
- Seasonality: ${context.detectedPatterns.seasonalityStrength}
- Top Content Themes: ${context.detectedPatterns.topContentThemes.join(', ')}

## CALCULATED INSIGHTS (${insights.length} analyses):
${JSON.stringify(insights, null, 2)}

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
Find insights beyond the standard ${insights.length} analyses:
- Unique patterns specific to this ${context.storeName} business (${context.productDescription})
- Untapped opportunities given their ${context.priceRange} price point
- Strategic advantages they haven't leveraged
- Competitive positioning improvements

## OUTPUT FORMAT:
Respond with valid JSON matching this exact structure:

{
  "insights": {
    "[insightId]": {
      "originalInsight": { /* preserve original insight object */ },
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
      "estimatedValue": 0000,
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
4. Leveraging their strength in ${context.detectedPatterns.topContentThemes.join(' and ')} content themes

Ensure every enhancement is grounded in the actual data provided and offers concrete, measurable improvements.`,

  discovery: (context: any) => `Based on the business context provided, identify 3-5 custom discoveries that go beyond standard email marketing analysis:

Business Type: ${context.storeName} (${context.productDescription}) with ${context.priceRange} price points
Account Status: ${context.performance.accountTier} performance tier
Key Strengths: ${context.detectedPatterns.topContentThemes.join(', ')} content themes
Main Challenges: ${context.detectedPatterns.primaryChallenges.join(', ')}

Look for:
- Industry-specific opportunities missed by generic analysis
- Price-point strategies unique to their market segment
- Seasonal patterns specific to their slowest months (${context.slowMonths.join(', ')})
- Untapped revenue streams based on their current performance tier
- Competitive advantages they haven't leveraged

Each discovery should include:
- Specific evidence from their data
- Estimated dollar value or percentage improvement
- Clear implementation steps
- Timeline for results`,

  synthesis: (insights: any[], discoveries: any[]) => `Synthesize all analysis into strategic recommendations:

Original Insights Analyzed: ${insights.length}
Custom Discoveries: ${discoveries.length}

Create a strategic synthesis that:
1. Identifies the single biggest opportunity (with estimated impact)
2. Highlights the primary risk requiring immediate attention
3. Provides 3-5 prioritized actions ranked by ROI and effort

Each prioritized action must include:
- Specific, measurable action steps
- Expected ROI with timeframe
- Implementation effort level (low/medium/high)
- Success metrics to track

Focus on recommendations that:
- Address the most significant issues first
- Leverage existing strengths
- Are realistic for the current account size and performance level
- Build upon each other for compounding effects`
}

// Helper function to create context-aware prompts
export function createContextualPrompt(
  template: string, 
  insights: any[], 
  context: any, 
  customData?: any
): string {
  let prompt = template
  
  // Replace context variables
  if (context) {
    Object.keys(context).forEach(key => {
      const value = context[key]
      if (typeof value === 'object') {
        Object.keys(value).forEach(subKey => {
          prompt = prompt.replace(
            new RegExp(`{{${key}\\.${subKey}}}`, 'g'),
            String(value[subKey])
          )
        })
      } else {
        prompt = prompt.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value)
        )
      }
    })
  }
  
  // Replace insight count
  if (insights) {
    prompt = prompt.replace(/{{insightCount}}/g, String(insights.length))
  }
  
  // Add custom data if provided
  if (customData) {
    prompt = prompt.replace(/{{customData}}/g, JSON.stringify(customData, null, 2))
  }
  
  return prompt
}

// Quality validation for AI responses
export function validateAIResponse(response: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const parsed = JSON.parse(response)
    
    // Check required top-level fields
    if (!parsed.insights) errors.push('Missing insights field')
    if (!parsed.customDiscoveries) errors.push('Missing customDiscoveries field')
    if (!parsed.strategicSynthesis) errors.push('Missing strategicSynthesis field')
    
    // Validate insights structure
    if (parsed.insights && typeof parsed.insights === 'object') {
      Object.keys(parsed.insights).forEach(key => {
        const insight = parsed.insights[key]
        if (!insight.originalInsight) warnings.push(`Missing originalInsight for ${key}`)
        if (!insight.aiEnhancement) errors.push(`Missing aiEnhancement for ${key}`)
        
        if (insight.aiEnhancement) {
          if (!insight.aiEnhancement.deeperAnalysis) warnings.push(`Missing deeperAnalysis for ${key}`)
          if (!insight.aiEnhancement.specificActions || !Array.isArray(insight.aiEnhancement.specificActions)) {
            warnings.push(`Missing or invalid specificActions for ${key}`)
          }
        }
      })
    }
    
    // Validate customDiscoveries
    if (parsed.customDiscoveries && Array.isArray(parsed.customDiscoveries)) {
      parsed.customDiscoveries.forEach((discovery: any, index: number) => {
        if (!discovery.title) warnings.push(`Missing title for discovery ${index}`)
        if (!discovery.finding) warnings.push(`Missing finding for discovery ${index}`)
        if (typeof discovery.estimatedValue !== 'number') {
          warnings.push(`Invalid estimatedValue for discovery ${index}`)
        }
      })
    }
    
    // Validate strategicSynthesis
    if (parsed.strategicSynthesis) {
      if (!parsed.strategicSynthesis.biggestOpportunity) {
        warnings.push('Missing biggestOpportunity in synthesis')
      }
      if (!parsed.strategicSynthesis.primaryRisk) {
        warnings.push('Missing primaryRisk in synthesis')
      }
      if (!Array.isArray(parsed.strategicSynthesis.prioritizedActions)) {
        errors.push('Invalid prioritizedActions in synthesis')
      }
    }
    
  } catch (parseError) {
    errors.push('Invalid JSON format')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
