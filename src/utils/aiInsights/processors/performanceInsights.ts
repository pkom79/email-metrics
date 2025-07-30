import { ProcessedCampaign } from '../../dataTypes';
import { InsightResult } from '../types';
import {
  average,
  formatCurrency,
  formatPercent,
  groupBy,
  percentile,
  detectAnomalies
} from '../calculationHelpers';
import { filterLast90Days, groupByMonth } from '../dateUtils';

// Campaign Fatigue Pattern
export function analyzeCampaignFatigue(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime());
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'campaignFatigue',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze fatigue patterns'
    };
  }
  
  // Calculate 30-day rolling metrics
  const rollingAnalysis = recentCampaigns.map((campaign) => {
    const thirtyDaysAgo = new Date(campaign.sentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get campaigns in the 30-day window
    const windowCampaigns = recentCampaigns.filter(c => 
      c.sentDate <= campaign.sentDate && c.sentDate >= thirtyDaysAgo
    );
    
    const totalRecipients = windowCampaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalUnsubscribes = windowCampaigns.reduce((sum, c) => sum + c.unsubscribesCount, 0);
    const totalSpamComplaints = windowCampaigns.reduce((sum, c) => sum + c.spamComplaintsCount, 0);
    
    const unsubRate = totalRecipients > 0 ? totalUnsubscribes / totalRecipients : 0;
    const spamRate = totalRecipients > 0 ? totalSpamComplaints / totalRecipients : 0;
    const fatigueRate = unsubRate + spamRate;
    
    return {
      date: campaign.sentDate,
      campaign,
      windowCampaigns: windowCampaigns.length,
      campaignsPerWeek: windowCampaigns.length / 4.3, // ~4.3 weeks in 30 days
      unsubRate,
      spamRate,
      fatigueRate,
      totalRecipients
    };
  });
  
  // Compare current to 90 days ago
  const currentMetrics = rollingAnalysis[rollingAnalysis.length - 1];
  const historicalMetrics = rollingAnalysis[0];
  
  const fatigueIncrease = historicalMetrics.fatigueRate > 0 ?
    (currentMetrics.fatigueRate - historicalMetrics.fatigueRate) / historicalMetrics.fatigueRate : 0;
  
  // Check if frequency increased
  const frequencyIncrease = historicalMetrics.campaignsPerWeek > 0 ?
    (currentMetrics.campaignsPerWeek - historicalMetrics.campaignsPerWeek) / historicalMetrics.campaignsPerWeek : 0;
  
  // Find acceleration point if fatigue is increasing
  let accelerationPoint = null;
  if (fatigueIncrease > 0.2) {
    for (let i = 1; i < rollingAnalysis.length; i++) {
      const prev = rollingAnalysis[i - 1];
      const curr = rollingAnalysis[i];
      const rateChange = prev.fatigueRate > 0 ? 
        (curr.fatigueRate - prev.fatigueRate) / prev.fatigueRate : 0;
      
      if (rateChange > 0.1) { // 10% increase
        accelerationPoint = {
          date: curr.date,
          campaignsPerWeek: curr.campaignsPerWeek,
          fatigueRate: curr.fatigueRate
        };
        break;
      }
    }
  }
  
  const isFatiguing = fatigueIncrease > 0.2 || currentMetrics.unsubRate > 0.003;
  
  if (!isFatiguing) {
    return {
      insightId: 'campaignFatigue',
      hasSignificantFinding: false,
      data: rollingAnalysis,
      summary: 'List fatigue metrics remain healthy'
    };
  }
  
  // Project future impact
  const monthlyUnsubs = currentMetrics.unsubRate * (currentMetrics.totalRecipients / 30) * 30;
  const projectedAnnualLoss = monthlyUnsubs * 12;
  
  const summary = `Unsubscribe rate increased ${formatPercent(fatigueIncrease)} over 90 days (${formatPercent(historicalMetrics.unsubRate)} → ${formatPercent(currentMetrics.unsubRate)})`;
  
  const actionsTitle = 'Combat List Fatigue:';
  const actions = [
    accelerationPoint ? 
      `Fatigue accelerated when frequency hit ${accelerationPoint.campaignsPerWeek.toFixed(1)} campaigns/week` :
      `Current frequency: ${currentMetrics.campaignsPerWeek.toFixed(1)} campaigns/week causing fatigue`,
    `Will lose ${projectedAnnualLoss.toLocaleString()} subscribers/year at current rate`,
    frequencyIncrease > 0.2 ? 
      `Reduce to ${historicalMetrics.campaignsPerWeek.toFixed(1)} campaigns/week (your historical sweet spot)` :
      'Improve content relevance rather than reducing frequency',
    'Implement preference center to let subscribers choose frequency'
  ];
  
  return {
    insightId: 'campaignFatigue',
    hasSignificantFinding: true,
    data: {
      rollingAnalysis,
      currentMetrics,
      historicalMetrics,
      fatigueIncrease,
      frequencyIncrease,
      accelerationPoint,
      projectedAnnualLoss
    },
    summary,
    actionsTitle,
    actions
  };
}

// Bounce Rate Trend Analysis
export function analyzeBounceTrend(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 10) {
    return {
      insightId: 'bounceTrend',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze bounce rate trends'
    };
  }
  
  // Calculate 30-day rolling average
  const sortedCampaigns = [...recentCampaigns].sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime());
  
  const rollingBounceRates = sortedCampaigns.map((campaign) => {
    const thirtyDaysAgo = new Date(campaign.sentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const windowCampaigns = sortedCampaigns.filter(c =>
      c.sentDate <= campaign.sentDate && c.sentDate >= thirtyDaysAgo
    );
    
    const totalSent = windowCampaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalBounces = windowCampaigns.reduce((sum, c) => sum + c.bouncesCount, 0);
    const avgBounceRate = totalSent > 0 ? totalBounces / totalSent : 0;
    
    return {
      date: campaign.sentDate,
      campaign,
      avgBounceRate,
      campaignBounceRate: campaign.emailsSent > 0 ? campaign.bouncesCount / campaign.emailsSent : 0
    };
  });
  
  // Compare current to 60-90 days ago
  const currentAvg = rollingBounceRates[rollingBounceRates.length - 1].avgBounceRate;
  const historicalAvg = rollingBounceRates[Math.floor(rollingBounceRates.length / 3)].avgBounceRate;
  
  const bounceIncrease = historicalAvg > 0 ?
    (currentAvg - historicalAvg) / historicalAvg : 0;
  
  // Find spike campaigns (2x+ average)
  const avgBounceRate = average(recentCampaigns.map(c => 
    c.emailsSent > 0 ? c.bouncesCount / c.emailsSent : 0
  ));
  
  const spikeCampaigns = recentCampaigns.filter(c => {
    const bounceRate = c.emailsSent > 0 ? c.bouncesCount / c.emailsSent : 0;
    return bounceRate > avgBounceRate * 2 && c.bouncesCount > 10;
  });
  
  // Check flows for comparison
  const hasSignificantIncrease = bounceIncrease > 0.5 || currentAvg > 0.02;
  
  if (!hasSignificantIncrease && spikeCampaigns.length === 0) {
    return {
      insightId: 'bounceTrend',
      hasSignificantFinding: false,
      data: rollingBounceRates,
      summary: 'Bounce rates remain within acceptable range'
    };
  }
  
  const summary = bounceIncrease > 0.5 ?
    `Bounce rate increased ${formatPercent(bounceIncrease)} in 90 days (${formatPercent(historicalAvg)} → ${formatPercent(currentAvg)})` :
    `${spikeCampaigns.length} campaigns with abnormal bounce rates`;
  
  const actionsTitle = 'Improve List Quality:';
  const actions = [
    spikeCampaigns.length > 0 ?
      `"${spikeCampaigns[0].subject}" spiked to ${formatPercent(spikeCampaigns[0].bouncesCount / spikeCampaigns[0].emailsSent)} bounce rate` :
      `Current ${formatPercent(currentAvg)} exceeds healthy threshold of 2%`,
    'Run list cleaning to remove invalid emails',
    'Check if recent imports included old or purchased lists',
    hasSignificantIncrease ? 'Implement double opt-in for new subscribers' : 'Review email validation at signup'
  ];
  
  return {
    insightId: 'bounceTrend',
    hasSignificantFinding: true,
    data: {
      rollingBounceRates,
      currentAvg,
      historicalAvg,
      bounceIncrease,
      spikeCampaigns,
      avgBounceRate
    },
    summary,
    actionsTitle,
    actions
  };
}

// Spam Complaint Rate by Campaign Size
export function analyzeSpamBySize(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .filter(c => c.emailsSent > 1000); // Need meaningful size
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'spamBySize',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze spam patterns by size'
    };
  }
  
  // Define size quartiles
  const sizes = recentCampaigns.map(c => c.emailsSent).sort((a, b) => a - b);
  const q1 = percentile(sizes, 25);
  const q2 = percentile(sizes, 50);
  const q3 = percentile(sizes, 75);
  
  // Group campaigns by size
  const sizeGroups = {
    small: recentCampaigns.filter(c => c.emailsSent <= q1),
    medium: recentCampaigns.filter(c => c.emailsSent > q1 && c.emailsSent <= q2),
    large: recentCampaigns.filter(c => c.emailsSent > q2 && c.emailsSent <= q3),
    veryLarge: recentCampaigns.filter(c => c.emailsSent > q3)
  };
  
  // Calculate spam rates for each group
  const sizeMetrics = Object.entries(sizeGroups).map(([size, campaigns]) => {
    const totalSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalSpam = campaigns.reduce((sum, c) => sum + c.spamComplaintsCount, 0);
    const avgSpamRate = totalSent > 0 ? totalSpam / totalSent : 0;
    const avgSize = average(campaigns.map(c => c.emailsSent));
    
    // Find worst offenders
    const worstCampaigns = campaigns
      .map(c => ({
        campaign: c,
        spamRate: c.emailsSent > 0 ? c.spamComplaintsCount / c.emailsSent : 0
      }))
      .sort((a, b) => b.spamRate - a.spamRate)
      .slice(0, 3);
    
    return {
      size,
      sizeRange: size === 'small' ? `<${Math.round(q1).toLocaleString()}` :
                 size === 'medium' ? `${Math.round(q1).toLocaleString()}-${Math.round(q2).toLocaleString()}` :
                 size === 'large' ? `${Math.round(q2).toLocaleString()}-${Math.round(q3).toLocaleString()}` :
                 `>${Math.round(q3).toLocaleString()}`,
      count: campaigns.length,
      avgSize,
      avgSpamRate,
      totalSpam,
      worstCampaigns
    };
  });
  
  // Check if larger sends have higher spam rates
  const smallRate = sizeMetrics.find(m => m.size === 'small')?.avgSpamRate || 0;
  const veryLargeRate = sizeMetrics.find(m => m.size === 'veryLarge')?.avgSpamRate || 0;
  
  const rateMultiple = smallRate > 0 ? veryLargeRate / smallRate : 0;
  const hasSignificantPattern = rateMultiple > 3 || veryLargeRate > 0.001;
  
  if (!hasSignificantPattern) {
    return {
      insightId: 'spamBySize',
      hasSignificantFinding: false,
      data: sizeMetrics,
      summary: 'Spam rates consistent across all audience sizes'
    };
  }
  
  // Find size threshold where spam spikes
  let spikeThreshold = q3;
  for (const metrics of sizeMetrics) {
    if (metrics.avgSpamRate > 0.001) {
      spikeThreshold = metrics.size === 'medium' ? q1 :
                      metrics.size === 'large' ? q2 : q3;
      break;
    }
  }
  
  const veryLargeMetrics = sizeMetrics.find(m => m.size === 'veryLarge')!;
  const worstCampaign = veryLargeMetrics.worstCampaigns[0];
  
  const summary = `Spam complaints ${rateMultiple.toFixed(1)}x higher on ${veryLargeMetrics.sizeRange} sends`;
  
  const actionsTitle = 'Reduce Spam Risk:';
  const actions = [
    `Cap sends at ${Math.round(spikeThreshold).toLocaleString()} recipients to stay under 0.1% threshold`,
    worstCampaign ? 
      `"${worstCampaign.campaign.subject}" alone = ${formatPercent(worstCampaign.campaign.spamComplaintsCount / sizeGroups.veryLarge.reduce((sum, c) => sum + c.spamComplaintsCount, 0))} of all complaints` :
      'Segment large lists by engagement level',
    'Large sends averaging ' + formatPercent(veryLargeRate) + ' spam rate vs ' + formatPercent(smallRate) + ' for small',
    'Create engaged segments for broadcasts over ' + Math.round(spikeThreshold).toLocaleString()
  ];
  
  return {
    insightId: 'spamBySize',
    hasSignificantFinding: true,
    data: {
      sizeMetrics,
      spikeThreshold,
      rateMultiple,
      q1, q2, q3
    },
    summary,
    actionsTitle,
    actions
  };
}

// Revenue Concentration Risk
export function analyzeRevenueConcentration(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .filter(c => c.revenue > 0);
  
  if (recentCampaigns.length < 10) {
    return {
      insightId: 'revenueConcentration',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough revenue-generating campaigns to analyze concentration'
    };
  }
  
  // Sort by revenue
  const sortedByRevenue = [...recentCampaigns].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sortedByRevenue.reduce((sum, c) => sum + c.revenue, 0);
  
  // Calculate cumulative revenue percentages
  let cumulativeRevenue = 0;
  const concentrationData = sortedByRevenue.map((campaign, index) => {
    cumulativeRevenue += campaign.revenue;
    return {
      campaign,
      rank: index + 1,
      revenue: campaign.revenue,
      percentOfTotal: campaign.revenue / totalRevenue,
      cumulativePercent: cumulativeRevenue / totalRevenue,
      revenuePerRecipient: campaign.emailsSent > 0 ? campaign.revenue / campaign.emailsSent : 0
    };
  });
  
  // Find concentration points
  const top10Percent = Math.ceil(sortedByRevenue.length * 0.1);
  const top20Percent = Math.ceil(sortedByRevenue.length * 0.2);
  
  const top10PercentRevenue = concentrationData[top10Percent - 1].cumulativePercent;
  const top20PercentRevenue = concentrationData[top20Percent - 1].cumulativePercent;
  
  // Calculate Gini coefficient (0 = perfect equality, 1 = perfect inequality)
  const n = sortedByRevenue.length;
  let giniSum = 0;
  sortedByRevenue.forEach((campaign, i) => {
    giniSum += (n - i) * campaign.revenue;
  });
  const giniCoefficient = (n + 1 - 2 * giniSum / totalRevenue) / n;
  
  // Compare top vs median performance
  const medianCampaign = sortedByRevenue[Math.floor(sortedByRevenue.length / 2)];
  const topCampaigns = sortedByRevenue.slice(0, top10Percent);
  const avgTopRevenue = average(topCampaigns.map(c => c.revenue));
  const performanceGap = medianCampaign.revenue > 0 ? avgTopRevenue / medianCampaign.revenue : 0;
  
  const isConcentrated = top10PercentRevenue > 0.5 || performanceGap > 10;
  
  if (!isConcentrated) {
    return {
      insightId: 'revenueConcentration',
      hasSignificantFinding: false,
      data: concentrationData,
      summary: 'Revenue well-distributed across campaigns'
    };
  }
  
  const summary = `Warning: ${formatPercent(top10PercentRevenue)} of revenue from just ${top10Percent} of ${sortedByRevenue.length} campaigns`;
  
  const actionsTitle = 'Reduce Revenue Risk:';
  const actions = [
    `Top campaigns generate ${performanceGap.toFixed(1)}x more than median campaign`,
    `Bottom 50% contributing only ${formatPercent(1 - concentrationData[Math.floor(sortedByRevenue.length / 2)].cumulativePercent)} of revenue`,
    'Analyze top performers: ' + topCampaigns.slice(0, 3).map(c => `"${c.subject}"`).join(', '),
    'Test top campaign elements across more sends to reduce dependency'
  ];
  
  return {
    insightId: 'revenueConcentration',
    hasSignificantFinding: true,
    data: {
      concentrationData,
      top10PercentRevenue,
      top20PercentRevenue,
      giniCoefficient,
      performanceGap,
      topCampaigns,
      medianRevenue: medianCampaign.revenue
    },
    summary,
    actionsTitle,
    actions
  };
}

