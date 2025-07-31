import React, { useState } from 'react';
import { Zap, Send, Users, Activity, CircleDollarSign, ClipboardCheck, ChevronDown } from 'lucide-react';
import { AIInsightsReport, EnhancedAnalysis } from '../utils/aiInsights/types';

interface AIReportTemplateProps {
  isDarkMode: boolean;
  report?: AIInsightsReport;
  enhancedAnalysis?: EnhancedAnalysis;
  isLoading?: boolean;
}

const AIReportTemplate: React.FC<AIReportTemplateProps> = ({ isDarkMode, report, enhancedAnalysis, isLoading }) => {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Use enhanced analysis from prop or from report
  const actualEnhancedAnalysis = enhancedAnalysis || report?.enhancedAnalysis;

  const toggle = (catIdx: number, insIdx: number) => {
    const key = `${catIdx}-${insIdx}`;
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };  // Map category titles to icons
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

      {/* Enhanced Analysis Section */}
      {actualEnhancedAnalysis && (
        <div className="mb-10">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-xl shadow-lg mb-6">
            <h3 className="text-xl font-bold mb-4">🧠 AI Enhanced Analysis</h3>
            <p className="text-purple-100">Advanced insights powered by AI analysis of your email performance patterns</p>
          </div>
          
          {actualEnhancedAnalysis.strategicSynthesis && (
            <div className={`p-6 rounded-xl border-2 ${isDarkMode ? 'bg-gray-800 border-purple-800' : 'bg-white border-purple-200'} shadow-lg mb-6`}>
              <h4 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                🎯 Strategic Recommendations
              </h4>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <h5 className={`font-semibold mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>💎 Biggest Opportunity</h5>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {actualEnhancedAnalysis.strategicSynthesis.biggestOpportunity}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <h5 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>⚠️ Primary Risk</h5>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {actualEnhancedAnalysis.strategicSynthesis.primaryRisk}
                  </p>
                </div>
              </div>
              
              {actualEnhancedAnalysis.strategicSynthesis.prioritizedActions.length > 0 && (
                <div>
                  <h5 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📋 Prioritized Actions</h5>
                  <div className="space-y-3">
                    {actualEnhancedAnalysis.strategicSynthesis.prioritizedActions.map((action, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{action.action}</p>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className={`${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                💰 {action.expectedROI}
                              </span>
                              <span className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                ⏱️ {action.timeframe}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            action.effort === 'low' ? 'bg-green-100 text-green-800' :
                            action.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {action.effort}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {actualEnhancedAnalysis.customDiscoveries.length > 0 && (
            <div className={`p-6 rounded-xl border-2 ${isDarkMode ? 'bg-gray-800 border-yellow-800' : 'bg-white border-yellow-200'} shadow-lg mb-6`}>
              <h4 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                🔍 Custom Discoveries
              </h4>
              <div className="space-y-4">
                {actualEnhancedAnalysis.customDiscoveries.map((discovery, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {discovery.title}
                      </h5>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
                        ${discovery.estimatedValue.toLocaleString()}
                      </div>
                    </div>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {discovery.finding}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <strong>Evidence:</strong> {discovery.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
      {topPriorities && topPriorities.length > 0 && topPriorities.some(p => p && p.estimatedImpact) && (
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
            {topPriorities.filter(p => p && p.estimatedImpact).map((p, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 ${isDarkMode ? 'bg-[#232b39]' : 'bg-white'}`}>
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-base ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="font-medium text-left">
                    {p.insight?.summary || 
                     (p.insight?.insightId ? p.insight.insightId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : null) || 
                     p.estimatedImpact}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-700'} text-left`}>{p.estimatedImpact}</div>
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
