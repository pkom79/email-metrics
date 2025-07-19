import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { ProcessedCampaign, getCampaignPerformanceByDayOfWeek } from '../utils/mockDataGenerator';

interface DayOfWeekPerformanceProps {
  filteredCampaigns: ProcessedCampaign[];
  isDarkMode: boolean;
  dateRange: string;
}

const DayOfWeekPerformance: React.FC<DayOfWeekPerformanceProps> = ({
  filteredCampaigns,
  isDarkMode,
  dateRange
}) => {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [hoveredBar, setHoveredBar] = useState<{ day: string; value: number; campaignCount: number } | null>(null);

  const metricOptions = [
    { value: 'revenue', label: 'Total Revenue' },
    { value: 'avgOrderValue', label: 'Average Order Value' },
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

  const dayOfWeekData = useMemo(() => {
    return getCampaignPerformanceByDayOfWeek(filteredCampaigns, selectedMetric);
  }, [filteredCampaigns, selectedMetric]);

  const formatMetricValue = (value: number, metric: string): string => {
    if (['revenue', 'avgOrderValue', 'revenuePerEmail'].includes(metric)) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (['openRate', 'clickRate', 'clickToOpenRate', 'conversionRate', 'unsubscribeRate', 'spamRate', 'bounceRate'].includes(metric)) {
      return value < 0.01 && value > 0
        ? `${value.toFixed(3)}%`
        : `${value.toFixed(2)}%`;
    } else {
      return value.toLocaleString('en-US');
    }
  };

  const maxValue = Math.max(...dayOfWeekData.map(d => d.value));
  const chartHeight = 200;
  const chartWidth = 560;
  const barWidth = 60;
  const barSpacing = 20;
  const startX = 40;

  return (
    <div className={`
      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
      border rounded-lg p-6 hover:shadow-lg transition-all duration-200
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Campaign Performance by Day of Week
          </h3>
        </div>
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

      {/* Chart Container */}
      <div className="relative">
        <svg 
          width={chartWidth} 
          height={chartHeight + 60} 
          className="w-full"
          onMouseLeave={() => setHoveredBar(null)}
        >
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * chartHeight) + 10;
            const value = maxValue * ratio;
            return (
              <g key={index}>
                <line
                  x1={startX - 5}
                  y1={y}
                  x2={startX}
                  y2={y}
                  stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
                  strokeWidth={1}
                />
                <text
                  x={startX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className={`text-xs ${isDarkMode ? 'fill-gray-400' : 'fill-gray-500'}`}
                >
                  {formatMetricValue(value, selectedMetric)}
                </text>
                {ratio > 0 && (
                  <line
                    x1={startX}
                    y1={y}
                    x2={chartWidth - 20}
                    y2={y}
                    stroke={isDarkMode ? '#374151' : '#f3f4f6'}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                )}
              </g>
            );
          })}

          {/* Bars */}
          {dayOfWeekData.map((data, index) => {
            const x = startX + (index * (barWidth + barSpacing));
            const barHeight = maxValue > 0 ? (data.value / maxValue) * chartHeight : 0;
            const y = chartHeight - barHeight + 10;
            
            return (
              <g key={data.day}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)} // Minimum height for zero values
                  fill={data.campaignCount === 0 ? (isDarkMode ? '#374151' : '#e5e7eb') : 'url(#barGradient)'}
                  className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                  onMouseEnter={() => setHoveredBar({
                    day: data.day,
                    value: data.value,
                    campaignCount: data.campaignCount
                  })}
                />
                
                {/* X-axis labels */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 30}
                  textAnchor="middle"
                  className={`text-sm font-medium ${isDarkMode ? 'fill-gray-300' : 'fill-gray-700'}`}
                >
                  {data.day}
                </text>
              </g>
            );
          })}

          {/* Y-axis line */}
          <line
            x1={startX}
            y1={10}
            x2={startX}
            y2={chartHeight + 10}
            stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth={2}
          />

          {/* X-axis line */}
          <line
            x1={startX}
            y1={chartHeight + 10}
            x2={chartWidth - 20}
            y2={chartHeight + 10}
            stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth={2}
          />
        </svg>

        {/* Tooltip */}
        {hoveredBar && (
          <div className={`
            absolute z-10 p-3 rounded-lg shadow-lg border text-sm pointer-events-none
            ${isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
            }
            transform -translate-x-1/2 -translate-y-full
          `}
          style={{
            left: `${((dayOfWeekData.findIndex(d => d.day === hoveredBar.day) * (barWidth + barSpacing)) + startX + barWidth / 2) / chartWidth * 100}%`,
            top: '10px'
          }}>
            <div className="font-semibold mb-1">{hoveredBar.day}</div>
            <div className="text-green-600 dark:text-green-400 font-medium">
              {formatMetricValue(hoveredBar.value, selectedMetric)}
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {hoveredBar.campaignCount === 0 
                ? 'No campaigns sent'
                : `${hoveredBar.campaignCount} campaign${hoveredBar.campaignCount !== 1 ? 's' : ''} sent`
              }
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Campaigns</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {dayOfWeekData.reduce((sum, d) => sum + d.campaignCount, 0)}
            </p>
          </div>
          <div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best Day</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {(() => {
                const best = dayOfWeekData.reduce((max, d) => d.value > max.value ? d : max);
                return best.value > 0 ? best.day : 'N/A';
              })()}
            </p>
          </div>
          <div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Peak Value</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatMetricValue(maxValue, selectedMetric)}
            </p>
          </div>
          <div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date Range</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {dateRange === 'all' ? 'All Time' : dateRange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayOfWeekPerformance;