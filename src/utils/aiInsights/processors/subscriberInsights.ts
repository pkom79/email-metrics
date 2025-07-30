import { ProcessedCampaign, ProcessedFlowEmail, ProcessedSubscriber } from '../../dataTypes';
import { InsightResult } from '../types';
import {
  average,
  formatCurrency,
  formatPercent
} from '../calculationHelpers';
import { filterLast90Days, groupByMonth } from '../dateUtils';

// Subscriber Decay Alert
export function analyzeSubscriberDecay(
  subscribers: ProcessedSubscriber[],
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[]
): InsightResult {
  // Get subscribers created in last 90 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const recentSubscribers = subscribers.filter(sub => 
    new Date(sub.profileCreated) >= cutoffDate
  );
  
  if (recentSubscribers.length < 100) {
    return {
      insightId: 'subscriberDecay',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough new subscribers to analyze decay patterns'
    };
  }
  
  // Group subscribers by month of creation
  const subscriberCohorts = groupByMonth(recentSubscribers.map(sub => ({
    ...sub,
    sentDate: new Date(sub.profileCreated) // Add sentDate for groupByMonth compatibility
  })));
  
  // Get all email activity in last 90 days
  const recentCampaigns = filterLast90Days(campaigns);
  const recentFlows = filterLast90Days(flows);
  
  // Analyze each cohort
  const cohortAnalysis = Array.from(subscriberCohorts.entries()).map(([month, cohortSubs]) => {
    const cohortEmails = cohortSubs.map(sub => sub.email);
    const cohortSize = cohortEmails.length;
    const cohortDate = new Date(cohortSubs[0].profileCreated);
    const daysOld = Math.floor((new Date().getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Count engaged subscribers (opened/clicked in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Check campaign engagement
    const engagedInCampaigns = new Set<string>();
    recentCampaigns.forEach(campaign => {
      if (campaign.sentDate >= thirtyDaysAgo) {
        // This is simplified - in real implementation you'd need detailed recipient data
        // For now, we'll estimate based on overall engagement rates
        const estimatedEngaged = Math.floor(cohortSize * campaign.openRate);
        // Add a portion of the cohort as engaged
        cohortEmails.slice(0, estimatedEngaged).forEach(email => engagedInCampaigns.add(email));
      }
    });
    
    const engagedCount = Math.min(engagedInCampaigns.size, cohortSize);
    const engagementRate = cohortSize > 0 ? engagedCount / cohortSize : 0;
    
    // Calculate average CLV for cohort
    const cohortCLV = average(cohortSubs.map(sub => sub.totalClv || 0));
    
    return {
      month,
      cohortDate,
      daysOld,
      size: cohortSize,
      engagedCount,
      engagementRate,
      avgCLV: cohortCLV
    };
  }).filter(cohort => cohort.daysOld >= 30); // Only analyze cohorts at least 30 days old
  
  if (cohortAnalysis.length < 2) {
    return {
      insightId: 'subscriberDecay',
      hasSignificantFinding: false,
      data: cohortAnalysis,
      summary: 'Not enough cohort data to identify decay patterns'
    };
  }
  
  // Compare recent vs older cohorts
  const sortedCohorts = [...cohortAnalysis].sort((a, b) => b.cohortDate.getTime() - a.cohortDate.getTime());
  const recentCohort = sortedCohorts[0];
  const olderCohort = sortedCohorts[sortedCohorts.length - 1];
  
  const decayRate = olderCohort.engagementRate > 0 ?
    (olderCohort.engagementRate - recentCohort.engagementRate) / olderCohort.engagementRate : 0;
  
  const isDecaying = decayRate > 0.2; // 20% worse engagement is concerning
  
  if (!isDecaying) {
    return {
      insightId: 'subscriberDecay',
      hasSignificantFinding: false,
      data: cohortAnalysis,
      summary: 'Subscriber engagement remains healthy across cohorts'
    };
  }
  
  // Project future impact
  const activeSubscribers = subscribers.filter(sub => {
    // Simplified - count those added in last 180 days as "active"
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    return new Date(sub.profileCreated) >= sixMonthsAgo;
  }).length;
  
  const projectedLoss = Math.floor(activeSubscribers * decayRate);
  const avgRevPerSubscriber = (recentCampaigns.reduce((sum, c) => sum + c.revenue, 0) + 
                               recentFlows.reduce((sum, f) => sum + f.revenue, 0)) / activeSubscribers;
  const projectedRevenueLoss = projectedLoss * avgRevPerSubscriber;
  
  const summary = `${recentCohort.month} subscribers decaying ${formatPercent(decayRate)} faster than average`;
  
  const actionsTitle = 'Stop Subscriber Decay:';
  const actions = [
    `Recent cohort: only ${formatPercent(recentCohort.engagementRate)} engaged after 30 days vs ${formatPercent(olderCohort.engagementRate)} historically`,
    `At this rate, you'll lose ${projectedLoss.toLocaleString()} active subscribers (${formatCurrency(projectedRevenueLoss)}/month)`,
    'Review welcome series immediately - engagement drops after initial emails',
    `Consider win-back campaign for ${(recentCohort.size - recentCohort.engagedCount).toLocaleString()} unengaged recent subscribers`
  ];
  
  return {
    insightId: 'subscriberDecay',
    hasSignificantFinding: true,
    data: {
      cohortAnalysis,
      recentCohort,
      olderCohort,
      decayRate,
      projectedLoss,
      projectedRevenueLoss
    },
    summary,
    actionsTitle,
    actions
  };
}

// Subscriber Lifecycle + Dead Weight
export function analyzeSubscriberLifecycle(
  subscribers: ProcessedSubscriber[]
  // campaigns: ProcessedCampaign[],
  // flows: ProcessedFlowEmail[]
): InsightResult {
  // Define age cohorts
  const now = new Date();
  const cohortDefinitions = [
    { label: '0-3 months', minDays: 0, maxDays: 90 },
    { label: '3-6 months', minDays: 91, maxDays: 180 },
    { label: '6-12 months', minDays: 181, maxDays: 365 },
    { label: '1-2 years', minDays: 366, maxDays: 730 },
    { label: '2+ years', minDays: 731, maxDays: Infinity }
  ];
  
  // Get recent email activity
  // const recentCampaigns = filterLast90Days(campaigns);
  // const recentFlows = filterLast90Days(flows);
  
  // Analyze each cohort
  const cohortAnalysis = cohortDefinitions.map(cohortDef => {
    const cohortSubs = subscribers.filter(sub => {
      const daysOld = Math.floor((now.getTime() - new Date(sub.profileCreated).getTime()) / (1000 * 60 * 60 * 24));
      return daysOld >= cohortDef.minDays && daysOld <= cohortDef.maxDays;
    });
    
    if (cohortSubs.length === 0) {
      return null;
    }
    
    // Estimate engagement based on last active dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Count those with recent activity
    const engaged = cohortSubs.filter(sub => {
      const lastActive = sub.lastActive ? new Date(sub.lastActive) : null;
      return lastActive && lastActive >= thirtyDaysAgo;
    }).length;
    
    const engagementRate = cohortSubs.length > 0 ? engaged / cohortSubs.length : 0;
    
    // Calculate unsubscribe rate (simplified)
    const unsubscribed = cohortSubs.filter(sub => sub.emailConsent === false).length;
    const unsubRate = cohortSubs.length > 0 ? unsubscribed / cohortSubs.length : 0;
    
    // Calculate revenue contribution
    const totalRevenue = cohortSubs.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
    const avgCLV = cohortSubs.length > 0 ? totalRevenue / cohortSubs.length : 0;
    
    return {
      cohort: cohortDef.label,
      size: cohortSubs.length,
      engaged,
      engagementRate,
      unsubRate,
      totalRevenue,
      avgCLV
    };
  }).filter(c => c !== null);
  
  // Find dead weight (1+ year old, no engagement in 90 days, minimal revenue)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const deadWeight = subscribers.filter(sub => {
    const isOld = new Date(sub.profileCreated) <= oneYearAgo;
    const lastActive = sub.lastActive ? new Date(sub.lastActive) : new Date(sub.profileCreated);
    const isInactive = lastActive < ninetyDaysAgo;
    const lowValue = (sub.totalClv || 0) < 10; // Adjust threshold as needed
    
    return isOld && isInactive && lowValue;
  });
  
  const deadWeightRevenue = deadWeight.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
  const totalRevenue = subscribers.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
  const deadWeightRevenuePercent = totalRevenue > 0 ? deadWeightRevenue / totalRevenue : 0;
  
  // Find concerning trends
  const hasDecline = cohortAnalysis.length >= 3 && 
    cohortAnalysis[0].engagementRate > cohortAnalysis[1].engagementRate &&
    cohortAnalysis[1].engagementRate > cohortAnalysis[2].engagementRate;
  
  const summary = `Engagement: ${cohortAnalysis[0]?.cohort}: ${formatPercent(cohortAnalysis[0]?.engagementRate || 0)} → ${cohortAnalysis[cohortAnalysis.length - 1]?.cohort}: ${formatPercent(cohortAnalysis[cohortAnalysis.length - 1]?.engagementRate || 0)}`;
  
  const actionsTitle = 'Optimize Subscriber Lifecycle:';
  const actions = [
    hasDecline ? `Engagement declining with age - implement re-engagement at 6 months` : 'Engagement patterns healthy across age groups',
    `Dead weight: ${deadWeight.length.toLocaleString()} subscribers (${formatPercent(deadWeight.length / subscribers.length)}) contribute only ${formatPercent(deadWeightRevenuePercent)} of revenue`,
    deadWeight.length > subscribers.length * 0.1 ? `Clean list: Remove ${deadWeight.length.toLocaleString()} inactive, low-value subscribers` : 'List hygiene is good - minimal dead weight',
    `Focus retention on ${cohortAnalysis[1]?.cohort || '3-6 month'} cohort where engagement drops most`
  ];
  
  return {
    insightId: 'subscriberLifecycle',
    hasSignificantFinding: hasDecline || deadWeight.length > subscribers.length * 0.05,
    data: {
      cohortAnalysis,
      deadWeight: {
        count: deadWeight.length,
        percent: deadWeight.length / subscribers.length,
        revenue: deadWeightRevenue,
        revenuePercent: deadWeightRevenuePercent
      }
    },
    summary,
    actionsTitle,
    actions
  };
}

