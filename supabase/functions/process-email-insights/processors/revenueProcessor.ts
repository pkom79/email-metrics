import type { ProcessedCampaign, ProcessedFlowEmail, InsightResult } from "../../shared/types.ts"

export class RevenueProcessor {
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

  findMoneyMakingTimeWindows(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const timeWindows = this.analyzeTimeWindows(allEmails)
    
    const dayHourAnalysis = this.createDayHourMatrix(allEmails)
    const bestTimeWindows = this.findBestTimeWindows(dayHourAnalysis)
    const worstTimeWindows = this.findWorstTimeWindows(dayHourAnalysis)

    return {
      insightId: "money-making-time-windows",
      title: "Optimal Revenue Time Windows",
      category: "timing-optimization",
      data: {
        timeWindows,
        bestWindows: bestTimeWindows.slice(0, 5),
        worstWindows: worstTimeWindows.slice(0, 5),
        totalAnalyzed: allEmails.length,
        revenueByHour: this.aggregateRevenueByHour(allEmails),
        revenueByDay: this.aggregateRevenueByDay(allEmails)
      },
      significance: this.calculateTimeWindowSignificance(bestTimeWindows, worstTimeWindows),
      confidence: allEmails.length > 30 ? 0.9 : 0.7,
      recommendations: [
        `Best time window: ${bestTimeWindows[0]?.window} with $${bestTimeWindows[0]?.avgRevenue.toFixed(2)} avg revenue`,
        `Avoid sending during: ${worstTimeWindows[0]?.window}`,
        "Schedule important campaigns during peak windows",
        "Test different send times to confirm patterns"
      ]
    }
  }

  analyzeRevenueConcentration(): InsightResult {
    const totalRevenue = this.campaigns.reduce((sum, c) => sum + c.revenue, 0)
    const sortedByRevenue = [...this.campaigns].sort((a, b) => b.revenue - a.revenue)
    
    const top10Percent = Math.ceil(this.campaigns.length * 0.1)
    const top20Percent = Math.ceil(this.campaigns.length * 0.2)
    
    const top10Revenue = sortedByRevenue.slice(0, top10Percent).reduce((sum, c) => sum + c.revenue, 0)
    const top20Revenue = sortedByRevenue.slice(0, top20Percent).reduce((sum, c) => sum + c.revenue, 0)
    
    const concentration = {
      top10Percent: (top10Revenue / totalRevenue) * 100,
      top20Percent: (top20Revenue / totalRevenue) * 100,
      giniCoefficient: this.calculateGiniCoefficient(this.campaigns.map(c => c.revenue))
    }

    const riskAssessment = this.assessConcentrationRisk(concentration)

    return {
      insightId: "revenue-concentration",
      title: "Revenue Concentration Analysis",
      category: "risk-analysis",
      data: {
        concentration,
        riskLevel: riskAssessment.level,
        totalCampaigns: this.campaigns.length,
        top10Campaigns: sortedByRevenue.slice(0, top10Percent).map(c => ({
          subject: c.subject,
          revenue: c.revenue,
          revenueShare: ((c.revenue / totalRevenue) * 100).toFixed(1)
        })),
        diversificationScore: riskAssessment.diversificationScore
      },
      significance: concentration.giniCoefficient,
      confidence: this.campaigns.length > 20 ? 0.9 : 0.7,
      recommendations: [
        riskAssessment.level === 'high' ? "Revenue is highly concentrated - diversify campaign types" : "Revenue distribution is healthy",
        concentration.top10Percent > 50 ? "Top 10% campaigns generate too much revenue - reduce dependency" : "Good revenue diversification",
        "Analyze what makes top campaigns successful and replicate",
        "Build more consistent performers to reduce concentration risk"
      ]
    }
  }

