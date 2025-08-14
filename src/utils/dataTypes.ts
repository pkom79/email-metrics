// ============================================
// EXISTING INTERFACES (from mockDataGenerator)
// ============================================

// Processed data interfaces with all calculated metrics
export interface ProcessedCampaign {
    id: number;
    subject: string;
    sentDate: Date;
    dayOfWeek: number;
    hourOfDay: number;
    emailsSent: number;
    uniqueOpens: number;
    uniqueClicks: number;
    totalOrders: number;
    revenue: number;
    unsubscribesCount: number;
    spamComplaintsCount: number;
    bouncesCount: number;
    // Calculated rates
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
    conversionRate: number;
    revenuePerEmail: number;
    unsubscribeRate: number;
    spamRate: number;
    bounceRate: number;
    avgOrderValue: number;
}

export interface ProcessedFlowEmail {
    id: number;
    flowId: string;
    flowName: string;
    flowMessageId: string;
    emailName: string;
    sequencePosition: number;
    sentDate: Date;
    status: string;
    emailsSent: number;
    uniqueOpens: number;
    uniqueClicks: number;
    totalOrders: number;
    revenue: number;
    unsubscribesCount: number;
    spamComplaintsCount: number;
    bouncesCount: number;
    // Calculated rates
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
    conversionRate: number;
    revenuePerEmail: number;
    unsubscribeRate: number;
    spamRate: number;
    bounceRate: number;
    avgOrderValue: number;
}

export interface ProcessedSubscriber {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    source: string;
    emailConsent: boolean;
    // Preserve raw consent to compute opt-in rate rules like NEVER_SUBSCRIBED
    emailConsentRaw?: string;
    totalClv: number;
    predictedClv: number;
    avgOrderValue: number;
    totalOrders: number;
    firstActive: Date;
    lastActive: Date | null;
    profileCreated: Date;
    isBuyer: boolean;
    lifetimeInDays: number;
    // New fields from CSV for segment analysis
    emailSuppressions?: string[]; // e.g., ["UNSUBSCRIBE", "SPAM_COMPLAINT"]
    canReceiveEmail?: boolean; // strictly true when raw suppressions string is exactly "[]"
    avgDaysBetweenOrders?: number | null; // null when missing
    // New activity fields
    lastOpen?: Date | null;
    lastClick?: Date | null;
    firstActiveRaw?: Date | null;
}

// ============================================
// NEW RAW CSV INTERFACES
// ============================================

// Raw Campaign CSV interface - matches Klaviyo export exactly
export interface RawCampaignCSV {
    'Campaign Name': string;
    'Tags'?: string | number; // Can be float or empty
    'Subject': string;
    'List': string;
    'Send Time': string; // Date string
    'Send Weekday': string;
    'Total Recipients': string | number;
    'Unique Placed Order': string | number;
    'Placed Order Rate': string; // "2.99%"
    'Revenue': string | number;
    'Unique Opens': string | number;
    'Open Rate': string; // "27.05%"
    'Total Opens': string | number;
    'Unique Clicks': string | number;
    'Click Rate': string; // "4.09%"
    'Total Clicks': string | number;
    'Unsubscribes': string | number;
    'Spam Complaints': string | number;
    'Spam Complaints Rate': string; // "0.01%"
    'Successful Deliveries': string | number;
    'Bounces': string | number;
    'Bounce Rate': string; // "0.30%"
    'Campaign ID': string;
    'Campaign Channel': string;
}

// Raw Flow CSV interface - matches Klaviyo export exactly
export interface RawFlowCSV {
    'Day': string; // "2024-01-15"
    'Flow ID': string;
    'Flow Name': string;
    'Flow Message ID': string;
    'Flow Message Name': string;
    'Flow Message Channel'?: string; // Added: Can be "Email" or "SMS"
    'Status': string; // "live", "manual", "draft"
    'Delivered': string | number;
    'Bounced': string | number;
    'Bounce Rate': string | number; // Can be decimal like 0.02
    'Unique Opens': string | number;
    'Open Rate': string | number; // Decimal 0.25 = 25%
    'Total Opens': string | number;
    'Unique Clicks': string | number;
    'Click Rate': string | number; // Decimal 0.04 = 4%
    'Total Clicks': string | number;
    'Unique Placed Order'?: string | number; // May be missing
    'Placed Order'?: string | number; // May be missing
    'Placed Order Rate'?: string | number; // May be missing
    'Revenue'?: string | number; // May be missing
    'Revenue per Recipient'?: string | number; // May be missing
    'Unsubscribes'?: string | number; // May be missing
    'Unsubscribe Rate'?: string | number; // May be missing
    'Unsub Rate'?: string | number; // Added: Alternative field name
    'Spam'?: string | number; // May be missing
    'Spam Rate'?: string | number; // May be missing
    'Complaint Rate'?: string | number; // Added: Alternative field name
}

// Raw Subscriber CSV interface - matches Klaviyo export exactly (SMS fields excluded)
export interface RawSubscriberCSV {
    'Email': string;
    'Klaviyo ID': string;
    'First Name': string;
    'Last Name': string;
    'Organization'?: string;
    'Title'?: string;
    'Phone Number'?: string;
    'Address'?: string;
    'Address 2'?: string;
    'City': string;
    'State / Region': string;
    'Country': string;
    'Zip Code': string;
    'Latitude'?: string | number;
    'Longitude'?: string | number;
    'Source': string;
    'IP Address'?: string;
    'Email Marketing Consent': string; // "TRUE", "FALSE", timestamp, or "NEVER_SUBSCRIBED"
    'Email Marketing Consent Timestamp'?: string;
    'Total Customer Lifetime Value'?: string | number;
    'Predicted Customer Lifetime Value'?: string | number;
    'Average Order Value'?: string | number;
    'Historic Number Of Orders'?: string | number;
    'First Active'?: string; // Date string
    'Last Active'?: string; // Date string
    'Profile Created On': string; // Date string
    'Date Added': string; // Date string
    'Last Open'?: string; // Date string
    'Last Click'?: string; // Date string
    // New fields used in Custom Segment analysis
    'Average Days Between Orders'?: string | number;
    'Email Suppressions'?: string; // e.g., "[]" or "[UNSUBSCRIBE,SPAM_COMPLAINT]"
    // Additional fields that might exist
    [key: string]: string | number | undefined;
}

// ============================================
// AGGREGATION INTERFACES
// ============================================

export interface FlowSequenceInfo {
    flowId: string;
    messageIds: string[];
    emailNames: string[];
    sequenceLength: number;
}

export interface DayOfWeekPerformanceData {
    day: string;
    dayIndex: number;
    value: number;
    campaignCount: number;
}

export interface HourOfDayPerformanceData {
    hour: number;
    hourLabel: string;
    value: number;
    campaignCount: number;
    percentageOfTotal: number;
}

export interface AggregatedMetrics {
    totalRevenue: number;
    emailsSent: number;
    totalOrders: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
    spamRate: number;
    bounceRate: number;
    avgOrderValue: number;
    revenuePerEmail: number;
    clickToOpenRate: number;
    emailCount: number;
}

export interface AudienceInsights {
    totalSubscribers: number;
    buyerCount: number;
    nonBuyerCount: number;
    buyerPercentage: number;
    avgClvAll: number;
    avgClvBuyers: number;
    purchaseFrequency: {
        never: number;
        oneOrder: number;
        twoOrders: number;
        threeTo5: number;
        sixPlus: number;
    };
    lifetimeDistribution: {
        zeroTo3Months: number;
        threeTo6Months: number;
        sixTo12Months: number;
        oneToTwoYears: number;
        twoYearsPlus: number;
    };
}

// ============================================
// PARSING RESULT INTERFACES
// ============================================

export interface ParseResult<T> {
    success: boolean;
    data?: T[];
    error?: string;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}