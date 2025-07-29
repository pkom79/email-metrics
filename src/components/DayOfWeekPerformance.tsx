import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { ProcessedCampaign } from '../utils/dataTypes';
import { DataManager } from '../utils/dataManager';

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

  // Get data from DataManager
  const dataManager = DataManager.getInstance();
  const getCampaignPerformanceByDayOfWeek = (campaigns: ProcessedCampaign[], metricKey: string) =>
    dataManager.getCampaignPerformanceByDayOfWeek(campaigns, metricKey);

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
  const chartHeight = 320;
  const barHeight = 30;
  const barSpacing = 10;
  const startY = 40;
  const labelWidth = 50;

  // Color schemes for different metric types
  const getColorScheme = (metric: string) => {
    const colorSchemes = {
      revenue: { primary: '#8b5cf6', secondary: '#a78bfa', light: '#c4b5fd' }, // Purple
      avgOrderValue: { primary: '#06b6d4', secondary: '#67e8f9', light: '#a7f3d0' }, // Cyan
      revenuePerEmail: { primary: '#10b981', secondary: '#34d399', light: '#6ee7b7' }, // Emerald
      openRate: { primary: '#f59e0b', secondary: '#fbbf24', light: '#fde047' }, // Amber
      clickRate: { primary: '#ef4444', secondary: '#f87171', light: '#fca5a5' }, // Red
      clickToOpenRate: { primary: '#8b5cf6', secondary: '#a78bfa', light: '#c4b5fd' }, // Purple
      emailsSent: { primary: '#3b82f6', secondary: '#60a5fa', light: '#93c5fd' }, // Blue
      totalOrders: { primary: '#10b981', secondary: '#34d399', light: '#6ee7b7' }, // Emerald
      conversionRate: { primary: '#f97316', secondary: '#fb923c', light: '#fdba74' }, // Orange
      unsubscribeRate: { primary: '#ef4444', secondary: '#f87171', light: '#fca5a5' }, // Red
      spamRate: { primary: '#dc2626', secondary: '#ef4444', light: '#f87171' }, // Red (darker)
      bounceRate: { primary: '#991b1b', secondary: '#dc2626', light: '#ef4444' } // Red (darkest)
    };

    return colorSchemes[metric as keyof typeof colorSchemes] || colorSchemes.revenue;
  };

  const currentColorScheme = getColorScheme(selectedMetric);

  return (
    <div>
      {/* Header - Outside the box */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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

      {/* Chart Container - Inside the box */}
      <div className={`
        ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
        border rounded-lg p-6 hover:shadow-lg transition-all duration-200
      `}>
        {/* Chart Container */}
        <div className="relative w-full">
          <svg
            width="100%"
            height={chartHeight + 60}
            stopColor={currentColorScheme.primary}
            viewBox={`0 0 800 ${chartHeight + 60}`}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <defs>
              <linearGradient id={`barGradient-${selectedMetric}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor={currentColorScheme.primary}
                  stopOpacity={0.9}
                />
                <stop
                  offset="50%"
                  stopColor={currentColorScheme.secondary}
                  stopOpacity={0.9}
                />
                <stop
                  offset="100%"
                  stopColor={currentColorScheme.light}
                  stopOpacity={0.7}
                />
              </linearGradient>

              {/* Drop shadow filter */}
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* X-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const x = labelWidth + (ratio * (800 - labelWidth - 40));
              const value = maxValue * ratio;
              return (
                <g key={index}>
                  {/* Tick marks */}
                  <line
                    x1={x}
                    y1={chartHeight + 15}
                    x2={x}
                    y2={chartHeight + 20}
                    stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
                    strokeWidth={1}
                  />
                  {/* Labels */}
                  <text
                    x={x}
                    y={chartHeight + 35}
                    textAnchor="middle"
                    className={`text-xs ${isDarkMode ? 'fill-gray-400' : 'fill-gray-500'}`}
                  >
                    {formatMetricValue(value, selectedMetric)}
                  </text>
                  {/* Grid lines */}
                  {ratio > 0 && (
                    <line
                      x1={x}
                      y1={startY}
                      x2={x}
                      y2={chartHeight + 15}
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
              const y = startY + (index * (barHeight + barSpacing));
              const barWidth = maxValue > 0 ? (data.value / maxValue) * (800 - labelWidth - 60) : 0;
              const x = labelWidth;

              return (
                <g key={data.day}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(barWidth, 2)} // Minimum width for zero values
                    height={barHeight}
                    fill={data.campaignCount === 0 ? (isDarkMode ? '#374151' : '#e5e7eb') : `url(#barGradient-${selectedMetric})`}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    filter={data.campaignCount > 0 ? "url(#dropShadow)" : "none"}
                    rx="4"
                    ry="4"
                    onMouseEnter={() => setHoveredBar({
                      day: data.day,
                      value: data.value,
                      campaignCount: data.campaignCount
                    })}
                  />

                  {/* Y-axis labels (day names) */}
                  <text
                    x={labelWidth - 10}
                    y={y + barHeight / 2 + 4}
                    textAnchor="end"
                    className={`text-sm font-medium ${isDarkMode ? 'fill-gray-300' : 'fill-gray-700'}`}
                  >
                    {data.day}
                  </text>
                </g>
              );
            })}

            {/* Y-axis line (vertical) */}
            <line
              x1={labelWidth}
              y1={startY}
              x2={labelWidth}
              y2={chartHeight + 15}
              stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
              strokeWidth={2}
            />

            {/* X-axis line (horizontal) */}
            <line
              x1={labelWidth}
              y1={chartHeight + 15}
              x2={800 - 40}
              y2={chartHeight + 15}
              stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
              strokeWidth={2}
            />
          </svg>

          {/* Tooltip */}
          {hoveredBar && (
            <div className={`
              absolute z-10 p-3 rounded-lg shadow-xl border text-sm pointer-events-none backdrop-blur-sm
              ${isDarkMode
                ? 'bg-gray-800/95 border-gray-600 text-white'
                : 'bg-white/95 border-gray-200 text-gray-900'
              }
              transform -translate-x-1/2 -translate-y-full
            `}
              style={{
                left: `${(labelWidth + (hoveredBar.value / maxValue) * (800 - labelWidth - 60) / 2) / 8}%`,
                top: `${startY + (dayOfWeekData.findIndex(d => d.day === hoveredBar.day) * (barHeight + barSpacing)) + barHeight / 2 - 20}px`
              }}>
              <div className="font-semibold mb-1">{hoveredBar.day}</div>
              <div className="font-medium" style={{ color: currentColorScheme.primary }}>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Campaigns</p>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dayOfWeekData.reduce((sum, d) => sum + d.campaignCount, 0)}
              </p>
            </div>
            <div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best Day</p>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {(() => {
                  const best = dayOfWeekData.reduce((max, d) => d.value > max.value ? d : max);
                  return best.value > 0 ? best.day : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Peak Value</p>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatMetricValue(maxValue, selectedMetric)}
              </p>
            </div>
            <div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date Range</p>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dateRange === 'all' ? 'All Time' : dateRange}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayOfWeekPerformance;