import React from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, Target, MessageSquare, Clock, Shield, DollarSign, Users, CheckCircle, ChevronRight, Award, Activity, AlertTriangle, Star, Lightbulb, Eye, Calendar } from 'lucide-react';

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

interface AICampaignIntelligenceProps {
  insights: InsightsData | null;
  isLoading: boolean;
  onGetInsights: () => void;
  isDarkMode: boolean;
  currentPeriodMetrics: any;
  previousPeriodMetrics: any;
  audienceInsights: any;
}

const AICampaignIntelligence: React.FC<AICampaignIntelligenceProps> = ({
  insights,
  isLoading,
  onGetInsights,
  isDarkMode,
  currentPeriodMetrics,
  previousPeriodMetrics,
  audienceInsights
}) => {
  // Helper functions
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

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

  const PatternCard = ({ pattern }: { pattern: any }) => (
    <div className={`
      grid grid-cols-2 gap-4 p-4 rounded-lg border
      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
    `}>
      <div className={`
        p-3 rounded-lg border
        ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}
      `}>
        <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
          🏆 Winning Pattern
        </h5>
        <p className="text-sm font-medium mb-2">{pattern.winning_pattern}</p>
        <div className="space-y-1">
          {pattern.key_factors.map((factor: string, idx: number) => (
            <div key={idx} className="text-xs text-green-600 dark:text-green-400">
              • {factor}
            </div>
          ))}
        </div>
      </div>
      <div className={`
        p-3 rounded-lg border
        ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}
      `}>
        <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">
          📉 Losing Pattern
        </h5>
        <p className="text-sm font-medium mb-2">{pattern.losing_pattern}</p>
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {pattern.performance_difference}
        </p>
      </div>
    </div>
  );

  // If no insights yet, show the beautiful initial state
  if (!insights && !isLoading) {
    return (
      <div className={`
        relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-purple-500/20 to-blue-500/20 mb-8
        ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/10' : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30'}
      `}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header with animated background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 animate-pulse" />
          <div className="relative p-8">
            <div className="flex items-center gap-4 mb-6">
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

            <div className="text-center">
              <p className={`text-xl mb-6 max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Transform your Klaviyo campaign data into actionable business intelligence. 
                Our AI analyzes patterns across all your campaigns to identify opportunities 
                that would be impossible to spot manually.
              </p>
              
              <button
                onClick={onGetInsights}
                className={`
                  group relative px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform
                  bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1
                `}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Brain className="w-6 h-6" />
                  Start AI Analysis
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                </span>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 -top-px rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`
        relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-purple-500/20 to-blue-500/20 mb-8
        ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/10' : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30'}
      `}>
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-2xl font-semibold">Analyzing your email performance data...</span>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Our AI is processing your campaign history to identify actionable insights
          </p>
        </div>
      </div>
    );
  }

  // Full insights display
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-purple-500/20 to-blue-500/20 mb-8
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

            {/* Pattern Comparisons */}
            {insights.subject_line_intelligence.performance_comparison && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Winning vs. Losing Patterns</h4>
                <div className="space-y-4">
                  {insights.subject_line_intelligence.performance_comparison.map((pattern, index) => (
                    <PatternCard key={index} pattern={pattern} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audience Size Optimization */}
        {insights.audience_size_optimization && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Optimal Audience Size Discovery
              </h3>
            </div>
            <div className={`
              p-4 rounded-lg border
              ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                    Performance by Audience Size
                  </h4>
                  <div className="space-y-3">
                    {insights.audience_size_optimization.optimal_ranges.map((range, index) => (
                      <div key={index} className={`
                        p-3 rounded-lg border
                        ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}
                      `}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{range.size_range}</span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {range.performance_metric}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                          {range.improvement}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {range.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                    Segmentation Opportunities
                  </h4>
                  <div className={`
                    p-4 rounded-lg
                    ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}
                  `}>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                      {insights.audience_size_optimization.performance_curve}
                    </p>
                    <div className="space-y-2">
                      {insights.audience_size_optimization.segmentation_opportunities.map((opportunity, idx) => (
                        <div key={idx} className="text-sm">• {opportunity}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Temporal Performance Mapping */}
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
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Peak Performance Times
                </h4>
                <div className="space-y-3">
                  {insights.temporal_performance.best_times.map((time, index) => (
                    <div key={index} className={`
                      p-3 rounded-lg
                      ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}
                    `}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {time.time_period}
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {time.performance_metric}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-1">
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
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Seasonal Insights
                </h4>
                <div className={`
                  p-4 rounded-lg
                  ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}
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

        {/* Campaign Health Monitoring */}
        {insights.health_monitoring && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-600" />
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Campaign Health Monitoring System
              </h3>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                  Health Alerts
                </h4>
                <div className="space-y-3">
                  {insights.health_monitoring.alerts.map((alert, index) => (
                    <div key={index} className={`
                      p-3 rounded-lg border
                      ${getRiskColor(alert.risk_level)}
                    `}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{alert.metric}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(alert.risk_level)}`}>
                          {alert.risk_level} risk
                        </span>
                      </div>
                      <p className="text-sm mb-1">{alert.current_status}</p>
                      <p className="text-sm mb-2">{alert.trend}</p>
                      <p className="text-xs font-medium">⚠️ {alert.prediction}</p>
                      <p className="text-xs mt-1">Action: {alert.action_required}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                  Risk Assessment & Prevention
                </h4>
                <div className={`
                  p-4 rounded-lg mb-4
                  ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}
                `}>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                    {insights.health_monitoring.risk_assessment}
                  </p>
                </div>
                <h5 className="text-sm font-medium mb-2">Preventive Actions:</h5>
                <div className="space-y-1">
                  {insights.health_monitoring.preventive_actions.map((action, idx) => (
                    <div key={idx} className="text-sm">• {action}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Prediction Engine */}
        {insights.revenue_predictions && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Revenue Prediction Engine
              </h3>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                  Campaign Predictions
                </h4>
                <div className="space-y-3">
                  {insights.revenue_predictions.predictions.map((prediction, index) => (
                    <div key={index} className={`
                      p-3 rounded-lg border
                      ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}
                    `}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{prediction.campaign_type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {prediction.predicted_range}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            prediction.confidence >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            prediction.confidence >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {prediction.confidence}% confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{prediction.parameters}</p>
                      <div className="text-xs space-y-1">
                        {prediction.factors.map((factor, idx) => (
                          <div key={idx}>• {factor}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`
                p-4 rounded-lg border
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                  Growth Opportunities
                </h4>
                <div className={`
                  p-4 rounded-lg mb-4
                  ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}
                `}>
                  <div className="space-y-2">
                    {insights.revenue_predictions.growth_opportunities.map((opportunity, idx) => (
                      <div key={idx} className="text-sm text-green-600 dark:text-green-400">
                        💡 {opportunity}
                      </div>
                    ))}
                  </div>
                </div>
                <h5 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                  Risk Factors:
                </h5>
                <div className="space-y-1">
                  {insights.revenue_predictions.risk_factors.map((risk, idx) => (
                    <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ {risk}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priority Action Items */}
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
  );
};

export default AICampaignIntelligence;