// High-Value Subscriber Engagement
export function analyzeHighValueEngagement(
  subscribers: ProcessedSubscriber[]
  // campaigns: ProcessedCampaign[]
): InsightResult {
  // Find top 20% by CLV
  const subscribersWithCLV = subscribers.filter(sub => (sub.totalClv || 0) > 0);
  
  if (subscribersWithCLV.length < 50) {
    return {
      insightId: 'highValueEngagement',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough subscriber CLV data to analyze high-value segments'
    };
  }
  
  const sortedByCLV = [...subscribersWithCLV].sort((a, b) => (b.totalClv || 0) - (a.totalClv || 0));
  const top20PercentCount = Math.floor(sortedByCLV.length * 0.2);
  const highValueSubs = sortedByCLV.slice(0, top20PercentCount);
  const otherSubs = sortedByCLV.slice(top20PercentCount);
  
  // Calculate engagement rates (based on last active)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const highValueEngaged = highValueSubs.filter(sub => {
    const lastActive = sub.lastActive ? new Date(sub.lastActive) : null;
    return lastActive && lastActive >= thirtyDaysAgo;
  }).length;
  const highValueEngagementRate = highValueSubs.length > 0 ? highValueEngaged / highValueSubs.length : 0;
  
  const otherEngaged = otherSubs.filter(sub => {
    const lastActive = sub.lastActive ? new Date(sub.lastActive) : null;
    return lastActive && lastActive >= thirtyDaysAgo;
  }).length;
  const otherEngagementRate = otherSubs.length > 0 ? otherEngaged / otherSubs.length : 0;
  
  // Calculate revenue concentration
  const highValueRevenue = highValueSubs.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
  const totalRevenue = subscribersWithCLV.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
  const revenueConcentration = totalRevenue > 0 ? highValueRevenue / totalRevenue : 0;
  
  // Check trend (compare recent vs older high-value subscribers)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const recentHighValueEngaged = highValueSubs.filter(sub => {
    const lastActive = sub.lastActive ? new Date(sub.lastActive) : null;
    return lastActive && lastActive >= sixtyDaysAgo && lastActive < thirtyDaysAgo;
  }).length;
  const recentHighValueRate = highValueSubs.length > 0 ? recentHighValueEngaged / highValueSubs.length : 0;
  
  const engagementDeclining = highValueEngagementRate < otherEngagementRate || 
                             (recentHighValueRate > 0 && highValueEngagementRate < recentHighValueRate * 0.8);
  
  if (!engagementDeclining && highValueEngagementRate > otherEngagementRate) {
    return {
      insightId: 'highValueEngagement',
      hasSignificantFinding: false,
      data: {
        highValueEngagementRate,
        otherEngagementRate,
        revenueConcentration
      },
      summary: 'High-value subscribers remain more engaged than average'
    };
  }
  
  // Calculate revenue at risk
  const disengagedHighValue = highValueSubs.length - highValueEngaged;
  const avgHighValueCLV = highValueRevenue / highValueSubs.length;
  const monthlyRevenueAtRisk = (disengagedHighValue * avgHighValueCLV) / 12; // Rough monthly estimate
  
  const summary = `Top 20% by CLV (${formatCurrency(avgHighValueCLV)}+) show ${formatPercent(highValueEngagementRate)} engagement vs ${formatPercent(otherEngagementRate)} others`;
  
  const actionsTitle = 'Protect High-Value Relationships:';
  const actions = [
    `These ${highValueSubs.length} subscribers = ${formatPercent(revenueConcentration)} of revenue`,
    engagementDeclining ? `Engagement declined ${formatPercent((recentHighValueRate - highValueEngagementRate) / recentHighValueRate)} in last 30 days` : 'Create VIP segment for exclusive content',
    `Risk: ${formatCurrency(monthlyRevenueAtRisk)}/month from ${disengagedHighValue} disengaged VIPs`,
    'Launch VIP re-engagement campaign with premium incentives immediately'
  ];
  
  return {
    insightId: 'highValueEngagement',
    hasSignificantFinding: true,
    data: {
      highValueCount: highValueSubs.length,
      highValueEngagementRate,
      otherEngagementRate,
      revenueConcentration,
      monthlyRevenueAtRisk,
      avgHighValueCLV,
      engagementDeclining
    },
    summary,
    actionsTitle,
    actions
  };
}

// Recent List Growth vs Quality
export function analyzeListGrowthQuality(
  subscribers: ProcessedSubscriber[]
  // campaigns: ProcessedCampaign[]
): InsightResult {
  // Analyze subscribers added in last 90 days in 30-day periods
  const periods = [
    { label: '1-30 days ago', min: 1, max: 30 },
    { label: '31-60 days ago', min: 31, max: 60 },
    { label: '61-90 days ago', min: 61, max: 90 }
  ];
  
  const now = new Date();
  
  const periodAnalysis = periods.map(period => {
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - period.max);
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() - period.min);
    
    const periodSubs = subscribers.filter(sub => {
      const addedDate = new Date(sub.profileCreated);
      return addedDate >= periodStart && addedDate <= periodEnd;
    });
    
    if (periodSubs.length === 0) {
      return null;
    }
    
    // Calculate engagement rate
    const engaged = periodSubs.filter(sub => {
      const lastActive = sub.lastActive ? new Date(sub.lastActive) : null;
      return lastActive && lastActive >= new Date(sub.profileCreated);
    }).length;
    const engagementRate = periodSubs.length > 0 ? engaged / periodSubs.length : 0;
    
    // Calculate average CLV
    const avgCLV = average(periodSubs.map(sub => sub.totalClv || 0));
    
    // Calculate predicted CLV if available
    const avgPredictedCLV = average(periodSubs.map(sub => sub.predictedClv || sub.totalClv || 0));
    
    return {
      period: period.label,
      count: periodSubs.length,
      engagementRate,
      avgCLV,
      avgPredictedCLV,
      periodStart,
      periodEnd
    };
  }).filter(p => p !== null);
  
  if (periodAnalysis.length < 2) {
    return {
      insightId: 'listGrowthQuality',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough recent subscriber data to analyze growth quality'
    };
  }
  
  // Find spikes and quality changes
  const avgGrowth = average(periodAnalysis.map(p => p!.count));
  const growthSpikes = periodAnalysis.filter(p => p!.count > avgGrowth * 2);
  
  // Compare quality metrics
  const firstPeriod = periodAnalysis[periodAnalysis.length - 1]!; // Oldest
  const lastPeriod = periodAnalysis[0]!; // Newest
  
  const engagementChange = firstPeriod.engagementRate > 0 ? 
    (lastPeriod.engagementRate - firstPeriod.engagementRate) / firstPeriod.engagementRate : 0;
  const clvChange = firstPeriod.avgCLV > 0 ?
    (lastPeriod.avgCLV - firstPeriod.avgCLV) / firstPeriod.avgCLV : 0;
  
  const hasQualityIssue = growthSpikes.length > 0 && (engagementChange < -0.2 || clvChange < -0.2);
  
  if (!hasQualityIssue && growthSpikes.length === 0) {
    return {
      insightId: 'listGrowthQuality',
      hasSignificantFinding: false,
      data: periodAnalysis,
      summary: 'List growth steady with consistent quality'
    };
  }
  
  const spikePeriod = growthSpikes[0];
  const summary = spikePeriod ? 
    `${spikePeriod.period}: +${spikePeriod.count} subs (${formatPercent((spikePeriod.count - avgGrowth) / avgGrowth)} spike), ${formatPercent(spikePeriod.engagementRate)} engaged` :
    `Recent growth: engagement ${formatPercent(engagementChange)}, CLV ${formatPercent(clvChange)}`;
  
  const actionsTitle = hasQualityIssue ? 'Address Quality Issues:' : 'Leverage Growth Momentum:';
  const actions = hasQualityIssue ? [
    `${spikePeriod?.period || 'Recent'} growth spike added ${(spikePeriod?.count || 0).toLocaleString()} but quality dropped`,
    `New subscribers ${formatPercent(Math.abs(engagementChange))} less engaged, ${formatCurrency(firstPeriod.avgCLV - lastPeriod.avgCLV)} lower CLV`,
    'Review acquisition source quality - avoid buying lists or aggressive promotions',
    'Implement quality score for new subscribers to segment immediately'
  ] : [
    `Steady growth: ${average(periodAnalysis.map(p => p!.count)).toFixed(0)} subscribers/month`,
    `Quality improving: ${formatPercent(engagementChange)} better engagement recently`,
    'Scale what\'s working - identify and expand best acquisition channels',
    `Predicted CLV trending ${clvChange > 0 ? 'up' : 'down'} ${formatPercent(Math.abs(clvChange))}`
  ];
  
  return {
    insightId: 'listGrowthQuality',
    hasSignificantFinding: true,
    data: {
      periodAnalysis,
      avgGrowth,
      growthSpikes,
      engagementChange,
      clvChange,
      hasQualityIssue
    },
    summary,
    actionsTitle,
    actions
  };
}

// New Subscriber Early Engagement Trend
export function analyzeNewSubscriberEngagement(
  subscribers: ProcessedSubscriber[]
): InsightResult {
  // Group subscribers by creation month for last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const recentSubs = subscribers.filter(sub => new Date(sub.profileCreated) >= ninetyDaysAgo);
  
  if (recentSubs.length < 50) {
    return {
      insightId: 'newSubscriberEngagement',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough new subscribers to analyze early engagement trends'
    };
  }
  
  // Group by month
  const monthlyGroups = groupByMonth(recentSubs.map(sub => ({
    ...sub,
    sentDate: new Date(sub.profileCreated) // Add sentDate for groupByMonth compatibility
  })));
  
  // Analyze each month's cohort
  const monthlyAnalysis = Array.from(monthlyGroups.entries()).map(([month, subs]) => {
    const cohortSize = subs.length;
    
    // Count how many engaged within 30 days of joining
    const engagedWithin30Days = subs.filter(sub => {
      const joinDate = new Date(sub.profileCreated);
      const firstActiveDate = sub.lastActive ? new Date(sub.lastActive) : null;
      
      if (!firstActiveDate) return false;
      
      const daysToFirstActivity = Math.floor(
        (firstActiveDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysToFirstActivity <= 30;
    }).length;
    
    // Calculate average days to first engagement
    const daysToEngagement = subs.map(sub => {
      const joinDate = new Date(sub.profileCreated);
      const firstActiveDate = sub.lastActive ? new Date(sub.lastActive) : null;
      
      if (!firstActiveDate) return null;
      
      return Math.floor(
        (firstActiveDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }).filter(days => days !== null) as number[];
    
    const avgDaysToEngagement = average(daysToEngagement);
    
    // Count never engaged
    const neverEngaged = subs.filter(sub => !sub.lastActive).length;
    
    return {
      month,
      cohortSize,
      engagedWithin30Days,
      engagementRate: cohortSize > 0 ? engagedWithin30Days / cohortSize : 0,
      avgDaysToEngagement,
      neverEngaged,
      neverEngagedRate: cohortSize > 0 ? neverEngaged / cohortSize : 0
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
  
  if (monthlyAnalysis.length < 2) {
    return {
      insightId: 'newSubscriberEngagement',
      hasSignificantFinding: false,
      data: monthlyAnalysis,
      summary: 'Not enough monthly data to identify engagement trends'
    };
  }
  
  // Compare first month to last month
  const firstMonth = monthlyAnalysis[0];
  const lastMonth = monthlyAnalysis[monthlyAnalysis.length - 1];
  
  const engagementRateChange = firstMonth.engagementRate > 0 ?
    (lastMonth.engagementRate - firstMonth.engagementRate) / firstMonth.engagementRate : 0;
  const daysToEngagementChange = firstMonth.avgDaysToEngagement > 0 ?
    (lastMonth.avgDaysToEngagement - firstMonth.avgDaysToEngagement) / firstMonth.avgDaysToEngagement : 0;
  
  const isDeclining = engagementRateChange < -0.15 || daysToEngagementChange > 0.3;
  
  if (!isDeclining) {
    return {
      insightId: 'newSubscriberEngagement',
      hasSignificantFinding: false,
      data: monthlyAnalysis,
      summary: 'New subscriber engagement patterns remain healthy'
    };
  }
  
  const summary = `Engagement declining: ${formatPercent(firstMonth.engagementRate)} → ${formatPercent(lastMonth.engagementRate)} opened within 30 days`;
  
  const actionsTitle = 'Fix Early Engagement:';
  const actions = [
    `New subs taking ${lastMonth.avgDaysToEngagement.toFixed(1)} days to engage vs ${firstMonth.avgDaysToEngagement.toFixed(1)} days before`,
    `${formatPercent(lastMonth.neverEngagedRate)} of last month's subs never engaged vs ${formatPercent(firstMonth.neverEngagedRate)} historically`,
    'Review welcome email timing - may be landing in spam or promotions',
    'Test immediate welcome email (within 1 hour) vs current delay'
  ];
  
  return {
    insightId: 'newSubscriberEngagement',
    hasSignificantFinding: true,
    data: {
      monthlyAnalysis,
      firstMonth,
      lastMonth,
      engagementRateChange,
      daysToEngagementChange,
      totalNeverEngaged: monthlyAnalysis.reduce((sum, m) => sum + m.neverEngaged, 0)
    },
    summary,
    actionsTitle,
    actions
  };
}
