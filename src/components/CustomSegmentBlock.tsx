import React, { useState } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import { ProcessedSubscriber } from '../utils/dataTypes';
import { SubscriberTransformer } from '../utils/transformers/subscriberTransformer';

interface CustomSegmentBlockProps {
    isDarkMode: boolean;
}

const CustomSegmentBlock: React.FC<CustomSegmentBlockProps> = ({ isDarkMode }) => {
    const [segmentSubscribers, setSegmentSubscribers] = useState<ProcessedSubscriber[]>([]);
    const [segmentName, setSegmentName] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Handle CSV upload and parse
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const transformer = new SubscriberTransformer();
                    const processed = transformer.transform(results.data as any);
                    setSegmentSubscribers(processed);
                    setSegmentName(file.name.replace(/\.csv$/i, ''));
                    setError('');
                } catch (err) {
                    setError('Failed to parse segment CSV. Please check the format.');
                }
            },
            error: () => setError('Failed to read CSV file.')
        });
    };

    // Metrics calculation
    const totalRevenue = segmentSubscribers.reduce((sum, sub) => sum + (sub.totalClv || 0), 0);
    const buyerCount = segmentSubscribers.filter(sub => sub.isBuyer).length;
    const revenuePerMember = segmentSubscribers.length > 0 ? totalRevenue / segmentSubscribers.length : 0;
    const aovPerBuyer = buyerCount > 0 ? totalRevenue / buyerCount : 0;

    // Engagement calculation
    const now = new Date();
    const engaged = (days: number) =>
        segmentSubscribers.filter(sub =>
            sub.lastActive &&
            typeof sub.lastActive !== 'string' &&
            (now.getTime() - sub.lastActive.getTime()) / (1000 * 60 * 60 * 24) <= days
        ).length;

    const percent = (count: number) =>
        segmentSubscribers.length > 0 ? (count / segmentSubscribers.length) * 100 : 0;

    return (
        <div className="mt-8">
            {/* Header - outside the container */}
            <div className="flex items-center gap-3 mb-4">
                <UploadCloud className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analyze Custom Segment</h2>
            </div>

            {/* Container - match other sections styling exactly */}
            <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl p-8 mb-8 hover:shadow-xl transition-all duration-200`}>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload a CSV file containing a custom segment of your audience. Instantly view key metrics like total revenue, members, engagement rates, and average order value for this segment. Use this tool to analyze targeted groups, campaign results, or high-value lists—without affecting your main dashboard data.</p>
            <input
                type="file"
                accept=".csv"
                className="mb-4 block"
                onChange={handleFileUpload}
            />
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {segmentSubscribers.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{segmentName}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                            </div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</p>
                        </div>
                        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                            <div className="flex items-center gap-3 mb-2">
                                <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Members</p>
                            </div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{segmentSubscribers.length.toLocaleString()}</p>
                        </div>
                        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>AOV per Buyer</p>
                            </div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{aovPerBuyer.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</p>
                        </div>
                        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue per Member</p>
                            </div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{revenuePerMember.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[30, 90, 120, 180].map(days => {
                            const count = engaged(days);
                            return (
                                <div key={days} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Engaged in {days} days</p>
                                    </div>
                                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{count.toLocaleString()} ({percent(count).toFixed(1)}%)</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default CustomSegmentBlock;