  analyzeRevenuePerEmailTrend(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const monthlyEfficiency = this.calculateMonthlyEfficiency(allEmails)
    
    const efficiencyTrend = this.calculateTrend(monthlyEfficiency.map(m => m.revenuePerEmail))
    const currentEfficiency = monthlyEfficiency[monthlyEfficiency.length - 1]?.revenuePerEmail || 0
    const historicalAvg = this.calculateAverage(monthlyEfficiency.map(m => m.revenuePerEmail))

    const trendAnalysis = {
      direction: efficiencyTrend > 0 ? 'improving' : efficiencyTrend < 0 ? 'declining' : 'stable',
      rate: Math.abs(efficiencyTrend),
      currentVsHistorical: ((currentEfficiency - historicalAvg) / historicalAvg) * 100
    }

    return {
      insightId: "revenue-per-email-trend",
      title: "Email Efficiency Trend Analysis",
      category: "efficiency-analysis",
      data: {
        monthlyData: monthlyEfficiency,
        trendAnalysis,
        currentEfficiency: currentEfficiency.toFixed(4),
        historicalAverage: historicalAvg.toFixed(4),
        bestMonth: monthlyEfficiency.length > 0 ? monthlyEfficiency.reduce((best, current) => 
          current.revenuePerEmail > best.revenuePerEmail ? current : best
        ) : { month: 'None', revenuePerEmail: 0, totalRevenue: 0, emailsSent: 0 },
        worstMonth: monthlyEfficiency.length > 0 ? monthlyEfficiency.reduce((worst, current) => 
          current.revenuePerEmail < worst.revenuePerEmail ? current : worst
        ) : { month: 'None', revenuePerEmail: 0, totalRevenue: 0, emailsSent: 0 }
      },
      significance: Math.abs(efficiencyTrend),
      confidence: monthlyEfficiency.length > 3 ? 0.8 : 0.6,
      recommendations: [
        trendAnalysis.direction === 'declining' ? "Email efficiency is declining - optimize content and targeting" : "Email efficiency is stable or improving",
        currentEfficiency > historicalAvg ? "Current performance above historical average" : "Current performance below historical average",
        "Focus on improving revenue per email through better segmentation",
        "Analyze high-performing months for optimization insights"
      ]
    }
  }

  analyzeDayOfWeekReliability(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const dayAnalysis = this.analyzeDayReliability(allEmails)
    
    const reliabilityScores = dayAnalysis.map(day => ({
      day: day.dayName,
      avgRevenue: day.avgRevenue,
      consistency: day.consistency,
      reliabilityScore: day.avgRevenue * (1 - day.variability), // Higher revenue, lower variability = more reliable
      emailCount: day.emailCount
    }))

    const mostReliable = reliabilityScores.length > 0 ? reliabilityScores.reduce((best, current) => 
      current.reliabilityScore > best.reliabilityScore ? current : best
    ) : { day: 'None', avgRevenue: 0, consistency: 0, reliabilityScore: 0, emailCount: 0 }

    const leastReliable = reliabilityScores.length > 0 ? reliabilityScores.reduce((worst, current) => 
      current.reliabilityScore < worst.reliabilityScore ? current : worst
    ) : { day: 'None', avgRevenue: 0, consistency: 0, reliabilityScore: 0, emailCount: 0 }

    return {
      insightId: "day-of-week-reliability",
      title: "Day of Week Revenue Reliability",
      category: "timing-consistency",
      data: {
        dayAnalysis: reliabilityScores,
        mostReliable: mostReliable.day,
        leastReliable: leastReliable.day,
        reliabilityGap: ((mostReliable.reliabilityScore - leastReliable.reliabilityScore) / leastReliable.reliabilityScore * 100).toFixed(1),
        totalEmailsAnalyzed: allEmails.length
      },
      significance: (mostReliable.reliabilityScore - leastReliable.reliabilityScore) / leastReliable.reliabilityScore,
      confidence: allEmails.length > 40 ? 0.8 : 0.6,
      recommendations: [
        `${mostReliable.day} is your most reliable day for revenue`,
        `Avoid ${leastReliable.day} for important campaigns due to high variability`,
        "Schedule consistent campaigns on reliable days",
        "Test performance improvements on variable days"
      ]
    }
  }

