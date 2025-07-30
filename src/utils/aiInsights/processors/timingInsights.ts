import { ProcessedCampaign } from '../../dataTypes';
import { InsightResult } from '../types';
import {
  groupByDayHour,
  average,
  findTopPerformers,
  formatCurrency,
  percentageChange,
  isSignificantDifference
} from '../calculationHelpers';
import { filterLast90Days } from '../dateUtils';

export function analyzeMoneyMakingTimeWindow(campaigns: ProcessedCampaign[]): InsightResult {
  // Filter to last 90 days
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 10) {
    return {
      insightId: 'moneyMakingTimeWindow',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaign data to identify time patterns'
    };
  }
  
  // Group campaigns by day and hour
  const timeSlots = groupByDayHour(recentCampaigns);
  
  // Calculate metrics for each time slot
  const timeSlotMetrics = Array.from(timeSlots.entries()).map(([timeSlot, campaigns]) => {
    const revenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const recipients = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const revenuePerRec = recipients > 0 ? revenue / recipients : 0;
    
    return {
      timeSlot,
      campaigns,
      count: campaigns.length,
      totalRevenue: revenue,
      totalRecipients: recipients,
      revenuePerRecipient: revenuePerRec,
      avgOrderValue: campaigns.length > 0 ? 
        average(campaigns.map(c => c.revenue / Math.max(c.totalOrders, 1))) : 0
    };
  });
  
  // Filter out time slots with too few campaigns
  const validTimeSlots = timeSlotMetrics.filter(slot => slot.count >= 2);
  
  if (validTimeSlots.length < 3) {
    return {
      insightId: 'moneyMakingTimeWindow',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough repeated time slots to identify patterns'
    };
  }
  
  // Calculate overall average revenue per recipient
  const overallRevenue = recentCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const overallRecipients = recentCampaigns.reduce((sum, c) => sum + c.emailsSent, 0);
  const overallAvgRevenuePerRecipient = overallRecipients > 0 ? overallRevenue / overallRecipients : 0;
  
  // Find top performing time slots
  const topSlots = findTopPerformers(
    validTimeSlots,
    slot => slot.revenuePerRecipient,
    3
  );
  
  // Check if top performers are significantly better
  const hasSignificantWinners = topSlots.some(slot => 
    isSignificantDifference(
      slot.revenuePerRecipient,
      overallAvgRevenuePerRecipient,
      'revenue',
      slot.count
    )
  );
  
  if (!hasSignificantWinners) {
    return {
      insightId: 'moneyMakingTimeWindow',
      hasSignificantFinding: false,
      data: {
        timeSlots: validTimeSlots,
        overallAvg: overallAvgRevenuePerRecipient
      },
      summary: 'No significant time-based revenue patterns found'
    };
  }
  
  // Format the top performers data
  const topPerformersData = topSlots.map(slot => ({
    timeSlot: slot.timeSlot,
    revenuePerRecipient: slot.revenuePerRecipient,
    vsAverage: percentageChange(overallAvgRevenuePerRecipient, slot.revenuePerRecipient),
    campaignCount: slot.count,
    totalRevenue: slot.totalRevenue,
    campaignNames: slot.campaigns.slice(0, 3).map(c => c.subject)
  }));
  
  // Generate summary
  const bestSlot = topPerformersData[0];
  const summary = `${bestSlot.timeSlot} generates ${formatCurrency(bestSlot.revenuePerRecipient)}/recipient (${bestSlot.vsAverage} vs average)`;
  
  // Generate actions
  const actionsTitle = 'Schedule Your Next Campaigns:';
  const actions = [
    `Send your next product launch on ${bestSlot.timeSlot}`,
    `Test this week: ${topPerformersData.slice(0, 2).map(s => s.timeSlot).join(' or ')}`,
    `Avoid low performers: Check which times consistently underperform`,
    `Track results: Name campaigns with time slot for easy comparison`
  ];
  
  return {
    insightId: 'moneyMakingTimeWindow',
    hasSignificantFinding: true,
    data: {
      topPerformers: topPerformersData,
      overallAverage: overallAvgRevenuePerRecipient,
      allTimeSlots: timeSlotMetrics
    },
    summary,
    actionsTitle,
    actions,
    context: {
      dateRange: 'Last 90 days',
      timeframe: `${recentCampaigns.length} campaigns analyzed`,
      seasonalEvents: [] // Will be populated by main processor
    }
  };
}

// Day-of-Week Revenue Reliability
export function analyzeDayOfWeekReliability(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'dayOfWeekReliability',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaign data to assess day-of-week reliability'
    };
  }
  
  // Group by day of week
  const dayGroups = new Map<string, ProcessedCampaign[]>();
  
  recentCampaigns.forEach(campaign => {
    const dayName = campaign.sentDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayGroups.has(dayName)) {
      dayGroups.set(dayName, []);
    }
    dayGroups.get(dayName)!.push(campaign);
  });
  
  // Calculate metrics for each day
  const dayMetrics = Array.from(dayGroups.entries()).map(([day, campaigns]) => {
    const revenues = campaigns.map(c => c.revenue);
    const avgRevenue = average(revenues);
    const medianRevenue = revenues.length > 0 ? 
      revenues.sort((a, b) => a - b)[Math.floor(revenues.length / 2)] : 0;
    
    // Calculate coefficient of variation (lower = more reliable)
    const stdDev = Math.sqrt(
      revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length
    );
    const coefficientOfVariation = avgRevenue > 0 ? stdDev / avgRevenue : 0;
    
    // Success rate: percentage of campaigns above median performance
    const overallMedianRevenue = [...recentCampaigns]
      .map(c => c.revenue)
      .sort((a, b) => a - b)[Math.floor(recentCampaigns.length / 2)];
    const successRate = campaigns.filter(c => c.revenue >= overallMedianRevenue).length / campaigns.length;
    
    return {
      day,
      campaignCount: campaigns.length,
      avgRevenue,
      medianRevenue,
      variance: coefficientOfVariation,
      successRate,
      reliabilityScore: successRate * (1 - coefficientOfVariation) // Higher is better
    };
  });
  
  // Filter days with enough data
  const validDays = dayMetrics.filter(d => d.campaignCount >= 3);
  
  if (validDays.length < 3) {
    return {
      insightId: 'dayOfWeekReliability',
      hasSignificantFinding: false,
      data: dayMetrics,
      summary: 'Not enough data across different days to assess reliability'
    };
  }
  
  // Sort by reliability score
  const sortedDays = [...validDays].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  const mostReliable = sortedDays[0];
  const leastReliable = sortedDays[sortedDays.length - 1];
  
  const summary = `${mostReliable.day} most reliable: ${formatCurrency(mostReliable.avgRevenue)} avg, ${(mostReliable.variance * 100).toFixed(0)}% variance`;
  
  const actionsTitle = 'Optimize Your Weekly Schedule:';
  const actions = [
    `Schedule important campaigns on ${mostReliable.day} for predictable results`,
    `Use ${sortedDays.slice(0, 2).map(d => d.day).join(' or ')} for crucial revenue goals`,
    leastReliable.variance > 0.5 ? 
      `Avoid ${leastReliable.day} for time-sensitive campaigns (high variance)` :
      `Test new strategies on ${leastReliable.day} when variance is acceptable`,
    `Build a weekly calendar based on these reliability patterns`
  ];
  
  return {
    insightId: 'dayOfWeekReliability',
    hasSignificantFinding: true,
    data: {
      dayMetrics: sortedDays,
      mostReliable,
      leastReliable
    },
    summary,
    actionsTitle,
    actions
  };
}
