import {
    ProcessedCampaign,
    ProcessedFlowEmail,
    ProcessedSubscriber,
    DayOfWeekPerformanceData,
    HourOfDayPerformanceData,
    AggregatedMetrics,
    AudienceInsights,
    FlowSequenceInfo
} from './dataTypes';
import { CSVParser } from './csvParser';
import { CampaignTransformer } from './transformers/campaignTransformer';
import { FlowTransformer } from './transformers/flowTransformer';
import { SubscriberTransformer } from './transformers/subscriberTransformer';

export interface LoadProgress {
    campaigns: { loaded: boolean; progress: number; error?: string };
    flows: { loaded: boolean; progress: number; error?: string };
    subscribers: { loaded: boolean; progress: number; error?: string };
}

export class DataManager {
    private static instance: DataManager;

    // Real data storage
    private campaigns: ProcessedCampaign[] = [];
    private flowEmails: ProcessedFlowEmail[] = [];
    private subscribers: ProcessedSubscriber[] = [];

    // Loading state
    private isRealDataLoaded = false;
    private loadProgress: LoadProgress = {
        campaigns: { loaded: false, progress: 0 },
        flows: { loaded: false, progress: 0 },
        subscribers: { loaded: false, progress: 0 }
    };

    // Transformers
    private csvParser = new CSVParser();
    private campaignTransformer = new CampaignTransformer();
    private flowTransformer = new FlowTransformer();
    private subscriberTransformer = new SubscriberTransformer();

