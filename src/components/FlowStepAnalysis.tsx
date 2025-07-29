import React, { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Workflow, GitBranch } from 'lucide-react';
import { DataManager } from '../utils/dataManager';

interface FlowStepAnalysisProps {
    isDarkMode: boolean;
    dateRange: string;
}

interface FlowStepMetrics {
    sequencePosition: number;
    emailName: string;
    emailsSent: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
    conversionRate: number;
    unsubscribeRate: number;
    avgOrderValue: number;
    dropOffRate: number;
    bounceRate: number;
    spamRate: number;
    revenuePerEmail: number;
    totalOrders: number;
}

const FlowStepAnalysis: React.FC<FlowStepAnalysisProps> = ({ isDarkMode, dateRange }) => {
    // Tooltip state for charts
    const [tooltip, setTooltip] = useState<{
        chartIndex: number;
        x: number;
        y: number;
        value: number;
        date: string;
    } | null>(null);

    // Metric options must be declared before any hooks that use them
    const metricOptions = [
        { value: 'revenue', label: 'Revenue', format: 'currency' },
        { value: 'emailsSent', label: 'Emails Sent', format: 'number' },
        { value: 'openRate', label: 'Open Rate', format: 'percentage' },
        { value: 'clickRate', label: 'Click Rate', format: 'percentage' },
        { value: 'clickToOpenRate', label: 'Click to Open Rate', format: 'percentage' },
        { value: 'conversionRate', label: 'Conversion Rate', format: 'percentage' },
        { value: 'unsubscribeRate', label: 'Unsubscribe Rate', format: 'percentage', isNegative: true },
        { value: 'bounceRate', label: 'Bounce Rate', format: 'percentage', isNegative: true },
        { value: 'spamRate', label: 'Spam Rate', format: 'percentage', isNegative: true },
        { value: 'avgOrderValue', label: 'Average Order Value', format: 'currency' },
        { value: 'revenuePerEmail', label: 'Revenue per Email', format: 'currency' },
        { value: 'totalOrders', label: 'Total Orders', format: 'number' }
    ];
    const [selectedFlow, setSelectedFlow] = useState<string>('');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    // Tooltip state for charts
    // (Removed unused tooltip state)

    // Get data from DataManager
    const dataManager = DataManager.getInstance();
    const ALL_FLOW_EMAILS = dataManager.getFlowEmails();

    // Get unique live flow names
    const uniqueFlowNames = useMemo(() => {
        const liveFlows = ALL_FLOW_EMAILS.filter(email =>
            email.status && email.status.toLowerCase() === 'live'
        );
        return Array.from(new Set(liveFlows.map(email => email.flowName))).sort();
    }, [ALL_FLOW_EMAILS]);

    // Filter flow emails based on date range
    const filteredFlowEmails = useMemo(() => {
        let filtered = ALL_FLOW_EMAILS.filter(email =>
            email.status && email.status.toLowerCase() === 'live'
        );

        // Filter by date range: include both current and previous periods
        if (dateRange !== 'all') {
            const days = parseInt(dateRange.replace('d', ''));
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            // Previous period
            const prevEndDate = new Date(startDate);
            const prevStartDate = new Date(prevEndDate);
            prevStartDate.setDate(prevEndDate.getDate() - days);
            // Include emails from prevStartDate to endDate (inclusive)
            filtered = filtered.filter(email => {
                const sent = new Date(email.sentDate);
                return sent >= prevStartDate && sent <= endDate;
            });
        }

        return filtered;
    }, [ALL_FLOW_EMAILS, dateRange]);

    // Get flow sequence info
    const flowSequenceInfo = useMemo(() => {
        if (!selectedFlow) return null;
        return dataManager.getFlowSequenceInfo(selectedFlow);
    }, [selectedFlow]);

    // Calculate metrics for each step in the selected flow
    const flowStepMetrics = useMemo((): FlowStepMetrics[] => {
        if (!selectedFlow || !flowSequenceInfo) return [];

        const flowEmails = filteredFlowEmails.filter(email => email.flowName === selectedFlow);

        // Build metrics strictly in CSV order
        const stepMetrics: FlowStepMetrics[] = [];
        let previousEmailsSent = 0;
        flowSequenceInfo.messageIds.forEach((messageId, idx) => {
            // Get all emails for this step
            const stepEmails = flowEmails.filter(email => email.flowMessageId === messageId);
            // Sort emails within the step by Flow Message Name
            const sortedStepEmails = [...stepEmails].sort((a, b) => {
                if (a.emailName < b.emailName) return -1;
                if (a.emailName > b.emailName) return 1;
                return 0;
            });
            // Aggregate metrics
            const emailName = sortedStepEmails.length > 0 ? sortedStepEmails[0].emailName : flowSequenceInfo.emailNames[idx] || `Email ${idx + 1}`;
            const totalEmailsSent = sortedStepEmails.reduce((sum, email) => sum + email.emailsSent, 0);
            const totalRevenue = sortedStepEmails.reduce((sum, email) => sum + email.revenue, 0);
            const totalOrders = sortedStepEmails.reduce((sum, email) => sum + email.totalOrders, 0);
            const totalOpens = sortedStepEmails.reduce((sum, email) => sum + email.uniqueOpens, 0);
            const totalClicks = sortedStepEmails.reduce((sum, email) => sum + email.uniqueClicks, 0);
            const totalUnsubscribes = sortedStepEmails.reduce((sum, email) => sum + email.unsubscribesCount, 0);
            const totalBounces = sortedStepEmails.reduce((sum, email) => sum + email.bouncesCount, 0);
            const totalSpam = sortedStepEmails.reduce((sum, email) => sum + email.spamComplaintsCount, 0);

            // Calculate rates
            const openRate = totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0;
            const clickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;
            const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
            const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
            const unsubscribeRate = totalEmailsSent > 0 ? (totalUnsubscribes / totalEmailsSent) * 100 : 0;
            const bounceRate = totalEmailsSent > 0 ? (totalBounces / totalEmailsSent) * 100 : 0;
            const spamRate = totalEmailsSent > 0 ? (totalSpam / totalEmailsSent) * 100 : 0;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const revenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;

            // Calculate drop-off rate
            let dropOffRate = 0;
            if (idx > 0 && previousEmailsSent > 0) {
                dropOffRate = ((previousEmailsSent - totalEmailsSent) / previousEmailsSent) * 100;
            }

            stepMetrics.push({
                sequencePosition: idx + 1,
                emailName,
                emailsSent: totalEmailsSent,
                revenue: totalRevenue,
                openRate,
                clickRate,
                clickToOpenRate,
                conversionRate,
                unsubscribeRate,
                avgOrderValue,
                dropOffRate,
                bounceRate,
                spamRate,
                revenuePerEmail,
                totalOrders
            });

            previousEmailsSent = totalEmailsSent;
        });

        return stepMetrics;
    }, [selectedFlow, filteredFlowEmails, flowSequenceInfo]);

    // Granularity rules
    const getGranularityForDateRange = (dateRange: string, allTimeDays?: number) => {
        if (dateRange === 'all') {
            if (allTimeDays && allTimeDays > 365) return 'monthly';
            // If less than 365 days, use rules below
            if (allTimeDays) {
                if (allTimeDays <= 30) return 'daily';
                if (allTimeDays <= 60) return 'daily';
                if (allTimeDays <= 90) return 'weekly';
                if (allTimeDays <= 120) return 'weekly';
                if (allTimeDays <= 180) return 'weekly';
                if (allTimeDays <= 365) return 'monthly';
            }
            return 'monthly';
        }
        if (dateRange === '30d') return 'daily';
        if (dateRange === '60d') return 'daily';
        if (dateRange === '90d') return 'weekly';
        if (dateRange === '120d') return 'weekly';
        if (dateRange === '180d') return 'weekly';
        if (dateRange === '365d') return 'monthly';
        return 'daily';
    };

    // Calculate sparkline data for each step
    const getStepSparklineData = (sequencePosition: number, metric: string) => {
        if (!selectedFlow) return [];
        let granularity: 'daily' | 'weekly' | 'monthly';
        let chartEmails = filteredFlowEmails;
        if (dateRange !== 'all') {
            // Only use current period emails for chart
            const days = parseInt(dateRange.replace('d', ''));
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            chartEmails = filteredFlowEmails.filter(email => {
                const sent = new Date(email.sentDate);
                return sent >= startDate && sent <= endDate;
            });
        }
        if (dateRange === 'all') {
            if (filteredFlowEmails.length === 0) return [];
            const dates = filteredFlowEmails.map(e => new Date(e.sentDate));
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
            const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            granularity = getGranularityForDateRange(dateRange, diffDays) as 'daily' | 'weekly' | 'monthly';
        } else {
            granularity = getGranularityForDateRange(dateRange) as 'daily' | 'weekly' | 'monthly';
        }
        return dataManager.getFlowStepTimeSeries(
            chartEmails,
            selectedFlow,
            sequencePosition,
            metric,
            dateRange,
            granularity
        );
    };

    // Calculate shared Y axis range for all steps in the flow
    const sharedYAxisRange = useMemo(() => {
        if (!selectedFlow) return { min: 0, max: 10 };
        let allValues: number[] = [];
        for (let position = 1; flowSequenceInfo && position <= flowSequenceInfo.sequenceLength; position++) {
            const data = getStepSparklineData(position, selectedMetric);
            allValues = allValues.concat(data.map(d => d.value));
        }
        if (allValues.length === 0) return { min: 0, max: 10 };
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        let min = 0;
        let max = maxValue;
        if (maxValue - minValue < 0.01 || maxValue === 0) {
            max = maxValue > 0 ? maxValue * 1.5 : 10;
        } else {
            max = maxValue * 1.2;
        }
        // Use metric formatting for rounding
        const metricConfig = metricOptions.find(m => m.value === selectedMetric);
        if (metricConfig?.format === 'currency') {
            if (max > 10000) max = Math.ceil(max / 1000) * 1000;
            else if (max > 1000) max = Math.ceil(max / 100) * 100;
            else if (max > 100) max = Math.ceil(max / 10) * 10;
            else max = Math.ceil(max);
        } else if (metricConfig?.format === 'percentage') {
            if (max < 1) max = Math.ceil(max * 100) / 100;
            else if (max < 10) max = Math.ceil(max);
            else max = Math.ceil(max / 5) * 5;
        } else {
            if (max > 1000) max = Math.ceil(max / 100) * 100;
            else if (max > 100) max = Math.ceil(max / 10) * 10;
            else max = Math.ceil(max);
        }
        return { min, max };
    }, [selectedFlow, selectedMetric, flowSequenceInfo, filteredFlowEmails]);

    // Calculate period-over-period change for a step
    const getStepPeriodChange = (sequencePosition: number, metric: string): { change: number; isPositive: boolean } | null => {
        if (!selectedFlow || dateRange === 'all') return null;

        const stepEmails = filteredFlowEmails.filter(email =>
            email.flowName === selectedFlow && email.sequencePosition === sequencePosition
        );

        if (stepEmails.length === 0) return null;

        // Calculate current period metrics
        const endDate = new Date();
        let startDate = new Date();

        const days = parseInt(dateRange.replace('d', ''));
        startDate.setDate(startDate.getDate() - days);

        // Calculate previous period
        const periodLength = days;
        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - periodLength);

        // Filter emails by periods
        // Use only date part for filtering, inclusive of both boundaries
        const toDateOnly = (date: Date) => {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };
        const startDateOnly = toDateOnly(startDate);
        const endDateOnly = toDateOnly(endDate);
        const prevStartDateOnly = toDateOnly(prevStartDate);
        const prevEndDateOnly = toDateOnly(prevEndDate);

        // Current period: inclusive of start and end
        const currentPeriodEmails = stepEmails.filter(e => {
            const sent = toDateOnly(e.sentDate);
            return sent >= startDateOnly && sent <= endDateOnly;
        });
        // Previous period: inclusive of start and end
        const previousPeriodEmails = stepEmails.filter(e => {
            const sent = toDateOnly(e.sentDate);
            return sent >= prevStartDateOnly && sent <= prevEndDateOnly;
        });

        // Debug output for date ranges and counts
        console.log('Current period:', startDateOnly, 'to', endDateOnly, 'Count:', currentPeriodEmails.length);
        console.log('Previous period:', prevStartDateOnly, 'to', prevEndDateOnly, 'Count:', previousPeriodEmails.length);

        // Debug output
        console.log('--- getStepPeriodChange ---');
        console.log('selectedFlow:', selectedFlow);
        console.log('sequencePosition:', sequencePosition);
        console.log('metric:', metric);
        console.log('startDate:', startDate, 'endDate:', endDate);
        console.log('prevStartDate:', prevStartDate, 'prevEndDate:', prevEndDate);
        console.log('currentPeriodEmails:', currentPeriodEmails.length, currentPeriodEmails.map(e => e.sentDate));
        console.log('previousPeriodEmails:', previousPeriodEmails.length, previousPeriodEmails.map(e => e.sentDate));

        if (currentPeriodEmails.length === 0) {
            console.log('No current period data available for this step/metric.');
            return null;
        }

        if (previousPeriodEmails.length === 0) {
            console.log('No previous period data available for this step/metric.');
            // Show 100% change if current period has data but previous does not
            return { change: 100, isPositive: true };
        }

        // Calculate metrics for both periods
        const calculateMetricValue = (emails: typeof stepEmails, metricKey: string): number => {
            const totalEmailsSent = emails.reduce((sum, e) => sum + e.emailsSent, 0);

            switch (metricKey) {
                case 'revenue':
                    return emails.reduce((sum, e) => sum + e.revenue, 0);
                case 'openRate':
                    const totalOpens = emails.reduce((sum, e) => sum + e.uniqueOpens, 0);
                    return totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0;
                case 'clickRate':
                    const totalClicks = emails.reduce((sum, e) => sum + e.uniqueClicks, 0);
                    return totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;
                case 'conversionRate':
                    const clicks = emails.reduce((sum, e) => sum + e.uniqueClicks, 0);
                    const orders = emails.reduce((sum, e) => sum + e.totalOrders, 0);
                    return clicks > 0 ? (orders / clicks) * 100 : 0;
                case 'unsubscribeRate':
                    const unsubs = emails.reduce((sum, e) => sum + e.unsubscribesCount, 0);
                    return totalEmailsSent > 0 ? (unsubs / totalEmailsSent) * 100 : 0;
                case 'bounceRate':
                    const bounces = emails.reduce((sum, e) => sum + e.bouncesCount, 0);
                    return totalEmailsSent > 0 ? (bounces / totalEmailsSent) * 100 : 0;
                case 'spamRate':
                    const spam = emails.reduce((sum, e) => sum + e.spamComplaintsCount, 0);
                    return totalEmailsSent > 0 ? (spam / totalEmailsSent) * 100 : 0;
                default:
                    return 0;
            }
        };

        const currentValue = calculateMetricValue(currentPeriodEmails, metric);
        const previousValue = calculateMetricValue(previousPeriodEmails, metric);

        let change = 0;
        if (previousValue !== 0) {
            change = ((currentValue - previousValue) / previousValue) * 100;
        } else if (currentValue > 0) {
            change = 100;
        }

        // Determine if positive (for negative metrics like unsubscribe rate, lower is better)
        const negativeMetrics = ['unsubscribeRate', 'spamRate', 'bounceRate'];
        const isNegativeMetric = negativeMetrics.includes(metric);
        const isPositive = isNegativeMetric ? change < 0 : change > 0;

        return { change, isPositive };
    };


    const formatMetricValue = (value: number, metric: string) => {
        const metricConfig = metricOptions.find(m => m.value === metric);
        if (!metricConfig) return value.toString();

        switch (metricConfig.format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(value);
            case 'percentage':
                // Use more decimals for very small values
                if (value < 0.1 && value > 0) {
                    return `${value.toFixed(3)}%`;
                } else if (value < 1 && value > 0) {
                    return `${value.toFixed(2)}%`;
                }
                return `${value.toFixed(1)}%`;
            default:
                return new Intl.NumberFormat('en-US').format(Math.round(value));
        }
    };

    // Calculate Y-axis range for a step based on its sparkline data
    const getStepYAxisRange = (sparklineData: any[], metric: string) => {
        if (sparklineData.length === 0) {
            return metric === 'revenue' ? { min: 0, max: 100 } : { min: 0, max: 10 };
        }

        const values = sparklineData.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Always start from 0 for better visual consistency
        let min = 0;
        let max = maxValue;

        // If all values are the same or very close, add padding
        if (maxValue - minValue < 0.01 || maxValue === 0) {
            max = maxValue > 0 ? maxValue * 1.5 : 10;
        } else {
            // Add 20% padding to top
            max = maxValue * 1.2;
        }

        // Round to nice numbers based on metric type
        const metricConfig = metricOptions.find(m => m.value === metric);

        if (metricConfig?.format === 'currency') {
            // Round currency to nice numbers
            if (max > 10000) {
                max = Math.ceil(max / 1000) * 1000;
            } else if (max > 1000) {
                max = Math.ceil(max / 100) * 100;
            } else if (max > 100) {
                max = Math.ceil(max / 10) * 10;
            } else {
                max = Math.ceil(max);
            }
        } else if (metricConfig?.format === 'percentage') {
            // Round percentages appropriately
            if (max < 1) {
                max = Math.ceil(max * 100) / 100;
            } else if (max < 10) {
                max = Math.ceil(max);
            } else {
                max = Math.ceil(max / 5) * 5;
            }
        } else {
            // Numbers - round to nice values
            if (max > 1000) {
                max = Math.ceil(max / 100) * 100;
            } else if (max > 100) {
                max = Math.ceil(max / 10) * 10;
            } else {
                max = Math.ceil(max);
            }
        }

        return { min, max };
    };

    // Render a single chart
    const renderStepChart = (step: FlowStepMetrics, index: number) => {
        const sparklineData = getStepSparklineData(step.sequencePosition, selectedMetric);
        const periodChange = getStepPeriodChange(step.sequencePosition, selectedMetric);
        const metricConfig = metricOptions.find(m => m.value === selectedMetric);
        const value = step[selectedMetric as keyof FlowStepMetrics] as number;
        const yAxisRange = sharedYAxisRange;

        // Chart color logic
        let chartColor = '#8b5cf6'; // Purple default
        let dotColor = chartColor;
        let changeArrow = null;
        let changeText = null;

        if (periodChange !== null && dateRange !== 'all') {
            const isNegativeMetric = metricConfig?.isNegative || false;
            const isPositiveChange = periodChange.isPositive;
            if (isNegativeMetric) {
                chartColor = isPositiveChange ? '#10b981' : '#ef4444'; // green if lower, red if higher
                dotColor = chartColor;
            } else {
                chartColor = isPositiveChange ? '#10b981' : '#ef4444'; // green if higher, red if lower
                dotColor = chartColor;
            }
            // Arrow and percentage
            changeArrow = isPositiveChange
                ? <span style={{ color: chartColor }}>↑</span>
                : <span style={{ color: chartColor }}>↓</span>;
            changeText = (
                <span style={{ color: chartColor, fontWeight: 500 }}>
                    {changeArrow} {Math.abs(periodChange.change).toFixed(1)}%
                </span>
            );
        }

        // If no data, use gray
        if (value === 0 && sparklineData.length === 0) {
            chartColor = isDarkMode ? '#6b7280' : '#9ca3af';
            dotColor = chartColor;
        }

        // Chart gradient
        const chartGradient = `linear-gradient(180deg, ${chartColor}40 0%, ${chartColor}10 100%)`;

        // Use parent tooltip state

        // X axis ticks and labels
        let xTicks: { x: number; label: string }[] = [];
        if (sparklineData.length > 1) {
            const tickCount = Math.min(6, sparklineData.length);
            for (let i = 0; i < tickCount; i++) {
                const idx = Math.round((i / (tickCount - 1)) * (sparklineData.length - 1));
                const point = sparklineData[idx];
                const x = (idx / (sparklineData.length - 1)) * 900;
                const label = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                xTicks.push({ x, label });
            }
        }

        // Y axis ticks and labels (limit to 3)
        let yTicks: { y: number; label: string }[] = [];
        if (yAxisRange.max > yAxisRange.min) {
            const tickCount = 3;
            for (let i = 0; i < tickCount; i++) {
                const value = yAxisRange.min + ((yAxisRange.max - yAxisRange.min) * (i / (tickCount - 1)));
                const y = 120 - ((value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 100;
                yTicks.push({ y, label: formatMetricValue(value, selectedMetric) });
            }
        }

        return (
            <div key={step.sequencePosition} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
                <div className="flex items-center justify-between">
                    {/* Dot and Email Name */}
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor, display: 'inline-block' }} />
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{step.emailName}</span>
                    </div>
                    {/* Metric Value and Compared-to */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{formatMetricValue(value, selectedMetric)}</span>
                            {periodChange !== null && dateRange !== 'all' && (
                                <span className="text-lg font-bold px-2 py-1 rounded" style={{ color: chartColor, background: 'transparent' }}>
                                    {changeText}
                                </span>
                            )}
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{metricConfig?.label}</span>
                    </div>
                </div>
                {/* Chart */}
                <div className="mt-6 relative" style={{ height: '160px' }}>
                    {sparklineData.length > 1 ? (
                        <div className="relative h-full flex">
                            <svg width="100%" height="100%" viewBox="0 0 900 160" style={{ position: 'absolute', left: 0, top: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity="0.05" />
                                    </linearGradient>
                                </defs>
                                {/* Y axis ticks and labels */}
                                {yTicks.map((tick, i) => (
                                    <g key={i}>
                                        <line x1={0} y1={tick.y} x2={900} y2={tick.y} stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeDasharray="2,2" />
                                        <text x={-5} y={tick.y + 4} textAnchor="end" fontSize="12" fill={isDarkMode ? '#d1d5db' : '#6b7280'}>{tick.label}</text>
                                    </g>
                                ))}
                                {/* X axis ticks and labels */}
                                {xTicks.map((tick, i) => (
                                    <g key={i}>
                                        <line x1={tick.x} y1={120} x2={tick.x} y2={130} stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                        <text x={tick.x} y={145} textAnchor="middle" fontSize="12" fill={isDarkMode ? '#d1d5db' : '#6b7280'}>{tick.label}</text>
                                    </g>
                                ))}
                                {/* Chart area and line (no dots) */}
                                {(() => {
                                    // Generate points for the sparkline
                                    const points = sparklineData.map((point, i) => {
                                        const x = (i / (sparklineData.length - 1)) * 900;
                                        const y = 120 - ((point.value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 100;
                                        return { x, y, value: point.value, date: point.date };
                                    });
                                    if (points.length === 0) return null;
                                    // Create smooth curve path
                                    let pathD = `M ${points[0].x},${points[0].y}`;
                                    for (let i = 1; i < points.length; i++) {
                                        const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
                                        const cp1y = points[i - 1].y;
                                        const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
                                        const cp2y = points[i].y;
                                        pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
                                    }
                                    // Area path with gradient
                                    const areaPath = pathD + ` L 900,120 L 0,120 Z`;
                                    return (
                                        <g>
                                            <path d={areaPath} fill={`url(#gradient-${index})`} />
                                            <path d={pathD} fill="none" stroke={chartColor} strokeWidth="2" />
                                            {/* No dots for tooltip */}
                                        </g>
                                    );
                                })()}
                            </svg>
                            {/* Tooltip */}
                            {tooltip && tooltip.chartIndex === index && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${tooltip.x / 900 * 100}%`,
                                        top: `${tooltip.y - 40}px`,
                                        background: isDarkMode ? '#1e293b' : '#f3e8ff',
                                        color: isDarkMode ? '#fff' : '#6b7280',
                                        border: `1px solid ${chartColor}`,
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        minWidth: '120px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>{formatMetricValue(tooltip.value, selectedMetric)}</div>
                                    <div style={{ fontSize: '12px' }}>{new Date(tooltip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            )}
                        </div>
                    ) : value === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data available</span>
                        </div>
                    ) : (
                        <div className="relative h-full flex items-end">
                            <div
                                className="relative"
                                style={{
                                    width: '100%',
                                    height: `${Math.max((value / yAxisRange.max) * 100, 5)}%`,
                                    background: chartGradient,
                                    borderTop: `2px solid ${chartColor}`,
                                    borderRadius: '4px 4px 0 0'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Workflow className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Flow Step Analysis
                    </h3>
                </div>
                <div className="flex items-center gap-4">
                    {/* Flow Selector */}
                    <div className="relative">
                        <select
                            value={selectedFlow}
                            onChange={(e) => setSelectedFlow(e.target.value)}
                            className={`
                                appearance-none px-4 py-2 pr-8 rounded-lg border cursor-pointer
                                ${isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                } 
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                            `}
                        >
                            <option value="">Select a flow</option>
                            {uniqueFlowNames.map(flow => (
                                <option key={flow} value={flow}>{flow}</option>
                            ))}
                        </select>
                        <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>

                    {/* Metric Selector */}
                    <div className="relative">
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className={`
                                appearance-none px-4 py-2 pr-8 rounded-lg border cursor-pointer
                                ${isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                } 
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                            `}
                        >
                            {metricOptions.map(metric => (
                                <option key={metric.value} value={metric.value}>
                                    {metric.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                </div>
            </div>

            {/* Flow Steps Container */}
            {!selectedFlow ? (
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-12 text-center hover:shadow-xl transition-all duration-200`}>
                    <GitBranch className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select a flow to view step-by-step analysis
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {flowStepMetrics.map((step, index) => renderStepChart(step, index))}
                </div>
            )}
        </section>
    );
};

export default FlowStepAnalysis;