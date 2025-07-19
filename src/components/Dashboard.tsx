import React, { useState, useMemo } from 'react';
import { Upload, BarChart3 } from 'lucide-react';
import MetricCard from './MetricCard';
import AudienceCharts from './AudienceCharts';
import DayOfWeekPerformance from './DayOfWeekPerformance';
import HourOfDayPerformance from './HourOfDayPerformance';
import { 
  ALL_CAMPAIGNS, 
  ALL_FLOW_EMAILS, 
  ALL_SUBSCRIBERS,
  getMetricTimeSeries, 
  getGranularityForDateRange,
  getAggregatedMetricsForPeriod,
  getAudienceInsights,
  ProcessedCampaign,
  ProcessedFlowEmail
} from '../utils/mockDataGenerator';

interface DashboardProps {
  onUploadNew: () => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onUploadNew, isDarkMode }) => {
  const [dateRange, setDateRange] = useState('30d');

  // Filter data based on date range
  const { filteredCampaigns, filteredFlows, filteredSubscribers } = useMemo(() => {
    const endDate = new Date();
    let startDate = new Date();
    
    if (dateRange === 'all') {
      startDate = new Date('2020-01-01');
    } else {
      const days = parseInt(dateRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);
    }
    
    const campaigns = ALL_CAMPAIGNS.filter(campaign => 
      campaign.sentDate >= startDate && campaign.sentDate <= endDate
    );
    
    const flows = ALL_FLOW_EMAILS.filter(flow => 
      flow.sentDate >= startDate && flow.sentDate <= endDate
    );
    
    // For subscribers, we'll use all of them since they represent the current state
    const subscribers = ALL_SUBSCRIBERS;
    
    return {
      filteredCampaigns: campaigns,
      filteredFlows: flows,
      filteredSubscribers: subscribers
    };
  }, [dateRange]);

  // Calculate current period metrics
  const currentPeriodMetrics = useMemo(() => {
    const endDate = new Date();
    let startDate = new Date();
    
    if (dateRange === 'all') {
      startDate = new Date('2020-01-01');
    } else {
      const days = parseInt(dateRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);
    }
    
    return getAggregatedMetricsForPeriod(
      filteredCampaigns,
      filteredFlows,
      startDate,
      endDate
    );
  }, [filteredCampaigns, filteredFlows, dateRange]);

  // Calculate previous period metrics for comparison
  const previousPeriodMetrics = useMemo(() => {
    if (dateRange === 'all') {
      return currentPeriodMetrics; // No comparison for all time
    }
    
    const days = parseInt(dateRange.replace('d', ''));
    const currentEndDate = new Date();
    const currentStartDate = new Date();
    currentStartDate.setDate(currentEndDate.getDate() - days);
    
    const previousEndDate = new Date(currentStartDate);
    const previousStartDate = new Date();
    previousStartDate.setDate(previousEndDate.getDate() - days);
    
    const previousCampaigns = ALL_CAMPAIGNS.filter(campaign => 
      campaign.sentDate >= previousStartDate && campaign.sentDate <= previousEndDate
    );
    
    const previousFlows = ALL_FLOW_EMAILS.filter(flow => 
      flow.sentDate >= previousStartDate && flow.sentDate <= previousEndDate
    );
    
    return getAggregatedMetricsForPeriod(
      previousCampaigns,
      previousFlows,
      previousStartDate,
      previousEndDate
    );
  }, [dateRange, currentPeriodMetrics]);

  // Calculate changes
  const changes = useMemo(() => {
    if (dateRange === 'all') {
      return {
        revenue: 0,
        emailsSent: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        unsubscribeRate: 0,
        spamRate: 0,
        bounceRate: 0,
        avgOrderValue: 0,
        revenuePerEmail: 0,
        clickToOpenRate: 0
      };
    }
    
    return {
      revenue: previousPeriodMetrics.totalRevenue > 0 
        ? ((currentPeriodMetrics.totalRevenue - previousPeriodMetrics.totalRevenue) / previousPeriodMetrics.totalRevenue) * 100 
        : 0,
      emailsSent: previousPeriodMetrics.emailsSent > 0 
        ? ((currentPeriodMetrics.emailsSent - previousPeriodMetrics.emailsSent) / previousPeriodMetrics.emailsSent) * 100 
        : 0,
      openRate: currentPeriodMetrics.openRate - previousPeriodMetrics.openRate,
      clickRate: currentPeriodMetrics.clickRate - previousPeriodMetrics.clickRate,
      conversionRate: currentPeriodMetrics.conversionRate - previousPeriodMetrics.conversionRate,
      unsubscribeRate: currentPeriodMetrics.unsubscribeRate - previousPeriodMetrics.unsubscribeRate,
      spamRate: currentPeriodMetrics.spamRate - previousPeriodMetrics.spamRate,
      bounceRate: currentPeriodMetrics.bounceRate - previousPeriodMetrics.bounceRate,
      avgOrderValue: previousPeriodMetrics.avgOrderValue > 0 
        ? ((currentPeriodMetrics.avgOrderValue - previousPeriodMetrics.avgOrderValue) / previousPeriodMetrics.avgOrderValue) * 100 
        : 0,
      revenuePerEmail: previousPeriodMetrics.revenuePerEmail > 0 
        ? ((currentPeriodMetrics.revenuePerEmail - previousPeriodMetrics.revenuePerEmail) / previousPeriodMetrics.revenuePerEmail) * 100 
        : 0,
      clickToOpenRate: currentPeriodMetrics.clickToOpenRate - previousPeriodMetrics.clickToOpenRate
    };
  }, [currentPeriodMetrics, previousPeriodMetrics, dateRange]);

  // Get sparkline data
  const granularity = getGranularityForDateRange(dateRange);
  
  const sparklineData = {
    revenue: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'revenue', dateRange, granularity),
    emailsSent: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'emailsSent', dateRange, granularity),
    openRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'openRate', dateRange, granularity),
    clickRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'clickRate', dateRange, granularity),
    conversionRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'conversionRate', dateRange, granularity),
    unsubscribeRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'unsubscribeRate', dateRange, granularity),
    spamRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'spamRate', dateRange, granularity),
    bounceRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'bounceRate', dateRange, granularity),
    avgOrderValue: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'avgOrderValue', dateRange, granularity),
    revenuePerEmail: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'revenuePerEmail', dateRange, granularity),
    clickToOpenRate: getMetricTimeSeries(filteredCampaigns, filteredFlows, 'clickToOpenRate', dateRange, granularity)
  };

  // Get audience insights
  const audienceInsights = getAudienceInsights();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Analytics Dashboard
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive insights from your email campaigns and flows
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`
                px-4 py-2 rounded-lg border
                ${isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
                } 
                focus:ring-2 focus:ring-purple-500 focus:border-transparent
              `}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180d">Last 6 months</option>
              <option value="365d">Last year</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={onUploadNew}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                } 
                border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
              `}
            >
              Upload New Data
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(currentPeriodMetrics.totalRevenue)}
            change={changes.revenue}
            isPositive={changes.revenue >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="revenue"
            sparklineData={sparklineData.revenue}
          />
          <MetricCard
            title="Emails Sent"
            value={formatNumber(currentPeriodMetrics.emailsSent)}
            change={changes.emailsSent}
            isPositive={changes.emailsSent >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="emailsSent"
            sparklineData={sparklineData.emailsSent}
          />
          <MetricCard
            title="Open Rate"
            value={formatPercentage(currentPeriodMetrics.openRate)}
            change={changes.openRate}
            isPositive={changes.openRate >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="openRate"
            sparklineData={sparklineData.openRate}
          />
          <MetricCard
            title="Click Rate"
            value={formatPercentage(currentPeriodMetrics.clickRate)}
            change={changes.clickRate}
            isPositive={changes.clickRate >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="clickRate"
            sparklineData={sparklineData.clickRate}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Click-to-Open Rate"
            value={formatPercentage(currentPeriodMetrics.clickToOpenRate)}
            change={changes.clickToOpenRate}
            isPositive={changes.clickToOpenRate >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="clickToOpenRate"
            sparklineData={sparklineData.clickToOpenRate}
          />
          <MetricCard
            title="Conversion Rate"
            value={formatPercentage(currentPeriodMetrics.conversionRate)}
            change={changes.conversionRate}
            isPositive={changes.conversionRate >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="conversionRate"
            sparklineData={sparklineData.conversionRate}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(currentPeriodMetrics.avgOrderValue)}
            change={changes.avgOrderValue}
            isPositive={changes.avgOrderValue >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="avgOrderValue"
            sparklineData={sparklineData.avgOrderValue}
          />
          <MetricCard
            title="Revenue per Email"
            value={formatCurrency(currentPeriodMetrics.revenuePerEmail)}
            change={changes.revenuePerEmail}
            isPositive={changes.revenuePerEmail >= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            metricKey="revenuePerEmail"
            sparklineData={sparklineData.revenuePerEmail}
          />
        </div>

        {/* Negative Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Unsubscribe Rate"
            value={formatPercentage(currentPeriodMetrics.unsubscribeRate)}
            change={changes.unsubscribeRate}
            isPositive={changes.unsubscribeRate <= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            isNegativeMetric={true}
            metricKey="unsubscribeRate"
            sparklineData={sparklineData.unsubscribeRate}
          />
          <MetricCard
            title="Spam Rate"
            value={formatPercentage(currentPeriodMetrics.spamRate)}
            change={changes.spamRate}
            isPositive={changes.spamRate <= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            isNegativeMetric={true}
            metricKey="spamRate"
            sparklineData={sparklineData.spamRate}
          />
          <MetricCard
            title="Bounce Rate"
            value={formatPercentage(currentPeriodMetrics.bounceRate)}
            change={changes.bounceRate}
            isPositive={changes.bounceRate <= 0}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            isNegativeMetric={true}
            metricKey="bounceRate"
            sparklineData={sparklineData.bounceRate}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid lg:grid-cols-1 gap-8 mb-8">
          <AudienceCharts isDarkMode={isDarkMode} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <DayOfWeekPerformance 
            filteredCampaigns={filteredCampaigns}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
          />
          <HourOfDayPerformance 
            filteredCampaigns={filteredCampaigns}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;