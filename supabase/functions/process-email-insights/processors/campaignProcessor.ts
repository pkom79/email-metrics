import type { ProcessedCampaign, InsightResult } from "../../shared/types.ts"

export class CampaignProcessor {
  private campaigns: ProcessedCampaign[]
  private readonly analysisWindow = 90 // days

  constructor(campaigns: ProcessedCampaign[]) {
    this.campaigns = this.filterToAnalysisWindow(campaigns)
  }

  private filterToAnalysisWindow(campaigns: ProcessedCampaign[]): ProcessedCampaign[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.analysisWindow)
    return campaigns.filter(campaign => campaign.sentDate >= cutoffDate)
  }

  analyzeSubjectLineRevenueDrivers(): InsightResult {
    const subjectAnalysis = this.campaigns.map(campaign => {
      const subject = campaign.subject
      return {
        campaign,
        length: subject.length,
        hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(subject),
        hasNumbers: /\d/.test(subject),
        hasQuestion: /\?/.test(subject),
        hasUrgency: /urgent|limited|now|today|ends|last chance|final|hurry/i.test(subject),
        revenuePerEmail: campaign.revenue / campaign.emailsSent
      }
    })

    const avgRevenueWithEmoji = this.calculateAverage(subjectAnalysis.filter(s => s.hasEmoji).map(s => s.revenuePerEmail))
    const avgRevenueWithoutEmoji = this.calculateAverage(subjectAnalysis.filter(s => !s.hasEmoji).map(s => s.revenuePerEmail))
    
    const avgRevenueWithNumbers = this.calculateAverage(subjectAnalysis.filter(s => s.hasNumbers).map(s => s.revenuePerEmail))
    const avgRevenueWithoutNumbers = this.calculateAverage(subjectAnalysis.filter(s => !s.hasNumbers).map(s => s.revenuePerEmail))

    const avgRevenueWithUrgency = this.calculateAverage(subjectAnalysis.filter(s => s.hasUrgency).map(s => s.revenuePerEmail))
    const avgRevenueWithoutUrgency = this.calculateAverage(subjectAnalysis.filter(s => !s.hasUrgency).map(s => s.revenuePerEmail))

    const optimalLength = this.findOptimalRange(subjectAnalysis, 'length', 'revenuePerEmail')
    
    const emojiLift = (avgRevenueWithoutEmoji > 0) ? ((avgRevenueWithEmoji - avgRevenueWithoutEmoji) / avgRevenueWithoutEmoji) * 100 : 0
    const numbersLift = (avgRevenueWithoutNumbers > 0) ? ((avgRevenueWithNumbers - avgRevenueWithoutNumbers) / avgRevenueWithoutNumbers) * 100 : 0
    const urgencyLift = (avgRevenueWithoutUrgency > 0) ? ((avgRevenueWithUrgency - avgRevenueWithoutUrgency) / avgRevenueWithoutUrgency) * 100 : 0

    return {
      insightId: "subject-line-revenue-drivers",
      title: "Subject Line Revenue Drivers",
      category: "campaign-optimization",
      data: {
        emojiLift: (emojiLift || 0).toFixed(1),
        numbersLift: (numbersLift || 0).toFixed(1),
        urgencyLift: (urgencyLift || 0).toFixed(1),
        optimalLength: optimalLength,
        totalCampaignsAnalyzed: this.campaigns.length
      },
      significance: Math.max(Math.abs(emojiLift), Math.abs(numbersLift), Math.abs(urgencyLift)) / 10,
      confidence: this.campaigns.length > 20 ? 0.8 : 0.6,
      recommendations: [
        emojiLift > 10 ? "Use emojis in subject lines for revenue boost" : "Emojis show minimal impact on revenue",
        numbersLift > 10 ? "Include numbers in subject lines" : "Numbers don't significantly impact revenue",
        urgencyLift > 10 ? "Add urgency words to subject lines" : "Urgency words may be overused",
        `Optimal subject line length: ${optimalLength.min}-${optimalLength.max} characters`
      ]
    }
  }

  analyzeCampaignSpacingImpact(): InsightResult {
    const sortedCampaigns = [...this.campaigns].sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime())
    
    const spacingAnalysis = sortedCampaigns.slice(1).map((campaign, index) => {
      const prevCampaign = sortedCampaigns[index]
      const daysBetween = Math.floor((campaign.sentDate.getTime() - prevCampaign.sentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        campaign,
        daysBetween,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        unsubscribeRate: campaign.unsubscribeRate,
        revenuePerEmail: campaign.revenue / campaign.emailsSent
      }
    })

    const spacingBuckets = {
      '1-2 days': spacingAnalysis.filter(s => s.daysBetween <= 2),
      '3-7 days': spacingAnalysis.filter(s => s.daysBetween >= 3 && s.daysBetween <= 7),
      '8-14 days': spacingAnalysis.filter(s => s.daysBetween >= 8 && s.daysBetween <= 14),
      '15+ days': spacingAnalysis.filter(s => s.daysBetween >= 15)
    }

    const bucketStats = Object.entries(spacingBuckets).map(([bucket, campaigns]) => ({
      bucket,
      count: campaigns.length,
      avgOpenRate: this.calculateAverage(campaigns.map(c => c.openRate)),
      avgUnsubRate: this.calculateAverage(campaigns.map(c => c.unsubscribeRate)),
      avgRevenuePerEmail: this.calculateAverage(campaigns.map(c => c.revenuePerEmail))
    }))

    const bestSpacing = bucketStats.length > 0 ? bucketStats.reduce((best, current) => 
      current.avgRevenuePerEmail > best.avgRevenuePerEmail ? current : best
    ) : { bucket: 'none', count: 0, avgRevenuePerEmail: 0, avgOpenRate: 0, avgUnsubRate: 0 }

    return {
      insightId: "campaign-spacing-impact",
      title: "Campaign Spacing Impact Analysis",
      category: "campaign-timing",
      data: {
        spacingStats: bucketStats,
        bestSpacing: bestSpacing.bucket,
        totalAnalyzed: spacingAnalysis.length
      },
      significance: Math.abs(bestSpacing.avgRevenuePerEmail - bucketStats[0].avgRevenuePerEmail) / bucketStats[0].avgRevenuePerEmail,
      confidence: spacingAnalysis.length > 15 ? 0.7 : 0.5,
      recommendations: [
        `Optimal spacing appears to be ${bestSpacing.bucket}`,
        bestSpacing.avgUnsubRate < 0.5 ? "This spacing maintains good list health" : "Monitor unsubscribe rates with current spacing",
        "Test different spacing intervals to optimize performance"
      ]
    }
  }

  findZeroOrderHighEngagement(): InsightResult {
    const zeroOrderCampaigns = this.campaigns.filter(campaign => 
      campaign.totalOrders === 0 && 
      (campaign.openRate > 20 || campaign.clickRate > 2)
    )

    const highEngagementThresholds = {
      openRate: this.calculatePercentile(this.campaigns.map(c => c.openRate), 75),
      clickRate: this.calculatePercentile(this.campaigns.map(c => c.clickRate), 75)
    }

    const analysisResults = zeroOrderCampaigns.map(campaign => ({
      subject: campaign.subject,
      sentDate: campaign.sentDate,
      openRate: campaign.openRate,
      clickRate: campaign.clickRate,
      emailsSent: campaign.emailsSent,
      potentialIssues: this.identifyConversionIssues(campaign)
    }))

    return {
      insightId: "zero-order-high-engagement",
      title: "High Engagement, Zero Orders Analysis",
      category: "conversion-optimization",
      data: {
        campaignsFound: zeroOrderCampaigns.length,
        examples: analysisResults.slice(0, 5),
        thresholds: highEngagementThresholds,
        totalRevenueLoss: zeroOrderCampaigns.reduce((sum, c) => sum + (c.clickRate * c.emailsSent * 0.02 * 50), 0) // estimated
      },
      significance: zeroOrderCampaigns.length / this.campaigns.length,
      confidence: 0.9,
      recommendations: [
        "Review landing pages for these campaigns",
        "Check if products were out of stock",
        "Analyze the customer journey from click to purchase",
        "Consider A/B testing different call-to-action buttons"
      ]
    }
  }

  analyzeCampaignThemePerformance(): InsightResult {
    const themes = this.categorizeCampaignsByTheme()
    
    const themeStats = Object.entries(themes).map(([theme, campaigns]) => ({
      theme,
      count: campaigns.length,
      avgRevenue: this.calculateAverage(campaigns.map(c => c.revenue)),
      avgOpenRate: this.calculateAverage(campaigns.map(c => c.openRate)),
      avgClickRate: this.calculateAverage(campaigns.map(c => c.clickRate)),
      avgRevenuePerEmail: this.calculateAverage(campaigns.map(c => c.revenue / c.emailsSent)),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0)
    })).sort((a, b) => b.avgRevenuePerEmail - a.avgRevenuePerEmail)

    const topTheme = themeStats[0]
    const bottomTheme = themeStats[themeStats.length - 1]

    return {
      insightId: "campaign-theme-performance",
      title: "Campaign Theme Performance Analysis",
      category: "content-optimization",
      data: {
        themes: themeStats,
        topPerformer: topTheme,
        bottomPerformer: bottomTheme,
        performanceGap: (bottomTheme.avgRevenuePerEmail > 0) ? 
          ((topTheme.avgRevenuePerEmail - bottomTheme.avgRevenuePerEmail) / bottomTheme.avgRevenuePerEmail * 100).toFixed(1) : 
          "0.0"
      },
      significance: (bottomTheme.avgRevenuePerEmail > 0) ? 
        (topTheme.avgRevenuePerEmail - bottomTheme.avgRevenuePerEmail) / bottomTheme.avgRevenuePerEmail : 
        0,
      confidence: this.campaigns.length > 30 ? 0.8 : 0.6,
      recommendations: [
        `Focus more on ${topTheme.theme} themed campaigns`,
        `Reduce or optimize ${bottomTheme.theme} campaigns`,
        "Test combining elements from top themes",
        "Analyze why certain themes resonate better with your audience"
      ]
    }
  }

  detectPerfectCampaignRecipe(): InsightResult {
    const benchmarks = {
      revenue: this.calculatePercentile(this.campaigns.map(c => c.revenue), 80),
      openRate: this.calculatePercentile(this.campaigns.map(c => c.openRate), 80),
      clickRate: this.calculatePercentile(this.campaigns.map(c => c.clickRate), 80),
      unsubscribeRate: this.calculatePercentile(this.campaigns.map(c => c.unsubscribeRate), 20), // Lower is better
      spamRate: this.calculatePercentile(this.campaigns.map(c => c.spamRate), 20) // Lower is better
    }

    const perfectCampaigns = this.campaigns.filter(campaign => 
      campaign.revenue >= benchmarks.revenue &&
      campaign.openRate >= benchmarks.openRate &&
      campaign.clickRate >= benchmarks.clickRate &&
      campaign.unsubscribeRate <= benchmarks.unsubscribeRate &&
      campaign.spamRate <= benchmarks.spamRate
    )

    const commonPatterns = this.analyzeCommonPatterns(perfectCampaigns)

    return {
      insightId: "perfect-campaign-recipe",
      title: "Perfect Campaign Recipe Analysis",
      category: "best-practices",
      data: {
        perfectCampaigns: perfectCampaigns.length,
        totalCampaigns: this.campaigns.length,
        successRate: (perfectCampaigns.length / this.campaigns.length * 100).toFixed(1),
        benchmarks,
        patterns: commonPatterns,
        examples: perfectCampaigns.slice(0, 3).map(c => ({
          subject: c.subject,
          revenue: c.revenue,
          openRate: c.openRate,
          clickRate: c.clickRate
        }))
      },
      significance: perfectCampaigns.length / this.campaigns.length,
      confidence: perfectCampaigns.length > 5 ? 0.9 : 0.6,
      recommendations: [
        "Replicate patterns found in perfect campaigns",
        `Target metrics: ${(benchmarks.openRate || 0).toFixed(1)}% open rate, ${(benchmarks.clickRate || 0).toFixed(1)}% click rate`,
        "Focus on list health while driving revenue",
        "Use successful campaign elements as templates"
      ]
    }
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  private findOptimalRange(data: any[], lengthKey: string, metricKey: string): { min: number, max: number } {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      min: i * 10,
      max: (i + 1) * 10,
      values: [] as number[]
    }))

    data.forEach(item => {
      const bucketIndex = Math.min(Math.floor(item[lengthKey] / 10), 9)
      buckets[bucketIndex].values.push(item[metricKey])
    })

    const bucketAvgs = buckets.map(bucket => ({
      ...bucket,
      avg: this.calculateAverage(bucket.values)
    })).filter(bucket => bucket.values.length > 0)

    const best = bucketAvgs.length > 0 ? bucketAvgs.reduce((best, current) => 
      current.avg > best.avg ? current : best
    ) : { min: 0, max: 10, values: [], avg: 0 }

    return { min: best.min, max: best.max }
  }

  private identifyConversionIssues(campaign: ProcessedCampaign): string[] {
    const issues: string[] = []
    if (campaign.clickRate > 5 && campaign.totalOrders === 0) {
      issues.push("High click rate suggests landing page issues")
    }
    if (campaign.openRate > 30 && campaign.clickRate < 1) {
      issues.push("Low click rate despite good opens - content/CTA issues")
    }
    return issues
  }

  private categorizeCampaignsByTheme(): Record<string, ProcessedCampaign[]> {
    const themes: Record<string, ProcessedCampaign[]> = {
      'Sale/Discount': [],
      'Product Launch': [],
      'Newsletter': [],
      'Abandoned Cart': [],
      'Holiday/Seasonal': [],
      'Other': []
    }

    this.campaigns.forEach(campaign => {
      const subject = campaign.subject.toLowerCase()
      if (/sale|discount|off|deal|save|promo/.test(subject)) {
        themes['Sale/Discount'].push(campaign)
      } else if (/new|launch|introducing|just arrived/.test(subject)) {
        themes['Product Launch'].push(campaign)
      } else if (/newsletter|update|news|weekly|monthly/.test(subject)) {
        themes['Newsletter'].push(campaign)
      } else if (/cart|forgot|left|complete/.test(subject)) {
        themes['Abandoned Cart'].push(campaign)
      } else if (/holiday|christmas|black friday|cyber monday|valentine|easter/.test(subject)) {
        themes['Holiday/Seasonal'].push(campaign)
      } else {
        themes['Other'].push(campaign)
      }
    })

    return themes
  }

  private analyzeCommonPatterns(campaigns: ProcessedCampaign[]): any {
    if (campaigns.length === 0) return {}

    const patterns = {
      avgSubjectLength: this.calculateAverage(campaigns.map(c => c.subject.length)),
      commonDayOfWeek: this.getMostCommonDayOfWeek(campaigns),
      commonHour: this.getMostCommonHour(campaigns),
      avgEmailsSent: this.calculateAverage(campaigns.map(c => c.emailsSent))
    }

    return patterns
  }

  private getMostCommonDayOfWeek(campaigns: ProcessedCampaign[]): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const daycounts = campaigns.reduce((acc, campaign) => {
      const day = campaign.sentDate.getDay()
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const mostCommonDay = Object.entries(daycounts).length > 0 ? 
      Object.entries(daycounts).reduce((a, b) => daycounts[parseInt(a[0])] > daycounts[parseInt(b[0])] ? a : b)[0] :
      '0'
    return days[parseInt(mostCommonDay)]
  }

  private getMostCommonHour(campaigns: ProcessedCampaign[]): number {
    const hourCounts = campaigns.reduce((acc, campaign) => {
      const hour = campaign.sentDate.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return Object.entries(hourCounts).length > 0 ?
      parseInt(Object.entries(hourCounts).reduce((a, b) => hourCounts[parseInt(a[0])] > hourCounts[parseInt(b[0])] ? a : b)[0]) :
      0
  }
}
