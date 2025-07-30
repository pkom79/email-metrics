import { ProcessedFlowEmail } from '../../dataTypes';
import { InsightResult } from '../types';
import {
  average,
  formatCurrency,
  formatPercent,
  percentageChange,
  groupBy
} from '../calculationHelpers';
import { filterLast90Days, groupByMonth } from '../dateUtils';

// Flow Emails That Should Be Cut
export function analyzeFlowEmailsToCut(flowEmails: ProcessedFlowEmail[]): InsightResult {
  const recentFlows = filterLast90Days(flowEmails);
  
  if (recentFlows.length < 50) {
    return {
      insightId: 'flowEmailsToCut',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough flow email data to identify underperformers'
    };
  }
  
  // Group by flow name and position
  const flowGroups = groupBy(recentFlows, email => email.flowName);
  
  const flowAnalysis = Array.from(flowGroups.entries()).map(([flowName, emails]) => {
    // Group by position within flow
    const positionGroups = groupBy(emails, email => `Email ${email.sequencePosition}`);
    
    // Calculate metrics for each position
    const positions = Array.from(positionGroups.entries())
      .map(([position, posEmails]) => {
        const totalRevenue = posEmails.reduce((sum, e) => sum + e.revenue, 0);
        const totalDelivered = posEmails.reduce((sum, e) => sum + e.emailsSent, 0);
        const avgOpenRate = average(posEmails.map(e => e.openRate));
        const avgClickRate = average(posEmails.map(e => e.clickRate));
        const revenuePerRecipient = totalDelivered > 0 ? totalRevenue / totalDelivered : 0;
        
        return {
          position,
          emailNumber: parseInt(position.replace('Email ', '')),
          count: posEmails.length,
          totalRevenue,
          totalDelivered,
          avgOpenRate,
          avgClickRate,
          revenuePerRecipient,
          emails: posEmails
        };
      })
      .sort((a, b) => a.emailNumber - b.emailNumber);
    
    // Find significant drops between positions
    const dropPoints = [];
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      
      const engagementDrop = prev.avgOpenRate > 0 ? 
        (prev.avgOpenRate - curr.avgOpenRate) / prev.avgOpenRate : 0;
      const revenueDrop = prev.revenuePerRecipient > 0 ?
        (prev.revenuePerRecipient - curr.revenuePerRecipient) / prev.revenuePerRecipient : 0;
      
      if (engagementDrop > 0.7 || revenueDrop > 0.8) {
        dropPoints.push({
          flowName,
          afterPosition: prev.emailNumber,
          engagementDrop,
          revenueDrop,
          currentRevenue: curr.revenuePerRecipient,
          lostEmails: curr.totalDelivered,
          positions: positions
        });
      }
    }
    
    return { flowName, positions, dropPoints };
  });
  
  // Find flows with significant drop points
  const flowsWithDrops = flowAnalysis.filter(f => f.dropPoints.length > 0);
  
  if (flowsWithDrops.length === 0) {
    return {
      insightId: 'flowEmailsToCut',
      hasSignificantFinding: false,
      data: flowAnalysis,
      summary: 'All flow emails performing within acceptable ranges'
    };
  }
  
  // Get the most significant drop
  const allDrops = flowsWithDrops.flatMap(f => f.dropPoints);
  const worstDrop = allDrops.sort((a, b) => b.revenueDrop - a.revenueDrop)[0];
  
  const summary = `${worstDrop.flowName} Email ${worstDrop.afterPosition + 1}: ${formatPercent(worstDrop.engagementDrop)} lower engagement, only ${formatCurrency(worstDrop.currentRevenue)}/recipient`;
  
  const actionsTitle = 'Optimize Your Flow Sequences:';
  const actions = [
    `End ${worstDrop.flowName} after Email ${worstDrop.afterPosition}`,
    `This saves ${worstDrop.lostEmails.toLocaleString()} emails/month with minimal revenue impact`,
    `Test removing low performers: ${allDrops.slice(0, 3).map(d => `${d.flowName} Email ${d.afterPosition + 1}`).join(', ')}`,
    `Reinvest saved sends into better-performing campaigns`
  ];
  
  return {
    insightId: 'flowEmailsToCut',
    hasSignificantFinding: true,
    data: {
      flowsWithDrops,
      allDrops,
      worstDrop
    },
    summary,
    actionsTitle,
    actions
  };
}

