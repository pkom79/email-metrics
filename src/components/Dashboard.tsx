import React, { useState, useMemo } from 'react';
import { Upload, BarChart3, TrendingUp, TrendingDown, Calendar, Zap, Users, Mail, Target, DollarSign, Eye, MousePointer, ShoppingCart, UserX, AlertTriangle, Bounce, CheckCircle, ArrowUp, ArrowDown, MessageSquare, Clock, Shield, Lightbulb, Star, Brain, Sparkles, ChevronRight, Award, Activity } from 'lucide-react';
import MetricCard from './MetricCard';
import AudienceCharts from './AudienceCharts';
import DayOfWeekPerformance from './DayOfWeekPerformance';
import HourOfDayPerformance from './HourOfDayPerformance';
import InsightsModal from './InsightsModal';
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

interface InsightsData {
  summary: {
    overall_health: string;
    key_metrics: {
      revenue: string;
      open_rate: string;
      click_rate: string;
      conversion_rate: string;
    };
  };
  trends: {
    revenue: string;
    engagement: string;
    conversion: string;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    reason: string;
    impact: string;
  }>;
  campaign_insights: {
    topPerformer: any;
    worstPerformer: any;
  };
  flow_insights: {
    topPerformer: any;
    improvement_needed: any;
  };
  audience_insights: {
    total_subscribers: number;
    buyer_percentage: string;
    avg_clv: string;
    opportunity: string;
  };
  sending_analysis: {
    emails_per_month: string;
    frequency_assessment: string;
  };
  subject_line_intelligence?: {
    key_patterns: Array<{
      pattern: string;
      impact: string;
      example: string;
      performance_increase: number;
    }>;
    winning_elements: string[];
    avoid_elements: string[];
    optimal_length: string;
    performance_comparison: Array<{
      winning_pattern: string;
      losing_pattern: string;
      performance_difference: string;
      key_factors: string[];
    }>;
  };
  audience_size_optimization?: {
    optimal_ranges: Array<{
      size_range: string;
      performance_metric: string;
      improvement: string;
      recommendation: string;
    }>;
    performance_curve: string;
    segmentation_opportunities: string[];
  };
  temporal_performance?: {
    best_times: Array<{
      time_period: string;
      performance_metric: string;
      opportunity: string;
      revenue_impact: string;
    }>;
    seasonal_patterns: string[];
    optimization_schedule: string;
  };
  health_monitoring?: {
    health_score: number;
    alerts: Array<{
      metric: string;
      current_status: string;
      trend: string;
      risk_level: 'low' | 'medium' | 'high';
      prediction: string;
      action_required: string;
    }>;
    risk_assessment: string;
    preventive_actions: string[];
  };
  revenue_predictions?: {
    predictions: Array<{
      campaign_type: string;
      parameters: string;
      predicted_range: string;
      confidence: number;
      factors: string[];
    }>;
    growth_opportunities: string[];
    risk_factors: string[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ onUploadNew, isDarkMode }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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

  const handleGetInsights = async () => {
    setIsLoadingInsights(true);
    setShowInsightsModal(true);
    
    try {
      // Prepare data for AI analysis
      const topCampaigns = [...filteredCampaigns]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      const bottomCampaigns = [...filteredCampaigns]
        .sort((a, b) => a.revenue - b.revenue)
        .slice(0, 5);
      
      const topFlows = [...filteredFlows]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      const bottomFlows = [...filteredFlows]
        .sort((a, b) => a.revenue - b.revenue)
        .slice(0, 5);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-email-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPeriod: currentPeriodMetrics,
          previousPeriod: previousPeriodMetrics,
          topCampaigns,
          bottomCampaigns,
          topFlows,
          bottomFlows,
          audienceInsights,
          dateRange
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      // Handle error - maybe show a toast or error message
    } finally {
      setIsLoadingInsights(false);
    }
  };

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

  // Get health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'stable':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'needs_attention':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Health Gauge Component
  const HealthGauge = ({ score }: { score: number }) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={isDarkMode ? '#374151' : '#e5e7eb'}
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getScoreColor(score)}
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
    );
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
              onClick={handleGetInsights}
              disabled={isLoadingInsights}
              className={`
                group relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform
                ${isLoadingInsights
                  ? `${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {isLoadingInsights ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Get AI Insights
                  </>
                )}
              </span>
            </button>
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

        {/* AI Insights Section */}
        {insights && (
          <div className="mb-8">
            <div className={`
              relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-purple-500/20 to-blue-500/20
              ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/10' : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30'}
            `}>
              {/* Header with animated background */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 animate-pulse" />
                <div className="relative p-8 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                        <div className="relative p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>
                          AI Campaign Intelligence
                        </h2>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Advanced analytics powered by artificial intelligence
                        </p>
                      </div>
                    </div>
                    {insights.health_monitoring && (
                      <div className="flex items-center gap-4">
                        <HealthGauge score={insights.health_monitoring.health_score} />
                        <div className="text-right">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Health</p>
                          <p className={`text-2xl font-bold capitalize ${getHealthColor(insights.summary.overall_health)}`}>
                            {insights.summary.overall_health.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Metrics Overview */}
              <div className="p-8 border-b border-purple-500/10">
                <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Performance Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(insights.summary.key_metrics).map(([key, value]) => (
                    <div key={key} className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}
                      backdrop-blur-sm
                    `}>
                      <p className={`text-xs uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {key.replace('_', ' ')}
                      </p>
                      <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis Modules */}
              <div className="p-8 space-y-8">
                {/* Subject Line Intelligence */}
                {insights.subject_line_intelligence && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Subject Line Intelligence Engine
                      </h3>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* High-Impact Patterns */}
                      <div className={`
                        p-6 rounded-xl border
                        ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/60 border-gray-200/60'}
                        backdrop-blur-sm
                      `}>
                        <h4 className="font-semibold mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          High-Impact Patterns
                        </h4>
                        <div className="space-y-4">
                          {insights.subject_line_intelligence.key_patterns.map((pattern, index) => (
                            <div key={index} className={`
                              p-4 rounded-lg border
                              ${isDarkMode ? 'bg-green-900/20 border-green-800/30' : 'bg-green-50/80 border-green-200/60'}
                            `}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {pattern.pattern}
                                </span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  +{pattern.performance_increase}%
                                </span>
                              </div>
                              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                {pattern.impact}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                💡 Example: "{pattern.example}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Optimization Guidelines */}
                      <div className={`
                        p-6 rounded-xl border
                        ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/60 border-gray-200/60'}
                        backdrop-blur-sm
                      `}>
                        <h4 className="font-semibold mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Optimization Guidelines
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Use These Elements
                            </h5>
                            <div className="space-y-2">
                              {insights.subject_line_intelligence.winning_elements.map((element, idx) => (
                                <div key={idx} className="text-sm flex items-center gap-2">
                                  <ChevronRight className="w-3 h-3 text-green-500" />
                                  {element}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Avoid These Elements
                            </h5>
                            <div className="space-y-2">
                              {insights.subject_line_intelligence.avoid_elements.map((element, idx) => (
                                <div key={idx} className="text-sm flex items-center gap-2">
                                  <ChevronRight className="w-3 h-3 text-red-500" />
                                  {element}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className={`
                            p-3 rounded-lg
                            ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50/80 border border-blue-200/60'}
                          `}>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Optimal Length: {insights.subject_line_intelligence.optimal_length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Temporal Performance */}
                {insights.temporal_performance && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Clock className="w-6 h-6 text-purple-600" />
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Temporal Performance Mapping
                      </h3>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className={`
                        p-6 rounded-xl border
                        ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/60 border-gray-200/60'}
                        backdrop-blur-sm
                      `}>
                        <h4 className="font-semibold mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Peak Performance Times
                        </h4>
                        <div className="space-y-3">
                          {insights.temporal_performance.best_times.map((time, index) => (
                            <div key={index} className={`
                              p-4 rounded-lg
                              ${isDarkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50/80 border border-green-200/60'}
                            `}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {time.time_period}
                                </span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {time.performance_metric}
                                </span>
                              </div>
                              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                {time.opportunity}
                              </p>
                              <p className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {time.revenue_impact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`
                        p-6 rounded-xl border
                        ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white/60 border-gray-200/60'}
                        backdrop-blur-sm
                      `}>
                        <h4 className="font-semibold mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Seasonal Insights
                        </h4>
                        <div className={`
                          p-4 rounded-lg
                          ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-800/30' : 'bg-yellow-50/80 border border-yellow-200/60'}
                        `}>
                          <div className="space-y-3">
                            {insights.temporal_performance.seasonal_patterns.map((pattern, idx) => (
                              <div key={idx} className="text-sm flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                {pattern}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-yellow-300/30 dark:border-yellow-700/30">
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              {insights.temporal_performance.optimization_schedule}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority Recommendations */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-purple-600" />
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Priority Action Items
                    </h3>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {insights.recommendations.slice(0, 6).map((rec, index) => (
                      <div key={index} className={`
                        p-6 rounded-xl border transition-all duration-200 hover:shadow-lg
                        ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50' : 'bg-white/60 border-gray-200/60 hover:bg-white/80'}
                        backdrop-blur-sm
                      `}>
                        <div className="flex items-start gap-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                            {rec.priority} priority
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                              {rec.category}
                            </h4>
                            <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {rec.action}
                            </p>
                            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {rec.reason}
                            </p>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              {rec.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights Modal */}
      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insights}
        isDarkMode={isDarkMode}
        isLoading={isLoadingInsights}
      />
    </div>
  );
};

export default Dashboard;