import { RawCampaignCSV, ProcessedCampaign } from '../dataTypes';

export class CampaignTransformer {
    /**
     * Transform raw CSV campaigns to processed format
     */
    transform(rawCampaigns: RawCampaignCSV[]): ProcessedCampaign[] {
        return rawCampaigns.map((raw, index) => this.transformSingle(raw, index + 1));
    }

    /**
     * Transform a single campaign
     */
    private transformSingle(raw: RawCampaignCSV, id: number): ProcessedCampaign {
        // Parse date
        const sentDate = this.parseDate(raw['Send Time']);

        // Parse numeric values safely
        const emailsSent = this.parseNumber(raw['Total Recipients']);
        const uniqueOpens = this.parseNumber(raw['Unique Opens']);
        const uniqueClicks = this.parseNumber(raw['Unique Clicks']);
        const totalOrders = this.parseNumber(raw['Unique Placed Order']);
        const revenue = this.parseNumber(raw['Revenue']);
        const unsubscribesCount = this.parseNumber(raw['Unsubscribes']);
        const spamComplaintsCount = this.parseNumber(raw['Spam Complaints']);
        const bouncesCount = this.parseNumber(raw['Bounces']);

        // Calculate rates (don't trust CSV percentages, calculate from raw numbers)
        const openRate = emailsSent > 0 ? (uniqueOpens / emailsSent) * 100 : 0;
        const clickRate = emailsSent > 0 ? (uniqueClicks / emailsSent) * 100 : 0;
        const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
        const conversionRate = uniqueClicks > 0 ? (totalOrders / uniqueClicks) * 100 : 0;

        if (conversionRate > 100) {
            console.warn('High conversion rate detected:', {
                campaign: raw['Campaign Name'],
                orders: totalOrders,
                clicks: uniqueClicks,
                conversionRate: conversionRate
            });
        }


        const revenuePerEmail = emailsSent > 0 ? revenue / emailsSent : 0;
        const unsubscribeRate = emailsSent > 0 ? (unsubscribesCount / emailsSent) * 100 : 0;
        const spamRate = emailsSent > 0 ? (spamComplaintsCount / emailsSent) * 100 : 0;
        const bounceRate = emailsSent > 0 ? (bouncesCount / emailsSent) * 100 : 0;
        const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

        return {
            id,
            subject: raw['Subject'] || raw['Campaign Name'], // Use Subject if available, otherwise Campaign Name
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
    }

    /**
     * Parse date string to Date object
     */
    private parseDate(dateStr: string): Date {
        // Handle various date formats
        const date = new Date(dateStr);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date: ${dateStr}, using current date`);
            return new Date();
        }

        return date;
    }

    /**
     * Parse number from various formats (string, number, with commas, etc.)
     */
    private parseNumber(value: string | number | undefined | null): number {
        if (value === undefined || value === null || value === '') {
            return 0;
        }

        // If already a number, return it
        if (typeof value === 'number') {
            return isNaN(value) ? 0 : value;
        }

        // If string, clean and parse
        const cleaned = value.toString()
            .replace(/,/g, '') // Remove commas
            .replace(/\$/g, '') // Remove dollar signs
            .replace(/%/g, '') // Remove percentage signs
            .trim();

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Parse percentage string to number
     */
    private parsePercentage(value: string | undefined | null): number {
        if (!value) return 0;

        const cleaned = value.toString().replace(/%/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Get summary statistics for transformed campaigns
     */
    getSummaryStats(campaigns: ProcessedCampaign[]): {
        totalCampaigns: number;
        dateRange: { start: Date; end: Date };
        totalRevenue: number;
        totalEmailsSent: number;
        avgOpenRate: number;
        avgClickRate: number;
        avgConversionRate: number;
    } {
        if (campaigns.length === 0) {
            return {
                totalCampaigns: 0,
                dateRange: { start: new Date(), end: new Date() },
                totalRevenue: 0,
                totalEmailsSent: 0,
                avgOpenRate: 0,
                avgClickRate: 0,
                avgConversionRate: 0
            };
        }

        const dates = campaigns.map(c => c.sentDate);
        const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
        const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);

        // Calculate weighted averages
        const weightedOpenRate = campaigns.reduce((sum, c) => sum + (c.openRate * c.emailsSent), 0) / totalEmailsSent;
        const weightedClickRate = campaigns.reduce((sum, c) => sum + (c.clickRate * c.emailsSent), 0) / totalEmailsSent;
        const weightedConversionRate = campaigns.reduce((sum, c) => sum + (c.conversionRate * c.emailsSent), 0) / totalEmailsSent;

        return {
            totalCampaigns: campaigns.length,
            dateRange: {
                start: new Date(Math.min(...dates.map(d => d.getTime()))),
                end: new Date(Math.max(...dates.map(d => d.getTime())))
            },
            totalRevenue,
            totalEmailsSent,
            avgOpenRate: weightedOpenRate,
            avgClickRate: weightedClickRate,
            avgConversionRate: weightedConversionRate
        };
    }
}
