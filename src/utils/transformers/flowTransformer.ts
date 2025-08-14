import { RawFlowCSV, ProcessedFlowEmail, FlowSequenceInfo } from '../dataTypes';

export class FlowTransformer {
    /**
     * Transform raw CSV flows to processed format
     */
    transform(rawFlows: RawFlowCSV[]): ProcessedFlowEmail[] {
        // Step 1: Filter for Email channel only (exclude SMS)
        const emailFlows = rawFlows.filter(row => {
            const channel = row['Flow Message Channel'];
            return !channel || channel === 'Email' || channel === 'email' || channel === '';
        });

        // Step 2: Build flow sequence map
        const sequenceMap = this.buildSequenceMap(emailFlows);

        // Step 3: Transform each flow email
        const transformed: ProcessedFlowEmail[] = [];
        let id = 1;

        emailFlows.forEach(raw => {
            const sequencePosition = sequenceMap.get(`${raw['Flow ID']}_${raw['Flow Message ID']}`) || 1;
            transformed.push(this.transformSingle(raw, id++, sequencePosition));
        });

        return transformed;
    }

    /**
     * Build a map of flow message sequences
     */
    private buildSequenceMap(flows: RawFlowCSV[]): Map<string, number> {
        // Determine order by earliest observed send date per (flowId, messageId)
        const earliestByFlow = new Map<string, Map<string, number>>();

        flows.forEach(flow => {
            const flowId = flow['Flow ID'];
            const messageId = flow['Flow Message ID'];
            const ts = this.parseDate(flow['Day']).getTime();
            if (!earliestByFlow.has(flowId)) earliestByFlow.set(flowId, new Map());
            const inner = earliestByFlow.get(flowId)!;
            const prev = inner.get(messageId);
            if (prev === undefined || ts < prev) inner.set(messageId, ts);
        });

        const sequenceMap = new Map<string, number>();
        earliestByFlow.forEach((msgMap, flowId) => {
            const orderedIds = Array.from(msgMap.entries())
                .sort((a, b) => a[1] - b[1])
                .map(([messageId]) => messageId);
            orderedIds.forEach((messageId, index) => {
                sequenceMap.set(`${flowId}_${messageId}`, index + 1);
            });
        });

        return sequenceMap;
    }

    /**
     * Transform a single flow email
     */
    private transformSingle(raw: RawFlowCSV, id: number, sequencePosition: number): ProcessedFlowEmail {
        // Parse date
        const sentDate = this.parseDate(raw['Day']);

        // Parse numeric values
        const emailsSent = this.parseNumber(raw['Delivered']);
        const uniqueOpens = this.parseNumber(raw['Unique Opens']);
        const uniqueClicks = this.parseNumber(raw['Unique Clicks']);
        const totalOrders = this.parseNumber(raw['Unique Placed Order'] || raw['Placed Order'] || 0);
        const revenue = this.parseNumber(raw['Revenue'] || 0);

        // Parse bounce count from rate if not provided directly
        const bounceRate = this.parseDecimalRate(raw['Bounce Rate']);
        const bouncesCount = this.parseNumber(raw['Bounced']) || Math.round(emailsSent * bounceRate);

        // Parse unsubscribe count from rate if not provided directly
        // Check both 'Unsub Rate' and 'Unsubscribe Rate' fields
        const unsubscribeRate = this.parseDecimalRate(raw['Unsub Rate'] || raw['Unsubscribe Rate'] || 0);
        const unsubscribesCount = this.parseNumber(raw['Unsubscribes']) || Math.round(emailsSent * unsubscribeRate);

        // Parse spam count from rate if not provided directly
        // Check both 'Complaint Rate' and 'Spam Rate' fields
        const spamRate = this.parseDecimalRate(raw['Complaint Rate'] || raw['Spam Rate'] || 0);
        const spamComplaintsCount = this.parseNumber(raw['Spam']) || Math.round(emailsSent * spamRate);

        // Calculate rates (don't trust CSV rates for consistency)
        const openRate = emailsSent > 0 ? (uniqueOpens / emailsSent) * 100 : 0;
        const clickRate = emailsSent > 0 ? (uniqueClicks / emailsSent) * 100 : 0;
        const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
        const conversionRate = uniqueClicks > 0 ? (totalOrders / uniqueClicks) * 100 : 0;
        const revenuePerEmail = emailsSent > 0 ? revenue / emailsSent : 0;
        const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

        // Use Flow Message Name as email name, or generate from sequence position
        const emailName = raw['Flow Message Name'] || `Email ${sequencePosition}`;

        return {
            id,
            flowId: raw['Flow ID'],
            flowName: raw['Flow Name'],
            flowMessageId: raw['Flow Message ID'],
            emailName,
            sequencePosition,
            sentDate,
            status: raw['Status'] || 'unknown',
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
            unsubscribeRate: unsubscribeRate * 100, // Convert to percentage
            spamRate: spamRate * 100, // Convert to percentage
            bounceRate: bounceRate * 100, // Convert to percentage
            avgOrderValue
        };
    }

    /**
     * Parse date string to Date object
     */
    private parseDate(dateStr: string): Date {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date: ${dateStr}, using current date`);
            return new Date();
        }
        return date;
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

        const cleaned = value.toString()
            .replace(/,/g, '')
            .replace(/\$/g, '')
            .replace(/%/g, '')
            .trim();

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Parse decimal rate (0.05 = 5%)
     */
    private parseDecimalRate(value: string | number | undefined | null): number {
        if (value === undefined || value === null || value === '') {
            return 0;
        }

        // If it's already a number (like 0.05), use it directly
        if (typeof value === 'number') {
            return value;
        }

        // If it contains %, parse as percentage
        if (value.toString().includes('%')) {
            return this.parseNumber(value) / 100;
        }

        // Otherwise, assume it's already a decimal
        return this.parseNumber(value);
    }

    /**
     * Get flow sequence information
     */
    getFlowSequenceInfo(flowName: string, processedFlows: ProcessedFlowEmail[]): FlowSequenceInfo {
        const flowEmails = processedFlows.filter(email => email.flowName === flowName);

        if (flowEmails.length === 0) {
            return { flowId: '', messageIds: [], emailNames: [], sequenceLength: 0 };
        }

        // Group by messageId to compute stable order and latest name
        const byMessageId = new Map<string, { seq: number; earliestSeq: number; latestTs: number; latestName: string }>();

        flowEmails.forEach(email => {
            const key = email.flowMessageId;
            const ts = email.sentDate.getTime();
            if (!byMessageId.has(key)) {
                byMessageId.set(key, { seq: email.sequencePosition, earliestSeq: email.sequencePosition, latestTs: ts, latestName: email.emailName });
            } else {
                const cur = byMessageId.get(key)!;
                if (email.sequencePosition < cur.earliestSeq) cur.earliestSeq = email.sequencePosition;
                if (ts > cur.latestTs) {
                    cur.latestTs = ts;
                    cur.latestName = email.emailName;
                }
            }
        });

        const ordered = Array.from(byMessageId.entries())
            .sort((a, b) => a[1].earliestSeq - b[1].earliestSeq);

        return {
            flowId: flowEmails[0].flowId,
            messageIds: ordered.map(([id]) => id),
            emailNames: ordered.map(([_, v]) => v.latestName),
            sequenceLength: ordered.length
        };
    }

    /**
     * Get unique flow names
     */
    getUniqueFlowNames(processedFlows: ProcessedFlowEmail[]): string[] {
        return Array.from(new Set(processedFlows.map(email => email.flowName))).sort();
    }

    /**
     * Aggregate flow emails by day for a specific flow and sequence position
     */
    aggregateByDayAndPosition(
        processedFlows: ProcessedFlowEmail[],
        flowName: string,
        sequencePosition: number
    ): ProcessedFlowEmail[] {
        const filtered = processedFlows.filter(email =>
            email.flowName === flowName && email.sequencePosition === sequencePosition
        );

        // Group by day
        const dayMap = new Map<string, ProcessedFlowEmail[]>();

        filtered.forEach(email => {
            const dayKey = email.sentDate.toISOString().split('T')[0];
            if (!dayMap.has(dayKey)) {
                dayMap.set(dayKey, []);
            }
            dayMap.get(dayKey)!.push(email);
        });

        // Aggregate each day's data
        const aggregated: ProcessedFlowEmail[] = [];
        let id = 1;

        dayMap.forEach((emails, dayKey) => {
            const firstEmail = emails[0];
            const sentDate = new Date(dayKey);

            // Sum up metrics
            const totalEmailsSent = emails.reduce((sum, e) => sum + e.emailsSent, 0);
            const totalOpens = emails.reduce((sum, e) => sum + e.uniqueOpens, 0);
            const totalClicks = emails.reduce((sum, e) => sum + e.uniqueClicks, 0);
            const totalOrders = emails.reduce((sum, e) => sum + e.totalOrders, 0);
            const totalRevenue = emails.reduce((sum, e) => sum + e.revenue, 0);
            const totalUnsubs = emails.reduce((sum, e) => sum + e.unsubscribesCount, 0);
            const totalSpam = emails.reduce((sum, e) => sum + e.spamComplaintsCount, 0);
            const totalBounces = emails.reduce((sum, e) => sum + e.bouncesCount, 0);

            // Recalculate rates
            const openRate = totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0;
            const clickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;
            const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
            const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
            const revenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;
            const unsubscribeRate = totalEmailsSent > 0 ? (totalUnsubs / totalEmailsSent) * 100 : 0;
            const spamRate = totalEmailsSent > 0 ? (totalSpam / totalEmailsSent) * 100 : 0;
            const bounceRate = totalEmailsSent > 0 ? (totalBounces / totalEmailsSent) * 100 : 0;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            aggregated.push({
                id: id++,
                flowId: firstEmail.flowId,
                flowName: firstEmail.flowName,
                flowMessageId: firstEmail.flowMessageId,
                emailName: firstEmail.emailName,
                sequencePosition: firstEmail.sequencePosition,
                sentDate,
                status: firstEmail.status,
                emailsSent: totalEmailsSent,
                uniqueOpens: totalOpens,
                uniqueClicks: totalClicks,
                totalOrders,
                revenue: totalRevenue,
                unsubscribesCount: totalUnsubs,
                spamComplaintsCount: totalSpam,
                bouncesCount: totalBounces,
                openRate,
                clickRate,
                clickToOpenRate,
                conversionRate,
                revenuePerEmail,
                unsubscribeRate,
                spamRate,
                bounceRate,
                avgOrderValue
            });
        });

        return aggregated.sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime());
    }
}