// Flow vs Campaign Revenue Balance
export function analyzeFlowVsCampaignBalance(
  flowEmails: ProcessedFlowEmail[],
  campaigns: any[] // ProcessedCampaign[]
): InsightResult {
  const recentFlows = filterLast90Days(flowEmails);
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentFlows.length < 20 || recentCampaigns.length < 10) {
    return {
      insightId: 'flowVsCampaignBalance',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough data to analyze flow vs campaign balance'
    };
  }
  
  // Calculate flow metrics
  const flowRevenue = recentFlows.reduce((sum, f) => sum + f.revenue, 0);
  const flowRecipients = recentFlows.reduce((sum, f) => sum + f.emailsSent, 0);
  const flowRevenuePerEmail = flowRecipients > 0 ? flowRevenue / flowRecipients : 0;
  
  // Calculate campaign metrics
  const campaignRevenue = recentCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const campaignRecipients = recentCampaigns.reduce((sum, c) => sum + c.emailsSent, 0);
  const campaignRevenuePerEmail = campaignRecipients > 0 ? campaignRevenue / campaignRecipients : 0;
  
  // Calculate percentages
  const totalRevenue = flowRevenue + campaignRevenue;
  const flowPercentage = totalRevenue > 0 ? flowRevenue / totalRevenue : 0;
  const campaignPercentage = totalRevenue > 0 ? campaignRevenue / totalRevenue : 0;
  
  // Check if balance is healthy (40-60% is considered healthy)
  const isBalanced = flowPercentage >= 0.4 && flowPercentage <= 0.6;
  
  // Monthly trend
  const monthlyFlows = groupByMonth(recentFlows);
  const monthlyCampaigns = groupByMonth(recentCampaigns);
  
  const monthlyTrend = Array.from(monthlyFlows.keys()).map(month => {
    const flows = monthlyFlows.get(month) || [];
    const campaigns = monthlyCampaigns.get(month) || [];
    const monthFlowRevenue = flows.reduce((sum, f) => sum + f.revenue, 0);
    const monthCampaignRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const monthTotal = monthFlowRevenue + monthCampaignRevenue;
    
    return {
      month,
      flowPercentage: monthTotal > 0 ? monthFlowRevenue / monthTotal : 0,
      flowRevenue: monthFlowRevenue,
      campaignRevenue: monthCampaignRevenue
    };
  });
  
  const summary = `Current split: ${formatPercent(flowPercentage)} flows / ${formatPercent(campaignPercentage)} campaigns`;
  
  const actionsTitle = isBalanced ? 'Maintain Your Healthy Balance:' : 'Rebalance Your Email Strategy:';
  const actions = isBalanced ? [
    `Your ${formatPercent(flowPercentage)}-${formatPercent(campaignPercentage)} split is healthy`,
    `Flows generating ${formatCurrency(flowRevenuePerEmail)}/email vs campaigns ${formatCurrency(campaignRevenuePerEmail)}/email`,
    `Continue monitoring monthly to maintain balance`,
    `Focus on optimizing underperforming ${flowRevenuePerEmail > campaignRevenuePerEmail ? 'campaigns' : 'flows'}`
  ] : flowPercentage < 0.4 ? [
    `Flows only ${formatPercent(flowPercentage)} of revenue - aim for 40-60%`,
    `Flows perform ${percentageChange(campaignRevenuePerEmail, flowRevenuePerEmail)} better per email`,
    `Audit and activate dormant flows immediately`,
    `Potential revenue gain: ${formatCurrency((0.4 - flowPercentage) * totalRevenue)}/month`
  ] : [
    `Flows are ${formatPercent(flowPercentage)} of revenue - may be over-automated`,
    `Review flow triggers to avoid fatigue`,
    `Increase campaign frequency for timely content`,
    `Test pausing lowest-performing flows`
  ];
  
  return {
    insightId: 'flowVsCampaignBalance',
    hasSignificantFinding: !isBalanced || Math.abs(flowRevenuePerEmail - campaignRevenuePerEmail) / campaignRevenuePerEmail > 0.3,
    data: {
      flowMetrics: { revenue: flowRevenue, recipients: flowRecipients, revenuePerEmail: flowRevenuePerEmail },
      campaignMetrics: { revenue: campaignRevenue, recipients: campaignRecipients, revenuePerEmail: campaignRevenuePerEmail },
      split: { flowPercentage, campaignPercentage },
      monthlyTrend,
      isBalanced
    },
    summary,
    actionsTitle,
    actions
  };
}

