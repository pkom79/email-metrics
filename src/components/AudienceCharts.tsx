import React from 'react';
import { Users, ShoppingBag, TrendingUp } from 'lucide-react';

interface AudienceChartsProps {
  isDarkMode: boolean;
}

const AudienceCharts: React.FC<AudienceChartsProps> = ({ isDarkMode }) => {
  // Mock audience data
  const audienceData = {
    totalSubscribers: 45678,
    buyers: { count: 12890, percentage: 28.2 },
    nonBuyers: { count: 32788, percentage: 71.8 },
    avgClv: 156.78,
    avgClvBuyers: 298.45,
    avgOrdersPerBuyer: 2.4,
    lifetimeData: [
      { range: '0-3 months', count: 15234 },
      { range: '3-6 months', count: 12456 },
      { range: '6-12 months', count: 8976 },
      { range: '1-2 years', count: 5634 },
      { range: '2+ years', count: 3378 }
    ],
    purchaseFrequency: [
      { orders: 'Never', count: 32788 },
      { orders: '1 order', count: 7890 },
      { orders: '2 orders', count: 3456 },
      { orders: '3-5 orders', count: 1234 },
      { orders: '6+ orders', count: 310 }
    ],
    highValueSegments: [
      { tier: '2x AOV ($180+)', count: 1245, revenue: 67890, percentage: 27.6 },
      { tier: '3x AOV ($270+)', count: 567, revenue: 45123, percentage: 18.4 },
      { tier: '5x AOV ($450+)', count: 123, revenue: 23456, percentage: 9.5 }
    ]
  };

  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
      <div 
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  return (
    <section>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Audience Overview
      </h2>
      
      {/* Primary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            <p className={`text-sm font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Subscribers
            </p>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceData.totalSubscribers.toLocaleString()}
          </p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="flex items-center mb-2">
            <ShoppingBag className="w-5 h-5 text-green-600 mr-2" />
            <p className={`text-sm font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Buyers
            </p>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceData.buyers.count.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {audienceData.buyers.percentage}% of total
          </p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 text-gray-600 mr-2" />
            <p className={`text-sm font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Non-Buyers
            </p>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceData.nonBuyers.count.toLocaleString()}
          </p>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {audienceData.nonBuyers.percentage}% of total
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Average CLV (All)</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ${audienceData.avgClv.toFixed(2)}
          </p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Average CLV (Buyers)</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ${audienceData.avgClvBuyers.toFixed(2)}
          </p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Avg Orders per Buyer</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {audienceData.avgOrdersPerBuyer.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subscriber Lifetime Chart */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Subscriber Lifetime Distribution
          </h3>
          <div className="space-y-3">
            {audienceData.lifetimeData.map((item, index) => {
              const percentage = (item.count / audienceData.totalSubscribers) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{item.range}</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{item.count.toLocaleString()}</span>
                  </div>
                  <ProgressBar percentage={percentage} color="bg-gradient-to-r from-purple-400 to-purple-600" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Purchase Frequency Chart */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Purchase Frequency Distribution
          </h3>
          <div className="space-y-3">
            {audienceData.purchaseFrequency.map((item, index) => {
              const percentage = (item.count / audienceData.totalSubscribers) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{item.orders}</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{item.count.toLocaleString()}</span>
                  </div>
                  <ProgressBar percentage={percentage} color="bg-gradient-to-r from-green-400 to-green-600" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Value Customer Segments */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            High-Value Customer Segments
          </h3>
        </div>
        <div className="space-y-4">
          {audienceData.highValueSegments.map((segment, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{segment.tier}</span>
                <div className="text-right">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {segment.count} customers • ${segment.revenue.toLocaleString()} revenue
                  </div>
                </div>
              </div>
              <ProgressBar percentage={segment.percentage} color="bg-gradient-to-r from-purple-500 to-purple-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceCharts;