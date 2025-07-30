import type { ProcessedCampaign, ProcessedFlowEmail, ProcessedSubscriber, InsightResult } from "../../shared/types.ts"

interface UserContext {
  storeName?: string
  productDescription?: string
  priceRange?: string
  slowMonths?: string[]
}

interface EnhancedContext {
  // User provided
  storeName?: string
  productDescription?: string
  priceRange?: string
  slowMonths?: string[]
  
  // Calculated
  accountMetrics: {
    avgOrderValue: number
    purchaseFrequency: 'one-time' | 'occasional' | 'regular' | 'frequent'
    listSize: number
    accountAge: number
    monthlyEmailVolume: number
  }
  
  // Performance
  performance: {
    avgOpenRate: number
    avgClickRate: number
    avgRevenuePerEmail: number
    accountTier: 'struggling' | 'average' | 'good' | 'excellent'
  }
  
  // Detected from insights
  detectedPatterns: {
    primaryChallenges: string[]
    opportunities: string[]
    seasonalityStrength: 'none' | 'weak' | 'moderate' | 'strong'
    topContentThemes: string[]
  }
}

export function generateEnhancedContext(
  userContext: UserContext,
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[],
  subscribers: ProcessedSubscriber[],
  insights: InsightResult[]
): EnhancedContext {
  // Calculate account metrics
  const accountMetrics = calculateAccountMetrics(campaigns, flows, subscribers)
  
  // Calculate performance benchmarks
  const performance = calculatePerformanceBenchmarks(campaigns, flows)
  
  // Detect patterns from insights and data
  const detectedPatterns = detectDataPatterns(campaigns, flows, subscribers, insights)
  
  return {
    // User provided context
    storeName: userContext.storeName,
    productDescription: userContext.productDescription,
    priceRange: userContext.priceRange,
    slowMonths: userContext.slowMonths,
    
    // Enhanced with calculated data
    accountMetrics,
    performance,
    detectedPatterns
  }
}

function calculateAccountMetrics(
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[],
  subscribers: ProcessedSubscriber[]
): EnhancedContext['accountMetrics'] {
  // Calculate average order value
  const totalRevenue = [
    ...campaigns.map(c => c.revenue),
    ...flows.map(f => f.revenue)
  ].reduce((sum, rev) => sum + rev, 0)
  
  const totalOrders = [
    ...campaigns.map(c => c.totalOrders),
    ...flows.map(f => f.totalOrders)
  ].reduce((sum, orders) => sum + orders, 0)
  
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  // Calculate purchase frequency from subscriber CLV patterns
  const purchaseFrequency = calculatePurchaseFrequency(subscribers)
  
  // List size from active subscribers
  const listSize = subscribers.filter(s => s.status === 'active').length
  
  // Account age from oldest email
  const accountAge = calculateAccountAge(campaigns, flows)
  
  // Monthly email volume
  const monthlyEmailVolume = calculateMonthlyEmailVolume(campaigns, flows)
  
  return {
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    purchaseFrequency,
    listSize,
    accountAge,
    monthlyEmailVolume: Math.round(monthlyEmailVolume)
  }
}

function calculatePerformanceBenchmarks(
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[]
): EnhancedContext['performance'] {
  const allEmails = [...campaigns, ...flows]
  
  // Calculate weighted averages based on email volume
  const totalEmailsSent = allEmails.reduce((sum, email) => sum + email.emailsSent, 0)
  const totalRevenue = allEmails.reduce((sum, email) => sum + email.revenue, 0)
  
  const avgOpenRate = allEmails.reduce((sum, email) => 
    sum + (email.openRate * email.emailsSent), 0
  ) / totalEmailsSent
  
  const avgClickRate = allEmails.reduce((sum, email) => 
    sum + (email.clickRate * email.emailsSent), 0
  ) / totalEmailsSent
  
  const avgRevenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0
  
  // Determine account tier based on industry benchmarks
  const accountTier = determineAccountTier(avgOpenRate, avgClickRate, avgRevenuePerEmail)
  
  return {
    avgOpenRate: Math.round(avgOpenRate * 100) / 100,
    avgClickRate: Math.round(avgClickRate * 100) / 100,
    avgRevenuePerEmail: Math.round(avgRevenuePerEmail * 100) / 100,
    accountTier
  }
}