// Flow Performance by Position
export function analyzeFlowPerformanceByPosition(flowEmails: ProcessedFlowEmail[]): InsightResult {
  const recentFlows = filterLast90Days(flowEmails);
  
  if (recentFlows.length < 100) {
    return {
      insightId: 'flowPerformanceByPosition',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough flow email data to analyze position patterns'
    };
  }
  
  // Group by flow and position
  const flowGroups = groupBy(recentFlows, email => email.flowName);
  
  const positionAnalysis = Array.from(flowGroups.entries()).map(([flowName, emails]) => {
    const positions = groupBy(emails, email => email.sequencePosition.toString());
    
    const positionMetrics = Array.from(positions.entries()).map(([position, posEmails]) => ({
      position: parseInt(position),
      count: posEmails.length,
      avgOpenRate: average(posEmails.map(e => e.openRate)),
      avgClickRate: average(posEmails.map(e => e.clickRate)),
      avgRevenue: average(posEmails.map(e => e.revenue)),
      revenuePerRecipient: average(posEmails.map(e => 
        e.emailsSent > 0 ? e.revenue / e.emailsSent : 0
      ))
    })).sort((a, b) => a.position - b.position);
    
    // Find critical drop points (>30% decrease)
    const dropPoints = [];
    for (let i = 1; i < positionMetrics.length; i++) {
      const prev = positionMetrics[i - 1];
      const curr = positionMetrics[i];
      const openRateDrop = prev.avgOpenRate > 0 ? 
        (prev.avgOpenRate - curr.avgOpenRate) / prev.avgOpenRate : 0;
      
      if (openRateDrop > 0.3) {
        dropPoints.push({
          position: curr.position,
          openRateDrop,
          prevOpenRate: prev.avgOpenRate,
          currOpenRate: curr.avgOpenRate
        });
      }
    }
    
    return {
      flowName,
      emailCount: positionMetrics.length,
      positionMetrics,
      dropPoints,
      optimalLength: dropPoints.length > 0 ? dropPoints[0].position - 1 : positionMetrics.length
    };
  });
  
  // Find flows with multiple emails and drop points
  const multiEmailFlows = positionAnalysis.filter(f => f.emailCount > 1);
  const flowsWithDrops = multiEmailFlows.filter(f => f.dropPoints.length > 0);
  
  if (flowsWithDrops.length === 0) {
    return {
      insightId: 'flowPerformanceByPosition',
      hasSignificantFinding: false,
      data: positionAnalysis,
      summary: 'Flow engagement remains strong across all positions'
    };
  }
  
  const worstFlow = flowsWithDrops.sort((a, b) => 
    b.dropPoints[0].openRateDrop - a.dropPoints[0].openRateDrop
  )[0];
  
  const summary = `${worstFlow.flowName}: Email ${worstFlow.dropPoints[0].position}→${worstFlow.dropPoints[0].position + 1} shows ${formatPercent(worstFlow.dropPoints[0].openRateDrop)} engagement drop`;
  
  const actionsTitle = 'Optimize Flow Length:';
  const actions = [
    `End ${worstFlow.flowName} at Email ${worstFlow.optimalLength}`,
    `Review content quality after position ${worstFlow.optimalLength} in all flows`,
    `Test consolidating later emails into earlier positions`,
    `Monitor: ${flowsWithDrops.map(f => `${f.flowName} (optimal: ${f.optimalLength} emails)`).join(', ')}`
  ];
  
  return {
    insightId: 'flowPerformanceByPosition',
    hasSignificantFinding: true,
    data: {
      allFlows: positionAnalysis,
      flowsWithDrops,
      worstFlow
    },
    summary,
    actionsTitle,
    actions
  };
}

// Day-of-Week Flow Performance (Email 2+)
export function analyzeFlowDayOfWeekPerformance(flowEmails: ProcessedFlowEmail[]): InsightResult {
  // Filter to email position 2+ only
  const recentFlows = filterLast90Days(flowEmails).filter(email => email.sequencePosition >= 2);
  
  if (recentFlows.length < 50) {
    return {
      insightId: 'dayOfWeekFlowPerformance',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough flow email data (position 2+) to analyze day patterns'
    };
  }
  
  // Group by day of week
  const dayGroups = new Map<string, ProcessedFlowEmail[]>();
  
  recentFlows.forEach(email => {
    const dayName = email.sentDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayGroups.has(dayName)) {
      dayGroups.set(dayName, []);
    }
    dayGroups.get(dayName)!.push(email);
  });
  
  // Calculate metrics for each day
  const dayMetrics = Array.from(dayGroups.entries()).map(([day, emails]) => {
    const totalRevenue = emails.reduce((sum, e) => sum + e.revenue, 0);
    const totalDelivered = emails.reduce((sum, e) => sum + e.emailsSent, 0);
    
    return {
      day,
      count: emails.length,
      avgOpenRate: average(emails.map(e => e.openRate)),
      avgClickRate: average(emails.map(e => e.clickRate)),
      revenuePerRecipient: totalDelivered > 0 ? totalRevenue / totalDelivered : 0,
      totalRevenue
    };
  }).filter(d => d.count >= 5); // Need enough data per day
  
  if (dayMetrics.length < 3) {
    return {
      insightId: 'dayOfWeekFlowPerformance',
      hasSignificantFinding: false,
      data: dayMetrics,
      summary: 'Not enough data across different days for flow analysis'
    };
  }
  
  // Sort by revenue per recipient
  const sortedDays = [...dayMetrics].sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];
  
  const performanceGap = bestDay.revenuePerRecipient > 0 ? 
    (bestDay.revenuePerRecipient - worstDay.revenuePerRecipient) / worstDay.revenuePerRecipient : 0;
  
  if (performanceGap < 0.2) {
    return {
      insightId: 'dayOfWeekFlowPerformance',
      hasSignificantFinding: false,
      data: sortedDays,
      summary: 'Flow performance consistent across all days'
    };
  }
  
  const summary = `${bestDay.day}: ${formatCurrency(bestDay.revenuePerRecipient)}/recipient (${percentageChange(worstDay.revenuePerRecipient, bestDay.revenuePerRecipient)} vs ${worstDay.day})`;
  
  const actionsTitle = 'Optimize Flow Timing:';
  const actions = [
    `Adjust flow delays to land on ${bestDay.day} instead of ${worstDay.day}`,
    `If Email 2 would land on ${worstDay.day}, delay ${worstDay.day === 'Saturday' || worstDay.day === 'Sunday' ? '2' : '1'} more day`,
    `Best days for flow emails 2+: ${sortedDays.slice(0, 3).map(d => d.day).join(', ')}`,
    `Potential revenue increase: ${formatCurrency((bestDay.revenuePerRecipient - worstDay.revenuePerRecipient) * worstDay.count)}/month`
  ];
  
  return {
    insightId: 'dayOfWeekFlowPerformance',
    hasSignificantFinding: true,
    data: {
      dayMetrics: sortedDays,
      bestDay,
      worstDay,
      performanceGap
    },
    summary,
    actionsTitle,
    actions
  };
}

