import React from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Users, Mail, Target, MessageSquare, Eye, Clock, Shield, DollarSign, BarChart3, Calendar, Globe } from 'lucide-react';

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
  impact: string;
}

interface SubjectLinePattern {
  pattern: string;
  impact: string;
  example: string;
  performance_increase: number;
}

interface AudienceSizeInsight {
  size_range: string;
  performance_metric: string;
  improvement: string;
  recommendation: string;
}

interface EngagementFunnelInsight {
  stage: string;
  issue: string;
  impact: string;
  solution: string;
}

interface TemporalInsight {
  time_period: string;
  performance_metric: string;
  opportunity: string;
  revenue_impact: string;
}

interface HealthAlert {
  metric: string;
  current_status: string;
  trend: string;
  risk_level: 'low' | 'medium' | 'high';
  prediction: string;
  action_required: string;
}

interface RevenuePrediction {
  campaign_type: string;
  parameters: string;
  predicted_range: string;
  confidence: number;
  factors: string[];
}

interface PatternComparison {
  winning_pattern: string;
  losing_pattern: string;
  performance_difference: string;
  key_factors: string[];
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
  recommendations: Recommendation[];
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
  // New comprehensive analysis modules
  subject_line_intelligence?: {
    key_patterns: SubjectLinePattern[];
    winning_elements: string[];
    avoid_elements: string[];
    optimal_length: string;
    performance_comparison: PatternComparison[];
  };
  audience_size_optimization?: {
    optimal_ranges: AudienceSizeInsight[];
    performance_curve: string;
    segmentation_opportunities: string[];
  };
  engagement_funnel_analysis?: {
    funnel_insights: EngagementFunnelInsight[];
    drop_off_points: string[];
    optimization_opportunities: string[];
  };
  temporal_performance?: {
    best_times: TemporalInsight[];
    seasonal_patterns: string[];
    optimization_schedule: string;
  };
  health_monitoring?: {
    health_score: number;
    alerts: HealthAlert[];
    risk_assessment: string;
    preventive_actions: string[];
  };
  revenue_predictions?: {
    predictions: RevenuePrediction[];
    growth_opportunities: string[];
    risk_factors: string[];
  };
}

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  insights: InsightsData | null;
  isDarkMode: boolean;
  isLoading: boolean;
}

const InsightsModal: React.FC<InsightsModalProps> = ({ isOpen, onClose, insights, isDarkMode, isLoading }) => {
  if (!isOpen) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'strong_growth':
      case 'growth':
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 bg-blue-500 rounded-full" />;
    }
  };

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
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
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
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
    );
  };

  const PatternCard = ({ pattern, isDarkMode }: { pattern: PatternComparison; isDarkMode: boolean }) => (
    <div className={`
      grid grid-cols-2 gap-4 p-4 rounded-lg border
      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
    `}>
      <div className={`
        p-3 rounded-lg
        ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}
        border
      `}>
        <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
          🏆 Winning Pattern
        </h5>
        <p className="text-sm font-medium mb-2">{pattern.winning_pattern}</p>
        <div className="space-y-1">
          {pattern.key_factors.map((factor, idx) => (
            <div key={idx} className="text-xs text-green-600 dark:text-green-400">
              • {factor}
            </div>
          ))}
        </div>
      </div>
      <div className={`
        p-3 rounded-lg
        ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}
        border
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`
        w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl
        ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Campaign Intelligence System</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Advanced analytics that transforms your email data into actionable business intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
            `}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg font-medium">Analyzing your email performance data...</span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Our AI is processing your campaign history to identify actionable insights
              </p>
            </div>
          ) : insights ? (
            <div className="p-6 space-y-8">
              {/* Overall Health Summary */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Performance Health Dashboard</h3>
                </div>
                <div className={`
                  p-6 rounded-lg border
                  ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                `}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {insights.health_monitoring && (
                        <HealthGauge score={insights.health_monitoring.health_score} />
                      )}
                      <div>
                        <span className={`text-3xl font-bold capitalize ${getHealthColor(insights.summary.overall_health)}`}>
                          {insights.summary.overall_health.replace('_', ' ')}
                        </span>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Overall Account Health
                        </p>
                      </div>
                    </div>
                    {getTrendIcon(insights.trends.revenue)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(insights.summary.key_metrics).map(([key, value]) => (
                      <div key={key}>
                        <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {key.replace('_', ' ')}
                        </p>
                        <p className="font-semibold text-lg">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Subject Line Intelligence Engine */}
              {insights.subject_line_intelligence && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Subject Line Intelligence Engine</h3>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Key Patterns */}
                    <div className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}>
                      <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                        High-Impact Patterns
                      </h4>
                      <div className="space-y-3">
                        {insights.subject_line_intelligence.key_patterns.map((pattern, index) => (
                          <div key={index} className={`
                            p-3 rounded-lg
                            ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}
                          `}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {pattern.pattern}
                              </span>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                +{pattern.performance_increase}%
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                              {pattern.impact}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Example: "{pattern.example}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optimization Guidelines */}
                    <div className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}>
                      <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                        Optimization Guidelines
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                            ✅ Use These Elements
                          </h5>
                          <div className="space-y-1">
                            {insights.subject_line_intelligence.winning_elements.map((element, idx) => (
                              <div key={idx} className="text-sm">• {element}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                            ❌ Avoid These Elements
                          </h5>
                          <div className="space-y-1">
                            {insights.subject_line_intelligence.avoid_elements.map((element, idx) => (
                              <div key={idx} className="text-sm">• {element}</div>
                            ))}
                          </div>
                        </div>
                        <div className={`
                          p-3 rounded-lg
                          ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}
                        `}>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            💡 Optimal Length: {insights.subject_line_intelligence.optimal_length}
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
                          <PatternCard key={index} pattern={pattern} isDarkMode={isDarkMode} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Audience Size Optimization */}
              {insights.audience_size_optimization && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Optimal Audience Size Discovery</h3>
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
                </section>
              )}

              {/* Temporal Performance Mapping */}
              {insights.temporal_performance && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Temporal Performance Mapping</h3>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}>
                      <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
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
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">
                              💰 {time.revenue_impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}>
                      <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                        Seasonal Insights
                      </h4>
                      <div className={`
                        p-4 rounded-lg
                        ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}
                      `}>
                        <div className="space-y-2">
                          {insights.temporal_performance.seasonal_patterns.map((pattern, idx) => (
                            <div key={idx} className="text-sm">• {pattern}</div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                            📅 {insights.temporal_performance.optimization_schedule}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Campaign Health Monitoring */}
              {insights.health_monitoring && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Campaign Health Monitoring System</h3>
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
                </section>
              )}

              {/* Revenue Prediction Engine */}
              {insights.revenue_predictions && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Revenue Prediction Engine</h3>
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
                </section>
              )}

              {/* Actionable Recommendations */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Priority Action Items</h3>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className={`
                      p-4 rounded-lg border
                      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                    `}>
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} priority
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
                            {rec.category}
                          </h4>
                          <p className="font-medium mb-2">{rec.action}</p>
                          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {rec.reason}
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            💡 {rec.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Performance Insights */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Campaign Insights */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Campaign Performance</h3>
                  </div>
                  <div className="space-y-4">
                    {insights.campaign_insights.topPerformer && (
                      <div className={`
                        p-4 rounded-lg border
                        ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}
                      `}>
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                          🏆 Top Performer
                        </h4>
                        <p className="font-medium mb-1">{insights.campaign_insights.topPerformer.name}</p>
                        <p className="text-sm">
                          Revenue: ${insights.campaign_insights.topPerformer.revenue.toLocaleString()} • 
                          Open Rate: {insights.campaign_insights.topPerformer.openRate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {insights.campaign_insights.worstPerformer && (
                      <div className={`
                        p-4 rounded-lg border
                        ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}
                      `}>
                        <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                          📉 Needs Improvement
                        </h4>
                        <p className="font-medium mb-1">{insights.campaign_insights.worstPerformer.name}</p>
                        <p className="text-sm">
                          Revenue: ${insights.campaign_insights.worstPerformer.revenue.toLocaleString()} • 
                          Open Rate: {insights.campaign_insights.worstPerformer.openRate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Flow Insights */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Flow Performance</h3>
                  </div>
                  <div className="space-y-4">
                    {insights.flow_insights.topPerformer && (
                      <div className={`
                        p-4 rounded-lg border
                        ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}
                      `}>
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                          🚀 Top Flow
                        </h4>
                        <p className="font-medium mb-1">{insights.flow_insights.topPerformer.name}</p>
                        <p className="text-sm">
                          Revenue: ${insights.flow_insights.topPerformer.revenue.toLocaleString()} • 
                          Open Rate: {insights.flow_insights.topPerformer.openRate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {insights.flow_insights.improvement_needed && (
                      <div className={`
                        p-4 rounded-lg border
                        ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}
                      `}>
                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                          ⚠️ Optimization Needed
                        </h4>
                        <p className="font-medium mb-1">{insights.flow_insights.improvement_needed.name}</p>
                        <p className="text-sm">
                          Revenue: ${insights.flow_insights.improvement_needed.revenue.toLocaleString()} • 
                          Open Rate: {insights.flow_insights.improvement_needed.openRate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Audience & Sending Analysis */}
              <div className="grid md:grid-cols-2 gap-6">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Audience Insights</h3>
                  </div>
                  <div className={`
                    p-4 rounded-lg border
                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{insights.audience_insights.total_subscribers.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Total Subscribers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{insights.audience_insights.buyer_percentage}%</p>
                        <p className="text-sm text-gray-500">Buyers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{insights.audience_insights.avg_clv}</p>
                        <p className="text-sm text-gray-500">Avg CLV</p>
                      </div>
                      <div>
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${insights.audience_insights.opportunity === 'high' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }
                        `}>
                          {insights.audience_insights.opportunity} opportunity
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Sending Analysis</h3>
                  </div>
                  <div className={`
                    p-4 rounded-lg border
                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-2">{insights.sending_analysis.emails_per_month}</p>
                      <p className="text-sm text-gray-500 mb-3">Emails per subscriber/month</p>
                      <span className={`
                        px-3 py-1 text-sm font-medium rounded-full
                        ${insights.sending_analysis.frequency_assessment === 'optimal' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : insights.sending_analysis.frequency_assessment === 'under_mailing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }
                      `}>
                        {insights.sending_analysis.frequency_assessment.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Generate Insights</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                There was an error analyzing your data. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsModal;