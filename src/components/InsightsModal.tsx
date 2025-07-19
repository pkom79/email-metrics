import React from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Users, Mail, Target } from 'lucide-react';

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
  impact: string;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`
        w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl
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
              <h2 className="text-2xl font-bold">AI Performance Audit</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Actionable insights powered by AI analysis
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
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg font-medium">Analyzing your data...</span>
              </div>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Our AI is processing your email performance data
              </p>
            </div>
          ) : insights ? (
            <div className="p-6 space-y-8">
              {/* Overall Health Summary */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Overall Performance Health</h3>
                </div>
                <div className={`
                  p-4 rounded-lg border
                  ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                `}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-2xl font-bold capitalize ${getHealthColor(insights.summary.overall_health)}`}>
                      {insights.summary.overall_health.replace('_', ' ')}
                    </span>
                    {getTrendIcon(insights.trends.revenue)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(insights.summary.key_metrics).map(([key, value]) => (
                      <div key={key}>
                        <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {key.replace('_', ' ')}
                        </p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Actionable Recommendations */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Actionable Recommendations</h3>
                </div>
                <div className="space-y-4">
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