// List Size Impact on Flow Performance
export function analyzeListSizeImpactOnFlows(
  flowEmails: ProcessedFlowEmail[],
  subscribers: any[] // Will need subscriber data type
): InsightResult {
  const recentFlows = filterLast90Days(flowEmails);
  
  // Group flows by month
  const monthlyFlows = groupByMonth(recentFlows);
  
  // For each month, calculate list size and flow performance
  const monthlyAnalysis = Array.from(monthlyFlows.entries()).map(([month, flows]) => {
    // Parse month to get date
    const [year, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1, 15); // Middle of month
    
    // Count active subscribers for this month (simplified - you may need to adjust based on your data)
    const activeSubscribers = subscribers.filter(sub => {
      const createdDate = new Date(sub.dateAdded || sub.createdAt);
      return createdDate <= monthDate;
    }).length;
    
    // Calculate flow metrics
    const totalRevenue = flows.reduce((sum, f) => sum + f.revenue, 0);
    const totalDelivered = flows.reduce((sum, f) => sum + f.emailsSent, 0);
    const avgOpenRate = average(flows.map(f => f.openRate));
    const avgClickRate = average(flows.map(f => f.clickRate));
    const revenuePerRecipient = totalDelivered > 0 ? totalRevenue / totalDelivered : 0;
    
    return {
      month,
      monthDate,
      listSize: activeSubscribers,
      flowCount: flows.length,
      avgOpenRate,
      avgClickRate,
      revenuePerRecipient,
      totalRevenue
    };
  }).filter(m => m.listSize > 0).sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  
  if (monthlyAnalysis.length < 3) {
    return {
      insightId: 'listSizeFlowImpact',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough monthly data to analyze list size impact'
    };
  }
  
  // Compare first month to last month
  const firstMonth = monthlyAnalysis[0];
  const lastMonth = monthlyAnalysis[monthlyAnalysis.length - 1];
  
  const listGrowth = (lastMonth.listSize - firstMonth.listSize) / firstMonth.listSize;
  const openRateChange = (lastMonth.avgOpenRate - firstMonth.avgOpenRate) / firstMonth.avgOpenRate;
  const revenueChange = (lastMonth.revenuePerRecipient - firstMonth.revenuePerRecipient) / firstMonth.revenuePerRecipient;
  
  // Check if performance declined as list grew
  const performanceDeclining = listGrowth > 0.1 && (openRateChange < -0.1 || revenueChange < -0.1);
  
  if (!performanceDeclining && Math.abs(openRateChange) < 0.15) {
    return {
      insightId: 'listSizeFlowImpact',
      hasSignificantFinding: false,
      data: monthlyAnalysis,
      summary: 'Flow performance stable as list grows'
    };
  }
  
  const summary = performanceDeclining ? 
    `Flow performance declined ${formatPercent(Math.abs(openRateChange))} as list grew ${formatPercent(listGrowth)}` :
    `Flow performance improved despite ${formatPercent(listGrowth)} list growth`;
  
  const actionsTitle = performanceDeclining ? 'Tighten Flow Triggers:' : 'Scale What\'s Working:';
  const actions = performanceDeclining ? [
    `Add engagement conditions to flow triggers (opened in last 30 days)`,
    `Segment flows by engagement level for larger list`,
    `Review flow content relevance for newer subscribers`,
    `Expected improvement: ${formatPercent(Math.abs(openRateChange) * 0.5)} in open rates`
  ] : [
    `Your flows scale well - maintain current triggers`,
    `List grew ${formatPercent(listGrowth)} with stable performance`,
    `Test increasing flow frequency for engaged segments`,
    `Focus on acquisition to leverage strong automation`
  ];
  
  return {
    insightId: 'listSizeFlowImpact',
    hasSignificantFinding: true,
    data: {
      monthlyAnalysis,
      firstMonth,
      lastMonth,
      listGrowth,
      openRateChange,
      revenueChange,
      performanceDeclining
    },
    summary,
    actionsTitle,
    actions
  };
}