  analyzeRevenueClusteringByTime(): InsightResult {
    const allEmails = [...this.campaigns, ...this.flows]
    const timeClusters = this.identifyTimeClusters(allEmails)
    const clusterAnalysis = this.analyzeClusterPerformance(timeClusters)

    return {
      insightId: "revenue-clustering-by-time",
      title: "Revenue Clustering by Time Analysis",
      category: "timing-patterns",
      data: {
        clusters: clusterAnalysis,
        totalClusters: clusterAnalysis.length,
        bestCluster: clusterAnalysis.length > 0 ? clusterAnalysis.reduce((best, current) => 
          current.avgRevenue > best.avgRevenue ? current : best
        ) : { timeCluster: 'None', avgRevenue: 0, emailCount: 0, consistency: 0 },
        consistentClusters: clusterAnalysis.filter(c => c.consistency > 0.7),
        totalEmailsAnalyzed: allEmails.length
      },
      significance: this.calculateClusterSignificance(clusterAnalysis),
      confidence: allEmails.length > 50 ? 0.8 : 0.6,
      recommendations: [
        "Focus on time clusters with highest average revenue",
        "Maintain consistency in high-performing time windows",
        "Investigate underperforming time clusters for optimization",
        "Use cluster insights for campaign scheduling"
      ]
    }
  }

  analyzeCampaignPerformanceBySize(): InsightResult {
    const sizeBuckets = this.createSizeBuckets(this.campaigns)
    const performanceBySize = this.analyzePerformanceBySize(sizeBuckets)
    
    const optimalSize = performanceBySize.length > 0 ? performanceBySize.reduce((best, current) => 
      current.revenuePerEmail > best.revenuePerEmail ? current : best
    ) : { sizeRange: 'None', revenuePerEmail: 0, campaignCount: 0, avgOpenRate: 0, avgClickRate: 0 }

    const sizeEfficiencyTrend = this.calculateSizeEfficiencyTrend(performanceBySize)

    return {
      insightId: "campaign-performance-by-size",
      title: "Campaign Performance by List Size",
      category: "size-optimization",
      data: {
        sizeBuckets: performanceBySize,
        optimalSize: optimalSize.sizeRange,
        sizeEfficiencyTrend,
        totalCampaigns: this.campaigns.length,
        listSizeDistribution: this.calculateListSizeDistribution()
      },
      significance: this.calculateSizeSignificance(performanceBySize),
      confidence: this.campaigns.length > 25 ? 0.8 : 0.6,
      recommendations: [
        `${optimalSize.sizeRange} sends show best revenue per email`,
        sizeEfficiencyTrend === 'declining' ? "Larger lists show declining efficiency" : "List size efficiency is maintained",
        "Consider segmentation for large lists",
        "Optimize targeting for different list sizes"
      ]
    }
  }

  analyzeClickToPurchaseDropoff(): InsightResult {
    const dropoffAnalysis = this.campaigns.map(campaign => {
      const clickToPurchaseRate = campaign.totalOrders > 0 ? 
        (campaign.totalOrders / (campaign.uniqueClicks || 1)) * 100 : 0
      
      return {
        campaign,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        clickToPurchaseRate,
        dropoffRate: 100 - clickToPurchaseRate,
        potentialRevenueLoss: this.calculatePotentialRevenueLoss(campaign)
      }
    })

    const highDropoffCampaigns = dropoffAnalysis.filter(d => 
      d.clickRate > 2 && d.clickToPurchaseRate < 10
    )

    const avgDropoffRate = this.calculateAverage(dropoffAnalysis.map(d => d.dropoffRate))
    const totalPotentialLoss = dropoffAnalysis.reduce((sum, d) => sum + d.potentialRevenueLoss, 0)

    return {
      insightId: "click-to-purchase-dropoff",
      title: "Click to Purchase Dropoff Analysis",
      category: "conversion-optimization",
      data: {
        avgDropoffRate: avgDropoffRate.toFixed(1),
        highDropoffCampaigns: highDropoffCampaigns.length,
        examples: highDropoffCampaigns.slice(0, 5).map(d => ({
          subject: d.campaign.subject,
          clickRate: d.clickRate.toFixed(2),
          dropoffRate: d.dropoffRate.toFixed(1),
          potentialLoss: d.potentialRevenueLoss.toFixed(2)
        })),
        totalPotentialLoss: totalPotentialLoss.toFixed(2),
        campaignsAnalyzed: this.campaigns.length
      },
      significance: highDropoffCampaigns.length / this.campaigns.length,
      confidence: this.campaigns.length > 15 ? 0.8 : 0.6,
      recommendations: [
        `${highDropoffCampaigns.length} campaigns show high click-to-purchase dropoff`,
        avgDropoffRate > 80 ? "High overall dropoff rate - optimize landing pages" : "Dropoff rates are reasonable",
        "Review checkout process and landing page experience",
        `Potential revenue recovery: $${totalPotentialLoss.toFixed(2)}`
      ]
    }
  }

  private analyzeTimeWindows(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const windows: Record<string, any> = {}
    
    emails.forEach(email => {
      const hour = email.sentDate.getHours()
      const day = email.sentDate.getDay()
      const windowKey = `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]} ${hour}:00`
      
      if (!windows[windowKey]) {
        windows[windowKey] = {
          window: windowKey,
          emails: [],
          totalRevenue: 0,
          totalEmailsSent: 0
        }
      }
      
      windows[windowKey].emails.push(email)
      windows[windowKey].totalRevenue += email.revenue
      windows[windowKey].totalEmailsSent += email.emailsSent
    })

    return Object.values(windows).map((window: any) => ({
      window: window.window,
      emailCount: window.emails.length,
      avgRevenue: window.totalRevenue / window.emails.length,
      revenuePerEmail: window.totalRevenue / window.totalEmailsSent,
      totalRevenue: window.totalRevenue
    }))
  }

  private createDayHourMatrix(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any {
    const matrix: Record<string, any> = {}
    
    emails.forEach(email => {
      const day = email.sentDate.getDay()
      const hour = email.sentDate.getHours()
      const key = `${day}-${hour}`
      
      if (!matrix[key]) {
        matrix[key] = {
          day,
          hour,
          emails: [],
          totalRevenue: 0
        }
      }
      
      matrix[key].emails.push(email)
      matrix[key].totalRevenue += email.revenue
    })

    return matrix
  }

  private findBestTimeWindows(matrix: any): any[] {
    return Object.values(matrix)
      .filter((window: any) => window.emails.length > 0)
      .map((window: any) => ({
        window: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][window.day]} ${window.hour}:00`,
        avgRevenue: window.totalRevenue / window.emails.length,
        emailCount: window.emails.length
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
  }

  private findWorstTimeWindows(matrix: any): any[] {
    return Object.values(matrix)
      .filter((window: any) => window.emails.length > 0)
      .map((window: any) => ({
        window: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][window.day]} ${window.hour}:00`,
        avgRevenue: window.totalRevenue / window.emails.length,
        emailCount: window.emails.length
      }))
      .sort((a, b) => a.avgRevenue - b.avgRevenue)
  }

  private aggregateRevenueByHour(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, totalRevenue: 0, emailCount: 0 }))
    
    emails.forEach(email => {
      const hour = email.sentDate.getHours()
      hourlyData[hour].totalRevenue += email.revenue
      hourlyData[hour].emailCount++
    })

    return hourlyData.map(hour => ({
      hour: hour.hour,
      avgRevenue: hour.emailCount > 0 ? hour.totalRevenue / hour.emailCount : 0,
      emailCount: hour.emailCount
    }))
  }

  private aggregateRevenueByDay(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const dailyData = Array.from({ length: 7 }, (_, i) => ({ 
      day: i, 
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      totalRevenue: 0, 
      emailCount: 0 
    }))
    
    emails.forEach(email => {
      const day = email.sentDate.getDay()
      dailyData[day].totalRevenue += email.revenue
      dailyData[day].emailCount++
    })

    return dailyData.map(day => ({
      day: day.dayName,
      avgRevenue: day.emailCount > 0 ? day.totalRevenue / day.emailCount : 0,
      emailCount: day.emailCount
    }))
  }

  private calculateTimeWindowSignificance(best: any[], worst: any[]): number {
    if (best.length === 0 || worst.length === 0) return 0
    return (best[0].avgRevenue - worst[0].avgRevenue) / worst[0].avgRevenue
  }

  private calculateGiniCoefficient(values: number[]): number {
    const sortedValues = [...values].sort((a, b) => a - b)
    const n = sortedValues.length
    const mean = sortedValues.reduce((sum, val) => sum + val, 0) / n
    
    let numerator = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        numerator += Math.abs(sortedValues[i] - sortedValues[j])
      }
    }
    
    return numerator / (2 * n * n * mean)
  }

  private assessConcentrationRisk(concentration: any): any {
    let level = 'low'
    let diversificationScore = 100 - concentration.giniCoefficient * 100
    
    if (concentration.top10Percent > 60 || concentration.giniCoefficient > 0.7) {
      level = 'high'
    } else if (concentration.top10Percent > 40 || concentration.giniCoefficient > 0.5) {
      level = 'medium'
    }
    
    return { level, diversificationScore: diversificationScore.toFixed(1) }
  }

  private calculateMonthlyEfficiency(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const monthlyData: Record<string, any> = {}
    
    emails.forEach(email => {
      const monthKey = email.sentDate.toISOString().substring(0, 7)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalRevenue: 0,
          totalEmailsSent: 0,
          emailCount: 0
        }
      }
      
      monthlyData[monthKey].totalRevenue += email.revenue
      monthlyData[monthKey].totalEmailsSent += email.emailsSent
      monthlyData[monthKey].emailCount++
    })

    return Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      revenuePerEmail: month.totalRevenue / month.totalEmailsSent,
      totalRevenue: month.totalRevenue,
      emailCount: month.emailCount
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  private analyzeDayReliability(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): any[] {
    const dayData = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      revenues: [] as number[]
    }))
    
    emails.forEach(email => {
      const day = email.sentDate.getDay()
      dayData[day].revenues.push(email.revenue)
    })

    return dayData.map(day => {
      const avgRevenue = this.calculateAverage(day.revenues)
      const variance = this.calculateVariance(day.revenues, avgRevenue)
      const standardDeviation = Math.sqrt(variance)
      const variability = avgRevenue > 0 ? standardDeviation / avgRevenue : 0
      
      return {
        dayName: day.dayName,
        avgRevenue,
        variance,
        variability,
        consistency: 1 - variability,
        emailCount: day.revenues.length
      }
    }).filter(day => day.emailCount > 0)
  }

  private identifyTimeClusters(emails: (ProcessedCampaign | ProcessedFlowEmail)[]): Record<string, any[]> {
    // Simple clustering by hour ranges
    const clusters = {
      'Early Morning (6-9 AM)': emails.filter(e => e.sentDate.getHours() >= 6 && e.sentDate.getHours() <= 9),
      'Morning (9 AM-12 PM)': emails.filter(e => e.sentDate.getHours() >= 9 && e.sentDate.getHours() <= 12),
      'Afternoon (12-5 PM)': emails.filter(e => e.sentDate.getHours() >= 12 && e.sentDate.getHours() <= 17),
      'Evening (5-9 PM)': emails.filter(e => e.sentDate.getHours() >= 17 && e.sentDate.getHours() <= 21),
      'Night (9 PM-6 AM)': emails.filter(e => e.sentDate.getHours() >= 21 || e.sentDate.getHours() <= 6)
    }
    
    return clusters
  }

  private analyzeClusterPerformance(clusters: Record<string, any[]>): any[] {
    return Object.entries(clusters).map(([clusterName, emails]) => {
      const revenues = emails.map(e => e.revenue)
      const avgRevenue = this.calculateAverage(revenues)
      const consistency = 1 - (this.calculateStandardDeviation(revenues) / avgRevenue)
      
      return {
        cluster: clusterName,
        emailCount: emails.length,
        avgRevenue,
        consistency: Math.max(0, consistency),
        totalRevenue: revenues.reduce((sum, r) => sum + r, 0)
      }
    }).filter(cluster => cluster.emailCount > 0)
  }

  private createSizeBuckets(campaigns: ProcessedCampaign[]): Record<string, ProcessedCampaign[]> {
    return {
      'Small (0-10k)': campaigns.filter(c => c.emailsSent <= 10000),
      'Medium (10k-50k)': campaigns.filter(c => c.emailsSent > 10000 && c.emailsSent <= 50000),
      'Large (50k-100k)': campaigns.filter(c => c.emailsSent > 50000 && c.emailsSent <= 100000),
      'Very Large (100k+)': campaigns.filter(c => c.emailsSent > 100000)
    }
  }

  private analyzePerformanceBySize(sizeBuckets: Record<string, ProcessedCampaign[]>): any[] {
    return Object.entries(sizeBuckets).map(([sizeRange, campaigns]) => ({
      sizeRange,
      campaignCount: campaigns.length,
      avgRevenue: this.calculateAverage(campaigns.map(c => c.revenue)),
      revenuePerEmail: this.calculateAverage(campaigns.map(c => c.revenue / c.emailsSent)),
      avgOpenRate: this.calculateAverage(campaigns.map(c => c.openRate)),
      avgClickRate: this.calculateAverage(campaigns.map(c => c.clickRate)),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0)
    })).filter(bucket => bucket.campaignCount > 0)
  }

  private calculateSizeEfficiencyTrend(performanceData: any[]): string {
    const efficiencies = performanceData.map(p => p.revenuePerEmail)
    const trend = this.calculateTrend(efficiencies)
    return trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'
  }

  private calculateListSizeDistribution(): any {
    const totalCampaigns = this.campaigns.length
    const sizeBuckets = this.createSizeBuckets(this.campaigns)
    
    return Object.entries(sizeBuckets).map(([size, campaigns]) => ({
      size,
      count: campaigns.length,
      percentage: ((campaigns.length / totalCampaigns) * 100).toFixed(1)
    }))
  }

  private calculatePotentialRevenueLoss(campaign: ProcessedCampaign): number {
    const expectedConversionRate = 0.15 // 15% benchmark
    const actualConversions = campaign.totalOrders
    const potentialConversions = campaign.uniqueClicks * expectedConversionRate
    const lostConversions = Math.max(0, potentialConversions - actualConversions)
    return lostConversions * campaign.revenue / Math.max(1, actualConversions)
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0
    
    const xValues = values.map((_, i) => i)
    const n = values.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0)
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope
  }

  private calculateClusterSignificance(clusters: any[]): number {
    if (clusters.length < 2) return 0
    const revenues = clusters.map(c => c.avgRevenue)
    const max = Math.max(...revenues)
    const min = Math.min(...revenues)
    return (max - min) / min
  }

  private calculateSizeSignificance(performanceData: any[]): number {
    if (performanceData.length < 2) return 0
    const efficiencies = performanceData.map(p => p.revenuePerEmail)
    const max = Math.max(...efficiencies)
    const min = Math.min(...efficiencies)
    return (max - min) / min
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateAverage(values)
    return Math.sqrt(this.calculateVariance(values, mean))
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }
}
