import React, { useState } from 'react';
import { Calendar, Upload, AlertCircle, ChevronDown, BarChart3, Zap, Send, Mail, Star } from 'lucide-react';
import MetricCard from './MetricCard';
import 'tailwindcss/tailwind.css';
import AudienceCharts from './AudienceCharts';
import DayOfWeekPerformance from './DayOfWeekPerformance';
import HourOfDayPerformance from './HourOfDayPerformance';
import FlowStepAnalysis from './FlowStepAnalysis';
import { DataManager } from '../utils/dataManager';
import { ProcessedCampaign } from '../utils/dataTypes';
import CustomSegmentBlock from './CustomSegmentBlock';

interface DashboardProps {
  onUploadNew: () => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onUploadNew, isDarkMode }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedFlow, setSelectedFlow] = useState('all');
  const [selectedCampaignMetric, setSelectedCampaignMetric] = useState('revenue');
  const [displayedCampaigns, setDisplayedCampaigns] = useState(5);
  const [isSticky, setIsSticky] = useState(false);
  // const [showInsightsModal, setShowInsightsModal] = useState(false);
  // const [insightsData, _setInsightsData] = useState<any>(null);
  // const [isGeneratingInsights, _setIsGeneratingInsights] = useState(false);
  // const [aiAnalysisStarted, setAiAnalysisStarted] = useState(false);
  // const [aiReport, setAiReport] = useState<AIInsightsReport | null>(null);
  // const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // const [showCompanyModal, setShowCompanyModal] = useState(false);
  // const [companyName, setCompanyName] = useState('');
  // const [companyDescription, setCompanyDescription] = useState('');

  // Validation for modal inputs
  // const nameOk = companyName.trim().length >= 2;
  // const descOk = companyDescription.trim().length >= 20;
  // const canRun = nameOk && descOk;

  // Get data from DataManager
  const dataManager = DataManager.getInstance();
  const ALL_CAMPAIGNS = dataManager.getCampaigns();
  const ALL_FLOW_EMAILS = dataManager.getFlowEmails();

  // Check if we have any data
  const hasData = ALL_CAMPAIGNS.length > 0 || ALL_FLOW_EMAILS.length > 0;

  // Use DataManager's consistent granularity logic for all charts
  const getGranularityForDateRange = (dateRange: string) => dataManager.getGranularityForDateRange(dateRange);

  // NEW: global granularity state, defaulting from DataManager
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>(getGranularityForDateRange(dateRange));

  // Reset granularity when dateRange changes (user can override after)
  React.useEffect(() => {
    setGranularity(getGranularityForDateRange(dateRange));
  }, [dateRange]);

  // Create a stable reference date that won't change
  const REFERENCE_DATE = React.useMemo(() => {
    if (hasData) {
      return dataManager.getLastEmailDate();
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
        isPositive: changeData.isPositive,
        previousValue: changeData.previousValue,
        previousPeriod: changeData.previousPeriod
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
        isPositive: changeData.isPositive,
        previousValue: changeData.previousValue,
        previousPeriod: changeData.previousPeriod
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
      const changeData = dataManager.calculatePeriodOverPeriodChange(
        key,
        dateRange,
        'flows',
        { flowName: selectedFlow }
      );
      result[key] = {
        value,
        change: changeData.changePercent,
        isPositive: changeData.isPositive,
        previousValue: changeData.previousValue,
        previousPeriod: changeData.previousPeriod
      };
    });

    return result;
  }, [filteredFlowEmails, dateRange]);

  // Generate sparkline data for all metrics using consistent rules
  const overviewSparklineData = React.useMemo(() => {
    return {
      totalRevenue: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'revenue', dateRange, granularity),
      averageOrderValue: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'revenuePerEmail', dateRange, granularity),
      openRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'openRate', dateRange, granularity),
      clickRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'clickRate', dateRange, granularity),
      clickToOpenRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'clickToOpenRate', dateRange, granularity),
      emailsSent: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'emailsSent', dateRange, granularity),
      totalOrders: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'totalOrders', dateRange, granularity),
      conversionRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'conversionRate', dateRange, granularity),
      unsubscribeRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'unsubscribeRate', dateRange, granularity),
      spamRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'spamRate', dateRange, granularity),
      bounceRate: dataManager.getMetricTimeSeries(filteredCampaigns, filteredFlowEmails, 'bounceRate', dateRange, granularity)
    };
  }, [filteredCampaigns, filteredFlowEmails, dateRange, granularity]);

  const campaignSparklineData = React.useMemo(() => {
    return {
      totalRevenue: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'revenue', dateRange, granularity),
      averageOrderValue: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'revenuePerEmail', dateRange, granularity),
      openRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'openRate', dateRange, granularity),
      clickRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'clickRate', dateRange, granularity),
      clickToOpenRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'clickToOpenRate', dateRange, granularity),
      emailsSent: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'emailsSent', dateRange, granularity),
      totalOrders: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'totalOrders', dateRange, granularity),
      conversionRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'conversionRate', dateRange, granularity),
      unsubscribeRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'unsubscribeRate', dateRange, granularity),
      spamRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'spamRate', dateRange, granularity),
      bounceRate: dataManager.getMetricTimeSeries(filteredCampaigns, [], 'bounceRate', dateRange, granularity)
    };
  }, [filteredCampaigns, dateRange, granularity]);

  const flowSparklineData = React.useMemo(() => {
    return {
      totalRevenue: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'revenue', dateRange, granularity),
      averageOrderValue: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'avgOrderValue', dateRange, granularity),
      revenuePerEmail: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'revenuePerEmail', dateRange, granularity),
      openRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'openRate', dateRange, granularity),
      clickRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'clickRate', dateRange, granularity),
      clickToOpenRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'clickToOpenRate', dateRange, granularity),
      emailsSent: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'emailsSent', dateRange, granularity),
      totalOrders: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'totalOrders', dateRange, granularity),
      conversionRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'conversionRate', dateRange, granularity),
      unsubscribeRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'unsubscribeRate', dateRange, granularity),
      spamRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'spamRate', dateRange, granularity),
      bounceRate: dataManager.getMetricTimeSeries([], filteredFlowEmails, 'bounceRate', dateRange, granularity)
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

  const getLastEmailDate = () => dataManager.getLastEmailDate();

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
                Showing {filteredCampaigns.length.toLocaleString()} campaigns, {filteredFlowEmails.length.toLocaleString()} flow emails
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
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Date Range Selector */}
      <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : ''} ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Date Range:</span>
            </div>
            <div className="flex gap-1.5 whitespace-nowrap">
              {dateRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${dateRange === option.value
                    ? 'bg-purple-600 text-white'
                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* NEW: Granularity Toggle with icon */}
            <div className="flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Granularity:</span>
              <div className="flex gap-1.5 whitespace-nowrap">
                {(['daily', 'weekly', 'monthly'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${granularity === g
                      ? 'bg-purple-600 text-white'
                      : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                      }`}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
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
              <MetricCard title="Total Revenue" value={formatCurrency(overviewMetrics.totalRevenue.value)} change={overviewMetrics.totalRevenue.change} isPositive={overviewMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenue" sparklineData={overviewSparklineData.totalRevenue} granularity={granularity} previousValue={overviewMetrics.totalRevenue.previousValue} previousPeriod={overviewMetrics.totalRevenue.previousPeriod} />
              <MetricCard title="Average Order Value" value={formatCurrency(overviewMetrics.averageOrderValue.value)} change={overviewMetrics.averageOrderValue.change} isPositive={overviewMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="avgOrderValue" sparklineData={overviewSparklineData.averageOrderValue} granularity={granularity} previousValue={overviewMetrics.averageOrderValue.previousValue} previousPeriod={overviewMetrics.averageOrderValue.previousPeriod} />
              <MetricCard title="Revenue per Email" value={formatCurrency(overviewMetrics.revenuePerEmail.value)} change={overviewMetrics.revenuePerEmail.change} isPositive={overviewMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={overviewSparklineData.revenuePerEmail} granularity={granularity} previousValue={overviewMetrics.revenuePerEmail.previousValue} previousPeriod={overviewMetrics.revenuePerEmail.previousPeriod} />
              <MetricCard title="Open Rate" value={formatPercent(overviewMetrics.openRate.value)} change={overviewMetrics.openRate.change} isPositive={overviewMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={overviewSparklineData.openRate} granularity={granularity} previousValue={overviewMetrics.openRate.previousValue} previousPeriod={overviewMetrics.openRate.previousPeriod} />
              <MetricCard title="Click Rate" value={formatPercent(overviewMetrics.clickRate.value)} change={overviewMetrics.clickRate.change} isPositive={overviewMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={overviewSparklineData.clickRate} granularity={granularity} previousValue={overviewMetrics.clickRate.previousValue} previousPeriod={overviewMetrics.clickRate.previousPeriod} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(overviewMetrics.clickToOpenRate.value)} change={overviewMetrics.clickToOpenRate.change} isPositive={overviewMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={overviewSparklineData.clickToOpenRate} granularity={granularity} previousValue={overviewMetrics.clickToOpenRate.previousValue} previousPeriod={overviewMetrics.clickToOpenRate.previousPeriod} />
              <MetricCard title="Emails Sent" value={formatNumber(overviewMetrics.emailsSent.value)} change={overviewMetrics.emailsSent.change} isPositive={overviewMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="emailsSent" sparklineData={overviewSparklineData.emailsSent} granularity={granularity} previousValue={overviewMetrics.emailsSent.previousValue} previousPeriod={overviewMetrics.emailsSent.previousPeriod} />
              <MetricCard title="Total Orders" value={formatNumber(overviewMetrics.totalOrders.value)} change={overviewMetrics.totalOrders.change} isPositive={overviewMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="totalOrders" sparklineData={overviewSparklineData.totalOrders} granularity={granularity} previousValue={overviewMetrics.totalOrders.previousValue} previousPeriod={overviewMetrics.totalOrders.previousPeriod} />
              <MetricCard title="Conversion Rate" value={formatPercent(overviewMetrics.conversionRate.value)} change={overviewMetrics.conversionRate.change} isPositive={overviewMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={overviewSparklineData.conversionRate} granularity={granularity} previousValue={overviewMetrics.conversionRate.previousValue} previousPeriod={overviewMetrics.conversionRate.previousPeriod} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(overviewMetrics.unsubscribeRate.value)} change={overviewMetrics.unsubscribeRate.change} isPositive={overviewMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={overviewSparklineData.unsubscribeRate} granularity={granularity} previousValue={overviewMetrics.unsubscribeRate.previousValue} previousPeriod={overviewMetrics.unsubscribeRate.previousPeriod} />
              <MetricCard title="Spam Rate" value={formatPercent(overviewMetrics.spamRate.value)} change={overviewMetrics.spamRate.change} isPositive={overviewMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={overviewSparklineData.spamRate} granularity={granularity} previousValue={overviewMetrics.spamRate.previousValue} previousPeriod={overviewMetrics.spamRate.previousPeriod} />
              <MetricCard title="Bounce Rate" value={formatPercent(overviewMetrics.bounceRate.value)} change={overviewMetrics.bounceRate.change} isPositive={overviewMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={overviewSparklineData.bounceRate} granularity={granularity} previousValue={overviewMetrics.bounceRate.previousValue} previousPeriod={overviewMetrics.bounceRate.previousPeriod} />
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
              <MetricCard title="Total Revenue" value={formatCurrency(campaignMetrics.totalRevenue.value)} change={campaignMetrics.totalRevenue.change} isPositive={campaignMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenue" sparklineData={campaignSparklineData.totalRevenue} granularity={granularity} previousValue={campaignMetrics.totalRevenue.previousValue} previousPeriod={campaignMetrics.totalRevenue.previousPeriod} />
              <MetricCard title="Average Order Value" value={formatCurrency(campaignMetrics.averageOrderValue.value)} change={campaignMetrics.averageOrderValue.change} isPositive={campaignMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="avgOrderValue" sparklineData={campaignSparklineData.averageOrderValue} granularity={granularity} previousValue={campaignMetrics.averageOrderValue.previousValue} previousPeriod={campaignMetrics.averageOrderValue.previousPeriod} />
              <MetricCard title="Revenue per Email" value={formatCurrency(campaignMetrics.revenuePerEmail.value)} change={campaignMetrics.revenuePerEmail.change} isPositive={campaignMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={campaignSparklineData.revenuePerEmail} granularity={granularity} previousValue={campaignMetrics.revenuePerEmail.previousValue} previousPeriod={campaignMetrics.revenuePerEmail.previousPeriod} />
              <MetricCard title="Open Rate" value={formatPercent(campaignMetrics.openRate.value)} change={campaignMetrics.openRate.change} isPositive={campaignMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={campaignSparklineData.openRate} granularity={granularity} previousValue={campaignMetrics.openRate.previousValue} previousPeriod={campaignMetrics.openRate.previousPeriod} />
              <MetricCard title="Click Rate" value={formatPercent(campaignMetrics.clickRate.value)} change={campaignMetrics.clickRate.change} isPositive={campaignMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={campaignSparklineData.clickRate} granularity={granularity} previousValue={campaignMetrics.clickRate.previousValue} previousPeriod={campaignMetrics.clickRate.previousPeriod} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(campaignMetrics.clickToOpenRate.value)} change={campaignMetrics.clickToOpenRate.change} isPositive={campaignMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={campaignSparklineData.clickToOpenRate} granularity={granularity} previousValue={campaignMetrics.clickToOpenRate.previousValue} previousPeriod={campaignMetrics.clickToOpenRate.previousPeriod} />
              <MetricCard title="Emails Sent" value={formatNumber(campaignMetrics.emailsSent.value)} change={campaignMetrics.emailsSent.change} isPositive={campaignMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="emailsSent" sparklineData={campaignSparklineData.emailsSent} granularity={granularity} previousValue={campaignMetrics.emailsSent.previousValue} previousPeriod={campaignMetrics.emailsSent.previousPeriod} />
              <MetricCard title="Total Orders" value={formatNumber(campaignMetrics.totalOrders.value)} change={campaignMetrics.totalOrders.change} isPositive={campaignMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="totalOrders" sparklineData={campaignSparklineData.totalOrders} granularity={granularity} previousValue={campaignMetrics.totalOrders.previousValue} previousPeriod={campaignMetrics.totalOrders.previousPeriod} />
              <MetricCard title="Conversion Rate" value={formatPercent(campaignMetrics.conversionRate.value)} change={campaignMetrics.conversionRate.change} isPositive={campaignMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={campaignSparklineData.conversionRate} granularity={granularity} previousValue={campaignMetrics.conversionRate.previousValue} previousPeriod={campaignMetrics.conversionRate.previousPeriod} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(campaignMetrics.unsubscribeRate.value)} change={campaignMetrics.unsubscribeRate.change} isPositive={campaignMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={campaignSparklineData.unsubscribeRate} granularity={granularity} previousValue={campaignMetrics.unsubscribeRate.previousValue} previousPeriod={campaignMetrics.unsubscribeRate.previousPeriod} />
              <MetricCard title="Spam Rate" value={formatPercent(campaignMetrics.spamRate.value)} change={campaignMetrics.spamRate.change} isPositive={campaignMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={campaignSparklineData.spamRate} granularity={granularity} previousValue={campaignMetrics.spamRate.previousValue} previousPeriod={campaignMetrics.spamRate.previousPeriod} />
              <MetricCard title="Bounce Rate" value={formatPercent(campaignMetrics.bounceRate.value)} change={campaignMetrics.bounceRate.change} isPositive={campaignMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={campaignSparklineData.bounceRate} granularity={granularity} previousValue={campaignMetrics.bounceRate.previousValue} previousPeriod={campaignMetrics.bounceRate.previousPeriod} />
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
              <div className="relative">
                <select
                  value={selectedFlow}
                  onChange={(e) => setSelectedFlow(e.target.value)}
                  className={`
                    appearance-none px-4 py-2 pr-8 rounded-lg border cursor-pointer
                    ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}
                    focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  `}
                >
                  <option value="all">All Flows</option>
                  {uniqueFlowNames.map(flow => (
                    <option key={flow} value={flow}>{flow}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard title="Total Revenue" value={formatCurrency(flowMetrics.totalRevenue.value)} change={flowMetrics.totalRevenue.change} isPositive={flowMetrics.totalRevenue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenue" sparklineData={flowSparklineData.totalRevenue} granularity={granularity} previousValue={flowMetrics.totalRevenue.previousValue} previousPeriod={flowMetrics.totalRevenue.previousPeriod} />
              <MetricCard title="Average Order Value" value={formatCurrency(flowMetrics.averageOrderValue.value)} change={flowMetrics.averageOrderValue.change} isPositive={flowMetrics.averageOrderValue.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="avgOrderValue" sparklineData={flowSparklineData.averageOrderValue} granularity={granularity} previousValue={flowMetrics.averageOrderValue.previousValue} previousPeriod={flowMetrics.averageOrderValue.previousPeriod} />
              <MetricCard title="Revenue per Email" value={formatCurrency(flowMetrics.revenuePerEmail.value)} change={flowMetrics.revenuePerEmail.change} isPositive={flowMetrics.revenuePerEmail.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="revenuePerEmail" sparklineData={flowSparklineData.revenuePerEmail} granularity={granularity} previousValue={flowMetrics.revenuePerEmail.previousValue} previousPeriod={flowMetrics.revenuePerEmail.previousPeriod} />
              <MetricCard title="Open Rate" value={formatPercent(flowMetrics.openRate.value)} change={flowMetrics.openRate.change} isPositive={flowMetrics.openRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="openRate" sparklineData={flowSparklineData.openRate} granularity={granularity} previousValue={flowMetrics.openRate.previousValue} previousPeriod={flowMetrics.openRate.previousPeriod} />
              <MetricCard title="Click Rate" value={formatPercent(flowMetrics.clickRate.value)} change={flowMetrics.clickRate.change} isPositive={flowMetrics.clickRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickRate" sparklineData={flowSparklineData.clickRate} granularity={granularity} previousValue={flowMetrics.clickRate.previousValue} previousPeriod={flowMetrics.clickRate.previousPeriod} />
              <MetricCard title="Click-to-Open Rate" value={formatPercent(flowMetrics.clickToOpenRate.value)} change={flowMetrics.clickToOpenRate.change} isPositive={flowMetrics.clickToOpenRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="clickToOpenRate" sparklineData={flowSparklineData.clickToOpenRate} granularity={granularity} previousValue={flowMetrics.clickToOpenRate.previousValue} previousPeriod={flowMetrics.clickToOpenRate.previousPeriod} />
              <MetricCard title="Emails Sent" value={formatNumber(flowMetrics.emailsSent.value)} change={flowMetrics.emailsSent.change} isPositive={flowMetrics.emailsSent.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="emailsSent" sparklineData={flowSparklineData.emailsSent} granularity={granularity} previousValue={flowMetrics.emailsSent.previousValue} previousPeriod={flowMetrics.emailsSent.previousPeriod} />
              <MetricCard title="Total Orders" value={formatNumber(flowMetrics.totalOrders.value)} change={flowMetrics.totalOrders.change} isPositive={flowMetrics.totalOrders.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="totalOrders" sparklineData={flowSparklineData.totalOrders} granularity={granularity} previousValue={flowMetrics.totalOrders.previousValue} previousPeriod={flowMetrics.totalOrders.previousPeriod} />
              <MetricCard title="Conversion Rate" value={formatPercent(flowMetrics.conversionRate.value)} change={flowMetrics.conversionRate.change} isPositive={flowMetrics.conversionRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="conversionRate" sparklineData={flowSparklineData.conversionRate} granularity={granularity} previousValue={flowMetrics.conversionRate.previousValue} previousPeriod={flowMetrics.conversionRate.previousPeriod} />
              <MetricCard title="Unsubscribe Rate" value={formatPercent(flowMetrics.unsubscribeRate.value)} change={flowMetrics.unsubscribeRate.change} isPositive={flowMetrics.unsubscribeRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="unsubscribeRate" isNegativeMetric sparklineData={flowSparklineData.unsubscribeRate} granularity={granularity} previousValue={flowMetrics.unsubscribeRate.previousValue} previousPeriod={flowMetrics.unsubscribeRate.previousPeriod} />
              <MetricCard title="Spam Rate" value={formatPercent(flowMetrics.spamRate.value)} change={flowMetrics.spamRate.change} isPositive={flowMetrics.spamRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="spamRate" isNegativeMetric sparklineData={flowSparklineData.spamRate} granularity={granularity} previousValue={flowMetrics.spamRate.previousValue} previousPeriod={flowMetrics.spamRate.previousPeriod} />
              <MetricCard title="Bounce Rate" value={formatPercent(flowMetrics.bounceRate.value)} change={flowMetrics.bounceRate.change} isPositive={flowMetrics.bounceRate.isPositive} isDarkMode={isDarkMode} dateRange={dateRange} metricKey="bounceRate" isNegativeMetric sparklineData={flowSparklineData.bounceRate} granularity={granularity} previousValue={flowMetrics.bounceRate.previousValue} previousPeriod={flowMetrics.bounceRate.previousPeriod} />
            </div>
          </section>

          {/* Flow Step Analysis - NEW SECTION */}
          <FlowStepAnalysis isDarkMode={isDarkMode} dateRange={dateRange} granularity={granularity} />

          {/* Audience Overview */}
          <div ref={audienceOverviewRef}>
            <AudienceCharts isDarkMode={isDarkMode} />
            {/* Analyze Custom Segment - match dashboard container style and dark mode */}
            <CustomSegmentBlock isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;