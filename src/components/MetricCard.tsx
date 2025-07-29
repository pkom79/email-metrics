import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import Sparkline from './Sparkline';
import { getBenchmarkStatus, parseMetricValue } from '../utils/benchmarks';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  isPositive: boolean;
  isDarkMode: boolean;
  dateRange: string;
  isNegativeMetric?: boolean;
  metricKey?: string;
  sparklineData?: { value: number; date: string }[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive,
  isDarkMode,
  dateRange,
  isNegativeMetric = false,
  metricKey,
  sparklineData = []
}) => {
  // If All Time is selected, show purple (no comparison available)
  const isAllTime = dateRange === 'all';

  // For negative metrics, reverse the color logic (higher = bad, lower = good)
  const shouldShowAsPositive = isNegativeMetric ? !isPositive : isPositive;

  // Get benchmark status if metricKey is provided
  const benchmarkResult = metricKey ? getBenchmarkStatus(metricKey, parseMetricValue(value)) : null;

  // Determine value format for sparkline tooltips
  const getValueFormat = () => {
    if (!metricKey) return 'number';
    if (['revenue', 'avgOrderValue', 'revenuePerEmail'].includes(metricKey)) return 'currency';
    if (['openRate', 'clickRate', 'clickToOpenRate', 'conversionRate', 'unsubscribeRate', 'spamRate', 'bounceRate'].includes(metricKey)) return 'percentage';
    return 'number';
  };

  // Granularity rules for sparkline
  const getGranularityForDateRange = (dateRange: string, allTimeDays?: number) => {
    if (dateRange === 'all') {
      if (allTimeDays && allTimeDays > 365) return 'monthly';
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

  // If you fetch sparklineData here, apply granularity logic before passing to Sparkline
  // If sparklineData is already processed, ensure upstream logic uses these rules

  return (
    <div className={`
      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
      border rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className={`text-sm font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {title}
          </p>
          {benchmarkResult && (
            <div className="flex items-center mt-1 gap-1">
              <div
                className={`w-2 h-2 rounded-full ${benchmarkResult.status === 'good' ? 'bg-green-500' :
                    benchmarkResult.status === 'ok' ? 'bg-blue-500' :
                      benchmarkResult.status === 'attention' ? 'bg-yellow-500' :
                        'bg-red-500'
                  }`}
              />
              <span className={`text-xs font-medium ${benchmarkResult.color}`}>
                {benchmarkResult.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <Sparkline
        isPositive={shouldShowAsPositive}
        isDarkMode={isDarkMode}
        change={change}
        isAllTime={isAllTime}
        isNegativeMetric={isNegativeMetric}
        data={sparklineData}
        valueFormat={getValueFormat()}
      />

      <div className="flex items-end justify-between">
        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        {!isAllTime && (
          <div className={`flex items-center text-sm font-medium ${shouldShowAsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
            {(shouldShowAsPositive && !isNegativeMetric) || (!shouldShowAsPositive && isNegativeMetric) ? (
              <ArrowUp className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;