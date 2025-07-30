import React, { useState } from 'react';
import { Zap, Send, Users, Activity, CircleDollarSign, ClipboardCheck, ChevronDown } from 'lucide-react';
import { AIInsightsReport } from '../utils/aiInsights/types';

interface AIReportTemplateProps {
  isDarkMode: boolean;
  report?: AIInsightsReport;
  isLoading?: boolean;
}

const AIReportTemplate: React.FC<AIReportTemplateProps> = ({ isDarkMode, report, isLoading }) => {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const toggle = (catIdx: number, insIdx: number) => {
    const key = `${catIdx}-${insIdx}`;
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Map category titles to icons
  const categoryIcons: Record<string, JSX.Element> = {
    'Flow Insights': <Zap className="w-5 h-5 text-violet-500" />,
    'Campaign Insights': <Send className="w-5 h-5 text-violet-500" />,
    'Subscriber Insights': <Users className="w-5 h-5 text-violet-500" />,
    'List Health & Deliverability': <Activity className="w-5 h-5 text-violet-500" />,
    'Revenue & Performance Trends': <CircleDollarSign className="w-5 h-5 text-violet-500" />,
    'Segmentation & Timing': <ClipboardCheck className="w-5 h-5 text-violet-500" />
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl pt-5 pb-8 px-4 md:px-8 shadow-lg" style={isDarkMode ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Analyzing your email performance...</p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Show placeholder if no report
  if (!report) {
    return (
      <div className="rounded-2xl pt-5 pb-8 px-4 md:px-8 shadow-lg" style={isDarkMode ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }}>
        <div className="text-center py-12">
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No insights generated yet</p>
        </div>
      </div>
    );
  }

  const { executiveSummary, categories, topPriorities } = report;

  return (
    <div className="rounded-2xl pt-5 pb-8 px-4 md:px-8 shadow-lg" style={isDarkMode ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }}>
      {/* Report generated date at the top, centered */}
      <div className="flex justify-center mb-5">
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Report generated {dateString}</span>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <div className={`text-center text-xl font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Executive Summary</div>
        <div className={`text-center text-lg font-normal mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Your email account generated <span className="font-semibold text-purple-400">{executiveSummary.totalRevenue}</span> over the last <span className="font-semibold">{executiveSummary.dateRange}</span> with {executiveSummary.keyFindings.join(', ')}.
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center md:items-stretch">
          {executiveSummary.metrics.map((metric, i) => (
            <div
              key={i}
              className={`flex-1 min-w-[220px] max-w-xs rounded-2xl border ${isDarkMode ? 'bg-[#232b39] border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col items-center justify-center p-6 shadow`}
            >
              <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {metric.value}
              </div>
              <div className={`uppercase tracking-wide text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights by Category */}
      {categories.map((cat, catIdx) => (
        <div key={catIdx} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {categoryIcons[cat.title] || <Zap className="w-5 h-5 text-violet-500" />}
            <h3 className="text-xl font-semibold text-left">{cat.title}</h3>
          </div>
          <div className="space-y-6">
            {cat.insights.map((ins, insIdx) => (
              <div
                key={insIdx}
                className={`rounded-xl border ${isDarkMode ? 'bg-[#232b39] border-gray-700' : 'bg-white/80 border-gray-200'} shadow p-6 text-left`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-base">
                    {insIdx + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ins.title}</h4>
                    
                    {/* For significant findings - show the insight summary */}
                    {ins.summary !== 'No significant findings in this analysis' && (
                      <p className={`mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ins.summary}</p>
                    )}
                    
                    {/* For non-significant findings - show what was analyzed */}
                    {ins.summary === 'No significant findings in this analysis' && (
                      <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Analysis Completed:
                        </p>
                        <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {ins.actions && ins.actions.length > 0 
                            ? ins.actions[0].replace(/^\d+\.\s*/, '') 
                            : 'Comprehensive analysis completed showing consistent performance patterns.'
                          }
                        </p>
                      </div>
                    )}
                    
                    {ins.actions && ins.actions.length > 0 && (
                      <>
                        <button
                          onClick={() => toggle(catIdx, insIdx)}
                          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all border ${isDarkMode ? 'bg-purple-900/30 border-purple-800 text-purple-200 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}
                          aria-expanded={!!open[`${catIdx}-${insIdx}`]}
                        >
                          <span>{ins.summary === 'No significant findings in this analysis' ? 'Analysis Summary' : 'Show Me What to Do'}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${open[`${catIdx}-${insIdx}`] ? 'rotate-180' : ''}`} />
                        </button>
                        {open[`${catIdx}-${insIdx}`] && (
                          <div className={`mt-4 p-5 rounded-lg bg-gradient-to-br ${isDarkMode ? 'from-purple-900/40 to-purple-800/30 border border-purple-700/50' : 'from-purple-50 to-indigo-50 border border-purple-200/50'} text-left`}>
                            <div className={`font-semibold mb-3 text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {ins.summary === 'No significant findings in this analysis' ? 'What We Found:' : (ins.actionsTitle || 'Recommended Actions:')}
                            </div>
                            <ol className={`list-decimal list-outside pl-5 space-y-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {ins.actions.map((action, aidx) => {
                                // For non-significant findings, skip the first action since it's already shown above
                                if (ins.summary === 'No significant findings in this analysis' && aidx === 0) {
                                  return null;
                                }
                                return (
                                  <li key={aidx} className="leading-relaxed">
                                    {/* Remove leading numbers if AI already included them */}
                                    {action.replace(/^\d+\.\s*/, '')}
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Top 5 Priorities */}
      {topPriorities && topPriorities.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75l-6.172 3.245 1.179-6.873L2 9.755l6.908-1.004L12 2.5l3.092 6.251L22 9.755l-5.007 4.367 1.179 6.873z" />
              </svg>
            </span>
            <h3 className="text-xl font-semibold text-left">Top 5 Priorities</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {topPriorities.map((p, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 ${isDarkMode ? 'bg-[#232b39]' : 'bg-white'}`}>
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-base ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="font-medium text-left">{p.title}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-700'} text-left`}>{p.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportTemplate;
