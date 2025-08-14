import { RawSubscriberCSV, ProcessedSubscriber, AudienceInsights } from '../dataTypes';

export class SubscriberTransformer {
    private readonly REFERENCE_DATE = new Date(); // Current date for lifetime calculations

    /**
     * Transform raw CSV subscribers to processed format
     */
    transform(rawSubscribers: RawSubscriberCSV[]): ProcessedSubscriber[] {
        return rawSubscribers.map(raw => this.transformSingle(raw));
    }

    /**
     * Transform a single subscriber using exact header names only
     */
    private transformSingle(raw: RawSubscriberCSV): ProcessedSubscriber {
        // Dates
        const profileCreated = this.parseDate(raw['Profile Created On'] || raw['Date Added']) || new Date();
        const firstActiveRaw = this.parseDate(raw['First Active']);
        const firstActive = firstActiveRaw || profileCreated;
        const lastActive = this.parseDate(raw['Last Active']);
        const lastOpen = this.parseDate(raw['Last Open']);
        const lastClick = this.parseDate(raw['Last Click']);

        // Lifetime
        const lifetimeInDays = Math.floor(
            (this.REFERENCE_DATE.getTime() - profileCreated.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Numbers (exact headers)
        const totalClv = this.parseNumber(raw['Total Customer Lifetime Value']);
        const predictedClv = this.parseNumber(raw['Predicted Customer Lifetime Value']);
        const avgOrderValue = this.parseNumber(raw['Average Order Value']);
        const totalOrders = Math.floor(this.parseNumber(raw['Historic Number Of Orders']));
        const avgDaysBetweenOrders = this.parseOptionalNumber(raw['Average Days Between Orders']);

        // Consent (exact header)
        const emailConsentRaw = (raw['Email Marketing Consent'] ?? '').toString();
        const emailConsent = this.parseConsent(emailConsentRaw);

        // Suppressions (exact header)
        const emailSuppressionsRaw = typeof raw['Email Suppressions'] === 'string'
            ? (raw['Email Suppressions'] as string)
            : String(raw['Email Suppressions'] ?? '');
        const { suppressions, canReceiveEmail } = this.parseEmailSuppressions(emailSuppressionsRaw);

        // Buyer flag
        const isBuyer = totalOrders > 0 || totalClv > 0;

        return {
            id: (raw as any)['Klaviyo ID'] || '',
            email: (raw as any)['Email'] || '',
            firstName: (raw as any)['First Name'] || '',
            lastName: (raw as any)['Last Name'] || '',
            city: (raw as any)['City'] || '',
            state: (raw as any)['State / Region'] || '',
            country: (raw as any)['Country'] || '',
            zipCode: (raw as any)['Zip Code'] || '',
            source: (raw as any)['Source'] || 'Unknown',
            emailConsent,
            emailConsentRaw,
            totalClv,
            predictedClv,
            avgOrderValue,
            totalOrders,
            firstActive,
            lastActive,
            profileCreated,
            isBuyer,
            lifetimeInDays,
            emailSuppressions: suppressions,
            canReceiveEmail,
            avgDaysBetweenOrders,
            // New activity fields
            lastOpen,
            lastClick,
            firstActiveRaw
        };
    }

    /**
     * Parse date string to Date object
     */
    private parseDate(dateStr: string | number | undefined | null): Date | null {
        if (dateStr === undefined || dateStr === null || dateStr === '') return null;
        const d = typeof dateStr === 'number' ? new Date(dateStr) : new Date(String(dateStr));
        if (isNaN(d.getTime())) return null;
        return d;
    }

    /**
     * Parse number from various formats
     */
    private parseNumber(value: string | number | undefined | null): number {
        if (value === undefined || value === null || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return isNaN(value) ? 0 : value;
        }
        const cleaned = value.toString().replace(/,/g, '').replace(/\$/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Parse optional number: returns null when missing/empty
     */
    private parseOptionalNumber(value: string | number | undefined | null): number | null {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        if (typeof value === 'number') {
            return isNaN(value) ? null : value;
        }
        const cleaned = value.toString().replace(/,/g, '').replace(/\$/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Parse consent value (TRUE/FALSE or timestamp). NEVER_SUBSCRIBED is treated as no consent.
     */
    private parseConsent(value: string | number | undefined | null): boolean {
        if (value === undefined || value === null) return false;
        const str = String(value).toUpperCase().trim();
        if (str === 'TRUE') return true;
        if (str === 'FALSE') return false;
        if (str === 'NEVER_SUBSCRIBED') return false;
        const date = new Date(String(value));
        if (!isNaN(date.getTime())) return true;
        return false;
    }

    /**
     * Parse Email Suppressions raw string into array and determine canReceiveEmail
     * - canReceiveEmail = true only when raw is exactly "[]"
     * - Supports JSON array strings and comma/semicolon lists
     */
    private parseEmailSuppressions(raw: string | undefined): { suppressions: string[]; canReceiveEmail: boolean } {
        if (!raw || raw.trim() === '') {
            return { suppressions: [], canReceiveEmail: false };
        }
        const trimmed = raw.trim();
        if (trimmed === '[]') {
            return { suppressions: [], canReceiveEmail: true };
        }
        // Try JSON
        const normalized = trimmed.replace(/""/g, '"');
        if (normalized.startsWith('[') && normalized.endsWith(']')) {
            try {
                const parsed = JSON.parse(normalized);
                if (Array.isArray(parsed)) {
                    const tokens = parsed
                        .map(v => (typeof v === 'string' ? v : String(v)))
                        .map(v => v.replace(/^\s*['\"]?|['\"]?\s*$/g, ''))
                        .map(v => v.toUpperCase().trim())
                        .filter(Boolean);
                    return { suppressions: tokens, canReceiveEmail: false };
                }
            } catch {
                // fall through
            }
        }
        // Fallback split
        const parts = normalized
            .replace(/^\[/, '').replace(/\]$/, '')
            .split(/[,;|]/)
            .map(p => p.replace(/^\s*['\"]?|['\"]?\s*$/g, ''))
            .map(p => p.toUpperCase().trim())
            .filter(Boolean);
        return { suppressions: parts, canReceiveEmail: false };
    }

    /**
     * Get audience insights from processed subscribers
     */
    getAudienceInsights(subscribers: ProcessedSubscriber[]): AudienceInsights {
        const totalSubscribers = subscribers.length;

        if (totalSubscribers === 0) {
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

        const buyers = subscribers.filter(s => s.isBuyer);
        const nonBuyers = subscribers.filter(s => !s.isBuyer);

        // Calculate averages
        const avgClvAll = subscribers.reduce((sum, s) => sum + s.totalClv, 0) / totalSubscribers;
        const avgClvBuyers = buyers.length > 0
            ? buyers.reduce((sum, s) => sum + s.totalClv, 0) / buyers.length
            : 0;

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
            zeroTo3Months: subscribers.filter(s => s.lifetimeInDays <= 90).length,
            threeTo6Months: subscribers.filter(s => s.lifetimeInDays > 90 && s.lifetimeInDays <= 180).length,
            sixTo12Months: subscribers.filter(s => s.lifetimeInDays > 180 && s.lifetimeInDays <= 365).length,
            oneToTwoYears: subscribers.filter(s => s.lifetimeInDays > 365 && s.lifetimeInDays <= 730).length,
            twoYearsPlus: subscribers.filter(s => s.lifetimeInDays > 730).length
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
    }

    /**
     * Get summary statistics for transformed subscribers
     */
    getSummaryStats(subscribers: ProcessedSubscriber[]): {
        totalSubscribers: number;
        totalBuyers: number;
        buyerPercentage: number;
        avgLifetimeDays: number;
        totalRevenue: number;
        avgRevenuePerSubscriber: number;
        avgRevenuePerBuyer: number;
        consentRate: number;
    } {
        if (subscribers.length === 0) {
            return {
                totalSubscribers: 0,
                totalBuyers: 0,
                buyerPercentage: 0,
                avgLifetimeDays: 0,
                totalRevenue: 0,
                avgRevenuePerSubscriber: 0,
                avgRevenuePerBuyer: 0,
                consentRate: 0
            };
        }

        const buyers = subscribers.filter(s => s.isBuyer);
        const totalRevenue = subscribers.reduce((sum, s) => sum + s.totalClv, 0);
        const avgLifetimeDays = subscribers.reduce((sum, s) => sum + s.lifetimeInDays, 0) / subscribers.length;
        const consentCount = subscribers.filter(s => s.emailConsent).length;

        return {
            totalSubscribers: subscribers.length,
            totalBuyers: buyers.length,
            buyerPercentage: (buyers.length / subscribers.length) * 100,
            avgLifetimeDays,
            totalRevenue,
            avgRevenuePerSubscriber: totalRevenue / subscribers.length,
            avgRevenuePerBuyer: buyers.length > 0 ? totalRevenue / buyers.length : 0,
            consentRate: (consentCount / subscribers.length) * 100
        };
    }

    /**
     * Get top sources
     */
    getTopSources(subscribers: ProcessedSubscriber[], limit: number = 10): Array<{
        source: string;
        count: number;
        percentage: number;
        buyers: number;
        revenue: number;
    }> {
        // Group by source
        const sourceMap = new Map<string, {
            count: number;
            buyers: number;
            revenue: number;
        }>();

        subscribers.forEach(sub => {
            const source = sub.source || 'Unknown';
            if (!sourceMap.has(source)) {
                sourceMap.set(source, { count: 0, buyers: 0, revenue: 0 });
            }

            const data = sourceMap.get(source)!;
            data.count++;
            if (sub.isBuyer) {
                data.buyers++;
                data.revenue += sub.totalClv;
            }
        });

        // Convert to array and sort by count
        const sources = Array.from(sourceMap.entries())
            .map(([source, data]) => ({
                source,
                count: data.count,
                percentage: (data.count / subscribers.length) * 100,
                buyers: data.buyers,
                revenue: data.revenue
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sources;
    }

    /**
     * Get location insights
     */
    getLocationInsights(subscribers: ProcessedSubscriber[]): {
        topCountries: Array<{ country: string; count: number; percentage: number }>;
        topStates: Array<{ state: string; count: number; percentage: number }>;
        topCities: Array<{ city: string; count: number; percentage: number }>;
    } {
        const total = subscribers.length;

        // Count by country
        const countryMap = new Map<string, number>();
        const stateMap = new Map<string, number>();
        const cityMap = new Map<string, number>();

        subscribers.forEach(sub => {
            // Country
            const country = sub.country || 'Unknown';
            countryMap.set(country, (countryMap.get(country) || 0) + 1);

            // State
            const state = sub.state || 'Unknown';
            stateMap.set(state, (stateMap.get(state) || 0) + 1);

            // City
            const city = sub.city || 'Unknown';
            cityMap.set(city, (cityMap.get(city) || 0) + 1);
        });

        // Convert to sorted arrays
        const topCountries = Array.from(countryMap.entries())
            .map(([country, count]) => ({
                country,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topStates = Array.from(stateMap.entries())
            .map(([state, count]) => ({
                state,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topCities = Array.from(cityMap.entries())
            .map(([city, count]) => ({
                city,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return { topCountries, topStates, topCities };
    }
}