// Revenue Per Email Trend
export function analyzeRevenuePerEmailTrend(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 15) {
    return {
      insightId: 'revenuePerEmailTrend',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze revenue per email trends'
    };
  }
  
  // Group by month
  const monthlyGroups = groupByMonth(recentCampaigns);
  
  // Calculate monthly metrics
  const monthlyMetrics = Array.from(monthlyGroups.entries()).map(([month, campaigns]) => {
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const revenuePerEmail = totalSent > 0 ? totalRevenue / totalSent : 0;
    
    // Calculate other efficiency metrics
    const avgOpenRate = average(campaigns.map(c => c.openRate));
    const avgClickRate = average(campaigns.map(c => c.clickRate));
    const avgConversionRate = average(campaigns.map(c => 
      c.uniqueClicks > 0 ? c.totalOrders / c.uniqueClicks : 0
    ));
    
    return {
      month,
      campaignCount: campaigns.length,
      totalRevenue,
      totalSent,
      revenuePerEmail,
      avgOpenRate,
      avgClickRate,
      avgConversionRate
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
  
  if (monthlyMetrics.length < 2) {
    return {
      insightId: 'revenuePerEmailTrend',
      hasSignificantFinding: false,
      data: monthlyMetrics,
      summary: 'Not enough monthly data to identify trends'
    };
  }
  
  // Calculate trend
  const firstMonth = monthlyMetrics[0];
  const lastMonth = monthlyMetrics[monthlyMetrics.length - 1];
  
  const revenuePerEmailChange = firstMonth.revenuePerEmail > 0 ?
    (lastMonth.revenuePerEmail - firstMonth.revenuePerEmail) / firstMonth.revenuePerEmail : 0;
  
  // Identify what's driving the change
  const openRateChange = (lastMonth.avgOpenRate - firstMonth.avgOpenRate) / firstMonth.avgOpenRate;
  const clickRateChange = (lastMonth.avgClickRate - firstMonth.avgClickRate) / firstMonth.avgClickRate;
  const conversionChange = firstMonth.avgConversionRate > 0 ?
    (lastMonth.avgConversionRate - firstMonth.avgConversionRate) / firstMonth.avgConversionRate : 0;
  
  const isDeclining = revenuePerEmailChange < -0.15;
  
  if (!isDeclining && Math.abs(revenuePerEmailChange) < 0.15) {
    return {
      insightId: 'revenuePerEmailTrend',
      hasSignificantFinding: false,
      data: monthlyMetrics,
      summary: 'Revenue per email remains stable'
    };
  }
  
  // Project future impact
  const currentMonthlyEmails = lastMonth.totalSent;
  const revenueNeededToMaintain = firstMonth.revenuePerEmail * currentMonthlyEmails * 1.2; // 20% buffer
  const additionalEmailsNeeded = isDeclining && lastMonth.revenuePerEmail > 0 ?
    (revenueNeededToMaintain - (lastMonth.revenuePerEmail * currentMonthlyEmails)) / lastMonth.revenuePerEmail : 0;
  
  const summary = `Revenue/email ${isDeclining ? 'declined' : 'improved'} ${formatPercent(Math.abs(revenuePerEmailChange))} over ${monthlyMetrics.length} months`;
  
  const actionsTitle = isDeclining ? 'Reverse Revenue Decline:' : 'Maintain Momentum:';
  const actions = isDeclining ? [
    `${firstMonth.month}: ${formatCurrency(firstMonth.revenuePerEmail)} → ${lastMonth.month}: ${formatCurrency(lastMonth.revenuePerEmail)} per email`,
    `Need ${formatPercent(additionalEmailsNeeded / currentMonthlyEmails)} more emails to maintain revenue`,
    openRateChange < -0.1 ? `Open rates down ${formatPercent(Math.abs(openRateChange))} - test subject lines` :
    clickRateChange < -0.1 ? `Click rates down ${formatPercent(Math.abs(clickRateChange))} - improve content` :
    `Conversion down ${formatPercent(Math.abs(conversionChange))} - check landing pages`,
    'Run win-back campaign for unengaged segments'
  ] : [
    `Strong growth: ${formatCurrency(firstMonth.revenuePerEmail)} → ${formatCurrency(lastMonth.revenuePerEmail)} per email`,
    `${openRateChange > 0.1 ? 'Open rates' : clickRateChange > 0.1 ? 'Click rates' : 'Conversion'} driving improvement`,
    'Document what changed and scale successful tactics',
    `Opportunity: Apply learnings to improve bottom 50% of campaigns`
  ];
  
  return {
    insightId: 'revenuePerEmailTrend',
    hasSignificantFinding: true,
    data: {
      monthlyMetrics,
      revenuePerEmailChange,
      openRateChange,
      clickRateChange,
      conversionChange,
      additionalEmailsNeeded
    },
    summary,
    actionsTitle,
    actions
  };
}

// Revenue Clustering by Send Time
export function analyzeRevenueClustering(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .filter(c => c.revenue > 0);
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'revenueClustering',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough revenue data to analyze time clustering'
    };
  }
  
  // Group by hour of day
  const hourlyGroups = groupBy(recentCampaigns, campaign => {
    const hour = campaign.sentDate.getHours();
    return hour.toString();
  });
  
  // Calculate metrics for each hour
  const hourlyMetrics = Array.from(hourlyGroups.entries()).map(([hour, campaigns]) => {
    const revenues = campaigns.map(c => c.revenue);
    const revenuesPerRecipient = campaigns.map(c => 
      c.emailsSent > 0 ? c.revenue / c.emailsSent : 0
    );
    
    const medianRevenue = revenues.sort((a, b) => a - b)[Math.floor(revenues.length / 2)];
    const p25 = percentile(revenues, 25);
    const p75 = percentile(revenues, 75);
    const consistency = medianRevenue > 0 ? (p75 - p25) / medianRevenue : 0;
    
    // Check for outliers
    const anomalies = detectAnomalies(campaigns.map(c => ({
      date: c.sentDate,
      value: c.revenue,
      label: c.subject
    })));
    
    // Identify top 10% campaigns
    const revenueThreshold = percentile(recentCampaigns.map(c => c.revenue), 90);
    const topPerformers = campaigns.filter(c => c.revenue >= revenueThreshold);
    
    return {
      hour: parseInt(hour),
      hourLabel: `${parseInt(hour) === 0 ? 12 : parseInt(hour) > 12 ? parseInt(hour) - 12 : hour} ${parseInt(hour) >= 12 ? 'PM' : 'AM'}`,
      count: campaigns.length,
      medianRevenue,
      avgRevenue: average(revenues),
      avgRevenuePerRecipient: average(revenuesPerRecipient),
      p25,
      p75,
      consistency,
      range: p75 - p25,
      anomalies: anomalies.length,
      topPerformers: topPerformers.length,
      topPerformerRate: campaigns.length > 0 ? topPerformers.length / campaigns.length : 0
    };
  }).filter(h => h.count >= 3); // Need enough data per hour
  
  if (hourlyMetrics.length < 4) {
    return {
      insightId: 'revenueClustering',
      hasSignificantFinding: false,
      data: hourlyMetrics,
      summary: 'Not enough time variety to identify clustering patterns'
    };
  }
  
  // Sort by different criteria
  const byConsistency = [...hourlyMetrics].sort((a, b) => a.consistency - b.consistency);
  const byTopPerformers = [...hourlyMetrics].sort((a, b) => b.topPerformerRate - a.topPerformerRate);
  
  const mostConsistent = byConsistency[0];
  const mostVariable = byConsistency[byConsistency.length - 1];
  const bestForTopPerformers = byTopPerformers[0];
  
  const summary = `${mostConsistent.hourLabel}: ${formatCurrency(mostConsistent.medianRevenue)} median, ${formatPercent(mostConsistent.consistency)} variance - RELIABLE`;
  
  const actionsTitle = 'Optimize Send Time Strategy:';
  const actions = [
    `${mostConsistent.hourLabel} most reliable: ${formatCurrency(mostConsistent.p25)}-${formatCurrency(mostConsistent.p75)} typical range`,
    `${mostVariable.hourLabel} high risk/reward: ${formatCurrency(mostVariable.p25)}-${formatCurrency(mostVariable.p75)} range`,
    bestForTopPerformers.topPerformerRate > 0.2 ?
      `${bestForTopPerformers.hourLabel}: ${formatPercent(bestForTopPerformers.topPerformerRate)} chance of top 10% performance` :
      'No hour shows consistent top performance',
    'Use reliable times for important campaigns, variable times for testing'
  ];
  
  return {
    insightId: 'revenueClustering',
    hasSignificantFinding: true,
    data: {
      hourlyMetrics,
      mostConsistent,
      mostVariable,
      bestForTopPerformers
    },
    summary,
    actionsTitle,
    actions
  };
}

// Campaign Performance by List Size
export function analyzeCampaignPerformanceBySize(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .filter(c => c.emailsSent > 500); // Need meaningful sizes
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'performanceBySize',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze performance by audience size'
    };
  }
  
  // Define size quartiles
  const sizes = recentCampaigns.map(c => c.emailsSent).sort((a, b) => a - b);
  const q1 = percentile(sizes, 25);
  const q2 = percentile(sizes, 50);
  const q3 = percentile(sizes, 75);
  
  // Group and analyze
  const sizeGroups = [
    { label: 'Small', min: 0, max: q1 },
    { label: 'Medium', min: q1, max: q2 },
    { label: 'Large', min: q2, max: q3 },
    { label: 'Very Large', min: q3, max: Infinity }
  ];
  
  const sizeAnalysis = sizeGroups.map(group => {
    const groupCampaigns = recentCampaigns.filter(c => 
      c.emailsSent > group.min && c.emailsSent <= group.max
    );
    
    if (groupCampaigns.length === 0) return null;
    
    const totalRevenue = groupCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalSent = groupCampaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalUnsubs = groupCampaigns.reduce((sum, c) => sum + c.unsubscribesCount, 0);
    
    return {
      sizeGroup: group.label,
      sizeRange: `${Math.round(group.min).toLocaleString()}-${group.max === Infinity ? '∞' : Math.round(group.max).toLocaleString()}`,
      count: groupCampaigns.length,
      avgSize: average(groupCampaigns.map(c => c.emailsSent)),
      totalRevenue,
      avgRevenue: totalRevenue / groupCampaigns.length,
      revenuePerRecipient: totalSent > 0 ? totalRevenue / totalSent : 0,
      avgOpenRate: average(groupCampaigns.map(c => c.openRate)),
      avgClickRate: average(groupCampaigns.map(c => c.clickRate)),
      unsubRate: totalSent > 0 ? totalUnsubs / totalSent : 0
    };
  }).filter(g => g !== null) as any[];
  
  // Find optimal size for efficiency vs total revenue
  const byEfficiency = [...sizeAnalysis].sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient);
  const byTotalRevenue = [...sizeAnalysis].sort((a, b) => b.avgRevenue - a.avgRevenue);
  
  const mostEfficient = byEfficiency[0];
  const highestRevenue = byTotalRevenue[0];
  
  // Calculate trade-offs
  const efficiencyGap = mostEfficient.revenuePerRecipient > 0 && sizeAnalysis[sizeAnalysis.length - 1].revenuePerRecipient > 0 ?
    (mostEfficient.revenuePerRecipient - sizeAnalysis[sizeAnalysis.length - 1].revenuePerRecipient) / sizeAnalysis[sizeAnalysis.length - 1].revenuePerRecipient : 0;
  
  const summary = `${mostEfficient.sizeGroup} (${mostEfficient.sizeRange}): ${formatPercent(mostEfficient.avgOpenRate)} opens, ${formatCurrency(mostEfficient.revenuePerRecipient)}/recipient`;
  
  const actionsTitle = 'Balance Reach vs Efficiency:';
  const actions = [
    mostEfficient.sizeGroup !== highestRevenue.sizeGroup ?
      `${highestRevenue.sizeGroup} campaigns: ${formatPercent((highestRevenue.avgRevenue - mostEfficient.avgRevenue) / mostEfficient.avgRevenue)} more total revenue but ${formatPercent(efficiencyGap)} lower efficiency` :
      `${mostEfficient.sizeGroup} campaigns optimal for both efficiency and revenue`,
    `${sizeAnalysis[sizeAnalysis.length - 1].sizeGroup} campaigns: ${formatPercent(sizeAnalysis[sizeAnalysis.length - 1].unsubRate)} unsub rate, ${formatPercent((sizeAnalysis[sizeAnalysis.length - 1].unsubRate / mostEfficient.unsubRate) - 1)} higher`,
    'Sweet spot: ' + (mostEfficient.avgSize < 5000 ? 'Keep campaigns under 5,000 for best ROI' : `Target ${Math.round(mostEfficient.avgSize).toLocaleString()} recipients`),
    'For larger sends: Segment by engagement to maintain efficiency'
  ];
  
  return {
    insightId: 'performanceBySize',
    hasSignificantFinding: efficiencyGap > 0.3,
    data: {
      sizeAnalysis,
      mostEfficient,
      highestRevenue,
      efficiencyGap,
      quartiles: { q1, q2, q3 }
    },
    summary,
    actionsTitle,
    actions
  };
}

// Perfect Campaign Recipe Detector
export function analyzePerfectCampaignRecipe(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .filter(c => c.revenue > 0);
  
  if (recentCampaigns.length < 30) {
    return {
      insightId: 'perfectRecipe',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to identify perfect recipe patterns'
    };
  }
  
  // Calculate percentiles for each metric
  const revenueP75 = percentile(recentCampaigns.map(c => c.revenue), 75);
  const openRateP75 = percentile(recentCampaigns.map(c => c.openRate), 75);
  const clickRateP75 = percentile(recentCampaigns.map(c => c.clickRate), 75);
  const unsubRateP25 = percentile(recentCampaigns.map(c => 
    c.emailsSent > 0 ? c.unsubscribesCount / c.emailsSent : 0
  ), 25);
  const spamRateP25 = percentile(recentCampaigns.map(c =>
    c.emailsSent > 0 ? c.spamComplaintsCount / c.emailsSent : 0
  ), 25);
  
  // Find campaigns in top 25% for good metrics, bottom 25% for bad metrics
  const perfectCampaigns = recentCampaigns.filter(c => {
    const unsubRate = c.emailsSent > 0 ? c.unsubscribesCount / c.emailsSent : 0;
    const spamRate = c.emailsSent > 0 ? c.spamComplaintsCount / c.emailsSent : 0;
    
    return c.revenue >= revenueP75 &&
           c.openRate >= openRateP75 &&
           c.clickRate >= clickRateP75 &&
           unsubRate <= unsubRateP25 &&
           spamRate <= spamRateP25;
  });
  
  if (perfectCampaigns.length === 0) {
    // Relax criteria slightly
    const goodCampaigns = recentCampaigns.filter(c => {
      const score = (c.revenue >= revenueP75 ? 1 : 0) +
                   (c.openRate >= openRateP75 ? 1 : 0) +
                   (c.clickRate >= clickRateP75 ? 1 : 0);
      return score >= 2;
    });
    
    if (goodCampaigns.length === 0) {
      return {
        insightId: 'perfectRecipe',
        hasSignificantFinding: false,
        data: null,
        summary: 'No campaigns excelling across all metrics'
      };
    }
    
    // Use good campaigns instead
    perfectCampaigns.push(...goodCampaigns);
  }
  
  // Analyze common patterns
  const patterns = {
    timing: groupBy(perfectCampaigns, c => {
      const day = c.sentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = c.sentDate.getHours();
      const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      return `${day} ${period}`;
    }),
    size: groupBy(perfectCampaigns, c => {
      if (c.emailsSent < 3000) return 'Small (<3K)';
      if (c.emailsSent < 5000) return 'Medium (3-5K)';
      return 'Large (5K+)';
    }),
    themes: perfectCampaigns.map(c => ({
      subject: c.subject,
      hasUrgency: c.subject.toLowerCase().includes('last') || c.subject.toLowerCase().includes('ends') || c.subject.toLowerCase().includes('limited'),
      hasDiscount: c.subject.includes('%') || c.subject.toLowerCase().includes('off') || c.subject.toLowerCase().includes('save'),
      hasPersonalization: c.subject.includes('you') || c.subject.includes('your')
    }))
  };
  
  // Find most common patterns
  const timingCounts = Array.from(patterns.timing.entries()).map(([key, campaigns]) => ({
    pattern: key,
    count: campaigns.length
  })).sort((a, b) => b.count - a.count);
  
  const sizeCounts = Array.from(patterns.size.entries()).map(([key, campaigns]) => ({
    pattern: key,
    count: campaigns.length
  })).sort((a, b) => b.count - a.count);
  
  // Calculate combined metrics
  const perfectRevenue = perfectCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const perfectRevenuePercent = perfectRevenue / recentCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgUnsubRate = average(perfectCampaigns.map(c => 
    c.emailsSent > 0 ? c.unsubscribesCount / c.emailsSent : 0
  ));
  
  const summary = `${perfectCampaigns.length} 'perfect' campaigns (top 25% revenue + engagement + health)`;
  
  const actionsTitle = 'Replicate Your Winners:';
  const actions = [
    `Pattern: ${timingCounts[0]?.pattern || 'Various times'}, ${sizeCounts[0]?.pattern || 'Various sizes'} recipients`,
    `These ${perfectCampaigns.length} = ${formatPercent(perfectRevenuePercent)} of revenue with ${formatPercent(avgUnsubRate)} unsub rate`,
    `Common elements: ${patterns.themes.filter(t => t.hasUrgency).length > perfectCampaigns.length / 2 ? 'Urgency + ' : ''}${patterns.themes.filter(t => t.hasDiscount).length > perfectCampaigns.length / 2 ? 'Discounts' : 'Value-focused'}`,
    `Examples: ${perfectCampaigns.slice(0, 3).map(c => `"${c.subject}"`).join(', ')}`
  ];
  
  return {
    insightId: 'perfectRecipe',
    hasSignificantFinding: true,
    data: {
      perfectCampaigns,
      patterns,
      timingCounts,
      sizeCounts,
      perfectRevenue,
      perfectRevenuePercent,
      thresholds: { revenueP75, openRateP75, clickRateP75, unsubRateP25, spamRateP25 }
    },
    summary,
    actionsTitle,
    actions
  };
}
