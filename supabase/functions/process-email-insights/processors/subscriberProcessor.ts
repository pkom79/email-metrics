import type { ProcessedSubscriber, ProcessedCampaign, ProcessedFlowEmail, InsightResult } from "../../shared/types.ts"

export class SubscriberProcessor {
  private subscribers: ProcessedSubscriber[]
  private campaigns: ProcessedCampaign[]
  private flows: ProcessedFlowEmail[]
  private readonly analysisWindow = 90 // days

  constructor(subscribers: ProcessedSubscriber[], campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[]) {
    this.subscribers = subscribers
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

  detectSubscriberDecay(): InsightResult {
    const cohorts = this.createSubscriberCohorts()
    const decayAnalysis = this.analyzeCohortDecay(cohorts)
    
    const avgDecayRate = this.calculateAverage(decayAnalysis.map(c => c.decayRate))
    const criticalCohorts = decayAnalysis.filter(c => c.decayRate > 50)
    
    return {
      insightId: "subscriber-decay",
      title: "Subscriber Engagement Decay Analysis",
      category: "subscriber-health",
      data: {
        cohorts: decayAnalysis,
        avgDecayRate: avgDecayRate.toFixed(1),
        criticalCohorts: criticalCohorts.length,
        totalCohorts: decayAnalysis.length,
        worstDecay: Math.max(...decayAnalysis.map(c => c.decayRate))
      },
      significance: avgDecayRate / 100,
      confidence: decayAnalysis.length > 6 ? 0.8 : 0.6,
      recommendations: [
        avgDecayRate > 40 ? "High decay rate detected - implement re-engagement campaigns" : "Decay rate within acceptable range",
        `${criticalCohorts.length} cohorts show critical decay (>50%)`,
        "Focus on improving onboarding for new subscribers",
        "Consider win-back campaigns for older cohorts"
      ]
    }
  }

  analyzeSubscriberLifecycle(): InsightResult {
    const ageGroups = this.createAgeGroups()
    const deadWeightAnalysis = this.calculateDeadWeight()
    
    const lifecycleStats = Object.entries(ageGroups).map(([ageGroup, subscribers]) => ({
      ageGroup,
      count: subscribers.length,
      avgRevenue: this.calculateAverage(subscribers.map(s => s.totalRevenue)),
      avgOrders: this.calculateAverage(subscribers.map(s => s.totalOrders)),
      avgAOV: this.calculateAverage(subscribers.map(s => s.averageOrderValue)),
      revenueContribution: subscribers.reduce((sum, s) => sum + s.totalRevenue, 0),
      revenueShare: 0 // Will be calculated below
    }))

    const totalRevenue = lifecycleStats.reduce((sum, group) => sum + group.revenueContribution, 0)
    
    lifecycleStats.forEach(group => {
      group.revenueShare = ((group.revenueContribution / totalRevenue) * 100)
    })

    const mostValuable = lifecycleStats.reduce((best, current) => 
      current.avgRevenue > best.avgRevenue ? current : best
    )

    return {
      insightId: "subscriber-lifecycle",
      title: "Subscriber Lifecycle Analysis",
      category: "subscriber-segmentation",
      data: {
        lifecycleStats,
        deadWeight: deadWeightAnalysis,
        mostValuableSegment: mostValuable.ageGroup,
        totalSubscribers: this.subscribers.length
      },
      significance: deadWeightAnalysis.percentage / 100,
      confidence: 0.9,
      recommendations: [
        `${mostValuable.ageGroup} subscribers are most valuable`,
        `${deadWeightAnalysis.percentage.toFixed(1)}% of subscribers contribute minimal revenue`,
        deadWeightAnalysis.percentage > 30 ? "Consider re-engagement or list cleaning" : "List health is good",
        "Focus acquisition efforts on segments similar to top performers"
      ]
    }
  }

  analyzeHighValueEngagement(): InsightResult {
    const sortedByRevenue = [...this.subscribers].sort((a, b) => b.totalRevenue - a.totalRevenue)
    const top20Percent = sortedByRevenue.slice(0, Math.floor(sortedByRevenue.length * 0.2))
    const bottom80Percent = sortedByRevenue.slice(Math.floor(sortedByRevenue.length * 0.2))
    
    // Calculate engagement metrics for each group
    const top20Stats = this.calculateEngagementStats(top20Percent)
    const bottom80Stats = this.calculateEngagementStats(bottom80Percent)
    
    const engagementGap = {
      revenueGap: ((top20Stats.avgRevenue - bottom80Stats.avgRevenue) / bottom80Stats.avgRevenue) * 100,
      orderGap: ((top20Stats.avgOrders - bottom80Stats.avgOrders) / bottom80Stats.avgOrders) * 100,
      aovGap: ((top20Stats.avgAOV - bottom80Stats.avgAOV) / bottom80Stats.avgAOV) * 100
    }

    const revenueConcentration = (top20Stats.totalRevenue / (top20Stats.totalRevenue + bottom80Stats.totalRevenue)) * 100

    return {
      insightId: "high-value-engagement",
      title: "Top 20% vs 80% Subscriber Analysis",
      category: "value-segmentation",
      data: {
        top20Stats,
        bottom80Stats,
        engagementGap,
        revenueConcentration: revenueConcentration.toFixed(1),
        totalAnalyzed: this.subscribers.length
      },
      significance: revenueConcentration / 100,
      confidence: this.subscribers.length > 100 ? 0.9 : 0.7,
      recommendations: [
        `Top 20% generate ${revenueConcentration.toFixed(1)}% of revenue`,
        engagementGap.revenueGap > 300 ? "High value concentration - protect top customers" : "Revenue distribution is healthy",
        "Create VIP programs for top 20% segment",
        "Analyze what makes top performers different and replicate"
      ]
    }
  }

  analyzeListGrowthVsQuality(): InsightResult {
    const monthlyGrowth = this.calculateMonthlyGrowth()
    const qualityMetrics = this.calculateQualityMetrics()
    
    const correlation = this.calculateCorrelation(
      monthlyGrowth.map(m => m.growthRate),
      qualityMetrics.map(m => m.avgEngagement)
    )

    const growthQualityTrend = this.analyzeGrowthQualityTrend(monthlyGrowth, qualityMetrics)

    return {
      insightId: "list-growth-vs-quality",
      title: "List Growth vs Quality Analysis",
      category: "growth-analysis",
      data: {
        monthlyGrowth,
        qualityMetrics,
        correlation: correlation.toFixed(3),
        growthQualityTrend,
        totalMonthsAnalyzed: monthlyGrowth.length
      },
      significance: Math.abs(correlation),
      confidence: monthlyGrowth.length > 6 ? 0.8 : 0.6,
      recommendations: [
        correlation < -0.5 ? "Fast growth is hurting engagement quality" : "Growth quality is maintained",
        growthQualityTrend.declining ? "Implement stricter signup validation" : "Current growth strategy is healthy",
        "Monitor engagement rates during growth periods",
        "Focus on quality over quantity in acquisition"
      ]
    }
  }

  analyzeNewSubscriberEngagement(): InsightResult {
    const recentSubscribers = this.getRecentSubscribers(30) // Last 30 days
    const olderSubscribers = this.getOlderSubscribers(30)
    
    const newSubscriberEngagement = this.calculateEngagementForGroup(recentSubscribers)
    const establishedEngagement = this.calculateEngagementForGroup(olderSubscribers)
    
    const engagementComparison = {
      newAvgRevenue: newSubscriberEngagement.avgRevenue,
      establishedAvgRevenue: establishedEngagement.avgRevenue,
      revenueDifference: ((newSubscriberEngagement.avgRevenue - establishedEngagement.avgRevenue) / establishedEngagement.avgRevenue) * 100,
      newAvgOrders: newSubscriberEngagement.avgOrders,
      establishedAvgOrders: establishedEngagement.avgOrders
    }

    const onboardingEffectiveness = this.analyzeOnboardingEffectiveness(recentSubscribers)

    return {
      insightId: "new-subscriber-engagement",
      title: "New vs Established Subscriber Engagement",
      category: "onboarding-analysis",
      data: {
        newSubscribers: recentSubscribers.length,
        establishedSubscribers: olderSubscribers.length,
        engagementComparison,
        onboardingEffectiveness,
        analysisWindow: "30 days"
      },
      significance: Math.abs(engagementComparison.revenueDifference) / 100,
      confidence: recentSubscribers.length > 20 ? 0.8 : 0.6,
      recommendations: [
        engagementComparison.revenueDifference < -20 ? "New subscribers significantly underperform" : "New subscriber engagement is healthy",
        onboardingEffectiveness.needsImprovement ? "Improve onboarding sequence" : "Onboarding is effective",
        "Track new subscriber journey more closely",
        "Consider extended onboarding for better engagement"
      ]
    }
  }

  private createSubscriberCohorts(): Record<string, ProcessedSubscriber[]> {
    const cohorts: Record<string, ProcessedSubscriber[]> = {}
    
    this.subscribers.forEach(subscriber => {
      const cohortKey = subscriber.subscriptionDate.toISOString().substring(0, 7) // YYYY-MM
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = []
      }
      cohorts[cohortKey].push(subscriber)
    })

    return cohorts
  }

  private analyzeCohortDecay(cohorts: Record<string, ProcessedSubscriber[]>): any[] {
    return Object.entries(cohorts).map(([month, subscribers]) => {
      const activeSubscribers = subscribers.filter(s => s.totalOrders > 0 || s.totalRevenue > 0)
      const inactiveSubscribers = subscribers.filter(s => s.totalOrders === 0 && s.totalRevenue === 0)
      
      const decayRate = (inactiveSubscribers.length / subscribers.length) * 100
      
      return {
        month,
        totalSubscribers: subscribers.length,
        activeSubscribers: activeSubscribers.length,
        inactiveSubscribers: inactiveSubscribers.length,
        decayRate: decayRate
      }
    }).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  private createAgeGroups(): Record<string, ProcessedSubscriber[]> {
    const now = new Date()
    const groups: Record<string, ProcessedSubscriber[]> = {
      '0-30 days': [],
      '31-90 days': [],
      '91-180 days': [],
      '181-365 days': [],
      '1+ years': []
    }

    this.subscribers.forEach(subscriber => {
      const daysSinceSignup = Math.floor((now.getTime() - subscriber.subscriptionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceSignup <= 30) {
        groups['0-30 days'].push(subscriber)
      } else if (daysSinceSignup <= 90) {
        groups['31-90 days'].push(subscriber)
      } else if (daysSinceSignup <= 180) {
        groups['91-180 days'].push(subscriber)
      } else if (daysSinceSignup <= 365) {
        groups['181-365 days'].push(subscriber)
      } else {
        groups['1+ years'].push(subscriber)
      }
    })

    return groups
  }

  private calculateDeadWeight(): any {
    const deadWeightSubscribers = this.subscribers.filter(s => s.totalRevenue === 0 && s.totalOrders === 0)
    const percentage = (deadWeightSubscribers.length / this.subscribers.length) * 100
    
    return {
      count: deadWeightSubscribers.length,
      percentage,
      totalSubscribers: this.subscribers.length
    }
  }

  private calculateEngagementStats(subscribers: ProcessedSubscriber[]): any {
    return {
      count: subscribers.length,
      avgRevenue: this.calculateAverage(subscribers.map(s => s.totalRevenue)),
      avgOrders: this.calculateAverage(subscribers.map(s => s.totalOrders)),
      avgAOV: this.calculateAverage(subscribers.map(s => s.averageOrderValue)),
      totalRevenue: subscribers.reduce((sum, s) => sum + s.totalRevenue, 0)
    }
  }

  private calculateMonthlyGrowth(): any[] {
    const monthlySignups: Record<string, number> = {}
    
    this.subscribers.forEach(subscriber => {
      const monthKey = subscriber.subscriptionDate.toISOString().substring(0, 7)
      monthlySignups[monthKey] = (monthlySignups[monthKey] || 0) + 1
    })

    const sortedMonths = Object.entries(monthlySignups).sort((a, b) => a[0].localeCompare(b[0]))
    
    return sortedMonths.map(([month, signups], index) => {
      const growthRate = index > 0 ? ((signups - sortedMonths[index - 1][1]) / sortedMonths[index - 1][1]) * 100 : 0
      return {
        month,
        signups,
        growthRate
      }
    })
  }

  private calculateQualityMetrics(): any[] {
    const monthlyQuality: Record<string, any> = {}
    
    this.subscribers.forEach(subscriber => {
      const monthKey = subscriber.subscriptionDate.toISOString().substring(0, 7)
      if (!monthlyQuality[monthKey]) {
        monthlyQuality[monthKey] = {
          subscribers: [],
          totalRevenue: 0,
          totalOrders: 0
        }
      }
      monthlyQuality[monthKey].subscribers.push(subscriber)
      monthlyQuality[monthKey].totalRevenue += subscriber.totalRevenue
      monthlyQuality[monthKey].totalOrders += subscriber.totalOrders
    })

    return Object.entries(monthlyQuality).map(([month, data]) => ({
      month,
      avgEngagement: data.totalRevenue / data.subscribers.length,
      avgOrders: data.totalOrders / data.subscribers.length,
      subscriberCount: data.subscribers.length
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  private analyzeGrowthQualityTrend(growth: any[], quality: any[]): any {
    if (growth.length < 3) return { declining: false, trend: 'insufficient data' }
    
    const recentGrowth = growth.slice(-3)
    const recentQuality = quality.slice(-3)
    
    const avgGrowth = this.calculateAverage(recentGrowth.map(g => g.growthRate))
    const avgQuality = this.calculateAverage(recentQuality.map(q => q.avgEngagement))
    
    return {
      declining: avgGrowth > 20 && avgQuality < quality[0].avgEngagement * 0.8,
      avgRecentGrowth: avgGrowth.toFixed(1),
      qualityTrend: avgQuality > quality[0].avgEngagement ? 'improving' : 'declining'
    }
  }

  private getRecentSubscribers(days: number): ProcessedSubscriber[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    return this.subscribers.filter(s => s.subscriptionDate >= cutoffDate)
  }

  private getOlderSubscribers(days: number): ProcessedSubscriber[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    return this.subscribers.filter(s => s.subscriptionDate < cutoffDate)
  }

  private calculateEngagementForGroup(subscribers: ProcessedSubscriber[]): any {
    return {
      avgRevenue: this.calculateAverage(subscribers.map(s => s.totalRevenue)),
      avgOrders: this.calculateAverage(subscribers.map(s => s.totalOrders)),
      avgAOV: this.calculateAverage(subscribers.map(s => s.averageOrderValue)),
      totalRevenue: subscribers.reduce((sum, s) => sum + s.totalRevenue, 0)
    }
  }

  private analyzeOnboardingEffectiveness(newSubscribers: ProcessedSubscriber[]): any {
    const purchasers = newSubscribers.filter(s => s.totalOrders > 0)
    const conversionRate = (purchasers.length / newSubscribers.length) * 100
    
    return {
      conversionRate: conversionRate.toFixed(1),
      needsImprovement: conversionRate < 10,
      avgTimeToFirstPurchase: this.calculateAvgTimeToFirstPurchase(purchasers)
    }
  }

  private calculateAvgTimeToFirstPurchase(purchasers: ProcessedSubscriber[]): number {
    const timesToPurchase = purchasers
      .filter(s => s.lastOrderDate)
      .map(s => Math.floor((s.lastOrderDate!.getTime() - s.subscriptionDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    return this.calculateAverage(timesToPurchase)
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0
    
    const xSlice = x.slice(0, n)
    const ySlice = y.slice(0, n)
    
    const sumX = xSlice.reduce((a, b) => a + b, 0)
    const sumY = ySlice.reduce((a, b) => a + b, 0)
    const sumXY = xSlice.reduce((sum, xi, i) => sum + xi * ySlice[i], 0)
    const sumX2 = xSlice.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = ySlice.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }
}
