import React, { useState } from 'react';
import { Calendar, Upload, AlertCircle, ChevronDown, Brain, ChevronRight, BarChart3, Zap, Send, Mail, Star } from 'lucide-react';
import MetricCard from './MetricCard';
import AIReportTemplate from './AIReportTemplate';
import 'tailwindcss/tailwind.css';
import AudienceCharts from './AudienceCharts';
import InsightsModal from './InsightsModal';
import DayOfWeekPerformance from './DayOfWeekPerformance';
import HourOfDayPerformance from './HourOfDayPerformance';
import FlowStepAnalysis from './FlowStepAnalysis';
import { DataManager } from '../utils/dataManager';
import { ProcessedCampaign, ProcessedFlowEmail } from '../utils/dataTypes';
import CustomSegmentBlock from './CustomSegmentBlock';

interface DashboardProps {
  onUploadNew: () => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onUploadNew, isDarkMode }) => {
  // const [aiReport, setAIReport] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedFlow, setSelectedFlow] = useState('all');
  const [selectedCampaignMetric, setSelectedCampaignMetric] = useState('revenue');
  const [displayedCampaigns, setDisplayedCampaigns] = useState(5);
  const [isSticky, setIsSticky] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisStarted, setAiAnalysisStarted] = useState(false);

  // Get data from DataManager
  const dataManager = DataManager.getInstance();
  const ALL_CAMPAIGNS = dataManager.getCampaigns();
  const ALL_FLOW_EMAILS = dataManager.getFlowEmails();

  // Check if we have any data
  const hasData = ALL_CAMPAIGNS.length > 0 || ALL_FLOW_EMAILS.length > 0;

  // Helper function wrappers
  const getUniqueFlowNames = () => dataManager.getUniqueFlowNames();
  const getLastEmailDate = () => dataManager.getLastEmailDate();
  const getMetricTimeSeries = (campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[], metricKey: string, dateRange: string, granularity: 'daily' | 'weekly' | 'monthly') =>
    dataManager.getMetricTimeSeries(campaigns, flows, metricKey, dateRange, granularity);
  // Use DataManager's consistent granularity logic for all charts
  const getGranularityForDateRange = (dateRange: string) => dataManager.getGranularityForDateRange(dateRange);
  const getAggregatedMetricsForPeriod = (campaigns: ProcessedCampaign[], flows: ProcessedFlowEmail[], startDate: Date, endDate: Date) =>
    dataManager.getAggregatedMetricsForPeriod(campaigns, flows, startDate, endDate);
  const getAudienceInsights = () => dataManager.getAudienceInsights();

  // Create a stable reference date that won't change
  const REFERENCE_DATE = React.useMemo(() => {
    if (hasData) {
      return getLastEmailDate();
    }
    return new Date();
  }, [hasData]);

  const dateRangeOptions = [
    { value: '30d', label: 'Last 30 days' },
    { value: '60d', label: 'Last 60 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '120d', label: 'Last 120 days' },
    { value: '180d', label: 'Last 180 days' },
    { value: '365d', label: 'Last 365 days' },
    { value: 'all', label: 'All time' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (value < 0.1 && value > 0) {
      return `${value.toFixed(3)}%`;
    }
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const audienceOverviewRef = React.useRef<HTMLDivElement>(null);

  const uniqueFlowNames = React.useMemo(() => {
    const liveFlows = ALL_FLOW_EMAILS.filter(email =>
      email.status && email.status.toLowerCase() === 'live'
    );
    return Array.from(new Set(liveFlows.map(email => email.flowName))).sort();
  }, [ALL_FLOW_EMAILS]);

  // Filter campaigns based on date range
  const filteredCampaigns = React.useMemo(() => {
    let filtered = ALL_CAMPAIGNS;

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date(REFERENCE_DATE);
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(campaign => campaign.sentDate >= cutoffDate);
    }

    return filtered;
  }, [dateRange, ALL_CAMPAIGNS, REFERENCE_DATE]);

  // Filter flow emails based on selected flow and date range
  const filteredFlowEmails = React.useMemo(() => {
    let filtered = ALL_FLOW_EMAILS;

    // Filter by flow name
    if (selectedFlow !== 'all') {
      filtered = filtered.filter(email => email.flowName === selectedFlow);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date(REFERENCE_DATE);
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(email => email.sentDate >= cutoffDate);
    }

    return filtered;
  }, [dateRange, selectedFlow, ALL_FLOW_EMAILS, REFERENCE_DATE]);

  // Calculate aggregated metrics from filtered data with real period-over-period changes
  const overviewMetrics = React.useMemo(() => {
    const allEmails = [...filteredCampaigns, ...filteredFlowEmails];

    if (allEmails.length === 0) {
      return {
        totalRevenue: { value: 0, change: 0, isPositive: true },
        averageOrderValue: { value: 0, change: 0, isPositive: true },
        revenuePerEmail: { value: 0, change: 0, isPositive: true },
        openRate: { value: 0, change: 0, isPositive: true },
        clickRate: { value: 0, change: 0, isPositive: true },
        clickToOpenRate: { value: 0, change: 0, isPositive: true },
        emailsSent: { value: 0, change: 0, isPositive: true },
        totalOrders: { value: 0, change: 0, isPositive: true },
        conversionRate: { value: 0, change: 0, isPositive: true },
        unsubscribeRate: { value: 0, change: 0, isPositive: true },
        spamRate: { value: 0, change: 0, isPositive: true },
        bounceRate: { value: 0, change: 0, isPositive: true }
      };
    }

    const totalRevenue = allEmails.reduce((sum, email) => sum + email.revenue, 0);
    const totalEmailsSent = allEmails.reduce((sum, email) => sum + email.emailsSent, 0);
    const totalOrders = allEmails.reduce((sum, email) => sum + email.totalOrders, 0);

    // Weighted averages for rates
    const weightedOpenRate = allEmails.reduce((sum, email) => sum + (email.openRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedClickRate = allEmails.reduce((sum, email) => sum + (email.clickRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedClickToOpenRate = allEmails.reduce((sum, email) => sum + (email.clickToOpenRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedConversionRate = allEmails.reduce((sum, email) => sum + (email.conversionRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedUnsubscribeRate = allEmails.reduce((sum, email) => sum + (email.unsubscribeRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedSpamRate = allEmails.reduce((sum, email) => sum + (email.spamRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedBounceRate = allEmails.reduce((sum, email) => sum + (email.bounceRate * email.emailsSent), 0) / totalEmailsSent;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;

    // Calculate real period-over-period changes
    const metrics = [
      { key: 'totalRevenue', value: totalRevenue },
      { key: 'averageOrderValue', value: avgOrderValue },
      { key: 'revenuePerEmail', value: revenuePerEmail },
      { key: 'openRate', value: weightedOpenRate },
      { key: 'clickRate', value: weightedClickRate },
      { key: 'clickToOpenRate', value: weightedClickToOpenRate },
      { key: 'emailsSent', value: totalEmailsSent },
      { key: 'totalOrders', value: totalOrders },
      { key: 'conversionRate', value: weightedConversionRate },
      { key: 'unsubscribeRate', value: weightedUnsubscribeRate },
      { key: 'spamRate', value: weightedSpamRate },
      { key: 'bounceRate', value: weightedBounceRate }
    ];

    const result: any = {};

    metrics.forEach(({ key, value }) => {
      const changeData = dataManager.calculatePeriodOverPeriodChange(key, dateRange, 'all');
      result[key] = {
        value,
        change: changeData.changePercent,
        isPositive: changeData.isPositive
      };
    });

    return result;
  }, [filteredCampaigns, filteredFlowEmails, dateRange]);

  // Calculate campaign-only metrics with real changes
  const campaignMetrics = React.useMemo(() => {
    if (filteredCampaigns.length === 0) {
      return {
        totalRevenue: { value: 0, change: 0, isPositive: true },
        averageOrderValue: { value: 0, change: 0, isPositive: true },
        revenuePerEmail: { value: 0, change: 0, isPositive: true },
        openRate: { value: 0, change: 0, isPositive: true },
        clickRate: { value: 0, change: 0, isPositive: true },
        clickToOpenRate: { value: 0, change: 0, isPositive: true },
        emailsSent: { value: 0, change: 0, isPositive: true },
        totalOrders: { value: 0, change: 0, isPositive: true },
        conversionRate: { value: 0, change: 0, isPositive: true },
        unsubscribeRate: { value: 0, change: 0, isPositive: true },
        spamRate: { value: 0, change: 0, isPositive: true },
        bounceRate: { value: 0, change: 0, isPositive: true }
      };
    }

    const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const totalEmailsSent = filteredCampaigns.reduce((sum, campaign) => sum + campaign.emailsSent, 0);
    const totalOrders = filteredCampaigns.reduce((sum, campaign) => sum + campaign.totalOrders, 0);

    const weightedOpenRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.openRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedClickRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.clickRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedClickToOpenRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.clickToOpenRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedConversionRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.conversionRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedUnsubscribeRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.unsubscribeRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedSpamRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.spamRate * campaign.emailsSent), 0) / totalEmailsSent;
    const weightedBounceRate = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.bounceRate * campaign.emailsSent), 0) / totalEmailsSent;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;

    // Calculate real period-over-period changes for campaigns only
    const metrics = [
      { key: 'totalRevenue', value: totalRevenue },
      { key: 'averageOrderValue', value: avgOrderValue },
      { key: 'revenuePerEmail', value: revenuePerEmail },
      { key: 'openRate', value: weightedOpenRate },
      { key: 'clickRate', value: weightedClickRate },
      { key: 'clickToOpenRate', value: weightedClickToOpenRate },
      { key: 'emailsSent', value: totalEmailsSent },
      { key: 'totalOrders', value: totalOrders },
      { key: 'conversionRate', value: weightedConversionRate },
      { key: 'unsubscribeRate', value: weightedUnsubscribeRate },
      { key: 'spamRate', value: weightedSpamRate },
      { key: 'bounceRate', value: weightedBounceRate }
    ];

    const result: any = {};

    metrics.forEach(({ key, value }) => {
      const changeData = dataManager.calculatePeriodOverPeriodChange(key, dateRange, 'campaigns');
      result[key] = {
        value,
        change: changeData.changePercent,
        isPositive: changeData.isPositive
      };
    });

    return result;
  }, [filteredCampaigns, dateRange]);

  // Calculate flow-only metrics with real changes
  const flowMetrics = React.useMemo(() => {
    if (filteredFlowEmails.length === 0) {
      return {
        totalRevenue: { value: 0, change: 0, isPositive: true },
        averageOrderValue: { value: 0, change: 0, isPositive: true },
        revenuePerEmail: { value: 0, change: 0, isPositive: true },
        openRate: { value: 0, change: 0, isPositive: true },
        clickRate: { value: 0, change: 0, isPositive: true },
        clickToOpenRate: { value: 0, change: 0, isPositive: true },
        emailsSent: { value: 0, change: 0, isPositive: true },
        totalOrders: { value: 0, change: 0, isPositive: true },
        conversionRate: { value: 0, change: 0, isPositive: true },
        unsubscribeRate: { value: 0, change: 0, isPositive: true },
        spamRate: { value: 0, change: 0, isPositive: true },
        bounceRate: { value: 0, change: 0, isPositive: true }
      };
    }

    const totalRevenue = filteredFlowEmails.reduce((sum, email) => sum + email.revenue, 0);
    const totalEmailsSent = filteredFlowEmails.reduce((sum, email) => sum + email.emailsSent, 0);
    const totalOrders = filteredFlowEmails.reduce((sum, email) => sum + email.totalOrders, 0);

    const weightedOpenRate = filteredFlowEmails.reduce((sum, email) => sum + (email.openRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedClickRate = filteredFlowEmails.reduce((sum, email) => sum + (email.clickRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedClickToOpenRate = filteredFlowEmails.reduce((sum, email) => sum + (email.clickToOpenRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedConversionRate = filteredFlowEmails.reduce((sum, email) => sum + (email.conversionRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedUnsubscribeRate = filteredFlowEmails.reduce((sum, email) => sum + (email.unsubscribeRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedSpamRate = filteredFlowEmails.reduce((sum, email) => sum + (email.spamRate * email.emailsSent), 0) / totalEmailsSent;
    const weightedBounceRate = filteredFlowEmails.reduce((sum, email) => sum + (email.bounceRate * email.emailsSent), 0) / totalEmailsSent;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenuePerEmail = totalEmailsSent > 0 ? totalRevenue / totalEmailsSent : 0;

    // Calculate real period-over-period changes for flows only
    const metrics = [
      { key: 'totalRevenue', value: totalRevenue },
      { key: 'averageOrderValue', value: avgOrderValue },
      { key: 'revenuePerEmail', value: revenuePerEmail },
      { key: 'openRate', value: weightedOpenRate },
      { key: 'clickRate', value: weightedClickRate },
      { key: 'clickToOpenRate', value: weightedClickToOpenRate },
      { key: 'emailsSent', value: totalEmailsSent },
      { key: 'totalOrders', value: totalOrders },
      { key: 'conversionRate', value: weightedConversionRate },
      { key: 'unsubscribeRate', value: weightedUnsubscribeRate },
      { key: 'spamRate', value: weightedSpamRate },
      { key: 'bounceRate', value: weightedBounceRate }
    ];

    const result: any = {};

    metrics.forEach(({ key, value }) => {
      const changeData = dataManager.calculatePeriodOverPeriodChange(key, dateRange, 'flows');
      result[key] = {
        value,
        change: changeData.changePercent,
        isPositive: changeData.isPositive
      };
    });

    return result;
  }, [filteredFlowEmails, dateRange]);

  // Generate sparkline data for all metrics using consistent rules
  const granularity = React.useMemo(() => getGranularityForDateRange(dateRange), [dateRange]);

  const overviewSparklineData = React.useMemo(() => {
    return {
      totalRevenue: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'revenue', dateRange, granularity),
      averageOrderValue: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'revenuePerEmail', dateRange, granularity),
      openRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'openRate', dateRange, granularity),
      clickRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'clickRate', dateRange, granularity),
      clickToOpenRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'clickToOpenRate', dateRange, granularity),
      emailsSent: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'emailsSent', dateRange, granularity),
      totalOrders: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'totalOrders', dateRange, granularity),
      conversionRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'conversionRate', dateRange, granularity),
      unsubscribeRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'unsubscribeRate', dateRange, granularity),
      spamRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'spamRate', dateRange, granularity),
      bounceRate: getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'bounceRate', dateRange, granularity)
    };
  }, [filteredCampaigns, filteredFlowEmails, dateRange, granularity]);

  const campaignSparklineData = React.useMemo(() => {
    return {
      totalRevenue: getMetricTimeSeries(filteredCampaigns, [], 'revenue', dateRange, granularity),
      averageOrderValue: getMetricTimeSeries(filteredCampaigns, [], 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: getMetricTimeSeries(filteredCampaigns, [], 'revenuePerEmail', dateRange, granularity),
      openRate: getMetricTimeSeries(filteredCampaigns, [], 'openRate', dateRange, granularity),
      clickRate: getMetricTimeSeries(filteredCampaigns, [], 'clickRate', dateRange, granularity),
      clickToOpenRate: getMetricTimeSeries(filteredCampaigns, [], 'clickToOpenRate', dateRange, granularity),
      emailsSent: getMetricTimeSeries(filteredCampaigns, [], 'emailsSent', dateRange, granularity),
      totalOrders: getMetricTimeSeries(filteredCampaigns, [], 'totalOrders', dateRange, granularity),
      conversionRate: getMetricTimeSeries(filteredCampaigns, [], 'conversionRate', dateRange, granularity),
      unsubscribeRate: getMetricTimeSeries(filteredCampaigns, [], 'unsubscribeRate', dateRange, granularity),
      spamRate: getMetricTimeSeries(filteredCampaigns, [], 'spamRate', dateRange, granularity),
      bounceRate: getMetricTimeSeries(filteredCampaigns, [], 'bounceRate', dateRange, granularity)
    };
  }, [filteredCampaigns, dateRange, granularity]);

  const flowSparklineData = React.useMemo(() => {
    return {
      totalRevenue: getMetricTimeSeries([], filteredFlowEmails, 'revenue', dateRange, granularity),
      averageOrderValue: getMetricTimeSeries([], filteredFlowEmails, 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: getMetricTimeSeries([], filteredFlowEmails, 'revenuePerEmail', dateRange, granularity),
      openRate: getMetricTimeSeries([], filteredFlowEmails, 'openRate', dateRange, granularity),
      clickRate: getMetricTimeSeries([], filteredFlowEmails, 'clickRate', dateRange, granularity),
      clickToOpenRate: getMetricTimeSeries([], filteredFlowEmails, 'clickToOpenRate', dateRange, granularity),
      emailsSent: getMetricTimeSeries([], filteredFlowEmails, 'emailsSent', dateRange, granularity),
      totalOrders: getMetricTimeSeries([], filteredFlowEmails, 'totalOrders', dateRange, granularity),
      conversionRate: getMetricTimeSeries([], filteredFlowEmails, 'conversionRate', dateRange, granularity),
      unsubscribeRate: getMetricTimeSeries([], filteredFlowEmails, 'unsubscribeRate', dateRange, granularity),
      spamRate: getMetricTimeSeries([], filteredFlowEmails, 'spamRate', dateRange, granularity),
      bounceRate: getMetricTimeSeries([], filteredFlowEmails, 'bounceRate', dateRange, granularity)
    };
  }, [filteredFlowEmails, dateRange, granularity]);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Check if audience section is currently visible in viewport
      if (audienceOverviewRef.current) {
        const rect = audienceOverviewRef.current.getBoundingClientRect();
        const isAudienceVisible = rect.top <= 100; // If audience section is at or above the sticky position

        const shouldBeSticky = scrollY > 100 && !isAudienceVisible;
        setIsSticky(shouldBeSticky);
      } else {
        setIsSticky(scrollY > 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDateTime = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = String(date.getFullYear()).slice(-2);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${month}/${day}/${year} at ${displayHours}:${minutes} ${ampm}`;
  };

  const campaignMetricOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'avgOrderValue', label: 'Avg Order Value' },
    { value: 'revenuePerEmail', label: 'Revenue per Email' },
    { value: 'openRate', label: 'Open Rate' },
    { value: 'clickRate', label: 'Click Rate' },
    { value: 'clickToOpenRate', label: 'Click-to-Open Rate' },
    { value: 'emailsSent', label: 'Emails Sent' },
    { value: 'totalOrders', label: 'Total Orders' },
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'unsubscribeRate', label: 'Unsubscribe Rate' },
    { value: 'spamRate', label: 'Spam Rate' },
    { value: 'bounceRate', label: 'Bounce Rate' }
  ];

  const getSortedCampaigns = () => {
    return [...filteredCampaigns].sort((a, b) => {
      const aValue = Number(a[selectedCampaignMetric as keyof ProcessedCampaign]) || 0;
      const bValue = Number(b[selectedCampaignMetric as keyof ProcessedCampaign]) || 0;
      return bValue - aValue;
    });
  };

  const formatMetricValue = (value: number, metric: string) => {
    if (['revenue', 'avgOrderValue', 'revenuePerEmail'].includes(metric)) {
      return formatCurrency(value);
    } else if (['openRate', 'clickRate', 'clickToOpenRate', 'conversionRate', 'unsubscribeRate', 'spamRate', 'bounceRate'].includes(metric)) {
      return formatPercent(value);
    } else {
      return formatNumber(value);
    }
  };

  const handleLoadMore = () => {
    const sortedCampaigns = getSortedCampaigns();
    setDisplayedCampaigns(prev => Math.min(prev + 5, sortedCampaigns.length));
  };

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    setShowInsightsModal(true);

    try {
      // Calculate current period metrics
      const endDate = new Date(REFERENCE_DATE);
      let startDate = new Date(endDate);

      if (dateRange === 'all') {
        const oldestCampaign = Math.min(...ALL_CAMPAIGNS.map(c => c.sentDate.getTime()));
        const oldestFlow = Math.min(...ALL_FLOW_EMAILS.map(f => f.sentDate.getTime()));
        startDate = new Date(Math.min(oldestCampaign, oldestFlow));
      } else {
        const days = parseInt(dateRange.replace('d', ''));
        startDate.setDate(startDate.getDate() - days);
      }

      const currentPeriod = getAggregatedMetricsForPeriod(ALL_CAMPAIGNS, ALL_FLOW_EMAILS, startDate, endDate);

      // Calculate previous period for comparison
      const periodLength = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - periodLength);

      const previousPeriod = getAggregatedMetricsForPeriod(ALL_CAMPAIGNS, ALL_FLOW_EMAILS, prevStartDate, prevEndDate);

      // Get top and bottom performers
      const topCampaigns = [...filteredCampaigns]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      const bottomCampaigns = [...filteredCampaigns]
        .sort((a, b) => a.revenue - b.revenue)
        .slice(0, 3);

      // Get flow performance data grouped by flow name
      const flowsByName = filteredFlowEmails.reduce((acc, email) => {
        if (!acc[email.flowName]) {
          acc[email.flowName] = {
            flowName: email.flowName,
            totalRevenue: 0,
            totalEmailsSent: 0,
            totalOpens: 0,
            totalClicks: 0,
            totalOrders: 0
          };
        }

        acc[email.flowName].totalRevenue += email.revenue;
        acc[email.flowName].totalEmailsSent += email.emailsSent;
        acc[email.flowName].totalOpens += email.uniqueOpens;
        acc[email.flowName].totalClicks += email.uniqueClicks;
        acc[email.flowName].totalOrders += email.totalOrders;

        return acc;
      }, {} as Record<string, any>);

      const flows = Object.values(flowsByName).map((flow: any) => ({
        ...flow,
        openRate: flow.totalEmailsSent > 0 ? (flow.totalOpens / flow.totalEmailsSent) * 100 : 0,
        revenue: flow.totalRevenue
      }));

      const topFlows = flows.sort((a, b) => b.revenue - a.revenue).slice(0, 3);
      const bottomFlows = flows.sort((a, b) => a.revenue - b.revenue).slice(0, 3);

      // Get audience insights
      const audienceInsights = getAudienceInsights();

      // Prepare data for API call
      const payload = {
        currentPeriod,
        previousPeriod,
        topCampaigns,
        bottomCampaigns,
        topFlows,
        bottomFlows,
        audienceInsights,
        dateRange
      };

      // Call the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-email-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsightsData(data.insights);

    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsData(null);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // If no data is loaded, show a message
  if (!hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Data Available
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Please upload your Klaviyo CSV reports to see your email metrics dashboard.
          </p>
          <button
            onClick={onUploadNew}
            className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            Upload Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Email Metrics Dashboard
                </h1>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Last updated: {new Date().toLocaleDateString()}
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                Showing {filteredCampaigns.length} campaigns, {filteredFlowEmails.length} flow emails
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onUploadNew}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                  }
                  hover:shadow-sm
                `}
              >
                <div className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Reports</span>
                </div>
              </button>

              <button
                onClick={() => {
                  // Scroll to AI Email Insights section
                  const aiSection = document.getElementById('ai-email-insights');
                  if (aiSection) {
                    aiSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-md text-white"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Get AI Insights</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Date Range Selector */}
      <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : ''} ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Date Range:</span>
            </div>
            <div className="flex gap-2">
              {dateRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${dateRange === option.value
                    ? 'bg-purple-600 text-white'
                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Coverage Notice Banner - Non-sticky */}
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-6`}>
        <div className="max-w-7xl mx-auto">
          <div className={`p-2 rounded-md ${isDarkMode ? 'bg-purple-900/10 border border-purple-800/30' : 'bg-purple-50/50 border border-purple-200/50'} flex items-center gap-2`}>
            <AlertCircle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              <span className="font-medium">Data Coverage Notice:</span> All date range selections reflect data up to the most recent email activity recorded on {getLastEmailDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}.
            </span>
          </div>
        </div>
      </div>

      <div className={`p-6 ${isSticky ? 'mt-20' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Email Performance Overview */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Email Performance Overview
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard title="Total Revenue" value={formatCurrency(overviewMetrics.totalRevenue.value)} change={overviewMetrics.totalRevenue.change} isPositive={overviewMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={overviewSparklineData.totalRevenue} />
              <MetricCard title="Average Order Value" value={formatCurrency(overviewMetrics.averageOrderValue.value)} change={overviewMetrics.averageOrderValue.change} isPositive={overviewMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={overviewSparklineData.averageOrderValue} />
              <MetricCard title="Revenue per Email" value={formatCurrency(overviewMetrics.revenuePerEmail.value)} change={overviewMetrics.revenuePerEmail.change} isPositive={overviewMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={overviewSparklineData.revenuePerEmail} />
              <MetricCard title="Open Rate" value={formatPercent(overviewMetrics.openRate.value)} change={overviewMetrics.openRate.change} isPositive={overviewMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={overviewSparklineData.openRate} />
              <MetricCard title="Click Rate" value={formatPercent(overviewMetrics.clickRate.value)} change={overviewMetrics.clickRate.change} isPositive={overviewMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={overviewSparklineData.clickRate} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(overviewMetrics.clickToOpenRate.value)} change={overviewMetrics.clickToOpenRate.change} isPositive={overviewMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={overviewSparklineData.clickToOpenRate} />
              <MetricCard title="Emails Sent" value={formatNumber(overviewMetrics.emailsSent.value)} change={overviewMetrics.emailsSent.change} isPositive={overviewMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={overviewSparklineData.emailsSent} />
              <MetricCard title="Total Orders" value={formatNumber(overviewMetrics.totalOrders.value)} change={overviewMetrics.totalOrders.change} isPositive={overviewMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={overviewSparklineData.totalOrders} />
              <MetricCard title="Conversion Rate" value={formatPercent(overviewMetrics.conversionRate.value)} change={overviewMetrics.conversionRate.change} isPositive={overviewMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={overviewSparklineData.conversionRate} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(overviewMetrics.unsubscribeRate.value)} change={overviewMetrics.unsubscribeRate.change} isPositive={overviewMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={overviewSparklineData.unsubscribeRate} />
              <MetricCard title="Spam Rate" value={formatPercent(overviewMetrics.spamRate.value)} change={overviewMetrics.spamRate.change} isPositive={overviewMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={overviewSparklineData.spamRate} />
              <MetricCard title="Bounce Rate" value={formatPercent(overviewMetrics.bounceRate.value)} change={overviewMetrics.bounceRate.change} isPositive={overviewMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={overviewSparklineData.bounceRate} />
            </div>
          </section>

          {/* Campaign Performance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Send className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Campaign Performance
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard title="Total Revenue" value={formatCurrency(campaignMetrics.totalRevenue.value)} change={campaignMetrics.totalRevenue.change} isPositive={campaignMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={campaignSparklineData.totalRevenue} />
              <MetricCard title="Average Order Value" value={formatCurrency(campaignMetrics.averageOrderValue.value)} change={campaignMetrics.averageOrderValue.change} isPositive={campaignMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={campaignSparklineData.averageOrderValue} />
              <MetricCard title="Revenue per Email" value={formatCurrency(campaignMetrics.revenuePerEmail.value)} change={campaignMetrics.revenuePerEmail.change} isPositive={campaignMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={campaignSparklineData.revenuePerEmail} />
              <MetricCard title="Open Rate" value={formatPercent(campaignMetrics.openRate.value)} change={campaignMetrics.openRate.change} isPositive={campaignMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={campaignSparklineData.openRate} />
              <MetricCard title="Click Rate" value={formatPercent(campaignMetrics.clickRate.value)} change={campaignMetrics.clickRate.change} isPositive={campaignMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={campaignSparklineData.clickRate} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(campaignMetrics.clickToOpenRate.value)} change={campaignMetrics.clickToOpenRate.change} isPositive={campaignMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={campaignSparklineData.clickToOpenRate} />
              <MetricCard title="Emails Sent" value={formatNumber(campaignMetrics.emailsSent.value)} change={campaignMetrics.emailsSent.change} isPositive={campaignMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={campaignSparklineData.emailsSent} />
              <MetricCard title="Total Orders" value={formatNumber(campaignMetrics.totalOrders.value)} change={campaignMetrics.totalOrders.change} isPositive={campaignMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={campaignSparklineData.totalOrders} />
              <MetricCard title="Conversion Rate" value={formatPercent(campaignMetrics.conversionRate.value)} change={campaignMetrics.conversionRate.change} isPositive={campaignMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={campaignSparklineData.conversionRate} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(campaignMetrics.unsubscribeRate.value)} change={campaignMetrics.unsubscribeRate.change} isPositive={campaignMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={campaignSparklineData.unsubscribeRate} />
              <MetricCard title="Spam Rate" value={formatPercent(campaignMetrics.spamRate.value)} change={campaignMetrics.spamRate.change} isPositive={campaignMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={campaignSparklineData.spamRate} />
              <MetricCard title="Bounce Rate" value={formatPercent(campaignMetrics.bounceRate.value)} change={campaignMetrics.bounceRate.change} isPositive={campaignMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={campaignSparklineData.bounceRate} />
            </div>

            {/* Day of Week Performance */}
            <div className="mt-8">
              <DayOfWeekPerformance
                filteredCampaigns={filteredCampaigns}
                isDarkMode={isDarkMode}
                dateRange={dateRange}
              />
            </div>

            {/* Hour of Day Performance */}
            <div className="mt-8">
              <HourOfDayPerformance
                filteredCampaigns={filteredCampaigns}
                isDarkMode={isDarkMode}
                dateRange={dateRange}
              />
            </div>

            {/* Top Campaigns */}
            <div className="mt-8">
              {/* Header - Outside the box */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Top Campaigns ({getSortedCampaigns().length})
                  </h3>
                </div>
                <div className="relative">
                  <select
                    value={selectedCampaignMetric}
                    onChange={(e) => {
                      setSelectedCampaignMetric(e.target.value);
                    }}
                    className={`
                     appearance-none px-4 py-2 pr-8 rounded-lg border cursor-pointer
                     ${isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   `}
                  >
                    {campaignMetricOptions.map(metric => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>

              {/* List Container - Inside the box */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200`}>
                {getSortedCampaigns().slice(0, displayedCampaigns).map((campaign, index) => (
                  <div key={campaign.id} className={`p-4 ${index !== 0 ? `border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`
                           inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                           bg-purple-100 text-purple-900
                         `}>
                            {index + 1}
                          </span>
                          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {campaign.subject}
                          </h4>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Sent on {formatDateTime(campaign.sentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatMetricValue(campaign[selectedCampaignMetric as keyof typeof campaign] as number, selectedCampaignMetric)}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {campaignMetricOptions.find(m => m.value === selectedCampaignMetric)?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {(() => {
                  const sortedCampaigns = getSortedCampaigns();
                  return displayedCampaigns < sortedCampaigns.length && (
                    <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} text-center`}>
                      <button
                        onClick={handleLoadMore}
                        className={`
                       px-4 py-2 rounded-lg font-medium transition-colors
                       ${isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }
                     `}
                      >
                        Load More ({Math.min(5, sortedCampaigns.length - displayedCampaigns)} more)
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* Flow Performance */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Flow Performance
                </h2>
              </div>
              <select
                value={selectedFlow}
                onChange={(e) => setSelectedFlow(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              >
                <option value="all">All Flows</option>
                {uniqueFlowNames.map(flow => (
                  <option key={flow} value={flow}>{flow}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard title="Total Revenue" value={formatCurrency(flowMetrics.totalRevenue.value)} change={flowMetrics.totalRevenue.change} isPositive={flowMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={flowSparklineData.totalRevenue} />
              <MetricCard title="Average Order Value" value={formatCurrency(flowMetrics.averageOrderValue.value)} change={flowMetrics.averageOrderValue.change} isPositive={flowMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={flowSparklineData.averageOrderValue} />
              <MetricCard title="Revenue per Email" value={formatCurrency(flowMetrics.revenuePerEmail.value)} change={flowMetrics.revenuePerEmail.change} isPositive={flowMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={flowSparklineData.revenuePerEmail} />
              <MetricCard title="Open Rate" value={formatPercent(flowMetrics.openRate.value)} change={flowMetrics.openRate.change} isPositive={flowMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={flowSparklineData.openRate} />
              <MetricCard title="Click Rate" value={formatPercent(flowMetrics.clickRate.value)} change={flowMetrics.clickRate.change} isPositive={flowMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={flowSparklineData.clickRate} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(flowMetrics.clickToOpenRate.value)} change={flowMetrics.clickToOpenRate.change} isPositive={flowMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={flowSparklineData.clickToOpenRate} />
              <MetricCard title="Emails Sent" value={formatNumber(flowMetrics.emailsSent.value)} change={flowMetrics.emailsSent.change} isPositive={flowMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={flowSparklineData.emailsSent} />
              <MetricCard title="Total Orders" value={formatNumber(flowMetrics.totalOrders.value)} change={flowMetrics.totalOrders.change} isPositive={flowMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} sparklineData={flowSparklineData.totalOrders} />
              <MetricCard title="Conversion Rate" value={formatPercent(flowMetrics.conversionRate.value)} change={flowMetrics.conversionRate.change} isPositive={flowMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={flowSparklineData.conversionRate} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(flowMetrics.unsubscribeRate.value)} change={flowMetrics.unsubscribeRate.change} isPositive={flowMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={flowSparklineData.unsubscribeRate} />
              <MetricCard title="Spam Rate" value={formatPercent(flowMetrics.spamRate.value)} change={flowMetrics.spamRate.change} isPositive={flowMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={flowSparklineData.spamRate} />
              <MetricCard title="Bounce Rate" value={formatPercent(flowMetrics.bounceRate.value)} change={flowMetrics.bounceRate.change} isPositive={flowMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={flowSparklineData.bounceRate} />
            </div>
          </section>

          {/* Flow Step Analysis - NEW SECTION */}
          <FlowStepAnalysis isDarkMode={isDarkMode} dateRange={dateRange} />

          {/* Audience Overview */}
          <div ref={audienceOverviewRef}>
            <AudienceCharts isDarkMode={isDarkMode} />
            {/* Analyze Custom Segment - match dashboard container style and dark mode */}
            <CustomSegmentBlock isDarkMode={isDarkMode} />
          </div>

          {/* AI Email Insights */}
      <section id="ai-email-insights" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Icon and Title - outside the container */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Email Insights</h2>
              <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} mt-1`}>Advanced analytics powered by artificial intelligence</p>
            </div>
          </div>

          {/* Match other containers: consistent styling with other sections */}
          <div
            className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl ${aiAnalysisStarted ? 'p-0' : 'p-8'} mb-8 hover:shadow-xl transition-all duration-200`}
            style={{
              boxShadow: isDarkMode 
                ? '0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(147, 51, 234, 0.1)' 
                : '0 0 20px rgba(147, 51, 234, 0.2), 0 0 40px rgba(147, 51, 234, 0.05)'
            }}
          >
            {/* Description and CTA Button - hide when AI analysis section is shown */}
            {!aiAnalysisStarted && (
              <>
                <p className={`
                  text-lg leading-relaxed mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  Transform your Klaviyo email data into actionable business intelligence. Our AI analyzes patterns across all your campaigns, flows, and subscriber segments to identify opportunities that would be impossible to spot manually.
                </p>

                {/* CTA Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowAIAnalysis(true);
                      setAiAnalysisStarted(true);
                      setLoadingAI(false);
                    }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5" />
                      <span className="text-lg">Start AI Analysis</span>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${showAIAnalysis ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
                  </button>
                </div>
              </>
            )}

            {/* AI Analysis Report Section */}
            {aiAnalysisStarted && (
                <AIReportTemplate isDarkMode={isDarkMode} />
            )}
          </div>
        </div>
      </section>
        </div>
      </div>

      {/* Insights Modal */}
      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insightsData}
        isDarkMode={isDarkMode}
        isLoading={isGeneratingInsights}
      />
    </div>
  );
};

export default Dashboard;