function detectDataPatterns(
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[],
  subscribers: ProcessedSubscriber[],
  insights: InsightResult[]
): EnhancedContext['detectedPatterns'] {
  // Extract primary challenges from high-significance insights
  const primaryChallenges = detectPrimaryChallenges(insights)
  
  // Identify opportunities from positive insights
  const opportunities = identifyOpportunities(insights, campaigns, flows)
  
  // Calculate seasonality strength
  const seasonalityStrength = calculateSeasonality(campaigns, flows)
  
  // Extract top content themes
  const topContentThemes = extractContentThemes(campaigns)
  
  return {
    primaryChallenges,
    opportunities,
    seasonalityStrength,
    topContentThemes
  }
}

function calculatePurchaseFrequency(subscribers: ProcessedSubscriber[]): 'one-time' | 'occasional' | 'regular' | 'frequent' {
  if (subscribers.length === 0) return 'one-time'
  
  const avgTotalRevenue = subscribers.reduce((sum, sub) => sum + sub.totalRevenue, 0) / subscribers.length
  const avgOrderValue = subscribers.reduce((sum, sub) => sum + sub.averageOrderValue, 0) / subscribers.length
  
  const avgPurchaseCount = avgOrderValue > 0 ? avgTotalRevenue / avgOrderValue : 0
  
  if (avgPurchaseCount <= 1.2) return 'one-time'
  if (avgPurchaseCount <= 2.5) return 'occasional'
  if (avgPurchaseCount <= 5) return 'regular'
  return 'frequent'
}

