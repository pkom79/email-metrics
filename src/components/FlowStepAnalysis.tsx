import React, { useState, useMemo } from 'react';
import { ChevronDown, Workflow, GitBranch, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { DataManager } from '../utils/dataManager';

interface FlowStepAnalysisProps {
    isDarkMode: boolean;
    dateRange: string;
    // NEW: accept global granularity like Metric Cards
    granularity: 'daily' | 'weekly' | 'monthly';
    compareMode?: 'prev-period' | 'prev-year';
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
    // NEW: exact clicks to compute view-through conversions
    totalClicks: number;
}

const FlowStepAnalysis: React.FC<FlowStepAnalysisProps> = ({ isDarkMode, dateRange, granularity, compareMode = 'prev-period' }) => {
    // Tooltip state for charts
    const [tooltip] = useState<{
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

    // Get data from DataManager
    const dataManager = DataManager.getInstance();
    const ALL_FLOW_EMAILS = dataManager.getFlowEmails();

    // Helper: date-only (strip time)
    const toDateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Compute date windows for current and previous periods (anchored to last email activity)
    const dateWindows = useMemo(() => {
        if (dateRange === 'all') return null;
        const days = parseInt(dateRange.replace('d', ''));
        const endDate = toDateOnly(dataManager.getLastEmailDate());
        const startDate = toDateOnly(new Date(endDate));
        startDate.setDate(endDate.getDate() - days);
        let prevStartDate: Date; let prevEndDate: Date;
        if (compareMode === 'prev-year') {
            prevStartDate = toDateOnly(new Date(startDate));
            prevEndDate = toDateOnly(new Date(endDate));
            prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
            prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
        } else {
            prevEndDate = toDateOnly(new Date(startDate));
            prevStartDate = toDateOnly(new Date(prevEndDate));
            prevStartDate.setDate(prevEndDate.getDate() - days);
        }
        return { startDateOnly: startDate, endDateOnly: endDate, prevStartDateOnly: prevStartDate, prevEndDateOnly: prevEndDate, days };
    }, [dateRange, dataManager, compareMode]);

    // Live flows only
    const liveFlowEmails = useMemo(() => {
        return ALL_FLOW_EMAILS.filter(e => e.status && e.status.toLowerCase() === 'live');
    }, [ALL_FLOW_EMAILS]);

    // Unique flow names for selector
    const uniqueFlowNames = useMemo((): string[] => {
        const names = new Set<string>();
        for (const e of liveFlowEmails) {
            if (e.flowName) names.add(e.flowName);
        }
        return Array.from(names).sort();
    }, [liveFlowEmails]);

    // Current-period emails (used for header + chart)
    const currentFlowEmails = useMemo(() => {
        if (!dateWindows) return liveFlowEmails; // 'all' = entire dataset
        const { startDateOnly, endDateOnly } = dateWindows;
        return liveFlowEmails.filter(e => {
            const sent = toDateOnly(new Date(e.sentDate));
            return sent >= startDateOnly && sent <= endDateOnly;
        });
    }, [liveFlowEmails, dateWindows]);

    // Previous-period emails (used only for PoP)
    const previousFlowEmails = useMemo(() => {
        if (!dateWindows) return [];
        const { prevStartDateOnly, prevEndDateOnly } = dateWindows;
        return liveFlowEmails.filter(e => {
            const sent = toDateOnly(new Date(e.sentDate));
            return sent >= prevStartDateOnly && sent <= prevEndDateOnly;
        });
    }, [liveFlowEmails, dateWindows]);

    // Get flow sequence info
    const flowSequenceInfo = useMemo(() => {
        if (!selectedFlow) return null;
        return dataManager.getFlowSequenceInfo(selectedFlow);
    }, [selectedFlow]);

    // Detect duplicate step names (structure-level, not time-filtered)
    const duplicateNameCounts = useMemo((): Record<string, number> => {
        const counts: Record<string, number> = {};
        const names = flowSequenceInfo?.emailNames || [];
        for (const raw of names) {
            const name = (raw || '').trim();
            if (!name) continue;
            counts[name] = (counts[name] || 0) + 1;
        }
        return counts;
    }, [flowSequenceInfo]);

    const hasDuplicateNames = useMemo(
        () => Object.values(duplicateNameCounts).some(c => c > 1),
        [duplicateNameCounts]
    );

    // Calculate metrics for each step in the selected flow
    const flowStepMetrics = useMemo((): FlowStepMetrics[] => {
        if (!selectedFlow || !flowSequenceInfo) return [];

        const flowEmails = currentFlowEmails.filter(email => email.flowName === selectedFlow);

        const stepMetrics: FlowStepMetrics[] = [];
        let previousEmailsSent = 0;
        flowSequenceInfo.messageIds.forEach((messageId, idx) => {
            // Get all emails for this step
            const stepEmails = flowEmails.filter(email => email.flowMessageId === messageId);
            // Sort step emails by date to ensure stable metrics (name can vary)
            const sortedStepEmails = [...stepEmails].sort((a, b) => a.sentDate.getTime() - b.sentDate.getTime());

            // Use canonical latest name from sequence info for display
            const emailName = flowSequenceInfo.emailNames[idx] || (sortedStepEmails.length > 0
                ? sortedStepEmails[sortedStepEmails.length - 1].emailName
                : `Email ${idx + 1}`);

            const totalEmailsSent = sortedStepEmails.reduce((sum, email) => sum + email.emailsSent, 0);
            const totalRevenue = sortedStepEmails.reduce((sum, email) => sum + email.revenue, 0);
            const totalOrders = sortedStepEmails.reduce((sum, email) => sum + email.totalOrders, 0);
            const totalOpens = sortedStepEmails.reduce((sum, email) => sum + email.uniqueOpens, 0);
            const totalClicks = sortedStepEmails.reduce((sum, email) => sum + email.uniqueClicks, 0);
            const totalUnsubscribes = sortedStepEmails.reduce((sum, email) => sum + email.unsubscribesCount, 0);
            const totalBounces = sortedStepEmails.reduce((sum, email) => sum + email.bouncesCount, 0);
            const totalSpam = sortedStepEmails.reduce((sum, email) => sum + email.spamComplaintsCount, 0);

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
                totalOrders,
                totalClicks
            });

            previousEmailsSent = totalEmailsSent;
        });

        return stepMetrics;
    }, [selectedFlow, currentFlowEmails, flowSequenceInfo]);

    // Calculate sparkline data for each step using global granularity from props
    const getStepSparklineData = (sequencePosition: number, metric: string) => {
        if (!selectedFlow) return [];
        const chartEmails = currentFlowEmails; // already limited by dateRange
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
    }, [selectedFlow, selectedMetric, flowSequenceInfo, currentFlowEmails, granularity]);

    // Calculate period-over-period change for a step, include previous value and previous period for tooltip
    const getStepPeriodChange = (sequencePosition: number, metric: string): {
        change: number; isPositive: boolean; previousValue: number; previousPeriod: { startDate: Date; endDate: Date }
    } | null => {
        if (!selectedFlow || dateRange === 'all') return null;

        const currStepEmails = currentFlowEmails.filter(e => e.flowName === selectedFlow && e.sequencePosition === sequencePosition);
        const prevStepEmails = previousFlowEmails.filter(e => e.flowName === selectedFlow && e.sequencePosition === sequencePosition);

        if (currStepEmails.length === 0) return null;

        const calculateMetricValue = (emails: typeof currStepEmails, metricKey: string): number => {
            const totals = emails.reduce(
                (acc, e) => {
                    acc.emailsSent += e.emailsSent || 0;
                    acc.revenue += e.revenue || 0;
                    acc.orders += e.totalOrders || 0;
                    acc.opens += e.uniqueOpens || 0;
                    acc.clicks += e.uniqueClicks || 0;
                    acc.unsubs += e.unsubscribesCount || 0;
                    acc.bounces += e.bouncesCount || 0;
                    acc.spam += e.spamComplaintsCount || 0;
                    return acc;
                },
                { emailsSent: 0, revenue: 0, orders: 0, opens: 0, clicks: 0, unsubs: 0, bounces: 0, spam: 0 }
            );

            switch (metricKey) {
                case 'revenue': return totals.revenue;
                case 'emailsSent': return totals.emailsSent;
                case 'totalOrders': return totals.orders;
                case 'avgOrderValue': return totals.orders > 0 ? totals.revenue / totals.orders : 0;
                case 'revenuePerEmail': return totals.emailsSent > 0 ? totals.revenue / totals.emailsSent : 0;
                case 'openRate': return totals.emailsSent > 0 ? (totals.opens / totals.emailsSent) * 100 : 0;
                case 'clickRate': return totals.emailsSent > 0 ? (totals.clicks / totals.emailsSent) * 100 : 0;
                case 'clickToOpenRate': return totals.opens > 0 ? (totals.clicks / totals.opens) * 100 : 0;
                case 'conversionRate': return totals.clicks > 0 ? (totals.orders / totals.clicks) * 100 : 0;
                case 'unsubscribeRate': return totals.emailsSent > 0 ? (totals.unsubs / totals.emailsSent) * 100 : 0;
                case 'bounceRate': return totals.emailsSent > 0 ? (totals.bounces / totals.emailsSent) * 100 : 0;
                case 'spamRate': return totals.emailsSent > 0 ? (totals.spam / totals.emailsSent) * 100 : 0;
                default: return 0;
            }
        };

        const currentValue = calculateMetricValue(currStepEmails, metric);
        const previousValue = calculateMetricValue(prevStepEmails, metric);

        // If no baseline, don't force +100% — show nothing
        if (prevStepEmails.length === 0 || previousValue === 0) return null;

        const change = ((currentValue - previousValue) / previousValue) * 100;

        const negativeMetrics = ['unsubscribeRate', 'spamRate', 'bounceRate'];
        const isNegativeMetric = negativeMetrics.includes(metric);
        const isPositive = isNegativeMetric ? change < 0 : change > 0;

        const previousPeriod = {
            startDate: dateWindows!.prevStartDateOnly,
            endDate: dateWindows!.prevEndDateOnly
        };

        return { change, isPositive, previousValue, previousPeriod };
    };

    // Strict decimals/formatting per request
    const formatMetricValue = (value: number, metric: string) => {
        const metricConfig = metricOptions.find(m => m.value === metric);
        if (!metricConfig) return value.toString();

        if (metricConfig.format === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
        }

        if (metricConfig.format === 'percentage') {
            const decimals = metric === 'spamRate' ? 3 : 2;
            return `${value.toFixed(decimals)}%`;
        }

        // number
        if (metric === 'emailsSent' || metric === 'totalOrders') {
            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
        }
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Render a single chart
    const renderStepChart = (step: FlowStepMetrics, index: number) => {
        const sparklineData = getStepSparklineData(step.sequencePosition, selectedMetric);
        const periodChange = getStepPeriodChange(step.sequencePosition, selectedMetric);
        const metricConfig = metricOptions.find(m => m.value === selectedMetric);
        const value = step[selectedMetric as keyof FlowStepMetrics] as number;
        const yAxisRange = sharedYAxisRange;

        // Chart color and trend indicator
        let chartColor = '#8b5cf6'; // default purple
        let dotColor = chartColor;
        let changeNode: React.ReactNode = null;

        if (periodChange && dateRange !== 'all') {
            const isIncrease = periodChange.change > 0; // direction only
            const isGood = periodChange.isPositive; // goodness already accounts for negative metrics
            const colorClass = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            const label = compareMode === 'prev-year' ? 'Same period last year' : 'Previous period';
            const trendTooltip = `${label} (${formatDate(periodChange.previousPeriod.startDate)} – ${formatDate(periodChange.previousPeriod.endDate)}): ${formatMetricValue(periodChange.previousValue, selectedMetric)}`;

            chartColor = isGood ? '#10b981' : '#ef4444';
            dotColor = chartColor;

            changeNode = (
                <span
                    className={`text-lg font-bold px-2 py-1 rounded ${colorClass}`}
                    title={trendTooltip}
                    aria-label={trendTooltip}
                >
                    {isIncrease ? (
                        <ArrowUp className="inline w-4 h-4 mr-1" />
                    ) : (
                        <ArrowDown className="inline w-4 h-4 mr-1" />
                    )}
                    {Math.abs(periodChange.change).toFixed(1)}%
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
                        {duplicateNameCounts[step.emailName] > 1 && (
                            <span
                                className="inline-flex items-center"
                                title={`Multiple emails share the name "${step.emailName}" (${duplicateNameCounts[step.emailName]}). A/B tests or inconsistent naming can make ordering less clear.`}
                                aria-label="Duplicate step name warning"
                            >
                                <AlertTriangle className={isDarkMode ? 'w-4 h-4 text-amber-300' : 'w-4 h-4 text-amber-600'} />
                            </span>
                        )}
                    </div>
                    {/* Metric Value and Compared-to */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{formatMetricValue(value, selectedMetric)}</span>
                            {/* View-through badge when conversion rate > 100% */}
                            {selectedMetric === 'conversionRate' && value > 100 && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? 'border-purple-700 text-purple-200 bg-purple-900/30' : 'border-purple-200 text-purple-700 bg-purple-50'}`}
                                >
                                    Includes view-through
                                </span>
                            )}
                            {periodChange && dateRange !== 'all' && (
                                <span className="text-lg font-bold px-2 py-1 rounded" style={{ color: chartColor, background: 'transparent' }}>
                                    {changeNode}
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
            <div className="flex items-center justify-between mb-2">
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
                            {uniqueFlowNames.map((flow: string) => (
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

            {/* Naming guidance banner (Stripe-like subtle card, escalates when duplicates) */}
            <div
                className={`mb-4 rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${hasDuplicateNames
                    ? (isDarkMode
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-amber-300 bg-amber-50 text-amber-800')
                    : (isDarkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-300'
                        : 'border-gray-200 bg-gray-50 text-gray-700')
                    }`}
            >
                <AlertTriangle className={`mt-0.5 w-4 h-4 ${hasDuplicateNames
                    ? (isDarkMode ? 'text-amber-300' : 'text-amber-600')
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                    }`} />
                <div>
                    <div className="font-medium">
                        Naming affects step order
                        {hasDuplicateNames && (
                            <span className="ml-2 font-normal">Duplicate step names detected in this flow.</span>
                        )}
                    </div>
                    <div className="text-xs mt-0.5">
                        Use unique, consistent names for each step. A/B tests can create multiple messages with similar names; add clear suffixes like “- A” and “- B” to keep steps distinct.
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