    // Singleton pattern
    static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    /**
     * Load CSV files and transform data
     */
    async loadCSVFiles(
        files: {
            campaigns?: File;
            flows?: File;
            subscribers?: File;
        },
        onProgress?: (progress: LoadProgress) => void
    ): Promise<{ success: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            // Load campaigns
            if (files.campaigns) {
                this.loadProgress.campaigns.progress = 0;
                if (onProgress) onProgress(this.loadProgress);

                const campaignResult = await this.csvParser.parseCampaigns(
                    files.campaigns,
                    (progress) => {
                        this.loadProgress.campaigns.progress = progress * 0.5; // 50% for parsing
                        if (onProgress) onProgress(this.loadProgress);
                    }
                );

                if (campaignResult.success && campaignResult.data) {
                    this.campaigns = this.campaignTransformer.transform(campaignResult.data);
                    this.loadProgress.campaigns.loaded = true;
                    this.loadProgress.campaigns.progress = 100;

                    console.log(`Loaded ${this.campaigns.length} campaigns`);
                } else {
                    errors.push(`Campaigns: ${campaignResult.error || 'Unknown error'}`);
                    this.loadProgress.campaigns.error = campaignResult.error;
                }
            }

            // Load flows
            if (files.flows) {
                this.loadProgress.flows.progress = 0;
                if (onProgress) onProgress(this.loadProgress);

                const flowResult = await this.csvParser.parseFlows(
                    files.flows,
                    (progress) => {
                        this.loadProgress.flows.progress = progress * 0.5;
                        if (onProgress) onProgress(this.loadProgress);
                    }
                );

                if (flowResult.success && flowResult.data) {
                    this.flowEmails = this.flowTransformer.transform(flowResult.data);
                    this.loadProgress.flows.loaded = true;
                    this.loadProgress.flows.progress = 100;

                    console.log(`Loaded ${this.flowEmails.length} flow emails`);
                } else {
                    errors.push(`Flows: ${flowResult.error || 'Unknown error'}`);
                    this.loadProgress.flows.error = flowResult.error;
                }
            }

            // Load subscribers
            if (files.subscribers) {
                this.loadProgress.subscribers.progress = 0;
                if (onProgress) onProgress(this.loadProgress);

                const subscriberResult = await this.csvParser.parseSubscribers(
                    files.subscribers,
                    (progress) => {
                        this.loadProgress.subscribers.progress = progress * 0.5;
                        if (onProgress) onProgress(this.loadProgress);
                    }
                );

                if (subscriberResult.success && subscriberResult.data) {
                    this.subscribers = this.subscriberTransformer.transform(subscriberResult.data);
                    this.loadProgress.subscribers.loaded = true;
                    this.loadProgress.subscribers.progress = 100;

                    console.log(`Loaded ${this.subscribers.length} subscribers`);
                } else {
                    errors.push(`Subscribers: ${subscriberResult.error || 'Unknown error'}`);
                    this.loadProgress.subscribers.error = subscriberResult.error;
                }
            }

            // Update loaded state if any data was loaded
            this.isRealDataLoaded = this.campaigns.length > 0 || this.flowEmails.length > 0 || this.subscribers.length > 0;

            if (onProgress) onProgress(this.loadProgress);

            return {
                success: errors.length === 0,
                errors
            };
        } catch (error) {
            console.error('Error loading CSV files:', error);
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                errors
            };
        }
    }

    /**
     * Reset to empty state (no mock data)
     */
    resetToMockData(): void {
        this.campaigns = [];
        this.flowEmails = [];
        this.subscribers = [];
        this.isRealDataLoaded = false;
        this.loadProgress = {
            campaigns: { loaded: false, progress: 0 },
            flows: { loaded: false, progress: 0 },
            subscribers: { loaded: false, progress: 0 }
        };
    }

    /**
     * Get loading progress
     */
    getLoadProgress(): LoadProgress {
        return this.loadProgress;
    }

    /**
     * Check if real data is loaded
     */
    hasRealData(): boolean {
        return this.isRealDataLoaded;
    }

    // ===================================
    // Data Access Methods
    // ===================================

    getCampaigns(): ProcessedCampaign[] {
        return this.campaigns;
    }

    getFlowEmails(): ProcessedFlowEmail[] {
        return this.flowEmails;
    }

    getSubscribers(): ProcessedSubscriber[] {
        return this.subscribers;
    }

    // ===================================
    // Helper Methods with Real Implementations
    // ===================================

    getUniqueFlowNames(): string[] {
        return this.flowTransformer.getUniqueFlowNames(this.flowEmails);
    }

    getLastEmailDate(): Date {
        const campaignDates = this.campaigns.map(c => c.sentDate);
        const flowDates = this.flowEmails.map(f => f.sentDate);
        const allDates = [...campaignDates, ...flowDates];
        return allDates.length > 0
            ? new Date(Math.max(...allDates.map(d => d.getTime())))
            : new Date();
    }

    /**
     * Get time series data for metrics
     */
    getMetricTimeSeries(
        campaigns: ProcessedCampaign[],
        flows: ProcessedFlowEmail[],
        metricKey: string,
        dateRange: string,
        granularity: 'daily' | 'weekly' | 'monthly'
    ): { value: number; date: string }[] {
        const allEmails = [...campaigns, ...flows];

        if (allEmails.length === 0) {
            return [];
        }

        // Determine date range
        const endDate = new Date();
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

        if (filteredEmails.length === 0) {
            return [];
        }

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
                    const day = monday.getDay();
                    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                    monday.setDate(diff);
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

            // Calculate metric value based on type
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
                // Rate metrics - calculate weighted average
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
                        value = 0;
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
    }

    /**
     * Get flow step time series
     */
    getFlowStepTimeSeries(
        flowEmails: ProcessedFlowEmail[],
        flowName: string,
        sequencePosition: number,
        metricKey: string,
        dateRange: string,
        granularity: 'daily' | 'weekly' | 'monthly'
    ): { value: number; date: string }[] {
        // Filter emails for specific flow and sequence position
        const stepEmails = flowEmails.filter(email =>
            email.flowName === flowName && email.sequencePosition === sequencePosition
        );

        return this.getMetricTimeSeries([], stepEmails, metricKey, dateRange, granularity);
    }

    /**
     * Get flow sequence information
     */
    getFlowSequenceInfo(flowName: string): FlowSequenceInfo {
        return this.flowTransformer.getFlowSequenceInfo(flowName, this.flowEmails);
    }

    /**
     * Get campaign performance by day of week
     */
    getCampaignPerformanceByDayOfWeek(
        campaigns: ProcessedCampaign[],
        metricKey: string
    ): DayOfWeekPerformanceData[] {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Initialize data for all days
        const dayData = dayNames.map((day, index) => ({
            day,
            dayIndex: index,
            value: 0,
            campaignCount: 0,
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
    }

    /**
     * Get campaign performance by hour of day
     */
    getCampaignPerformanceByHourOfDay(
        campaigns: ProcessedCampaign[],
        metricKey: string
    ): HourOfDayPerformanceData[] {
        // Initialize data for all 24 hours
        const hourData = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            hourLabel: this.formatHourLabel(hour),
            value: 0,
            campaignCount: 0,
            percentageOfTotal: 0,
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
                return a.hour - b.hour;
            }
            return b.value - a.value;
        });
    }

    /**
     * Helper function to format hour in 12-hour format
     */
    private formatHourLabel(hour: number): string {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    /**
     * Get granularity for date range
     */
    getGranularityForDateRange(dateRange: string): 'daily' | 'weekly' | 'monthly' {
        // For consistent visualization across all charts (Metric Cards, Flow Step Analysis, etc.)
        // We want approximately 20-30 data points for clean, readable charts

        if (dateRange === 'all') {
            // For "all time", determine based on total date range
            const oldestCampaign = this.campaigns.length > 0
                ? Math.min(...this.campaigns.map(c => c.sentDate.getTime()))
                : Date.now();
            const oldestFlow = this.flowEmails.length > 0
                ? Math.min(...this.flowEmails.map(f => f.sentDate.getTime()))
                : Date.now();
            const oldestDate = new Date(Math.min(oldestCampaign, oldestFlow));
            const daysDiff = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 60) return 'daily';
            if (daysDiff <= 365) return 'weekly';
            return 'monthly';
        }

        const days = parseInt(dateRange.replace('d', ''));

        // Consistent granularity rules for all charts
        if (days <= 60) return 'daily';      // Up to 60 data points
        if (days <= 365) return 'weekly';    // Up to 52 data points  
        return 'monthly';                     // 12+ data points for yearly view
    }

    /**
     * Get aggregated metrics for a period
     */
    getAggregatedMetricsForPeriod(
        campaigns: ProcessedCampaign[],
        flows: ProcessedFlowEmail[],
        startDate: Date,
        endDate: Date
    ): AggregatedMetrics {
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
    }

    /**
     * Get audience insights
     */
    getAudienceInsights(): AudienceInsights {
        if (this.subscribers.length > 0) {
            return this.subscriberTransformer.getAudienceInsights(this.subscribers);
        }

        // Return empty insights if no data
        return {
            totalSubscribers: 0,
            buyerCount: 0,
            nonBuyerCount: 0,
            buyerPercentage: 0,
            avgClvAll: 0,
            avgClvBuyers: 0,
            purchaseFrequency: {
                never: 0,
                oneOrder: 0,
                twoOrders: 0,
                threeTo5: 0,
                sixPlus: 0
            },
            lifetimeDistribution: {
                zeroTo3Months: 0,
                threeTo6Months: 0,
                sixTo12Months: 0,
                oneToTwoYears: 0,
                twoYearsPlus: 0
            }
        };
    }

    /**
     * Get summary statistics
     */
    getSummaryStats() {
        return {
            campaigns: this.campaigns.length > 0
                ? this.campaignTransformer.getSummaryStats(this.campaigns)
                : null,
            subscribers: this.subscribers.length > 0
                ? this.subscriberTransformer.getSummaryStats(this.subscribers)
                : null,
            flows: {
                totalFlows: this.getUniqueFlowNames().length,
                totalEmails: this.getFlowEmails().length
            }
        };
    }

    /**
     * Calculate real change percentages based on current vs previous period
     */
    calculatePeriodOverPeriodChange(
        metricKey: string,
        dateRange: string,
        dataType: 'all' | 'campaigns' | 'flows' = 'all'
    ): { currentValue: number; previousValue: number; changePercent: number; isPositive: boolean } {
        // Get current period dates
        const endDate = new Date();
        let startDate = new Date(endDate);
        let periodDays = 0;

        if (dateRange === 'all') {
            // For "all time", we can't calculate a proper change
            return { currentValue: 0, previousValue: 0, changePercent: 0, isPositive: true };
        } else {
            periodDays = parseInt(dateRange.replace('d', ''));
            startDate.setDate(startDate.getDate() - periodDays);
        }

        // Calculate previous period dates
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1); // Day before current period starts
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);

        // Get data based on type
        let campaignsToUse = this.campaigns;
        let flowsToUse = this.flowEmails;

        if (dataType === 'campaigns') {
            flowsToUse = [];
        } else if (dataType === 'flows') {
            campaignsToUse = [];
        }

        // Get metrics for both periods
        const currentMetrics = this.getAggregatedMetricsForPeriod(
            campaignsToUse,
            flowsToUse,
            startDate,
            endDate
        );

        const previousMetrics = this.getAggregatedMetricsForPeriod(
            campaignsToUse,
            flowsToUse,
            prevStartDate,
            prevEndDate
        );

        // Extract the specific metric value
        let currentValue = 0;
        let previousValue = 0;

        switch (metricKey) {
            case 'totalRevenue':
                currentValue = currentMetrics.totalRevenue;
                previousValue = previousMetrics.totalRevenue;
                break;
            case 'averageOrderValue':
            case 'avgOrderValue':
                currentValue = currentMetrics.avgOrderValue;
                previousValue = previousMetrics.avgOrderValue;
                break;
            case 'revenuePerEmail':
                currentValue = currentMetrics.revenuePerEmail;
                previousValue = previousMetrics.revenuePerEmail;
                break;
            case 'openRate':
                currentValue = currentMetrics.openRate;
                previousValue = previousMetrics.openRate;
                break;
            case 'clickRate':
                currentValue = currentMetrics.clickRate;
                previousValue = previousMetrics.clickRate;
                break;
            case 'clickToOpenRate':
                currentValue = currentMetrics.clickToOpenRate;
                previousValue = previousMetrics.clickToOpenRate;
                break;
            case 'emailsSent':
                currentValue = currentMetrics.emailsSent;
                previousValue = previousMetrics.emailsSent;
                break;
            case 'totalOrders':
                currentValue = currentMetrics.totalOrders;
                previousValue = previousMetrics.totalOrders;
                break;
            case 'conversionRate':
                currentValue = currentMetrics.conversionRate;
                previousValue = previousMetrics.conversionRate;
                break;
            case 'unsubscribeRate':
                currentValue = currentMetrics.unsubscribeRate;
                previousValue = previousMetrics.unsubscribeRate;
                break;
            case 'spamRate':
                currentValue = currentMetrics.spamRate;
                previousValue = previousMetrics.spamRate;
                break;
            case 'bounceRate':
                currentValue = currentMetrics.bounceRate;
                previousValue = previousMetrics.bounceRate;
                break;
        }

        // Calculate percentage change
        let changePercent = 0;
        if (previousValue !== 0) {
            changePercent = ((currentValue - previousValue) / previousValue) * 100;
        } else if (currentValue > 0) {
            changePercent = 100; // If we went from 0 to something, that's a 100% increase
        }

        // Determine if positive (for negative metrics like unsubscribe rate, lower is better)
        const negativeMetrics = ['unsubscribeRate', 'spamRate', 'bounceRate'];
        const isNegativeMetric = negativeMetrics.includes(metricKey);
        const isPositive = isNegativeMetric ? changePercent < 0 : changePercent > 0;

        return {
            currentValue,
            previousValue,
            changePercent,
            isPositive
        };
    }
}