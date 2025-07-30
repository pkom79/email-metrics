import { ProcessedCampaign } from '../../dataTypes';
import { InsightResult } from '../types';
import {
  average,
  formatCurrency,
  formatPercent,
  percentageChange,
  groupBy,
  analyzeSubjectLine,
  categorizeCampaignTheme
} from '../calculationHelpers';
import { filterLast90Days } from '../dateUtils';

// Subject Line Revenue Drivers
export function analyzeSubjectLineDrivers(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 20) {
    return {
      insightId: 'subjectLineDrivers',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaign data to analyze subject line patterns'
    };
  }
  
  // Analyze each campaign's subject line
  const campaignAnalysis = recentCampaigns.map(campaign => {
    const analysis = analyzeSubjectLine(campaign.subject);
    const revenuePerRecipient = campaign.emailsSent > 0 ? campaign.revenue / campaign.emailsSent : 0;
    
    return {
      campaign,
      ...analysis,
      revenuePerRecipient
    };
  });
  
  // Analyze impact of each element
  const elementAnalysis = {
    length: {
      short: campaignAnalysis.filter(c => c.length <= 30),
      medium: campaignAnalysis.filter(c => c.length > 30 && c.length <= 50),
      long: campaignAnalysis.filter(c => c.length > 50 && c.length <= 70),
      veryLong: campaignAnalysis.filter(c => c.length > 70)
    },
    emoji: {
      with: campaignAnalysis.filter(c => c.hasEmoji),
      without: campaignAnalysis.filter(c => !c.hasEmoji)
    },
    urgency: {
      with: campaignAnalysis.filter(c => c.hasUrgency),
      without: campaignAnalysis.filter(c => !c.hasUrgency)
    },
    number: {
      with: campaignAnalysis.filter(c => c.hasNumber),
      without: campaignAnalysis.filter(c => !c.hasNumber)
    },
    question: {
      with: campaignAnalysis.filter(c => c.hasQuestion),
      without: campaignAnalysis.filter(c => !c.hasQuestion)
    },
    discount: {
      with: campaignAnalysis.filter(c => c.hasDiscount),
      without: campaignAnalysis.filter(c => !c.hasDiscount)
    }
  };
  
  // Calculate average revenue per recipient for each element
  const elementMetrics = {
    length: {
      short: average(elementAnalysis.length.short.map(c => c.revenuePerRecipient)),
      medium: average(elementAnalysis.length.medium.map(c => c.revenuePerRecipient)),
      long: average(elementAnalysis.length.long.map(c => c.revenuePerRecipient)),
      veryLong: average(elementAnalysis.length.veryLong.map(c => c.revenuePerRecipient))
    },
    emoji: {
      with: average(elementAnalysis.emoji.with.map(c => c.revenuePerRecipient)),
      without: average(elementAnalysis.emoji.without.map(c => c.revenuePerRecipient))
    },
    urgency: {
      with: average(elementAnalysis.urgency.with.map(c => c.revenuePerRecipient)),
      without: average(elementAnalysis.urgency.without.map(c => c.revenuePerRecipient))
    },
    number: {
      with: average(elementAnalysis.number.with.map(c => c.revenuePerRecipient)),
      without: average(elementAnalysis.number.without.map(c => c.revenuePerRecipient))
    },
    question: {
      with: average(elementAnalysis.question.with.map(c => c.revenuePerRecipient)),
      without: average(elementAnalysis.question.without.map(c => c.revenuePerRecipient))
    },
    discount: {
      with: average(elementAnalysis.discount.with.map(c => c.revenuePerRecipient)),
      without: average(elementAnalysis.discount.without.map(c => c.revenuePerRecipient))
    }
  };
  
  // Find best length category
  const lengthCategories = Object.entries(elementMetrics.length);
  const bestLength = lengthCategories.reduce((best, [key, value]) => 
    value > best.value ? { key, value } : best, 
    { key: 'short', value: 0 }
  );
  
  // Calculate impact percentages
  const impacts = {
    emoji: elementMetrics.emoji.with > 0 ? 
      (elementMetrics.emoji.with - elementMetrics.emoji.without) / elementMetrics.emoji.without : 0,
    urgency: elementMetrics.urgency.with > 0 ?
      (elementMetrics.urgency.with - elementMetrics.urgency.without) / elementMetrics.urgency.without : 0,
    number: elementMetrics.number.with > 0 ?
      (elementMetrics.number.with - elementMetrics.number.without) / elementMetrics.number.without : 0,
    question: elementMetrics.question.with > 0 ?
      (elementMetrics.question.with - elementMetrics.question.without) / elementMetrics.question.without : 0,
    discount: elementMetrics.discount.with > 0 ?
      (elementMetrics.discount.with - elementMetrics.discount.without) / elementMetrics.discount.without : 0
  };
  
  // Find winning combination
  const winningCombos = campaignAnalysis.filter(c => {
    const lengthMatch = (bestLength.key === 'short' && c.length <= 30) ||
                       (bestLength.key === 'medium' && c.length > 30 && c.length <= 50) ||
                       (bestLength.key === 'long' && c.length > 50 && c.length <= 70);
    const hasPositiveElements = (impacts.emoji > 0 ? c.hasEmoji : !c.hasEmoji) &&
                               (impacts.urgency > 0 ? c.hasUrgency : !c.hasUrgency) &&
                               (impacts.number > 0 ? c.hasNumber : !c.hasNumber);
    return lengthMatch && hasPositiveElements;
  });
  
  const winningAvgRevenue = average(winningCombos.map(c => c.revenuePerRecipient));
  const overallAvgRevenue = average(campaignAnalysis.map(c => c.revenuePerRecipient));
  
  const summary = `Best formula: ${bestLength.key} length (31-50 chars) + ${Object.entries(impacts).filter(([_, impact]) => impact > 0.1).map(([key]) => key).join(' + ')}`;
  
  const actionsTitle = 'Optimize Your Subject Lines:';
  const actions = [
    `Keep subjects ${bestLength.key} (${bestLength.key === 'short' ? '≤30' : bestLength.key === 'medium' ? '31-50' : '51-70'} chars): ${formatCurrency(bestLength.value)}/recipient`,
    impacts.emoji > 0.1 ? `Add emojis: ${formatPercent(impacts.emoji)} higher revenue` : `Skip emojis: ${formatPercent(Math.abs(impacts.emoji))} lower revenue`,
    impacts.urgency > 0.1 ? `Use urgency words: ${formatPercent(impacts.urgency)} boost` : 'Avoid urgency words in your audience',
    `Your winning formula generates ${formatCurrency(winningAvgRevenue)}/recipient vs ${formatCurrency(overallAvgRevenue)} average`
  ];
  
  return {
    insightId: 'subjectLineDrivers',
    hasSignificantFinding: true,
    data: {
      elementAnalysis,
      elementMetrics,
      impacts,
      bestLength,
      winningCombos,
      winningAvgRevenue
    },
    summary,
    actionsTitle,
    actions
  };
}

// Campaign Spacing Impact
export function analyzeCampaignSpacing(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns)
    .sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime());
  
  if (recentCampaigns.length < 10) {
    return {
      insightId: 'campaignSpacing',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze spacing impact'
    };
  }
  
  // Calculate spacing between consecutive campaigns
  const spacingAnalysis = [];
  for (let i = 1; i < recentCampaigns.length; i++) {
    const prevCampaign = recentCampaigns[i - 1];
    const currCampaign = recentCampaigns[i];
    
    const daysBetween = Math.floor(
      (currCampaign.sentDate.getTime() - prevCampaign.sentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    spacingAnalysis.push({
      campaign: currCampaign,
      prevCampaign,
      daysBetween,
      revenue: currCampaign.revenue,
      revenuePerRecipient: currCampaign.emailsSent > 0 ? 
        currCampaign.revenue / currCampaign.emailsSent : 0,
      openRate: currCampaign.openRate,
      unsubscribeRate: currCampaign.unsubscribesCount / currCampaign.emailsSent
    });
  }
  
  // Group by spacing buckets
  const spacingBuckets = {
    sameDay: spacingAnalysis.filter(s => s.daysBetween === 0),
    nextDay: spacingAnalysis.filter(s => s.daysBetween === 1),
    twoDays: spacingAnalysis.filter(s => s.daysBetween === 2),
    threeDays: spacingAnalysis.filter(s => s.daysBetween === 3),
    fourToSix: spacingAnalysis.filter(s => s.daysBetween >= 4 && s.daysBetween <= 6),
    weekPlus: spacingAnalysis.filter(s => s.daysBetween >= 7)
  };
  
  // Calculate metrics for each bucket
  const bucketMetrics = Object.entries(spacingBuckets).map(([bucket, campaigns]) => ({
    bucket,
    count: campaigns.length,
    avgRevenue: average(campaigns.map(c => c.revenue)),
    avgRevenuePerRecipient: average(campaigns.map(c => c.revenuePerRecipient)),
    avgOpenRate: average(campaigns.map(c => c.openRate)),
    avgUnsubRate: average(campaigns.map(c => c.unsubscribeRate))
  })).filter(b => b.count >= 2); // Need at least 2 instances
  
  if (bucketMetrics.length < 2) {
    return {
      insightId: 'campaignSpacing',
      hasSignificantFinding: false,
      data: spacingAnalysis,
      summary: 'Not enough variety in campaign spacing to identify patterns'
    };
  }
  
  // Find optimal spacing
  const optimalSpacing = bucketMetrics.reduce((best, current) => 
    current.avgRevenuePerRecipient > best.avgRevenuePerRecipient ? current : best
  );
  
  const worstSpacing = bucketMetrics.reduce((worst, current) =>
    current.avgRevenuePerRecipient < worst.avgRevenuePerRecipient ? current : worst
  );
  
  const improvementPotential = optimalSpacing.avgRevenuePerRecipient > 0 ?
    (optimalSpacing.avgRevenuePerRecipient - worstSpacing.avgRevenuePerRecipient) / worstSpacing.avgRevenuePerRecipient : 0;
  
  const summary = `${optimalSpacing.bucket} spacing: ${formatCurrency(optimalSpacing.avgRevenuePerRecipient)}/recipient (${percentageChange(worstSpacing.avgRevenuePerRecipient, optimalSpacing.avgRevenuePerRecipient)} vs ${worstSpacing.bucket})`;
  
  const actionsTitle = 'Optimize Campaign Frequency:';
  const actions = [
    `Use ${optimalSpacing.bucket === 'twoDays' ? '2-day' : optimalSpacing.bucket === 'threeDays' ? '3-day' : optimalSpacing.bucket} spacing for best results`,
    `Avoid ${worstSpacing.bucket} spacing: ${formatPercent(improvementPotential)} lower revenue`,
    optimalSpacing.avgUnsubRate < worstSpacing.avgUnsubRate ? 
      `${optimalSpacing.bucket} spacing also reduces unsubscribes by ${formatPercent((worstSpacing.avgUnsubRate - optimalSpacing.avgUnsubRate) / worstSpacing.avgUnsubRate)}` :
      `Monitor unsubscribe rates with increased frequency`,
    `Create a content calendar with optimal ${optimalSpacing.bucket} spacing`
  ];
  
  return {
    insightId: 'campaignSpacing',
    hasSignificantFinding: improvementPotential > 0.2,
    data: {
      spacingAnalysis,
      bucketMetrics,
      optimalSpacing,
      worstSpacing
    },
    summary,
    actionsTitle,
    actions
  };
}

// Zero-Order High-Engagement Campaigns
export function analyzeZeroOrderCampaigns(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  // Calculate average open and click rates
  const avgOpenRate = average(recentCampaigns.map(c => c.openRate));
  const avgClickRate = average(recentCampaigns.map(c => c.clickRate));
  
  // Find campaigns with high engagement but zero orders
  const zeroOrderHighEngagement = recentCampaigns.filter(campaign => 
    campaign.totalOrders === 0 &&
    campaign.openRate > avgOpenRate &&
    campaign.clickRate > avgClickRate &&
    campaign.uniqueClicks > 10 // Minimum clicks to be significant
  );
  
  if (zeroOrderHighEngagement.length === 0) {
    return {
      insightId: 'zeroOrderHighEngagement',
      hasSignificantFinding: false,
      data: null,
      summary: 'All high-engagement campaigns generated orders'
    };
  }
  
  // Analyze common themes
  const themes = zeroOrderHighEngagement.map(c => categorizeCampaignTheme(c.subject, c.subject));
  const themeCount = themes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantTheme = Object.entries(themeCount).reduce((best, [theme, count]) =>
    count > best.count ? { theme, count } : best,
    { theme: '', count: 0 }
  );
  
  // Calculate wasted engagement
  const totalWastedClicks = zeroOrderHighEngagement.reduce((sum, c) => sum + c.uniqueClicks, 0);
  const avgConversionRate = recentCampaigns.filter(c => c.uniqueClicks > 0).reduce((sum, c) => 
    sum + (c.totalOrders / c.uniqueClicks), 0) / recentCampaigns.filter(c => c.uniqueClicks > 0).length;
  const potentialLostOrders = Math.floor(totalWastedClicks * avgConversionRate);
  const potentialLostRevenue = potentialLostOrders * average(recentCampaigns.filter(c => c.totalOrders > 0).map(c => c.revenue / c.totalOrders));
  
  const summary = `${zeroOrderHighEngagement.length} campaigns: ${formatPercent(avgOpenRate)}+ opens, ${formatPercent(avgClickRate)}+ clicks, ZERO orders`;
  
  const actionsTitle = 'Fix Conversion Blockers:';
  const actions = [
    `Review these campaigns for broken links: ${zeroOrderHighEngagement.slice(0, 3).map(c => c.subject).join(', ')}`,
    `${totalWastedClicks} interested clicks wasted = ${formatCurrency(potentialLostRevenue)} potential revenue`,
    dominantTheme.count > 1 ? `${dominantTheme.theme} campaigns showing pattern of engagement without conversion` : 'Check landing page experience for mobile users',
    'Set up conversion tracking to identify where customers drop off'
  ];
  
  return {
    insightId: 'zeroOrderHighEngagement',
    hasSignificantFinding: true,
    data: {
      campaigns: zeroOrderHighEngagement,
      totalWastedClicks,
      potentialLostRevenue,
      themes: themeCount,
      dominantTheme
    },
    summary,
    actionsTitle,
    actions
  };
}

// Campaign Theme Performance Analysis
export function analyzeCampaignThemes(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  if (recentCampaigns.length < 15) {
    return {
      insightId: 'campaignThemes',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns to analyze theme performance'
    };
  }
  
  // Categorize each campaign
  const campaignsWithThemes = recentCampaigns.map(campaign => ({
    campaign,
    theme: categorizeCampaignTheme(campaign.subject, campaign.subject),
    revenuePerRecipient: campaign.emailsSent > 0 ? campaign.revenue / campaign.emailsSent : 0
  }));
  
  // Group by theme
  const themeGroups = groupBy(campaignsWithThemes, c => c.theme);
  
  // Calculate metrics for each theme
  const themeMetrics = Array.from(themeGroups.entries()).map(([theme, campaigns]) => {
    const revenues = campaigns.map(c => c.revenuePerRecipient);
    const campaignList = campaigns.map(c => c.campaign);
    
    return {
      theme,
      count: campaigns.length,
      avgRevenuePerRecipient: average(revenues),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.campaign.revenue, 0),
      avgOpenRate: average(campaignList.map(c => c.openRate)),
      avgClickRate: average(campaignList.map(c => c.clickRate)),
      examples: campaigns.slice(0, 2).map(c => c.campaign.subject)
    };
  }).filter(t => t.count >= 2); // Need at least 2 campaigns per theme
  
  if (themeMetrics.length < 2) {
    return {
      insightId: 'campaignThemes',
      hasSignificantFinding: false,
      data: themeMetrics,
      summary: 'Not enough theme variety to identify patterns'
    };
  }
  
  // Sort by revenue per recipient
  const sortedThemes = [...themeMetrics].sort((a, b) => b.avgRevenuePerRecipient - a.avgRevenuePerRecipient);
  const bestTheme = sortedThemes[0];
  const worstTheme = sortedThemes[sortedThemes.length - 1];
  
  // Find underutilized high performers
  const avgCampaignsPerTheme = average(themeMetrics.map(t => t.count));
  const underutilized = sortedThemes.filter(t => 
    t.avgRevenuePerRecipient > average(themeMetrics.map(m => m.avgRevenuePerRecipient)) &&
    t.count < avgCampaignsPerTheme
  );
  
  const summary = underutilized.length > 0 ?
    `${underutilized[0].theme}: ${formatCurrency(underutilized[0].avgRevenuePerRecipient)}/recipient (only ${underutilized[0].count} sent) ← UNDERUTILIZED` :
    `${bestTheme.theme} performs best: ${formatCurrency(bestTheme.avgRevenuePerRecipient)}/recipient`;
  
  const actionsTitle = 'Optimize Content Strategy:';
  const actions = underutilized.length > 0 ? [
    `Send more ${underutilized[0].theme} emails: ${percentageChange(worstTheme.avgRevenuePerRecipient, underutilized[0].avgRevenuePerRecipient)} better than ${worstTheme.theme}`,
    `Your ${underutilized[0].count} ${underutilized[0].theme} campaigns averaged ${formatCurrency(underutilized[0].totalRevenue / underutilized[0].count)} each`,
    `Best performers: ${sortedThemes.slice(0, 3).map(t => `${t.theme} (${formatCurrency(t.avgRevenuePerRecipient)}/email)`).join(', ')}`,
    `Reduce ${worstTheme.theme} campaigns: Only ${formatCurrency(worstTheme.avgRevenuePerRecipient)}/recipient`
  ] : [
    `Continue focusing on ${bestTheme.theme}: ${formatCurrency(bestTheme.avgRevenuePerRecipient)}/recipient`,
    `Your content mix is well-balanced with ${themeMetrics.length} active themes`,
    `Consider testing: Combine ${bestTheme.theme} with ${sortedThemes[1].theme} elements`,
    `Phase out ${worstTheme.theme}: ${percentageChange(bestTheme.avgRevenuePerRecipient, worstTheme.avgRevenuePerRecipient)} lower performance`
  ];
  
  return {
    insightId: 'campaignThemes',
    hasSignificantFinding: true,
    data: {
      themeMetrics: sortedThemes,
      bestTheme,
      worstTheme,
      underutilized
    },
    summary,
    actionsTitle,
    actions
  };
}

// Click-to-Purchase Conversion Drop-off
export function analyzeClickToPurchaseDropoff(campaigns: ProcessedCampaign[]): InsightResult {
  const recentCampaigns = filterLast90Days(campaigns);
  
  // Filter campaigns with clicks
  const campaignsWithClicks = recentCampaigns.filter(c => c.uniqueClicks > 10);
  
  if (campaignsWithClicks.length < 10) {
    return {
      insightId: 'clickToPurchaseDropoff',
      hasSignificantFinding: false,
      data: null,
      summary: 'Not enough campaigns with clicks to analyze conversion'
    };
  }
  
  // Calculate conversion rates
  const campaignConversions = campaignsWithClicks.map(campaign => {
    const conversionRate = campaign.uniqueClicks > 0 ? 
      campaign.totalOrders / campaign.uniqueClicks : 0;
    const revenuePerClick = campaign.uniqueClicks > 0 ?
      campaign.revenue / campaign.uniqueClicks : 0;
    
    return {
      campaign,
      conversionRate,
      revenuePerClick,
      clicks: campaign.uniqueClicks,
      orders: campaign.totalOrders
    };
  });
  
  // Calculate averages
  const avgClickRate = average(campaignsWithClicks.map(c => c.clickRate));
  const avgConversionRate = average(campaignConversions.map(c => c.conversionRate));
  
  // Find high-click, low-conversion campaigns
  const highClickLowConversion = campaignConversions.filter(c =>
    c.campaign.clickRate > avgClickRate &&
    c.conversionRate < avgConversionRate * 0.5 // Less than half average conversion
  );
  
  if (highClickLowConversion.length === 0) {
    return {
      insightId: 'clickToPurchaseDropoff',
      hasSignificantFinding: false,
      data: campaignConversions,
      summary: 'Click-to-purchase conversion rates are healthy across campaigns'
    };
  }
  
  // Calculate lost revenue potential
  const lostOpportunities = highClickLowConversion.map(c => {
    const expectedOrders = c.clicks * avgConversionRate;
    const actualOrders = c.orders;
    const lostOrders = expectedOrders - actualOrders;
    const avgOrderValue = c.campaign.revenue > 0 && c.orders > 0 ? 
      c.campaign.revenue / c.orders : 
      average(campaignsWithClicks.filter(camp => camp.totalOrders > 0).map(camp => camp.revenue / camp.totalOrders));
    const lostRevenue = lostOrders * avgOrderValue;
    
    return {
      ...c,
      expectedOrders,
      lostOrders,
      lostRevenue
    };
  });
  
  const totalLostRevenue = lostOpportunities.reduce((sum, opp) => sum + opp.lostRevenue, 0);
  const worstPerformer = lostOpportunities.sort((a, b) => b.lostRevenue - a.lostRevenue)[0];
  
  const summary = `${highClickLowConversion.length} campaigns: ${formatPercent(avgClickRate)}+ clicks but ${formatPercent((avgConversionRate - average(highClickLowConversion.map(c => c.conversionRate))) / avgConversionRate)} worse conversion`;
  
  const actionsTitle = 'Fix Conversion Issues:';
  const actions = [
    `Priority fix: "${worstPerformer.campaign.subject}" - ${worstPerformer.clicks} clicks, only ${worstPerformer.orders} orders`,
    `Lost revenue potential: ${formatCurrency(totalLostRevenue)} from poor conversion`,
    'Check: Mobile experience, page load speed, checkout process',
    `These ${highClickLowConversion.length} campaigns need landing page optimization`
  ];
  
  return {
    insightId: 'clickToPurchaseDropoff',
    hasSignificantFinding: true,
    data: {
      campaignConversions,
      highClickLowConversion,
      lostOpportunities,
      totalLostRevenue,
      avgConversionRate
    },
    summary,
    actionsTitle,
    actions
  };
}
