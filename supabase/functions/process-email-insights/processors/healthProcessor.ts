import type { ProcessedCampaign, ProcessedFlowEmail, InsightResult } from "../../shared/types.ts"

export class HealthProcessor {
  private campaigns: ProcessedCampaign[]
  private flows: ProcessedFlowEmail[]
  private readonly analysisWindow = 90 // days

  constructor(campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[]) {
    this.campaigns = this.filterToAnalysisWindow(campaigns)
    this.flows = this.filterFlowsToAnalysisWindow(flows)
  }

  private filterToAnalysisWindow(campaigns: ProcessedCampaign[]): ProcessedCampaign[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.analysisWindow)
    return campaigns.filter(campaign => campaign.sentDate >= cutoffDate)
  }

  private filterFlowsToAnalysisWindow(flows: ProcessedFlowEmail[]): ProcessedFlowEmail[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.analysisWindow)
    return flows.filter(flow => flow.sentDate >= cutoffDate)
  }

  detectCampaignFatigue(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const monthlyFatigueData = this.calculateMonthlyFatigue(allEmails)
    
    const fatigueMetrics = monthlyFatigueData.map(month => ({
      month: month.month,
      avgUnsubscribeRate: month.avgUnsubscribeRate,
      avgSpamRate: month.avgSpamRate,
      emailVolume: month.emailCount,
      fatigueIndex: (month.avgUnsubscribeRate + month.avgSpamRate) * month.emailCount
    }))

    const trend = this.calculateTrend(fatigueMetrics.map(m => m.fatigueIndex))
    const currentFatigueLevel = this.assessCurrentFatigueLevel(fatigueMetrics)
    
    const highFatigueMonths = fatigueMetrics.filter(m => 
      m.avgUnsubscribeRate > 1.0 || m.avgSpamRate > 0.5
    )

    return {
      insightId: "campaign-fatigue",
      title: "Campaign Fatigue Detection",
      category: "list-health",
      data: {
        monthlyData: fatigueMetrics,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        trendValue: trend.toFixed(3),
        currentLevel: currentFatigueLevel,
        highFatigueMonths: highFatigueMonths.length,
        totalMonthsAnalyzed: fatigueMetrics.length
      },
      significance: Math.abs(trend),
      confidence: fatigueMetrics.length > 3 ? 0.8 : 0.6,
      recommendations: [
        currentFatigueLevel === 'high' ? "Immediate action needed - reduce email frequency" : "Fatigue levels are manageable",
        trend > 0.1 ? "Fatigue is increasing - monitor closely" : "Fatigue trend is stable",
        highFatigueMonths.length > 2 ? "Multiple high-fatigue periods detected" : "Fatigue spikes are infrequent",
        "Consider segmentation to reduce fatigue"
      ]
    }
  }

  analyzeBounceRateTrend(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const monthlyBounceData = this.calculateMonthlyBounceRates(allEmails)
    
    const bounceMetrics = monthlyBounceData.map(month => ({
      month: month.month,
      avgBounceRate: month.avgBounceRate,
      emailVolume: month.emailCount,
      totalBounces: month.totalBounces,
      listHealthScore: 100 - (month.avgBounceRate * 10) // Simple health scoring
    }))

    const bounceTrend = this.calculateTrend(bounceMetrics.map(m => m.avgBounceRate))
    const listHealthTrend = this.calculateTrend(bounceMetrics.map(m => m.listHealthScore))
    
    const deteriorationPeriods = bounceMetrics.filter(m => m.avgBounceRate > 3.0)
    const currentBounceRate = bounceMetrics[bounceMetrics.length - 1]?.avgBounceRate || 0

    return {
      insightId: "bounce-rate-trend",
      title: "List Health Deterioration Analysis",
      category: "list-health",
      data: {
        monthlyData: bounceMetrics,
        bounceTrend: bounceTrend > 0 ? 'worsening' : bounceTrend < 0 ? 'improving' : 'stable',
        bounceTrendValue: bounceTrend.toFixed(3),
        listHealthTrend: listHealthTrend > 0 ? 'improving' : listHealthTrend < 0 ? 'deteriorating' : 'stable',
        currentBounceRate: currentBounceRate.toFixed(2),
        deteriorationPeriods: deteriorationPeriods.length,
        avgListHealthScore: this.calculateAverage(bounceMetrics.map(m => m.listHealthScore)).toFixed(1)
      },
      significance: Math.abs(bounceTrend),
      confidence: bounceMetrics.length > 3 ? 0.9 : 0.7,
      recommendations: [
        currentBounceRate > 3 ? "High bounce rate detected - implement list cleaning" : "Bounce rates are healthy",
        bounceTrend > 0.1 ? "Bounce rates are increasing - investigate list sources" : "Bounce trend is acceptable",
        deteriorationPeriods.length > 1 ? "Multiple deterioration periods - review list hygiene practices" : "List health is generally stable",
        "Implement regular list cleaning and validation"
      ]
    }
  }

  analyzeSpamBySize(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const sizeAnalysis = this.analyzeSizeVsSpamCorrelation(allEmails)
    
    const sizeBuckets = {
      'Small (0-10k)': allEmails.filter(e => e.emailsSent <= 10000),
      'Medium (10k-50k)': allEmails.filter(e => e.emailsSent > 10000 && e.emailsSent <= 50000),
      'Large (50k-100k)': allEmails.filter(e => e.emailsSent > 50000 && e.emailsSent <= 100000),
      'Very Large (100k+)': allEmails.filter(e => e.emailsSent > 100000)
    }

    const bucketStats = Object.entries(sizeBuckets).map(([bucket, emails]) => ({
      bucket,
      emailCount: emails.length,
      avgSpamRate: this.calculateAverage(emails.map(e => e.spamRate)),
      avgUnsubRate: this.calculateAverage(emails.map(e => e.unsubscribeRate)),
      totalEmailsSent: emails.reduce((sum, e) => sum + e.emailsSent, 0),
      avgListSize: emails.length > 0 ? emails.reduce((sum, e) => sum + e.emailsSent, 0) / emails.length : 0
    })).filter(bucket => bucket.emailCount > 0)

    const correlation = this.calculateCorrelation(
      allEmails.map(e => e.emailsSent),
      allEmails.map(e => e.spamRate)
    )

    const highestSpamBucket = bucketStats.length > 0 ? bucketStats.reduce((highest, current) => 
      current.avgSpamRate > highest.avgSpamRate ? current : highest
    ) : { bucket: 'None', count: 0, avgSpamRate: 0 }

    return {
      insightId: "spam-by-size",
      title: "Email Size vs Spam Rate Analysis",
      category: "deliverability",
      data: {
        sizeBuckets: bucketStats,
        correlation: correlation.toFixed(3),
        correlationStrength: this.interpretCorrelation(correlation),
        highestSpamBucket: highestSpamBucket.bucket,
        totalEmailsAnalyzed: allEmails.length,
        sizeAnalysis
      },
      significance: Math.abs(correlation),
      confidence: allEmails.length > 50 ? 0.8 : 0.6,
      recommendations: [
        Math.abs(correlation) > 0.3 ? "List size significantly impacts spam rates" : "List size has minimal impact on spam rates",
        correlation > 0.3 ? "Larger sends have higher spam rates - investigate list quality" : "Spam rates are consistent across send sizes",
        `${highestSpamBucket.bucket} sends show highest spam rates`,
        "Monitor deliverability metrics especially for larger sends"
      ]
    }
  }

  private calculateMonthlyFatigue(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const monthlyData: Record<string, any> = {}
    
    emails.forEach(email => {
      const monthKey = email.sentDate.toISOString().substring(0, 7)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          emails: [],
          totalUnsubscribes: 0,
          totalSpam: 0,
          totalEmailsSent: 0
        }
      }
      
      monthlyData[monthKey].emails.push(email)
      monthlyData[monthKey].totalUnsubscribes += email.unsubscribeRate * email.emailsSent / 100
      monthlyData[monthKey].totalSpam += email.spamRate * email.emailsSent / 100
      monthlyData[monthKey].totalEmailsSent += email.emailsSent
    })

    return Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      emailCount: month.emails.length,
      avgUnsubscribeRate: (month.totalUnsubscribes / month.totalEmailsSent) * 100,
      avgSpamRate: (month.totalSpam / month.totalEmailsSent) * 100,
      totalEmailsSent: month.totalEmailsSent
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  private calculateMonthlyBounceRates(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const monthlyData: Record<string, any> = {}
    
    emails.forEach(email => {
      const monthKey = email.sentDate.toISOString().substring(0, 7)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          emails: [],
          totalBounces: 0,
          totalEmailsSent: 0
        }
      }
      
      monthlyData[monthKey].emails.push(email)
      monthlyData[monthKey].totalBounces += email.bounceRate * email.emailsSent / 100
      monthlyData[monthKey].totalEmailsSent += email.emailsSent
    })

    return Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      emailCount: month.emails.length,
      avgBounceRate: (month.totalBounces / month.totalEmailsSent) * 100,
      totalBounces: month.totalBounces,
      totalEmailsSent: month.totalEmailsSent
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  private analyzeSizeVsSpamCorrelation(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any {
    const sizeRanges = [
      { min: 0, max: 10000, label: '0-10k' },
      { min: 10001, max: 50000, label: '10k-50k' },
      { min: 50001, max: 100000, label: '50k-100k' },
      { min: 100001, max: Infinity, label: '100k+' }
    ]

    const analysis = sizeRanges.map(range => {
      const emailsInRange = emails.filter(e => e.emailsSent >= range.min && e.emailsSent <= range.max)
      return {
        range: range.label,
        count: emailsInRange.length,
        avgSpamRate: this.calculateAverage(emailsInRange.map(e => e.spamRate)),
        avgSize: this.calculateAverage(emailsInRange.map(e => e.emailsSent))
      }
    }).filter(range => range.count > 0)

    return analysis
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0
    
    const xValues = values.map((_, i) => i)
    const yValues = values
    
    const n = values.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope
  }

  private assessCurrentFatigueLevel(metrics: any[]): string {
    if (metrics.length === 0) return 'unknown'
    
    const latest = metrics[metrics.length - 1]
    const fatigueScore = latest.avgUnsubscribeRate + latest.avgSpamRate
    
    if (fatigueScore > 2.0) return 'high'
    if (fatigueScore > 1.0) return 'medium'
    return 'low'
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n < 2) return 0
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private interpretCorrelation(correlation: number): string {
    const abs = Math.abs(correlation)
    if (abs > 0.7) return 'strong'
    if (abs > 0.3) return 'moderate'
    return 'weak'
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }
}