function calculateAccountAge(campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[]): number {
  const allDates = [
    ...campaigns.map(c => c.sentDate),
    ...flows.map(f => f.sentDate)
  ]
  
  if (allDates.length === 0) return 0
  
  const oldestDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const now = new Date()
  
  return Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateMonthlyEmailVolume(campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[]): number {
  const allEmails = [...campaigns, ...flows]
  if (allEmails.length === 0) return 0
  
  // Group by month and calculate average
  const monthlyVolumes: Record<string, number> = {}
  
  allEmails.forEach(email => {
    const monthKey = email.sentDate.toISOString().substring(0, 7) // YYYY-MM
    if (!monthlyVolumes[monthKey]) {
      monthlyVolumes[monthKey] = 0
    }
    monthlyVolumes[monthKey] += email.emailsSent
  })
  
  const volumes = Object.values(monthlyVolumes)
  return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
}

function determineAccountTier(openRate: number, clickRate: number, revenuePerEmail: number): 'struggling' | 'average' | 'good' | 'excellent' {
  // Industry benchmark scoring (weighted)
  let score = 0
  
  // Open rate scoring (40% weight)
  if (openRate >= 25) score += 40
  else if (openRate >= 20) score += 30
  else if (openRate >= 15) score += 20
  else score += 10
  
  // Click rate scoring (35% weight)
  if (clickRate >= 4) score += 35
  else if (clickRate >= 2.5) score += 25
  else if (clickRate >= 1.5) score += 15
  else score += 5
  
  // Revenue per email scoring (25% weight)
  if (revenuePerEmail >= 0.5) score += 25
  else if (revenuePerEmail >= 0.25) score += 20
  else if (revenuePerEmail >= 0.1) score += 15
  else score += 5
  
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'average'
  return 'struggling'
}

function detectPrimaryChallenges(insights: InsightResult[]): string[] {
  const challenges: string[] = []
  
  // Look for high-significance negative insights
  insights.forEach(insight => {
    if (insight.significance > 0.6) {
      // Extract challenges based on insight categories and titles
      if (insight.category === 'subscriber-health' && insight.title.includes('Decline')) {
        challenges.push('subscriber engagement declining')
      }
      
      if (insight.category === 'performance-issues' || insight.title.includes('Underperforming')) {
        challenges.push('campaign performance issues')
      }
      
      if (insight.title.includes('Unsubscribe') && insight.significance > 0.5) {
        challenges.push('high unsubscribe rate')
      }
      
      if (insight.title.includes('Low') || insight.title.includes('Poor')) {
        challenges.push('engagement optimization needed')
      }
      
      if (insight.category === 'timing-optimization' && insight.significance > 0.7) {
        challenges.push('suboptimal send timing')
      }
    }
  })
  
  // Remove duplicates and limit to top 3
  return Array.from(new Set(challenges)).slice(0, 3)
}

function identifyOpportunities(
  insights: InsightResult[],
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[]
): string[] {
  const opportunities: string[] = []
  
  // Look for high-confidence positive insights
  insights.forEach(insight => {
    if (insight.confidence > 0.7 && insight.significance > 0.4) {
      if (insight.title.includes('Best') || insight.title.includes('Optimal')) {
        opportunities.push('identified high-performing patterns')
      }
      
      if (insight.category === 'timing-optimization') {
        opportunities.push('timing optimization potential')
      }
      
      if (insight.category === 'segmentation' || insight.title.includes('Segment')) {
        opportunities.push('audience segmentation opportunities')
      }
      
      if (insight.title.includes('Growth') || insight.title.includes('Increase')) {
        opportunities.push('revenue growth potential identified')
      }
    }
  })
  
  // Add data-driven opportunities
  const allEmails = [...campaigns, ...flows]
  const topPerformers = allEmails
    .filter(email => email.openRate > 30 && email.clickRate > 3)
    .length
  
  if (topPerformers > allEmails.length * 0.2) {
    opportunities.push('strong content performance foundation')
  }
  
  // Check for underutilized flows
  const flowRevenue = flows.reduce((sum, f) => sum + f.revenue, 0)
  const totalRevenue = allEmails.reduce((sum, e) => sum + e.revenue, 0)
  
  if (flowRevenue / totalRevenue < 0.3 && flows.length > 0) {
    opportunities.push('automated flow expansion potential')
  }
  
  return Array.from(new Set(opportunities)).slice(0, 4)
}

function calculateSeasonality(campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[]): 'none' | 'weak' | 'moderate' | 'strong' {
  const allEmails = [...campaigns, ...flows]
  if (allEmails.length < 6) return 'none' // Need sufficient data
  
  // Group revenue by month
  const monthlyRevenue: Record<string, number> = {}
  
  allEmails.forEach(email => {
    const month = email.sentDate.getMonth() // 0-11
    const monthName = new Date(2024, month, 1).toLocaleString('default', { month: 'long' })
    
    if (!monthlyRevenue[monthName]) {
      monthlyRevenue[monthName] = 0
    }
    monthlyRevenue[monthName] += email.revenue
  })
  
  const revenues = Object.values(monthlyRevenue)
  if (revenues.length < 3) return 'none'
  
  // Calculate coefficient of variation
  const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length
  const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0
  
  if (coefficientOfVariation > 0.5) return 'strong'
  if (coefficientOfVariation > 0.3) return 'moderate'
  if (coefficientOfVariation > 0.15) return 'weak'
  return 'none'
}

function extractContentThemes(campaigns: ProcessedCampaign[]): string[] {
  if (campaigns.length === 0) return []
  
  // Get top 25% performing campaigns
  const sortedCampaigns = campaigns
    .filter(c => c.revenue > 0)
    .sort((a, b) => (b.revenue / b.emailsSent) - (a.revenue / a.emailsSent))
  
  const topQuartile = sortedCampaigns.slice(0, Math.max(1, Math.floor(sortedCampaigns.length * 0.25)))
  
  // Extract themes from subject lines
  const themes: Record<string, number> = {}
  
  topQuartile.forEach(campaign => {
    const subject = campaign.subject.toLowerCase()
    
    // Define theme patterns
    const themePatterns = {
      'promotional': /sale|discount|off|deal|promo|save|%/,
      'seasonal': /holiday|summer|winter|spring|fall|christmas|halloween|valentine/,
      'urgency': /limited|hurry|today|now|urgent|deadline|expires/,
      'social-proof': /bestseller|popular|trending|favorite|loved|rated/,
      'personal': /you|your|personal|custom|exclusive|just for you/,
      'product-focused': /new|launch|collection|product|item|arrival/,
      'educational': /how|tips|guide|learn|discover|unlock|secret/,
      'value': /free|bonus|gift|value|worth|included/
    }
    
    Object.entries(themePatterns).forEach(([theme, pattern]) => {
      if (pattern.test(subject)) {
        themes[theme] = (themes[theme] || 0) + 1
      }
    })
  })
  
  // Return top 3 themes
  return Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([theme]) => theme)
}
