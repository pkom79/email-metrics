import React from 'react';
import { Users, UserCheck, DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { DataManager } from '../utils/dataManager';

interface AudienceChartsProps {
  isDarkMode: boolean;
}

const AudienceCharts: React.FC<AudienceChartsProps> = ({ isDarkMode }) => {
  // Get data from DataManager
  const dataManager = DataManager.getInstance();
  const audienceInsights = dataManager.getAudienceInsights();
  const subscribers = dataManager.getSubscribers();

  // Check if we have subscriber data
  const hasData = subscribers.length > 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate purchase frequency data for chart
  const purchaseFrequencyData = [
    { label: 'Never', value: audienceInsights.purchaseFrequency.never, percentage: (audienceInsights.purchaseFrequency.never / audienceInsights.totalSubscribers) * 100 },
    { label: '1 Order', value: audienceInsights.purchaseFrequency.oneOrder, percentage: (audienceInsights.purchaseFrequency.oneOrder / audienceInsights.totalSubscribers) * 100 },
    { label: '2 Orders', value: audienceInsights.purchaseFrequency.twoOrders, percentage: (audienceInsights.purchaseFrequency.twoOrders / audienceInsights.totalSubscribers) * 100 },
    { label: '3-5 Orders', value: audienceInsights.purchaseFrequency.threeTo5, percentage: (audienceInsights.purchaseFrequency.threeTo5 / audienceInsights.totalSubscribers) * 100 },
    { label: '6+ Orders', value: audienceInsights.purchaseFrequency.sixPlus, percentage: (audienceInsights.purchaseFrequency.sixPlus / audienceInsights.totalSubscribers) * 100 }
  ];

  // Calculate lifetime distribution data for chart
  const lifetimeData = [
    { label: '0-3 months', value: audienceInsights.lifetimeDistribution.zeroTo3Months, percentage: (audienceInsights.lifetimeDistribution.zeroTo3Months / audienceInsights.totalSubscribers) * 100 },
    { label: '3-6 months', value: audienceInsights.lifetimeDistribution.threeTo6Months, percentage: (audienceInsights.lifetimeDistribution.threeTo6Months / audienceInsights.totalSubscribers) * 100 },
    { label: '6-12 months', value: audienceInsights.lifetimeDistribution.sixTo12Months, percentage: (audienceInsights.lifetimeDistribution.sixTo12Months / audienceInsights.totalSubscribers) * 100 },
    { label: '1-2 years', value: audienceInsights.lifetimeDistribution.oneToTwoYears, percentage: (audienceInsights.lifetimeDistribution.oneToTwoYears / audienceInsights.totalSubscribers) * 100 },
    { label: '2+ years', value: audienceInsights.lifetimeDistribution.twoYearsPlus, percentage: (audienceInsights.lifetimeDistribution.twoYearsPlus / audienceInsights.totalSubscribers) * 100 }
  ];

  // Calculate high-value customer segments
  const highValueSegments = React.useMemo(() => {
    if (!hasData) return [];

    const avgOrderValue = audienceInsights.avgClvBuyers;

    // Define segments based on multiples of AOV - dynamically calculated
    const segments = [
      {
        label: `2x AOV (${formatCurrency(avgOrderValue * 2)}+)`,
        threshold: avgOrderValue * 2,
        customers: 0,
        revenue: 0,
        revenuePercentage: 0
      },
      {
        label: `3x AOV (${formatCurrency(avgOrderValue * 3)}+)`,
        threshold: avgOrderValue * 3,
        customers: 0,
        revenue: 0,
        revenuePercentage: 0
      },
      {
        label: `5x AOV (${formatCurrency(avgOrderValue * 5)}+)`,
        threshold: avgOrderValue * 5,
        customers: 0,
        revenue: 0,
        revenuePercentage: 0
      }
    ];

    // Calculate total revenue from all buyers
    let totalBuyerRevenue = 0;
    subscribers.forEach(sub => {
      if (sub.isBuyer && sub.totalClv > 0) {
        totalBuyerRevenue += sub.totalClv;
      }
    });

    // Count customers and revenue for each segment
    subscribers.forEach(sub => {
      if (sub.isBuyer && sub.totalClv > 0) {
        segments.forEach(segment => {
          if (sub.totalClv >= segment.threshold) {
            segment.customers++;
            segment.revenue += sub.totalClv;
          }
        });
      }
    });

    // Calculate revenue percentage for each segment
    segments.forEach(segment => {
      segment.revenuePercentage = totalBuyerRevenue > 0 ? (segment.revenue / totalBuyerRevenue) * 100 : 0;
    });

    return segments;
  }, [subscribers, hasData, audienceInsights.avgClvBuyers, formatCurrency]);

  // If no data, show empty state
  if (!hasData) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Users className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Audience Overview
          </h2>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-8 text-center hover:shadow-xl transition-all duration-200`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No subscriber data available. Upload your subscriber reports to see audience insights.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Users className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Audience Overview
        </h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-3 mb-2">
            <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Subscribers</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceInsights.totalSubscribers.toLocaleString()}
          </p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Buyers</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceInsights.buyerCount.toLocaleString()}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {formatPercent(audienceInsights.buyerPercentage)} of total
          </p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg CLV (All)</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(audienceInsights.avgClvAll)}
          </p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg CLV (Buyers)</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(audienceInsights.avgClvBuyers)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Frequency Distribution */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Purchase Frequency Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {purchaseFrequencyData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.value.toLocaleString()} ({formatPercent(item.percentage)})
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriber Lifetime Distribution */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Subscriber Lifetime
            </h3>
          </div>
          <div className="space-y-3">
            {lifetimeData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.value.toLocaleString()} ({formatPercent(item.percentage)})
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Value Customer Segments */}
      <div className={`mt-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            High-Value Customer Segments
          </h3>
        </div>
        <div className="space-y-3">
          {highValueSegments.map((segment) => {
            return (
              <div key={segment.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {segment.label}
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {segment.customers.toLocaleString()} customers • {formatCurrency(segment.revenue)} revenue
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${segment.revenuePercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscriber Last Active Segments */}
      <div className={`mt-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 hover:shadow-xl transition-all duration-200`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Last Active Segments
          </h3>
        </div>
        <div className="space-y-3">
          {(() => {
            // Calculate segments based on lastActive date (inactive for X days or more)
            const lastEmailDate = dataManager.getLastEmailDate();
            const totalSubscribers = subscribers.length;
            // Never Active: lastActive is missing/null/empty
            const neverActiveCount = subscribers.filter(sub => {
              // Handles null, undefined, empty string, whitespace, invalid date string, and invalid Date objects
              if (sub.lastActive === null || sub.lastActive === undefined) return true;
              if (typeof sub.lastActive === 'string') {
                const lastActiveStr = String(sub.lastActive);
                const trimmed = lastActiveStr.trim();
                if (trimmed === '' || trimmed.toLowerCase() === 'invalid date') return true;
                // Try to parse as date
                const parsedDate = new Date(trimmed);
                if (isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) return true;
                return false;
              }
              if (sub.lastActive instanceof Date) {
                const time = sub.lastActive.getTime();
                if (isNaN(time) || time === 0) return true;
                return false;
              }
              return true; // fallback: treat as never active if type is unexpected
            }).length;
            const segments = [
              { label: 'Never Active', count: neverActiveCount },
              { label: 'Inactive for 90+ days', days: 90, count: 0 },
              { label: 'Inactive for 120+ days', days: 120, count: 0 },
              { label: 'Inactive for 180+ days', days: 180, count: 0 },
              { label: 'Inactive for 365+ days', days: 365, count: 0 }
            ];
            subscribers.forEach(sub => {
              if (sub.lastActive && lastEmailDate) {
                const diffDays = Math.floor((lastEmailDate.getTime() - sub.lastActive.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 90) segments[1].count++;
                if (diffDays >= 120) segments[2].count++;
                if (diffDays >= 180) segments[3].count++;
                if (diffDays >= 365) segments[4].count++;
              }
            });
            return segments.map(segment => {
              const percent = totalSubscribers > 0 ? (segment.count / totalSubscribers) * 100 : 0;
              return (
                <div key={segment.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{segment.label}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{segment.count.toLocaleString()} ({formatPercent(percent)})</span>
                  </div>
                  <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </section>
  );
};

export default AudienceCharts;