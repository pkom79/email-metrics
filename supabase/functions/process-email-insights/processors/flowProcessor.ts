import type { ProcessedFlowEmail, ProcessedCampaign, InsightResult } from "../../shared/types.ts"

export class FlowProcessor {
  private flows: ProcessedFlowEmail[]
  private campaigns: ProcessedCampaign[]
  private readonly analysisWindow = 90 // days

  constructor(flows: ProcessedFlowEmail[], campaigns: ProcessedCampaign[]) {
    this.flows = this.filterToAnalysisWindow(flows)
    this.campaigns = this.filterCampaignsToAnalysisWindow(campaigns)
  }

  private filterToAnalysisWindow(flows: ProcessedFlowEmail[]): ProcessedFlowEmail[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.analysisWindow)
    return flows.filter(flow => flow.sentDate >= cutoffDate)
  }

  private filterCampaignsToAnalysisWindow(campaigns: ProcessedCampaign[]): ProcessedCampaign[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.analysisWindow)
    return campaigns.filter(campaign => campaign.sentDate >= cutoffDate)
  }

  identifyFlowEmailsToCut(): InsightResult {
    const flowsByName = this.groupFlowsByName()
    const emailsToCut: any[] = []

    Object.entries(flowsByName).forEach(([flowName, emails]) => {
      const sortedEmails = emails.sort((a, b) => this.getEmailPosition(a.emailName) - this.getEmailPosition(b.emailName))
      
      for (let i = 1; i < sortedEmails.length; i++) {
        const currentEmail = sortedEmails[i]
        const previousEmail = sortedEmails[i - 1]
        
        const openRateDrop = ((previousEmail.openRate - currentEmail.openRate) / previousEmail.openRate) * 100
        const clickRateDrop = ((previousEmail.clickRate - currentEmail.clickRate) / previousEmail.clickRate) * 100
        
        if (openRateDrop >= 70 || clickRateDrop >= 70) {
          emailsToCut.push({
            flowName,
            emailName: currentEmail.emailName,
            position: this.getEmailPosition(currentEmail.emailName),
            openRateDrop: openRateDrop.toFixed(1),
            clickRateDrop: clickRateDrop.toFixed(1),
            currentOpenRate: currentEmail.openRate,
            currentClickRate: currentEmail.clickRate,
            potentialSavings: this.calculatePotentialSavings(currentEmail)
          })
        }
      }
    })

    const totalPotentialSavings = emailsToCut.reduce((sum, email) => sum + email.potentialSavings, 0)

    return {
      insightId: "flow-emails-to-cut",
      title: "Flow Emails to Cut Analysis",
      category: "flow-optimization",
      data: {
        emailsToCut,
        totalEmailsAnalyzed: this.flows.length,
        totalFlows: Object.keys(flowsByName).length,
        potentialSavings: totalPotentialSavings
      },
      significance: emailsToCut.length / this.flows.length,
      confidence: this.flows.length > 20 ? 0.8 : 0.6,
      recommendations: [
        `Consider removing ${emailsToCut.length} underperforming flow emails`,
        "Focus on optimizing emails before the drop-off point",
        "Test shorter flow sequences for better engagement",
        `Potential cost savings: $${totalPotentialSavings.toFixed(2)}`
      ]
    }
  }

  analyzeFlowVsCampaignBalance(): InsightResult {
    const flowRevenue = this.flows.reduce((sum, flow) => sum + flow.revenue, 0)
    const campaignRevenue = this.campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
    const totalRevenue = flowRevenue + campaignRevenue

    const flowPercentage = (flowRevenue / totalRevenue) * 100
    const campaignPercentage = (campaignRevenue / totalRevenue) * 100

    const flowRevenuePerEmail = flowRevenue / this.flows.reduce((sum, flow) => sum + flow.emailsSent, 0)
    const campaignRevenuePerEmail = campaignRevenue / this.campaigns.reduce((sum, campaign) => sum + campaign.emailsSent, 0)

    const efficiency = {
      flows: flowRevenuePerEmail,
      campaigns: campaignRevenuePerEmail,
      ratio: flowRevenuePerEmail / campaignRevenuePerEmail
    }

    const recommendation = this.getBalanceRecommendation(flowPercentage, efficiency.ratio)

    return {
      insightId: "flow-vs-campaign-balance",
      title: "Flow vs Campaign Revenue Balance",
      category: "strategy-optimization",
      data: {
        flowRevenue,
        campaignRevenue,
        flowPercentage: flowPercentage.toFixed(1),
        campaignPercentage: campaignPercentage.toFixed(1),
        efficiency,
        totalEmails: {
          flows: this.flows.length,
          campaigns: this.campaigns.length
        }
      },
      significance: Math.abs(50 - flowPercentage) / 50,
      confidence: 0.9,
      recommendations: recommendation
    }
  }

  analyzeFlowPerformanceByPosition(): InsightResult {
    const positionAnalysis: Record<number, any> = {}

    this.flows.forEach(flow => {
      const position = this.getEmailPosition(flow.emailName)
      if (!positionAnalysis[position]) {
        positionAnalysis[position] = {
          position,
          emails: [],
          totalRevenue: 0,
          totalEmailsSent: 0,
          totalOpens: 0,
          totalClicks: 0
        }
      }

      positionAnalysis[position].emails.push(flow)
      positionAnalysis[position].totalRevenue += flow.revenue
      positionAnalysis[position].totalEmailsSent += flow.emailsSent
      positionAnalysis[position].totalOpens += flow.uniqueOpens
      positionAnalysis[position].totalClicks += flow.uniqueClicks
    })

    const positionStats = Object.values(positionAnalysis).map((pos: any) => ({
      position: pos.position,
      emailCount: pos.emails.length,
      avgOpenRate: (pos.totalOpens / pos.totalEmailsSent) * 100,
      avgClickRate: (pos.totalClicks / pos.totalEmailsSent) * 100,
      avgRevenuePerEmail: pos.totalRevenue / pos.totalEmailsSent,
      totalRevenue: pos.totalRevenue
    })).sort((a, b) => a.position - b.position)

    const dropOffPoints = this.identifyDropOffPoints(positionStats)

    return {
      insightId: "flow-performance-by-position",
      title: "Flow Performance by Email Position",
      category: "flow-optimization",
      data: {
        positionStats,
        dropOffPoints,
        totalPositions: positionStats.length
      },
      significance: dropOffPoints.length / positionStats.length,
      confidence: positionStats.length > 3 ? 0.8 : 0.6,
      recommendations: [
        `Email ${positionStats[0]?.position || 1} performs best with ${positionStats[0]?.avgOpenRate.toFixed(1)}% open rate`,
        dropOffPoints.length > 0 ? `Major drop-offs occur at positions: ${dropOffPoints.join(', ')}` : "No major drop-offs detected",
        "Consider optimizing emails at drop-off points",
        "Test different content strategies for later emails in sequence"
      ]
    }
  }

  analyzeDayOfWeekFlowPerformance(): InsightResult {
    // Exclude Email 1 from analysis as requested
    const flowsExcludingFirst = this.flows.filter(flow => this.getEmailPosition(flow.emailName) > 1)
    
    const dayPerformance = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      emails: [] as ProcessedFlowEmail[]
    }))

    flowsExcludingFirst.forEach(flow => {
      const day = flow.sentDate.getDay()
      dayPerformance[day].emails.push(flow)
    })

    const dayStats = dayPerformance.map(day => ({
      dayName: day.dayName,
      emailCount: day.emails.length,
      avgOpenRate: this.calculateAverage(day.emails.map(e => e.openRate)),
      avgClickRate: this.calculateAverage(day.emails.map(e => e.clickRate)),
      avgRevenuePerEmail: this.calculateAverage(day.emails.map(e => e.revenue / e.emailsSent)),
      totalRevenue: day.emails.reduce((sum, e) => sum + e.revenue, 0)
    })).filter(day => day.emailCount > 0)

    const bestDay = dayStats.length > 0 ? dayStats.reduce((best, current) => 
      current.avgRevenuePerEmail > best.avgRevenuePerEmail ? current : best
    ) : { dayName: 'None', emailCount: 0, avgOpenRate: 0, avgClickRate: 0, avgRevenuePerEmail: 0, totalRevenue: 0 }

    const worstDay = dayStats.length > 0 ? dayStats.reduce((worst, current) => 
      current.avgRevenuePerEmail < worst.avgRevenuePerEmail ? current : worst
    ) : { dayName: 'None', emailCount: 0, avgOpenRate: 0, avgClickRate: 0, avgRevenuePerEmail: 0, totalRevenue: 0 }

    return {
      insightId: "day-of-week-flow-performance",
      title: "Day of Week Flow Performance (Excluding Email 1)",
      category: "timing-optimization",
      data: {
        dayStats,
        bestDay: bestDay.dayName,
        worstDay: worstDay.dayName,
        performanceGap: ((bestDay.avgRevenuePerEmail - worstDay.avgRevenuePerEmail) / worstDay.avgRevenuePerEmail * 100).toFixed(1),
        totalEmailsAnalyzed: flowsExcludingFirst.length
      },
      significance: (bestDay.avgRevenuePerEmail - worstDay.avgRevenuePerEmail) / worstDay.avgRevenuePerEmail,
      confidence: flowsExcludingFirst.length > 30 ? 0.8 : 0.6,
      recommendations: [
        `${bestDay.dayName} shows the best flow performance`,
        `Avoid sending flows on ${worstDay.dayName} when possible`,
        "Consider day-of-week scheduling for flow emails",
        `Performance gap of ${((bestDay.avgRevenuePerEmail - worstDay.avgRevenuePerEmail) / worstDay.avgRevenuePerEmail * 100).toFixed(1)}% between best and worst days`
      ]
    }
  }

  analyzeListSizeImpactOnFlows(): InsightResult {
    // Group flows by month and calculate list size approximation
    const monthlyData = this.groupFlowsByMonth()
    
    const monthlyAnalysis = Object.entries(monthlyData).map(([month, flows]) => {
      const avgEmailsSent = this.calculateAverage(flows.map(f => f.emailsSent))
      const avgOpenRate = this.calculateAverage(flows.map(f => f.openRate))
      const avgClickRate = this.calculateAverage(flows.map(f => f.clickRate))
      const avgRevenuePerEmail = this.calculateAverage(flows.map(f => f.revenue / f.emailsSent))
      
      return {
        month,
        estimatedListSize: avgEmailsSent,
        flowCount: flows.length,
        avgOpenRate,
        avgClickRate,
        avgRevenuePerEmail,
        totalRevenue: flows.reduce((sum, f) => sum + f.revenue, 0)
      }
    }).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    const correlation = this.calculateCorrelation(
      monthlyAnalysis.map(m => m.estimatedListSize),
      monthlyAnalysis.map(m => m.avgOpenRate)
    )

    const listGrowthImpact = this.analyzeListGrowthImpact(monthlyAnalysis)

    return {
      insightId: "list-size-impact-on-flows",
      title: "List Size Impact on Flow Performance",
      category: "growth-analysis",
      data: {
        monthlyAnalysis,
        correlation: correlation.toFixed(3),
        listGrowthImpact,
        totalMonthsAnalyzed: monthlyAnalysis.length
      },
      significance: Math.abs(correlation),
      confidence: monthlyAnalysis.length > 3 ? 0.7 : 0.5,
      recommendations: [
        correlation < -0.3 ? "List growth appears to negatively impact flow engagement" : "List growth doesn't significantly hurt flow performance",
        listGrowthImpact.declining ? "Implement better onboarding flows for new subscribers" : "Current flow performance is stable with growth",
        "Monitor engagement quality as list grows",
        "Consider segmenting flows by subscriber tenure"
      ]
    }
  }

  private groupFlowsByName(): Record<string, ProcessedFlowEmail[]> {
    return this.flows.reduce((acc, flow) => {
      if (!acc[flow.flowName]) {
        acc[flow.flowName] = []
      }
      acc[flow.flowName].push(flow)
      return acc
    }, {} as Record<string, ProcessedFlowEmail[]>)
  }

  private getEmailPosition(emailName: string): number {
    const match = emailName.match(/(\d+)/)
    return match ? parseInt(match[1]) : 1
  }

  private calculatePotentialSavings(email: ProcessedFlowEmail): number {
    // Estimate cost savings based on email volume and typical ESP costs
    const costPerEmail = 0.001 // $0.001 per email
    return email.emailsSent * costPerEmail
  }

  private getBalanceRecommendation(flowPercentage: number, efficiencyRatio: number): string[] {
    const recommendations: string[] = []
    
    if (flowPercentage < 30) {
      recommendations.push("Flows are underperforming - focus on flow optimization")
    } else if (flowPercentage > 70) {
      recommendations.push("Over-reliance on flows - increase campaign frequency")
    } else {
      recommendations.push("Good balance between flows and campaigns")
    }

    if (efficiencyRatio > 1.5) {
      recommendations.push("Flows are much more efficient - invest more in flow development")
    } else if (efficiencyRatio < 0.7) {
      recommendations.push("Campaigns are more efficient - optimize flows or increase campaign volume")
    }

    return recommendations
  }

  private identifyDropOffPoints(positionStats: any[]): number[] {
    const dropOffs: number[] = []
    for (let i = 1; i < positionStats.length; i++) {
      const current = positionStats[i]
      const previous = positionStats[i - 1]
      
      const openRateDrop = ((previous.avgOpenRate - current.avgOpenRate) / previous.avgOpenRate) * 100
      if (openRateDrop > 50) {
        dropOffs.push(current.position)
      }
    }
    return dropOffs
  }

  private groupFlowsByMonth(): Record<string, ProcessedFlowEmail[]> {
    return this.flows.reduce((acc, flow) => {
      const monthKey = flow.sentDate.toISOString().substring(0, 7) // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(flow)
      return acc
    }, {} as Record<string, ProcessedFlowEmail[]>)
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private analyzeListGrowthImpact(monthlyData: any[]): any {
    if (monthlyData.length < 2) return { declining: false, trend: 'insufficient data' }
    
    const first = monthlyData[0]
    const last = monthlyData[monthlyData.length - 1]
    
    const listGrowth = (last.estimatedListSize - first.estimatedListSize) / first.estimatedListSize
    const engagementChange = (last.avgOpenRate - first.avgOpenRate) / first.avgOpenRate
    
    return {
      declining: engagementChange < -0.1 && listGrowth > 0.2,
      listGrowthRate: (listGrowth * 100).toFixed(1),
      engagementChange: (engagementChange * 100).toFixed(1),
      trend: engagementChange < -0.1 ? 'declining' : engagementChange > 0.1 ? 'improving' : 'stable'
    }
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }
}
