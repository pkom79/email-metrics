// ADD THIS AS THE FIRST IMPORT
import {
  ProcessedCampaign,
  ProcessedFlowEmail,
  ProcessedSubscriber,
  FlowSequenceInfo,
  DayOfWeekPerformanceData,
  HourOfDayPerformanceData,
  AggregatedMetrics,
  AudienceInsights
} from './dataTypes';

// Then the rest of your existing code follows...

// Raw data interfaces matching CSV structure exactly
export interface RawCampaignData {
  campaign_name: string; send_time: string; // DateTime string
  total_recipients: number;
  unique_opens: number;
  open_rate: string; // "27.05%"
  unique_clicks: number;
  click_rate: string; // "4.09%"
  unique_placed_order: number;
  placed_order_rate: string; // "2.99%"
  revenue: number;
  unsubscribes: number;
  spam_complaints: number;
  spam_complaints_rate: string; // "0.01%"
  bounces: number;
  bounce_rate: string; // "0.30%"
}

export interface RawFlowData {
  day: string; // YYYY-MM-DD
  flow_id: string; // Added: Flow ID (e.g., "XrnrPi")
  flow_name: string;
  flow_message_id: string; // Added: Flow Message ID (e.g., "Ryjfdv")
  delivered: number;
  unique_opens: number;
  open_rate: number; // Decimal 0.25 = 25%
  unique_clicks: number;
  click_rate: number; // Decimal 0.04 = 4%
  placed_order: number;
  placed_order_rate: number; // Decimal 0.02 = 2%
  revenue: number;
  revenue_per_recipient: number;
  unsub_rate: number; // Decimal 0.004 = 0.4%
  complaint_rate: number; // Decimal 0.001 = 0.1%
  bounce_rate: number; // Decimal 0.02 = 2%
}


// Fixed reference date for consistent behavior
const REFERENCE_DATE = new Date('2025-01-18T10:00:00');

// Helper function to parse percentage strings ("27.05%" -> 27.05)
const parsePercentageString = (percentStr: string): number => {
  return parseFloat(percentStr.replace('%', ''));
};

// Helper function to generate random date within range
const getRandomDate = (daysAgo: number, variance: number = 0): Date => {
  const date = new Date(REFERENCE_DATE);
  const actualDaysAgo = daysAgo + (Math.random() - 0.5) * variance;
  date.setDate(date.getDate() - actualDaysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

// Parse and calculate all metrics for campaigns
export const parseCampaignCsvRow = (raw: RawCampaignData, id: number): ProcessedCampaign => {
  const sentDate = new Date(raw.send_time);
  const emailsSent = raw.total_recipients;
  const uniqueOpens = raw.unique_opens;
  const uniqueClicks = raw.unique_clicks;
  const totalOrders = raw.unique_placed_order;
  const revenue = raw.revenue;
  const unsubscribesCount = raw.unsubscribes;
  const spamComplaintsCount = raw.spam_complaints;
  const bouncesCount = raw.bounces;

  // Calculate derived rates from raw counts (don't trust CSV rates)
  const openRate = emailsSent > 0 ? (uniqueOpens / emailsSent) * 100 : 0;
  const clickRate = emailsSent > 0 ? (uniqueClicks / emailsSent) * 100 : 0;
  const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
  const conversionRate = uniqueClicks > 0 ? (totalOrders / uniqueClicks) * 100 : 0;
  const revenuePerEmail = emailsSent > 0 ? revenue / emailsSent : 0;
  const unsubscribeRate = emailsSent > 0 ? (unsubscribesCount / emailsSent) * 100 : 0;
  const spamRate = emailsSent > 0 ? (spamComplaintsCount / emailsSent) * 100 : 0;
  const bounceRate = emailsSent > 0 ? (bouncesCount / emailsSent) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return {
    id,
    campaignName: raw.campaign_name,
    subject: raw.campaign_name,
    sentDate,
    dayOfWeek: sentDate.getDay(),
    hourOfDay: sentDate.getHours(),
    emailsSent,
    uniqueOpens,
    uniqueClicks,
    totalOrders,
    revenue,
    unsubscribesCount,
    spamComplaintsCount,
    bouncesCount,
    openRate,
    clickRate,
    clickToOpenRate,
    conversionRate,
    revenuePerEmail,
    unsubscribeRate,
    spamRate,
    bounceRate,
    avgOrderValue
  };
};

// Parse and calculate all metrics for flow emails
export const parseFlowCsvRow = (raw: RawFlowData, id: number, sequencePosition: number): ProcessedFlowEmail => {
  const sentDate = new Date(raw.day);
  const emailsSent = raw.delivered;
  const uniqueOpens = raw.unique_opens;
  const uniqueClicks = raw.unique_clicks;
  const totalOrders = raw.placed_order;
  const revenue = raw.revenue;

  // Calculate counts from rates (flows only provide rates for unsubs/spam/bounces)
  const unsubscribesCount = Math.round(emailsSent * raw.unsub_rate);
  const spamComplaintsCount = Math.round(emailsSent * raw.complaint_rate);
  const bouncesCount = Math.round(emailsSent * raw.bounce_rate);

  // Calculate derived rates from raw counts
  const openRate = emailsSent > 0 ? (uniqueOpens / emailsSent) * 100 : 0;
  const clickRate = emailsSent > 0 ? (uniqueClicks / emailsSent) * 100 : 0;
  const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
  const conversionRate = uniqueClicks > 0 ? (totalOrders / uniqueClicks) * 100 : 0;
  const revenuePerEmail = emailsSent > 0 ? revenue / emailsSent : 0;
  const unsubscribeRate = raw.unsub_rate * 100;
  const spamRate = raw.complaint_rate * 100;
  const bounceRate = raw.bounce_rate * 100;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  // Get email name from flow templates or use generic name
  const flowTemplate = flowTemplates.find(f => f.name === raw.flow_name);
  const emailName = flowTemplate && flowTemplate.emails[sequencePosition - 1]
    ? flowTemplate.emails[sequencePosition - 1]
    : `Email ${sequencePosition}`;

  return {
    id,
    flowId: raw.flow_id,
    flowName: raw.flow_name,
    flowMessageId: raw.flow_message_id,
    emailName,
    sequencePosition,
    sentDate,
    status: 'live',
    emailsSent,
    uniqueOpens,
    uniqueClicks,
    totalOrders,
    revenue,
    unsubscribesCount,
    spamComplaintsCount,
    bouncesCount,
    openRate,
    clickRate,
    clickToOpenRate,
    conversionRate,
    revenuePerEmail,
    unsubscribeRate,
    spamRate,
    bounceRate,
    avgOrderValue
  };
};

// Campaign subject templates
const campaignSubjects = [
  'Flash Sale: {discount}% Off Everything!',
  'New Arrivals You\'ll Love',
  'Your Cart is Waiting...',
  'Weekend Special: Free Shipping',
  'Back in Stock Alert!',
  'Exclusive Member Benefits',
  'Last Chance: Sale Ends Tonight',
  'Holiday Collection Preview',
  'Thank You for Your Loyalty',
  'Year-End Clearance Event',
  'Summer Sale Starts Now!',
  'Limited Time: Buy One Get One',
  'VIP Early Access Sale',
  'Trending Now: Must-Have Items',
  'Don\'t Miss Out: Final Hours',
  'New Season, New Style',
  'Customer Favorites Are Back',
  'Surprise! Flash Sale Alert',
  'Your Wishlist Items on Sale',
  'Exclusive Offer Just for You',
  'Hot Deals This Week',
  'Free Gift with Purchase',
  'Pre-Order Now Available',
  'Top Picks for You',
  'Restocked: Popular Items',
  'End of Season Clearance',
  'Black Friday Preview',
  'Cyber Monday Deals',
  'Valentine\'s Day Special',
  'Mother\'s Day Collection',
  'Father\'s Day Gifts',
  'Back to School Sale',
  'Fall Fashion Arrivals',
  'Winter Warmth Collection',
  'Spring Refresh Sale',
  'Anniversary Celebration',
  'Member Appreciation Day',
  'Double Points Weekend',
  'Free Shipping Friday',
  'Midnight Flash Sale'
];

// Flow names and email templates
const flowTemplates = [
  {
    name: 'Welcome Series',
    emails: ['Welcome Email', 'Getting Started', 'First Purchase Incentive', 'Brand Story', 'Customer Reviews']
  },
  {
    name: 'Abandoned Cart',
    emails: ['Cart Reminder', 'Limited Stock Alert', 'Special Discount', 'Final Notice']
  },
  {
    name: 'Post-Purchase',
    emails: ['Order Confirmation', 'Shipping Notification', 'Delivery Confirmation', 'Review Request', 'Cross-sell']
  },
  {
    name: 'Win-Back Campaign',
    emails: ['We Miss You', 'Special Comeback Offer', 'What\'s New', 'Final Attempt']
  },
  {
    name: 'Browse Abandonment',
    emails: ['Continue Shopping', 'Similar Products', 'Trending Items', 'Come Back Soon']
  },
  {
    name: 'VIP Program',
    emails: ['VIP Welcome', 'Exclusive Perks', 'Early Access', 'Bonus Points', 'VIP Renewal']
  },
  {
    name: 'Birthday Campaign',
    emails: ['Birthday Surprise', 'Special Birthday Offer', 'Birthday Month Perks']
  },
  {
    name: 'Product Education',
    emails: ['How to Use', 'Pro Tips', 'Style Guide', 'Care Instructions', 'Advanced Features']
  },
  {
    name: 'Seasonal Campaign',
    emails: ['Season Preview', 'Trending Styles', 'Weather Alert', 'Seasonal Care Tips']
  },
  {
    name: 'Loyalty Program',
    emails: ['Points Update', 'Reward Available', 'Tier Upgrade', 'Expiring Points', 'Member Benefits']
  }
];

// Generate unique flow IDs for each flow template
const flowIds = flowTemplates.map(() => `fl_${Math.random().toString(36).substr(2, 6)}`);

// Generate realistic campaign raw data
const generateRawCampaignData = (index: number): RawCampaignData => {
  const daysAgo = Math.floor(Math.random() * 545); // Up to 1.5 years ago
  const sendTime = getRandomDate(daysAgo, 3);
  const totalRecipients = Math.floor(8000 + Math.random() * 12000); // 8k-20k emails

  // Generate realistic engagement numbers
  const openRate = 15 + Math.random() * 25; // 15-40%
  const uniqueOpens = Math.floor(totalRecipients * (openRate / 100));

  const clickRate = 1 + Math.random() * 6; // 1-7%
  const uniqueClicks = Math.floor(totalRecipients * (clickRate / 100));

  const placedOrderRate = 0.5 + Math.random() * 3; // 0.5-3.5%
  const uniquePlacedOrder = Math.floor(totalRecipients * (placedOrderRate / 100));

  const avgOrderValue = 50 + Math.random() * 100; // $50-150
  const revenue = uniquePlacedOrder * avgOrderValue;

  const unsubscribes = Math.floor(totalRecipients * (0.05 + Math.random() * 0.4) / 100); // 0.05-0.45%
  const spamComplaints = Math.floor(totalRecipients * (0.01 + Math.random() * 0.1) / 100); // 0.01-0.11%
  const bounces = Math.floor(totalRecipients * (0.5 + Math.random() * 3) / 100); // 0.5-3.5%

  const subject = campaignSubjects[index % campaignSubjects.length]
    .replace('{discount}', String(Math.floor(Math.random() * 50) + 10));

  return {
    campaign_name: subject,
    send_time: sendTime.toISOString(),
    total_recipients: totalRecipients,
    unique_opens: uniqueOpens,
    open_rate: `${openRate.toFixed(2)}%`,
    unique_clicks: uniqueClicks,
    click_rate: `${clickRate.toFixed(2)}%`,
    unique_placed_order: uniquePlacedOrder,
    placed_order_rate: `${placedOrderRate.toFixed(2)}%`,
    revenue: revenue,
    unsubscribes: unsubscribes,
    spam_complaints: spamComplaints,
    spam_complaints_rate: `${(spamComplaints / totalRecipients * 100).toFixed(2)}%`,
    bounces: bounces,
    bounce_rate: `${(bounces / totalRecipients * 100).toFixed(2)}%`
  };
};

// Generate flow message IDs for each email in each flow
const generateFlowMessageIds = () => {
  const messageIds: Record<string, string[]> = {};

  flowTemplates.forEach((flow, flowIndex) => {
    messageIds[flow.name] = flow.emails.map(() =>
      `msg_${Math.random().toString(36).substr(2, 6)}`
    );
  });

  return messageIds;
};

const flowMessageIds = generateFlowMessageIds();

// Generate realistic flow raw data with proper sequencing
const generateRawFlowData = (): RawFlowData[] => {
  const flowData: RawFlowData[] = [];

  // For each flow template
  flowTemplates.forEach((flowTemplate, flowIndex) => {
    const flowId = flowIds[flowIndex];
    const messageIds = flowMessageIds[flowTemplate.name];

    // For each email in the flow sequence
    flowTemplate.emails.forEach((emailName, emailIndex) => {
      const messageId = messageIds[emailIndex];

      // Generate data points for different days
      const daysToGenerate = 30 + Math.floor(Math.random() * 60); // 30-90 days of data

      for (let i = 0; i < daysToGenerate; i++) {
        const daysAgo = Math.floor(Math.random() * 545); // Up to 1.5 years ago
        const day = getRandomDate(daysAgo, 1);

        // Decrease volume for later emails in sequence (natural drop-off)
        const volumeMultiplier = Math.pow(0.7, emailIndex); // 70% of previous email's volume
        const delivered = Math.floor((1000 + Math.random() * 4000) * volumeMultiplier);

        // Generate realistic engagement numbers (decreasing with sequence)
        const baseOpenRate = 0.25 - (emailIndex * 0.03); // Decrease by 3% per email
        const openRate = Math.max(0.1, baseOpenRate + (Math.random() - 0.5) * 0.1);
        const uniqueOpens = Math.floor(delivered * openRate);

        const baseClickRate = 0.04 - (emailIndex * 0.005); // Decrease by 0.5% per email
        const clickRate = Math.max(0.01, baseClickRate + (Math.random() - 0.5) * 0.02);
        const uniqueClicks = Math.floor(delivered * clickRate);

        const basePlacedOrderRate = 0.02 - (emailIndex * 0.003); // Decrease by 0.3% per email
        const placedOrderRate = Math.max(0.005, basePlacedOrderRate + (Math.random() - 0.5) * 0.01);
        const placedOrder = Math.floor(delivered * placedOrderRate);

        const avgOrderValue = 50 + Math.random() * 100; // $50-150
        const revenue = placedOrder * avgOrderValue;
        const revenuePerRecipient = delivered > 0 ? revenue / delivered : 0;

        const unsubRate = 0.0005 + Math.random() * 0.004; // 0.05-0.45% as decimal
        const complaintRate = 0.0001 + Math.random() * 0.001; // 0.01-0.11% as decimal
        const bounceRate = 0.005 + Math.random() * 0.03; // 0.5-3.5% as decimal

        flowData.push({
          day: day.toISOString().split('T')[0], // YYYY-MM-DD format
          flow_id: flowId,
          flow_name: flowTemplate.name,
          flow_message_id: messageId,
          delivered: delivered,
          unique_opens: uniqueOpens,
          open_rate: openRate,
          unique_clicks: uniqueClicks,
          click_rate: clickRate,
          placed_order: placedOrder,
          placed_order_rate: placedOrderRate,
          revenue: revenue,
          revenue_per_recipient: revenuePerRecipient,
          unsub_rate: unsubRate,
          complaint_rate: complaintRate,
          bounce_rate: bounceRate
        });
      }
    });
  });

  // Sort by flow name, then by date to simulate CSV structure
  return flowData.sort((a, b) => {
    if (a.flow_name !== b.flow_name) {
      return a.flow_name.localeCompare(b.flow_name);
    }
    // For same flow, keep message order stable
    const aMessageIndex = flowMessageIds[a.flow_name].indexOf(a.flow_message_id);
    const bMessageIndex = flowMessageIds[b.flow_name].indexOf(b.flow_message_id);
    if (aMessageIndex !== bMessageIndex) {
      return aMessageIndex - bMessageIndex;
    }
    return new Date(a.day).getTime() - new Date(b.day).getTime();
  });
};

// Generate raw campaign data and process it
const rawCampaignData: RawCampaignData[] = Array.from({ length: 100 }, (_, index) =>
  generateRawCampaignData(index)
);

// Generate raw flow data
const rawFlowData: RawFlowData[] = generateRawFlowData();

// Process all data using the parsing functions
export const ALL_CAMPAIGNS: ProcessedCampaign[] = rawCampaignData.map((raw, index) =>
  parseCampaignCsvRow(raw, index + 1)
);

// Process flow data with sequence position tracking
export const ALL_FLOW_EMAILS: ProcessedFlowEmail[] = (() => {
  const processedFlows: ProcessedFlowEmail[] = [];
  let id = 1;

  // Track sequence positions for each flow
  const flowSequenceMap: Record<string, Record<string, number>> = {};

  // First pass: identify sequence positions
  rawFlowData.forEach(raw => {
    if (!flowSequenceMap[raw.flow_id]) {
      flowSequenceMap[raw.flow_id] = {};
    }

    if (!flowSequenceMap[raw.flow_id][raw.flow_message_id]) {
      const sequencePosition = Object.keys(flowSequenceMap[raw.flow_id]).length + 1;
      flowSequenceMap[raw.flow_id][raw.flow_message_id] = sequencePosition;
    }
  });

  // Second pass: process with sequence positions
  rawFlowData.forEach(raw => {
    const sequencePosition = flowSequenceMap[raw.flow_id][raw.flow_message_id];
    processedFlows.push(parseFlowCsvRow(raw, id++, sequencePosition));
  });

  return processedFlows;
})();

// Helper to get unique flow names
export const getUniqueFlowNames = (): string[] => {
  return Array.from(new Set(ALL_FLOW_EMAILS.map(email => email.flowName))).sort();
};

// Helper to get the most recent email date
export const getLastEmailDate = (): Date => {
  const campaignDates = ALL_CAMPAIGNS.map(c => c.sentDate);
  const flowDates = ALL_FLOW_EMAILS.map(f => f.sentDate);
  const allDates = [...campaignDates, ...flowDates];
  return new Date(Math.max(...allDates.map(d => d.getTime())));
};

// Helper function to get time-series data for sparklines
export const getMetricTimeSeries = (
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[],
  metricKey: string,
  dateRange: string,
  granularity: 'daily' | 'weekly' | 'monthly'
): { value: number; date: string }[] => {
  const allEmails = [...campaigns, ...flows];

  if (allEmails.length === 0) {
    return [];
  }

  // Determine date range
  const endDate = new Date(REFERENCE_DATE);
  let startDate = new Date(endDate);

  if (dateRange === 'all') {
    const oldestDate = Math.min(...allEmails.map(e => e.sentDate.getTime()));
    startDate = new Date(oldestDate);
  } else {
    const days = parseInt(dateRange.replace('d', ''));
    startDate.setDate(startDate.getDate() - days);
  }

  // Filter emails within date range
  const filteredEmails = allEmails.filter(email =>
    email.sentDate >= startDate && email.sentDate <= endDate
  );

  // Create time buckets based on granularity
  const buckets = new Map<string, typeof allEmails>();

  filteredEmails.forEach(email => {
    let bucketKey: string;
    const date = new Date(email.sentDate);

    switch (granularity) {
      case 'daily':
        bucketKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        // Get Monday of the week
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        bucketKey = monday.toISOString().split('T')[0];
        break;
      case 'monthly':
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(email);
  });

  // Convert buckets to time series data
  const timeSeriesData: { value: number; date: string }[] = [];

  // Sort bucket keys chronologically
  const sortedKeys = Array.from(buckets.keys()).sort();

  sortedKeys.forEach(bucketKey => {
    const emailsInBucket = buckets.get(bucketKey)!;
    let value: number;

    // Calculate metric value based on type using processed data
    if (['revenue', 'avgOrderValue', 'revenuePerEmail'].includes(metricKey)) {
      if (metricKey === 'revenue') {
        value = emailsInBucket.reduce((sum, email) => sum + email.revenue, 0);
      } else if (metricKey === 'avgOrderValue') {
        const totalRevenue = emailsInBucket.reduce((sum, email) => sum + email.revenue, 0);
        const totalOrders = emailsInBucket.reduce((sum, email) => sum + email.totalOrders, 0);
        value = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      } else { // revenuePerEmail
        const totalRevenue = emailsInBucket.reduce((sum, email) => sum + email.revenue, 0);
        const totalEmailsSent = emailsInBucket.reduce((sum, email) => sum + email.emailsSent, 0);
        value = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;
      }
    } else if (['emailsSent', 'totalOrders'].includes(metricKey)) {
      value = emailsInBucket.reduce((sum, email) => {
        const val = email[metricKey as keyof typeof email];
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    } else {
      // Rate metrics - calculate weighted average using processed counts
      const totalEmailsSent = emailsInBucket.reduce((sum, email) => sum + email.emailsSent, 0);
      if (totalEmailsSent === 0) {
        value = 0;
      } else {
        if (metricKey === 'openRate') {
          const totalOpens = emailsInBucket.reduce((sum, email) => sum + email.uniqueOpens, 0);
          value = (totalOpens / totalEmailsSent) * 100;
        } else if (metricKey === 'clickRate') {
          const totalClicks = emailsInBucket.reduce((sum, email) => sum + email.uniqueClicks, 0);
          value = (totalClicks / totalEmailsSent) * 100;
        } else if (metricKey === 'clickToOpenRate') {
          const totalOpens = emailsInBucket.reduce((sum, email) => sum + email.uniqueOpens, 0);
          const totalClicks = emailsInBucket.reduce((sum, email) => sum + email.uniqueClicks, 0);
          value = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
        } else if (metricKey === 'conversionRate') {
          const totalClicks = emailsInBucket.reduce((sum, email) => sum + email.uniqueClicks, 0);
          const totalOrders = emailsInBucket.reduce((sum, email) => sum + email.totalOrders, 0);
          value = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
        } else if (metricKey === 'unsubscribeRate') {
          const totalUnsubs = emailsInBucket.reduce((sum, email) => sum + email.unsubscribesCount, 0);
          value = (totalUnsubs / totalEmailsSent) * 100;
        } else if (metricKey === 'spamRate') {
          const totalSpam = emailsInBucket.reduce((sum, email) => sum + email.spamComplaintsCount, 0);
          value = (totalSpam / totalEmailsSent) * 100;
        } else if (metricKey === 'bounceRate') {
          const totalBounces = emailsInBucket.reduce((sum, email) => sum + email.bouncesCount, 0);
          value = (totalBounces / totalEmailsSent) * 100;
        } else {
          // Fallback to weighted average of pre-calculated rates
          const weightedSum = emailsInBucket.reduce((sum, email) =>
            sum + (email[metricKey as keyof typeof email] as number * email.emailsSent), 0
          );
          value = weightedSum / totalEmailsSent;
        }
      }
    }

    // Format date for display
    let displayDate: string;
    switch (granularity) {
      case 'daily':
        displayDate = new Date(bucketKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'weekly':
        displayDate = new Date(bucketKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'monthly':
        const [year, month] = bucketKey.split('-');
        displayDate = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        break;
    }

    timeSeriesData.push({ value, date: displayDate });
  });

  return timeSeriesData;
};

// New helper function for flow step analysis
export const getFlowStepTimeSeries = (
  flowEmails: ProcessedFlowEmail[],
  flowName: string,
  sequencePosition: number,
  metricKey: string,
  dateRange: string,
  granularity: 'daily' | 'weekly' | 'monthly'
): { value: number; date: string }[] => {
  // Filter emails for specific flow and sequence position
  const stepEmails = flowEmails.filter(email =>
    email.flowName === flowName && email.sequencePosition === sequencePosition
  );

  return getMetricTimeSeries([], stepEmails, metricKey, dateRange, granularity);
};

// Get flow sequence information
export const getFlowSequenceInfo = (flowName: string): {
  flowId: string;
  messageIds: string[];
  emailNames: string[];
  sequenceLength: number;
} => {
  const flowEmails = ALL_FLOW_EMAILS.filter(email => email.flowName === flowName);
  if (flowEmails.length === 0) {
    return { flowId: '', messageIds: [], emailNames: [], sequenceLength: 0 };
  }

  // Get unique sequence positions
  const sequenceMap = new Map<number, { messageId: string; emailName: string }>();

  flowEmails.forEach(email => {
    if (!sequenceMap.has(email.sequencePosition)) {
      sequenceMap.set(email.sequencePosition, {
        messageId: email.flowMessageId,
        emailName: email.emailName
      });
    }
  });

  // Sort by sequence position
  const sortedSequence = Array.from(sequenceMap.entries())
    .sort((a, b) => a[0] - b[0]);

  return {
    flowId: flowEmails[0].flowId,
    messageIds: sortedSequence.map(([_, data]) => data.messageId),
    emailNames: sortedSequence.map(([_, data]) => data.emailName),
    sequenceLength: sortedSequence.length
  };
};

//

// Function to aggregate campaign performance by day of week
export const getCampaignPerformanceByDayOfWeek = (
  campaigns: ProcessedCampaign[],
  metricKey: string
): DayOfWeekPerformanceData[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Initialize data for all days
  const dayData = dayNames.map((day, index) => ({
    day,
    dayIndex: index,
    value: 0,
    campaignCount: 0,
    // Temporary aggregation fields
    totalRevenue: 0,
    totalEmailsSent: 0,
    totalOrders: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalUnsubs: 0,
    totalSpam: 0,
    totalBounces: 0
  }));

  // Aggregate data by day of week
  campaigns.forEach(campaign => {
    const dayIndex = campaign.dayOfWeek;
    const dayEntry = dayData[dayIndex];

    dayEntry.campaignCount++;
    dayEntry.totalRevenue += campaign.revenue;
    dayEntry.totalEmailsSent += campaign.emailsSent;
    dayEntry.totalOrders += campaign.totalOrders;
    dayEntry.totalOpens += campaign.uniqueOpens;
    dayEntry.totalClicks += campaign.uniqueClicks;
    dayEntry.totalUnsubs += campaign.unsubscribesCount;
    dayEntry.totalSpam += campaign.spamComplaintsCount;
    dayEntry.totalBounces += campaign.bouncesCount;
  });

  // Calculate final metric values
  dayData.forEach(dayEntry => {
    if (dayEntry.campaignCount === 0) {
      dayEntry.value = 0;
      return;
    }

    switch (metricKey) {
      case 'revenue':
        dayEntry.value = dayEntry.totalRevenue;
        break;
      case 'avgOrderValue':
        dayEntry.value = dayEntry.totalOrders > 0 ? dayEntry.totalRevenue / dayEntry.totalOrders : 0;
        break;
      case 'revenuePerEmail':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? dayEntry.totalRevenue / dayEntry.totalEmailsSent : 0;
        break;
      case 'openRate':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? (dayEntry.totalOpens / dayEntry.totalEmailsSent) * 100 : 0;
        break;
      case 'clickRate':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? (dayEntry.totalClicks / dayEntry.totalEmailsSent) * 100 : 0;
        break;
      case 'clickToOpenRate':
        dayEntry.value = dayEntry.totalOpens > 0 ? (dayEntry.totalClicks / dayEntry.totalOpens) * 100 : 0;
        break;
      case 'emailsSent':
        dayEntry.value = dayEntry.totalEmailsSent;
        break;
      case 'totalOrders':
        dayEntry.value = dayEntry.totalOrders;
        break;
      case 'conversionRate':
        dayEntry.value = dayEntry.totalClicks > 0 ? (dayEntry.totalOrders / dayEntry.totalClicks) * 100 : 0;
        break;
      case 'unsubscribeRate':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? (dayEntry.totalUnsubs / dayEntry.totalEmailsSent) * 100 : 0;
        break;
      case 'spamRate':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? (dayEntry.totalSpam / dayEntry.totalEmailsSent) * 100 : 0;
        break;
      case 'bounceRate':
        dayEntry.value = dayEntry.totalEmailsSent > 0 ? (dayEntry.totalBounces / dayEntry.totalEmailsSent) * 100 : 0;
        break;
      default:
        dayEntry.value = 0;
    }
  });

  return dayData.map(({ day, dayIndex, value, campaignCount }) => ({
    day,
    dayIndex,
    value,
    campaignCount
  }));
};

// Function to aggregate campaign performance by hour of day
export const getCampaignPerformanceByHourOfDay = (
  campaigns: ProcessedCampaign[],
  metricKey: string
): HourOfDayPerformanceData[] => {
  // Initialize data for all 24 hours
  const hourData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    hourLabel: formatHourLabel(hour),
    value: 0,
    campaignCount: 0,
    percentageOfTotal: 0,
    // Temporary aggregation fields
    totalRevenue: 0,
    totalEmailsSent: 0,
    totalOrders: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalUnsubs: 0,
    totalSpam: 0,
    totalBounces: 0
  }));

  const totalCampaigns = campaigns.length;

  // Aggregate data by hour of day
  campaigns.forEach(campaign => {
    const hour = campaign.hourOfDay;
    const hourEntry = hourData[hour];

    hourEntry.campaignCount++;
    hourEntry.totalRevenue += campaign.revenue;
    hourEntry.totalEmailsSent += campaign.emailsSent;
    hourEntry.totalOrders += campaign.totalOrders;
    hourEntry.totalOpens += campaign.uniqueOpens;
    hourEntry.totalClicks += campaign.uniqueClicks;
    hourEntry.totalUnsubs += campaign.unsubscribesCount;
    hourEntry.totalSpam += campaign.spamComplaintsCount;
    hourEntry.totalBounces += campaign.bouncesCount;
  });

  // Calculate final metric values and filter out hours with no campaigns
  const hoursWithData = hourData
    .filter(hourEntry => hourEntry.campaignCount > 0)
    .map(hourEntry => {
      // Calculate percentage of total campaigns
      hourEntry.percentageOfTotal = totalCampaigns > 0 ? (hourEntry.campaignCount / totalCampaigns) * 100 : 0;

      // Calculate metric value
      switch (metricKey) {
        case 'revenue':
          hourEntry.value = hourEntry.totalRevenue;
          break;
        case 'avgOrderValue':
          hourEntry.value = hourEntry.totalOrders > 0 ? hourEntry.totalRevenue / hourEntry.totalOrders : 0;
          break;
        case 'revenuePerEmail':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? hourEntry.totalRevenue / hourEntry.totalEmailsSent : 0;
          break;
        case 'openRate':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? (hourEntry.totalOpens / hourEntry.totalEmailsSent) * 100 : 0;
          break;
        case 'clickRate':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? (hourEntry.totalClicks / hourEntry.totalEmailsSent) * 100 : 0;
          break;
        case 'clickToOpenRate':
          hourEntry.value = hourEntry.totalOpens > 0 ? (hourEntry.totalClicks / hourEntry.totalOpens) * 100 : 0;
          break;
        case 'emailsSent':
          hourEntry.value = hourEntry.totalEmailsSent;
          break;
        case 'totalOrders':
          hourEntry.value = hourEntry.totalOrders;
          break;
        case 'conversionRate':
          hourEntry.value = hourEntry.totalClicks > 0 ? (hourEntry.totalOrders / hourEntry.totalClicks) * 100 : 0;
          break;
        case 'unsubscribeRate':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? (hourEntry.totalUnsubs / hourEntry.totalEmailsSent) * 100 : 0;
          break;
        case 'spamRate':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? (hourEntry.totalSpam / hourEntry.totalEmailsSent) * 100 : 0;
          break;
        case 'bounceRate':
          hourEntry.value = hourEntry.totalEmailsSent > 0 ? (hourEntry.totalBounces / hourEntry.totalEmailsSent) * 100 : 0;
          break;
        default:
          hourEntry.value = 0;
      }

      return {
        hour: hourEntry.hour,
        hourLabel: hourEntry.hourLabel,
        value: hourEntry.value,
        campaignCount: hourEntry.campaignCount,
        percentageOfTotal: hourEntry.percentageOfTotal
      };
    });

  // Sort by value (descending), then by hour (ascending) for ties
  return hoursWithData.sort((a, b) => {
    if (Math.abs(a.value - b.value) < 0.01) {
      return a.hour - b.hour; // Secondary sort by hour for ties
    }
    return b.value - a.value; // Primary sort by value (descending)
  });
};

// Helper function to format hour in 12-hour format
const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

// Helper function to determine granularity based on date range
export const getGranularityForDateRange = (dateRange: string): 'daily' | 'weekly' | 'monthly' => {
  if (dateRange === 'all' || dateRange === '365d') {
    return 'monthly';
  } else if (['90d', '120d', '180d'].includes(dateRange)) {
    return 'weekly';
  } else if (['30d', '60d'].includes(dateRange)) {
    return 'daily';
  } else {
    return 'daily';
  }
};

// Subscriber data interfaces and generation
export interface RawSubscriberData {
  email: string;
  klaviyo_id: string;
  first_name: string;
  last_name: string;
  city: string;
  state_region: string;
  country: string;
  zip_code: string;
  source: string;
  email_marketing_consent: boolean;
  total_customer_lifetime_value: number;
  predicted_customer_lifetime_value: number;
  average_order_value: number;
  historic_number_of_orders: number;
  first_active: string; // Date string
  last_active: string; // Date string
  profile_created_on: string; // Date string
}


// Parse subscriber CSV row
export const parseSubscriberCsvRow = (raw: RawSubscriberData): ProcessedSubscriber => {
  const profileCreated = new Date(raw.profile_created_on);
  const firstActive = new Date(raw.first_active);
  const lastActive = new Date(raw.last_active);
  const lifetimeInDays = Math.floor((REFERENCE_DATE.getTime() - profileCreated.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: raw.klaviyo_id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    city: raw.city,
    state: raw.state_region,
    country: raw.country,
    zipCode: raw.zip_code,
    source: raw.source,
    emailConsent: raw.email_marketing_consent,
    totalClv: raw.total_customer_lifetime_value,
    predictedClv: raw.predicted_customer_lifetime_value,
    avgOrderValue: raw.average_order_value,
    totalOrders: raw.historic_number_of_orders,
    firstActive,
    lastActive,
    profileCreated,
    isBuyer: raw.historic_number_of_orders > 0,
    lifetimeInDays
  };
};

// Generate realistic subscriber raw data
const generateRawSubscriberData = (index: number): RawSubscriberData => {
  const firstNames = ['Emily', 'John', 'Sarah', 'Michael', 'Jessica', 'David', 'Ashley', 'Chris', 'Amanda', 'Matt', 'Jennifer', 'Ryan', 'Lauren', 'Kevin', 'Nicole'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
  const sources = ['Website Form', 'Social Media', 'Email Referral', 'Popup', 'Checkout', 'Newsletter Signup', 'Contest', 'Blog Subscription'];

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const cityIndex = Math.floor(Math.random() * cities.length);

  // Generate profile created date (1-2 years ago)
  const profileCreated = getRandomDate(Math.floor(Math.random() * 730) + 30, 10);

  // Generate order history
  const totalOrders = Math.random() < 0.28 ? Math.floor(Math.random() * 8) + 1 : 0; // 28% buyers
  const avgOrderValue = totalOrders > 0 ? 45 + Math.random() * 120 : 0;
  const totalClv = totalOrders * avgOrderValue;
  const predictedClv = totalClv + (Math.random() * 200);

  // Generate activity dates
  const firstActive = new Date(new Date(profileCreated).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
  const lastActive = new Date(profileCreated.getTime() + Math.random() * (REFERENCE_DATE.getTime() - profileCreated.getTime()));

  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@email.com`,
    klaviyo_id: `kl_${Math.random().toString(36).substr(2, 9)}`,
    first_name: firstName,
    last_name: lastName,
    city: cities[cityIndex],
    state_region: states[cityIndex],
    country: 'United States',
    zip_code: String(10000 + Math.floor(Math.random() * 90000)),
    source: sources[Math.floor(Math.random() * sources.length)],
    email_marketing_consent: Math.random() > 0.05, // 95% consent
    total_customer_lifetime_value: totalClv,
    predicted_customer_lifetime_value: predictedClv,
    average_order_value: avgOrderValue,
    historic_number_of_orders: totalOrders,
    first_active: firstActive.toISOString(),
    last_active: lastActive.toISOString(),
    profile_created_on: profileCreated.toISOString()
  };
};

// Generate and process subscriber data
const rawSubscriberData: RawSubscriberData[] = Array.from({ length: 45678 }, (_, index) =>
  generateRawSubscriberData(index)
);

export const ALL_SUBSCRIBERS: ProcessedSubscriber[] = rawSubscriberData.map(raw =>
  parseSubscriberCsvRow(raw)
);

// Helper functions for aggregated metrics
export const getAggregatedMetricsForPeriod = (
  campaigns: ProcessedCampaign[],
  flows: ProcessedFlowEmail[],
  startDate: Date,
  endDate: Date
) => {
  const filteredCampaigns = campaigns.filter(c => c.sentDate >= startDate && c.sentDate <= endDate);
  const filteredFlows = flows.filter(f => f.sentDate >= startDate && f.sentDate <= endDate);
  const allEmails = [...filteredCampaigns, ...filteredFlows];

  if (allEmails.length === 0) {
    return {
      totalRevenue: 0,
      emailsSent: 0,
      totalOrders: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      unsubscribeRate: 0,
      spamRate: 0,
      bounceRate: 0,
      avgOrderValue: 0,
      revenuePerEmail: 0,
      clickToOpenRate: 0,
      emailCount: 0
    };
  }

  const totalRevenue = allEmails.reduce((sum, email) => sum + email.revenue, 0);
  const emailsSent = allEmails.reduce((sum, email) => sum + email.emailsSent, 0);
  const totalOrders = allEmails.reduce((sum, email) => sum + email.totalOrders, 0);
  const totalOpens = allEmails.reduce((sum, email) => sum + email.uniqueOpens, 0);
  const totalClicks = allEmails.reduce((sum, email) => sum + email.uniqueClicks, 0);
  const totalUnsubs = allEmails.reduce((sum, email) => sum + email.unsubscribesCount, 0);
  const totalSpam = allEmails.reduce((sum, email) => sum + email.spamComplaintsCount, 0);
  const totalBounces = allEmails.reduce((sum, email) => sum + email.bouncesCount, 0);

  return {
    totalRevenue,
    emailsSent,
    totalOrders,
    openRate: emailsSent > 0 ? (totalOpens / emailsSent) * 100 : 0,
    clickRate: emailsSent > 0 ? (totalClicks / emailsSent) * 100 : 0,
    conversionRate: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0,
    unsubscribeRate: emailsSent > 0 ? (totalUnsubs / emailsSent) * 100 : 0,
    spamRate: emailsSent > 0 ? (totalSpam / emailsSent) * 100 : 0,
    bounceRate: emailsSent > 0 ? (totalBounces / emailsSent) * 100 : 0,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    revenuePerEmail: emailsSent > 0 ? totalRevenue / emailsSent : 0,
    clickToOpenRate: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
    emailCount: allEmails.length
  };
};

// Audience analysis helpers
export const getAudienceInsights = () => {
  const totalSubscribers = ALL_SUBSCRIBERS.length;
  const buyers = ALL_SUBSCRIBERS.filter(s => s.isBuyer);
  const nonBuyers = ALL_SUBSCRIBERS.filter(s => !s.isBuyer);

  const avgClvAll = ALL_SUBSCRIBERS.reduce((sum, s) => sum + s.totalClv, 0) / totalSubscribers;
  const avgClvBuyers = buyers.length > 0 ? buyers.reduce((sum, s) => sum + s.totalClv, 0) / buyers.length : 0;

  // Purchase frequency distribution
  const purchaseFrequency = {
    never: nonBuyers.length,
    oneOrder: buyers.filter(s => s.totalOrders === 1).length,
    twoOrders: buyers.filter(s => s.totalOrders === 2).length,
    threeTo5: buyers.filter(s => s.totalOrders >= 3 && s.totalOrders <= 5).length,
    sixPlus: buyers.filter(s => s.totalOrders >= 6).length
  };

  // Lifetime distribution
  const lifetimeDistribution = {
    zeroTo3Months: ALL_SUBSCRIBERS.filter(s => s.lifetimeInDays <= 90).length,
    threeTo6Months: ALL_SUBSCRIBERS.filter(s => s.lifetimeInDays > 90 && s.lifetimeInDays <= 180).length,
    sixTo12Months: ALL_SUBSCRIBERS.filter(s => s.lifetimeInDays > 180 && s.lifetimeInDays <= 365).length,
    oneToTwoYears: ALL_SUBSCRIBERS.filter(s => s.lifetimeInDays > 365 && s.lifetimeInDays <= 730).length,
    twoYearsPlus: ALL_SUBSCRIBERS.filter(s => s.lifetimeInDays > 730).length
  };

  return {
    totalSubscribers,
    buyerCount: buyers.length,
    nonBuyerCount: nonBuyers.length,
    buyerPercentage: (buyers.length / totalSubscribers) * 100,
    avgClvAll,
    avgClvBuyers,
    purchaseFrequency,
    lifetimeDistribution
  };
};